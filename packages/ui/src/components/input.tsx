import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-400"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl bg-zinc-900/60 border px-4 text-sm text-zinc-100",
            "placeholder:text-zinc-600",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
              : "border-white/[0.06] hover:border-white/[0.1] focus:border-red-500/50 focus:ring-red-500/20",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400 mt-1.5">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-zinc-600 mt-1.5">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
