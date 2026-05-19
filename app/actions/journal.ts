"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type JournalEntryInput = {
  accountId: string;
  debit: number;
  credit: number;
};

export async function createJournalVoucher(data: {
  date: string;
  narration: string;
  entries: JournalEntryInput[];
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { date, narration, entries } = data;
  const voucherDate = new Date(date);
  const year = voucherDate.getFullYear();

  // Validate that debits == credits
  const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error("Total Debits must equal Total Credits");
  }

  if (totalDebit === 0) {
    throw new Error("Journal entry cannot have zero total amount");
  }

  const result = await db.$transaction(async (tx) => {
    // Generate sequential journal voucher number
    const lastVoucher = await tx.journalVoucher.findFirst({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      orderBy: { voucherNo: "desc" },
    });

    let nextNumber = 1;
    if (lastVoucher) {
      const parts = lastVoucher.voucherNo.split("-");
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    const voucherNo = `JV-${year}-${nextNumber.toString().padStart(3, "0")}`;

    const journalVoucher = await tx.journalVoucher.create({
      data: {
        voucherNo,
        date: voucherDate,
        narration,
      },
    });

    // Create all transactions for this journal voucher
    for (const entry of entries) {
      if (Number(entry.debit) === 0 && Number(entry.credit) === 0) continue;

      await tx.transaction.create({
        data: {
          accountId: entry.accountId,
          debit: Number(entry.debit),
          credit: Number(entry.credit),
          refType: "JOURNAL",
          refId: journalVoucher.id,
          date: voucherDate,
        },
      });
    }

    return journalVoucher;
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  return result;
}

export async function updateJournalVoucher(id: string, data: {
  date: string;
  narration: string;
  entries: JournalEntryInput[];
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { date, narration, entries } = data;
  const voucherDate = new Date(date);

  // Validate that debits == credits
  const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error("Total Debits must equal Total Credits");
  }

  if (totalDebit === 0) {
    throw new Error("Journal entry cannot have zero total amount");
  }

  await db.$transaction(async (tx) => {
    // Update the voucher
    await tx.journalVoucher.update({
      where: { id },
      data: {
        date: voucherDate,
        narration,
      },
    });

    // Delete existing transactions
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "JOURNAL",
      },
    });

    // Create new transactions
    for (const entry of entries) {
      if (Number(entry.debit) === 0 && Number(entry.credit) === 0) continue;

      await tx.transaction.create({
        data: {
          accountId: entry.accountId,
          debit: Number(entry.debit),
          credit: Number(entry.credit),
          refType: "JOURNAL",
          refId: id,
          date: voucherDate,
        },
      });
    }
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteJournalVoucher(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    // Delete associated transactions first
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "JOURNAL",
      },
    });

    // Delete the voucher
    await tx.journalVoucher.delete({
      where: { id },
    });
  });

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getJournalVouchers() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const vouchers = await db.journalVoucher.findMany({
    orderBy: {
      date: "desc",
    },
  });

  // Fetch transactions for these vouchers
  const voucherIds = vouchers.map(v => v.id);
  const transactions = await db.transaction.findMany({
    where: {
      refType: "JOURNAL",
      refId: { in: voucherIds }
    },
    include: {
      account: true
    }
  });

  // Attach transactions and calculate total amount (which is total debit)
  return vouchers.map(voucher => {
    const vTransactions = transactions.filter(t => t.refId === voucher.id);
    const totalAmount = vTransactions.reduce((sum, t) => sum + t.debit, 0);
    return {
      ...voucher,
      transactions: vTransactions,
      totalAmount
    };
  });
}

export async function getJournalVoucherById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) return null;

  const voucher = await db.journalVoucher.findUnique({
    where: { id },
  });

  if (!voucher) return null;

  const transactions = await db.transaction.findMany({
    where: {
      refType: "JOURNAL",
      refId: voucher.id
    },
    include: {
      account: true
    }
  });

  return {
    ...voucher,
    transactions
  };
}
