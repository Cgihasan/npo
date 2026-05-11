-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "donorId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "eventName" TEXT,
    "amount" REAL NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT,
    "accountId" TEXT NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("accountId", "accountType", "amount", "attachment", "category", "createdAt", "date", "donorId", "eventName", "id", "narration", "paymentMode", "receiptNo", "referenceNo", "type") SELECT "accountId", "accountType", "amount", "attachment", "category", "createdAt", "date", "donorId", "eventName", "id", "narration", "paymentMode", "receiptNo", "referenceNo", "type" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
