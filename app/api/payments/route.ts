import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { 
      voucherNo, 
      date, 
      vendorId, 
      type, 
      amount, 
      paymentMode, 
      chequeNo,
      bankName,
      accountId, 
      narration 
    } = body;

    if (!voucherNo || !date || !vendorId || !amount || !accountId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Create the Payment
      const payment = await tx.payment.create({
        data: {
          voucherNo,
          date: new Date(date),
          vendorId,
          type,
          amount,
          paymentMode,
          chequeNo,
          bankName,
          accountId,
          narration,
        },
      });

      // 2. Update the Asset Account Balance (Cash/Bank) - DECREMENT
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // 3. Create Transaction record (Credit to Asset)
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
      include: {
        vendor: true,
      },
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
