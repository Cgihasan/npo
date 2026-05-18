"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  fromYear?: number;
  toYear?: number;
}

export function CalendarDatePicker({
  value,
  onChange,
  label,
  fromYear = 1990,
  toYear = new Date().getFullYear(),
}: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1 w-full">
      {label ? (
        <p className="text-xs text-muted-foreground">{label}</p>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{value ? format(value, "dd MMM yyyy") : "Pick a date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
