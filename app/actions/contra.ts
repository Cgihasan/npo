"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
    narration 
  } = data;

  const numAmount = Number(amount);

  const result = await db.$transaction(async (tx) => {
    const contra = await tx.contraEntry.create({
      data: {
        entryNo,
        date: new Date(date),
        transferType,
        fromAccountId,
        toAccountId,
        amount: numAmount,
        reference,
        narration,
      },
    });

    await tx.transaction.create({
      data: {
        accountId: fromAccountId,
        debit: 0,
        credit: numAmount,
        refType: "CONTRA",
        refId: contra.id,
        date: new Date(date),
      },
    });

    await tx.transaction.create({
      data: {
        accountId: toAccountId,
        debit: numAmount,
        credit: 0,
        refType: "CONTRA",
        refId: contra.id,
        date: new Date(date),
      },
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
    narration 
  } = data;

  const numAmount = Number(amount);
  const contraDate = new Date(date);

  const result = await db.$transaction(async (tx) => {
    const contra = await tx.contraEntry.update({
      where: { id },
      data: {
        date: contraDate,
        transferType,
        fromAccountId,
        toAccountId,
        amount: numAmount,
        reference,
        narration,
      },
    });

    // Delete existing transactions and recreate them (simpler than updating multiple)
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "CONTRA",
      },
    });

    await tx.transaction.create({
      data: {
        accountId: fromAccountId,
        debit: 0,
        credit: numAmount,
        refType: "CONTRA",
        refId: contra.id,
        date: contraDate,
      },
    });

    await tx.transaction.create({
      data: {
        accountId: toAccountId,
        debit: numAmount,
        credit: 0,
        refType: "CONTRA",
        refId: contra.id,
        date: contraDate,
      },
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

export async function getContraEntries() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  return await db.contraEntry.findMany({
    orderBy: {
      date: "desc",
    },
  });
}
