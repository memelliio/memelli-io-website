"use client";

/**
 * Global animation primitives — reusable across Memelli OS, Revenue Builder,
 * site builds, etc. Designed to feel restrained + premium, not "AI default".
 *
 * Every primitive respects `prefers-reduced-motion`.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────────────
// useIsNarrow — viewport-based mobile detection (browser only)
// ─────────────────────────────────────────────────────────────────────
export function useIsNarrow(breakpoint = 768): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpoint]);
  return narrow;
}

// ─────────────────────────────────────────────────────────────────────
// useReducedMotion — respect system preference
// ─────────────────────────────────────────────────────────────────────
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

// ─────────────────────────────────────────────────────────────────────
// FadeIn — opacity + translate-up on mount, optional delay
// ─────────────────────────────────────────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  duration = 480,
  distance = 12,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), reduced ? 0 : delay);
    return () => window.clearTimeout(t);
  }, [delay, reduced]);
  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${distance}px)`,
        transition: reduced
          ? undefined
          : `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1), transform ${duration}ms cubic-bezier(0.16,1,0.3,1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stagger — wraps children and animates each in sequence
// ─────────────────────────────────────────────────────────────────────
export function Stagger({
  children,
  gap = 80,
  baseDelay = 0,
  duration = 480,
  distance = 10,
}: {
  children: ReactNode;
  gap?: number;
  baseDelay?: number;
  duration?: number;
  distance?: number;
}) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <>
      {arr.map((child, i) => (
        <FadeIn
          key={i}
          delay={baseDelay + i * gap}
          duration={duration}
          distance={distance}
        >
          {child}
        </FadeIn>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BlurIn — blur(12px) + opacity → blur(0) + opacity 1
// ─────────────────────────────────────────────────────────────────────
export function BlurIn({
  children,
  delay = 0,
  duration = 600,
  startBlur = 12,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  startBlur?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), reduced ? 0 : delay);
    return () => window.clearTimeout(t);
  }, [delay, reduced]);
  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        filter: shown ? "blur(0)" : `blur(${startBlur}px)`,
        transition: reduced
          ? undefined
          : `opacity ${duration}ms ease-out, filter ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CountUp — animated numeric counter
// ─────────────────────────────────────────────────────────────────────
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function CountUp({
  to,
  from = 0,
  duration = 1400,
  delay = 0,
  prefix = "",
  suffix = "",
  format,
  className,
  style,
}: {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? to : from);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (reduced) {
      setVal(to);
      return;
    }
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      if (elapsed < 0) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(t);
      setVal(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, delay, reduced]);

  const display = useMemo(() => {
    if (format) return format(val);
    return Math.round(val).toLocaleString();
  }, [val, format]);

  return (
    <span className={className} style={style}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Typewriter — types text char-by-char with optional cursor
// ─────────────────────────────────────────────────────────────────────
export function Typewriter({
  text,
  speed = 22,
  delay = 0,
  cursor = false,
  className,
  style,
  onDone,
}: {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? text : "");
  useEffect(() => {
    if (reduced) {
      setShown(text);
      onDone?.();
      return;
    }
    let i = 0;
    let mounted = true;
    let intId: number | null = null;
    const start = window.setTimeout(() => {
      intId = window.setInterval(() => {
        if (!mounted) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          if (intId) window.clearInterval(intId);
          onDone?.();
        }
      }, speed);
    }, delay);
    return () => {
      mounted = false;
      window.clearTimeout(start);
      if (intId) window.clearInterval(intId);
    };
  }, [text, speed, delay, reduced, onDone]);
  return (
    <span className={className} style={style}>
      {shown}
      {cursor && shown.length < text.length && (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.55em",
            height: "1em",
            background: "currentColor",
            marginLeft: 1,
            verticalAlign: "-0.12em",
            animation: "memelli-cursor 1s steps(2) infinite",
          }}
        />
      )}
      <style>{"@keyframes memelli-cursor{50%{opacity:0}}"}</style>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Reveal — entrance variant: dissolve / scale / slide / fan
// ─────────────────────────────────────────────────────────────────────
export type RevealVariant =
  | "dissolve"
  | "scale-in"
  | "slide-right"
  | "fan-up";

export function Reveal({
  variant = "dissolve",
  children,
  duration = 520,
  delay = 0,
  style,
  className,
}: {
  variant?: RevealVariant;
  children: ReactNode;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), reduced ? 0 : delay);
    return () => window.clearTimeout(t);
  }, [delay, reduced]);

  const init: React.CSSProperties = (() => {
    if (reduced) return {};
    switch (variant) {
      case "dissolve":
        return { opacity: 0, filter: "blur(8px)" };
      case "scale-in":
        return {
          opacity: 0,
          transform: "scale(0.94)",
        };
      case "slide-right":
        return { opacity: 0, transform: "translateX(40px)" };
      case "fan-up":
        return { opacity: 0, transform: "translateY(20px) scale(0.97)" };
    }
  })();

  const target: React.CSSProperties = {
    opacity: 1,
    filter: "blur(0)",
    transform: "none",
  };

  const transition = reduced
    ? undefined
    : `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1), filter ${duration}ms cubic-bezier(0.16,1,0.3,1), transform ${duration}ms cubic-bezier(0.16,1,0.3,1)`;

  return (
    <div
      className={className}
      style={{
        ...style,
        ...(shown ? target : init),
        transition,
        willChange: "opacity, filter, transform",
      }}
    >
      {children}
    </div>
  );
}
