-- AlterTable
ALTER TABLE "Account" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "JournalVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalVoucher_voucherNo_key" ON "JournalVoucher"("voucherNo");
