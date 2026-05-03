"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { Badge, type BadgeVariant } from "./badge";

type StatusColor = "green" | "yellow" | "red" | "gray" | "blue";

const defaultStatusMap: Record<string, StatusColor> = {
  // Green
  active: "green",
  success: "green",
  completed: "green",
  approved: "green",
  // Yellow
  pending: "yellow",
  processing: "yellow",
  in_progress: "yellow",
  // Red
  error: "red",
  failed: "red",
  rejected: "red",
  // Gray
  inactive: "gray",
  archived: "gray",
  cancelled: "gray",
  // Blue
  draft: "blue",
  new: "blue",
};

const colorToBadgeVariant: Record<StatusColor, BadgeVariant> = {
  green: "success",
  yellow: "warning",
  red: "error",
  gray: "default",
  blue: "info",
};

const statusBadgeVariants = cva("backdrop-blur-sm rounded-lg transition-all duration-200", {
  variants: {
    size: {
      sm: "text-[10px] px-2 py-0.5",
      md: "text-xs px-2.5 py-0.5",
      lg: "text-sm px-3 py-1",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: string;
  customMap?: Record<string, StatusColor>;
  className?: string;
}

function formatLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  customMap,
  size,
  className,
}: StatusBadgeProps) {
  const merged = customMap
    ? { ...defaultStatusMap, ...customMap }
    : defaultStatusMap;

  const color: StatusColor = merged[status.toLowerCase()] ?? "gray";
  const badgeVariant = colorToBadgeVariant[color];

  return (
    <Badge
      variant={badgeVariant}
      className={cn(statusBadgeVariants({ size }), className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}
