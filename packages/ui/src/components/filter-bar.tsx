"use client";

import * as React from "react";
import { X, ChevronDown, Check, Calendar } from "lucide-react";
import { cn } from "../lib/cn";

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "text" | "boolean";
  options?: { value: string; label: string }[];
}

export type FilterValues = Record<string, any>;

export interface SavedPreset {
  id: string;
  name: string;
  values: FilterValues;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear?: () => void;
  className?: string;
}

/* ── Individual filter controls ────────────────────────────────── */

function SelectFilter({
  filter,
  value,
  onUpdate,
}: {
  filter: FilterConfig;
  value: string | undefined;
  onUpdate: (v: string | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = filter.options?.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer backdrop-blur-xl",
          value
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-white/[0.04] bg-zinc-900/60 text-zinc-300 hover:border-white/[0.08]",
        )}
      >
        {filter.label}
        {selected && <span className="text-red-400">: {selected.label}</span>}
        <ChevronDown
          size={14}
          className={cn(
            "text-zinc-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-xl border border-white/[0.06] bg-zinc-900/80 backdrop-blur-2xl py-1 shadow-2xl shadow-black/40">
          {filter.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onUpdate(opt.value === value ? undefined : opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3.5 py-2 text-xs transition-all duration-200 cursor-pointer mx-0.5 rounded-lg",
                opt.value === value
                  ? "bg-red-500/15 text-red-400"
                  : "text-zinc-300 hover:bg-white/[0.04]",
              )}
            >
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.value === value && <Check size={12} className="text-red-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateFilter({
  filter,
  value,
  onUpdate,
}: {
  filter: FilterConfig;
  value: string | undefined;
  onUpdate: (v: string | undefined) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <Calendar
        size={14}
        className="pointer-events-none absolute left-3 text-zinc-500"
      />
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onUpdate(e.target.value || undefined)}
        className={cn(
          "h-8 rounded-xl border pl-8 pr-3 text-xs font-medium transition-all duration-200 backdrop-blur-xl",
          "bg-zinc-900/60 text-zinc-300 [color-scheme:dark]",
          value
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-white/[0.04] hover:border-white/[0.08]",
          "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
        )}
        aria-label={filter.label}
        title={filter.label}
      />
    </div>
  );
}

function TextFilter({
  filter,
  value,
  onUpdate,
}: {
  filter: FilterConfig;
  value: string | undefined;
  onUpdate: (v: string | undefined) => void;
}) {
  return (
    <input
      type="text"
      placeholder={filter.label}
      value={value ?? ""}
      onChange={(e) => onUpdate(e.target.value || undefined)}
      className={cn(
        "h-8 w-36 rounded-xl border px-3 text-xs font-medium transition-all duration-200 backdrop-blur-xl",
        "bg-zinc-900/60 text-zinc-300 placeholder:text-zinc-500",
        value
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-white/[0.04] hover:border-white/[0.08]",
        "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
      )}
      aria-label={filter.label}
    />
  );
}

function BooleanFilter({
  filter,
  value,
  onUpdate,
}: {
  filter: FilterConfig;
  value: boolean | undefined;
  onUpdate: (v: boolean | undefined) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (value === undefined) onUpdate(true);
        else if (value === true) onUpdate(false);
        else onUpdate(undefined);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer backdrop-blur-xl",
        value !== undefined
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-white/[0.04] bg-zinc-900/60 text-zinc-300 hover:border-white/[0.08]",
      )}
    >
      {filter.label}
      {value !== undefined && (
        <span className="text-red-400">{value ? "Yes" : "No"}</span>
      )}
    </button>
  );
}

/* ── Active filter chip ────────────────────────────────────────── */

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-red-500 hover:text-red-300 transition-colors duration-200"
        aria-label={`Remove ${label} filter`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  className,
}: FilterBarProps) {
  const activeCount = Object.keys(values).filter(
    (k) => values[k] !== undefined && values[k] !== "",
  ).length;

  const updateValue = React.useCallback(
    (key: string, val: any) => {
      const next = { ...values };
      if (val === undefined) {
        delete next[key];
      } else {
        next[key] = val;
      }
      onChange(next);
    },
    [values, onChange],
  );

  const handleClear = React.useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      onChange({});
    }
  }, [onClear, onChange]);

  const getChipLabel = (filter: FilterConfig): string | null => {
    const v = values[filter.key];
    if (v === undefined || v === "") return null;

    switch (filter.type) {
      case "select": {
        const opt = filter.options?.find((o) => o.value === v);
        return `${filter.label}: ${opt?.label ?? v}`;
      }
      case "date":
        return `${filter.label}: ${v}`;
      case "text":
        return `${filter.label}: ${v}`;
      case "boolean":
        return `${filter.label}: ${v ? "Yes" : "No"}`;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          switch (filter.type) {
            case "select":
              return (
                <SelectFilter
                  key={filter.key}
                  filter={filter}
                  value={values[filter.key]}
                  onUpdate={(v) => updateValue(filter.key, v)}
                />
              );
            case "date":
              return (
                <DateFilter
                  key={filter.key}
                  filter={filter}
                  value={values[filter.key]}
                  onUpdate={(v) => updateValue(filter.key, v)}
                />
              );
            case "text":
              return (
                <TextFilter
                  key={filter.key}
                  filter={filter}
                  value={values[filter.key]}
                  onUpdate={(v) => updateValue(filter.key, v)}
                />
              );
            case "boolean":
              return (
                <BooleanFilter
                  key={filter.key}
                  filter={filter}
                  value={values[filter.key]}
                  onUpdate={(v) => updateValue(filter.key, v)}
                />
              );
            default:
              return null;
          }
        })}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((filter) => {
            const chipLabel = getChipLabel(filter);
            if (!chipLabel) return null;
            return (
              <ActiveChip
                key={filter.key}
                label={chipLabel}
                onRemove={() => updateValue(filter.key, undefined)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
