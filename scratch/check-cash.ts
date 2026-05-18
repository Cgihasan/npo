import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  // Find Cash In Hand account
  const cashAcct = await prisma.account.findFirst({ where: { accountType: "Cash In Hand" } });
  if (!cashAcct) { console.log("Cash In Hand not found"); return; }
  console.log("Cash In Hand account ID:", cashAcct.id);

  // All transactions for Cash In Hand up to Dec 31, 2017
  const decEnd = new Date("2017-12-31T23:59:59.999Z");
  const cashTxUpToDec = await prisma.transaction.findMany({
    where: {
      accountId: cashAcct.id,
      date: { lte: decEnd }
    },
    orderBy: { date: "asc" },
  });

  console.log("\n=== All Cash In Hand transactions up to Dec 31, 2017 ===");
  console.log("Count:", cashTxUpToDec.length);
  let runningBal = 0;
  for (const tx of cashTxUpToDec) {
    runningBal += tx.debit - tx.credit;
    console.log(`${tx.date} | refType=${tx.refType} | refId=${tx.refId.substring(0,8)}... | dr=${tx.debit} | cr=${tx.credit} | running=${runningBal}`);
  }
  console.log("\nFinal Cash In Hand balance at Dec 31, 2017:", runningBal);

  // Now find all receipts that use Cash In Hand as the asset account (debit side)
  const cashReceipts = await prisma.receipt.findMany({
    where: {
      accountId: cashAcct.id,
      date: { lte: decEnd }
    },
    orderBy: { date: "asc" },
    select: { date: true, receiptNo: true, amount: true, accountType: true, type: true }
  });

  console.log("\n=== Receipts debiting Cash In Hand (up to Dec 31, 2017) ===");
  let totalReceiptCash = 0;
  for (const r of cashReceipts) {
    totalReceiptCash += r.amount;
    console.log(`${r.date} | ${r.receiptNo} | ${r.accountType || r.type} | amount=${r.amount}`);
  }
  console.log("Total receipts into Cash:", totalReceiptCash);

  // All payments that use Cash In Hand (credit side)
  const cashPayments = await prisma.payment.findMany({
    where: {
      accountId: cashAcct.id,
      date: { lte: decEnd }
    },
    orderBy: { date: "asc" },
    select: { date: true, voucherNo: true, amount: true, accountType: true, type: true }
  });

  console.log("\n=== Payments from Cash In Hand (up to Dec 31, 2017) ===");
  let totalPaymentCash = 0;
  for (const p of cashPayments) {
    totalPaymentCash += p.amount;
    console.log(`${p.date} | ${p.voucherNo} | ${p.accountType || p.type} | amount=${p.amount}`);
  }
  console.log("Total payments from Cash:", totalPaymentCash);

  // Contra entries involving Cash In Hand
  const contraTxs = await prisma.transaction.findMany({
    where: {
      accountId: cashAcct.id,
      refType: "CONTRA",
      date: { lte: decEnd }
    }
  });
  console.log("\n=== Contra entries for Cash In Hand ===");
  for (const c of contraTxs) {
    console.log(`${c.date} | dr=${c.debit} | cr=${c.credit}`);
  }

  // Journal entries for Cash In Hand
  const journalTxs = await prisma.transaction.findMany({
    where: {
      accountId: cashAcct.id,
      refType: "JOURNAL",
      date: { lte: decEnd }
    }
  });
  console.log("\n=== Journal entries for Cash In Hand ===");
  for (const j of journalTxs) {
    console.log(`${j.date} | dr=${j.debit} | cr=${j.credit}`);
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  const totalDebit = cashTxUpToDec.reduce((s, t) => s + t.debit, 0);
  const totalCredit = cashTxUpToDec.reduce((s, t) => s + t.credit, 0);
  console.log(`Total Debit: ${totalDebit}`);
  console.log(`Total Credit: ${totalCredit}`);
  console.log(`Net Balance: ${totalDebit - totalCredit}`);

  await prisma.$disconnect();
}

main().catch(console.error);
