import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const receipts = await prisma.receipt.findMany({
    select: { date: true, amount: true, receiptNo: true }
  });
  console.log("Receipts:", receipts);

  const payments = await prisma.payment.findMany({
    select: { date: true, amount: true, voucherNo: true }
  });
  console.log("Payments:", payments);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  console.log("Start of Month (UTC):", startOfMonth.toISOString());
}

main();
