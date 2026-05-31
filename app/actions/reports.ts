"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getTransactions() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const transactions = await db.transaction.findMany({
    include: {
      account: true
    },
    orderBy: {
      date: "desc"
    },
    take: 100
  });

  const receiptIds = transactions.filter(t => t.refType === "RECEIPT").map(t => t.refId);
  const paymentIds = transactions.filter(t => t.refType === "PAYMENT").map(t => t.refId);
  const contraIds = transactions.filter(t => t.refType === "CONTRA").map(t => t.refId);
  const journalIds = transactions.filter(t => t.refType === "JOURNAL").map(t => t.refId);

  const [receipts, payments, contras, journals] = await Promise.all([
    receiptIds.length ? db.receipt.findMany({ where: { id: { in: receiptIds } }, select: { id: true, narration: true } }) : Promise.resolve([]),
    paymentIds.length ? db.payment.findMany({ where: { id: { in: paymentIds } }, select: { id: true, narration: true } }) : Promise.resolve([]),
    contraIds.length ? db.contraEntry.findMany({ where: { id: { in: contraIds } }, select: { id: true, narration: true } }) : Promise.resolve([]),
    journalIds.length ? db.journalVoucher.findMany({ where: { id: { in: journalIds } }, select: { id: true, narration: true } }) : Promise.resolve([])
  ]);

  const narrationMap = new Map();
  receipts.forEach(r => narrationMap.set(r.id, r.narration));
  payments.forEach(p => narrationMap.set(p.id, p.narration));
  contras.forEach(c => narrationMap.set(c.id, c.narration));
  journals.forEach(j => narrationMap.set(j.id, j.narration));

  return transactions.map(tx => ({
    ...tx,
    narration: narrationMap.get(tx.refId) || "-"
  }));
}

export async function getAccountBalances() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const [accounts, totals] = await Promise.all([
    db.account.findMany({
      orderBy: { type: "asc" },
    }),
    db.transaction.groupBy({
      by: ["accountId"],
      _sum: { debit: true, credit: true },
    }),
  ]);

  const totalsMap = new Map(
    totals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );

  return accounts.map((acc) => {
    const t = totalsMap.get(acc.id) || { debit: 0, credit: 0 };

    // Assets (Cash/Bank) and Expenses: Balance = Debit - Credit
    // Income and Liabilities: Balance = Credit - Debit
    const isAssetOrExpense = ["CASH", "BANK", "ASSET", "EXPENSE"].includes(acc.type);
    const balance = isAssetOrExpense ? (t.debit - t.credit) : (t.credit - t.debit);

    return {
      ...acc,
      balance,
    };
  });
}

export async function getMonthlyOverview() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: sixMonthsAgo },
    },
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const overviewMap: Record<string, { name: string; total: number; expense: number }> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = months[d.getMonth()];
    overviewMap[monthName] = { name: monthName, total: 0, expense: 0 };
  }

  transactions.forEach((tx: any) => {
    const m = months[new Date(tx.date).getMonth()];
    if (overviewMap[m]) {
      // For NPO overview, we usually track Receipts (Credit to Income) and Payments (Debit to Expense)
      // Here we simplify: Credit is Income/Asset increase, Debit is Expense/Asset decrease
      if (tx.credit > 0) {
        overviewMap[m].total += tx.credit;
      } else if (tx.debit > 0) {
        overviewMap[m].expense += tx.debit;
      }
    }
  });

  return Object.values(overviewMap).reverse();
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [receiptsTotal, paymentsTotal, cashStats, bankStats, cashReceipts, cashPayments] = await Promise.all([
    db.receipt.aggregate({
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      _sum: { amount: true }
    }),
    db.transaction.aggregate({
      where: { account: { type: "CASH" } },
      _sum: { debit: true, credit: true }
    }),
    db.transaction.aggregate({
      where: { account: { type: "BANK" } },
      _sum: { debit: true, credit: true }
    }),
    db.receipt.aggregate({
      where: { paymentMode: "Cash" },
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      where: { paymentMode: "Cash" },
      _sum: { amount: true }
    })
  ]);

  const cashInHand = (cashStats._sum.debit || 0) - (cashStats._sum.credit || 0);
  const bankBalance = (bankStats._sum.debit || 0) - (bankStats._sum.credit || 0);
  const totalCashReceived = cashReceipts._sum.amount || 0;
  const totalCashPaid = cashPayments._sum.amount || 0;
  const cashBalance = cashInHand;

  return {
    totalReceipts: receiptsTotal._sum.amount || 0,
    totalPayments: paymentsTotal._sum.amount || 0,
    cashInHand,
    bankBalance,
    totalCashReceived,
    totalCashPaid,
    cashBalance,
  };
}

