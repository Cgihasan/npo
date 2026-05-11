"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/app/actions/reports";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

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
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-1">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
            <Skeleton className="ml-auto h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {transactions.map((tx, index) => {
        const isReceipt = "receiptNo" in tx;
        const isPayment = "voucherNo" in tx;
        const isContra = "entryNo" in tx;

        const name = isReceipt 
          ? tx.donor?.name 
          : isPayment 
            ? tx.vendor?.name 
            : tx.transferType === "CASH_TO_BANK" ? "Cash to Bank" : "Bank to Cash";

        const safeName = name || "N/A";
        const amountPrefix = isReceipt ? "+" : isPayment ? "-" : "";
        const amountColor = isReceipt ? "text-emerald-500" : isPayment ? "text-amber-500" : "text-blue-500";
        
        return (
          <div key={tx.id || index} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={isReceipt ? "bg-emerald-100 text-emerald-700" : isPayment ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}>
                {safeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{safeName}</p>
              <p className="text-xs text-muted-foreground">
                {isReceipt ? "Receipt" : isPayment ? "Payment" : "Contra"} • {format(new Date(tx.date), "dd/MM/yyyy")}
              </p>
            </div>
            <div className={`ml-auto font-medium ${amountColor}`}>
              {amountPrefix}₹{Number(tx.amount || 0).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
