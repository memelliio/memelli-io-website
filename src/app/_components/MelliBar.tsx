"use client";

import { PartnerLogo } from "@/app/_components/PartnerLogo";
import { useEffect, useRef, useState } from "react";
import { Tv, Radio, Settings as Cog } from "lucide-react";
import { WaveBar } from "./WaveBar";
import { useWindowStore } from "../_lib/window-store";
import { useBarConfig } from "../_lib/bar-config-store";

type Mode = "idle" | "listening" | "thinking" | "speaking";

const DEMO_HEARD = [
  "open my pipeline",
  "schedule a call for tomorrow",
  "what's my balance",
  "show credit reports",
  "draft a follow-up",
];

const STATE_CYCLE: { mode: Mode; ms: number }[] = [
  { mode: "listening", ms: 1800 },
  { mode: "thinking", ms: 900 },
  { mode: "speaking", ms: 1900 },
];

export function MelliBar() {
  const open = useWindowStore((s) => s.open);
  const enabled = useBarConfig((s) => s.enabled);
  const barHeight = useBarConfig((s) => s.barHeight);
  const barBackground = useBarConfig((s) => s.barBackground);
  const barOpacity = useBarConfig((s) => s.barOpacity);
  const borderGlow = useBarConfig((s) => s.borderGlow);
  const showLogo = useBarConfig((s) => s.showLogo);
  const showText = useBarConfig((s) => s.showText);
  const setBarConfig = useBarConfig((s) => s.set);
  const BAR_H = Math.max(64, Math.min(140, barHeight ?? 96));
  const [hydrated, setHydrated] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [lastHeard, setLastHeard] = useState("");
  const cycleRef = useRef<number | null>(null);

  // Wait one frame before reading persisted bar-config so SSR + client hydration
  // match — otherwise the bar momentarily renders with defaults then snaps to
  // the persisted values, looking like a double render.
  useEffect(() => {
    setHydrated(true);
  }, []);

  // memelli:bar:guide-me listener — fired by per-module CTAs (e.g. PreQual's
  // "Let Melli guide you" pill). Marks the active module + opens the bar in
  // listening state so Melli can walk the user through the flow.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ module?: string }>).detail;
      const moduleId = detail?.module ?? "prequal";
      try {
        (window as unknown as { __memelliActiveModule?: string }).__memelliActiveModule = moduleId;
      } catch {
        /* noop */
      }
      setInCall(true);
    };
    window.addEventListener("memelli:bar:guide-me", handler as EventListener);
    return () => window.removeEventListener("memelli:bar:guide-me", handler as EventListener);
  }, []);

  // Expose window.__memelliSend so any module can post a user utterance into
  // the bar's chat queue. Cleaned up on unmount. Falls through to the bar's
  // existing in-call cycle until the actual chat backend is wired.
  useEffect(() => {
    const win = window as unknown as { __memelliSend?: (text: string) => void };
    win.__memelliSend = (text: string) => {
      setLastHeard(text);
      setInCall(true);
    };
    return () => {
      delete win.__memelliSend;
    };
  }, []);

  useEffect(() => {
    if (!inCall) {
      if (cycleRef.current != null) window.clearTimeout(cycleRef.current);
      setMode("idle");
      setLastHeard("");
      return;
    }
    let i = 0;
    let h = 0;
    const tick = () => {
      const step = STATE_CYCLE[i % STATE_CYCLE.length];
      setMode(step.mode);
      if (step.mode === "listening") {
        setLastHeard(DEMO_HEARD[h % DEMO_HEARD.length]);
        h++;
      }
      cycleRef.current = window.setTimeout(() => {
        i++;
        tick();
      }, step.ms);
    };
    tick();
    return () => {
      if (cycleRef.current != null) window.clearTimeout(cycleRef.current);
    };
  }, [inCall]);

  const engage = () => {
    // Open the Memelli Terminal window (iframe to /memelli-terminal)
    // and toggle the call/visualizer state.
    open("memelli-terminal");
    setInCall((v) => !v);
  };

  const statusLabel =
    mode === "listening"
      ? "Listening…"
      : mode === "thinking"
        ? "Thinking…"
        : mode === "speaking"
          ? "Speaking…"
          : "In Call";
  const statusColor =
    mode === "listening"
      ? "#dc2626"
      : mode === "thinking"
        ? "#eab308"
        : "#16a34a";

  if (!hydrated) return null;
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() => setBarConfig({ enabled: true })}
        title="Click to restore Memelli bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          height: 20,
          background: "#111",
          border: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderBottom: "1px solid rgba(220,38,38,0.15)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#dc2626",
            opacity: 0.5,
          }}
        />
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
          }}
        >
          RESTORE MEMELLI BAR
        </span>
      </button>
    );
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: BAR_H,
        zIndex: 99997,
        pointerEvents: "none",
        opacity: barOpacity,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: barBackground || "linear-gradient(180deg, #0F1115 0%, #18181C 70%, #0F1115 100%)",
          borderBottom: borderGlow
            ? "1px solid rgba(196,30,58,0.18)"
            : "1px solid rgba(255,255,255,0.04)",
          boxShadow: borderGlow
            ? "inset 0 0 0 1px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(196,30,58,0.18), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "inset 0 0 0 1px rgba(0,0,0,0.4)",
        }}
      />

      <WaveBar mode={mode} height={BAR_H} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          pointerEvents: "auto",
        }}
      >
        {/* LEFT — logo + status + heard */}
        <div
          className="memelli-bar-scroll"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <PartnerLogo alt="Memelli" style={{ height: 64, width: "auto", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 1px 6px rgba(196,30,58,0.25))" }} />
          {inCall && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: statusColor,
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 10px ${statusColor}`,
                  animation: "melliPulseDot 1.2s ease-in-out infinite",
                }}
              />
              {statusLabel}
            </span>
          )}
          {lastHeard && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                fontStyle: "italic",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: 0.2,
              }}
            >
              &ldquo;{lastHeard}&rdquo;
            </span>
          )}
        </div>

        {/* CENTER — engage button */}
        <button
          type="button"
          onClick={engage}
          aria-label={inCall ? "End call" : "Engage Memelli"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "9px 22px 9px 14px",
            borderRadius: 9999,
            border: 0,
            background: inCall
              ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
              : "linear-gradient(135deg, #C41E3A 0%, #A8182F 100%)",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            boxShadow: inCall
              ? "0 0 24px rgba(220,38,38,0.55), 0 0 48px rgba(220,38,38,0.25), inset 0 1px 0 rgba(255,255,255,0.18)"
              : "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(196,30,58,0.4), 0 8px 22px -8px rgba(196,30,58,0.55), 0 2px 6px rgba(0,0,0,0.25)",
            animation: inCall
              ? "melliCallPulse 1.5s ease-in-out infinite"
              : "none",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {showLogo && (
            <PartnerLogo alt="" style={{ height: 22, width: "auto" }} />
          )}
          {showText && <span>{inCall ? "End Call" : "Let Memelli Guide Me"}</span>}
        </button>

        {/* RIGHT — Mode toggle / TV / Radio / Settings */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            flex: 1,
          }}
        >
          <BarIconButton label="TV" onClick={() => open("tv")}>
            <Tv size={16} strokeWidth={1.8} />
          </BarIconButton>
          <BarIconButton label="Radio" onClick={() => open("radio")}>
            <Radio size={16} strokeWidth={1.8} />
          </BarIconButton>
          <BarIconButton
            label="Bar Settings"
            onClick={() => open("memelli-bar-settings")}
          >
            <Cog size={16} strokeWidth={1.8} />
          </BarIconButton>
        </div>
      </div>

      <style>{`
        @keyframes melliCallPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(220,38,38,0.45), 0 0 32px rgba(220,38,38,0.18), inset 0 1px 0 rgba(255,255,255,0.18); }
          50%      { box-shadow: 0 0 30px rgba(220,38,38,0.65), 0 0 56px rgba(220,38,38,0.30), inset 0 1px 0 rgba(255,255,255,0.18); }
        }
        @keyframes melliPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.85); }
        }
      `}</style>
      <style>{`
        .memelli-bar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </header>
  );
}

function BarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        background: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: 0,
        cursor: "pointer",
        color: hover ? "white" : "rgba(255,255,255,0.85)",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}