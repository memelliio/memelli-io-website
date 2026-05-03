"use client";

import * as React from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { cn } from "../lib/cn";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options?: ComboboxOption[];
  /** Selected values (multi-select) */
  values: string[];
  /** @deprecated Use `values` instead */
  value?: string[];
  onChange: (values: string[]) => void;
  /** Async search handler - enables searchable mode */
  onSearch?: (query: string) => Promise<ComboboxOption[]> | ComboboxOption[];
  placeholder?: string;
  /** Enable inline search filtering */
  searchable?: boolean;
  /** Allow creating new options by typing */
  creatable?: boolean;
  /** Maximum number of items that can be selected */
  maxItems?: number;
  /** @deprecated Use `maxItems` instead */
  maxSelections?: number;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options: staticOptions = [],
  values: valuesProp,
  value: valueLegacy,
  onChange,
  onSearch,
  placeholder = "Search...",
  searchable = true,
  creatable = false,
  maxItems: maxItemsProp,
  maxSelections: maxSelectionsLegacy,
  error,
  disabled = false,
  className,
}: ComboboxProps) {
  // Support both `values` and legacy `value` prop
  const value = valuesProp ?? valueLegacy ?? [];
  const maxSelections = maxItemsProp ?? maxSelectionsLegacy;

  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [asyncOptions, setAsyncOptions] = React.useState<ComboboxOption[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const baseOptions = onSearch ? asyncOptions : staticOptions;

  const filteredOptions = React.useMemo(() => {
    const available = baseOptions.filter((opt) => !value.includes(opt.value));
    if (!searchable || !query) return available;
    const lower = query.toLowerCase();
    return available.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [baseOptions, value, query, searchable]);

  const canCreate =
    creatable &&
    query.trim() !== "" &&
    !baseOptions.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()) &&
    !value.includes(query.trim());

  const totalItems = filteredOptions.length + (canCreate ? 1 : 0);

  // Async search debounce
  React.useEffect(() => {
    if (!onSearch) return;
    if (!query) {
      setAsyncOptions([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await onSearch(query);
        setAsyncOptions(results);
      } catch {
        setAsyncOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active item into view
  React.useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function select(optionValue: string) {
    if (maxSelections && value.length >= maxSelections) return;
    onChange([...value, optionValue]);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function remove(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]!);
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          select(filteredOptions[activeIndex]!.value);
        } else if (canCreate && activeIndex === filteredOptions.length) {
          select(query.trim());
        } else if (canCreate && activeIndex === -1) {
          select(query.trim());
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function resolveLabel(val: string): string {
    const found = [...staticOptions, ...asyncOptions].find((o) => o.value === val);
    return found?.label ?? val;
  }

  const atMax = maxSelections !== undefined && value.length >= maxSelections;

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-xl border bg-zinc-900/60 backdrop-blur-xl px-3 py-2 text-sm",
          "focus-within:border-red-500/50 focus-within:ring-2 focus-within:ring-red-500/20",
          "transition-all duration-200",
          disabled && "cursor-not-allowed opacity-50",
          error
            ? "border-red-500/60 focus-within:ring-red-500/20 focus-within:border-red-500/50"
            : "border-white/[0.04] hover:border-white/[0.08]",
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
      >
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/20 px-2 py-0.5 text-xs text-red-300"
          >
            {resolveLabel(v)}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                className="rounded-md hover:bg-red-500/20 focus:outline-none transition-colors duration-200"
                aria-label={`Remove ${resolveLabel(v)}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {searchable ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled || atMax}
            className="min-w-[80px] flex-1 border-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-invalid={!!error}
          />
        ) : (
          <button
            ref={inputRef as unknown as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => {
              if (!disabled) setIsOpen(!isOpen);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || atMax}
            className="min-w-[80px] flex-1 border-0 bg-transparent text-left text-sm text-zinc-500 focus:outline-none disabled:cursor-not-allowed"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={!!error}
          >
            {value.length === 0 ? placeholder : ""}
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && !disabled && (
        <div className="relative">
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 max-h-60 w-full overflow-auto rounded-xl border border-white/[0.06] bg-zinc-900/80 backdrop-blur-2xl py-1 shadow-2xl shadow-black/40"
          >
            {isSearching && (
              <li className="flex items-center gap-2 px-3.5 py-2 text-xs text-zinc-500">
                <Search className="h-3 w-3 animate-pulse" />
                Searching...
              </li>
            )}
            {!isSearching && filteredOptions.length === 0 && !canCreate && (
              <li className="px-3.5 py-2 text-xs text-zinc-500">No options found</li>
            )}
            {filteredOptions.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={activeIndex === i}
                className={cn(
                  "cursor-pointer px-3.5 py-2 text-sm text-zinc-100 mx-1 rounded-lg transition-all duration-200",
                  activeIndex === i
                    ? "bg-red-500/15 text-red-200"
                    : "hover:bg-white/[0.04]",
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(opt.value);
                }}
              >
                {opt.label}
              </li>
            ))}
            {canCreate && (
              <li
                role="option"
                aria-selected={activeIndex === filteredOptions.length}
                className={cn(
                  "cursor-pointer px-3.5 py-2 text-sm text-red-300 mx-1 rounded-lg transition-all duration-200",
                  activeIndex === filteredOptions.length
                    ? "bg-red-500/15"
                    : "hover:bg-white/[0.04]",
                )}
                onMouseEnter={() => setActiveIndex(filteredOptions.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(query.trim());
                }}
              >
                Create &quot;{query.trim()}&quot;
              </li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

Combobox.displayName = "Combobox";
