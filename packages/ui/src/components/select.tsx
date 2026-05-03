"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "../lib/cn";

const triggerVariants = cva(
  [
    "w-full rounded-xl border bg-zinc-900/60 backdrop-blur-xl text-zinc-100",
    "inline-flex items-center justify-between",
    "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "transition-all duration-200 cursor-pointer",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-3.5 text-sm gap-2",
        lg: "h-12 px-4 text-base gap-2.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<VariantProps<typeof triggerVariants>, "size"> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  error?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  hint?: string;
  className?: string;
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      searchable = false,
      error,
      disabled = false,
      size = "md",
      label,
      hint,
      className,
      renderOption,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const [dropdownStyles, setDropdownStyles] = React.useState<React.CSSProperties>({});

    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    const selectId = label
      ? label.toLowerCase().replace(/\s+/g, "-")
      : undefined;

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current =
            node;
        }
      },
      [ref],
    );

    const selectedOption = React.useMemo(
      () => options.find((o) => o.value === value),
      [options, value],
    );

    const filteredOptions = React.useMemo(() => {
      if (!search) return options;
      const lower = search.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(lower));
    }, [options, search]);

    const updateDropdownPosition = React.useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropAbove = spaceBelow < 250 && rect.top > 250;

      setDropdownStyles({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(dropAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }, []);

    const open = React.useCallback(() => {
      if (disabled) return;
      updateDropdownPosition();
      setIsOpen(true);
      setSearch("");
      setHighlightedIndex(-1);
    }, [disabled, updateDropdownPosition]);

    const close = React.useCallback(() => {
      setIsOpen(false);
      setSearch("");
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    }, []);

    const selectOption = React.useCallback(
      (option: SelectOption) => {
        if (option.disabled) return;
        onChange?.(option.value);
        close();
      },
      [onChange, close],
    );

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && searchable) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }, [isOpen, searchable]);

    // Close on outside click
    React.useEffect(() => {
      if (!isOpen) return;
      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          !triggerRef.current?.contains(target) &&
          !dropdownRef.current?.contains(target)
        ) {
          close();
        }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen, close]);

    // Reposition on scroll/resize
    React.useEffect(() => {
      if (!isOpen) return;
      const handler = () => updateDropdownPosition();
      window.addEventListener("scroll", handler, true);
      window.addEventListener("resize", handler);
      return () => {
        window.removeEventListener("scroll", handler, true);
        window.removeEventListener("resize", handler);
      };
    }, [isOpen, updateDropdownPosition]);

    // Scroll highlighted item into view
    React.useEffect(() => {
      if (highlightedIndex < 0 || !listRef.current) return;
      const items = listRef.current.querySelectorAll("[data-option]");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (!isOpen) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
          return;
        }

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (
                next < filteredOptions.length &&
                filteredOptions[next]?.disabled
              ) {
                next++;
              }
              return next < filteredOptions.length ? next : prev;
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && filteredOptions[next]?.disabled) {
                next--;
              }
              return next >= 0 ? next : prev;
            });
            break;
          case "Enter":
            e.preventDefault();
            if (
              highlightedIndex >= 0 &&
              highlightedIndex < filteredOptions.length
            ) {
              selectOption(filteredOptions[highlightedIndex]!);
            }
            break;
          case "Escape":
            e.preventDefault();
            close();
            break;
          case "Home":
            e.preventDefault();
            setHighlightedIndex(0);
            break;
          case "End":
            e.preventDefault();
            setHighlightedIndex(filteredOptions.length - 1);
            break;
        }
      },
      [isOpen, open, close, filteredOptions, highlightedIndex, selectOption],
    );

    const sizeIconMap: Record<string, number> = { sm: 14, md: 16, lg: 18 };
    const iconSize = sizeIconMap[size] ?? 16;

    const dropdown = isOpen ? (
      <div
        ref={dropdownRef}
        style={dropdownStyles}
        className="rounded-xl border border-white/[0.06] bg-zinc-900/80 backdrop-blur-2xl shadow-2xl shadow-black/40"
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-label={label ?? "Select options"}
      >
        {searchable && (
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-3.5 py-2.5">
            <Search size={14} className="shrink-0 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              placeholder="Search..."
              aria-label="Search options"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-sm text-zinc-500">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={option.value}
                  data-option
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 text-sm cursor-pointer transition-all duration-200 mx-1 rounded-lg",
                    isHighlighted && "bg-white/[0.06]",
                    isSelected && "text-red-400",
                    !isSelected && "text-zinc-100",
                    option.disabled &&
                      "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <>
                      {option.icon && (
                        <span className="shrink-0">{option.icon}</span>
                      )}
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-red-400" />
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    ) : null;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-zinc-400 tracking-tight"
          >
            {label}
          </label>
        )}
        <button
          ref={setRefs}
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${selectId}-error`
              : hint
                ? `${selectId}-hint`
                : undefined
          }
          disabled={disabled}
          onClick={() => (isOpen ? close() : open())}
          onKeyDown={handleKeyDown}
          className={cn(
            triggerVariants({ size }),
            error
              ? "border-red-500/60 focus:ring-red-500/20 focus:border-red-500/50"
              : "border-white/[0.04] hover:border-white/[0.08]",
            className,
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 truncate",
              !selectedOption && "text-zinc-500",
            )}
          >
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={iconSize}
            className={cn(
              "shrink-0 text-zinc-500 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
        {typeof document !== "undefined" && dropdown
          ? createPortal(dropdown, document.body)
          : dropdown}
      </div>
    );
  },
);

Select.displayName = "Select";
