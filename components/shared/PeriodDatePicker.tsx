"use client";

import { useMemo } from "react";
import { getDaysInMonth } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DEFAULT_MIN_YEAR = 1990;

interface PeriodDatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
}

export function PeriodDatePicker({
  label,
  value,
  onChange,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = new Date().getFullYear(),
}: PeriodDatePickerProps) {
  const day = value.getDate();
  const month = value.getMonth() + 1;
  const year = value.getFullYear();

  const years = useMemo(() => {
    const list: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(String(y));
    }
    return list;
  }, [minYear, maxYear]);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const update = (nextDay: number, nextMonth: number, nextYear: number) => {
    const maxDay = getDaysInMonth(new Date(nextYear, nextMonth - 1));
    const safeDay = Math.min(nextDay, maxDay);
    onChange(new Date(nextYear, nextMonth - 1, safeDay));
  };

  return (
    <div className="space-y-1">
      {label ? (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <Select
          value={String(day)}
          onValueChange={(v) => update(Number(v), month, year)}
        >
          <SelectTrigger className="w-[72px]" aria-label="Day">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {days.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(month)}
          onValueChange={(v) => update(day, Number(v), year)}
        >
          <SelectTrigger className="w-[128px]" aria-label="Month">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {MONTHS.map((name, i) => (
              <SelectItem key={name} value={String(i + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(year)}
          onValueChange={(v) => update(day, month, Number(v))}
        >
          <SelectTrigger className="w-[92px]" aria-label="Year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
