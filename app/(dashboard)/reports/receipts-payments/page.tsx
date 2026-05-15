"use client";

import { useEffect, useState } from "react";
import { getReceiptPaymentReport, ReceiptPaymentFilter } from "@/app/actions/reports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Download, Filter } from "lucide-react";

interface ReportData {
  id: string;
  date: Date;
  voucherNo: string;
  type: string;
  partyName: string;
  category: string;
  amount: number;
  paymentMode: string;
  narration: string;
  status: string;
}

interface ReportSummary {
  totalReceipts: number;
  totalPayments: number;
  netBalance: number;
}

export default function ReceiptsPaymentsPage() {
  const [data, setData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalReceipts: 0,
    totalPayments: 0,
    netBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ReceiptPaymentFilter>({
    startDate: "",
    endDate: "",
    type: "ALL",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getReceiptPaymentReport(filters);
      setData(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (key: keyof ReceiptPaymentFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleExport = () => {
    const csvContent = [
      ["Date", "Voucher No", "Type", "Party Name", "Category", "Amount", "Payment Mode", "Narration", "Status"].join(","),
      ...data.map((row) =>
        [
          format(new Date(row.date), "dd/MM/yyyy"),
          row.voucherNo,
          row.type,
          row.partyName,
          row.category,
          row.amount.toString(),
          row.paymentMode,
          `"${row.narration.replace(/"/g, '""')}"`,
          row.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `receipts-payments-report-${format(new Date(), "dd-MM-yyyy")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts & Payments</h2>
          <p className="text-muted-foreground">
            Track all receipts and payments within a specific period.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="RECEIPT">Receipts</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleApplyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{summary.totalReceipts.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ₹{summary.totalPayments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.netBalance >= 0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              ₹{summary.netBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {format(new Date(row.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{row.voucherNo}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.type === "RECEIPT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {row.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.partyName}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell
                        className={`font-medium ${
                          row.type === "RECEIPT"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        ₹{row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{row.paymentMode}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {row.narration}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === "COMPLETED" ? "default" : "secondary"}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}