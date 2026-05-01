"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { cn } from "../lib/cn";

export interface UpgradePromptProps {
  currentPlan?: string;
  targetPlan?: string;
  features?: string[];
  onUpgrade?: () => void;
  onClose?: () => void;
  inline?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Inline variant                                                     */
/* ------------------------------------------------------------------ */

function InlinePrompt({
  currentPlan,
  targetPlan,
  features = [],
  onUpgrade,
  className,
}: Omit<UpgradePromptProps, "inline">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-600/20">
          <Sparkles className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-100">
            {targetPlan ? (
              <>
                Unlock more with{" "}
                <span className="text-red-400">{targetPlan}</span>
              </>
            ) : (
              "Upgrade your plan"
            )}
          </p>
          {features.length > 0 && (
            <ul className="mt-2 space-y-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Check className="h-3 w-3 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          {onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
            >
              {currentPlan ? `Upgrade from ${currentPlan}` : "Upgrade"}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal variant                                                      */
/* ------------------------------------------------------------------ */

function ModalPrompt({
  currentPlan,
  targetPlan,
  features = [],
  onUpgrade,
  onClose,
  className,
}: Omit<UpgradePromptProps, "inline">) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        key="upgrade-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        key="upgrade-dialog"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl",
          className,
        )}
      >
        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-6">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20">
              <Sparkles className="h-6 w-6 text-red-400" />
            </div>
          </div>

          <h3 className="mt-4 text-center text-lg font-semibold text-zinc-100">
            {targetPlan ? `Upgrade to ${targetPlan}` : "Upgrade your plan"}
          </h3>
          {currentPlan && (
            <p className="mt-1 text-center text-sm text-zinc-400">
              You are currently on the{" "}
              <span className="font-medium text-zinc-300">{currentPlan}</span>{" "}
              plan
            </p>
          )}

          {/* Comparison */}
          <div className="mt-6 space-y-4">
            {/* Current plan */}
            {currentPlan && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Current Plan
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-300">
                  {currentPlan}
                </p>
              </div>
            )}

            {/* Target plan */}
            <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-red-400">
                {targetPlan ?? "Premium"}
              </p>
              {features.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {onUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-6 w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              Upgrade now
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Public export                                                      */
/* ------------------------------------------------------------------ */

export function UpgradePrompt({ inline = true, ...props }: UpgradePromptProps) {
  if (!inline) {
    return (
      <AnimatePresence>
        <ModalPrompt {...props} />
      </AnimatePresence>
    );
  }
  return <InlinePrompt {...props} />;
}
