import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { requestId, action } = body as { requestId?: string; action?: "approve" | "reject" };

  if (!requestId || !action) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const request = await db.deletionRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  if (action === "reject") {
    await db.deletionRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true });
  }

  // Approve: delete according to recorded voucherType if present, otherwise try all tables.
  const vid = request.voucherId;

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
        return NextResponse.json({ error: "Unknown voucher type" }, { status: 400 });
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

  return NextResponse.json({ ok: true });
}
