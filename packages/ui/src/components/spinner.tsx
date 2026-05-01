import * as React from "react";
import { cn } from "../lib/cn";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-7 w-7 border-2",
  lg: "h-10 w-10 border-[2.5px]",
};

export function Spinner({ size = "md", className, label = "Loading..." }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span
        className={cn(
          "block animate-spin rounded-full border-zinc-800/60 border-t-red-500 transition-all duration-200",
          sizeStyles[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
