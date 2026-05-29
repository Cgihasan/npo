"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/app/actions/reports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";

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

  const refIdToSerial = new Map<string, number>();
  const seen = new Set<string>();
  filtered.forEach((tx: any) => {
    if (!seen.has(tx.refId)) {
      seen.add(tx.refId);
      refIdToSerial.set(tx.refId, seen.size);
    }
  });
  const uniqueCount = seen.size;

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-36 text-right">Debit (In)</TableHead>
                <TableHead className="w-36 text-right">Credit (Out)</TableHead>
                <TableHead>Narration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tx: any, index: number) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {refIdToSerial.get(tx.refId)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(tx.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.account?.name || tx.account?.type || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tx.refType === "RECEIPT"
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                            : tx.refType === "PAYMENT"
                            ? "border-amber-500/30 text-amber-600 bg-amber-500/5"
                            : tx.refType === "CONTRA"
                            ? "border-blue-500/30 text-blue-600 bg-blue-500/5"
                            : "border-purple-500/30 text-purple-600 bg-purple-500/5"
                        }
                      >
                        {tx.refType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-emerald-600">
                      {tx.debit > 0
                        ? `₹${Number(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-amber-600">
                      {tx.credit > 0
                        ? `₹${Number(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate" title={tx.narration}>
                      {tx.narration || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
