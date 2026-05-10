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
    return <Skeleton className="h-[350px] w-full" />;
  }
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
          itemStyle={{ fontSize: '12px' }}
        />
        <Legend />
        <Bar dataKey="total" name="Income" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-emerald-500" />
        <Bar dataKey="expense" name="Expense" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-amber-500" />
      </BarChart>
    </ResponsiveContainer>
  );
}
