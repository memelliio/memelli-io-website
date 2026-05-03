"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const toggleTrack = cva(
  "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-[3.25rem]",
      },
      checked: {
        true: "bg-red-600 shadow-[0_0_12px_rgba(147,51,234,0.3)]",
        false: "bg-zinc-800",
      },
    },
    defaultVariants: {
      size: "md",
      checked: false,
    },
  },
);

const toggleThumb = cva(
  "pointer-events-none inline-block rounded-full bg-white shadow-md ring-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
      checked: {
        true: "",
        false: "translate-x-0",
      },
    },
    compoundVariants: [
      { size: "sm", checked: true, class: "translate-x-4" },
      { size: "md", checked: true, class: "translate-x-5" },
      { size: "lg", checked: true, class: "translate-x-6" },
    ],
    defaultVariants: {
      size: "md",
      checked: false,
    },
  },
);

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: "left" | "right";
  size?: ToggleSize;
  disabled?: boolean;
  description?: string;
  className?: string;
  id?: string;
}

export function Toggle({
  checked = false,
  onChange,
  label,
  labelPosition = "right",
  size = "md",
  disabled = false,
  description,
  className,
  id,
}: ToggleProps) {
  const toggleId = id || React.useId();

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  const labelSizeClass: Record<ToggleSize, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? `${toggleId}-label` : undefined}
      aria-describedby={description ? `${toggleId}-desc` : undefined}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={toggleTrack({ size, checked })}
    >
      <span className={toggleThumb({ size, checked })} />
    </button>
  );

  if (!label) {
    return <div className={cn("inline-flex", className)}>{control}</div>;
  }

  const labelEl = (
    <div className="flex flex-col">
      <label
        id={`${toggleId}-label`}
        className={cn(
          "font-medium text-zinc-100 cursor-pointer select-none tracking-tight",
          labelSizeClass[size],
          disabled && "cursor-not-allowed opacity-40",
        )}
        onClick={handleClick}
      >
        {label}
      </label>
      {description && (
        <span
          id={`${toggleId}-desc`}
          className="text-xs text-zinc-500 mt-0.5 leading-relaxed"
        >
          {description}
        </span>
      )}
    </div>
  );

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      {labelPosition === "left" && labelEl}
      {control}
      {labelPosition === "right" && labelEl}
    </div>
  );
}

Toggle.displayName = "Toggle";
