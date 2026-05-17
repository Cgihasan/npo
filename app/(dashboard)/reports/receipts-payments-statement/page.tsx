"use client";

import { useEffect, useMemo, useState } from "react";
import { getReceiptPaymentStatement } from "@/app/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StatementDetail {
  name: string;
  value: number;
}

interface StatementSection {
  total: number;
  details: any[]; // Changed to any[] to accommodate varying data structures
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

const initialStatementData: StatementData = {
  openingBalance: { total: 0, details: [] },
  directIncomes: { total: 0, details: [] },
  payments: {
    fixedAssets: { total: 0, details: [] },
    currentAssets: { total: 0, details: [] },
    indirectExpenses: { total: 0, details: [] },
  },
  closingBalance: { total: 0, details: [] },
  totalReceipts: 0,
  totalPayments: 0,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => String(currentYear - 10 + i));

export default function ReceiptsPaymentsStatementPage() {
  const [statement, setStatement] = useState<StatementData>(initialStatementData);
  const [isLoading, setIsLoading] = useState(true);
  const [fromMonth, setFromMonth] = useState("1");
  const [fromYear, setFromYear] = useState(String(currentYear));
  const [toMonth, setToMonth] = useState(String(new Date().getMonth() + 1));
  const [toYear, setToYear] = useState(String(currentYear));

  const startDate = useMemo(() => new Date(Number(fromYear), Number(fromMonth) - 1, 1), [fromMonth, fromYear]);
  const endDate = useMemo(() => new Date(Number(toYear), Number(toMonth), 0), [toMonth, toYear]);

  const loadStatement = async () => {
    setIsLoading(true);
    try {
      const result = await getReceiptPaymentStatement(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      setStatement(result);
    } catch (error) {
      console.error("Failed to fetch statement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [startDate, endDate]);

  const renderSection = (section: StatementSection, isReceipt: boolean = true, level: number = 0) => (
    <div className={`space-y-1 ${
      level === 0 ? "ml-0 font-bold" : level === 1 ? "ml-4" : "ml-8 text-sm"
    }`}>
      {section.details.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className={level === 0 ? "text-md" : "text-sm"}>{item.name}</span>
          <span className={cn(
            "tabular-nums",
            isReceipt ? "text-emerald-600" : "text-amber-600"
          )}>{item.value ? `₹${item.value.toLocaleString()}` : "-"}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts & Payments Statement</h2>
          <p className="text-muted-foreground">
            A summary of cash and bank movements for a selected period.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <div className="flex gap-1">
              <Select value={fromMonth} onValueChange={setFromMonth}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fromYear} onValueChange={setFromYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <div className="flex gap-1">
              <Select value={toMonth} onValueChange={setToMonth}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toYear} onValueChange={setToYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aqaba Trust</CardTitle>
          <p className="text-sm text-muted-foreground">Annual Receipts & Payments Statement</p>
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-200">
            Status: Reconciled
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading statement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Receipts Section */}
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">RECEIPTS</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">Opening Balance</span>
                      <span className="font-bold text-lg text-emerald-600">₹{statement.openingBalance.total.toLocaleString()}</span>
                    </div>
                    {renderSection(statement.openingBalance, true, 1)}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">Direct Incomes</span>
                      <span className="font-bold text-lg text-emerald-600">₹{statement.directIncomes.total.toLocaleString()}</span>
                    </div>
                    {renderSection(statement.directIncomes, true, 1)}
                  </div>
                </div>
              </div>

              {/* Payments Section */}
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">PAYMENTS</h3>
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-lg mb-2">Fixed Assets</div>
                    {renderSection(statement.payments.fixedAssets, false, 1)}
                    <div className="flex justify-end pr-8">
                      <span className="font-bold text-lg text-amber-600">₹{statement.payments.fixedAssets.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-lg mb-2">Current Assets</div>
                    {renderSection(statement.payments.currentAssets, false, 1)}
                    <div className="flex justify-end pr-8">
                      <span className="font-bold text-lg text-amber-600">₹{statement.payments.currentAssets.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-lg mb-2">Indirect Expenses</div>
                    {renderSection(statement.payments.indirectExpenses, false, 1)}
                    <div className="flex justify-end pr-8">
                      <span className="font-bold text-lg text-amber-600">₹{statement.payments.indirectExpenses.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 mt-4">
                      <span className="font-bold text-lg">Closing Balance</span>
                      <span className="font-bold text-lg text-amber-600">₹{statement.closingBalance.total.toLocaleString()}</span>
                    </div>
                    {renderSection(statement.closingBalance, false, 1)}
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="col-span-2 flex justify-between bg-gray-100 p-4 font-bold text-lg mt-8">
                <div className="flex-1 text-center">
                  <span className="mr-2">TOTAL RECEIPTS</span>
                  <span className="text-emerald-600">₹{statement.totalReceipts.toLocaleString()}</span>
                </div>
                <div className="flex-1 text-center">
                  <span className="mr-2">TOTAL PAYMENTS</span>
                  <span className="text-amber-600">₹{statement.totalPayments.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
