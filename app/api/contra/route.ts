import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { getNextContraNumber } from "@/app/actions/contra";
import { postContraLedgerEntries } from "@/lib/voucher-ledger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      entryNo,
      date,
      transferType,
      fromAccountId,
      toAccountId,
      amount,
      reference,
      narration,
    } = body;

    if (!date || !fromAccountId || !toAccountId || amount == null) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (fromAccountId === toAccountId) {
      return new NextResponse("From and To accounts must differ.", { status: 400 });
    }

    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      return new NextResponse("Amount must be a positive number.", { status: 400 });
    }

    const contraEntryNo = entryNo?.trim()
      ? entryNo
      : await getNextContraNumber(date);

    const result = await db.$transaction(async (tx) => {
      const contra = await tx.contraEntry.create({
        data: {
          entryNo: contraEntryNo,
          date: new Date(date),
          transferType,
          fromAccountId,
          toAccountId,
          amount: numAmount,
          reference,
          narration,
        },
      });

      await postContraLedgerEntries(tx, {
        contraId: contra.id,
        date: new Date(date),
        amount: numAmount,
        fromAccountId,
        toAccountId,
      });

      return contra;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CONTRA_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const entries = await db.contraEntry.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("[CONTRA_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
