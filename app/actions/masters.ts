"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { donorSchema, vendorSchema, accountSchema } from "@/lib/schemas/financial";
import { AUTHORIZED_ROLES, ADMIN_ONLY } from "@/lib/constants";

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
  return await db.account.findMany({ orderBy: { name: "asc" } });
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
    orderBy: { name: "asc" }
  });
}
export async function createDonor(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = donorSchema.parse(data);
  return await db.donor.create({ data: validatedData });
}

export async function createVendor(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = vendorSchema.parse(data);
  return await db.vendor.create({ data: validatedData });
}

export async function createAccount(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = accountSchema.parse(data);
  return await db.account.create({ 
    data: {
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance || 0,
      description: validatedData.description,
    }
  });
}

// Update Actions
export async function updateDonor(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = donorSchema.parse(data);
  return await db.donor.update({ where: { id }, data: validatedData });
}

export async function updateVendor(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = vendorSchema.parse(data);
  return await db.vendor.update({ where: { id }, data: validatedData });
}

export async function updateAccount(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!AUTHORIZED_ROLES.includes(session.user.role)) throw new Error("Forbidden");
  const validatedData = accountSchema.parse(data);
  return await db.account.update({ 
    where: { id },
    data: {
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance || 0,
      description: validatedData.description,
    }
  });
}

// Delete Actions
export async function deleteDonor(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!ADMIN_ONLY.includes(session.user.role)) throw new Error("Forbidden");
  try {
    return await db.donor.delete({ where: { id } });
  } catch (error: any) {
    throw new Error("Cannot delete donor. It may be associated with existing receipts.");
  }
}

export async function deleteVendor(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!ADMIN_ONLY.includes(session.user.role)) throw new Error("Forbidden");
  return await db.vendor.delete({ where: { id } });
}

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!ADMIN_ONLY.includes(session.user.role)) throw new Error("Forbidden");
  try {
    return await db.account.delete({ where: { id } });
  } catch (error: any) {
    throw new Error("Cannot delete account. It may be associated with existing transactions.");
  }
}
