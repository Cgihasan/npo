import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

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
      { name: "Cash in Hand", type: "CASH", balance: 0 },
      { name: "Main Bank Account", type: "BANK", balance: 0 },
      { name: "General Donation", type: "INCOME", balance: 0 },
      { name: "Membership Fees", type: "INCOME", balance: 0 },
      { name: "Program Grants", type: "INCOME", balance: 0 },
      { name: "Office Rent", type: "EXPENSE", balance: 0 },
      { name: "Staff Salaries", type: "EXPENSE", balance: 0 },
      { name: "Utility Bills", type: "EXPENSE", balance: 0 },
    ],
  });

  // 3. Create Donors
  await prisma.donor.createMany({
    data: [
      { name: "John Doe", email: "john@example.com", phone: "1234567890" },
      { name: "Jane Smith", email: "jane@example.com", phone: "9876543210" },
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
