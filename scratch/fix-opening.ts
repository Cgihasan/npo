import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
  const prisma = new PrismaClient({ adapter });

  // Find Cash In Hand and City Union Bank accounts
  const cashAcct = await prisma.account.findFirst({ where: { accountType: "Cash In Hand" } });
  const bankAcct = await prisma.account.findFirst({ where: { accountType: "City Union Bank" } });

  if (!cashAcct || !bankAcct) {
    console.log("Accounts not found");
    return;
  }

  console.log("Cash In Hand ID:", cashAcct.id);
  console.log("City Union Bank ID:", bankAcct.id);

  // Check current balances before fix
  const allTxUpToDec = await prisma.transaction.findMany({
    where: { date: { lte: new Date("2017-12-31T23:59:59.999Z") } },
  });

  const cashDr = allTxUpToDec.filter(t => t.accountId === cashAcct.id).reduce((s, t) => s + t.debit, 0);
  const cashCr = allTxUpToDec.filter(t => t.accountId === cashAcct.id).reduce((s, t) => s + t.credit, 0);
  const bankDr = allTxUpToDec.filter(t => t.accountId === bankAcct.id).reduce((s, t) => s + t.debit, 0);
  const bankCr = allTxUpToDec.filter(t => t.accountId === bankAcct.id).reduce((s, t) => s + t.credit, 0);

  console.log("\n=== BEFORE FIX ===");
  console.log(`Cash In Hand: dr=${cashDr}, cr=${cashCr}, balance=${cashDr - cashCr}`);
  console.log(`City Union Bank: dr=${bankDr}, cr=${bankCr}, balance=${bankDr - bankCr}`);
  console.log(`Total Opening: ${(cashDr - cashCr) + (bankDr - bankCr)}`);

  // Add a correction journal entry reversing the contra:
  // Dr: City Union Bank 2,000
  // Cr: Cash In Hand 2,000
  // This reverses the original transfer from Bank to Cash

  // First, find or create a JournalVoucher for this correction
  const voucherDate = new Date("2017-12-31");
  
  // Check if correction already exists
  const existing = await prisma.journalVoucher.findFirst({
    where: { narration: "Correction - Reversal of Cash to Bank transfer" }
  });

  if (existing) {
    console.log("\nCorrection entry already exists:", existing.voucherNo);
  } else {
    const result = await prisma.$transaction(async (tx) => {
      // Generate voucher number
      const lastVoucher = await tx.journalVoucher.findFirst({
        where: {
          date: { gte: new Date("2017-01-01"), lte: new Date("2017-12-31") },
        },
        orderBy: { voucherNo: "desc" },
      });

      let nextNumber = 1;
      if (lastVoucher) {
        const parts = lastVoucher.voucherNo.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) nextNumber = lastSeq + 1;
      }

      const voucherNo = `JV-2017-${nextNumber.toString().padStart(3, "0")}`;

      const voucher = await tx.journalVoucher.create({
        data: {
          voucherNo,
          date: voucherDate,
          narration: "Correction - Reversal of Cash to Bank transfer",
        },
      });

      // Dr: City Union Bank 2,000
      await tx.transaction.create({
        data: {
          accountId: bankAcct.id,
          debit: 2000,
          credit: 0,
          refType: "JOURNAL",
          refId: voucher.id,
          date: voucherDate,
        },
      });

      // Cr: Cash In Hand 2,000
      await tx.transaction.create({
        data: {
          accountId: cashAcct.id,
          debit: 0,
          credit: 2000,
          refType: "JOURNAL",
          refId: voucher.id,
          date: voucherDate,
        },
      });

      return voucher;
    });

    console.log("\n✓ Created correction entry:", result.voucherNo);
  }

  // Verify the fix
  const allTxAfterFix = await prisma.transaction.findMany({
    where: { date: { lte: new Date("2017-12-31T23:59:59.999Z") } },
  });

  const cashDrAfter = allTxAfterFix.filter(t => t.accountId === cashAcct.id).reduce((s, t) => s + t.debit, 0);
  const cashCrAfter = allTxAfterFix.filter(t => t.accountId === cashAcct.id).reduce((s, t) => s + t.credit, 0);
  const bankDrAfter = allTxAfterFix.filter(t => t.accountId === bankAcct.id).reduce((s, t) => s + t.debit, 0);
  const bankCrAfter = allTxAfterFix.filter(t => t.accountId === bankAcct.id).reduce((s, t) => s + t.credit, 0);

  console.log("\n=== AFTER FIX (Dec 31, 2017) ===");
  console.log(`Cash In Hand: dr=${cashDrAfter}, cr=${cashCrAfter}, balance=${cashDrAfter - cashCrAfter}`);
  console.log(`City Union Bank: dr=${bankDrAfter}, cr=${bankCrAfter}, balance=${bankDrAfter - bankCrAfter}`);
  console.log(`Total Opening: ${(cashDrAfter - cashCrAfter) + (bankDrAfter - bankCrAfter)}`);

  // Now verify the Jan 2018 report
  const janStart = new Date("2018-01-01");
  const janEnd = new Date("2018-01-31T23:59:59.999Z");

  const janOpening = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: { where: { date: { lt: janStart } }, select: { debit: true, credit: true } },
    },
  });

  console.log("\n=== REPORT: Jan 1-31, 2018 (AFTER FIX) ===");
  let totOpen = 0;
  for (const acct of janOpening) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totOpen += bal;
    console.log(`  Opening ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total Opening: ${totOpen}`);

  // Direct Incomes
  const janReceipts = await prisma.receipt.findMany({
    where: { date: { gte: janStart, lte: janEnd } },
    select: { amount: true, accountType: true },
  });
  const diTotal = janReceipts.reduce((s, r) => s + r.amount, 0);
  console.log(`  Direct Incomes: ${diTotal}`);

  // Closing Balance
  const janClosing = await prisma.account.findMany({
    where: { type: { in: ["CASH", "BANK"] } },
    include: {
      transactions: { where: { date: { lte: janEnd } }, select: { debit: true, credit: true } },
    },
  });

  let totClose = 0;
  for (const acct of janClosing) {
    const dr = acct.transactions.reduce((s, t) => s + t.debit, 0);
    const cr = acct.transactions.reduce((s, t) => s + t.credit, 0);
    const bal = dr - cr;
    totClose += bal;
    console.log(`  Closing ${acct.accountType}: ${bal}`);
  }
  console.log(`  Total Closing: ${totClose}`);

  // Payments
  const janPayments = await prisma.payment.findMany({
    where: { date: { gte: janStart, lte: janEnd } },
    select: { amount: true },
  });
  const payTotal = janPayments.reduce((s, p) => s + p.amount, 0);
  console.log(`  Indirect Expenses: ${payTotal}`);

  console.log(`\n  Total Receipts: ${totOpen + diTotal}`);
  console.log(`  Total Payments: ${payTotal + totClose}`);
  console.log(`  Balanced: ${Math.abs((totOpen + diTotal) - (payTotal + totClose)) < 0.01 ? "YES ✓" : "NO ✗"}`);

  await prisma.$disconnect();
}

main().catch(console.error);
