// Run AFTER setting up Neon and running "prisma migrate dev":
//   npx tsx scripts/import-postgres-data.ts
// Imports data from sqlite-export.json into your Neon PostgreSQL database.
// Requires DATABASE_URL environment variable to be set.

import { PrismaClient } from "@/prisma/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const exportPath = path.resolve("sqlite-export.json");

  if (!fs.existsSync(exportPath)) {
    console.error(`❌ Export file not found at ${exportPath}`);
    console.error("   Run 'npx tsx scripts/export-sqlite-data.ts' first to create it.");
    process.exit(1);
  }

  console.log("📥 Importing data into PostgreSQL...\n");

  const data = JSON.parse(fs.readFileSync(exportPath, "utf-8"));

  // Import tables in dependency order
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

  for (const table of tables) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      console.log(`  - ${table}: no data (skipping)`);
      continue;
    }

    try {
      // Use raw SQL to insert all rows for this table
      const model = (prisma as any)[table[0].toLowerCase() + table.slice(1)];
      if (!model) {
        console.log(`  - ${table}: Prisma model not found (skipping)`);
        continue;
      }

      // Insert in batches of 50 to avoid overwhelming the connection
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        // Use createMany for bulk insert (skip if not supported)
        // Otherwise fall back to individual creates in a transaction
        try {
          await prisma.$transaction(
            batch.map((row: any) =>
              model.create({ data: row })
            )
          );
        } catch (err: any) {
          // If batch fails, try individual inserts
          for (const row of batch) {
            try {
              await model.create({ data: row });
            } catch (rowErr: any) {
              console.log(`  ⚠️  Skipping ${table} row (${row.id || "unknown"}): ${rowErr.message}`);
            }
          }
        }

        inserted += batch.length;
        console.log(`  ✓ ${table}: ${inserted}/${rows.length} records`);
      }
    } catch (err: any) {
      console.log(`  ❌ ${table}: failed - ${err.message}`);
    }
  }

  console.log("\n✅ Import complete!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Import failed:", err.message);
  process.exit(1);
});
