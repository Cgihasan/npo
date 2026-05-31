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
  if (!id) throw new Error("Journal voucher ID is required");

  if ((session.user as any).role !== "ADMIN") {
    await db.deletionRequest.create({
      data: {
        voucherId: id,
        voucherType: "JOURNAL",
        requestedById: (session.user as any).id,
        status: "PENDING",
      },
    });
    return { success: true, requested: true };
  }

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

export async function getJournalVouchers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (params?.search) {
    where.OR = [
      { voucherNo: { contains: params.search, mode: "insensitive" } },
      { narration: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [vouchers, total] = await Promise.all([
    db.journalVoucher.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    db.journalVoucher.count({ where }),
  ]);

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
  const items = vouchers.map(voucher => {
    const vTransactions = transactions.filter(t => t.refId === voucher.id);
    const totalAmount = vTransactions.reduce((sum, t) => sum + t.debit, 0);
    return {
      ...voucher,
      transactions: vTransactions,
      totalAmount
    };
  });

  return {
    items,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
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
