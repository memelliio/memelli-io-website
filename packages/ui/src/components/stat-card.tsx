import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/cn";

export interface StatCardTrend {
  value: number;
  label: string;
}

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: StatCardTrend;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5 transition-all duration-200 hover:bg-zinc-900/70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 shrink-0" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-xl bg-red-500/10 p-3 text-red-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
