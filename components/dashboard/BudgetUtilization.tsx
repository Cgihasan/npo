"use client";

import { useEffect, useState } from "react";
import { getBudgetUtilization } from "@/app/actions/budgets";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, ArrowRight } from "lucide-react";
import Link from "next/link";

export function BudgetUtilization() {
  const [data, setData] = useState<{
    totalBudgeted: number;
    totalSpent: number;
    items: Array<{
      id: string;
      accountName: string;
      accountType: string;
      budgeted: number;
      spent: number;
      remaining: number;
      percent: number;
      fiscalYear: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getBudgetUtilization();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex flex-col items-center gap-3 text-center py-6">
          <div className="rounded-full bg-muted p-3">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No budgets set</p>
          <p className="text-xs text-muted-foreground">
            Create budgets for your expense accounts to track spending.
          </p>
          <Link
            href="/budget"
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-1"
          >
            Go to Budgets <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const totalPercent =
    data.totalBudgeted > 0
      ? Math.round((data.totalSpent / data.totalBudgeted) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Budget Utilization</h3>
        <Link
          href="/budget"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        {data.items[0]?.fiscalYear}-{(data.items[0]?.fiscalYear || 0) + 1} fiscal year
      </p>

      {/* Overall progress */}
      <div className="mb-5 p-3 rounded-lg bg-muted/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium">Overall</span>
          <span className="text-xs font-semibold">
            ₹{data.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })} / ₹
            {data.totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              totalPercent < 50
                ? "bg-emerald-500"
                : totalPercent < 80
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0%</span>
          <span
            className={`text-[10px] font-bold ${
              totalPercent < 50
                ? "text-emerald-600"
                : totalPercent < 80
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {totalPercent}% utilized
          </span>
          <span className="text-[10px] text-muted-foreground">100%</span>
        </div>
      </div>

      {/* Individual budget items */}
      <div className="space-y-3">
        {data.items.map((item) => {
          const barColor =
            item.percent < 50
              ? "bg-emerald-500"
              : item.percent < 80
              ? "bg-amber-500"
              : "bg-rose-500";

          return (
            <div key={item.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium truncate max-w-[180px]">
                  {item.accountName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    ₹{item.spent.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      item.percent < 50
                        ? "text-emerald-600"
                        : item.percent < 80
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {item.percent}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
