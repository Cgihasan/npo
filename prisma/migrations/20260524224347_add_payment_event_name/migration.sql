-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "eventName" TEXT;

-- Copy event names from Receipt if needed (optional, no data transformation needed)
