"use client";

import { Minus, Square, X, Copy } from "lucide-react";
import { Stub } from "../_apps/Stub";
import { useCallback, useEffect, useRef, useState } from "react";
import { APPS } from "../_apps/registry";
import { useWindowStore } from "../_lib/window-store";
import {
  computeResize,
  CURSORS,
  MIN_W,
  MIN_H,
  type ResizeDir,
  viewportBounds,
} from "../_lib/resize";
import type { WindowState } from "../_lib/types";

const HANDLE_THICK = 8;

const HANDLE_STYLE: Record<ResizeDir, React.CSSProperties> = {
  n: { top: -HANDLE_THICK / 2, left: HANDLE_THICK, right: HANDLE_THICK, height: HANDLE_THICK },
  s: { bottom: -HANDLE_THICK / 2, left: HANDLE_THICK, right: HANDLE_THICK, height: HANDLE_THICK },
  e: { right: -HANDLE_THICK / 2, top: HANDLE_THICK, bottom: HANDLE_THICK, width: HANDLE_THICK },
  w: { left: -HANDLE_THICK / 2, top: HANDLE_THICK, bottom: HANDLE_THICK, width: HANDLE_THICK },
  ne: { top: -HANDLE_THICK / 2, right: -HANDLE_THICK / 2, width: HANDLE_THICK * 2, height: HANDLE_THICK * 2 },
  nw: { top: -HANDLE_THICK / 2, left: -HANDLE_THICK / 2, width: HANDLE_THICK * 2, height: HANDLE_THICK * 2 },
  se: { bottom: -HANDLE_THICK / 2, right: -HANDLE_THICK / 2, width: HANDLE_THICK * 2, height: HANDLE_THICK * 2 },
  sw: { bottom: -HANDLE_THICK / 2, left: -HANDLE_THICK / 2, width: HANDLE_THICK * 2, height: HANDLE_THICK * 2 },
};

