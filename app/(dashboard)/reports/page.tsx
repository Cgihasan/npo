"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/app/actions/reports";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Search, ArrowUpDown } from "lucide-react";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = transactions.filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.narration?.toLowerCase().includes(q) ||
      tx.refType?.toLowerCase().includes(q) ||
      tx.account?.name?.toLowerCase().includes(q) ||
      tx.account?.type?.toLowerCase().includes(q)
    );
  });

  const uniqueRefIds = Array.from(new Set(filtered.map((tx: any) => tx.refId)));
  const refIdToSerial = new Map<string, number>();
  uniqueRefIds.forEach((id, index) => {
    refIdToSerial.set(id, index + 1);
  });
  const uniqueCount = uniqueRefIds.length;

  const refIdCounts = new Map<string, number>();
  filtered.forEach((tx: any) => {
    refIdCounts.set(tx.refId, (refIdCounts.get(tx.refId) || 0) + 1);
  });

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground mt-1">Comprehensive log of all financial activities across the organization.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold">All Transactions</h3>
          <span className="text-xs text-muted-foreground">{uniqueCount} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-[11px] uppercase tracking-widest">
                <th className="px-6 py-4 text-left font-semibold w-16">S.No.</th>
                <th className="px-6 py-4 text-left font-semibold">
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left font-semibold">Account</th>
                <th className="px-6 py-4 text-left font-semibold">Type</th>
                <th className="px-6 py-4 text-right font-semibold">Debit (In)</th>
                <th className="px-6 py-4 text-right font-semibold">Credit (Out)</th>
                <th className="px-6 py-4 text-left font-semibold">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((tx: any, index: number) => {
                  const isFirst = filtered.findIndex((t: any) => t.refId === tx.refId) === index;
                  const rowSpan = refIdCounts.get(tx.refId) || 1;

                  return (
                    <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                      {isFirst && (
                        <>
                          <td rowSpan={rowSpan} className="px-6 py-4 font-mono text-xs text-muted-foreground bg-card/40 align-middle">
                            {refIdToSerial.get(tx.refId)}
                          </td>
                          <td rowSpan={rowSpan} className="px-6 py-4 font-mono text-xs bg-card/40 align-middle">
                            {format(new Date(tx.date), "dd/MM/yyyy")}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 font-medium">{tx.account?.name || tx.account?.type || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={tx.refType === "RECEIPT" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : tx.refType === "PAYMENT" ? "border-amber-500/30 text-amber-600 bg-amber-500/5" : tx.refType === "CONTRA" ? "border-blue-500/30 text-blue-600 bg-blue-500/5" : "border-purple-500/30 text-purple-600 bg-purple-500/5"}
                      >
                        {tx.refType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">
                      {tx.debit > 0 ? `₹${Number(tx.debit).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-amber-600">
                      {tx.credit > 0 ? `₹${Number(tx.credit).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate" title={tx.narration}>
                      {tx.narration || "—"}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
