import * as React from "react";
import { cn } from "../lib/cn";

// --- FormField ---

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormField({ children, className, ...props }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {children}
    </div>
  );
}

// --- FormLabel ---

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-zinc-400 tracking-tight", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-400" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// --- FormMessage (error) ---

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormMessage({ children, className, ...props }: FormMessageProps) {
  if (!children) return null;
  return (
    <p
      className={cn("text-xs font-medium text-red-400", className)}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
}

// --- FormDescription ---

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export function FormDescription({ children, className, ...props }: FormDescriptionProps) {
  if (!children) return null;
  return (
    <p
      className={cn("text-xs text-zinc-500", className)}
      {...props}
    >
      {children}
    </p>
  );
}