export interface ReceiptPaymentFilter {
  startDate?: string;
  endDate?: string;
  type?: "RECEIPT" | "PAYMENT" | "ALL";
}

export async function getReceiptPaymentReport(filters: ReceiptPaymentFilter = {}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { startDate, endDate, type } = filters;

  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    whereClause.date = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    whereClause.date = {
      lte: new Date(endDate),
    };
  }

  const [receipts, payments] = await Promise.all([
    type === "PAYMENT" ? Promise.resolve([]) : db.receipt.findMany({
      where: whereClause,
      include: {
        donor: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
    type === "RECEIPT" ? Promise.resolve([]) : db.payment.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  const receiptData = receipts.map((r) => ({
    id: r.id,
    date: r.date,
    voucherNo: r.receiptNo,
    type: "RECEIPT",
    partyName: r.donor?.name || "-",
    category: r.category || r.type,
    amount: r.amount,
    paymentMode: r.paymentMode,
    narration: r.narration || "-",
    status: "COMPLETED",
  }));

  const paymentData = payments.map((p) => ({
    id: p.id,
    date: p.date,
    voucherNo: p.voucherNo,
    type: "PAYMENT",
    partyName: "-",
    category: p.category || p.type,
    amount: p.amount,
    paymentMode: p.paymentMode,
    narration: p.narration || "-",
    status: p.status,
  }));

  const combinedData = [...receiptData, ...paymentData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    data: combinedData,
    summary: {
      totalReceipts,
      totalPayments,
      netBalance: totalReceipts - totalPayments,
    },
  };
}

export interface DayBookEntry {
  id: string;
  voucherNo: string;
  voucherType: "RECEIPT" | "PAYMENT" | "CONTRA" | "JOURNAL";
  date: Date;
  particulars: string;
  accountsInvolved: string;
  amount: number;
  debitAmount: number;
  creditAmount: number;
  /** Individual accounting entries (for expandable sub-rows) */
  transactions: { accountName: string; debit: number; credit: number }[];
}

export async function getDayBook(params?: {
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const whereDate: any = {};
  if (params?.startDate) {
    whereDate.gte = new Date(params.startDate);
  }
  if (params?.endDate) {
    whereDate.lte = new Date(params.endDate + "T23:59:59.999Z");
  }
  const hasDateFilter = !!params?.startDate || !!params?.endDate;

  const [receipts, payments, contras, journals] = await Promise.all([
    hasDateFilter
      ? db.receipt.findMany({ where: { date: whereDate }, include: { donor: true }, orderBy: { date: "desc" } })
      : db.receipt.findMany({ include: { donor: true }, orderBy: { date: "desc" }, take: 200 }),
    hasDateFilter
      ? db.payment.findMany({ where: { date: whereDate }, orderBy: { date: "desc" } })
      : db.payment.findMany({ orderBy: { date: "desc" }, take: 200 }),
    hasDateFilter
      ? db.contraEntry.findMany({ where: { date: whereDate }, orderBy: { date: "desc" } })
      : db.contraEntry.findMany({ orderBy: { date: "desc" }, take: 200 }),
    hasDateFilter
      ? db.journalVoucher.findMany({ where: { date: whereDate }, orderBy: { date: "desc" } })
      : db.journalVoucher.findMany({ orderBy: { date: "desc" }, take: 200 }),
  ]);

  // Fetch transactions for journals and contras
  const allVoucherIds = [
    ...receipts.map((r) => ({ refType: "RECEIPT" as const, refId: r.id })),
    ...payments.map((p) => ({ refType: "PAYMENT" as const, refId: p.id })),
    ...contras.map((c) => ({ refType: "CONTRA" as const, refId: c.id })),
    ...journals.map((j) => ({ refType: "JOURNAL" as const, refId: j.id })),
  ];

  const txRefIds = allVoucherIds.map((v) => v.refId);
  const transactions = await db.transaction.findMany({
    where: { refId: { in: txRefIds } },
    include: { account: true },
  });

  const txByRef = new Map<string, typeof transactions>();
  transactions.forEach((tx) => {
    if (!txByRef.has(tx.refId)) txByRef.set(tx.refId, []);
    txByRef.get(tx.refId)!.push(tx);
  });

  const entries: DayBookEntry[] = [];

  // Receipts: Debit = amount (cash/bank), Credit = 0
  for (const r of receipts) {
    const txs = txByRef.get(r.id) || [];
    const accountsNames = txs
      .map((tx) => tx.account?.accountType || tx.account?.type || "")
      .filter(Boolean)
      .join(", ");
    const donorName = r.donor?.name || "";
    const particulars = [r.narration, donorName ? `(${donorName})` : ""]
      .filter(Boolean)
      .join(" ");

    entries.push({
      id: r.id,
      voucherNo: r.receiptNo,
      voucherType: "RECEIPT",
      date: r.date,
      particulars: particulars || "-",
      accountsInvolved: accountsNames || "-",
      amount: r.amount,
      debitAmount: r.amount,
      creditAmount: 0,
      transactions: txs.map((tx) => ({
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        debit: tx.debit,
        credit: tx.credit,
      })),
    });
  }

  // Payments: Credit = amount, Debit = 0
  for (const p of payments) {
    const txs = txByRef.get(p.id) || [];
    const accountsNames = txs
      .map((tx) => tx.account?.accountType || tx.account?.type || "")
      .filter(Boolean)
      .join(", ");

    entries.push({
      id: p.id,
      voucherNo: p.voucherNo,
      voucherType: "PAYMENT",
      date: p.date,
      particulars: p.narration || "-",
      accountsInvolved: accountsNames || "-",
      amount: p.amount,
      debitAmount: 0,
      creditAmount: p.amount,
      transactions: txs.map((tx) => ({
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        debit: tx.debit,
        credit: tx.credit,
      })),
    });
  }

  // Contra: Debit = amount, Credit = amount
  for (const c of contras) {
    const txs = txByRef.get(c.id) || [];
    const accountsNames = txs
      .map((tx) => tx.account?.accountType || tx.account?.type || "")
      .filter(Boolean)
      .join(", ");

    entries.push({
      id: c.id,
      voucherNo: c.entryNo,
      voucherType: "CONTRA",
      date: c.date,
      particulars: c.narration || `Transfer: ${c.fromAccountId} → ${c.toAccountId}`,
      accountsInvolved: accountsNames || "-",
      amount: c.amount,
      debitAmount: c.amount,
      creditAmount: c.amount,
      transactions: txs.map((tx) => ({
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        debit: tx.debit,
        credit: tx.credit,
      })),
    });
  }

  // Journal: Debit = total debit, Credit = total credit
  for (const j of journals) {
    const txs = txByRef.get(j.id) || [];
    const totalDebit = txs.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = txs.reduce((sum, tx) => sum + tx.credit, 0);
    const accountsNames = txs
      .map((tx) => tx.account?.accountType || tx.account?.type || "")
      .filter(Boolean)
      .join(", ");

    entries.push({
      id: j.id,
      voucherNo: j.voucherNo,
      voucherType: "JOURNAL",
      date: j.date,
      particulars: j.narration || "-",
      accountsInvolved: accountsNames || "-",
      amount: totalDebit,
      debitAmount: totalDebit,
      creditAmount: totalCredit,
      transactions: txs.map((tx) => ({
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        debit: tx.debit,
        credit: tx.credit,
      })),
    });
  }

  // Apply search filter
  if (params?.search) {
    const q = params.search.toLowerCase();
    return entries.filter(
      (e) =>
        e.voucherNo.toLowerCase().includes(q) ||
        e.particulars.toLowerCase().includes(q) ||
        e.accountsInvolved.toLowerCase().includes(q) ||
        e.voucherType.toLowerCase().includes(q)
    );
  }

  return entries;
}

export async function getOpeningBalance(date?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const beforeDate = date ? new Date(date) : new Date();
  beforeDate.setHours(0, 0, 0, 0);

  const cashBankAccounts = await db.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    select: { id: true, accountType: true, type: true },
  });

  const accountIds = cashBankAccounts.map((a) => a.id);
  const totals = await db.transaction.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accountIds }, date: { lt: beforeDate } },
    _sum: { debit: true, credit: true },
  });

  const totalsByAccount = new Map(
    totals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );

  let total = 0;
  const details: { name: string; balance: number }[] = [];
  for (const acc of cashBankAccounts) {
    const t = totalsByAccount.get(acc.id) || { debit: 0, credit: 0 };
    const balance = t.debit - t.credit;
    total += balance;
    details.push({ name: acc.accountType || acc.type, balance });
  }

  return { total, details };
}

