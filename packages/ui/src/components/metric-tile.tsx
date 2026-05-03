"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../lib/cn";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MetricTileProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Trend config                                                       */
/* ------------------------------------------------------------------ */

const trendConfig = {
  up: { Icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  down: { Icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
  flat: { Icon: Minus, color: "text-zinc-400", bg: "bg-zinc-500/10" },
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MetricTile({
  label,
  value,
  change,
  trend,
  icon,
  className,
}: MetricTileProps) {
  const trendCfg = trend ? trendConfig[trend] : null;

  const formattedChange =
    change !== undefined
      ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
      : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 transition-all duration-200 hover:border-white/[0.08]",
        className,
      )}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 tracking-tight">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>

      {/* Value */}
      <div className="mt-2.5">
        <span className="text-2xl font-semibold tracking-tight text-zinc-100">
          {value}
        </span>
      </div>

      {/* Trend row */}
      {(trendCfg || formattedChange) && (
        <div className="mt-3 flex items-center gap-2">
          {trendCfg && formattedChange && (
            <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium", trendCfg.bg, trendCfg.color)}>
              <trendCfg.Icon className="h-3 w-3" />
              {formattedChange}
            </span>
          )}
          {!trendCfg && formattedChange && (
            <span className="inline-flex items-center rounded-lg bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {formattedChange}
            </span>
          )}
          {trendCfg && !formattedChange && (
            <trendCfg.Icon className={cn("h-3.5 w-3.5", trendCfg.color)} />
          )}
        </div>
      )}
    </div>
  );
}
