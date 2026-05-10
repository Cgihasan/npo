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

export async function getContraEntries() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  return await db.contraEntry.findMany({
    orderBy: {
      date: "desc",
    },
  });
}
