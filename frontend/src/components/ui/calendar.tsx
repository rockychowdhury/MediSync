"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-2xl", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9 mb-4",
        caption_label: "text-sm font-semibold text-slate-900 tracking-tight",
        nav: "flex items-center justify-between absolute inset-x-0 px-2",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg border-slate-200 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg border-slate-200 z-10"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-slate-400 rounded-md w-9 font-medium text-[0.75rem] uppercase tracking-widest text-center",
        weeks: "space-y-1 mt-2",
        week: "flex w-full",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        ),
        range_end: "day-range-end",
        selected: "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white rounded-lg shadow-sm shadow-indigo-100",
        today: "bg-slate-100 text-indigo-600 font-bold border border-indigo-100",
        outside: "text-slate-400 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        disabled: "text-slate-400 opacity-50",
        range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-600",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === "left") return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
