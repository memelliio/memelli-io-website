"use client";

import { useState } from "react";
import {
  Palette,
  Activity,
  LayoutDashboard,
  Mic,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useBarConfig, type BarConfig } from "../_lib/bar-config-store";
import { WaveBar } from "../_components/WaveBar";

const PATTERNS: BarConfig["wavePattern"][] = [
  "wave",
  "smooth",
  "bars",
  "equalizer",
  "pulse",
  "dots",
];
const SHAPES: BarConfig["barShape"][] = ["sharp", "rounded", "pointed", "line"];
const POSITIONS: BarConfig["wavePosition"][] = ["behind", "above", "off"];
const PREVIEW_MODES = ["idle", "listening", "thinking", "speaking"] as const;

type Tab = "colors" | "wave" | "layout" | "voice" | "a11y";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "colors", label: "Colors", icon: Palette },
  { id: "wave", label: "Waveform", icon: Activity },
  { id: "layout", label: "Layout", icon: LayoutDashboard },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "a11y", label: "Access", icon: Eye },
];

export function MelliBarSettings() {
  const c = useBarConfig();
  const [tab, setTab] = useState<Tab>("colors");
  const [previewMode, setPreviewMode] =
    useState<(typeof PREVIEW_MODES)[number]>("listening");
  const update = (partial: Partial<BarConfig>) => c.set(partial);

  return (
    <div
      data-dark-scroll
      style={{
        // The WindowFrame body now owns scroll globally. This panel simply
        // flows top-to-bottom; the parent scrolls if the content runs long.
        // Header + tabs are sticky so the preview + tab nav stay visible
        // while you scroll the cards.
        minHeight: "100%",
        background:
          "radial-gradient(circle at 0% 0%, #18181d 0%, #0c0c0f 60%) ",
        color: "white",
      }}
    >
      {/* ── Sticky top: header + tabs together ──────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background:
            "linear-gradient(180deg, #18181d 0%, #131317 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
      <div
        style={{
          padding: "12px 16px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
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
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Memelli Bar
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "white",
                marginTop: 2,
                letterSpacing: "-0.01em",
              }}
            >
              Settings
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
              padding: "6px 11px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220,38,38,0.18)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
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
            marginTop: 10,
            height: 48,
            borderRadius: 8,
            overflow: "hidden",
            background: c.barBackground || "#0a0a0c",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <WaveBar mode={previewMode} height={48} />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(196,30,58,0.6) 50%, transparent 100%)",
              opacity: c.borderGlow ? 1 : 0.2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 8,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Live Preview
          </div>
        </div>

        {/* Mode preview pills */}
        <div
          style={{
            display: "flex",
            gap: 3,
            marginTop: 6,
          }}
        >
          {PREVIEW_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPreviewMode(m)}
              style={{
                flex: 1,
                padding: "4px 6px",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 5,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  previewMode === m
                    ? "rgba(220,38,38,0.18)"
                    : "rgba(255,255,255,0.03)",
                color:
                  previewMode === m
                    ? "#fca5a5"
                    : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                transition: "all 120ms",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab nav (inside the sticky wrapper) ──────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "6px 10px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "#131317",
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
                padding: "7px 3px",
                background: "transparent",
                color: active ? "white" : "rgba(255,255,255,0.5)",
                border: 0,
                borderBottom: active
                  ? "2px solid #dc2626"
                  : "2px solid transparent",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "color 120ms, border-color 120ms",
              }}
            >
              <Icon size={12} strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>
      </div>{/* /sticky wrapper */}

      {/* ── Body (parent WindowFrame scrolls) ────────────────────── */}
      <div
        style={{
          padding: "12px 14px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Master enabled — always visible */}
        <Card>
          <div style={{ padding: "6px 0 12px" }}>
            <Row
              label="Show Memelli Bar"
              hint="Hide to a 20px restore strip"
            >
              <Toggle
                value={c.enabled}
                onChange={(v) => update({ enabled: v })}
              />
            </Row>
          </div>
        </Card>

        {tab === "colors" && (
          <>
            <Card title="State Colors">
              <Row label="Listening">
                <ColorInput
                  value={c.listeningColor}
                  onChange={(v) => update({ listeningColor: v })}
                />
              </Row>
              <Row label="Thinking">
                <ColorInput
                  value={c.thinkingColor}
                  onChange={(v) => update({ thinkingColor: v })}
                />
              </Row>
              <Row label="Speaking">
                <ColorInput
                  value={c.speakingColor}
                  onChange={(v) => update({ speakingColor: v })}
                />
              </Row>
              <Row label="Idle">
                <ColorInput
                  value={c.idleColor}
                  onChange={(v) => update({ idleColor: v })}
                />
              </Row>
              <Row label="Background">
                <ColorInput
                  value={c.barBackground}
                  onChange={(v) => update({ barBackground: v })}
                />
              </Row>
            </Card>
            <Card title="Hue & Saturation">
              <Row label="Rainbow Mode">
                <Toggle
                  value={c.useRainbow}
                  onChange={(v) => update({ useRainbow: v })}
                />
              </Row>
              <Row label="Hue Shift">
                <Slider
                  min={0}
                  max={360}
                  step={5}
                  value={c.hueShift}
                  onChange={(v) => update({ hueShift: v })}
                  unit="°"
                />
              </Row>
              <Row label="Saturation">
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={c.saturation}
                  onChange={(v) => update({ saturation: v })}
                  unit="%"
                />
              </Row>
              <Row label="Brightness">
                <Slider
                  min={0.3}
                  max={1.5}
                  step={0.05}
                  value={c.brightness}
                  onChange={(v) => update({ brightness: v })}
                />
              </Row>
            </Card>
          </>
        )}

        {tab === "wave" && (
          <>
            <Card title="Pattern">
              <Row label="Style">
                <Select
                  value={c.wavePattern}
                  options={PATTERNS}
                  onChange={(v) =>
                    update({ wavePattern: v as BarConfig["wavePattern"] })
                  }
                />
              </Row>
              <Row label="Bar Shape">
                <Select
                  value={c.barShape}
                  options={SHAPES}
                  onChange={(v) =>
                    update({ barShape: v as BarConfig["barShape"] })
                  }
                />
              </Row>
              <Row label="Mirror">
                <Toggle
                  value={c.mirror}
                  onChange={(v) => update({ mirror: v })}
                />
              </Row>
            </Card>
            <Card title="Density">
              <Row label="Bar Count">
                <Slider
                  min={20}
                  max={500}
                  step={1}
                  value={c.barCount}
                  onChange={(v) => update({ barCount: v })}
                />
              </Row>
              <Row label="Bar Width">
                <Slider
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={c.barWidth}
                  onChange={(v) => update({ barWidth: v })}
                />
              </Row>
              <Row label="Bar Gap">
                <Slider
                  min={0}
                  max={6}
                  step={0.5}
                  value={c.barGap}
                  onChange={(v) => update({ barGap: v })}
                />
              </Row>
              <Row label="Spread">
                <Slider
                  min={0.3}
                  max={1}
                  step={0.05}
                  value={c.waveSpread}
                  onChange={(v) => update({ waveSpread: v })}
                />
              </Row>
            </Card>
            <Card title="Motion">
              <Row label="Speed">
                <Slider
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={c.speed}
                  onChange={(v) => update({ speed: v })}
                  unit="×"
                />
              </Row>
              <Row label="Amplitude">
                <Slider
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={c.amplitude}
                  onChange={(v) => update({ amplitude: v })}
                  unit="×"
                />
              </Row>
              <Row label="Smoothing">
                <Slider
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={c.smoothing}
                  onChange={(v) => update({ smoothing: v })}
                />
              </Row>
              <Row label="Glow">
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={c.glowIntensity}
                  onChange={(v) => update({ glowIntensity: v })}
                />
              </Row>
              <Row label="Line Width">
                <Slider
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={c.lineWidth}
                  onChange={(v) => update({ lineWidth: v })}
                />
              </Row>
            </Card>
          </>
        )}

        {tab === "layout" && (
          <>
            <Card title="Bar">
              <Row label="Height">
                <Slider
                  min={64}
                  max={140}
                  step={2}
                  value={c.barHeight}
                  onChange={(v) => update({ barHeight: v })}
                  unit="px"
                />
              </Row>
              <Row label="Opacity">
                <Slider
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={c.barOpacity}
                  onChange={(v) => update({ barOpacity: v })}
                />
              </Row>
              <Row label="Border Glow">
                <Toggle
                  value={c.borderGlow}
                  onChange={(v) => update({ borderGlow: v })}
                />
              </Row>
            </Card>
            <Card title="Waveform">
              <Row label="Position">
                <Select
                  value={c.wavePosition}
                  options={POSITIONS}
                  onChange={(v) =>
                    update({ wavePosition: v as BarConfig["wavePosition"] })
                  }
                />
              </Row>
            </Card>
            <Card title="Engage Button">
              <Row label="Show Logo">
                <Toggle
                  value={c.showLogo}
                  onChange={(v) => update({ showLogo: v })}
                />
              </Row>
              <Row label="Show Text">
                <Toggle
                  value={c.showText}
                  onChange={(v) => update({ showText: v })}
                />
              </Row>
              <Row label="Pulse Dot">
                <Toggle
                  value={c.pulseEnabled}
                  onChange={(v) => update({ pulseEnabled: v })}
                />
              </Row>
            </Card>
          </>
        )}

        {tab === "voice" && (
          <Card title="Voice Behavior">
            <Row
              label="Wake Word"
              hint='Listen for "Hey Memelli" without engage tap'
            >
              <Toggle
                value={c.wakeWordEnabled}
                onChange={(v) => update({ wakeWordEnabled: v })}
              />
            </Row>
            <Row label="Auto-engage on Arrival">
              <Toggle
                value={c.autoOpen}
                onChange={(v) => update({ autoOpen: v })}
              />
            </Row>
            <Row label="Sound Effects">
              <Toggle
                value={c.soundEffects}
                onChange={(v) => update({ soundEffects: v })}
              />
            </Row>
          </Card>
        )}

        {tab === "a11y" && (
          <Card title="Accessibility">
            <Row
              label="Reduced Motion"
              hint="Stops the wave canvas animation"
            >
              <Toggle
                value={c.reducedMotion}
                onChange={(v) => update({ reducedMotion: v })}
              />
            </Row>
            <Row label="High Contrast">
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

// ── Layout primitives ───────────────────────────────────────────────

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
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.025)",
        overflow: "hidden",
      }}
    >
      {title && (
        <div
          style={{
            padding: "7px 12px 6px",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: "2px 12px" }}>{children}</div>
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
        padding: "7px 0",
        gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        minHeight: 30,
      }}
    >
      <div style={{ minWidth: 0, flex: "0 0 auto", maxWidth: "50%" }}>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(255,255,255,0.85)",
            fontWeight: 500,
            lineHeight: 1.15,
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: 9.5,
              color: "rgba(255,255,255,0.35)",
              marginTop: 1,
              lineHeight: 1.25,
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

// ── Controls ────────────────────────────────────────────────────────

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
        width: 36,
        height: 20,
        flexShrink: 0,
        borderRadius: 9999,
        cursor: "pointer",
        border: 0,
        padding: 0,
        background: value
          ? "linear-gradient(135deg, #dc2626, #991b1b)"
          : "rgba(255,255,255,0.12)",
        transition: "background 180ms ease",
        boxShadow: value
          ? "0 0 10px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.18)"
          : "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          left: value ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 180ms ease",
          boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
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
        gap: 8,
        flex: 1,
        maxWidth: 200,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 9999,
          position: "relative",
          background: "rgba(255,255,255,0.08)",
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
            boxShadow: "0 0 8px rgba(220,38,38,0.4)",
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
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "white",
            transform: "translate(-50%, -50%)",
            boxShadow:
              "0 0 0 2px #dc2626, 0 3px 6px rgba(0,0,0,0.45)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10.5,
          color: "rgba(255,255,255,0.7)",
          minWidth: 34,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
        }}
      >
        {Number.isInteger(safe) ? safe : safe.toFixed(2)}
        {unit && (
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
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
          width: 22,
          height: 22,
          borderRadius: 6,
          background: value,
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.25), 0 0 0 0 rgba(255,255,255,0)",
          transition: "box-shadow 120ms",
        }}
      />
      <span
        style={{
          fontSize: 10.5,
          color: "rgba(255,255,255,0.7)",
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
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: 10.5,
        color: "white",
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
        textTransform: "capitalize",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option
          key={o}
          value={o}
          style={{ background: "#1a1a1f", color: "white" }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}
