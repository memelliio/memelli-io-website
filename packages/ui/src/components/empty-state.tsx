import * as React from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";

export interface EmptyStateAction extends Omit<ButtonProps, "children"> {
  label: string;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const { label: actionLabel, ...actionProps } = action ?? { label: "" };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/[0.06] bg-zinc-900/30 backdrop-blur-sm px-8 py-20 text-center transition-all duration-200",
        className,
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/50 backdrop-blur-sm text-zinc-400 border border-white/[0.04]">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-base font-semibold text-zinc-100 tracking-tight">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-zinc-500 leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="primary" size="sm" {...actionProps}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