export async function getClosingBalance(date?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const upToDate = date ? new Date(date + "T23:59:59.999Z") : new Date();

  const cashBankAccounts = await db.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    select: { id: true, accountType: true, type: true },
  });

  const accountIds = cashBankAccounts.map((a) => a.id);
  const totals = await db.transaction.groupBy({
    by: ["accountId"],
    where: { accountId: { in: accountIds }, date: { lte: upToDate } },
    _sum: { debit: true, credit: true },
  });

  const totalsByAccount = new Map(
    totals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );

  let total = 0;
  const details: { name: string; balance: number }[] = [];
  for (const acc of cashBankAccounts) {
    const t = totalsByAccount.get(acc.id) || { debit: 0, credit: 0 };
    const balance = t.debit - t.credit;
    total += balance;
    details.push({ name: acc.accountType || acc.type, balance });
  }

  return { total, details };
}

export interface VoucherDetail {
  id: string;
  voucherNo: string;
  voucherType: "RECEIPT" | "PAYMENT" | "CONTRA" | "JOURNAL";
  date: Date;
  narration: string | null;
  amount: number;
  entries: {
    accountId: string;
    accountName: string;
    accountType: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  // Voucher-specific metadata
  meta: Record<string, string | null>;
}

export async function getVoucherDetail(voucherType: string, id: string): Promise<VoucherDetail | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (voucherType === "RECEIPT") {
    const receipt = await db.receipt.findUnique({
      where: { id },
      include: { donor: true },
    });
    if (!receipt) return null;

    const transactions = await db.transaction.findMany({
      where: { refId: id, refType: "RECEIPT" },
      include: { account: true },
    });

    return {
      id: receipt.id,
      voucherNo: receipt.receiptNo,
      voucherType: "RECEIPT",
      date: receipt.date,
      narration: receipt.narration,
      amount: receipt.amount,
      entries: transactions.map((tx) => ({
        accountId: tx.accountId,
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        accountType: tx.account?.type || "",
        debit: tx.debit,
        credit: tx.credit,
      })),
      totalDebit: transactions.reduce((s, t) => s + t.debit, 0),
      totalCredit: transactions.reduce((s, t) => s + t.credit, 0),
      meta: {
        donorName: receipt.donor?.name || null,
        paymentMode: receipt.paymentMode,
        referenceNo: receipt.referenceNo,
        category: receipt.category,
        accountType: receipt.accountType,
        eventName: receipt.eventName,
      },
    };
  }

