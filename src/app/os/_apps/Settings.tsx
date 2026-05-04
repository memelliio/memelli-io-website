"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Layers,
  Activity,
  Palette,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  useOsConfig,
  wallpaperBackground,
  type OsConfig,
  type WallpaperStyle,
} from "../_lib/os-config-store";
import { useWindowStore } from "../_lib/window-store";

type Tab = "display" | "pages" | "behavior" | "brand" | "a11y";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "display", label: "Display", icon: LayoutGrid },
  { id: "pages", label: "Pages", icon: Layers },
  { id: "behavior", label: "Behavior", icon: Activity },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "a11y", label: "Access", icon: Eye },
];

const WALLPAPERS: { id: WallpaperStyle; label: string }[] = [
  { id: "soft-red-glow", label: "Soft Red Glow" },
  { id: "white-paper", label: "White Paper" },
  { id: "warm-gradient", label: "Warm Gradient" },
  { id: "ink-dark", label: "Ink Dark" },
];

export function Settings() {
  const c = useOsConfig();
  const update = (partial: Partial<OsConfig>) => c.set(partial);
  const [tab, setTab] = useState<Tab>("display");
  const pages = useWindowStore((s) => s.pages);
  const pageLabels = useWindowStore((s) => s.pageLabels);
  const panelSettings = useWindowStore((s) => s.panelSettings);
  const setPanelSetting = useWindowStore((s) => s.setPanelSetting);
  const setPageLabel = useWindowStore((s) => s.setPageLabel);
  const addPage = useWindowStore((s) => s.addPage);
  const removePage = useWindowStore((s) => s.removePage);
  const setCurrentPage = useWindowStore((s) => s.setCurrentPage);
  const resetPanelWidths = useWindowStore((s) => s.resetPanelWidths);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#FAFBFD",
        color: "hsl(var(--ink))",
      }}
    >
      {/* ── Sticky top: header + tabs ─────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid hsl(var(--line))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "hsl(var(--muted-foreground))",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Memelli OS
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "hsl(var(--ink))",
                  marginTop: 2,
                  letterSpacing: "-0.01em",
                }}
              >
                System Settings
              </div>
            </div>
            <button
              type="button"
              onClick={c.reset}
              title="Reset all to defaults"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid hsl(var(--line))",
                background: "white",
                color: "hsl(var(--muted-foreground))",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "hsl(var(--accent))";
                e.currentTarget.style.color = "hsl(var(--primary))";
                e.currentTarget.style.borderColor =
                  "hsl(var(--primary) / 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color =
                  "hsl(var(--muted-foreground))";
                e.currentTarget.style.borderColor = "hsl(var(--line))";
              }}
            >
              <RotateCcw size={11} strokeWidth={2.4} />
              Reset
            </button>
          </div>

          {/* Live preview */}
          <div
            style={{
              position: "relative",
              marginTop: 12,
              height: 76,
              borderRadius: 10,
              overflow: "hidden",
              background: wallpaperBackground(c.wallpaperStyle),
              border: "1px solid hsl(var(--line))",
              padding: 10,
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(c.gridCols, 8)}, 1fr)`,
              gap: 4,
              alignItems: "center",
            }}
          >
            {Array.from({
              length: Math.min(c.gridCols, 8),
            }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: Math.min(c.iconSize / 2.4, 30),
                    height: Math.min(c.iconSize / 2.4, 30),
                    borderRadius: c.cornerRadius / 2,
                    background:
                      i % 3 === 0
                        ? c.accentColor
                        : i % 3 === 1
                          ? "#0F1115"
                          : "#FCE7EC",
                    boxShadow:
                      "0 2px 4px rgba(15,17,21,0.10), 0 4px 10px rgba(15,17,21,0.10)",
                  }}
                />
                {c.showLabels && (
                  <span
                    style={{
                      fontSize: Math.min(c.labelSize - 4, 9),
                      color: "hsl(var(--ink))",
                      fontWeight: 500,
                    }}
                  >
                    App
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 2,
            padding: "6px 12px 0",
            borderBottom: "1px solid hsl(var(--line))",
            background: "white",
          }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "9px 4px",
                  background: "transparent",
                  color: active
                    ? "hsl(var(--ink))"
                    : "hsl(var(--muted-foreground))",
                  border: 0,
                  borderBottom: active
                    ? `2px solid ${c.accentColor}`
                    : "2px solid transparent",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  transition: "color 120ms, border-color 120ms",
                }}
              >
                <Icon size={13} strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "14px 16px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {tab === "display" && (
          <>
            <Card title="Wallpaper">
              <Row label="Style">
                <Select
                  value={c.wallpaperStyle}
                  options={WALLPAPERS.map((w) => w.id)}
                  labels={Object.fromEntries(
                    WALLPAPERS.map((w) => [w.id, w.label]),
                  )}
                  onChange={(v) =>
                    update({ wallpaperStyle: v as WallpaperStyle })
                  }
                />
              </Row>
            </Card>
            <Card title="Icon Grid">
              <Row label="Columns per page">
                <Slider
                  min={5}
                  max={10}
                  step={1}
                  value={c.gridCols}
                  onChange={(v) => update({ gridCols: v })}
                />
              </Row>
              <Row label="Icon size">
                <Slider
                  min={64}
                  max={128}
                  step={4}
                  value={c.iconSize}
                  onChange={(v) => update({ iconSize: v })}
                  unit="px"
                />
              </Row>
              <Row label="Label size">
                <Slider
                  min={10}
                  max={16}
                  step={1}
                  value={c.labelSize}
                  onChange={(v) => update({ labelSize: v })}
                  unit="px"
                />
              </Row>
              <Row label="Show labels">
                <Toggle
                  value={c.showLabels}
                  onChange={(v) => update({ showLabels: v })}
                />
              </Row>
              <Row label="Show badges">
                <Toggle
                  value={c.showBadges}
                  onChange={(v) => update({ showBadges: v })}
                />
              </Row>
            </Card>
          </>
        )}

        {tab === "pages" && (
          <>
            <Card title={`Desktop panels (${pages.length})`}>
              <div style={{ padding: "8px 0 6px" }}>
                <button
                  type="button"
                  onClick={addPage}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px dashed ${c.accentColor}`,
                    background: "white",
                    color: c.accentColor,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                  }}
                >
                  + Add panel (splits current)
                </button>
              </div>
              <Row label="Reset widths" hint="Equal width for every panel">
                <button
                  type="button"
                  onClick={resetPanelWidths}
                  style={{
                    ...pillBtn(c.accentColor),
                    background: "white",
                    color: c.accentColor,
                  }}
                >
                  Reset
                </button>
              </Row>
            </Card>

            {pages.map((appIds, i) => {
              const cfg = panelSettings[i] ?? {};
              return (
                <Card
                  key={i}
                  title={`Panel ${i + 1} · ${pageLabels[i] ?? ""}`}
                >
                  <Row label="Name">
                    <input
                      defaultValue={pageLabels[i] ?? ""}
                      onBlur={(e) =>
                        setPageLabel(i, e.target.value.trim() || `Panel ${i + 1}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.target as HTMLInputElement).blur();
                      }}
                      style={{
                        flex: 1,
                        maxWidth: 200,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "1px solid hsl(var(--line))",
                        borderRadius: 8,
                        background: "white",
                        color: "hsl(var(--ink))",
                        outline: "none",
                      }}
                    />
                  </Row>
                  <Row
                    label="Columns"
                    hint={
                      cfg.cols
                        ? `Override (${cfg.cols})`
                        : "Auto from width"
                    }
                  >
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={cfg.cols ?? 0}
                      onChange={(v) =>
                        setPanelSetting(i, {
                          cols: v === 0 ? undefined : v,
                        })
                      }
                    />
                  </Row>
                  <Row
                    label="Icon size"
                    hint={cfg.iconSize ? "Override" : `Global ${c.iconSize}px`}
                  >
                    <Slider
                      min={0}
                      max={140}
                      step={4}
                      value={cfg.iconSize ?? 0}
                      onChange={(v) =>
                        setPanelSetting(i, {
                          iconSize: v === 0 ? undefined : v,
                        })
                      }
                      unit="px"
                    />
                  </Row>
                  <Row
                    label="Label size"
                    hint={cfg.labelSize ? "Override" : `Global ${c.labelSize}px`}
                  >
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={cfg.labelSize ?? 0}
                      onChange={(v) =>
                        setPanelSetting(i, {
                          labelSize: v === 0 ? undefined : v,
                        })
                      }
                      unit="px"
                    />
                  </Row>
                  <Row label="Show labels">
                    <Toggle
                      value={cfg.showLabels ?? c.showLabels}
                      onChange={(v) =>
                        setPanelSetting(i, { showLabels: v })
                      }
                    />
                  </Row>
                  <Row
                    label="Apps in panel"
                    hint="Drag icons between panels on the desktop to reassign"
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "hsl(var(--muted-foreground))",
                        fontWeight: 600,
                      }}
                    >
                      {appIds.length}
                    </span>
                  </Row>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "8px 0 4px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentPage(i)}
                      style={{
                        ...pillBtn(c.accentColor),
                        flex: 1,
                      }}
                    >
                      Go to panel
                    </button>
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePage(i)}
                        style={{
                          ...pillBtn(c.accentColor),
                          background: "white",
                          color: "hsl(var(--muted-foreground))",
                          flex: 1,
                        }}
                      >
                        Remove panel
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </>
        )}

        {tab === "behavior" && (
          <>
            <Card title="Scroll & Navigation">
              <Row
                label="Page transition speed"
                hint="Lower is faster, higher is smoother"
              >
                <Slider
                  min={150}
                  max={700}
                  step={20}
                  value={c.pageSnapAnimMs}
                  onChange={(v) => update({ pageSnapAnimMs: v })}
                  unit="ms"
                />
              </Row>
              <Row label="Wheel speed">
                <Slider
                  min={1}
                  max={5}
                  step={0.5}
                  value={c.scrollSpeedMul}
                  onChange={(v) => update({ scrollSpeedMul: v })}
                  unit="×"
                />
              </Row>
              <Row
                label="Edge auto-scroll delay"
                hint="Hold an icon at a screen edge this long to advance pages"
              >
                <Slider
                  min={150}
                  max={800}
                  step={25}
                  value={c.edgeAutoScrollMs}
                  onChange={(v) => update({ edgeAutoScrollMs: v })}
                  unit="ms"
                />
              </Row>
            </Card>
            <Card title="Windows">
              <Row label="Default width">
                <Slider
                  min={480}
                  max={1200}
                  step={20}
                  value={c.defaultWindowW}
                  onChange={(v) => update({ defaultWindowW: v })}
                  unit="px"
                />
              </Row>
              <Row label="Default height">
                <Slider
                  min={360}
                  max={900}
                  step={20}
                  value={c.defaultWindowH}
                  onChange={(v) => update({ defaultWindowH: v })}
                  unit="px"
                />
              </Row>
              <Row label="Remember positions">
                <Toggle
                  value={c.rememberWindowPositions}
                  onChange={(v) =>
                    update({ rememberWindowPositions: v })
                  }
                />
              </Row>
            </Card>
          </>
        )}

        {tab === "brand" && (
          <Card title="Brand">
            <Row label="Accent color">
              <ColorInput
                value={c.accentColor}
                onChange={(v) => update({ accentColor: v })}
              />
            </Row>
            <Row label="Corner radius">
              <Slider
                min={6}
                max={20}
                step={1}
                value={c.cornerRadius}
                onChange={(v) => update({ cornerRadius: v })}
                unit="px"
              />
            </Row>
            <Row label="Focus ring thickness">
              <Slider
                min={0}
                max={4}
                step={1}
                value={c.focusRingThickness}
                onChange={(v) => update({ focusRingThickness: v })}
                unit="px"
              />
            </Row>
          </Card>
        )}

        {tab === "a11y" && (
          <Card title="Accessibility">
            <Row
              label="Reduced motion"
              hint="Disables wave + page-snap animations"
            >
              <Toggle
                value={c.reducedMotion}
                onChange={(v) => update({ reducedMotion: v })}
              />
            </Row>
            <Row label="High contrast">
              <Toggle
                value={c.highContrast}
                onChange={(v) => update({ highContrast: v })}
              />
            </Row>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Layout primitives (light theme) ─────────────────────────────────

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid hsl(var(--line))",
        background: "white",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15,17,21,0.04)",
      }}
    >
      {title && (
        <div
          style={{
            padding: "9px 14px 8px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
            borderBottom: "1px solid hsl(var(--line))",
            background: "hsl(var(--background))",
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: "4px 14px" }}>{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0",
        gap: 12,
        borderBottom: "1px solid hsl(var(--line))",
        minHeight: 34,
      }}
    >
      <div style={{ minWidth: 0, flex: "0 0 auto", maxWidth: "55%" }}>
        <div
          style={{
            fontSize: 12.5,
            color: "hsl(var(--ink))",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: 10.5,
              color: "hsl(var(--muted-foreground))",
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: "1 1 auto",
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        position: "relative",
        width: 38,
        height: 22,
        flexShrink: 0,
        borderRadius: 9999,
        cursor: "pointer",
        border: 0,
        padding: 0,
        background: value
          ? "linear-gradient(135deg, #C41E3A, #A8182F)"
          : "hsl(var(--line))",
        transition: "background 180ms ease",
        boxShadow: value
          ? "0 0 12px rgba(196,30,58,0.35), inset 0 1px 0 rgba(255,255,255,0.18)"
          : "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          left: value ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 180ms ease",
          boxShadow: "0 2px 5px rgba(15,17,21,0.25)",
        }}
      />
    </button>
  );
}

function Slider({
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const safe = typeof value === "number" && !isNaN(value) ? value : min;
  const pct = ((safe - min) / (max - min)) * 100;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        maxWidth: 220,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 9999,
          position: "relative",
          background: "hsl(var(--line))",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${pct}%`,
            borderRadius: 9999,
            background: "linear-gradient(90deg, #C41E3A, #dc2626)",
            boxShadow: "0 0 8px rgba(196,30,58,0.4)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safe}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
          }}
        />
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "white",
            transform: "translate(-50%, -50%)",
            boxShadow:
              "0 0 0 2px #C41E3A, 0 4px 8px rgba(15,17,21,0.25)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "hsl(var(--ink))",
          minWidth: 40,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
        }}
      >
        {Number.isInteger(safe) ? safe : safe.toFixed(2)}
        {unit && (
          <span
            style={{
              color: "hsl(var(--muted-foreground))",
              marginLeft: 1,
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: value,
          border: "1px solid hsl(var(--line))",
          boxShadow:
            "inset 0 0 0 2px rgba(255,255,255,0.65), 0 1px 2px rgba(15,17,21,0.10)",
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: "hsl(var(--ink))",
          fontFamily: "ui-monospace, monospace",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </label>
  );
}

function Select({
  value,
  options,
  labels,
  onChange,
}: {
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: 11,
        color: "hsl(var(--ink))",
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: "white",
        border: "1px solid hsl(var(--line))",
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

function pillBtn(accent: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: 9999,
    border: `1px solid ${accent}`,
    background: accent,
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
  };
}
