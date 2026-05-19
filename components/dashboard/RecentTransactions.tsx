"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowLeftRight, FileText, HelpCircle } from "lucide-react";
import { formatRelative } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions } from "@/app/actions/reports";

interface Transaction {
  id: string;
  refType: string;
  amount?: number;
  debit?: number;
  credit?: number;
  date: string | Date;
  narration: string;
  refId: string;
  status?: string;
}

type IconComponent = React.ComponentType<{ className?: string }>;

const typeConfig: Record<string, { icon: IconComponent; circleColor: string; iconColor: string; badgeColor: string; badgeTextColor: string }> = {
  RECEIPT: {
    icon: ArrowDown,
    circleColor: "bg-pink-100",
    iconColor: "text-pink-600",
    badgeColor: "bg-pink-50",
    badgeTextColor: "text-pink-600"
  },
  PAYMENT: {
    icon: ArrowUp,
    circleColor: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeColor: "bg-pink-50",
    badgeTextColor: "text-pink-600"
  },
  CONTRA: {
    icon: ArrowLeftRight,
    circleColor: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeColor: "bg-purple-50",
    badgeTextColor: "text-purple-600"
  },
  JOURNAL: {
    icon: FileText,
    circleColor: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-50",
    badgeTextColor: "text-blue-600"
  },
};

const statusConfig: Record<string, { badgeColor: string; badgeTextColor: string }> = {
  "Processing": { badgeColor: "bg-purple-100", badgeTextColor: "text-purple-700" },
  "Reconciled": { badgeColor: "bg-pink-100", badgeTextColor: "text-pink-500" },
  "Draft": { badgeColor: "bg-slate-100", badgeTextColor: "text-slate-600" },
  "Default": { badgeColor: "bg-gray-100", badgeTextColor: "text-gray-600" },
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTransactions();
        const uniqueData = data.filter((tx: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.refId === tx.refId)
        );
        setTransactions(uniqueData.slice(0, 4));
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
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
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
    <div className="p-2 space-y-4">
      {transactions.map((tx, index) => {
        const config = typeConfig[tx.refType] || {
          icon: HelpCircle,
          circleColor: "bg-gray-100",
          iconColor: "text-gray-600",
          badgeColor: "bg-gray-50",
          badgeTextColor: "text-gray-600"
        };
        const Icon = config.icon;
        const isReceipt = tx.refType === "RECEIPT";
        const isPositive = isReceipt;
        const actualAmount = tx.amount || tx.debit || tx.credit || 0;
        const formattedAmount = Number(actualAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const amount = isPositive ? `+₹${formattedAmount}` : `-₹${formattedAmount}`;
        const amountColor = isPositive ? "text-pink-500" : "text-slate-900";

        const defaultStatus = tx.refType === 'CONTRA' ? 'Processing' : 'Reconciled';
        const statusText = tx.status || defaultStatus;
        const statusInfo = statusConfig[statusText] || statusConfig["Default"];

        const dateStr = formatRelative(new Date(tx.date), new Date());
        const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1).replace(' at ', ', ');

        return (
          <div
            key={tx.id || index}
            className="flex items-start gap-4 group cursor-pointer mb-6"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.circleColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate text-slate-900">
                {tx.refType === "CONTRA"
                  ? "Contra: " + (tx.narration !== "-" ? tx.narration : "Transfer")
                  : tx.narration && tx.narration !== "-"
                    ? tx.narration
                    : `${tx.refType} Transaction`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                TRX-{tx.id?.slice(-4).toUpperCase() || "XXXX"} • {formattedDate}
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statusInfo.badgeColor} ${statusInfo.badgeTextColor}`}>
                  {statusText}
                </span>
                <span className={`text-base font-bold whitespace-nowrap ${amountColor}`}>
                  {amount}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