  if (voucherType === "PAYMENT") {
    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) return null;

    const transactions = await db.transaction.findMany({
      where: { refId: id, refType: "PAYMENT" },
      include: { account: true },
    });

    return {
      id: payment.id,
      voucherNo: payment.voucherNo,
      voucherType: "PAYMENT",
      date: payment.date,
      narration: payment.narration,
      amount: payment.amount,
      entries: transactions.map((tx) => ({
        accountId: tx.accountId,
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        accountType: tx.account?.type || "",
        debit: tx.debit,
        credit: tx.credit,
      })),
      totalDebit: transactions.reduce((s, t) => s + t.debit, 0),
      totalCredit: transactions.reduce((s, t) => s + t.credit, 0),
      meta: {
        paymentMode: payment.paymentMode,
        chequeNo: payment.chequeNo,
        bankName: payment.bankName,
        category: payment.category,
        accountType: payment.accountType,
        eventName: payment.eventName,
      },
    };
  }

  if (voucherType === "CONTRA") {
    const contra = await db.contraEntry.findUnique({
      where: { id },
    });
    if (!contra) return null;

    const transactions = await db.transaction.findMany({
      where: { refId: id, refType: "CONTRA" },
      include: { account: true },
    });

    const fromTx = transactions.find((tx) => tx.credit > 0);
    const toTx = transactions.find((tx) => tx.debit > 0);

    return {
      id: contra.id,
      voucherNo: contra.entryNo,
      voucherType: "CONTRA",
      date: contra.date,
      narration: contra.narration,
      amount: contra.amount,
      entries: transactions.map((tx) => ({
        accountId: tx.accountId,
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        accountType: tx.account?.type || "",
        debit: tx.debit,
        credit: tx.credit,
      })),
      totalDebit: transactions.reduce((s, t) => s + t.debit, 0),
      totalCredit: transactions.reduce((s, t) => s + t.credit, 0),
      meta: {
        fromAccount: fromTx?.account?.accountType || fromTx?.account?.type || null,
        toAccount: toTx?.account?.accountType || toTx?.account?.type || null,
        transferType: contra.transferType || null,
        reference: contra.reference || null,
      },
    };
  }

  if (voucherType === "JOURNAL") {
    const journal = await db.journalVoucher.findUnique({ where: { id } });
    if (!journal) return null;

    const transactions = await db.transaction.findMany({
      where: { refId: id, refType: "JOURNAL" },
      include: { account: true },
    });

    return {
      id: journal.id,
      voucherNo: journal.voucherNo,
      voucherType: "JOURNAL",
      date: journal.date,
      narration: journal.narration,
      amount: transactions.reduce((s, t) => s + t.debit, 0),
      entries: transactions.map((tx) => ({
        accountId: tx.accountId,
        accountName: tx.account?.accountType || tx.account?.type || "Unknown",
        accountType: tx.account?.type || "",
        debit: tx.debit,
        credit: tx.credit,
      })),
      totalDebit: transactions.reduce((s, t) => s + t.debit, 0),
      totalCredit: transactions.reduce((s, t) => s + t.credit, 0),
      meta: {},
    };
  }

  return null;
}

