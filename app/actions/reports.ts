"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getTransactions() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const [receipts, payments, contra] = await Promise.all([
    db.receipt.findMany({ include: { donor: true }, orderBy: { date: "desc" }, take: 10 }),
    db.payment.findMany({ orderBy: { date: "desc" }, take: 10 }),
    db.contraEntry.findMany({ orderBy: { date: "desc" }, take: 10 })
  ]);

  return [...receipts, ...payments, ...contra].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 20);
}

export async function getAccountBalances() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  
  const accounts = await db.account.findMany({
    orderBy: {
      type: "asc",
    },
    include: {
      transactions: {
        select: {
          debit: true,
          credit: true
        }
      }
    }
  });

  return accounts.map(acc => {
    const totalDebit = acc.transactions.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = acc.transactions.reduce((sum, tx) => sum + tx.credit, 0);
    
    // Assets (Cash/Bank) and Expenses: Balance = Debit - Credit
    // Income and Liabilities: Balance = Credit - Debit
    const isAssetOrExpense = ["CASH", "BANK", "ASSET", "EXPENSE"].includes(acc.type);
    const balance = isAssetOrExpense ? (totalDebit - totalCredit) : (totalCredit - totalDebit);

    return {
      ...acc,
      balance
    };
  });
}

export async function getMonthlyOverview() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await db.transaction.findMany({
    where: {
      date: { gte: sixMonthsAgo },
    },
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const overviewMap: Record<string, { name: string; total: number; expense: number }> = {};

  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = months[d.getMonth()];
    overviewMap[monthName] = { name: monthName, total: 0, expense: 0 };
  }

  transactions.forEach((tx: any) => {
    const m = months[new Date(tx.date).getMonth()];
    if (overviewMap[m]) {
      // For NPO overview, we usually track Receipts (Credit to Income) and Payments (Debit to Expense)
      // Here we simplify: Credit is Income/Asset increase, Debit is Expense/Asset decrease
      if (tx.credit > 0) {
        overviewMap[m].total += tx.credit;
      } else if (tx.debit > 0) {
        overviewMap[m].expense += tx.debit;
      }
    }
  });

  return Object.values(overviewMap).reverse();
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [receiptsTotal, paymentsTotal, cashStats, bankStats] = await Promise.all([
    db.receipt.aggregate({
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      _sum: { amount: true }
    }),
    db.transaction.aggregate({
      where: { account: { type: "CASH" } },
      _sum: { debit: true, credit: true }
    }),
    db.transaction.aggregate({
      where: { account: { type: "BANK" } },
      _sum: { debit: true, credit: true }
    })
  ]);

  const cashInHand = (cashStats._sum.debit || 0) - (cashStats._sum.credit || 0);
  const bankBalance = (bankStats._sum.debit || 0) - (bankStats._sum.credit || 0);

  return {
    totalReceipts: receiptsTotal._sum.amount || 0,
    totalPayments: paymentsTotal._sum.amount || 0,
    cashInHand,
    bankBalance,
  };
}
