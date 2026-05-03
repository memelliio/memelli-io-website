"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export type ProgressBarSize = "sm" | "md" | "lg";
export type ProgressBarColor = "primary" | "success" | "warning" | "error" | "green" | "yellow" | "red";

export interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  size?: ProgressBarSize;
  color?: ProgressBarColor;
  label?: string;
  /** @deprecated Use showPercentage instead */
  showValue?: boolean;
  showPercentage?: boolean;
  className?: string;
}

const trackVariants = cva(
  "w-full overflow-hidden rounded-full bg-zinc-800/60 backdrop-blur-sm",
  {
    variants: {
      size: {
        sm: "h-0.5",
        md: "h-1.5",
        lg: "h-2.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const colorStyles: Record<ProgressBarColor, string> = {
  primary: "bg-red-500",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  indeterminate = false,
  size = "md",
  color = "primary",
  label,
  showValue = false,
  showPercentage,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const shouldShowPercent = showPercentage ?? showValue;

  return (
    <div className={cn("w-full", className)}>
      {(label || shouldShowPercent) && (
        <div className="mb-2 flex items-center justify-between text-xs">
          {label && <span className="text-zinc-500 font-medium">{label}</span>}
          {shouldShowPercent && !indeterminate && (
            <span className="tabular-nums text-zinc-100 font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={trackVariants({ size })}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[color],
            indeterminate && "animate-indeterminate w-1/3",
          )}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.displayName = "ProgressBar";