export async function getReceiptPaymentStatement(startDate: string, endDate: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // 1. Opening Balance (Cash/Bank Accounts before period) — use groupBy
  const cashBankAccounts = await db.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    select: { id: true, accountType: true, type: true },
  });
  const cashBankIds = cashBankAccounts.map((a) => a.id);

  const [openingTotals, closingTotals] = await Promise.all([
    db.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: cashBankIds }, date: { lt: start } },
      _sum: { debit: true, credit: true },
    }),
    db.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: cashBankIds }, date: { lte: end } },
      _sum: { debit: true, credit: true },
    }),
  ]);

  const openingMap = new Map(
    openingTotals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );
  const closingMap = new Map(
    closingTotals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );

  let totalOpeningBalance = 0;
  const openingBalanceDetails: { name: string; value: number }[] = [];
  for (const acc of cashBankAccounts) {
    const t = openingMap.get(acc.id) || { debit: 0, credit: 0 };
    const balance = t.debit - t.credit;
    totalOpeningBalance += balance;
    openingBalanceDetails.push({ name: acc.accountType || acc.type, value: balance });
  }

  let totalClosingBalance = 0;
  const closingBalanceDetails: { name: string; value: number }[] = [];
  for (const acc of cashBankAccounts) {
    const t = closingMap.get(acc.id) || { debit: 0, credit: 0 };
    const balance = t.debit - t.credit;
    totalClosingBalance += balance;
    closingBalanceDetails.push({ name: acc.accountType || acc.type, value: balance });
  }

  // 2. Direct Incomes from Receipts table grouped by accountType
  const receipts = await db.receipt.findMany({
    where: { date: { gte: start, lte: end } },
    select: {
      amount: true,
      accountType: true,
      category: true,
      eventName: true,
      donor: { select: { name: true } },
    },
  });

  const directIncomesMap = new Map<string, { total: number; donors: Map<string, { total: number; events: Map<string, number> }> }>();
  receipts.forEach((r) => {
    const label = r.accountType || r.category || "Other Income";
    if (!directIncomesMap.has(label)) {
      directIncomesMap.set(label, { total: 0, donors: new Map() });
    }
    const entry = directIncomesMap.get(label)!;
    entry.total += r.amount;
    if (r.donor?.name) {
      if (!entry.donors.has(r.donor.name)) {
        entry.donors.set(r.donor.name, { total: 0, events: new Map() });
      }
      const donorEntry = entry.donors.get(r.donor.name)!;
      donorEntry.total += r.amount;
      if (r.eventName && r.eventName !== "None") {
        const eventCurrent = donorEntry.events.get(r.eventName) || 0;
        donorEntry.events.set(r.eventName, eventCurrent + r.amount);
      }
    }
  });

  const directIncomes = Array.from(directIncomesMap.entries()).map(([name, data]) => ({
    name,
    value: data.total,
    donors: Array.from(data.donors.entries()).map(([donorName, donorData]) => ({
      name: donorName,
      amount: donorData.total,
      events:
        donorData.events.size > 0
          ? Array.from(donorData.events.entries()).map(([eventName, eventAmount]) => ({
              name: eventName,
              amount: eventAmount,
            }))
          : undefined,
    })),
  }));
  const totalDirectIncomes = directIncomes.reduce((sum, item) => sum + item.value, 0);

  // 3. Payments from Payments table grouped by category
  const allAccounts = await db.account.findMany({
    where: { type: { in: ["EXPENSE", "ASSET"] } },
    select: { accountType: true, category: true },
  });
  const accountCategoryMap = new Map<string, string | null>();
  allAccounts.forEach((a) => {
    if (a.accountType) {
      accountCategoryMap.set(a.accountType, a.category);
      accountCategoryMap.set(a.accountType.toLowerCase(), a.category);
    }
  });

  const resolveCategoryFallback = (accountType: string): string => {
    const lower = accountType.toLowerCase();
    if (/\b(asset|furniture|equipment)\b/.test(lower)) return "Fixed Assets";
    if (/\b(deposit|advance)\b/.test(lower)) return "Deposits (Assets)";
    return "Indirect Expenses";
  };

  const payments = await db.payment.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, category: true, accountType: true },
  });

  const journalExpenseTx = await db.transaction.findMany({
    where: {
      refType: "JOURNAL",
      date: { gte: start, lte: end },
      debit: { gt: 0 },
      account: { type: { in: ["EXPENSE", "ASSET"] } },
    },
    select: {
      debit: true,
      account: { select: { accountType: true, category: true } },
    },
  });

  const fixedAssetsMap = new Map<string, number>();
  const currentAssetsMap = new Map<string, number>();
  const indirectExpensesMap = new Map<string, number>();

  const addToPaymentMap = (accountType: string | null, category: string | null, amount: number) => {
    const resolvedCategory = accountType
      ? (accountCategoryMap.get(accountType) ??
          accountCategoryMap.get(accountType.toLowerCase()) ??
          resolveCategoryFallback(accountType))
      : (category ?? "Indirect Expenses");

    if (resolvedCategory === "Fixed Assets") {
      const label = accountType || category || "Fixed Assets";
      const current = fixedAssetsMap.get(label) || 0;
      fixedAssetsMap.set(label, current + amount);
    } else if (resolvedCategory === "Deposits (Assets)") {
      const label = accountType || category || "Deposits (Assets)";
      const current = currentAssetsMap.get(label) || 0;
      currentAssetsMap.set(label, current + amount);
    } else {
      const label = accountType || category || "Other Expenses";
      const current = indirectExpensesMap.get(label) || 0;
      indirectExpensesMap.set(label, current + amount);
    }
  };

  payments.forEach((p) => addToPaymentMap(p.accountType, p.category, p.amount));
  journalExpenseTx.forEach((tx) =>
    addToPaymentMap(tx.account.accountType ?? null, tx.account.category ?? null, tx.debit)
  );

  const fixedAssets = Array.from(fixedAssetsMap.entries()).map(([name, amount]) => ({
    name,
    value: amount,
  }));
  const totalFixedAssets = fixedAssets.reduce((sum, item) => sum + item.value, 0);

  const currentAssets = Array.from(currentAssetsMap.entries()).map(([name, amount]) => ({
    name,
    value: amount,
  }));
  const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.value, 0);

  const indirectExpenses = Array.from(indirectExpensesMap.entries()).map(([name, amount]) => ({
    name,
    value: amount,
  }));
  const totalIndirectExpenses = indirectExpenses.reduce((sum, item) => sum + item.value, 0);

  const totalReceipts = totalOpeningBalance + totalDirectIncomes;
  const totalPayments = totalFixedAssets + totalCurrentAssets + totalIndirectExpenses + totalClosingBalance;

  return {
    openingBalance: {
      total: totalOpeningBalance,
      details: openingBalanceDetails,
    },
    directIncomes: {
      total: totalDirectIncomes,
      details: directIncomes,
    },
    payments: {
      fixedAssets: { total: totalFixedAssets, details: fixedAssets },
      currentAssets: { total: totalCurrentAssets, details: currentAssets },
      indirectExpenses: { total: totalIndirectExpenses, details: indirectExpenses },
    },
    closingBalance: {
      total: totalClosingBalance,
      details: closingBalanceDetails,
    },
    totalReceipts,
    totalPayments,
  };
}

