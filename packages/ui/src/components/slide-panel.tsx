"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "../lib/cn";

const widthMap = {
  sm: "max-w-[384px]",
  md: "max-w-[480px]",
  lg: "max-w-[560px]",
  xl: "max-w-[640px]",
} as const;

export interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function SlidePanel({
  open,
  onClose,
  title,
  width = "md",
  children,
  footer,
  onBack,
  className,
}: SlidePanelProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="slide-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="slide-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "slide-panel-title" : undefined}
            className={cn(
              "fixed right-0 top-0 z-50 flex h-full w-full flex-col",
              "border-l border-white/[0.06] bg-zinc-950/95 backdrop-blur-3xl shadow-2xl",
              widthMap[width],
              className,
            )}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-2.5">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {title && (
                  <h2
                    id="slide-panel-title"
                    className="text-base font-semibold text-zinc-100 tracking-tight"
                  >
                    {title}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-white/[0.06] px-6 py-4 backdrop-blur-sm">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
