"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPayment(data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { 
    voucherNo, 
    date, 
    vendorId, 
    type, 
    amount, 
    paymentMode, 
    chequeNo,
    bankName,
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        voucherNo,
        date: new Date(date),
        vendorId,
        type,
        amount: numAmount,
        paymentMode,
        chequeNo,
        bankName,
        accountId,
        narration,
      },
    });

    await tx.transaction.create({
      data: {
        accountId,
        debit: 0,
        credit: numAmount,
        refType: "PAYMENT",
        refId: payment.id,
        date: new Date(date),
      },
    });

    return payment;
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return result;
}

export async function getPayments() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  return await db.payment.findMany({
    include: {
      vendor: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}
