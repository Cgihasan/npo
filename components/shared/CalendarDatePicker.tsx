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
    <div className="space-y-1">
      {label ? (
        <p className="text-xs text-muted-foreground">{label}</p>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd MMM yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            startMonth={new Date(fromYear, 0, 1)}
            endMonth={new Date(toYear, 11, 31)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
