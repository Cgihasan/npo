-- Create enum types for deletion request management
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "VoucherType" AS ENUM ('RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL');

-- Create DeletionRequest table
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "voucherType" "VoucherType",
    "requestedById" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- Index for querying by voucherId
CREATE INDEX IF NOT EXISTS "DeletionRequest_voucherId_idx" ON "DeletionRequest" ("voucherId");
