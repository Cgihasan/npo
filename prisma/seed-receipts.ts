const XLSX = require('xlsx');
const path = require('path');

// Prisma client setup
const { PrismaClient } = require('@generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

// Excel serial date to JS Date
function excelDateToJSDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(Date.UTC(1970, 0, utcDays));
  return date;
}

// Clean string (handle special chars, spaces)
function cleanStr(s) {
  if (!s) return null;
  return s.toString().trim();
}

async function main() {
// Clean existing receipts and transactions to allow re-run
   await prisma.transaction.deleteMany();
   await prisma.receipt.deleteMany();
   console.log('Cleared existing transactions and receipts.');

   const wb = XLSX.readFile(path.join(__dirname, '..', 'Receipts_data.xlsx'));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  console.log(`Total rows: ${rows.length}`);

  // Fetch all accounts and donors
  const accounts = await prisma.account.findMany({ select: { id: true, name: true } });
  const accountMap = Object.fromEntries(accounts.map(a => [a.name.trim().toLowerCase(), a.id]));

  const donors = await prisma.donor.findMany({ select: { id: true, name: true } });
  const donorMap = Object.fromEntries(donors.map(d => [d.name.trim().toLowerCase(), d.id]));

  const missingAccounts = new Set();
  const missingDonors = new Set();
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateRaw = row['Date'];
    const typeName = cleanStr(row['type']);
    const donorName = cleanStr(row["Donar's Name"]);
    const narration = cleanStr(row['Description']);
    const amount = parseFloat(row[' Amount Cr. ']) || parseFloat(row['Amount Cr.']);
    const ledgerName = cleanStr(row['Bank / Cash Ledger']);

    if (!amount || amount <= 0) {
      skipped++;
      continue;
    }

    // Map account: ledger → accountId (for debit)
    // Map income account from the "type" column (for credit)
    const ledgerAccountId = accountMap[ledgerName?.toLowerCase()];
    const incomeAccountId = accountMap[typeName?.toLowerCase()];

    if (!ledgerAccountId) {
      missingAccounts.add(ledgerName);
      skipped++;
      continue;
    }

    if (!incomeAccountId) {
      missingAccounts.add(typeName);
      skipped++;
      continue;
    }

    // Map donor
    let donorId = null;
    if (donorName && donorName !== '-') {
      donorId = donorMap[donorName.toLowerCase()];
      if (!donorId) {
        missingDonors.add(donorName);
      }
    }

    // Convert date
    const date = dateRaw ? excelDateToJSDate(dateRaw) : new Date();
    const dateStr = date.toISOString();

    // Generate receipt number
    const receiptNo = `R-${String(i + 1).padStart(5, '0')}`;

    try {
      const receipt = await prisma.receipt.create({
        data: {
          receiptNo,
          date: dateStr,
          accountId: ledgerAccountId,
          donorId,
          type: typeName || 'RECEIPT',
          category: cleanStr(row['Account Category']),
          accountType: cleanStr(row['Account Type']),
          eventName: cleanStr(row['Events Name']),
          amount,
          paymentMode: ledgerName || 'CASH',
          narration,
        },
      });

      // Create two transaction entries (double-entry)
      await prisma.transaction.createMany({
        data: [
          {
            accountId: ledgerAccountId,
            debit: amount,
            credit: 0,
            refType: 'RECEIPT',
            refId: receipt.id,
            date: dateStr,
          },
          {
            accountId: incomeAccountId,
            debit: 0,
            credit: amount,
            refType: 'RECEIPT',
            refId: receipt.id,
            date: dateStr,
          },
        ],
      });
      inserted++;
    } catch (e) {
      console.error(`Error on row ${i + 1}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  if (missingAccounts.size > 0) console.log('Missing accounts:', [...missingAccounts]);
  if (missingDonors.size > 0) console.log('Missing donors:', [...missingDonors]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());