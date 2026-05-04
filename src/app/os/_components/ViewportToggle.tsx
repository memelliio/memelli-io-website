"use client";

import { useState } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  X,
} from "lucide-react";
import {
  useViewportPreview,
  VIEWPORT_PRESETS,
  PRESET_GROUPS,
  type ViewportPreset,
} from "../_lib/viewport-preview-store";

const RED = "#C41E3A";
const INK = "#0B0B0F";
const PAPER = "#FFFFFF";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";

function iconFor(p: ViewportPreset) {
  const kind = VIEWPORT_PRESETS[p].kind;
  if (kind === "phone") return Smartphone;
  if (kind === "tablet") return Tablet;
  if (kind === "laptop") return Laptop;
  return Monitor;
}

export function ViewportToggle() {
  const preset = useViewportPreview((s) => s.preset);
  const setPreset = useViewportPreview((s) => s.setPreset);
  const [open, setOpen] = useState(false);
  const meta = VIEWPORT_PRESETS[preset] ?? VIEWPORT_PRESETS.off;
  const safePreset: ViewportPreset =
    preset in VIEWPORT_PRESETS ? preset : "off";
  const ActiveIcon = iconFor(safePreset);
  const active = safePreset !== "off";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Viewport preview"
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 9999999,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: open || active ? INK : PAPER,
          color: open || active ? PAPER : INK,
          border: `1px solid ${open || active ? INK : LINE}`,
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: "0 4px 16px -4px rgba(15,17,21,0.25)",
        }}
      >
        <ActiveIcon size={13} strokeWidth={2.2} />
        <span>{meta.label}</span>
        {active && (
          <span
            style={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: 9.5,
              color: "rgba(255,255,255,0.65)",
              paddingLeft: 6,
              borderLeft: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {meta.w}×{meta.h}
          </span>
        )}
      </button>

      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: 52,
            right: 12,
            zIndex: 9999998,
            background: PAPER,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            boxShadow: "0 18px 48px -12px rgba(15,17,21,0.30)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 260,
            maxHeight: "min(80vh, 600px)",
            overflowY: "auto",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {PRESET_GROUPS.map((group, gi) => (
            <div key={group.title}>
              {gi > 0 && (
                <div
                  style={{ height: 1, background: LINE, margin: "4px 8px" }}
                />
              )}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: MUTED,
                  padding: "8px 12px 4px",
                }}
              >
                {group.title}
              </div>
              {group.presets.map((p) => {
                const Icon = iconFor(p);
                const m = VIEWPORT_PRESETS[p];
                const isActive = preset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPreset(p);
                      setOpen(false);
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      background: isActive ? `${RED}10` : "transparent",
                      border: 0,
                      borderLeft: `2px solid ${isActive ? RED : "transparent"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      textAlign: "left",
                      color: INK,
                      fontFamily: "inherit",
                      fontSize: 12.5,
                      width: "100%",
                    }}
                  >
                    <Icon size={13} strokeWidth={2.2} color={isActive ? RED : INK} />
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: MUTED,
                        fontFamily:
                          "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                      }}
                    >
                      {m.w == null ? "—" : `${m.w}×${m.h}`}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ height: 1, background: LINE, margin: "4px 8px" }} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: MUTED,
              fontSize: 11,
              fontFamily: "inherit",
            }}
          >
            <X size={11} strokeWidth={2.2} />
            Close menu
          </button>
        </div>
      )}
    </>
  );
}
