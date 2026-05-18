"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/app/actions/reports";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig: Record<string, { icon: string; color: string }> = {
  RECEIPT: { icon: "arrow_downward", color: "text-emerald-500 bg-emerald-500/10" },
  PAYMENT: { icon: "arrow_upward", color: "text-amber-500 bg-amber-500/10" },
  CONTRA: { icon: "swap_horiz", color: "text-blue-500 bg-blue-500/10" },
  JOURNAL: { icon: "description", color: "text-indigo-500 bg-indigo-500/10" },
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTransactions();
        setTransactions(data.slice(0, 5));
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
      <div className="p-3 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-3">
      {transactions.map((tx, index) => {
        const config = typeConfig[tx.refType] || { icon: "circle", color: "text-muted-foreground bg-muted" };
        const isReceipt = tx.refType === "RECEIPT";
        const amount = isReceipt ? `+₹${Number(tx.amount || 0).toLocaleString()}` : `-₹${Number(tx.amount || 0).toLocaleString()}`;
        const amountColor = isReceipt ? "text-emerald-500" : "text-foreground";

        return (
          <div
            key={tx.id || index}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/30 transition-colors cursor-pointer border border-transparent hover:border-border/50 mb-1"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
              <span className="text-sm font-bold">{tx.refType?.charAt(0) || "?"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {tx.refType === "CONTRA"
                  ? "Contra Entry"
                  : tx.narration && tx.narration !== "-"
                    ? tx.narration
                    : `${tx.refType} Transaction`}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.refType} • {format(new Date(tx.date), "dd/MM/yyyy")}
              </p>
            </div>
            <span className={`text-sm font-semibold whitespace-nowrap ${amountColor}`}>
              {amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
