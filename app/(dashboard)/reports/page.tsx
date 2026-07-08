"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getDayBook } from "@/app/actions/reports";
import type { DayBookEntry } from "@/app/actions/reports";
import { VoucherDetailSheet } from "@/components/reports/VoucherDetailSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Loader2, BookOpen, Plus, Minus, Download } from "lucide-react";
import { exportToExcel } from "@/lib/export-excel";
import { toast } from "sonner";

const VOUCHER_STYLES: Record<string, { label: string; badge: string; text: string }> = {
  RECEIPT: {
    label: "Receipt",
    badge: "border-emerald-500/30 text-emerald-600 bg-emerald-500/5",
    text: "text-emerald-600",
  },
  PAYMENT: {
    label: "Payment",
    badge: "border-amber-500/30 text-amber-600 bg-amber-500/5",
    text: "text-amber-600",
  },
  CONTRA: {
    label: "Contra",
    badge: "border-blue-500/30 text-blue-600 bg-blue-500/5",
    text: "text-blue-600",
  },
  JOURNAL: {
    label: "Journal",
    badge: "border-purple-500/30 text-purple-600 bg-purple-500/5",
    text: "text-purple-600",
  },
};

function groupByDate(entries: DayBookEntry[]): Map<string, DayBookEntry[]> {
  const groups = new Map<string, DayBookEntry[]>();
  for (const entry of entries) {
    const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(entry);
  }
  return groups;
}

