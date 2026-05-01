"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APPS } from "../_apps/registry";
import { useWindowStore } from "../_lib/window-store";

const TASKBAR_H = 52;
const STRIP_H = 32;

export function WindowList() {
  const windows = useWindowStore((s) => s.windows);
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const restore = useWindowStore((s) => s.restore);
  const topZ = useWindowStore((s) => s.topZ);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menu]);

  if (windows.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: TASKBAR_H,
          height: STRIP_H,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 8px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid hsl(var(--line))",
          borderBottom: "1px solid hsl(var(--line))",
          zIndex: 99995,
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          scrollbarWidth: "thin",
        }}
      >
        {windows.map((w) => {
          const app = APPS.find((a) => a.id === w.appId);
          if (!app) return null;
          const isFocused = w.zIndex === topZ && !w.minimized;
          return (
            <div
              key={w.id}
              role="button"
              tabIndex={0}
              title={w.title}
              onClick={() => {
                if (w.minimized) {
                  restore(w.id);
                  focus(w.id);
                  return;
                }
                if (isFocused) {
                  minimize(w.id);
                  return;
                }
                focus(w.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (w.minimized) {
                    restore(w.id);
                    focus(w.id);
                  } else if (isFocused) {
                    minimize(w.id);
                  } else {
                    focus(w.id);
                  }
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ id: w.id, x: e.clientX, y: e.clientY });
              }}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 6px 4px 10px",
                height: 24,
                borderRadius: 4,
                background: isFocused
                  ? "hsl(var(--background))"
                  : "transparent",
                color: "hsl(var(--ink))",
                fontSize: 12,
                cursor: "pointer",
                opacity: w.minimized ? 0.55 : 1,
                flex: "1 1 152px",
                minWidth: 110,
                maxWidth: 200,
                userSelect: "none",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                if (!isFocused) {
                  e.currentTarget.style.background = "rgba(15,17,21,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isFocused) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                }}
              >
                <img
                  src={app.icon}
                  alt=""
                  style={{ width: 14, height: 14, objectFit: "contain" }}
                />
              </span>
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: isFocused ? 600 : 500,
                }}
              >
                {w.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  close(w.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={`Close ${w.title}`}
                title={`Close ${w.title}`}
                className="grid place-items-center transition"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: 0,
                  background: "transparent",
                  color: "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(var(--primary))";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                }}
              >
                <X size={11} strokeWidth={2} />
              </button>
              {isFocused && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: 8,
                    right: 8,
                    height: 2,
                    borderRadius: 2,
                    background: "hsl(var(--primary))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {menu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            left: menu.x,
            top: Math.max(0, menu.y - 40),
            zIndex: 99998,
            background: "white",
            border: "1px solid hsl(var(--line))",
            borderRadius: 8,
            padding: 4,
            minWidth: 160,
            boxShadow: "0 12px 28px -8px rgba(15,17,21,0.18)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              close(menu.id);
              setMenu(null);
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "hsl(var(--ink))",
              fontSize: 12,
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 4,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--accent))";
              e.currentTarget.style.color = "hsl(var(--primary))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "hsl(var(--ink))";
            }}
          >
            Close window
          </button>
        </div>
      )}
    </>
  );
}
