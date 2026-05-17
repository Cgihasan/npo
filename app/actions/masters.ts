"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

export type LedgerHint = "auto" | "asset" | "income" | "expense";

function inferAccountTypeFromLedgerName(
  ledgerName: string,
  hint: LedgerHint = "auto"
): {
  type: string;
  category: string | null;
} {
  const lower = ledgerName.toLowerCase();

  if (hint === "asset") {
    if (/\bbank\b/.test(lower)) return { type: "BANK", category: null };
    return { type: "CASH", category: null };
  }
  if (hint === "income") {
    return { type: "INCOME", category: "Direct Incomes" };
  }
  if (hint === "expense") {
    if (/\b(asset|furniture|equipment)\b/.test(lower)) {
      return { type: "EXPENSE", category: "Fixed Assets" };
    }
    if (/\b(deposit|advance)\b/.test(lower)) {
      return { type: "EXPENSE", category: "Deposits (Assets)" };
    }
    return { type: "EXPENSE", category: "Indirect Expenses" };
  }

  if (/\bbank\b/.test(lower)) return { type: "BANK", category: null };
  if (/\bcash\b/.test(lower)) return { type: "CASH", category: null };
  if (
    /\b(expense|expenses|rent|salary|salaries|charges|utilities|printing)\b/.test(
      lower
    )
  ) {
    return { type: "EXPENSE", category: "Indirect Expenses" };
  }
  if (/\b(asset|furniture|equipment)\b/.test(lower)) {
    return { type: "EXPENSE", category: "Fixed Assets" };
  }
  if (/\b(deposit|advance)\b/.test(lower)) {
    return { type: "EXPENSE", category: "Deposits (Assets)" };
  }
  return { type: "INCOME", category: "Direct Incomes" };
}

/** Find chart-of-accounts row by ledger name, or create one for journal entry. */
export async function findOrCreateAccountByLedger(
  ledgerName: string,
  options?: { hint?: LedgerHint }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const trimmed = ledgerName.trim();
  if (!trimmed) throw new Error("Ledger name is required");

  const accounts = await db.account.findMany();
  const normalized = trimmed.toLowerCase();

  const existing = accounts.find((acc) => {
    const ledger = acc.accountType?.trim().toLowerCase();
    if (ledger === normalized) return true;
    const full = [acc.type, acc.category, acc.accountType]
      .filter(Boolean)
      .join(" - ")
      .toLowerCase();
    return full === normalized;
  });

  if (existing) return existing;

  const { type, category } = inferAccountTypeFromLedgerName(
    trimmed,
    options?.hint ?? "auto"
  );
  const account = await db.account.create({
    data: {
      type,
      category,
      accountType: trimmed,
      balance: 0,
    },
  });

  revalidatePath("/masters");
  return account;
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
