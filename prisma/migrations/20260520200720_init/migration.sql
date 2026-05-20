-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "pan" TEXT,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "donorId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "eventName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT,
    "accountId" TEXT NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "accountType" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "chequeNo" TEXT,
    "bankName" TEXT,
    "accountId" TEXT NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContraEntry" (
    "id" TEXT NOT NULL,
    "entryNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "transferType" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContraEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalVoucher" (
    "id" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "narration" TEXT,
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_voucherNo_key" ON "Payment"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "ContraEntry_entryNo_key" ON "ContraEntry"("entryNo");

-- CreateIndex
CREATE UNIQUE INDEX "JournalVoucher_voucherNo_key" ON "JournalVoucher"("voucherNo");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
