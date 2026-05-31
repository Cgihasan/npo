-- Add indexes for Transaction model
CREATE INDEX IF NOT EXISTS "Transaction_refId_refType_idx" ON "Transaction" ("refId", "refType");
CREATE INDEX IF NOT EXISTS "Transaction_accountId_date_idx" ON "Transaction" ("accountId", "date");
CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction" ("date");
CREATE INDEX IF NOT EXISTS "Transaction_accountId_idx" ON "Transaction" ("accountId");

-- Add indexes for Receipt model
CREATE INDEX IF NOT EXISTS "Receipt_date_idx" ON "Receipt" ("date");
CREATE INDEX IF NOT EXISTS "Receipt_accountId_idx" ON "Receipt" ("accountId");
CREATE INDEX IF NOT EXISTS "Receipt_donorId_idx" ON "Receipt" ("donorId");
CREATE INDEX IF NOT EXISTS "Receipt_receiptNo_idx" ON "Receipt" ("receiptNo");

-- Add indexes for Payment model
CREATE INDEX IF NOT EXISTS "Payment_date_idx" ON "Payment" ("date");
CREATE INDEX IF NOT EXISTS "Payment_accountId_idx" ON "Payment" ("accountId");
CREATE INDEX IF NOT EXISTS "Payment_voucherNo_idx" ON "Payment" ("voucherNo");

-- Add indexes for ContraEntry model
CREATE INDEX IF NOT EXISTS "ContraEntry_date_idx" ON "ContraEntry" ("date");
CREATE INDEX IF NOT EXISTS "ContraEntry_fromAccountId_idx" ON "ContraEntry" ("fromAccountId");
CREATE INDEX IF NOT EXISTS "ContraEntry_toAccountId_idx" ON "ContraEntry" ("toAccountId");

-- Add indexes for JournalVoucher model
CREATE INDEX IF NOT EXISTS "JournalVoucher_date_idx" ON "JournalVoucher" ("date");
CREATE INDEX IF NOT EXISTS "JournalVoucher_voucherNo_idx" ON "JournalVoucher" ("voucherNo");

-- Add indexes for DeletionRequest model
CREATE INDEX IF NOT EXISTS "DeletionRequest_voucherId_idx" ON "DeletionRequest" ("voucherId");
