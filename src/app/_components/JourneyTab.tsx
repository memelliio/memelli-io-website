"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Compass, Briefcase, X } from "lucide-react";
import { useOsMode } from "../_lib/os-mode-store";
import { useWindowStore } from "../_lib/window-store";

const RED = "#C41E3A";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";

const TASKBAR_H = 52;
const TAB_H = 26;

const PERSONAL_STEPS = [
  { id: "signup", label: "Sign Up", appId: "signup" },
  { id: "prequal", label: "Pre-Qualification", appId: "pre-qualification" },
  { id: "documents", label: "Documents" },
  { id: "select", label: "Select Items" },
  { id: "submit", label: "Bureau Submit" },
  { id: "status", label: "Status" },
];

const BUSINESS_STEPS = [
  { id: "setup", label: "Setup Your Store" },
  { id: "products", label: "Add Products" },
  { id: "payments", label: "Connect Payments" },
  { id: "marketing", label: "Marketing Plan" },
  { id: "launch", label: "Launch" },
  { id: "scale", label: "Scale & Coach" },
];

const CURRENT = 0;

export function JourneyTab() {
  const mode = useOsMode((s) => s.mode);
  const open = useWindowStore((s) => s.open);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (drawerRef.current?.contains(t)) return;
      // ignore clicks on the tab itself
      const tab = document.querySelector("[data-journey-tab]");
      if (tab && tab.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, close]);

  const isBusiness = mode === "business";
  const label = isBusiness ? "My Business" : "My Journey";
  const Icon = isBusiness ? Briefcase : Compass;
  const steps = isBusiness ? BUSINESS_STEPS : PERSONAL_STEPS;

  return (
    <>
      {/* The pinned tab — sits ON TOP of the bottom taskbar */}
      <button
        type="button"
        data-journey-tab
        onClick={() => setDrawerOpen(!drawerOpen)}
        title={label}
        style={{
          position: "fixed",
          bottom: TASKBAR_H,
          right: 16,
          height: TAB_H,
          padding: "0 14px",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: 0,
          borderRadius: "8px 8px 0 0",
          background: drawerOpen
            ? `linear-gradient(180deg, ${RED}, ${RED_2})`
            : PAPER,
          color: drawerOpen ? PAPER : INK,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: drawerOpen
            ? "0 -4px 12px -4px rgba(196,30,58,0.4)"
            : "0 -2px 8px -2px rgba(15,17,21,0.10)",
          borderTop: `1px solid ${drawerOpen ? RED : LINE}`,
          borderLeft: `1px solid ${drawerOpen ? RED : LINE}`,
          borderRight: `1px solid ${drawerOpen ? RED : LINE}`,
          zIndex: 99996,
        }}
      >
        <Icon size={11} strokeWidth={2.4} />
        {label}
      </button>

      {/* Drawer — opens UPWARD from the tab */}
      <div
        ref={drawerRef}
        aria-hidden={!drawerOpen}
        style={{
          position: "fixed",
          bottom: TASKBAR_H + TAB_H,
          right: 16,
          width: 320,
          maxHeight: "min(70vh, 480px)",
          background: PAPER,
          border: `1px solid ${LINE}`,
          borderRadius: "12px 12px 0 12px",
          boxShadow: "0 -16px 36px -8px rgba(15,17,21,0.18)",
          zIndex: 99995,
          transform: drawerOpen
            ? "translateY(0)"
            : "translateY(20px) scale(0.96)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transformOrigin: "bottom right",
          transition:
            "transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 200ms",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px 10px",
            borderBottom: `1px solid ${LINE}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: RED,
              }}
            >
              {isBusiness ? "Business · Coach" : "Your Path"}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: INK,
                letterSpacing: "-0.01em",
                marginTop: 2,
              }}
            >
              {label}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 0,
              background: "transparent",
              color: MUTED,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>

        <ol
          style={{
            margin: 0,
            padding: "12px 16px 16px",
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* spine */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 16 + 14,
              top: 18,
              bottom: 18,
              width: 1,
              background: `linear-gradient(180deg, ${RED}99 0%, ${RED}30 100%)`,
            }}
          />
          {steps.map((s, i) => {
            const status =
              i < CURRENT ? "done" : i === CURRENT ? "current" : "upcoming";
            const dot =
              status === "current"
                ? RED
                : status === "done"
                  ? INK
                  : "rgba(15,17,21,0.18)";
            const labelColor =
              status === "current"
                ? RED
                : status === "done"
                  ? INK
                  : MUTED;
            const clickable = "appId" in s && !!s.appId;
            return (
              <li
                key={s.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  cursor: clickable ? "pointer" : "default",
                }}
                onClick={() => {
                  if (clickable) {
                    open((s as { appId: string }).appId);
                    close();
                  }
                }}
              >
                <span
                  style={{
                    width: 22,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    color: status === "current" ? RED : MUTED,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: dot,
                    flexShrink: 0,
                    boxShadow:
                      status === "current"
                        ? `0 0 0 4px ${RED}1a`
                        : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: status === "current" ? 700 : 500,
                    color: labelColor,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {s.label}
                </span>
                {clickable && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: RED,
                    }}
                  >
                    Open
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
