"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface DatePickerProps {
  /** Single date value (non-range mode) */
  value?: Date | null;
  /** Called when single date changes */
  onChange?: (date: Date | null) => void;
  /** Enable range mode */
  range?: boolean;
  /** Range start date */
  startDate?: Date | null;
  /** Range end date */
  endDate?: Date | null;
  /** Called when range changes */
  onRangeChange?: (start: Date | null, end: Date | null) => void;
  /** Earliest selectable date */
  minDate?: Date;
  /** Latest selectable date */
  maxDate?: Date;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// ── helpers ──

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(date: Date, start: Date, end: Date) {
  const t = date.getTime();
  return t > start.getTime() && t < end.getTime();
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDisplay(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString();
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── component ──

export function DatePicker({
  value,
  onChange,
  range = false,
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  error,
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(
    () => (value ?? startDate ?? new Date()).getFullYear(),
  );
  const [viewMonth, setViewMonth] = React.useState(
    () => (value ?? startDate ?? new Date()).getMonth(),
  );
  // For range: track which pick we're on
  const [rangeStart, setRangeStart] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setRangeStart(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Build calendar grid
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const start = startOfWeek(firstDay);
    const total = daysInMonth(viewYear, viewMonth);
    // We need enough rows to cover the month
    const lastDay = new Date(viewYear, viewMonth, total);
    const endDay = new Date(lastDay);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= endDay) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function isDisabledDate(date: Date) {
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
      return true;
    }
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
      return true;
    }
    return false;
  }

  function handleDayClick(day: Date) {
    if (isDisabledDate(day)) return;

    if (!range) {
      onChange?.(day);
      setIsOpen(false);
      return;
    }

    // Range mode
    if (!rangeStart) {
      setRangeStart(day);
    } else {
      const start = day < rangeStart ? day : rangeStart;
      const end = day < rangeStart ? rangeStart : day;
      onRangeChange?.(start, end);
      setRangeStart(null);
      setIsOpen(false);
    }
  }

  function dayClasses(day: Date) {
    const isCurrentMonth = day.getMonth() === viewMonth;
    const isToday = isSameDay(day, new Date());
    const isDisabled = isDisabledDate(day);

    let isSelected = false;
    let isRangeEdge = false;
    let isInRange = false;

    if (!range && value) {
      isSelected = isSameDay(day, value);
    }

    if (range) {
      // Committed range
      if (startDate && endDate) {
        isRangeEdge = isSameDay(day, startDate) || isSameDay(day, endDate);
        isInRange = isBetween(day, startDate, endDate);
      }
      // Active picking
      if (rangeStart) {
        const hovEnd = hoverDate ?? rangeStart;
        const s = hovEnd < rangeStart ? hovEnd : rangeStart;
        const e = hovEnd < rangeStart ? rangeStart : hovEnd;
        isRangeEdge = isSameDay(day, s) || isSameDay(day, e);
        isInRange = isBetween(day, s, e);
      }
    }

    return cn(
      "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all duration-200",
      !isCurrentMonth && "text-zinc-600",
      isCurrentMonth && !isSelected && !isRangeEdge && "text-zinc-200",
      isToday && !isSelected && !isRangeEdge && "border border-red-500/40 text-red-300",
      (isSelected || isRangeEdge) && "bg-red-600 text-white shadow-lg shadow-red-500/20",
      isInRange && "bg-red-500/15 text-red-200",
      isDisabled && "cursor-not-allowed opacity-30",
      !isDisabled && !isSelected && !isRangeEdge && "cursor-pointer hover:bg-white/[0.06]",
    );
  }

  // Display text
  const displayText = React.useMemo(() => {
    if (range) {
      if (startDate && endDate) {
        return `${formatDisplay(startDate)} - ${formatDisplay(endDate)}`;
      }
      if (rangeStart) {
        return `${formatDisplay(rangeStart)} - ...`;
      }
      return "";
    }
    return formatDisplay(value);
  }, [range, value, startDate, endDate, rangeStart]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border bg-zinc-900/60 backdrop-blur-xl px-3.5 text-sm",
          "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          error
            ? "border-red-500/60 focus:ring-red-500/20 focus:border-red-500/50"
            : "border-white/[0.04] hover:border-white/[0.08]",
        )}
        aria-invalid={!!error}
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
        <span className={cn("flex-1 text-left", displayText ? "text-zinc-100" : "text-zinc-500")}>
          {displayText || placeholder}
        </span>
      </button>

      {/* Calendar dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full z-50 mt-1.5 w-[280px] rounded-2xl border border-white/[0.06] bg-zinc-900/80 backdrop-blur-2xl p-4 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-all duration-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-zinc-100 tracking-tight">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-all duration-200"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1.5 grid grid-cols-7 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-xs font-medium text-zinc-500">
                {d}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={isDisabledDate(day)}
                className={dayClasses(day)}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => {
                  if (range && rangeStart) setHoverDate(day);
                }}
                onMouseLeave={() => {
                  if (range && rangeStart) setHoverDate(null);
                }}
              >
                {day.getDate()}
              </button>
            ))}
          </div>

          {/* Clear action for single mode */}
          {!range && value && (
            <button
              type="button"
              onClick={() => {
                onChange?.(null);
                setIsOpen(false);
              }}
              className="mt-3 w-full rounded-lg py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-all duration-200"
            >
              Clear
            </button>
          )}

          {/* Clear action for range mode */}
          {range && startDate && endDate && (
            <button
              type="button"
              onClick={() => {
                onRangeChange?.(null, null);
                setRangeStart(null);
                setIsOpen(false);
              }}
              className="mt-3 w-full rounded-lg py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-all duration-200"
            >
              Clear range
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

DatePicker.displayName = "DatePicker";
