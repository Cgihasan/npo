"use client";

import { useEffect, useMemo, useState } from "react";
import { getReceiptPaymentStatement } from "@/app/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PeriodDatePicker } from "@/components/shared/PeriodDatePicker";

interface StatementDetail {
  name: string;
  value: number;
}

interface StatementSection {
  total: number;
  details: any[];
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

const currentYear = new Date().getFullYear();

const YEAR_PRESETS = [currentYear, currentYear - 1, 2017, 2018, 2019, 2020].filter(
  (y, i, arr) => arr.indexOf(y) === i && y >= 1990
);

export default function ReceiptsPaymentsStatementPage() {
  const [statement, setStatement] = useState<StatementData>(initialStatementData);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => new Date(currentYear, 0, 1));
  const [toDate, setToDate] = useState(() => new Date());

  const startDateStr = useMemo(
    () => format(fromDate, "yyyy-MM-dd"),
    [fromDate]
  );
  const endDateStr = useMemo(() => format(toDate, "yyyy-MM-dd"), [toDate]);

  const applyYearPreset = (year: number) => {
    setFromDate(new Date(year, 0, 1));
    setToDate(new Date(year, 11, 31));
  };

  const loadStatement = async () => {
    setIsLoading(true);
    try {
      const result = await getReceiptPaymentStatement(startDateStr, endDateStr);
      setStatement(result);
    } catch (error) {
      console.error("Failed to fetch statement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate > toDate) return;
    loadStatement();
  }, [startDateStr, endDateStr]);

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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts & Payments Statement</h2>
          <p className="text-muted-foreground">
            A summary of cash and bank movements for a selected period.
          </p>
        </div>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-end gap-4">
            <PeriodDatePicker label="From" value={fromDate} onChange={setFromDate} />
            <PeriodDatePicker label="To" value={toDate} onChange={setToDate} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Quick year:</span>
            {YEAR_PRESETS.map((year) => (
              <Button
                key={year}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => applyYearPreset(year)}
              >
                {year}
              </Button>
            ))}
          </div>
          {fromDate > toDate && (
            <p className="text-xs text-destructive">
              &quot;From&quot; date must be on or before &quot;To&quot; date.
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aqaba Trust</CardTitle>
          <p className="text-sm text-muted-foreground">
            Period: {format(fromDate, "dd MMM yyyy")} — {format(toDate, "dd MMM yyyy")}
          </p>
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-200">
            Status: Reconciled
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading statement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
