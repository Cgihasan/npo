"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPayment(data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { 
    date, 
    type, 
    category,
    accountType,
    amount, 
    paymentMode, 
    chequeNo,
    bankName,
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);
  const paymentDate = new Date(date);
  const year = paymentDate.getFullYear();

  const result = await db.$transaction(async (tx) => {
    // Generate sequential voucher number
    const lastPayment = await tx.payment.findFirst({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      orderBy: { voucherNo: "desc" },
    });

    let nextNumber = 1;
    if (lastPayment) {
      const parts = lastPayment.voucherNo.split("-");
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    const voucherNo = `PV-${year}-${nextNumber.toString().padStart(3, "0")}`;

    const payment = await tx.payment.create({
      data: {
        voucherNo,
        date: paymentDate,
        type,
        category,
        accountType,
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
        date: paymentDate,
      },
    });

    return payment;
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return result;
}

export async function getNextVoucherNumber(date: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const year = new Date(date).getFullYear();
  const lastPayment = await db.payment.findFirst({
    where: {
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    },
    orderBy: { voucherNo: "desc" },
  });

  let nextNumber = 1;
  if (lastPayment) {
    const parts = lastPayment.voucherNo.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  return `PV-${year}-${nextNumber.toString().padStart(3, "0")}`;
}

export async function updatePayment(id: string, data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) throw new Error("Payment ID is required");

  const { 
    date, 
    type, 
    category,
    accountType,
    amount, 
    paymentMode, 
    chequeNo,
    bankName,
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);
  const paymentDate = new Date(date);

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id },
      data: {
        date: paymentDate,
        type,
        category,
        accountType,
        amount: numAmount,
        paymentMode,
        chequeNo,
        bankName,
        accountId,
        narration,
      },
    });

    await tx.transaction.updateMany({
      where: {
        refId: id,
        refType: "PAYMENT",
      },
      data: {
        accountId,
        credit: numAmount,
        date: paymentDate,
      },
    });

    return payment;
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return result;
}

export async function deletePayment(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) throw new Error("Payment ID is required");

  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "PAYMENT",
      },
    });

    await tx.payment.delete({
      where: { id },
    });
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPaymentById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) return null;

  return await db.payment.findUnique({
    where: { id },
  });
}

export async function getPayments() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  return await db.payment.findMany({
    orderBy: {
      date: "desc",
    },
  });
}
