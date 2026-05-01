"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const springTransition = {
  type: "spring" as const,
  damping: 32,
  stiffness: 500,
  mass: 0.8,
};

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={springTransition}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
              "rounded-2xl border border-white/[0.06] bg-zinc-950/95 backdrop-blur-3xl",
              "shadow-[0_8px_64px_rgba(0,0,0,0.5),0_2px_16px_rgba(0,0,0,0.3)]",
              className,
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <h2 id="modal-title" className="text-lg font-semibold text-zinc-100">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-zinc-500 transition-colors duration-150 hover:bg-white/[0.04] hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-6 pb-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-white/[0.04] px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
