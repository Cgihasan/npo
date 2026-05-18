"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-3 w-full [--cell-size:2.25rem]",
        className
      )}
      captionLayout={captionLayout}
      hideNavigation={props.hideNavigation}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        months: "relative flex flex-col gap-4 md:flex-row w-full",
        month: "flex w-full flex-col gap-4",
        month_caption: "flex h-[--cell-size] w-full items-center justify-center relative mb-4",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between pointer-events-none z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[--cell-size] w-[--cell-size] p-0 opacity-60 hover:opacity-100 pointer-events-auto select-none aria-disabled:opacity-30 relative z-20"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[--cell-size] w-[--cell-size] p-0 opacity-60 hover:opacity-100 pointer-events-auto select-none aria-disabled:opacity-30 relative z-20"
        ),
        dropdowns: "flex h-[--cell-size] !w-auto !justify-center items-center gap-1.5 text-sm font-medium",
        dropdown_root: "relative flex items-center",
        dropdown: "bg-popover absolute inset-0 opacity-0 cursor-pointer w-full h-full",
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-8 items-center gap-1 text-sm hover:text-primary transition-colors cursor-pointer [&>svg]:size-3 [&>svg]:text-muted-foreground/80 pl-1.5 pr-1 py-0.5 rounded-sm hover:bg-accent"
        ),
        weekdays: "flex mb-2",
        weekday: "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal text-center",
        weeks: "flex flex-col gap-1",
        week: "flex w-full",
        week_number_header: "w-[--cell-size] select-none",
        week_number: "text-muted-foreground select-none text-[0.8rem]",
        day: "group/day relative aspect-square h-full w-full select-none p-0.5 text-center",
        range_start: "bg-accent rounded-l-md",
        range_middle: "rounded-none",
        range_end: "bg-accent rounded-r-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none [&>span]:text-xs [&>span]:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
