"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "../lib/cn";

export interface FeatureLockProps {
  planName: string;
  feature: string;
  description?: string;
  onUpgrade?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function FeatureLock({
  planName,
  feature,
  description,
  onUpgrade,
  children,
  className,
}: FeatureLockProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Locked content (blurred) */}
      {children && (
        <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-700">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-100">{feature}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Available on{" "}
              <span className="font-medium text-red-400">{planName}</span>
            </p>
          </div>

          {description && (
            <p className="max-w-xs text-xs text-zinc-500">{description}</p>
          )}

          {onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
