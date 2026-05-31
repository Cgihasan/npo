// app/actions/voucher.ts
"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Create a deletion request for a voucher (e.g., receipt, payment, contra, journal).
 * Any authenticated user can request, but the actual deletion is performed only by ADMIN after approval.
 */
export async function requestVoucherDeletion(voucherId?: string, voucherType?: string) {
  const session = await auth();
  if (!session || !(session.user as any).id) {
    throw new Error("Unauthorized");
  }

  if (!voucherId) {
    throw new Error("voucherId is required");
  }

  // If voucherType provided, validate existence by type. Otherwise, try to find in any voucher table.
  const exists = await (async () => {
    if (voucherType) {
      switch (voucherType) {
        case "RECEIPT":
          return !!(await db.receipt.findUnique({ where: { id: voucherId } }));
        case "PAYMENT":
          return !!(await db.payment.findUnique({ where: { id: voucherId } }));
        case "CONTRA":
          return !!(await db.contraEntry.findUnique({ where: { id: voucherId } }));
        case "JOURNAL":
          return !!(await db.journalVoucher.findUnique({ where: { id: voucherId } }));
        default:
          return false;
      }
    }

    // no type provided: check all tables
    const r = await db.receipt.findUnique({ where: { id: voucherId } });
    if (r) return true;
    const p = await db.payment.findUnique({ where: { id: voucherId } });
    if (p) return true;
    const c = await db.contraEntry.findUnique({ where: { id: voucherId } });
    if (c) return true;
    const j = await db.journalVoucher.findUnique({ where: { id: voucherId } });
    if (j) return true;
    return false;
  })();

  if (!exists) {
    throw new Error("Voucher not found");
  }

  await db.deletionRequest.create({
    data: {
      voucherId,
      voucherType: voucherType as any,
      requestedById: (session.user as any).id,
      status: "PENDING",
    },
  });
}

/**
 * Approve a pending deletion request and permanently delete the voucher.
 * Only ADMIN users may call this.
 */
export async function approveVoucherDeletion(requestId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const request = await db.deletionRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new Error("Deletion request not found");
  }
  if (request.status !== "PENDING") {
    throw new Error("Deletion request already processed");
  }

  const vid = request.voucherId;

  // If voucherType is set, delete from only that table. Otherwise try all known tables.
  if (request.voucherType) {
    switch (request.voucherType) {
      case "RECEIPT":
        await db.$transaction([
          db.transaction.deleteMany({ where: { refId: vid, refType: "RECEIPT" } }),
          db.receipt.deleteMany({ where: { id: vid } }),
        ]);
        break;
      case "PAYMENT":
        await db.$transaction([
          db.transaction.deleteMany({ where: { refId: vid, refType: "PAYMENT" } }),
          db.payment.deleteMany({ where: { id: vid } }),
        ]);
        break;
      case "CONTRA":
        await db.$transaction([
          db.transaction.deleteMany({ where: { refId: vid, refType: "CONTRA" } }),
          db.contraEntry.deleteMany({ where: { id: vid } }),
        ]);
        break;
      case "JOURNAL":
        await db.$transaction([
          db.transaction.deleteMany({ where: { refId: vid, refType: "JOURNAL" } }),
          db.journalVoucher.deleteMany({ where: { id: vid } }),
        ]);
        break;
      default:
        throw new Error("Unknown voucher type");
    }
  } else {
    await db.$transaction([
      db.transaction.deleteMany({ where: { refId: vid, refType: "RECEIPT" } }),
      db.receipt.deleteMany({ where: { id: vid } }),
      db.transaction.deleteMany({ where: { refId: vid, refType: "PAYMENT" } }),
      db.payment.deleteMany({ where: { id: vid } }),
      db.transaction.deleteMany({ where: { refId: vid, refType: "CONTRA" } }),
      db.contraEntry.deleteMany({ where: { id: vid } }),
      db.transaction.deleteMany({ where: { refId: vid, refType: "JOURNAL" } }),
      db.journalVoucher.deleteMany({ where: { id: vid } }),
    ]);
  }

  await db.deletionRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } });
}
