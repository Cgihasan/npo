-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "vendorId" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("accountId", "amount", "attachment", "bankName", "chequeNo", "createdAt", "date", "id", "narration", "paymentMode", "status", "type", "vendorId", "voucherNo") SELECT "accountId", "amount", "attachment", "bankName", "chequeNo", "createdAt", "date", "id", "narration", "paymentMode", "status", "type", "vendorId", "voucherNo" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_voucherNo_key" ON "Payment"("voucherNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
