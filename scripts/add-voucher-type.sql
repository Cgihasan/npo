-- Add VoucherType enum and nullable voucherType column to DeletionRequest
-- Run this against your Postgres database (psql or via your DB GUI).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vouchertype') THEN
        CREATE TYPE "VoucherType" AS ENUM ('RECEIPT','PAYMENT','CONTRA','JOURNAL');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

ALTER TABLE "DeletionRequest"
  ADD COLUMN IF NOT EXISTS "voucherType" "VoucherType";

-- Existing rows will have NULL voucherType. Backfill manually if you can map ids to types.
