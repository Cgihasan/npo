"use server";

import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBudgets() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const budgets = await db.budget.findMany({
    include: {
      account: true,
    },
    orderBy: [{ fiscalYear: "desc" }, { account: { accountType: "asc" } }],
  });

  // Calculate spent amount for each budget from transactions
  const currentYear = new Date().getFullYear();
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const fiscalStart = new Date(budget.fiscalYear, 3, 1); // April 1st
      const fiscalEnd = new Date(budget.fiscalYear + 1, 2, 31, 23, 59, 59); // March 31st

      // For expense accounts, spent = total debits to that account in the fiscal year
      const spentResult = await db.transaction.aggregate({
        where: {
          accountId: budget.accountId,
          date: { gte: fiscalStart, lte: fiscalEnd },
          debit: { gt: 0 },
        },
        _sum: { debit: true },
      });

      const spent = spentResult._sum.debit || 0;
      const remaining = budget.totalAmount - spent;
      const utilizationPercent = budget.totalAmount > 0
        ? Math.min(Math.round((spent / budget.totalAmount) * 100), 100)
        : 0;

      return {
        ...budget,
        spent,
        remaining,
        utilizationPercent,
      };
    })
  );

  return budgetsWithSpent;
}

export async function createBudget(data: {
  accountId: string;
  fiscalYear: number;
  totalAmount: number;
  period: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const budget = await db.budget.create({ data });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return budget;
}

export async function updateBudget(
  id: string,
  data: {
    accountId?: string;
    fiscalYear?: number;
    totalAmount?: number;
    period?: string;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const budget = await db.budget.update({ where: { id }, data });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return budget;
}

export async function deleteBudget(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.budget.delete({ where: { id } });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function getBudgetUtilization() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const budgets = await db.budget.findMany({
    include: { account: true },
    orderBy: { totalAmount: "desc" },
  });

  const currentYear = new Date().getFullYear();
  const utilizations = await Promise.all(
    budgets
      .filter((b) => b.fiscalYear === currentYear || b.fiscalYear === currentYear - 1)
      .slice(0, 6) // Top 6 for dashboard
      .map(async (budget) => {
        const fiscalStart = new Date(budget.fiscalYear, 3, 1);
        const fiscalEnd = new Date(budget.fiscalYear + 1, 2, 31, 23, 59, 59);

        const spentResult = await db.transaction.aggregate({
          where: {
            accountId: budget.accountId,
            date: { gte: fiscalStart, lte: fiscalEnd },
            debit: { gt: 0 },
          },
          _sum: { debit: true },
        });

        const spent = spentResult._sum.debit || 0;
        const percent = budget.totalAmount > 0
          ? Math.min(Math.round((spent / budget.totalAmount) * 100), 100)
          : 0;

        return {
          id: budget.id,
          accountName: budget.account.accountType || budget.account.type,
          accountType: budget.account.type,
          budgeted: budget.totalAmount,
          spent,
          remaining: budget.totalAmount - spent,
          percent,
          fiscalYear: budget.fiscalYear,
        };
      })
  );

  return {
    totalBudgeted: utilizations.reduce((s, u) => s + u.budgeted, 0),
    totalSpent: utilizations.reduce((s, u) => s + u.spent, 0),
    items: utilizations,
  };
}

export async function getExpenseAccounts() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return await db.account.findMany({
    where: { type: "EXPENSE" },
    orderBy: { accountType: "asc" },
  });
}
