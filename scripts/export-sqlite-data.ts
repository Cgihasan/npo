// Run BEFORE switching to PostgreSQL:  npx tsx scripts/export-sqlite-data.ts
// Exports ALL data from the SQLite dev.db to a JSON file for PostgreSQL import.
// Uses better-sqlite3 directly (no Prisma dependency) so it works independently.

import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const dbPath = path.resolve("dev.db");

if (!fs.existsSync(dbPath)) {
  console.error(`❌ SQLite database not found at ${dbPath}`);
  console.error("   Make sure you're in the project root and dev.db exists.");
  process.exit(1);
}

const db = new Database(dbPath);

function exportTable(tableName: string): any[] {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  return rows;
}

function main() {
  console.log("📤 Exporting data from SQLite...\n");

  // Tables to export (ordered by dependency)
  const tables = [
    "User",
    "Donor",
    "Vendor",
    "Account",
    "Receipt",
    "Payment",
    "JournalVoucher",
    "ContraEntry",
    "Transaction",
  ];

  const data: Record<string, any[]> = {};

  for (const table of tables) {
    try {
      const rows = exportTable(table);
      data[table] = rows;
      console.log(`  ✓ ${table}: ${rows.length} records`);
    } catch (err) {
      console.log(`  - ${table}: not found (skipping)`);
    }
  }

  const outputPath = "sqlite-export.json";
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  
  console.log(`\n✅ Data exported to ${outputPath} (${fileSize} KB)`);

  db.close();
}

main();
