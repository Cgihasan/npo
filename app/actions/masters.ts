"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getDonors() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.donor.findMany({ orderBy: { name: "asc" } });
}

export async function getVendors() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.vendor.findMany({ orderBy: { name: "asc" } });
}

export async function getAccounts() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.account.findMany({
    orderBy: [{ category: "asc" }, { accountType: "asc" }, { type: "asc" }],
  });
}

export async function getReceiptTypes() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const receipts = await db.receipt.findMany({
    select: { type: true, category: true, accountType: true, amount: true },
  });

  const map = new Map<string, { type: string; category: string | null; accountType: string | null; total: number }>();
  
  receipts.forEach(r => {
    if (!r.type) return;
    const existing = map.get(r.type);
    if (existing) {
      existing.total += r.amount;
    } else {
      map.set(r.type, {
        type: "INCOME",
        category: r.category || null,
        accountType: r.accountType || null,
        total: r.amount,
      });
    }
  });

  return Array.from(map.entries()).map(([name, data]) => ({
    id: name,
    name,
    ...data,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAssetAccounts() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.account.findMany({
    where: {
      type: {
        in: ["CASH", "BANK"]
      }
    },
    orderBy: { accountType: "asc" }
  });
}
export async function createDonor(data: { name: string; email?: string; phone?: string; address?: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.donor.create({ data });
}

export async function createVendor(data: { name: string; email?: string; phone?: string; address?: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.vendor.create({ data });
}

export async function createAccount(data: { type: string; category?: string; accountType?: string; balance?: number }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.account.create({ 
    data: {
      type: data.type,
      category: data.category || null,
      accountType: data.accountType || null,
      balance: data.balance || 0,
    }
  });
}

// Update Actions
export async function updateDonor(id: string, data: { name: string; email?: string; phone?: string; address?: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.donor.update({ where: { id }, data });
}

export async function updateVendor(id: string, data: { name: string; email?: string; phone?: string; address?: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.vendor.update({ where: { id }, data });
}

export async function updateAccount(id: string, data: { type: string; category?: string; accountType?: string; balance?: number }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.account.update({ 
    where: { id },
    data: {
      type: data.type,
      category: data.category || null,
      accountType: data.accountType || null,
      balance: data.balance || 0,
    }
  });
}

// Delete Actions
export async function deleteDonor(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  try {
    return await db.donor.delete({ where: { id } });
  } catch (error: any) {
    throw new Error("Cannot delete donor. It may be associated with existing receipts.");
  }
}

export async function deleteVendor(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return await db.vendor.delete({ where: { id } });
}

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  try {
    return await db.account.delete({ where: { id } });
  } catch (error: any) {
    throw new Error("Cannot delete account. It may be associated with existing transactions.");
  }
}
