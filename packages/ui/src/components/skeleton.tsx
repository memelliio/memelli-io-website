"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const shimmerAnimation =
  "animate-[shimmer_2s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-zinc-800/60 via-zinc-700/40 to-zinc-800/60";

const skeletonBase = cva(cn("rounded-lg backdrop-blur-sm", shimmerAnimation), {
  variants: {
    variant: {
      line: "h-4 w-full rounded-lg",
      circle: "rounded-full",
      card: "h-40 w-full rounded-2xl",
      "table-row": "h-12 w-full rounded-xl",
      "stat-card": "h-28 w-full rounded-2xl",
    },
  },
  defaultVariants: {
    variant: "line",
  },
});

export type SkeletonVariant = "line" | "circle" | "card" | "table-row" | "stat-card";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

function SingleSkeleton({
  variant = "line",
  width,
  height,
  className,
}: Omit<SkeletonProps, "count">) {
  const style: React.CSSProperties = {};

  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  // Sensible defaults per variant when no explicit size
  if (variant === "circle" && !width && !height) {
    style.width = "40px";
    style.height = "40px";
  }

  return (
    <div
      className={cn(skeletonBase({ variant }), className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export function Skeleton({
  variant = "line",
  width,
  height,
  className,
  count = 1,
}: SkeletonProps) {
  if (count <= 1) {
    return (
      <SingleSkeleton
        variant={variant}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  const canRepeat = variant === "line" || variant === "table-row";

  if (!canRepeat) {
    return (
      <SingleSkeleton
        variant={variant}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton
          key={i}
          variant={variant}
          width={width}
          height={height}
          className={className}
        />
      ))}
    </div>
  );
}

Skeleton.displayName = "Skeleton";
