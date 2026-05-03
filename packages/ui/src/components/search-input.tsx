"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  loading = false,
  className,
}: SearchInputProps) {
  const [internal, setInternal] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  React.useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setInternal(next);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(next);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClear = React.useCallback(() => {
    setInternal("");
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
      />
      <input
        type="text"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-sm pl-10 pr-10 text-sm text-zinc-100",
          "placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/30",
          "hover:border-white/[0.1] hover:bg-zinc-900/80 transition-all duration-200",
        )}
        aria-label={placeholder}
      />
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-zinc-500" />
        ) : internal ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
