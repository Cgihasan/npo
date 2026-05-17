/*
  Warnings:

  - You are about to drop the column `name` on the `Account` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "balance" REAL NOT NULL DEFAULT 0
);

-- Migrate data: copy name to accountType for CASH/BANK accounts
INSERT INTO "new_Account" ("id", "type", "category", "accountType", "balance")
SELECT "id", "type",
  CASE
    WHEN "type" IN ('CASH', 'BANK') THEN NULL
    ELSE NULL
  END AS "category",
  CASE
    WHEN "type" IN ('CASH', 'BANK') THEN "name"
    ELSE NULL
  END AS "accountType",
  "balance"
FROM "Account";

DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
