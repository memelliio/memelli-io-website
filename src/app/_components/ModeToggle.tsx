"use client";

import { User as UserIcon, Briefcase, Plus } from "lucide-react";
import { useOsMode, type OsMode } from "../_lib/os-mode-store";
import { useWindowStore } from "../_lib/window-store";

const RED = "var(--brand-color, #C41E3A)";
const RED_2 = "#A8182F";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const BAR_BG = "var(--mellibar-bg, linear-gradient(180deg, #0F1115 0%, #18181C 100%))";
const BAR_BORDER = "var(--taskbar-border-top, 1px solid rgba(196,30,58,0.18))";
const PILL_BG = "rgba(255,255,255,0.06)";
const PILL_BORDER = "rgba(255,255,255,0.12)";
const PILL_INACTIVE_FG = "rgba(255,255,255,0.6)";
const PILL_HOVER_FG = "rgba(255,255,255,0.9)";

const MODES: { id: OsMode; label: string; icon: typeof UserIcon }[] = [
  { id: "personal", label: "Personal CRM", icon: UserIcon },
  { id: "business", label: "Business CRM", icon: Briefcase },
];

const TOP_BAR = 96;
const TOGGLE_H = 40;

export function ModeToggle() {
  const mode = useOsMode((s) => s.mode);
  const setMode = useOsMode((s) => s.setMode);
  const addPage = useWindowStore((s) => s.addPage);
  const pages = useWindowStore((s) => s.pages);
  // Always render. Visibility for anonymous + logged-in is the same.
  // Icon-filter at Desktop.tsx is what enforces what each role can open.
  return (
    <div
      style={{
        position: "fixed",
        top: TOP_BAR,
        left: 0,
        right: 0,
        height: TOGGLE_H,
        zIndex: 90,
        background: BAR_BG,
        borderBottom: BAR_BORDER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: PILL_BG,
          border: `1px solid ${PILL_BORDER}`,
          borderRadius: 9999,
          padding: 3,
        }}
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 9999,
                border: 0,
                background: active
                  ? `linear-gradient(135deg, ${RED}, ${RED_2})`
                  : "transparent",
                color: active ? PAPER : PILL_INACTIVE_FG,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 150ms",
                boxShadow: active
                  ? "0 4px 12px -4px rgba(196,30,58,0.4)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = PILL_HOVER_FG;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = PILL_INACTIVE_FG;
              }}
            >
              <Icon size={11} strokeWidth={2.4} />
              {m.label}
            </button>
          );
        })}
      </div>
      {/* Add Panel button — absolute right of the same bar, same line as the switcher */}
      <button
        type="button"
        onClick={addPage}
        title="Add panel"
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 9999,
          border: `1px solid ${LINE}`,
          background: PAPER,
          color: INK,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Plus size={11} strokeWidth={2.4} />
        Add panel
        <span
          style={{
            fontFamily:
              "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
            fontSize: 10,
            color: MUTED,
            paddingLeft: 6,
            borderLeft: `1px solid ${LINE}`,
            marginLeft: 2,
          }}
        >
          {pages.length}
        </span>
      </button>
    </div>
  );
}

export const MODE_TOGGLE_HEIGHT = TOGGLE_H;