export interface BalanceSheetItem {
  name: string;
  balance: number;
}

export interface BalanceSheetCategory {
  category: string;
  items: BalanceSheetItem[];
  total: number;
}

export interface BalanceSheetData {
  asOfDate: Date;
  assets: BalanceSheetCategory[];
  liabilities: BalanceSheetCategory[];
  totalAssets: number;
  totalLiabilities: number;
}

export async function getBalanceSheet(asOfDate?: string): Promise<BalanceSheetData> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const end = asOfDate ? new Date(asOfDate + "T23:59:59.999Z") : new Date();

  // Fetch all accounts and aggregated transactions up to end date in one query
  const [accounts, totals] = await Promise.all([
    db.account.findMany(),
    db.transaction.groupBy({
      by: ["accountId"],
      where: { date: { lte: end } },
      _sum: { debit: true, credit: true },
    }),
  ]);

  const totalsMap = new Map(
    totals.map((t) => [t.accountId, { debit: t._sum.debit || 0, credit: t._sum.credit || 0 }])
  );

  const assetAccounts: { name: string; category: string; balance: number }[] = [];
  const liabilityAccounts: { name: string; category: string; balance: number }[] = [];
  let totalIncome = 0;
  let totalOperatingExpenses = 0;

  accounts.forEach((acc) => {
    const t = totalsMap.get(acc.id) || { debit: 0, credit: 0 };
    const totalDebit = t.debit;
    const totalCredit = t.credit;

    const isAssetType = ["CASH", "BANK", "ASSET"].includes(acc.type);
    const isCapitalizedExpense = acc.type === "EXPENSE" && ["Fixed Assets", "Deposits (Assets)"].includes(acc.category || "");
    const isAsset = isAssetType || isCapitalizedExpense;
    const isLiability = acc.type === "LIABILITY";

    if (isAsset) {
      const balance = (acc.balance || 0) + (totalDebit - totalCredit);
      if (balance !== 0) {
        let categoryName = acc.category || "Other Assets";
        if (acc.type === "CASH") categoryName = "Cash in Hand";
        if (acc.type === "BANK") categoryName = "Bank Accounts";
        assetAccounts.push({
          name: acc.accountType || acc.type,
          category: categoryName,
          balance,
        });
      }
    } else if (isLiability) {
      const balance = (acc.balance || 0) + (totalCredit - totalDebit);
      if (balance !== 0) {
        liabilityAccounts.push({
          name: acc.accountType || acc.type,
          category: acc.category || "Liabilities",
          balance,
        });
      }
    } else if (acc.type === "INCOME") {
      const balance = (acc.balance || 0) + (totalCredit - totalDebit);
      totalIncome += balance;
    } else if (acc.type === "EXPENSE") {
      // Normal operating expenses (excludes capitalized Fixed Assets/Deposits)
      const balance = (acc.balance || 0) + (totalDebit - totalCredit);
      totalOperatingExpenses += balance;
    }
  });

  // Excess of Income over Expenditure (Accumulated Surplus)
  const surplusDeficit = totalIncome - totalOperatingExpenses;

  // Group assets by category
  const assetsByCategory: Record<string, BalanceSheetItem[]> = {};
  assetAccounts.forEach((acc) => {
    if (!assetsByCategory[acc.category]) {
      assetsByCategory[acc.category] = [];
    }
    assetsByCategory[acc.category].push({ name: acc.name, balance: acc.balance });
  });

  // Group liabilities by category
  const liabilitiesByCategory: Record<string, BalanceSheetItem[]> = {};
  liabilityAccounts.forEach((acc) => {
    if (!liabilitiesByCategory[acc.category]) {
      liabilitiesByCategory[acc.category] = [];
    }
    liabilitiesByCategory[acc.category].push({ name: acc.name, balance: acc.balance });
  });

  const assets: BalanceSheetCategory[] = Object.entries(assetsByCategory).map(([category, items]) => ({
    category,
    items,
    total: items.reduce((sum, item) => sum + item.balance, 0),
  })).sort((a, b) => a.category.localeCompare(b.category));

  const liabilities: BalanceSheetCategory[] = Object.entries(liabilitiesByCategory).map(([category, items]) => ({
    category,
    items,
    total: items.reduce((sum, item) => sum + item.balance, 0),
  })).sort((a, b) => a.category.localeCompare(b.category));

  // Add Surplus to Liabilities side
  liabilities.push({
    category: "Excess of Income over Expenditure",
    items: [{ name: "Accumulated Surplus (up to date)", balance: surplusDeficit }],
    total: surplusDeficit,
  });

  const totalAssets = assets.reduce((sum, cat) => sum + cat.total, 0);
  const totalLiabilities = liabilities.reduce((sum, cat) => sum + cat.total, 0);

  return {
    asOfDate: end,
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
  };
}

