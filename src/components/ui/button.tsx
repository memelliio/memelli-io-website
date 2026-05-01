'use client';

import { forwardRef, Children, cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** When true, renders children as the interactive element, merging button classes onto it. */
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
  secondary:
    'bg-muted text-foreground hover:bg-muted/80 border border-border',
  ghost:
    'text-foreground hover:bg-muted hover:text-foreground',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-[36px] px-3 text-xs md:h-8',
  md: 'h-11 min-h-[44px] px-4 text-sm md:h-9 md:min-h-[36px]',
  lg: 'h-12 min-h-[48px] px-6 text-base md:h-11 md:min-h-[44px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const composedClassName = cn(
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (asChild) {
      const child = Children.only(children);
      if (isValidElement(child)) {
        return cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
          className: cn(composedClassName, (child.props as React.HTMLAttributes<HTMLElement>).className),
        });
      }
      return <>{children}</>;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={composedClassName}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
