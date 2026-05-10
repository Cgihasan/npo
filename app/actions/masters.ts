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
