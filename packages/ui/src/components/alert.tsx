"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, AlertTriangle, XCircle, CheckCircle, X } from "lucide-react";
import { cn } from "../lib/cn";

const alertVariants = cva(
  "relative flex gap-3 rounded-xl border-l-4 p-4 text-sm backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        info: "border-l-sky-500 bg-sky-500/[0.06] text-sky-300",
        warning: "border-l-amber-500 bg-amber-500/[0.06] text-amber-300",
        error: "border-l-red-500 bg-red-500/[0.06] text-red-300",
        success: "border-l-emerald-500 bg-emerald-500/[0.06] text-emerald-300",
      },
      banner: {
        true: "rounded-none border-x-0 w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "info",
      banner: false,
    },
  },
);

const iconMap: Record<string, React.ComponentType<{className?: string}>> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const iconColorMap: Record<string, string> = {
  info: "text-sky-400",
  warning: "text-amber-400",
  error: "text-red-400",
  success: "text-emerald-400",
};

export type AlertVariant = "info" | "warning" | "error" | "success";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  banner?: boolean;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  banner = false,
  className,
}: AlertProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const IconComponent = iconMap[variant];
  const resolvedIcon = icon ?? (
    <IconComponent className={cn("h-5 w-5 shrink-0 mt-0.5", iconColorMap[variant])} />
  );

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant, banner }), className)}
    >
      {resolvedIcon}

      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-medium text-zinc-100 mb-1 tracking-tight">{title}</h5>
        )}
        {children && (
          <div className="text-sm text-inherit/80 leading-relaxed">{children}</div>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            "shrink-0 rounded-lg p-1.5 transition-all duration-200",
            "hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
            iconColorMap[variant],
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

Alert.displayName = "Alert";
