import { PrismaClient } from "@generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 0. Clean database
  await prisma.transaction.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.contraEntry.deleteMany();
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
