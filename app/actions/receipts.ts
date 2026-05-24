"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  postReceiptLedgerEntries,
  replaceReceiptLedgerEntries,
  resolveIncomeAccountId,
} from "@/lib/voucher-ledger";

export async function createReceipt(data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { 
    date, 
    donorId, 
    type, 
    category,
    accountType,
    eventName,
    amount, 
    paymentMode, 
    referenceNo, 
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);
  const receiptDate = new Date(date);
  const year = receiptDate.getFullYear();

  const result = await db.$transaction(async (tx) => {
    // Generate sequential receipt number with retry for race conditions
    let receipt;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const lastReceipt = await tx.receipt.findFirst({
        where: {
          date: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31T23:59:59.999Z`),
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

      // Increment by attempts to avoid collisions on retry
      nextNumber += attempts;

      const receiptNo = `RCP-${year}-${nextNumber.toString().padStart(3, "0")}`;

      try {
        receipt = await tx.receipt.create({
          data: {
            receiptNo,
            date: receiptDate,
            donorId: (donorId === "none" || !donorId) ? null : donorId,
            type,
            category,
            accountType,
            eventName: eventName === "None" ? null : (eventName || null),
            amount: numAmount,
            paymentMode,
            referenceNo,
            accountId,
            narration,
          },
        });
        break;
      } catch (error: any) {
        if (error.code === "P2002" && attempts < maxAttempts - 1) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!receipt) throw new Error("Failed to generate unique receipt number");

    const incomeAccountId = await resolveIncomeAccountId(tx, {
      type,
      category,
      accountType,
    });

    await postReceiptLedgerEntries(tx, {
      receiptId: receipt.id,
      date: receiptDate,
      amount: numAmount,
      assetAccountId: accountId,
      incomeAccountId,
    });

    return receipt;
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return result;
}

export async function updateReceipt(id: string, data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (!id) throw new Error("Receipt ID is required");

  const { 
    date, 
    donorId, 
    type, 
    category,
    accountType,
    eventName,
    amount, 
    paymentMode, 
    referenceNo, 
    accountId, 
    narration 
  } = data;

  const numAmount = Number(amount);
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
        eventName: eventName === "None" ? null : (eventName || null),
        amount: numAmount,
        paymentMode,
        referenceNo,
        accountId,
        narration,
      },
    });

    const incomeAccountId = await resolveIncomeAccountId(tx, {
      type,
      category,
      accountType,
    });

    await replaceReceiptLedgerEntries(tx, {
      receiptId: id,
      date: receiptDate,
      amount: numAmount,
      assetAccountId: accountId,
      incomeAccountId,
    });

    return receipt;
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return result;
}

export async function deleteReceipt(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

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
  if (!session) throw new Error("Unauthorized");

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
