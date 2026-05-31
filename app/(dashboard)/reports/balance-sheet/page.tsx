"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { getBalanceSheet } from "@/app/actions/reports";
import { BalanceSheet } from "@/components/reports/BalanceSheet";
import { CalendarDatePicker } from "@/components/shared/CalendarDatePicker";

// TODO(security): Ensure getBalanceSheet validates user permissions on server side.

export default function BalanceSheetPage() {
  const today = new Date();
  const currentFinYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const [fromDate, setFromDate] = useState(() => new Date(currentFinYear, 3, 1)); // Apr 1
  const [toDate, setToDate] = useState(() => new Date(currentFinYear + 1, 2, 31)); // Mar 31
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startDateStr = useMemo(() => format(fromDate, "yyyy-MM-dd"), [fromDate]);
  const endDateStr = useMemo(() => format(toDate, "yyyy-MM-dd"), [toDate]);

  const loadBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const result = await getBalanceSheet(endDateStr);
      setData(result);
    } catch (error) {
      // TODO(security): Do not expose error details to the client.
      console.error("Failed to load balance sheet");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate > toDate) return;
    loadBalanceSheet();
  }, [startDateStr, endDateStr]);

  const periodLabel = useMemo(
    () => `Period: ${format(fromDate, "dd MMM yyyy")} — ${format(toDate, "dd MMM yyyy")}`,
    [fromDate, toDate]
  );

  return (
    <div className="space-y-2 p-4 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Balance Sheet</h2>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <CalendarDatePicker label="From" value={fromDate} onChange={setFromDate} />
          <CalendarDatePicker label="To" value={toDate} onChange={setToDate} />
          {fromDate > toDate && (
            <p className="text-xs text-destructive text-right w-full">
              "From" date must be on or before "To" date.
            </p>
          )}
        </div>
      </div>
      {data && (
        <BalanceSheet data={data} periodLabel={periodLabel} isLoading={isLoading} />
      )}
      {!data && !isLoading && (
        <p className="text-muted-foreground">No balance sheet data available for the selected period.</p>
      )}
    </div>
  );
}
