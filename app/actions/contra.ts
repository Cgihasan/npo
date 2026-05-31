"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  postContraLedgerEntries,
  replaceContraLedgerEntries,
} from "@/lib/voucher-ledger";

export async function getNextContraNumber(date: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const year = new Date(date).getFullYear();
  const lastContra = await db.contraEntry.findFirst({
    where: {
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    },
    orderBy: { entryNo: "desc" },
  });

  let nextNumber = 1;
  if (lastContra) {
    const parts = lastContra.entryNo.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  return `CON-${year}-${nextNumber.toString().padStart(3, "0")}`;
}

export async function createContra(data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const {
    entryNo,
    date,
    transferType,
    fromAccountId,
    toAccountId,
    amount,
    reference,
    narration,
  } = data;

  if (!date || !fromAccountId || !toAccountId || !amount) {
    throw new Error("Missing required contra fields.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("From and To accounts must be different for a contra transaction.");
  }

  const numAmount = Number(amount);
  if (numAmount <= 0) {
    throw new Error("Contra amount must be greater than zero.");
  }

  const result = await db.$transaction(async (tx) => {
    const contraEntryNo = entryNo?.trim()
      ? entryNo
      : await getNextContraNumber(date);

    const contra = await tx.contraEntry.create({
      data: {
        entryNo: contraEntryNo,
        date: new Date(date),
        transferType,
        fromAccountId,
        toAccountId,
        amount: numAmount,
        reference,
        narration,
      },
    });

    await postContraLedgerEntries(tx, {
      contraId: contra.id,
      date: new Date(date),
      amount: numAmount,
      fromAccountId,
      toAccountId,
    });

    return contra;
  });

  revalidatePath("/contra");
  revalidatePath("/dashboard");
  return result;
}

export async function updateContra(id: string, data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) throw new Error("Contra ID is required");

  const {
    date,
    transferType,
    fromAccountId,
    toAccountId,
    amount,
    reference,
    narration,
  } = data;

  if (!date || !fromAccountId || !toAccountId || !amount) {
    throw new Error("Missing required contra fields.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("From and To accounts must be different for a contra transaction.");
  }

  const numAmount = Number(amount);
  if (numAmount <= 0) {
    throw new Error("Contra amount must be greater than zero.");
  }

  const result = await db.$transaction(async (tx) => {
    const contra = await tx.contraEntry.update({
      where: { id },
      data: {
        date: new Date(date),
        transferType,
        fromAccountId,
        toAccountId,
        amount: numAmount,
        reference,
        narration,
      },
    });

    await replaceContraLedgerEntries(tx, {
      contraId: id,
      date: new Date(date),
      amount: numAmount,
      fromAccountId,
      toAccountId,
    });

    return contra;
  });

  revalidatePath("/contra");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteContra(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) throw new Error("Contra ID is required");

  if ((session.user as any).role !== "ADMIN") {
    await db.deletionRequest.create({
      data: {
        voucherId: id,
        voucherType: "CONTRA",
        requestedById: (session.user as any).id,
        status: "PENDING",
      },
    });
    return { success: true, requested: true };
  }

  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "CONTRA",
      },
    });

    await tx.contraEntry.delete({
      where: { id },
    });
  });

  revalidatePath("/contra");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getContraById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) return null;

  return await db.contraEntry.findUnique({
    where: { id },
  });
}

export async function getContraEntries(params?: {
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
      { entryNo: { contains: params.search, mode: "insensitive" } },
      { fromAccountId: { contains: params.search, mode: "insensitive" } },
      { toAccountId: { contains: params.search, mode: "insensitive" } },
      { narration: { contains: params.search, mode: "insensitive" } },
      { reference: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.contraEntry.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    db.contraEntry.count({ where }),
  ]);

  return {
    items,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}