export default function DayBookPage() {
  const [entries, setEntries] = useState<DayBookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<{
    voucherType: string;
    voucherId: string;
  } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedVouchers, setExpandedVouchers] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((voucherKey: string) => {
    setExpandedVouchers((prev) => {
      const next = new Set(prev);
      if (next.has(voucherKey)) {
        next.delete(voucherKey);
      } else {
        next.add(voucherKey);
      }
      return next;
    });
  }, []);

  // Date range
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), 0, 1); // Jan 1
  const [startDate, setStartDate] = useState(format(defaultStart, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));

  const loadData = useCallback(async (opts?: { search?: string; startDate?: string; endDate?: string }) => {
    const s = opts?.search ?? search;
    const sd = opts?.startDate ?? startDate;
    const ed = opts?.endDate ?? endDate;
    setIsLoading(true);
    try {
      const dayBook = await getDayBook({
        startDate: sd || undefined,
        endDate: ed || undefined,
        search: s || undefined,
      });
      setEntries(dayBook);
    } catch (error) {
      console.error("Failed to load day book:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, startDate, endDate]);

  // Skip first render for search effect — initial load handled by date effect
  const isFirstRender = useRef(true);

  // Debounced search — fires on clear immediately, on type after 300ms
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!search) {
      loadData({ search: "" });
      return;
    }
    const timer = setTimeout(() => loadData({ search }), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial load + date changes
  useEffect(() => {
    loadData({ startDate, endDate });
  }, [startDate, endDate]);

  const dateGroups = groupByDate(entries);

  // Quick date presets
  const setCurrentMonth = () => {
    const now = new Date();
    setStartDate(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
    setEndDate(format(now, "yyyy-MM-dd"));
  };
  const setCurrentFY = () => {
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    setStartDate(format(new Date(fyStart, 3, 1), "yyyy-MM-dd"));
    setEndDate(format(now, "yyyy-MM-dd"));
  };
  const setToday = () => {
    const now = new Date();
    setStartDate(format(now, "yyyy-MM-dd"));
    setEndDate(format(now, "yyyy-MM-dd"));
  };

  const handleExport = () => {
    try {
      if (entries.length === 0) {
        toast.error("No data to export");
        return;
      }

      const exportData = entries.map((e) => ({
        "Date": format(new Date(e.date), "dd/MM/yyyy"),
        "Voucher No.": e.voucherNo,
        "Voucher Type": e.voucherType,
        "Particulars": e.particulars,
        "Accounts Involved": e.accountsInvolved,
        "Amount (₹)": e.amount,
      }));

      const fileName = `Day_Book_${startDate}_to_${endDate}`;
      exportToExcel(exportData, fileName);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export Excel.");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Day Book</h1>
            <p className="text-muted-foreground text-sm">
              All vouchers listed in chronological order
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading || entries.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between bg-card border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={setToday}>Today</Button>
            <Button variant="outline" size="sm" onClick={setCurrentMonth}>This Month</Button>
            <Button variant="outline" size="sm" onClick={setCurrentFY}>This FY</Button>
          </div>
        </div>
        <div className="relative w-full lg:w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vouchers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Day Book Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead className="w-[100px] font-semibold">Date</TableHead>
                <TableHead className="w-[140px] font-semibold">Voucher No.</TableHead>
                <TableHead className="font-semibold">Particulars</TableHead>
                <TableHead className="w-[120px] font-semibold">Voucher Type</TableHead>
                <TableHead className="w-[260px] text-right font-semibold" colSpan={2}>Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Loading day book...</p>
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-base font-semibold text-foreground">No vouchers found</p>
                      <p className="text-sm text-muted-foreground">
                        {search ? "Try a different search term." : "No transactions in the selected period."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                Array.from(dateGroups.entries()).map(([dateKey, dayEntries]) => (
                  <DayGroup
                    key={dateKey}
                    dateKey={dateKey}
                    entries={dayEntries}
                    isLast={dateKey === Array.from(dateGroups.keys()).pop()}
                    expandedVouchers={expandedVouchers}
                    onToggleExpand={toggleExpand}
                    onVoucherClick={(voucherType, voucherId) => {
                      setSelectedVoucher({ voucherType, voucherId });
                      setSheetOpen(true);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* Voucher Detail Sheet (Tally Prime-style) */}
      {selectedVoucher && (
        <VoucherDetailSheet
          open={sheetOpen}
          onOpenChange={(open, navData) => {
            if (navData) {
              setSelectedVoucher({
                voucherType: navData.voucherType,
                voucherId: navData.voucherId,
              });
              setSheetOpen(true);
            } else {
              setSheetOpen(open);
              if (!open) setSelectedVoucher(null);
            }
          }}
          voucherType={selectedVoucher.voucherType}
          voucherId={selectedVoucher.voucherId}
          entries={entries}
        />
      )}
    </div>
  );
}

function DayGroup({
  dateKey,
  entries,
  isLast,
  expandedVouchers,
  onToggleExpand,
  onVoucherClick,
}: {
  dateKey: string;
  entries: DayBookEntry[];
  isLast: boolean;
  expandedVouchers: Set<string>;
  onToggleExpand: (key: string) => void;
  onVoucherClick: (voucherType: string, voucherId: string) => void;
}) {
  const displayDate = format(new Date(dateKey + "T12:00:00"), "dd MMM yyyy");
  const dayTotal = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      {/* Date header row */}
      <TableRow className="bg-muted/30 hover:bg-muted/40">
        <TableCell colSpan={7} className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">{displayDate}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                {entries.length} voucher{entries.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              ₹{dayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </TableCell>
      </TableRow>

      {/* Voucher rows */}
      {entries.map((entry, idx) => {
        const style = VOUCHER_STYLES[entry.voucherType];
        const voucherKey = `${entry.id}-${entry.voucherType}`;
        const isExpanded = expandedVouchers.has(voucherKey);

        return (
          <>
            {/* Condensed voucher row */}
            <TableRow
              key={`${entry.id}-${idx}`}
              className="group hover:bg-muted/20 transition-colors"
            >
              <TableCell className="w-8 p-0 pl-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(voucherKey);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minus className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              </TableCell>
              <TableCell
                className="font-mono text-xs text-muted-foreground cursor-pointer"
                onClick={() => onVoucherClick(entry.voucherType, entry.id)}
              >
                {format(new Date(entry.date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell
                className="font-mono text-xs font-medium cursor-pointer"
                onClick={() => onVoucherClick(entry.voucherType, entry.id)}
              >
                {entry.voucherNo}
              </TableCell>
              <TableCell
                className="cursor-pointer"
                onClick={() => onVoucherClick(entry.voucherType, entry.id)}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{entry.particulars}</span>
                  {entry.accountsInvolved !== "-" && (
                    <span className="text-[11px] text-muted-foreground/60 font-mono">
                      {entry.accountsInvolved}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className="cursor-pointer"
                onClick={() => onVoucherClick(entry.voucherType, entry.id)}
              >
                <Badge variant="outline" className={`text-[11px] font-semibold ${style.badge}`}>
                  {style.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium cursor-pointer"
                colSpan={2}
                onClick={() => onVoucherClick(entry.voucherType, entry.id)}
              >
                ₹{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>

            {/* Expanded sub-rows: individual accounting entries */}
            {isExpanded &&
              entry.transactions.map((tx, txIdx) => (
                <TableRow
                  key={`${entry.id}-tx-${txIdx}`}
                  className="bg-muted/10 hover:bg-muted/15 transition-colors"
                >
                  <TableCell className="w-8 p-0" />
                  <TableCell colSpan={2} className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-px h-4 bg-border/40 ml-2" />
                      <span className="text-xs font-mono text-muted-foreground">
                        {tx.accountName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5" />
                  <TableCell className="py-1.5" />
                  <TableCell className={`text-right font-mono text-xs py-1.5 ${tx.debit > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground/30"}`}>
                    {tx.debit > 0
                      ? `₹${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—"}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs py-1.5 ${tx.credit > 0 ? "text-amber-600 font-medium" : "text-muted-foreground/30"}`}>
                    {tx.credit > 0
                      ? `₹${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
          </>
        );
      })}

      {/* Subtle separator between date groups */}
      {!isLast && (
        <TableRow className="h-0">
          <TableCell colSpan={7} className="p-0 border-b border-border/30" />
        </TableRow>
      )}
    </>
  );
}
