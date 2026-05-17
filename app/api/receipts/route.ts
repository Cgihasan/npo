import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  postReceiptLedgerEntries,
  resolveIncomeAccountId,
} from "@/lib/voucher-ledger";

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
      category,
      accountType,
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
      const receiptDate = new Date(date);
      const receipt = await tx.receipt.create({
        data: {
          receiptNo,
          date: receiptDate,
          donorId,
          type,
          category,
          accountType,
          amount,
          paymentMode,
          referenceNo,
          accountId,
          narration,
        },
      });

      const incomeAccountId = await resolveIncomeAccountId(tx, {
        type,
        category,
        accountType,
      });

      await postReceiptLedgerEntries(tx, {
        receiptId: receipt.id,
        date: receiptDate,
        amount: Number(amount),
        assetAccountId: accountId,
        incomeAccountId,
      });

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
