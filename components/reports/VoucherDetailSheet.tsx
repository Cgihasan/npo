"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { getVoucherDetail } from "@/app/actions/reports";
import type { VoucherDetail, DayBookEntry } from "@/app/actions/reports";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, ChevronUp, ChevronDown } from "lucide-react";

const VOUCHER_STYLES: Record<string, { label: string; color: string; bg: string; border: string; lightBg: string }> = {
  RECEIPT: {
    label: "Receipt",
    color: "text-emerald-600",
    bg: "bg-emerald-600",
    border: "border-emerald-500/20",
    lightBg: "bg-emerald-50/50",
  },
  PAYMENT: {
    label: "Payment",
    color: "text-amber-600",
    bg: "bg-amber-600",
    border: "border-amber-500/20",
    lightBg: "bg-amber-50/50",
  },
  CONTRA: {
    label: "Contra",
    color: "text-blue-600",
    bg: "bg-blue-600",
    border: "border-blue-500/20",
    lightBg: "bg-blue-50/50",
  },
  JOURNAL: {
    label: "Journal",
    color: "text-purple-600",
    bg: "bg-purple-600",
    border: "border-purple-500/20",
    lightBg: "bg-purple-50/50",
  },
};

interface NavigationData {
  voucherType: string;
  voucherId: string;
}

interface VoucherDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean, navigationData?: NavigationData) => void;
  voucherType: string;
  voucherId: string;
  entries: DayBookEntry[];
}

export function VoucherDetailSheet({ open, onOpenChange, voucherType, voucherId, entries }: VoucherDetailSheetProps) {
  const currentIndex = entries.findIndex(
    (e) => e.id === voucherId && e.voucherType === voucherType
  );
  const totalCount = entries.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < totalCount - 1;

  const navigateTo = useCallback(
    (direction: "prev" | "next") => {
      const targetIdx = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
      if (targetIdx < 0 || targetIdx >= totalCount) return;
      const target = entries[targetIdx];
      onOpenChange(true, {
        voucherType: target.voucherType,
        voucherId: target.id,
      });
    },
    [currentIndex, entries, onOpenChange, totalCount]
  );
  const [detail, setDetail] = useState<VoucherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateTo("prev");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateTo("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, navigateTo]);

  useEffect(() => {
    if (!open || !voucherId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getVoucherDetail(voucherType, voucherId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        if (!data) setError("Voucher not found");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load voucher");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, voucherId, voucherType]);

  const style = VOUCHER_STYLES[voucherType] || VOUCHER_STYLES.JOURNAL;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading voucher details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 px-6">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : detail ? (
          <>
            {/* ── Sheet Header ── */}
            <div className={`sticky top-0 z-10 ${style.lightBg} border-b ${style.border}`}>
              <SheetHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  {/* Navigation arrows */}
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => navigateTo("prev")}
                      disabled={!hasPrev}
                      className={`p-1.5 rounded-md transition-colors ${
                        hasPrev
                          ? "hover:bg-muted/30 text-muted-foreground"
                          : "text-muted-foreground/20 cursor-not-allowed"
                      }`}
                      title="Previous voucher (↑)"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigateTo("next")}
                      disabled={!hasNext}
                      className={`p-1.5 rounded-md transition-colors ${
                        hasNext
                          ? "hover:bg-muted/30 text-muted-foreground"
                          : "text-muted-foreground/20 cursor-not-allowed"
                      }`}
                      title="Next voucher (↓)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground ml-1.5 mr-3 font-mono tabular-nums whitespace-nowrap">
                      {currentIndex >= 0
                        ? `${currentIndex + 1} / ${totalCount}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center`}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-lg flex items-center gap-2">
                        {style.label} Voucher
                        <Badge variant="outline" className={`text-[10px] font-mono ${style.color} border-current/30`}>
                          {detail.voucherNo}
                        </Badge>
                      </SheetTitle>
                      <SheetDescription className="text-xs mt-0.5">
                        {format(new Date(detail.date), "dd MMM yyyy, EEEE")}
                      </SheetDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${style.color} border-current/30 bg-background`}>
                    ₹{detail.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </SheetHeader>
            </div>

            <div className="p-6 space-y-6">
              {/* ── Ledger Entries (Tally Prime style) ── */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Accounting Entries
                </h3>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-2.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                          Account
                        </th>
                        <th className="text-right py-2.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-[120px]">
                          Debit (₹)
                        </th>
                        <th className="text-right py-2.5 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-[120px]">
                          Credit (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.entries.map((entry, idx) => (
                        <tr
                          key={idx}
                          className={`border-b last:border-b-0 transition-colors hover:bg-muted/10 ${
                            idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                          }`}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                entry.debit > 0 ? "bg-emerald-500" : "bg-amber-500"
                              }`} />
                              <span className="font-medium text-foreground">{entry.accountName}</span>
                            </div>
                          </td>
                          <td className={`text-right py-2.5 px-4 font-mono ${
                            entry.debit > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground/40"
                          }`}>
                            {entry.debit > 0
                              ? `₹${entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                          <td className={`text-right py-2.5 px-4 font-mono ${
                            entry.credit > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground/40"
                          }`}>
                            {entry.credit > 0
                              ? `₹${entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20 border-t-2 border-border">
                        <td className="py-3 px-4 font-bold text-sm text-foreground">Total</td>
                        <td className="text-right py-3 px-4 font-bold font-mono text-emerald-600">
                          ₹{detail.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-3 px-4 font-bold font-mono text-amber-600">
                          ₹{detail.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Narration ── */}
              {detail.narration && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Narration
                  </h3>
                  <div className="bg-muted/20 rounded-lg px-4 py-3">
                    <p className="text-sm text-foreground/80 italic">{detail.narration}</p>
                  </div>
                </div>
              )}

              {/* ── Voucher-Specific Meta (Tally-style field list) ── */}
              {Object.keys(detail.meta).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-lg bg-muted/10 px-4 py-3">
                    {Object.entries(detail.meta).map(([key, value]) =>
                      value ? (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground capitalize">
                            {                            key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())}:
                          </span>
                          <span className="text-xs font-medium text-foreground">{value}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* ── Summary Bar ── */}
              <Separator />
              <div className="flex items-center justify-between bg-card rounded-lg border px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">Voucher Amount</span>
                <span className={`text-lg font-bold ${style.color}`}>
                  ₹{detail.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
