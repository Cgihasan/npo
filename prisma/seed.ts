import db from "@/lib/db";
import bcrypt from "bcryptjs";

const prisma = db;

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 0. Clean database
  await prisma.transaction.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.contraEntry.deleteMany();
  await prisma.journalVoucher.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.account.deleteMany();

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@npo.org" },
    update: {},
    create: {
      email: "admin@npo.org",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 2. Create Accounts
  await prisma.account.createMany({
    data: [
      { type: "CASH", accountType: "Cash In Hand", balance: 0 },
      { type: "BANK", accountType: "City Union Bank", balance: 0 },
      { type: "INCOME", category: "Direct Incomes", accountType: "General Donation", balance: 0 },
      { type: "INCOME", category: "Direct Incomes", accountType: "Special Donation", balance: 0 },
      { type: "INCOME", category: "Indirect Incomes", accountType: "Interest Capitalized From Bank", balance: 0 },
      { type: "INCOME", category: "Indirect Incomes", accountType: "Subscription", balance: 0 },
      { type: "INCOME", category: "Indirect Incomes", accountType: "Deposit Reverse", balance: 0 },
      { type: "INCOME", category: "Indirect Incomes", accountType: "Cancellation Reverse", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Bank Charges", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Registration & Paper Works", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Printing Expenese", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Office Expenses", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Office Stationery", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Legal Advisor", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Tea Expenses", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Delivery Charges", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Office Rent", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Electricity", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Telephone & Internet Bills", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Events Expenses", balance: 0 },
      { type: "EXPENSE", category: "Indirect Expenses", accountType: "Staff Salaries", balance: 0 },
      { type: "EXPENSE", category: "Fixed Assets", accountType: "Office Equipments", balance: 0 },
      { type: "EXPENSE", category: "Fixed Assets", accountType: "Furniture", balance: 0 },
      { type: "EXPENSE", category: "Fixed Assets", accountType: "Islamic Book Purchased", balance: 0 },
      { type: "EXPENSE", category: "Deposits (Assets)", accountType: "Office Rent Advance", balance: 0 },
    ],
  });

  // 3. Create Donors
  await prisma.donor.createMany({
    data: [
      { name: "Mohamed Hasan" },
      { name: "Ameer Abbas" },
      { name: "Nazir Ahamed" },
      { name: "Fowzi Aman" },
      { name: "Ashina Aman" },
      { name: "Aleem" },
      { name: "Al Manar Center - Dubai" },
      { name: "Saleem Ahamed" },
      { name: "Noor Fareed" },
      { name: "Samsath Begum" },
      { name: "Bro Imthiyaz" },
      { name: "Mohamed Habibullah" },
      { name: "Faisal & Shasmi" },
      { name: "Badur Nisha" },
      { name: "Saleem Frnd Saudi" },
      { name: "Jana Jamal" },
      { name: "Mohamed Yusuf" },
      { name: "Mohamed Hamdan" },
      { name: "T.M.BADRUDEEN - Burnie" },
      { name: "Murthaz" },
      { name: "Hamdullah" },
      { name: "Burhan" },
      { name: "Mohamed Ibrahim" },
      { name: "Thowfiq" },
      { name: "Basith" },
      { name: "Sadik Bhai" },
      { name: "Faisal West Street" },
      { name: "Fareed Ref" },
      { name: "Sadik" },
      { name: "Faisal Faqih" },
      { name: "Reliya Owner" },
      { name: "Athif Saudi" },
      { name: "Fareed Ref Dxb Sub" },
      { name: "Suhail Dad" },
      { name: "Faisal Kamaliya" },
      { name: "Noor Mohamed" },
      { name: "Sulthan" },
      { name: "Hamdan" },
      { name: "Faisal PDK" },
      { name: "Ayub Khan" },
      { name: "Jubair" },
      { name: "Rahamathullah Appa" },
      { name: "Jassim" },
      { name: "Mushraf" },
      { name: "Asrar IFJ" },
      { name: "Sheikh Alavudeen" },
      { name: "Amanullah" },
      { name: "Farish" },
      { name: "Towfiq_ref_Hussain" },
      { name: "Farook_ref_Hussain" },
      { name: "Idrish_Ref_hasan" },
      { name: "JASEEMA PA" },
      { name: "Rashid" },
      { name: "Mohamed?" },
      { name: "Faisal_Murthaza" },
      { name: "Mehraj_Hussain" },
    ],
  });

  // 4. Create Vendors
  await prisma.vendor.createMany({
    data: [
      { name: "Office Supplies Co.", email: "sales@officesupplies.com" },
      { name: "City Utilities", email: "support@cityutilities.com" },
    ],
  });

  // 5. Create sample voucher entries and matching ledger transactions
  const cashAccount = await prisma.account.findFirst({
    where: { accountType: "Cash In Hand" },
  });
  const bankAccount = await prisma.account.findFirst({
    where: { accountType: "City Union Bank" },
  });
  const generalDonation = await prisma.account.findFirst({
    where: { accountType: "General Donation" },
  });
  const officeRent = await prisma.account.findFirst({
    where: { accountType: "Office Rent" },
  });
  const officeStationery = await prisma.account.findFirst({
    where: { accountType: "Office Stationery" },
  });
  const bankCharges = await prisma.account.findFirst({
    where: { accountType: "Bank Charges" },
  });
  const sampleDonor = await prisma.donor.findFirst({
    where: { name: "Mohamed Hasan" },
  });

  if (cashAccount && bankAccount && generalDonation && officeRent && officeStationery && bankCharges && sampleDonor) {
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo: "RCP-2026-001",
        date: new Date("2026-05-01"),
        donorId: sampleDonor.id,
        type: "General Donation",
        category: "Direct Incomes",
        accountType: "General Donation",
        eventName: "None",
        amount: 15000,
        paymentMode: "Cash",
        referenceNo: "TXN001",
        accountId: cashAccount.id,
        narration: "Donation received in cash.",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        voucherNo: "PV-2026-001",
        date: new Date("2026-05-05"),
        type: "Office Rent",
        category: "Indirect Expenses",
        accountType: "Office Rent",
        amount: 5000,
        paymentMode: "Bank Transfer",
        chequeNo: "CHQ12345",
        bankName: "City Union Bank",
        accountId: bankAccount.id,
        narration: "Monthly office rent payment.",
      },
    });

    const contra = await prisma.contraEntry.create({
      data: {
        entryNo: "CON-2026-001",
        date: new Date("2026-05-10"),
        transferType: "CASH_TO_BANK",
        fromAccountId: cashAccount.id,
        toAccountId: bankAccount.id,
        amount: 7000,
        reference: "Deposit slip 123",
        narration: "Cash deposit to bank.",
      },
    });

    const journalVoucher = await prisma.journalVoucher.create({
      data: {
        voucherNo: "JV-2026-001",
        date: new Date("2026-05-12"),
        narration: "Stationery purchase and bank charges allocation.",
      },
    });

    await prisma.transaction.createMany({
      data: [
        {
          accountId: cashAccount.id,
          debit: 15000,
          credit: 0,
          refType: "RECEIPT",
          refId: receipt.id,
          date: new Date("2026-05-01"),
        },
        {
          accountId: generalDonation.id,
          debit: 0,
          credit: 15000,
          refType: "RECEIPT",
          refId: receipt.id,
          date: new Date("2026-05-01"),
        },
        {
          accountId: officeRent.id,
          debit: 5000,
          credit: 0,
          refType: "PAYMENT",
          refId: payment.id,
          date: new Date("2026-05-05"),
        },
        {
          accountId: bankAccount.id,
          debit: 0,
          credit: 5000,
          refType: "PAYMENT",
          refId: payment.id,
          date: new Date("2026-05-05"),
        },
        {
          accountId: cashAccount.id,
          debit: 0,
          credit: 7000,
          refType: "CONTRA",
          refId: contra.id,
          date: new Date("2026-05-10"),
        },
        {
          accountId: bankAccount.id,
          debit: 7000,
          credit: 0,
          refType: "CONTRA",
          refId: contra.id,
          date: new Date("2026-05-10"),
        },
        {
          accountId: officeStationery.id,
          debit: 1200,
          credit: 0,
          refType: "JOURNAL",
          refId: journalVoucher.id,
          date: new Date("2026-05-12"),
        },
        {
          accountId: bankCharges.id,
          debit: 300,
          credit: 0,
          refType: "JOURNAL",
          refId: journalVoucher.id,
          date: new Date("2026-05-12"),
        },
        {
          accountId: bankAccount.id,
          debit: 0,
          credit: 1500,
          refType: "JOURNAL",
          refId: journalVoucher.id,
          date: new Date("2026-05-12"),
        },
      ],
    });

    // Calculate balances from transactions
    const accounts = [cashAccount, bankAccount, generalDonation, officeRent, officeStationery, bankCharges];
    for (const account of accounts) {
      const transactions = await prisma.transaction.findMany({
        where: { accountId: account.id },
      });
      const balance = transactions.reduce((sum, t) => sum + t.debit - t.credit, 0);
      await prisma.account.update({
        where: { id: account.id },
        data: { balance },
      });
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