export function WindowFrame({ win }: { win: WindowState }) {
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMax = useWindowStore((s) => s.toggleMaximize);
  const move = useWindowStore((s) => s.move);
  const resize = useWindowStore((s) => s.resize);
  const topZ = useWindowStore((s) => s.topZ);
  const app = APPS.find((a) => a.id === win.appId);

  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const liveRef = useRef({ x: win.x, y: win.y, w: win.w, h: win.h });

  // sync liveRef with store after non-drag updates
  useEffect(() => {
    liveRef.current = { x: win.x, y: win.y, w: win.w, h: win.h };
  }, [win.x, win.y, win.w, win.h]);

  // Push liveRef → DOM via rAF. During drag we only update transform (cheap,
  // GPU-composited). During resize we also write width/height. Pointer-up
  // commits the final values to the React store.
  const scheduleCommit = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const root = rootRef.current;
      if (!root) return;
      const { x, y, w, h } = liveRef.current;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (resizingRef.current) {
        root.style.width = `${w}px`;
        root.style.height = `${h}px`;
      }
    });
  }, []);

  // ── drag handler — pointer-capture so events keep flowing even over iframes ──
  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (win.maximized) return;
    if (e.button !== 0) return;
    e.preventDefault();
    focus(win.id);
    draggingRef.current = true;

    const captureTarget = e.currentTarget;
    const pointerId = e.pointerId;
    try {
      captureTarget.setPointerCapture(pointerId);
    } catch {
      /* noop */
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startWinX = liveRef.current.x;
    const startWinY = liveRef.current.y;
    const TOP = 96;
    const BOT = 52;
    const MIN_HEADER_VISIBLE = 80;

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      // Fully free drag — no clamping. Window follows the cursor 1:1 anywhere
      // on or off the viewport. Release-time guard below keeps it recoverable
      // if it ends up fully off-screen.
      liveRef.current.x = startWinX + (ev.clientX - startX);
      liveRef.current.y = startWinY + (ev.clientY - startY);
      scheduleCommit();
    };
    const cleanup = () => {
      draggingRef.current = false;
      try {
        captureTarget.releasePointerCapture(pointerId);
      } catch {
        /* noop */
      }
      captureTarget.removeEventListener("pointermove", onMove);
      captureTarget.removeEventListener("pointerup", onUp as EventListener);
      captureTarget.removeEventListener(
        "pointercancel",
        onUp as EventListener,
      );
    };
    const onUp = (ev: PointerEvent) => {
      cleanup();
      // No top-snap: a popup released over the header stays over the header.
      // Edge tile-left / tile-right kept — they only fire at the literal screen
      // edge (within 4px), so normal dragging is unaffected.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const SNAP_EDGE = 4;
      const releaseX = ev.clientX;
      let { x, y, w, h } = liveRef.current;
      if (releaseX <= SNAP_EDGE) {
        x = 0;
        y = TOP;
        w = Math.floor(vw / 2);
        h = vh - TOP - BOT;
        liveRef.current = { x, y, w, h };
        resize(win.id, w, h, x, y);
        return;
      }
      if (releaseX >= vw - SNAP_EDGE) {
        const halfW = Math.floor(vw / 2);
        x = vw - halfW;
        y = TOP;
        w = halfW;
        h = vh - TOP - BOT;
        liveRef.current = { x, y, w, h };
        resize(win.id, w, h, x, y);
        return;
      }
      move(win.id, x, y);
    };
    captureTarget.addEventListener("pointermove", onMove);
    captureTarget.addEventListener("pointerup", onUp as EventListener);
    captureTarget.addEventListener("pointercancel", onUp as EventListener);
  };

  // ── resize handler — pointer-capture for the same anti-iframe protection ──
  const onResizeStart =
    (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (win.maximized) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      focus(win.id);
      resizingRef.current = true;

      const captureTarget = e.currentTarget;
      const pointerId = e.pointerId;
      try {
        captureTarget.setPointerCapture(pointerId);
      } catch {
        /* noop */
      }

      const args = {
        dir,
        originX: e.clientX,
        originY: e.clientY,
        startW: liveRef.current.w,
        startH: liveRef.current.h,
        startPosX: liveRef.current.x,
        startPosY: liveRef.current.y,
      };
      const bounds = viewportBounds();
      const onMove = (ev: PointerEvent) => {
        if (!resizingRef.current) return;
        const r = computeResize(args, ev.clientX, ev.clientY, bounds);
        liveRef.current = {
          x: r.posX,
          y: r.posY,
          w: r.width,
          h: r.height,
        };
        scheduleCommit();
      };
      const onUp = () => {
        resizingRef.current = false;
        try {
          captureTarget.releasePointerCapture(pointerId);
        } catch {
          /* noop */
        }
        captureTarget.removeEventListener("pointermove", onMove);
        captureTarget.removeEventListener("pointerup", onUp as EventListener);
        captureTarget.removeEventListener(
          "pointercancel",
          onUp as EventListener,
        );
        const { x, y, w, h } = liveRef.current;
        resize(win.id, w, h, x, y);
      };
      captureTarget.addEventListener("pointermove", onMove);
      captureTarget.addEventListener("pointerup", onUp as EventListener);
      captureTarget.addEventListener("pointercancel", onUp as EventListener);
    };

  // keyboard shortcuts on focused window
  useEffect(() => {
    if (win.zIndex !== topZ || win.minimized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "q") {
        e.preventDefault();
        close(win.id);
      } else if (e.key === "F11") {
        e.preventDefault();
        toggleMax(win.id);
      } else if (e.key === "Escape" && win.maximized) {
        e.preventDefault();
        toggleMax(win.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win.id, win.zIndex, win.minimized, win.maximized, topZ, close, toggleMax]);

  if (win.minimized || !app) return null;

  const isFocused = win.zIndex === topZ;
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 600px)").matches;

  return (
    <div
      ref={rootRef}
      onPointerDown={() => focus(win.id)}
      style={
        isMobile
          ? {
              // Fullscreen sheet on phone — no drag, no resize.
              position: "absolute",
              top: 48,
              left: 0,
              right: 0,
              bottom: 96,
              zIndex: win.zIndex,
              background: "white",
              borderRadius: 0,
              boxShadow: "none",
              overflow: "hidden",
              userSelect: "none",
              WebkitFontSmoothing: "antialiased",
            }
          : {
              position: "absolute",
              top: 0,
              left: 0,
              width: win.w,
              height: win.h,
              transform: `translate3d(${win.x}px, ${win.y}px, 0)`,
              zIndex: win.zIndex,
              background: "white",
              borderRadius: 12,
              boxShadow: isFocused
                ? "0 24px 48px -12px rgba(15,17,21,0.28), 0 6px 16px -4px rgba(15,17,21,0.18), 0 0 0 1px hsl(var(--line))"
                : "0 12px 28px -8px rgba(15,17,21,0.18), 0 0 0 1px hsl(var(--line))",
              overflow: "hidden",
              willChange: "transform, width, height",
              userSelect: "none",
              transition:
                resizingRef.current || draggingRef.current
                  ? "none"
                  : "box-shadow 200ms ease",
              WebkitFontSmoothing: "antialiased",
            }
      }
      className="flex flex-col"
    >
      <div
        onPointerDown={onHeaderPointerDown}
        onDoubleClick={() => toggleMax(win.id)}
        className="flex items-center gap-2 px-3 py-2 cursor-move"
        style={{
          background: isFocused
            ? "linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)"
            : "#F4F6FA",
          borderBottom: "1px solid hsl(var(--line))",
          touchAction: "none",
        }}
      >
        {app.icon && (
          <img
            src={app.icon}
            alt=""
            width={18}
            height={18}
            draggable={false}
            style={{ pointerEvents: "none" }}
          />
        )}
        <span
          className="text-[13px] truncate flex-1"
          style={{
            fontWeight: 600,
            color: isFocused ? "hsl(var(--ink))" : "hsl(var(--muted-foreground))",
          }}
        >
          {win.title}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Minimize"
            onClick={() => minimize(win.id)}
            className="w-7 h-7 grid place-items-center rounded transition"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--background))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Minus size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label={win.maximized ? "Restore" : "Maximize"}
            onClick={() => toggleMax(win.id)}
            className="w-7 h-7 grid place-items-center rounded transition"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--background))")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {win.maximized ? <Copy size={13} strokeWidth={1.8} /> : <Square size={13} strokeWidth={1.8} />}
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={() => close(win.id)}
            className="w-7 h-7 grid place-items-center rounded transition"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--primary))";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
            }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div
        className="flex-1 bg-card relative"
        data-window-body
        style={{
          minHeight: 0,
          // GLOBAL popup scroll: every window body is the scroll container.
          // Apps render their content; if it's taller than the window, the
          // body scrolls. Apps that want their own internal scroll regions
          // (Settings sidebar, Files tree) set min-height: 0 + overflow on
          // their nested element instead.
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          // While dragging or resizing, block all child pointer events so
          // inputs / buttons / iframes don't intercept pointermove and break
          // the gesture. Pointer-capture on the header keeps events flowing
          // to the WindowFrame itself.
          pointerEvents:
            draggingRef.current || resizingRef.current ? "none" : "auto",
        }}
      >
        {app.body.kind === "iframe" ? (
          <iframe
            src={app.body.src}
            title={app.label}
            className="w-full h-full border-0"
          />
        ) : app.body.kind === "stub" ? (
          <Stub
            appLabel={app.label}
            title={app.body.title}
            blurb={app.body.blurb}
            ctaHref={app.body.ctaHref}
            ctaLabel={app.body.ctaLabel}
          />
        ) : (
          <app.body.Component windowId={win.id} />
        )}
      </div>
      {!win.maximized && (
        <>
          {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeDir[]).map(
            (dir) => (
              <div
                key={dir}
                onPointerDown={onResizeStart(dir)}
                style={{
                  position: "absolute",
                  cursor: CURSORS[dir],
                  zIndex: 10,
                  touchAction: "none",
                  ...HANDLE_STYLE[dir],
                }}
              />
            ),
          )}
        </>
      )}
    </div>
  );
}
