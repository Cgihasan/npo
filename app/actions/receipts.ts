"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { receiptSchema } from "@/lib/schemas/financial";
import { AUTHORIZED_ROLES, ADMIN_ONLY } from "@/lib/constants";

export async function createReceipt(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!AUTHORIZED_ROLES.includes(session.user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  const validatedData = receiptSchema.parse(data);

  const { 
    date, 
    donorId, 
    type, 
    category,
    accountType,
    eventName,
    amount: numAmount,
    paymentMode, 
    referenceNo, 
    accountId, 
    narration 
  } = validatedData;

  const receiptDate = new Date(date);
  const year = receiptDate.getFullYear();

  const result = await db.$transaction(async (tx) => {
    // Generate sequential receipt number
    const lastReceipt = await tx.receipt.findFirst({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      orderBy: { receiptNo: "desc" },
    });

    let nextNumber = 1;
    if (lastReceipt) {
      const parts = lastReceipt.receiptNo.split("-");
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    const receiptNo = `RCP-${year}-${nextNumber.toString().padStart(3, "0")}`;

    const receipt = await tx.receipt.create({
      data: {
        receiptNo,
        date: receiptDate,
        donorId: (donorId === "none" || !donorId) ? null : donorId,
        type,
        category,
        accountType,
        eventName,
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

export async function updateReceipt(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!AUTHORIZED_ROLES.includes(session.user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  if (!id) throw new Error("Receipt ID is required");

  const validatedData = receiptSchema.parse(data);

  const { 
    date, 
    donorId, 
    type, 
    category,
    accountType,
    eventName,
    amount: numAmount,
    paymentMode, 
    referenceNo, 
    accountId, 
    narration 
  } = validatedData;

  const receiptDate = new Date(date);

  const result = await db.$transaction(async (tx) => {
    // Check if receipt exists
    const existingReceipt = await tx.receipt.findUnique({
      where: { id },
    });

    if (!existingReceipt) throw new Error("Receipt not found");

    // Update receipt
    const receipt = await tx.receipt.update({
      where: { id },
      data: {
        date: receiptDate,
        donorId: (donorId === "none" || !donorId) ? null : donorId,
        type,
        category,
        accountType,
        eventName,
        amount: numAmount,
        paymentMode,
        referenceNo,
        accountId,
        narration,
      },
    });

    // Update associated transaction
    await tx.transaction.updateMany({
      where: {
        refId: id,
        refType: "RECEIPT",
      },
      data: {
        accountId,
        debit: numAmount,
        date: receiptDate,
      },
    });

    return receipt;
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteReceipt(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!ADMIN_ONLY.includes(session.user.role)) {
    throw new Error("Forbidden: Only ADMIN can delete records");
  }

  await db.$transaction(async (tx) => {
    // Delete associated transactions first
    await tx.transaction.deleteMany({
      where: {
        refId: id,
        refType: "RECEIPT",
      },
    });

    // Delete the receipt
    await tx.receipt.delete({
      where: { id },
    });
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteReceipts(ids: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!ADMIN_ONLY.includes(session.user.role)) {
    throw new Error("Forbidden: Only ADMIN can delete records");
  }

  await db.$transaction(async (tx) => {
    // Delete associated transactions first
    await tx.transaction.deleteMany({
      where: {
        refId: { in: ids },
        refType: "RECEIPT",
      },
    });

    // Delete the receipts
    await tx.receipt.deleteMany({
      where: { id: { in: ids } },
    });
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getReceiptById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) return null;

  return await db.receipt.findUnique({
    where: { id },
    include: {
      donor: true,
    },
  });
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

export async function getNextReceiptNumber(date: string) {
  const receiptDate = new Date(date);
  const year = receiptDate.getFullYear();

  const lastReceipt = await db.receipt.findFirst({
    where: {
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    orderBy: { receiptNo: "desc" },
  });

  let nextNumber = 1;
  if (lastReceipt) {
    const parts = lastReceipt.receiptNo.split("-");
    const lastSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  return `RCP-${year}-${nextNumber.toString().padStart(3, "0")}`;
}
