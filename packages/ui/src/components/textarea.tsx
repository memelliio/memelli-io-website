"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const textareaVariants = cva(
  [
    "w-full rounded-xl border bg-zinc-900/60 backdrop-blur-xl text-zinc-100",
    "placeholder:text-zinc-500",
    "focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "transition-all duration-200",
  ],
  {
    variants: {
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-3.5 py-2.5 text-sm",
        lg: "px-4 py-3 text-base",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        both: "resize",
      },
    },
    defaultVariants: {
      size: "md",
      resize: "none",
    },
  },
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  hint?: string;
  /** Show character count (alias: showCount) */
  charCount?: boolean;
  /** @deprecated Use charCount instead */
  showCount?: boolean;
  /** Enable auto-resize as user types */
  autoResize?: boolean;
  /** Maximum number of rows when auto-resizing */
  maxRows?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      charCount: charCountProp,
      showCount,
      autoResize = false,
      maxRows,
      size = "md",
      resize = "none",
      maxLength,
      rows = 3,
      className,
      id,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const showCharCount = charCountProp ?? showCount ?? false;
    const textareaId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [currentCharCount, setCurrentCharCount] = React.useState(0);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
      },
      [ref],
    );

    const adjustHeight = React.useCallback(() => {
      const textarea = internalRef.current;
      if (!textarea || !autoResize) return;

      // Reset to auto to get the correct scrollHeight
      textarea.style.height = "auto";

      let targetHeight = textarea.scrollHeight;

      // Clamp to maxRows if specified
      if (maxRows) {
        const style = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
        const paddingTop = parseFloat(style.paddingTop);
        const paddingBottom = parseFloat(style.paddingBottom);
        const borderTop = parseFloat(style.borderTopWidth);
        const borderBottom = parseFloat(style.borderBottomWidth);
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom;

        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          textarea.style.overflowY = "auto";
        } else {
          textarea.style.overflowY = "hidden";
        }
      }

      textarea.style.height = `${targetHeight}px`;
    }, [autoResize, maxRows]);

    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, value]);

    React.useEffect(() => {
      const val =
        (value as string) ?? (defaultValue as string) ?? "";
      setCurrentCharCount(val.length);
    }, [value, defaultValue]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentCharCount(e.target.value.length);
        adjustHeight();
        onChange?.(e);
      },
      [onChange, adjustHeight],
    );

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-zinc-400 tracking-tight"
          >
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(
            textareaVariants({ size, resize: autoResize ? "none" : resize }),
            error
              ? "border-red-500/60 focus:ring-red-500/20 focus:border-red-500/50"
              : "border-white/[0.04] hover:border-white/[0.08]",
            autoResize && !maxRows && "overflow-hidden",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : hint
                ? `${textareaId}-hint`
                : undefined
          }
          {...props}
        />
        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-xs text-red-400">
                {error}
              </p>
            )}
            {!error && hint && (
              <p id={`${textareaId}-hint`} className="text-xs text-zinc-500">
                {hint}
              </p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p
              className={cn(
                "text-xs ml-auto tabular-nums",
                currentCharCount >= maxLength ? "text-red-400" : "text-zinc-500",
              )}
            >
              {currentCharCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
