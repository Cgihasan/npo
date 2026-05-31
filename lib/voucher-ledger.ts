import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type LedgerFields = {
  type: string;
  category?: string | null;
  accountType?: string | null;
};

function ledgerNameFromFields({ type, accountType }: LedgerFields): string {
  const name = (accountType || type)?.trim();
  if (!name) throw new Error("Ledger name is required for double-entry posting.");
  return name;
}

/** Resolve or create an INCOME account for receipt credit side. */
export async function resolveIncomeAccountId(
  tx: Tx,
  fields: LedgerFields
): Promise<string> {
  const ledgerName = ledgerNameFromFields(fields);
  const normalized = ledgerName.toLowerCase();

  const accounts = await tx.account.findMany({ where: { type: "INCOME" } });
  const existing = accounts.find(
    (acc) => acc.accountType?.trim().toLowerCase() === normalized
  );
  if (existing) return existing.id;

  const created = await tx.account.create({
    data: {
      type: "INCOME",
      category: fields.category || "Direct Incomes",
      accountType: ledgerName,
      balance: 0,
    },
  });
  return created.id;
}

/** Resolve or create an EXPENSE account for payment debit side. */
export async function resolveExpenseAccountId(
  tx: Tx,
  fields: LedgerFields
): Promise<string> {
  const ledgerName = ledgerNameFromFields(fields);
  const normalized = ledgerName.toLowerCase();

  const accounts = await tx.account.findMany({ where: { type: "EXPENSE" } });
  const existing = accounts.find(
    (acc) => acc.accountType?.trim().toLowerCase() === normalized
  );
  if (existing) return existing.id;

  let category = fields.category || "Indirect Expenses";
  const lower = ledgerName.toLowerCase();
  if (/\b(asset|furniture|equipment)\b/.test(lower)) {
    category = "Fixed Assets";
  } else if (/\b(deposit|advance)\b/.test(lower)) {
    category = "Deposits (Assets)";
  }

  const created = await tx.account.create({
    data: {
      type: "EXPENSE",
      category,
      accountType: ledgerName,
      balance: 0,
    },
  });
  return created.id;
}

/** Debit Cash/Bank, Credit Income — standard receipt double-entry. */
export async function postReceiptLedgerEntries(
  tx: Tx,
  params: {
    receiptId: string;
    date: Date;
    amount: number;
    assetAccountId: string;
    incomeAccountId: string;
  }
) {
  const { receiptId, date, amount, assetAccountId, incomeAccountId } = params;

  await tx.transaction.createMany({
    data: [
      {
        accountId: assetAccountId,
        debit: amount,
        credit: 0,
        refType: "RECEIPT",
        refId: receiptId,
        date,
      },
      {
        accountId: incomeAccountId,
        debit: 0,
        credit: amount,
        refType: "RECEIPT",
        refId: receiptId,
        date,
      },
    ],
  });
}

/** Debit Expense, Credit Cash/Bank — standard payment double-entry. */
export async function postPaymentLedgerEntries(
  tx: Tx,
  params: {
    paymentId: string;
    date: Date;
    amount: number;
    assetAccountId: string;
    expenseAccountId: string;
  }
) {
  const { paymentId, date, amount, assetAccountId, expenseAccountId } = params;

  await tx.transaction.createMany({
    data: [
      {
        accountId: expenseAccountId,
        debit: amount,
        credit: 0,
        refType: "PAYMENT",
        refId: paymentId,
        date,
      },
      {
        accountId: assetAccountId,
        debit: 0,
        credit: amount,
        refType: "PAYMENT",
        refId: paymentId,
        date,
      },
    ],
  });
}

export async function replaceReceiptLedgerEntries(
  tx: Tx,
  params: {
    receiptId: string;
    date: Date;
    amount: number;
    assetAccountId: string;
    incomeAccountId: string;
  }
) {
  await tx.transaction.deleteMany({
    where: { refId: params.receiptId, refType: "RECEIPT" },
  });
  await postReceiptLedgerEntries(tx, params);
}

export async function replacePaymentLedgerEntries(
  tx: Tx,
  params: {
    paymentId: string;
    date: Date;
    amount: number;
    assetAccountId: string;
    expenseAccountId: string;
  }
) {
  await tx.transaction.deleteMany({
    where: { refId: params.paymentId, refType: "PAYMENT" },
  });
  await postPaymentLedgerEntries(tx, params);
}

/** Credit from account, debit to account — standard contra transfer. */
export async function postContraLedgerEntries(
  tx: Tx,
  params: {
    contraId: string;
    date: Date;
    amount: number;
    fromAccountId: string;
    toAccountId: string;
  }
) {
  await tx.transaction.createMany({
    data: [
      {
        accountId: params.fromAccountId,
        debit: 0,
        credit: params.amount,
        refType: "CONTRA",
        refId: params.contraId,
        date: params.date,
      },
      {
        accountId: params.toAccountId,
        debit: params.amount,
        credit: 0,
        refType: "CONTRA",
        refId: params.contraId,
        date: params.date,
      },
    ],
  });
}

export async function replaceContraLedgerEntries(
  tx: Tx,
  params: {
    contraId: string;
    date: Date;
    amount: number;
    fromAccountId: string;
    toAccountId: string;
  }
) {
  await tx.transaction.deleteMany({
    where: { refId: params.contraId, refType: "CONTRA" },
  });
  await postContraLedgerEntries(tx, params);
}
