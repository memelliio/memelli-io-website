"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Compass, Briefcase, X } from "lucide-react";
import { useOsMode } from "../_lib/os-mode-store";
import { useWindowStore } from "../_lib/window-store";
import { useAuth } from "@/contexts/auth";

const INK = "#0B0B0F";
const INK_2 = "#1A1A1F";
const RED_FROM_INK = "#C41E3A"; // accent strip on black tab
const PAPER = "#FFFFFF";
const SOFT_LINE_DARK = "rgba(255,255,255,0.10)";
const MUTED_DARK = "rgba(255,255,255,0.55)";
const FAINT_DARK = "rgba(255,255,255,0.18)";
const FAINT_LABEL = "rgba(255,255,255,0.45)";
const LINE = "#E5E7EB";

const TASKBAR_H = 52;
const TAB_H_BOTTOM = 26;
const TAB_W_SIDE = 36;
const TAB_H_SIDE = 120;
const SIDE_TOP = 268; // 140px above SignInTab (top:408)
const DRAWER_W = 320;
const BOTTOM_RIGHT = 16;

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

type Step = { id: string; label: string; appId?: string };

export function JourneyTab() {
  const mode = useOsMode((s) => s.mode);
  const open = useWindowStore((s) => s.open);
  const { user, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (drawerRef.current?.contains(t)) return;
      if (tabRef.current?.contains(t)) return;
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

  if (isLoading) return null;

  const placement: "side" | "bottom" = user ? "bottom" : "side";
  const isBusiness = mode === "business";
  const label = isBusiness ? "My Business" : "My Journey";
  const Icon = isBusiness ? Briefcase : Compass;
  const steps: Step[] = isBusiness ? BUSINESS_STEPS : PERSONAL_STEPS;

  const openApp = (appId: string) => {
    open(appId);
    close();
  };

  // ── BOTTOM placement (logged-in) ─────────────────────────────────────
  if (placement === "bottom") {
    return (
      <>
        <button
          ref={tabRef}
          type="button"
          data-journey-tab
          onClick={() => setDrawerOpen((v) => !v)}
          title={label}
          style={{
            position: "fixed",
            bottom: TASKBAR_H,
            right: BOTTOM_RIGHT,
            height: TAB_H_BOTTOM,
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: 0,
            borderRadius: "8px 8px 0 0",
            background: INK,
            color: PAPER,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: drawerOpen
              ? "0 -4px 12px -4px rgba(15,17,21,0.40)"
              : "0 -2px 8px -2px rgba(15,17,21,0.20)",
            borderTop: `1px solid ${INK}`,
            borderLeft: `1px solid ${INK}`,
            borderRight: `1px solid ${INK}`,
            zIndex: 99996,
          }}
        >
          <Icon size={11} strokeWidth={2.4} />
          {label}
        </button>

        <div
          ref={drawerRef}
          aria-hidden={!drawerOpen}
          style={{
            position: "fixed",
            bottom: TASKBAR_H + TAB_H_BOTTOM,
            right: BOTTOM_RIGHT,
            width: 320,
            maxHeight: "min(70vh, 480px)",
            background: INK,
            color: PAPER,
            border: `1px solid ${INK_2}`,
            borderRadius: "12px 12px 0 12px",
            boxShadow: "0 -16px 36px -8px rgba(0,0,0,0.55)",
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
          <DrawerInner
            onClose={close}
            isBusiness={isBusiness}
            label={label}
            steps={steps}
            openApp={openApp}
          />
        </div>
      </>
    );
  }

  // ── SIDE placement (logged-out) ──────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        top: SIDE_TOP,
        right: 0,
        zIndex: 99996,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <button
        ref={tabRef}
        type="button"
        data-journey-tab
        onClick={() => setDrawerOpen((v) => !v)}
        aria-expanded={drawerOpen}
        aria-label={label}
        style={{
          pointerEvents: "auto",
          width: TAB_W_SIDE,
          height: TAB_H_SIDE,
          border: 0,
          margin: 0,
          padding: 0,
          cursor: "pointer",
          color: PAPER,
          background: `linear-gradient(180deg, ${INK} 0%, ${INK_2} 100%)`,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
          boxShadow:
            "-6px 0 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: drawerOpen
            ? `translateX(-${DRAWER_W}px)`
            : "translateX(0)",
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: "rotate(180deg)",
            writingMode: "vertical-rl",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      </button>

      <aside
        ref={drawerRef}
        aria-hidden={!drawerOpen}
        aria-label={label}
        style={{
          pointerEvents: drawerOpen ? "auto" : "none",
          position: "absolute",
          top: "50%",
          right: 0,
          transform: drawerOpen
            ? "translate(0, -50%)"
            : `translate(${DRAWER_W}px, -50%)`,
          width: DRAWER_W,
          maxHeight: "min(80vh, 560px)",
          background: INK,
          color: PAPER,
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          boxShadow:
            "-16px 0 40px -8px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)",
          opacity: drawerOpen ? 1 : 0,
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), opacity 280ms",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DrawerInner
          onClose={close}
          isBusiness={isBusiness}
          label={label}
          steps={steps}
          openApp={openApp}
        />
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function DrawerInner({
  onClose,
  isBusiness,
  label,
  steps,
  openApp,
}: {
  onClose: () => void;
  isBusiness: boolean;
  label: string;
  steps: Step[];
  openApp: (appId: string) => void;
}) {
  return (
    <>
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: `1px solid ${SOFT_LINE_DARK}`,
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
              color: MUTED_DARK,
            }}
          >
            {isBusiness ? "Business · Coach" : "Your Path"}
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: PAPER,
              letterSpacing: "-0.01em",
              marginTop: 2,
            }}
          >
            {label}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 0,
            background: "transparent",
            color: MUTED_DARK,
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
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 16 + 14,
            top: 18,
            bottom: 18,
            width: 1,
            background: `linear-gradient(180deg, ${MUTED_DARK} 0%, ${FAINT_DARK} 100%)`,
          }}
        />
        {steps.map((s, i) => {
          const status =
            i < CURRENT ? "done" : i === CURRENT ? "current" : "upcoming";
          const dot =
            status === "current"
              ? PAPER
              : status === "done"
                ? MUTED_DARK
                : FAINT_DARK;
          const labelColor =
            status === "current"
              ? PAPER
              : status === "done"
                ? PAPER
                : FAINT_LABEL;
          const clickable = !!s.appId;
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
                if (clickable && s.appId) openApp(s.appId);
              }}
            >
              <span
                style={{
                  width: 22,
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  color: status === "current" ? PAPER : FAINT_LABEL,
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
                      ? `0 0 0 4px rgba(255,255,255,0.10)`
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
                    color: PAPER,
                  }}
                >
                  Open
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
