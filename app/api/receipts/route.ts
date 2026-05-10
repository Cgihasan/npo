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
      receiptNo, 
      date, 
      donorId, 
      type, 
      amount, 
      paymentMode, 
      referenceNo, 
      accountId, 
      narration 
    } = body;

    if (!receiptNo || !date || !donorId || !amount || !accountId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Use a transaction to ensure atomic updates
    const result = await db.$transaction(async (tx) => {
      // 1. Create the Receipt
      const receipt = await tx.receipt.create({
        data: {
          receiptNo,
          date: new Date(date),
          donorId,
          type,
          amount,
          paymentMode,
          referenceNo,
          accountId,
          narration,
        },
      });

      // 2. Update the Asset Account Balance (Cash/Bank)
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // 3. Create Transaction record for the Asset Account (Debit)
      await tx.transaction.create({
        data: {
          accountId,
          debit: amount,
          credit: 0,
          refType: "RECEIPT",
          refId: receipt.id,
          date: new Date(date),
        },
      });

      // Note: In a full double-entry system, we'd also Credit an Income account.
      // For now, we'll follow the AGENT.md schema which primarily tracks Asset accounts.
      
      return receipt;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RECEIPTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const receipts = await db.receipt.findMany({
      include: {
        donor: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("[RECEIPTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
