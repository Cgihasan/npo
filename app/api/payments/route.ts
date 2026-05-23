import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { paymentSchema } from "@/lib/schemas/financial";
import { AUTHORIZED_ROLES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!AUTHORIZED_ROLES.includes(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = paymentSchema.parse(body);
    const { voucherNo } = body;

    if (!voucherNo) {
      return new NextResponse("Voucher number is required", { status: 400 });
    }

    const { 
      date, 
      type, 
      category,
      accountType,
      amount, 
      paymentMode, 
      chequeNo,
      bankName,
      accountId, 
      narration 
    } = validatedData;

    const result = await db.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          voucherNo,
          date: new Date(date),
          type,
          category,
          accountType,
          amount,
          paymentMode,
          chequeNo,
          bankName,
          accountId,
          narration,
        },
      });

      await tx.transaction.create({
        data: {
          accountId,
          debit: 0,
          credit: amount,
          refType: "PAYMENT",
          refId: payment.id,
          date: new Date(date),
        },
      });

      return payment;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PAYMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payments = await db.payment.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("[PAYMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
