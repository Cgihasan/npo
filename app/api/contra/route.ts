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
      entryNo, 
      date, 
      transferType,
      fromAccountId,
      toAccountId,
      amount, 
      reference,
      narration 
    } = body;

    if (!entryNo || !date || !fromAccountId || !toAccountId || !amount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Create the Contra Entry
      const contra = await tx.contraEntry.create({
        data: {
          entryNo,
          date: new Date(date),
          transferType,
          fromAccountId,
          toAccountId,
          amount,
          reference,
          narration,
        },
      });

      // 2. Decrement From Account
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // 3. Increment To Account
      await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // 4. Create Transaction for From Account (Credit)
      await tx.transaction.create({
        data: {
          accountId: fromAccountId,
          debit: 0,
          credit: amount,
          refType: "CONTRA",
          refId: contra.id,
          date: new Date(date),
        },
      });

      // 5. Create Transaction for To Account (Debit)
      await tx.transaction.create({
        data: {
          accountId: toAccountId,
          debit: amount,
          credit: 0,
          refType: "CONTRA",
          refId: contra.id,
          date: new Date(date),
        },
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
