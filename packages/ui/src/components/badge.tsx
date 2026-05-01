import * as React from "react";
import { cn } from "../lib/cn";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "primary" | "muted" | "destructive";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-800/60 text-zinc-300 border-white/[0.06]",
  success: "bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/[0.12] text-amber-400 border-amber-500/20",
  error: "bg-red-500/[0.12] text-red-400 border-red-500/20",
  info: "bg-sky-500/[0.12] text-sky-400 border-sky-500/20",
  muted: "bg-zinc-800/40 text-zinc-500 border-zinc-800/60",
  destructive: "bg-red-500/[0.12] text-red-400 border-red-500/20",
  primary: "bg-red-500/[0.12] text-red-400 border-red-500/20",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
