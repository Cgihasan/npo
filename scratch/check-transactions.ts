import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  // Get all Cash/Bank accounts
  const cashBankAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        orderBy: { date: "asc" },
        select: { date: true, debit: true, credit: true, refType: true },
      },
    },
  });

  console.log("=== Cash/Bank Accounts and Their Transactions ===");
  for (const acct of cashBankAccts) {
    console.log(`\nAccount: ${acct.accountType} (${acct.type})`);
    let runningBalance = 0;
    for (const tx of acct.transactions) {
      runningBalance += tx.debit - tx.credit;
      console.log(`  ${tx.date} | ref=${tx.refType} | dr=${tx.debit} | cr=${tx.credit} | bal=${runningBalance}`);
    }
    console.log(`  Final Balance: ${runningBalance}`);
  }

  // Check Receipt table date range
  const receiptDates = await prisma.receipt.aggregate({
    _min: { date: true },
    _max: { date: true },
  });
  console.log(`\nReceipts: ${receiptDates._min.date} to ${receiptDates._max.date}`);

  // Check Payment table date range
  const paymentDates = await prisma.payment.aggregate({
    _min: { date: true },
    _max: { date: true },
  });
  console.log(`Payments: ${paymentDates._min.date} to ${paymentDates._max.date}`);

  // Opening balance calculation for Jan 2018
  const startDate = new Date("2018-01-01");
  
  const openingAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lt: startDate } },
        select: { debit: true, credit: true },
      },
    },
  });

  console.log("\n=== Opening Balance (before Jan 1, 2018) ===");
  let totalOpen = 0;
  for (const acct of openingAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalOpen += bal;
    console.log(`  ${acct.accountType}: dr=${dr}, cr=${cr}, bal=${bal}`);
  }
  console.log(`  Total: ${totalOpen}`);

  // Closing balance for Dec 2017 (= opening for Jan 2018)
  const decEnd = new Date("2017-12-31T23:59:59.999Z");
  const closingDecAccts = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: {
        where: { date: { lte: decEnd } },
        select: { debit: true, credit: true },
      },
    },
  });

  console.log("\n=== Closing Balance (Dec 31, 2017) ===");
  let totalDecClose = 0;
  for (const acct of closingDecAccts) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totalDecClose += bal;
    console.log(`  ${acct.accountType}: dr=${dr}, cr=${cr}, bal=${bal}`);
  }
  console.log(`  Total: ${totalDecClose}`);

  // Also check if Dec closing = Jan opening 
  console.log(`\n  Opening(Jan) === Closing(Dec)? ${totalOpen === totalDecClose ? 'YES' : 'NO'}`);

  await prisma.$disconnect();
}

main().catch(console.error);
