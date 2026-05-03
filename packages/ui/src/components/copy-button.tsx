"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Copy, Check } from "lucide-react";
import { cn } from "../lib/cn";

export type CopyButtonSize = "sm" | "md" | "lg";

export interface CopyButtonProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  size?: CopyButtonSize;
  onCopy?: (text: string) => void;
}

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center rounded-lg transition-all duration-200",
    "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] active:bg-white/[0.08]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30",
  ],
  {
    variants: {
      size: {
        sm: "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5",
        md: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  children,
  className,
  size = "md",
  onCopy,
}) => {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);

      // Toast feedback via sonner if available
      try {
        // Dynamic import to keep sonner optional
        const sonner = await import(/* webpackIgnore: true */ "sonner" as string);
        sonner.toast?.success?.("Copied to clipboard");
      } catch {
        // sonner not installed — skip toast
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard access is denied
    }
  }, [text, onCopy]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (children) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={className}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(buttonVariants({ size }), className)}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="text-emerald-400" />
      ) : (
        <Copy />
      )}
    </button>
  );
};

CopyButton.displayName = "CopyButton";
