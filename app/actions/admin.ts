// app/actions/admin.ts
"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Clear all data from the database.
 * WARNING: This will irreversibly delete EVERY record.
 * Only users with ADMIN role are allowed to execute this.
 */
export async function clearAllData(): Promise<void> {
  const session = await auth();
  // TODO(security): Ensure the session contains a role field.
  if (!session || (session.user && (session.user as any).role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Perform deletions inside a transaction to maintain integrity.
  await db.$transaction([
    // Delete child tables first to satisfy foreign key constraints.
    db.auditLog.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.transaction.deleteMany(),
    db.contraEntry.deleteMany(),
    db.journalVoucher.deleteMany(),
    db.payment.deleteMany(),
    db.receipt.deleteMany(),
    db.budget.deleteMany(),
    db.account.deleteMany(),
    db.donor.deleteMany(),
    db.vendor.deleteMany(),
    // Finally delete users (cascades to related logs via FK constraints).
    db.user.deleteMany(),
  ]);
}
