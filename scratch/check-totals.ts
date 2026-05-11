import db from "../lib/db";

async function main() {
  const receipts = await db.receipt.findMany({
    select: { date: true, amount: true, receiptNo: true }
  });
  console.log("Receipts count:", receipts.length);
  console.log("Receipts sample:", receipts.slice(0, 5));

  const payments = await db.payment.findMany({
    select: { date: true, amount: true, voucherNo: true }
  });
  console.log("Payments count:", payments.length);
  console.log("Payments sample:", payments.slice(0, 5));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  console.log("Start of Month (UTC):", startOfMonth.toISOString());

  const receiptsThisMonth = await db.receipt.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { amount: true }
  });
  console.log("Receipts Sum this month:", receiptsThisMonth._sum.amount);

  const paymentsThisMonth = await db.payment.aggregate({
    where: { date: { gte: startOfMonth } },
    _sum: { amount: true }
  });
  console.log("Payments Sum this month:", paymentsThisMonth._sum.amount);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
