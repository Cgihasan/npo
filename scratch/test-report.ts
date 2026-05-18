import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  // Simulate the report for Jan 2018 (period: 2018-01-01 to 2018-01-31)
  const start = new Date("2018-01-01");
  const end = new Date("2018-01-31");
  end.setHours(23, 59, 59, 999);

  console.log("=== REPORT: Jan 1-31, 2018 ===");

  // Opening Balance
  const openingAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lt: start } },
        select: { debit: true, credit: true },
      },
    },
  });

  let totalOpen = 0;
  console.log("\nOpening Balance (before Jan 1, 2018):");
  for (const acct of openingAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalOpen += bal;
    console.log(`  ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total: ${totalOpen}`);

  // Direct Incomes
  const receipts = await prisma.receipt.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, accountType: true, category: true },
  });

  const incomes = new Map<string, number>();
  receipts.forEach(r => {
    const label = r.accountType || r.category || "Other Income";
    incomes.set(label, (incomes.get(label) || 0) + r.amount);
  });
  const directIncomesTotal = [...incomes.values()].reduce((s, v) => s + v, 0);
  console.log("\nDirect Incomes:");
  for (const [name, amount] of incomes) {
    console.log(`  ${name}: ${amount}`);
  }
  console.log(`  Total: ${directIncomesTotal}`);

  // Closing Balance
  const closingAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lte: end } },
        select: { debit: true, credit: true },
      },
    },
  });

  let totalClose = 0;
  console.log("\nClosing Balance (up to Jan 31, 2018):");
  for (const acct of closingAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalClose += bal;
    console.log(`  ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total: ${totalClose}`);

  // Payments
  const payments = await prisma.payment.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, category: true, accountType: true },
  });
  const paymentsTotal = payments.reduce((s, p) => s + p.amount, 0);
  console.log(`\nPayments Total: ${paymentsTotal}`);

  // Verification
  console.log("\n=== VERIFICATION ===");
  const totReceipts = totalOpen + directIncomesTotal;
  const totPayments = paymentsTotal + totalClose;
  console.log(`Total Receipts (Opening + Incomes): ${totReceipts}`);
  console.log(`Total Payments (Expenses + Closing): ${totPayments}`);
  console.log(`Balanced? ${totReceipts === totPayments ? "YES" : "NO"}`);

  // === Now test FY 2017-18 ===
  const fyStart = new Date("2017-04-01");
  const fyEnd = new Date("2018-03-31");
  fyEnd.setHours(23, 59, 59, 999);

  console.log("\n\n=== REPORT: FY 2017-18 (Apr 1, 2017 - Mar 31, 2018) ===");

  // Opening Balance for FY
  const fyOpenAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lt: fyStart } },
        select: { debit: true, credit: true },
      },
    },
  });

  let fyTotalOpen = 0;
  console.log("\nOpening Balance (before Apr 1, 2017):");
  for (const acct of fyOpenAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    fyTotalOpen += bal;
    console.log(`  ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total: ${fyTotalOpen}`);

  // FY Closing
  const fyCloseAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lte: fyEnd } },
        select: { debit: true, credit: true },
      },
    },
  });

  let fyTotalClose = 0;
  console.log("\nClosing Balance (up to Mar 31, 2018):");
  for (const acct of fyCloseAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    fyTotalClose += bal;
    console.log(`  ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total: ${fyTotalClose}`);

  // FY Receipts
  const fyReceipts = await prisma.receipt.findMany({
    where: { date: { gte: fyStart, lte: fyEnd } },
    select: { amount: true },
  });
  const fyReceiptsTotal = fyReceipts.reduce((s, r) => s + r.amount, 0);
  console.log(`\nDirect Incomes (FY): ${fyReceiptsTotal}`);

  // FY Payments  
  const fyPayments = await prisma.payment.findMany({
    where: { date: { gte: fyStart, lte: fyEnd } },
    select: { amount: true },
  });
  const fyPaymentsTotal = fyPayments.reduce((s, p) => s + p.amount, 0);
  console.log(`Payments (FY): ${fyPaymentsTotal}`);

  // Verify
  const fyTotReceipts = fyTotalOpen + fyReceiptsTotal;
  const fyTotPayments = fyPaymentsTotal + fyTotalClose;
  console.log(`\nTotal Receipts (Opening + Incomes): ${fyTotReceipts}`);
  console.log(`Total Payments (Expenses + Closing): ${fyTotPayments}`);
  console.log(`Balanced? ${fyTotReceipts === fyTotPayments ? "YES" : "NO (diff: " + (fyTotReceipts - fyTotPayments) + ")"}`);

  await prisma.$disconnect();
}

main().catch(console.error);
