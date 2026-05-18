"use client";

import { useEffect, useState } from "react";
import { getMonthlyOverview } from "@/app/actions/reports";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const d = await getMonthlyOverview();
        setData(d);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={4}>
        <XAxis
          dataKey="name"
          stroke="currentColor"
          strokeOpacity={0.3}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          strokeOpacity={0.3}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ fontSize: 13 }}
        />
        <Legend
          formatter={(value) => <span className="text-sm font-medium">{value}</span>}
        />
        <Bar
          dataKey="total"
          name="Income"
          fill="currentColor"
          radius={[6, 6, 0, 0]}
          className="fill-emerald-500"
          maxBarSize={40}
        />
        <Bar
          dataKey="expense"
          name="Expense"
          fill="currentColor"
          radius={[6, 6, 0, 0]}
          className="fill-amber-500"
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
