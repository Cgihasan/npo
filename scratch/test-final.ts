import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function runReport(label: string, startDate: string, endDate: string) {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  console.log(`\n\n========== ${label} (${startDate} to ${endDate}) ==========`);

  // --- Opening Balance ---
  const openingAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: { where: { date: { lt: start } }, select: { debit: true, credit: true } },
    },
  });

  let totalOpen = 0;
  const openDetails: any[] = [];
  for (const acct of openingAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalOpen += bal;
    openDetails.push({ name: acct.accountType || acct.type, value: bal });
  }
  console.log("OPENING BALANCE:", openDetails, "Total:", totalOpen);

  // --- Direct Incomes ---
  const receipts = await prisma.receipt.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, accountType: true, category: true },
  });

  const incomesMap = new Map<string, number>();
  receipts.forEach(r => {
    const label = r.accountType || r.category || "Other Income";
    incomesMap.set(label, (incomesMap.get(label) || 0) + r.amount);
  });
  const directIncomes = Array.from(incomesMap.entries()).map(([n, v]) => ({ name: n, value: v }));
  const totalIncomes = directIncomes.reduce((s, i) => s + i.value, 0);
  console.log("DIRECT INCOMES:", directIncomes, "Total:", totalIncomes);

  // --- Payments (from Payment table) ---
  const payments = await prisma.payment.findMany({
    where: { date: { gte: start, lte: end } },
    select: { amount: true, category: true, accountType: true },
  });

  // --- Journal expense transactions ---
  const journalExpenseTx = await prisma.transaction.findMany({
    where: {
      refType: "JOURNAL",
      date: { gte: start, lte: end },
      debit: { gt: 0 },
      account: { type: { in: ["EXPENSE", "ASSET"] } },
    },
    select: { debit: true, account: { select: { accountType: true, category: true } } },
  });

  // Group payments
  const fixedAssetsMap = new Map<string, number>();
  const currentAssetsMap = new Map<string, number>();
  const indirectExpensesMap = new Map<string, number>();

  function addToMap(accountType: string | null, category: string | null, amount: number) {
    const cat = category || "Indirect Expenses";
    const label = accountType || category || "Other Expenses";
    if (cat === "Fixed Assets") fixedAssetsMap.set(label, (fixedAssetsMap.get(label) || 0) + amount);
    else if (cat === "Deposits (Assets)") currentAssetsMap.set(label, (currentAssetsMap.get(label) || 0) + amount);
    else indirectExpensesMap.set(label, (indirectExpensesMap.get(label) || 0) + amount);
  }

  payments.forEach(p => addToMap(p.accountType, p.category, p.amount));
  journalExpenseTx.forEach(tx => addToMap(tx.account.accountType, tx.account.category, tx.debit));

  const fixedAssets = Array.from(fixedAssetsMap.entries()).map(([n, v]) => ({ name: n, value: v }));
  const currentAssets = Array.from(currentAssetsMap.entries()).map(([n, v]) => ({ name: n, value: v }));
  const indirectExpenses = Array.from(indirectExpensesMap.entries()).map(([n, v]) => ({ name: n, value: v }));

  const totalFixed = fixedAssets.reduce((s, i) => s + i.value, 0);
  const totalCurrent = currentAssets.reduce((s, i) => s + i.value, 0);
  const totalIndirect = indirectExpenses.reduce((s, i) => s + i.value, 0);

  console.log("FIXED ASSETS:", fixedAssets, "Total:", totalFixed);
  console.log("CURRENT ASSETS:", currentAssets, "Total:", totalCurrent);
  console.log("INDIRECT EXPENSES:", indirectExpenses, "Total:", totalIndirect);

  // --- Closing Balance ---
  const closingAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: { where: { date: { lte: end } }, select: { debit: true, credit: true } },
    },
  });

  let totalClose = 0;
  const closeDetails: any[] = [];
  for (const acct of closingAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalClose += bal;
    closeDetails.push({ name: acct.accountType || acct.type, value: bal });
  }
  console.log("CLOSING BALANCE:", closeDetails, "Total:", totalClose);

  // Totals & verification
  const totReceipts = totalOpen + totalIncomes;
  const totPayments = totalFixed + totalCurrent + totalIndirect + totalClose;
  console.log(`\nTOTAL RECEIPTS: ${totReceipts} = ${totalOpen} + ${totalIncomes}`);
  console.log(`TOTAL PAYMENTS: ${totPayments} = ${totalFixed} + ${totalCurrent} + ${totalIndirect} + ${totalClose}`);
  console.log(`BALANCED: ${Math.abs(totReceipts - totPayments) < 0.01 ? "YES ✓" : "NO ✗ (diff: " + (totReceipts - totPayments) + ")"}`);

  await prisma.$disconnect();
}

async function main() {
  // Test the exact example user mentioned
  await runReport("JAN 2018 (User's Example)", "2018-01-01", "2018-01-31");
  
  // Test FY 2017-18 (which includes Dec 2017 data)
  await runReport("FY 2017-18", "2017-04-01", "2018-03-31");

  // Test Dec 2017
  await runReport("DEC 2017", "2017-12-01", "2017-12-31");
}

main().catch(console.error);
