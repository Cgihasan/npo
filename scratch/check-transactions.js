const Database = require('better-sqlite3');
const db = new Database('/home/hasan/npo/dev.db');

// All Cash/Bank transactions ordered by date
const all = db.prepare("SELECT t.date, a.accountType, a.type, t.debit, t.credit, t.refType FROM Transaction t JOIN Account a ON a.id = t.accountId WHERE a.type IN ('CASH','BANK') ORDER BY t.date").all();
console.log('All Cash/Bank transactions:');
all.forEach(r => console.log(r.date, r.accountType, 'type='+r.type, 'dr='+r.debit, 'cr='+r.credit, 'ref='+r.refType));

// Which accounts exist and their types
const accts = db.prepare("SELECT id, type, accountType, category FROM Account").all();
console.log('\nAll Accounts:');
accts.forEach(r => console.log(r.type, r.accountType, r.category));
