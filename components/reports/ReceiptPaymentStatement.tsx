"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DonorDetail {
  name: string;
  amount: number;
}

interface StatementDetail {
  name: string;
  value: number;
  donors?: DonorDetail[];
}

interface StatementSection {
  total: number;
  details: StatementDetail[];
}

interface StatementData {
  openingBalance: StatementSection;
  directIncomes: StatementSection;
  payments: {
    fixedAssets: StatementSection;
    currentAssets: StatementSection;
    indirectExpenses: StatementSection;
  };
  closingBalance: StatementSection;
  totalReceipts: number;
  totalPayments: number;
}

interface ReceiptPaymentStatementProps {
  readonly data: StatementData;
  readonly periodLabel: string;
  readonly isLoading?: boolean;
}

function StatementCategory({
  label,
  total,
  details,
  accentColor,
  totalColor,
}: {
  label: string;
  total: number;
  details: StatementDetail[];
  accentColor: string;
  totalColor: string;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-3 border-b border-border/50 pb-2">
        <span className="font-bold text-foreground text-lg">{label}</span>
        <span className={cn("font-bold text-lg", totalColor)}>
          ₹{total.toLocaleString()}
        </span>
      </div>
      {details.length > 0 && (
        <div className="space-y-1 pl-4">
          {details.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center text-sm group">
                <span className="flex items-center gap-2">
                  {item.donors && item.donors.length > 0 && (
                    <button
                      onClick={() => toggleExpand(index)}
                      className={cn(
                        "w-5 h-5 flex items-center justify-center rounded-md text-xs font-bold transition-all duration-200",
                        expandedItems.has(index)
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                          : "bg-muted/50 text-muted-foreground hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900 dark:hover:text-sky-400"
                      )}
                    >
                      {expandedItems.has(index) ? "−" : "+"}
                    </button>
                  )}
                  <span className="text-muted-foreground">{item.name}</span>
                </span>
                <span className={cn("font-medium", item.value ? totalColor : "text-muted-foreground")}>
                  {item.value ? `₹${item.value.toLocaleString()}` : "-"}
                </span>
              </div>
              {item.donors && item.donors.length > 0 && expandedItems.has(index) && (
                <div className="ml-8 mt-1 mb-2 space-y-0.5 border-l-2 border-sky-200 dark:border-sky-800 pl-3">
                  {item.donors.map((donor, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex justify-between items-center text-xs py-0.5"
                    >
                      <span className="text-muted-foreground/80">{donor.name}</span>
                      <span className={cn("font-medium", totalColor)}>
                        ₹{donor.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReceiptPaymentStatement({
  data,
  periodLabel,
  isLoading,
}: ReceiptPaymentStatementProps) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card shadow-[0_8px_24px_rgba(224,64,160,0.04)] overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-border/50 bg-muted/30 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">Aqaba Trust</h3>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Status: Reconciled
        </Badge>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading statement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
            <div className="p-6">
              <h4 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-8 rounded-full bg-sky-500" />
                Receipts
              </h4>
              <div className="space-y-6">
                <StatementCategory
                  label="Opening Balance"
                  total={data.openingBalance.total}
                  details={data.openingBalance.details}
                  accentColor="bg-sky-500"
                  totalColor="text-sky-600"
                />
                <StatementCategory
                  label="Direct Incomes"
                  total={data.directIncomes.total}
                  details={data.directIncomes.details}
                  accentColor="bg-sky-500"
                  totalColor="text-sky-600"
                />
              </div>
            </div>

            <div className="p-6 bg-muted/20">
              <h4 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-8 rounded-full bg-purple-500" />
                Payments
              </h4>
              <div className="space-y-6">
                <StatementCategory
                  label="Fixed Assets"
                  total={data.payments.fixedAssets.total}
                  details={data.payments.fixedAssets.details}
                  accentColor="bg-purple-500"
                  totalColor="text-purple-600"
                />
                <StatementCategory
                  label="Current Assets"
                  total={data.payments.currentAssets.total}
                  details={data.payments.currentAssets.details}
                  accentColor="bg-purple-500"
                  totalColor="text-purple-600"
                />
                <StatementCategory
                  label="Indirect Expenses"
                  total={data.payments.indirectExpenses.total}
                  details={data.payments.indirectExpenses.details}
                  accentColor="bg-purple-500"
                  totalColor="text-purple-600"
                />
                <StatementCategory
                  label="Closing Balance"
                  total={data.closingBalance.total}
                  details={data.closingBalance.details}
                  accentColor="bg-purple-500"
                  totalColor="text-purple-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/40 p-6 border-t border-border/40 flex flex-col sm:flex-row sm:divide-x divide-border/50 gap-4 sm:gap-0">
            <div className="flex-1 flex justify-between items-center sm:pr-6">
              <span className="font-bold text-muted-foreground tracking-wide uppercase text-sm">
                Total Receipts
              </span>
              <span className="font-black text-sky-600 text-2xl">
                ₹{data.totalReceipts.toLocaleString()}
              </span>
            </div>
            <div className="flex-1 flex justify-between items-center sm:pl-6">
              <span className="font-bold text-muted-foreground tracking-wide uppercase text-sm">
                Total Payments
              </span>
              <span className="font-black text-purple-600 text-2xl">
                ₹{data.totalPayments.toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
