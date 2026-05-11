/*
  Warnings:

  - You are about to drop the column `vendorId` on the `Payment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "amount" REAL NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "chequeNo" TEXT,
    "bankName" TEXT,
    "accountId" TEXT NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Payment" ("accountId", "accountType", "amount", "attachment", "bankName", "category", "chequeNo", "createdAt", "date", "id", "narration", "paymentMode", "status", "type", "voucherNo") SELECT "accountId", "accountType", "amount", "attachment", "bankName", "category", "chequeNo", "createdAt", "date", "id", "narration", "paymentMode", "status", "type", "voucherNo" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_voucherNo_key" ON "Payment"("voucherNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
