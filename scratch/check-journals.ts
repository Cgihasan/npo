import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  // All journal transactions with account info
  const journalTx = await prisma.transaction.findMany({
    where: { refType: "JOURNAL" },
    include: { account: true },
    orderBy: { date: "asc" },
  });

  console.log("=== Journal Transactions ===");
  for (const tx of journalTx) {
    console.log(`${tx.date} | ${tx.account.type} | ${tx.account.accountType} | dr=${tx.debit} | cr=${tx.credit}`);
  }

  // Check total debits & credits by account type for journals
  console.log("\n=== Journal: Debits by Account Type ===");
  const drByType = new Map<string, number>();
  for (const tx of journalTx) {
    drByType.set(tx.account.type, (drByType.get(tx.account.type) || 0) + tx.debit);
  }
  for (const [type, total] of drByType) {
    console.log(`  Dr ${type}: ${total}`);
  }

  console.log("\n=== Journal: Credits by Account Type ===");
  const crByType = new Map<string, number>();
  for (const tx of journalTx) {
    crByType.set(tx.account.type, (crByType.get(tx.account.type) || 0) + tx.credit);
  }
  for (const [type, total] of crByType) {
    console.log(`  Cr ${type}: ${total}`);
  }

  // All contra transactions with account info
  const contraTx = await prisma.transaction.findMany({
    where: { refType: "CONTRA" },
    include: { account: true },
    orderBy: { date: "asc" },
  });

  console.log("\n=== Contra Transactions ===");
  for (const tx of contraTx) {
    console.log(`${tx.date} | ${tx.account.type} | ${tx.account.accountType} | dr=${tx.debit} | cr=${tx.credit}`);
  }

  // Total receipts during FY 2017-18 from both Receipt table and Transaction table (Cash/Bank debits)
  const fyStart = new Date("2017-04-01");
  const fyEnd = new Date("2018-03-31T23:59:59.999Z");

  const totalReceiptsFromTable = await prisma.receipt.aggregate({
    where: { date: { gte: fyStart, lte: fyEnd } },
    _sum: { amount: true },
  });
  console.log(`\nReceipts from Receipt table (FY 2017-18): ${totalReceiptsFromTable._sum.amount}`);

  const cashBankReceiptTx = await prisma.transaction.aggregate({
    where: {
      refType: "RECEIPT",
      date: { gte: fyStart, lte: fyEnd },
      debit: { gt: 0 },
      account: { type: { in: ["CASH", "BANK"] } },
    },
    _sum: { debit: true },
  });
  console.log(`Cash/Bank debit from RECEIPT tx (FY 2017-18): ${cashBankReceiptTx._sum.debit}`);

  const totalPaymentsFromTable = await prisma.payment.aggregate({
    where: { date: { gte: fyStart, lte: fyEnd } },
    _sum: { amount: true },
  });
  console.log(`Payments from Payment table (FY 2017-18): ${totalPaymentsFromTable._sum.amount}`);

  const cashBankPaymentTx = await prisma.transaction.aggregate({
    where: {
      refType: "PAYMENT",
      date: { gte: fyStart, lte: fyEnd },
      credit: { gt: 0 },
      account: { type: { in: ["CASH", "BANK"] } },
    },
    _sum: { credit: true },
  });
  console.log(`Cash/Bank credit from PAYMENT tx (FY 2017-18): ${cashBankPaymentTx._sum.credit}`);

  // What about journal transactions that affect Cash/Bank?
  const journalCashBank = await prisma.transaction.findMany({
    where: {
      refType: "JOURNAL",
      date: { gte: fyStart, lte: fyEnd },
      account: { type: { in: ["CASH", "BANK"] } },
    },
    include: { account: true },
  });
  console.log(`\nJournal transactions affecting Cash/Bank (FY 2017-18):`);
  for (const tx of journalCashBank) {
    console.log(`  ${tx.date} | ${tx.account.accountType} | dr=${tx.debit} | cr=${tx.credit}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
