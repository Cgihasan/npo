"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BalanceSheetItem {
  name: string;
  balance: number;
}

interface BalanceSheetCategory {
  category: string;
  items: BalanceSheetItem[];
  total: number;
}

interface BalanceSheetData {
  asOfDate: Date;
  assets: BalanceSheetCategory[];
  liabilities: BalanceSheetCategory[];
  totalAssets: number;
  totalLiabilities: number;
}

interface BalanceSheetProps {
  readonly data: BalanceSheetData;
  readonly periodLabel: string;
  readonly isLoading?: boolean;
}

function BalanceSheetCategorySection({
  label,
  total,
  items,
  accentColor,
  totalColor,
}: {
  label: string;
  total: number;
  items: BalanceSheetItem[];
  accentColor: string;
  totalColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 transition-all duration-300 hover:border-border/80">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 group text-left"
        >
          <span className={cn("w-2 h-5 rounded-full", accentColor)} />
          <span className="font-bold text-foreground text-base tracking-tight hover:text-primary transition-colors">
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full ml-1">
            {items.length} ledger{items.length !== 1 ? "s" : ""}
          </span>
        </button>
        <span className={cn("font-bold text-base font-mono", totalColor)}>
          ₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      {isExpanded && items.length > 0 && (
        <div className="space-y-1.5 pl-4 mt-2 border-l border-border/30">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm py-0.5 group">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {item.name}
              </span>
              <span className="font-medium text-foreground/80 font-mono text-xs">
                ₹{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BalanceSheet({ data, periodLabel, isLoading }: BalanceSheetProps) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card shadow-[0_8px_24px_rgba(16,185,129,0.02)] overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-border/50 bg-muted/30 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">Aqaba Trust</h3>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Status: Balanced
        </Badge>
      </div>

      {isLoading ? (
        <div className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Generating Balance Sheet statement...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
            {/* Liabilities & Capital side */}
            <div className="p-6 space-y-6">
              <h4 className="text-lg font-black text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-8 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]" />
                Liabilities & Capital
              </h4>
              <div className="space-y-4">
                {data.liabilities.map((cat, idx) => {
                  const isSurplus = cat.category === "Excess of Income over Expenditure";
                  return (
                    <BalanceSheetCategorySection
                      key={idx}
                      label={cat.category}
                      total={cat.total}
                      items={cat.items}
                      accentColor={isSurplus ? "bg-amber-500" : "bg-purple-500"}
                      totalColor={isSurplus ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400"}
                    />
                  );
                })}
                {data.liabilities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No liabilities recorded.</p>
                )}
              </div>
            </div>

            {/* Assets side */}
            <div className="p-6 bg-muted/5 space-y-6">
              <h4 className="text-lg font-black text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-8 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                Assets
              </h4>
              <div className="space-y-4">
                {data.assets.map((cat, idx) => (
                  <BalanceSheetCategorySection
                    key={idx}
                    label={cat.category}
                    total={cat.total}
                    items={cat.items}
                    accentColor="bg-emerald-500"
                    totalColor="text-emerald-600 dark:text-emerald-400"
                  />
                ))}
                {data.assets.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No assets recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Double-Entry balanced footer */}
          <div className="bg-muted/40 p-6 border-t border-border/40 flex flex-col lg:flex-row lg:divide-x divide-border/50 gap-4 lg:gap-0">
            <div className="flex-1 flex justify-between items-center lg:pr-6">
              <span className="font-bold text-muted-foreground tracking-wide uppercase text-xs">
                Total Liabilities & Capital
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-400 text-lg font-mono">
                ₹{data.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex-1 flex justify-between items-center lg:pl-6">
              <span className="font-bold text-muted-foreground tracking-wide uppercase text-xs">
                Total Assets
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                ₹{data.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
