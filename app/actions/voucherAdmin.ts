// app/actions/voucherAdmin.ts
"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * Delete all voucher related records.
 * Only ADMIN users may execute this.
 */
export async function clearVouchers(): Promise<void> {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.$transaction([
    db.receipt.deleteMany(),
    db.payment.deleteMany(),
    db.contraEntry.deleteMany(),
    db.journalVoucher.deleteMany(),
  ]);
}

/**
 * Non‑admin users can request voucher deletion.
 * This creates an audit log entry that admins can review.
 */
export async function requestVoucherDeletion(): Promise<void> {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }
  // Admins should not request; they can delete directly.
  if ((session.user as any).role === "ADMIN") {
    throw new Error("Admins can delete directly; no request needed.");
  }

  await db.auditLog.create({
    data: {
      action: "VOUCHER_DELETE_REQUEST",
      performedById: (session.user as any).id,
      details: "User requested deletion of all vouchers",
    },
  });
}
