"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createReceipt(data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { 
    receiptNo, 
    date, 
    donorId, 
    type, 
    amount, 
    paymentMode, 
    referenceNo, 
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);

  const result = await db.$transaction(async (tx) => {
    const receipt = await tx.receipt.create({
      data: {
        receiptNo,
        date: new Date(date),
        donorId,
        type,
        amount: numAmount,
        paymentMode,
        referenceNo,
        accountId,
        narration,
      },
    });

    await tx.transaction.create({
      data: {
        accountId,
        debit: numAmount,
        credit: 0,
        refType: "RECEIPT",
        refId: receipt.id,
        date: new Date(date),
      },
    });

    return receipt;
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  return result;
}

export async function getReceipts() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  return await db.receipt.findMany({
    include: {
      donor: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}
