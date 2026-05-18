const Database = require('better-sqlite3');
const db = new Database('/home/hasan/npo/dev.db');

// Opening balance: Cash/Bank transactions before 2018-01-01
const opening = db.prepare(`SELECT a.id, a.accountType, a.type, SUM(t.debit) as totalDebit, SUM(t.credit) as totalCredit 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date < '2018-01-01T00:00:00.000Z' 
  GROUP BY a.id`).all();
console.log('Opening Balance (before 2018-01-01):');
let totalOpen = 0;
opening.forEach(r => {
  const bal = (r.totalDebit || 0) - (r.totalCredit || 0);
  totalOpen += bal;
  console.log(`  ${r.accountType}: Debit=${r.totalDebit}, Credit=${r.totalCredit}, Balance=${bal}`);
});
console.log(`Total Opening Balance: ${totalOpen}`);

// Closing balance: Cash/Bank transactions up to 2018-01-31
const closing = db.prepare(`SELECT a.id, a.accountType, a.type, SUM(t.debit) as totalDebit, SUM(t.credit) as totalCredit 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date <= '2018-01-31T23:59:59.999Z' 
  GROUP BY a.id`).all();
console.log('\nClosing Balance (up to 2018-01-31):');
let totalClose = 0;
closing.forEach(r => {
  const bal = (r.totalDebit || 0) - (r.totalCredit || 0);
  totalClose += bal;
  console.log(`  ${r.accountType}: Debit=${r.totalDebit}, Credit=${r.totalCredit}, Balance=${bal}`);
});
console.log(`Total Closing Balance: ${totalClose}`);

// Net change in Cash/Bank during Jan 2018
console.log(`\nNet change in Jan 2018: ${totalClose - totalOpen}`);

// Receipts in Jan 2018 from Receipt table
const receipts = db.prepare(`SELECT accountType, category, SUM(amount) as total 
  FROM "Receipt" 
  WHERE date >= '2018-01-01T00:00:00.000Z' AND date <= '2018-01-31T23:59:59.999Z' 
  GROUP BY accountType`).all();
console.log('\nReceipts in Jan 2018:');
let totalReceipts = 0;
receipts.forEach(r => {
  totalReceipts += r.total;
  console.log(`  ${r.accountType || r.category}: ${r.total}`);
});
console.log(`Total Receipts in Jan 2018: ${totalReceipts}`);

// Payments in Jan 2018 from Payment table
const payments = db.prepare(`SELECT accountType, category, SUM(amount) as total 
  FROM "Payment" 
  WHERE date >= '2018-01-01T00:00:00.000Z' AND date <= '2018-01-31T23:59:59.999Z' 
  GROUP BY accountType`).all();
console.log('\nPayments in Jan 2018:');
let totalPayments = 0;
payments.forEach(r => {
  totalPayments += r.total;
  console.log(`  ${r.accountType || r.category}: ${r.total}`);
});
console.log(`Total Payments in Jan 2018: ${totalPayments}`);

// Verification: Opening + Receipts = Payments + Closing?
console.log('\n=== VERIFICATION ===');
const lhs = totalOpen + totalReceipts;
const rhs = totalPayments + totalClose;
console.log(`Opening + Receipts: ${totalOpen} + ${totalReceipts} = ${lhs}`);
console.log(`Payments + Closing: ${totalPayments} + ${totalClose} = ${rhs}`);
console.log(`Balanced? ${lhs === rhs ? 'YES' : 'NO (diff: ' + (lhs - rhs) + ')'}`);

// Check journal transactions that might affect cash/bank in Jan 2018
const cashBankJan = db.prepare(`SELECT t.debit, t.credit, t.refType, a.accountType 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date >= '2018-01-01T00:00:00.000Z' AND t.date <= '2018-01-31T23:59:59.999Z'`).all();
console.log('\nCash/Bank transactions in Jan 2018:');
cashBankJan.forEach(r => {
  console.log(`  ${r.accountType}: refType=${r.refType}, debit=${r.debit}, credit=${r.credit}`);
});

// Also let's check Dec 2017 situation
const decClosing = db.prepare(`SELECT a.id, a.accountType, a.type, SUM(t.debit) as totalDebit, SUM(t.credit) as totalCredit 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date < '2018-01-01T00:00:00.000Z' 
  GROUP BY a.id`).all();
console.log('\nDec 2017 Closing Balance (same as opening for Jan 2018):');
let totalDec = 0;
decClosing.forEach(r => {
  const bal = (r.totalDebit || 0) - (r.totalCredit || 0);
  totalDec += bal;
  console.log(`  ${r.accountType}: Balance=${bal}`);
});

// Now let's check what the report would show for FY 2017-18 (Apr 2017 - Mar 2018)
const fyStart = '2017-04-01T00:00:00.000Z';
const fyEnd = '2018-03-31T23:59:59.999Z';

const fyOpen = db.prepare(`SELECT a.id, a.accountType, SUM(t.debit) as totalDebit, SUM(t.credit) as totalCredit 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date < '2017-04-01T00:00:00.000Z' 
  GROUP BY a.id`).all();
console.log('\nFY 2017-18 Opening Balance (before Apr 2017):');
let totalFYOpen = 0;
fyOpen.forEach(r => {
  const bal = (r.totalDebit || 0) - (r.totalCredit || 0);
  totalFYOpen += bal;
  console.log(`  ${r.accountType}: Balance=${bal}`);
});
console.log(`Total FY Opening: ${totalFYOpen}`);

const fyClose = db.prepare(`SELECT a.id, a.accountType, SUM(t.debit) as totalDebit, SUM(t.credit) as totalCredit 
  FROM "Transaction" t 
  JOIN "Account" a ON a.id = t.accountId 
  WHERE a.type IN ('CASH','BANK') AND t.date <= '2018-03-31T23:59:59.999Z' 
  GROUP BY a.id`).all();
console.log('\nFY 2017-18 Closing Balance (up to Mar 2018):');
let totalFYClose = 0;
fyClose.forEach(r => {
  const bal = (r.totalDebit || 0) - (r.totalCredit || 0);
  totalFYClose += bal;
  console.log(`  ${r.accountType}: Balance=${bal}`);
});
console.log(`Total FY Closing: ${totalFYClose}`);
