"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRegistryStore } from "../../_lib/registry-store";
import { useWindowStore } from "../../_lib/window-store";
import { useOsMode } from "../../_lib/os-mode-store";
import { useAuth } from "@/contexts/auth";
import { getPitch, type ModulePitch } from "../../_lib/module-pitches";
import { ModulePitchModal } from "../ModulePitchModal";
import { DEMO_CONTACTS, useContactStore } from "../../_lib/contact-store";

const LONG_PRESS_MS = 500;

const INK = "#0B0B0F";
const RED = "var(--brand-color, #C41E3A)";
const PAPER = "#FFFFFF";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";

export function MobileHomeScreen() {
  const APPS = useRegistryStore((s) => s.apps);
  const open = useWindowStore((s) => s.open);
  const pins = useWindowStore((s) => s.pins);
  const mode = useOsMode((s) => s.mode);
  const setActive = useContactStore((s) => s.setActive);
  const activeId = useContactStore((s) => s.activeContactId);
  const { user } = useAuth();
  const [pitch, setPitch] = useState<ModulePitch | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(0);

  // Dynamic column count based on viewport width
  const DEFAULT_COLS = 4;
  const ROWS = 6; // fixed number of rows per page
  const [cols, setCols] = useState(DEFAULT_COLS);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w <= 360) setCols(3);
      else if (w <= 480) setCols(4);
      else if (w <= 640) setCols(5);
      else setCols(6);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const ICONS_PER_PAGE = cols * ROWS;

  // Wiggle / edit mode (iPhone home screen edit)
  const [wiggle, setWiggle] = useState(false);
  // Custom layout — when set, overrides the auto-paginated icons.
  // Each entry is an app id; null = blank slot. Pages snapshot when entering wiggle.
  const [layout, setLayout] = useState<(string | null)[][] | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressMoved = useRef(false);
  const dragCellId = useRef<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    appId: string;
    x: number;
    y: number;
  } | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  useEffect(() => {
    if (!wiggle) return;
    const onTouchOutside = (e: TouchEvent) => {
      const tgt = e.target as Node | null;
      if (!tgt) return;
      // Tapping inside a wiggling cell shouldn't exit; tapping the bg does.
      const cell = (tgt as HTMLElement).closest?.("[data-mob-cell]");
      const addBtn = (tgt as HTMLElement).closest?.("[data-add-page]");
      if (!cell && !addBtn) {
        setWiggle(false);
        setLayout(null);
      }
    };
    document.addEventListener("touchstart", onTouchOutside, { passive: true });
    return () => document.removeEventListener("touchstart", onTouchOutside);
  }, [wiggle]);

  // Mode-filter icons consistently for ALL surfaces (anon + logged-in).
  // Pins live in the dock — exclude them from the home grid.
  const icons = useMemo(() => {
    const pinSet = new Set(pins);
    return APPS.filter((a) => {
      if (a.category === "hidden") return false;
      if (pinSet.has(a.id)) return false;
      if (!a.modes || a.modes.length === 0) return true;
      return a.modes.includes(mode);
    });
  }, [mode, pins, APPS]);

  // Auto-paginate by default; once the user enters wiggle, snapshot a
  // mutable layout (string|null per slot) we can reorder.
  const autoPages = useMemo(() => {
    const out: typeof icons[] = [];
    for (let i = 0; i < icons.length; i += ICONS_PER_PAGE) {
      out.push(icons.slice(i, i + ICONS_PER_PAGE));
    }
    return out.length === 0 ? [[]] : out;
  }, [icons, ICONS_PER_PAGE]);

  // Effective pages — array of (string|null) ids. When layout is null
  // (default state), derive from autoPages.
  const effectivePages: (string | null)[][] = useMemo(() => {
    if (layout) return layout;
    return autoPages.map((page) => page.map((a) => a.id));
  }, [layout, autoPages]);

  const pages = effectivePages;

  // Clamp pageIdx if pages count shrinks (e.g. switching mode).
  const safePage = Math.min(pageIdx, pages.length - 1);

  const handleClick = (appId: string, label: string) => {
    // While wiggling, taps shouldn't open the app.
    if (wiggle) return;
    if (!user) {
      const p = getPitch(appId, label);
      if (p) {
        setPitch(p);
        return;
      }
    }
    open(appId);
  };

  // Keep a ref of the layout so drag callbacks have synchronous access
  // (state updates are async — the mouse-up handler can fire before React
  // re-renders, so reading from state alone misses the snapshot).
  const layoutRef = useRef<(string | null)[][] | null>(null);
  layoutRef.current = layout;

  const ensureLayout = (): (string | null)[][] => {
    if (layoutRef.current) return layoutRef.current;
    const snap = autoPages.map((page) => page.map((a) => a.id));
    layoutRef.current = snap;
    setLayout(snap);
    return snap;
  };

  const startLongPress = (appId: string) => {
    longPressMoved.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      if (longPressMoved.current) return;
      ensureLayout();
      setWiggle(true);
      if ("vibrate" in navigator) navigator.vibrate?.(8);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Drag during wiggle — re-order slots. Uses elementFromPoint to find target.
  const onCellPointerStart = (appId: string, x: number, y: number) => {
    if (!wiggle) return;
    dragCellId.current = appId;
    lastPointer.current = { x, y };
    setDragGhost({ appId, x, y });
  };
  const onCellPointerMove = (x: number, y: number) => {
    if (!wiggle || !dragCellId.current) return;
    lastPointer.current = { x, y };
    setDragGhost({ appId: dragCellId.current, x, y });
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest?.("[data-mob-cell]") as HTMLElement | null;
    setHoverCell(cell?.dataset.mobCell ?? null);
  };
  const onCellTouchStart = (appId: string, e: React.TouchEvent) => {
    if (!wiggle) return;
    const t = e.touches[0];
    if (t) onCellPointerStart(appId, t.clientX, t.clientY);
  };
  const onCellTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) onCellPointerMove(t.clientX, t.clientY);
  };
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  const onCellTouchEnd = () => {
    if (!wiggle || !dragCellId.current) {
      dragCellId.current = null;
      setDragGhost(null);
      setHoverCell(null);
      return;
    }
    const fromId = dragCellId.current;
    const current = ensureLayout();

    // Decide drop target based on what's at the last pointer position.
    const p = lastPointer.current;
    let action: "reorder" | "pin" | "noop" = "noop";
    let toId: string | null = null;
    if (p) {
      const el = document.elementFromPoint(p.x, p.y) as HTMLElement | null;
      if (el?.closest?.("[data-mob-dock]")) action = "pin";
      else {
        const cell = el?.closest?.("[data-mob-cell]") as HTMLElement | null;
        if (cell && cell.dataset.mobCell && cell.dataset.mobCell !== fromId) {
          action = "reorder";
          toId = cell.dataset.mobCell;
        }
      }
    }

    if (action === "pin") {
      // Add to taskbar pins; remove from layout pages.
      if (!pins.includes(fromId)) {
        useWindowStore.getState().pinApp(fromId);
      }
    } else if (action === "reorder" && toId) {
      // iOS-style insert-shift: pull `fromId` out, insert at `toId`'s index.
      let fromPi = -1,
        fromIi = -1,
        toPi = -1,
        toIi = -1;
      current.forEach((page, pi) => {
        page.forEach((id, ii) => {
          if (id === fromId) {
            fromPi = pi;
            fromIi = ii;
          }
          if (id === toId) {
            toPi = pi;
            toIi = ii;
          }
        });
      });
      if (fromPi >= 0 && toPi >= 0) {
        const next = current.map((p) => [...p]);
        // Remove the source token first
        next[fromPi].splice(fromIi, 1);
        // After splice, target index might have shifted within same page
        const adjustedToIi =
          fromPi === toPi && fromIi < toIi ? toIi - 1 : toIi;
        next[toPi].splice(adjustedToIi, 0, fromId);
        layoutRef.current = next;
        setLayout(next);
      }
    }

    dragCellId.current = null;
    setDragGhost(null);
    setHoverCell(null);
    lastPointer.current = null;
  };

  const addPage = () => {
    setLayout((prev) => {
      const base = prev ?? autoPages.map((p) => p.map((a) => a.id));
      return [...base, []];
    });
    setPageIdx((i) => i + 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    setDrag((e.touches[0]?.clientX ?? startX.current) - startX.current);
  };
  const onTouchEnd = () => {
    if (containerRef.current && startX.current != null) {
      const w = containerRef.current.offsetWidth;
      if (drag < -w * 0.18 && safePage < pages.length - 1) {
        setPageIdx(safePage + 1);
      } else if (drag > w * 0.18 && safePage > 0) {
        setPageIdx(safePage - 1);
      }
    }
    startX.current = null;
    setDrag(0);
  };

  const isBusiness = mode === "business";

  return (
    <>
      {/* Contacts strip — only in Business mode. iOS-Messages style chips. */}
      {isBusiness && (
        <div
          style={{
            flex: "0 0 auto",
            paddingTop: 6,
            paddingBottom: 10,
            paddingLeft: 16,
            paddingRight: 16,
            overflowX: "auto",
            overflowY: "hidden",
            display: "flex",
            gap: 14,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            borderBottom: `1px solid rgba(15,17,21,0.06)`,
          }}
        >
          {DEMO_CONTACTS.map((c) => {
            const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
            const focused = activeId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(focused ? null : c.id)}
                style={{
                  flex: "0 0 auto",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  width: 56,
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: focused
                      ? `linear-gradient(135deg, ${RED}, #A8182F)`
                      : "linear-gradient(135deg, #E5E7EB, #C9C9CD)",
                    color: focused ? PAPER : INK,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: focused
                      ? "0 6px 18px -8px rgba(196,30,58,0.55)"
                      : "0 4px 10px -6px rgba(15,17,21,0.18)",
                    outline: focused
                      ? `2px solid ${PAPER}`
                      : `2px solid transparent`,
                    outlineOffset: focused ? 2 : 0,
                  }}
                >
                  {initials || "?"}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: INK,
                    letterSpacing: "-0.1px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {c.firstName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          paddingTop: isBusiness ? 12 : 24,
          paddingBottom: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            width: `${pages.length * 100}%`,
            height: "100%",
            transform: `translateX(calc(${-safePage * (100 / pages.length)}% + ${drag}px))`,
            transition:
              startX.current == null
                ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
          }}
        >
          {pages.map((pageIds, pi) => (
            <div
              key={pi}
              style={{
                width: `${100 / pages.length}%`,
                padding: "0 18px",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 18,
                gridAutoRows: "min-content",
                alignContent: "start",
              }}
            >
              {pageIds.map((id, slotIdx) => {
                const app = id ? APPS.find((a) => a.id === id) : null;
                if (!app) {
                  return (
                    <span
                      key={`empty-${pi}-${slotIdx}`}
                      aria-hidden
                      style={{
                        width: 60,
                        height: 60,
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                    />
                  );
                }
                const isHover = hoverCell === app.id && wiggle;
                return (
                  <button
                    key={app.id}
                    type="button"
                    data-mob-cell={app.id}
                    onClick={() => handleClick(app.id, app.label)}
                    onTouchStart={(e) => {
                      if (wiggle) {
                        onCellTouchStart(app.id, e);
                      } else {
                        startLongPress(app.id);
                      }
                    }}
                    onTouchMove={(e) => {
                      longPressMoved.current = true;
                      cancelLongPress();
                      if (wiggle) onCellTouchMove(e);
                    }}
                    onTouchEnd={() => {
                      cancelLongPress();
                      if (wiggle) onCellTouchEnd();
                    }}
                    onTouchCancel={() => {
                      cancelLongPress();
                      if (wiggle) onCellTouchEnd();
                    }}
                    // Mouse fallback so the iPhone-edit gestures also work
                    // when previewing the phone with a desktop mouse.
                    onMouseDown={(e) => {
                      if (wiggle) {
                        onCellPointerStart(app.id, e.clientX, e.clientY);
                        const move = (ev: MouseEvent) =>
                          onCellPointerMove(ev.clientX, ev.clientY);
                        const up = () => {
                          onCellTouchEnd();
                          window.removeEventListener("mousemove", move);
                          window.removeEventListener("mouseup", up);
                        };
                        window.addEventListener("mousemove", move);
                        window.addEventListener("mouseup", up);
                      } else {
                        startLongPress(app.id);
                        const cancel = () => {
                          cancelLongPress();
                          window.removeEventListener("mouseup", cancel);
                          window.removeEventListener("mousemove", cancel);
                        };
                        window.addEventListener("mouseup", cancel);
                        window.addEventListener("mousemove", cancel);
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      animation: wiggle
                        ? `mob-wiggle 0.35s ease-in-out ${(slotIdx % 7) * 40}ms infinite alternate`
                        : "none",
                      transformOrigin: "center",
                      position: "relative",
                      opacity: isHover ? 0.45 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        background: PAPER,
                        boxShadow:
                          "0 1px 0 rgba(0,0,0,0.04), 0 8px 18px -10px rgba(15,17,21,0.18)",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={app.icon}
                        alt=""
                        draggable={false}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          pointerEvents: "none",
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: INK,
                        letterSpacing: "-0.1px",
                        textAlign: "center",
                        lineHeight: 1.2,
                        maxWidth: 72,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}
                    >
                      {app.label}
                    </span>
                  </button>
                );
              })}

              {/* Add Page tile — visible only on the last page during wiggle */}
              {wiggle && pi === pages.length - 1 && (
                <button
                  type="button"
                  data-add-page
                  onClick={addPage}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      background: "rgba(15,17,21,0.04)",
                      border: `1.5px dashed rgba(15,17,21,0.25)`,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Plus size={22} strokeWidth={2} color={INK} />
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: MUTED,
                      letterSpacing: "-0.1px",
                    }}
                  >
                    New Page
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Page dots — iOS style */}
        {pages.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Page ${i + 1}`}
                onClick={() => setPageIdx(i)}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  border: 0,
                  padding: 0,
                  background: i === safePage ? INK : "rgba(15,17,21,0.22)",
                  transition: "background 200ms",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit-mode "Done" pill — top-right corner, only when wiggling */}
      {wiggle && (
        <button
          type="button"
          onClick={() => {
            setWiggle(false);
            // Layout persists in component state until reload; keep it.
          }}
          style={{
            position: "absolute",
            top: 56,
            right: 14,
            zIndex: 30,
            height: 28,
            padding: "0 14px",
            background: INK,
            color: PAPER,
            border: 0,
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "0 6px 18px -4px rgba(15,17,21,0.4)",
          }}
        >
          Done
        </button>
      )}

      {/* Drag ghost — finger-following preview of the dragged icon */}
      {dragGhost && (() => {
        const a = APPS.find((x) => x.id === dragGhost.appId);
        if (!a) return null;
        return (
          <span
            aria-hidden
            style={{
              position: "fixed",
              top: dragGhost.y - 30,
              left: dragGhost.x - 30,
              width: 60,
              height: 60,
              borderRadius: 16,
              background: PAPER,
              boxShadow:
                "0 18px 32px -10px rgba(15,17,21,0.45), 0 4px 8px -2px rgba(15,17,21,0.30)",
              display: "grid",
              placeItems: "center",
              zIndex: 9999990,
              transform: "scale(1.1)",
              pointerEvents: "none",
            }}
          >
            <img
              src={a.icon}
              alt=""
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
          </span>
        );
      })()}

      <style>{`
        @keyframes mob-wiggle {
          0% { transform: rotate(-1.4deg); }
          100% { transform: rotate(1.4deg); }
        }
      `}</style>

      {pitch && (
        <ModulePitchModal pitch={pitch} onClose={() => setPitch(null)} />
      )}
    </>
  );
}