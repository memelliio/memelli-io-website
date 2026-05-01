"use client";

import * as React from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  position?: "bottom" | "left";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  position = "bottom",
  title,
  children,
  className,
}: DrawerProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100) onClose();
  };

  const isBottom = position === "bottom";

  const panelMotion = isBottom
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      }
    : {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            {...panelMotion}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag={isBottom ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={isBottom ? handleDragEnd : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "drawer-title" : undefined}
            className={cn(
              "fixed z-50 border-white/[0.06] bg-zinc-900/80 backdrop-blur-2xl shadow-2xl shadow-black/40",
              isBottom
                ? "bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl border-t"
                : "left-0 top-0 h-full w-80 rounded-r-2xl border-r",
              className,
            )}
          >
            {/* Drag handle (bottom only) */}
            {isBottom && (
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-white/[0.12]" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
                <h2
                  id="drawer-title"
                  className="text-base font-semibold text-zinc-100 tracking-tight"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
