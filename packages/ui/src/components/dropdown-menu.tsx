"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/cn";

// --- Context ---

interface DropdownContextValue {
  isOpen: boolean;
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown sub-components must be used inside <DropdownMenu>");
  return ctx;
}

// --- DropdownMenu ---

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const close = React.useCallback(() => setIsOpen(false), []);

  // Close on outside click
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  return (
    <DropdownContext.Provider value={{ isOpen, close }}>
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && (child.type as { displayName?: string }).displayName === "DropdownTrigger") {
            return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
              onClick: () => setIsOpen((o) => !o),
            });
          }
          return child;
        })}
      </div>
    </DropdownContext.Provider>
  );
}

// --- DropdownTrigger ---

export interface DropdownTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownTrigger({ children, onClick, className }: DropdownTriggerProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </div>
  );
}
DropdownTrigger.displayName = "DropdownTrigger";

// --- DropdownContent ---

export interface DropdownContentProps {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownContent({ children, align = "left", className }: DropdownContentProps) {
  const { isOpen } = useDropdownContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            "absolute z-50 mt-1.5 min-w-[11rem] rounded-xl border border-white/[0.06] bg-zinc-950/95 backdrop-blur-2xl p-1 shadow-2xl shadow-black/40",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- DropdownItem ---

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export function DropdownItem({ children, destructive, icon, onClick, className, ...props }: DropdownItemProps) {
  const { close } = useDropdownContext();

  return (
    <button
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200",
        "focus:outline-none focus-visible:bg-white/[0.04]",
        destructive
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100",
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      {...props}
    >
      {icon && <span className="shrink-0 opacity-60">{icon}</span>}
      {children}
    </button>
  );
}

// --- DropdownDivider ---

export function DropdownDivider({ className }: { className?: string }) {
  return <hr className={cn("my-1 border-white/[0.06]", className)} role="separator" />;
}
