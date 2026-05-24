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
  
  const accounts = await db.account.findMany({
    orderBy: {
      type: "asc",
    },
    include: {
      transactions: {
        select: {
          debit: true,
          credit: true
        }
      }
    }
  });

  return accounts.map(acc => {
    const totalDebit = acc.transactions.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = acc.transactions.reduce((sum, tx) => sum + tx.credit, 0);
    
    // Assets (Cash/Bank) and Expenses: Balance = Debit - Credit
    // Income and Liabilities: Balance = Credit - Debit
    const isAssetOrExpense = ["CASH", "BANK", "ASSET", "EXPENSE"].includes(acc.type);
    const balance = isAssetOrExpense ? (totalDebit - totalCredit) : (totalCredit - totalDebit);

    return {
      ...acc,
      balance
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

export async function getReceiptPaymentStatement(startDate: string, endDate: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // 1. Opening Balance (Cash/Bank Accounts before period)
  const openingBalanceAccounts = await db.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lt: start } },
        select: { debit: true, credit: true },
      },
    },
  });

  let totalOpeningBalance = 0;
  const openingBalanceDetails: any = [];

  openingBalanceAccounts.forEach(account => {
    const totalDebit = account.transactions.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = account.transactions.reduce((sum, tx) => sum + tx.credit, 0);
    const balance = totalDebit - totalCredit;
    totalOpeningBalance += balance;
    openingBalanceDetails.push({ name: account.accountType || account.type, value: balance });
  });

  // 2. Direct Incomes from Receipts table grouped by accountType
  const receipts = await db.receipt.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, accountType: true, category: true, eventName: true, donor: { select: { name: true } } },
  });

  // Map: accountType -> { total amount, donors with events breakdown }
  const directIncomesMap = new Map<string, { total: number; donors: Map<string, { total: number; events: Map<string, number> }> }>();
  receipts.forEach(r => {
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
      events: donorData.events.size > 0
        ? Array.from(donorData.events.entries()).map(([eventName, eventAmount]) => ({
            name: eventName,
            amount: eventAmount,
          }))
        : undefined,
    })),
  }));
  const totalDirectIncomes = directIncomes.reduce((sum, item) => sum + item.value, 0);

  // 3. Payments from Payments table grouped by category
  // Use Account table as the authoritative source for category mapping,
  // with keyword-based fallback for resilience
  const allAccounts = await db.account.findMany({
    where: { type: { in: ["EXPENSE", "ASSET"] } },
    select: { accountType: true, category: true },
  });
  const accountCategoryMap = new Map<string, string | null>();
  allAccounts.forEach(a => {
    if (a.accountType) {
      accountCategoryMap.set(a.accountType, a.category);
      accountCategoryMap.set(a.accountType.toLowerCase(), a.category);
    }
  });

  function resolveCategoryFallback(accountType: string): string {
    const lower = accountType.toLowerCase();
    if (/\b(asset|furniture|equipment)\b/.test(lower)) return "Fixed Assets";
    if (/\b(deposit|advance)\b/.test(lower)) return "Deposits (Assets)";
    return "Indirect Expenses";
  }

  const payments = await db.payment.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, category: true, accountType: true },
  });

  // Also fetch Journal Voucher transactions that debit expense accounts
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

  function addToPaymentMap(
    accountType: string | null,
    category: string | null,
    amount: number
  ) {
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
  }

  payments.forEach(p => {
    addToPaymentMap(p.accountType, p.category, p.amount);
  });

  journalExpenseTx.forEach(tx => {
    addToPaymentMap(
      tx.account.accountType ?? null,
      tx.account.category ?? null,
      tx.debit
    );
  });

  const fixedAssets = Array.from(fixedAssetsMap.entries()).map(([name, amount]) => ({ name, value: amount }));
  const totalFixedAssets = fixedAssets.reduce((sum, item) => sum + item.value, 0);

  const currentAssets = Array.from(currentAssetsMap.entries()).map(([name, amount]) => ({ name, value: amount }));
  const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.value, 0);

  const indirectExpenses = Array.from(indirectExpensesMap.entries()).map(([name, amount]) => ({ name, value: amount }));
  const totalIndirectExpenses = indirectExpenses.reduce((sum, item) => sum + item.value, 0);

  // 4. Closing Balance (Cash/Bank Accounts up to end date)
  const closingBalanceAccounts = await db.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lte: end } },
        select: { debit: true, credit: true },
      },
    },
  });

  let totalClosingBalance = 0;
  const closingBalanceDetails: any = [];

  closingBalanceAccounts.forEach(account => {
    const totalDebit = account.transactions.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = account.transactions.reduce((sum, tx) => sum + tx.credit, 0);
    const balance = totalDebit - totalCredit;
    totalClosingBalance += balance;
    closingBalanceDetails.push({ name: account.accountType || account.type, value: balance });
  });

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
