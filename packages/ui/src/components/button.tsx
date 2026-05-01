import * as React from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.15)] hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] active:bg-red-700",
  secondary:
    "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-white/[0.06] active:bg-zinc-700",
  ghost:
    "bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 active:bg-white/[0.06]",
  destructive:
    "bg-red-600/90 hover:bg-red-500 text-white active:bg-red-700",
  outline:
    "bg-transparent border border-zinc-700/60 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 active:bg-zinc-800/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5",
  md: "h-10 px-5 py-2.5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...rest}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
