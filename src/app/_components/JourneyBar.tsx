"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StepStatus = "done" | "current" | "upcoming";

const STEPS = [
  { id: "sign-up", label: "Sign Up" },
  { id: "pre-qual", label: "Pre-Qualification" },
  { id: "documents", label: "Documents" },
  { id: "select", label: "Select Items" },
  { id: "submit", label: "Bureau Submit" },
  { id: "status", label: "Status" },
];

const CURRENT = 1; // hardcoded for v1

const TAB_W = 36;
const DRAWER_W = 280;

function statusFor(i: number): StepStatus {
  if (i < CURRENT) return "done";
  if (i === CURRENT) return "current";
  return "upcoming";
}

export function JourneyBar() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
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
  }, [open, close]);

  return (
    <div
      data-open={open}
      style={{
        position: "fixed",
        top: 220,
        right: 0,
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <button
        ref={tabRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Toggle My Journey"
        style={{
          pointerEvents: "auto",
          width: TAB_W,
          height: 168,
          border: 0,
          margin: 0,
          padding: 0,
          cursor: "pointer",
          color: "#faf6f0",
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(26,10,31,0.94) 100%)",
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
          boxShadow:
            "-6px 0 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(196,30,58,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: open ? `translateX(-${DRAWER_W}px)` : "translateX(0)",
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(180deg, rgba(196,30,58,0.32) 0%, rgba(26,10,31,0.94) 100%)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(26,10,31,0.94) 100%)";
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: "rotate(180deg)",
            writingMode: "vertical-rl",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          My Journey
        </span>
      </button>

      <aside
        ref={drawerRef}
        aria-hidden={!open}
        aria-label="My Journey"
        style={{
          pointerEvents: open ? "auto" : "none",
          position: "absolute",
          top: "50%",
          right: 0,
          transform: open
            ? "translate(0, -50%)"
            : `translate(${DRAWER_W}px, -50%)`,
          width: DRAWER_W,
          maxHeight: "80vh",
          padding: "26px 22px 22px",
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.95) 0%, rgba(26,10,31,0.95) 100%)",
          color: "#faf6f0",
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          boxShadow:
            "-12px 0 36px -8px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          opacity: open ? 1 : 0,
          transition:
            "transform 480ms cubic-bezier(0.16,1,0.3,1), opacity 280ms",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--brand-color, #C41E3A)",
            }}
          >
            Your path
          </span>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: "4px 0 0",
              color: "#faf6f0",
            }}
          >
            My Journey
          </h2>
        </div>

        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          {/* spine */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 30,
              top: 14,
              bottom: 14,
              width: 1,
              background:
                "linear-gradient(180deg, rgba(196,30,58,0.6) 0%, rgba(196,30,58,0.18) 100%)",
            }}
          />
          {STEPS.map((s, i) => {
            const status = statusFor(i);
            const dotColor =
              status === "current"
                ? "var(--brand-color, #C41E3A)"
                : status === "done"
                  ? "#faf6f0"
                  : "rgba(255,255,255,0.25)";
            const labelColor =
              status === "current"
                ? "var(--brand-color, #C41E3A)"
                : status === "done"
                  ? "#faf6f0"
                  : "rgba(255,255,255,0.45)";
            return (
              <li
                key={s.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                  paddingLeft: 4,
                }}
              >
                <span
                  style={{
                    width: 24,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color:
                      status === "current"
                        ? "#fca5a5"
                        : "rgba(255,255,255,0.35)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: dotColor,
                    boxShadow:
                      status === "current"
                        ? "0 0 0 4px rgba(196,30,58,0.18), 0 0 18px rgba(196,30,58,0.55)"
                        : "none",
                    flexShrink: 0,
                    transition: "background 200ms",
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
              </li>
            );
          })}
        </ol>

        <p
          style={{
            margin: "20px 0 0",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          Tracking {CURRENT + 1} of {STEPS.length}
        </p>
      </aside>
    </div>
  );
}
