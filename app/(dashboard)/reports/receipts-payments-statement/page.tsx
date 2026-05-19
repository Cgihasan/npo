"use client";

import { useEffect, useMemo, useState } from "react";
import { getReceiptPaymentStatement } from "@/app/actions/reports";
import { format } from "date-fns";

import { CalendarDatePicker } from "@/components/shared/CalendarDatePicker";
import { ReceiptPaymentStatement } from "@/components/reports/ReceiptPaymentStatement";

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

const today = new Date();
const currentFinYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

export default function ReceiptsPaymentsStatementPage() {
  const [statement, setStatement] = useState<StatementData>(initialStatementData);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => new Date(currentFinYear, 3, 1));
  const [toDate, setToDate] = useState(() => new Date(currentFinYear + 1, 2, 31));

  const startDateStr = useMemo(
    () => format(fromDate, "yyyy-MM-dd"),
    [fromDate]
  );
  const endDateStr = useMemo(() => format(toDate, "yyyy-MM-dd"), [toDate]);

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

  return (
    <div className="space-y-2 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts & Payments Statement</h2>
          <p className="text-muted-foreground">
            A summary of cash and bank movements for a selected period.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <CalendarDatePicker label="From" value={fromDate} onChange={setFromDate} />
          <CalendarDatePicker label="To" value={toDate} onChange={setToDate} />
          {fromDate > toDate && (
            <p className="text-xs text-destructive text-right w-full">
              &quot;From&quot; date must be on or before &quot;To&quot; date.
            </p>
          )}
        </div>
      </div>

      <ReceiptPaymentStatement
        data={statement}
        periodLabel={`Period: ${format(fromDate, "dd MMM yyyy")} — ${format(toDate, "dd MMM yyyy")}`}
        isLoading={isLoading}
      />
    </div>
  );
}
