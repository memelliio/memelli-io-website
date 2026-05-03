"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string | React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-zinc-950/95 border-x-transparent border-b-transparent",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-zinc-950/95 border-x-transparent border-t-transparent",
  left: "right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-zinc-950/95 border-y-transparent border-r-transparent",
  right: "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-zinc-950/95 border-y-transparent border-l-transparent",
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = "top",
  delay = 200,
  children,
  className,
}) => {
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    const posMap: Record<TooltipPosition, { top: number; left: number }> = {
      top: {
        top: rect.top + window.scrollY - gap,
        left: rect.left + window.scrollX + rect.width / 2,
      },
      bottom: {
        top: rect.bottom + window.scrollY + gap,
        left: rect.left + window.scrollX + rect.width / 2,
      },
      left: {
        top: rect.top + window.scrollY + rect.height / 2,
        left: rect.left + window.scrollX - gap,
      },
      right: {
        top: rect.top + window.scrollY + rect.height / 2,
        left: rect.right + window.scrollX + gap,
      },
    };

    setCoords(posMap[position]);
  }, [position]);

  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delay);
  }, [delay, updatePosition]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const transformOrigin: Record<TooltipPosition, string> = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left: "-translate-x-full -translate-y-1/2",
    right: "-translate-y-1/2",
  };

  const child = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as any).ref;
      if (typeof childRef === "function") childRef(node);
      else if (childRef) childRef.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      (children.props as Record<string, any>).onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      (children.props as Record<string, any>).onMouseLeave?.(e);
    },
  } as any);

  const tooltip =
    visible && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[9999]",
              transformOrigin[position],
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            <div
              className={cn(
                "relative rounded-lg bg-zinc-950/95 backdrop-blur-2xl border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-100 shadow-2xl shadow-black/40",
                "animate-in fade-in-0 zoom-in-95 duration-200",
                className,
              )}
            >
              {content}
              <span
                className={cn(
                  "absolute h-0 w-0 border-[4px]",
                  arrowStyles[position],
                )}
                aria-hidden="true"
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {child}
      {tooltip}
    </>
  );
};

Tooltip.displayName = "Tooltip";
