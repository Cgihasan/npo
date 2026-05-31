-- Create VoucherType enum (if not exists) and DeletionRequest table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vouchertype') THEN
        CREATE TYPE "VoucherType" AS ENUM ('RECEIPT','PAYMENT','CONTRA','JOURNAL');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- Create DeletionRequest table if missing
CREATE TABLE IF NOT EXISTS "DeletionRequest" (
  "id" TEXT PRIMARY KEY,
  "voucherId" TEXT NOT NULL,
  "voucherType" "VoucherType",
  "requestedById" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'DeletionRequest_voucherId_idx'
  ) THEN
    CREATE INDEX "DeletionRequest_voucherId_idx" ON "DeletionRequest" ("voucherId");
  END IF;
END$$;
