"use client";

import { useEffect, useRef } from "react";
import { useBarConfig } from "../_lib/bar-config-store";

type Mode = "idle" | "listening" | "thinking" | "speaking";

const TARGET: Record<Mode, (t: number) => number> = {
  idle: () => 0.08,
  listening: (t) => 0.3 + Math.sin(t * 5) * 0.2 + Math.sin(t * 11) * 0.15,
  thinking: (t) => 0.15 + Math.sin(t * 2) * 0.1,
  speaking: (t) => 0.6 + Math.sin(t * 3.5) * 0.3 + Math.sin(t * 7.1) * 0.1,
};

function hexToHue(hex: string): number {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return 0;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

export function WaveBar({ mode, height }: { mode: Mode; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfg = useBarConfig();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    if (cfg.wavePosition === "off" || cfg.reducedMotion) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    let energy = 0;
    let raf = 0;

    const draw = () => {
      const c = cfgRef.current;
      const m = modeRef.current;
      t += 0.018 * (c.speed || 1);
      const target = TARGET[m](t);
      const smooth = Math.min(0.95, Math.max(0.5, c.smoothing ?? 0.82));
      energy += (target - energy) * (1 - smooth) * 0.6;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);

      const bars = Math.max(20, Math.min(500, c.barCount || 96));
      const spread = Math.max(0.3, Math.min(1, c.waveSpread || 0.65));
      const useW = w * spread;
      const slot = useW / bars;
      const sx = (w - useW) / 2;
      const midY = c.mirror ? h / 2 : h - 4;
      const amp = (c.amplitude || 1) * energy * 3;
      const bright = c.brightness || 1;
      const glow = c.glowIntensity ?? 8;
      const sat = c.saturation ?? 85;
      const lw = c.lineWidth || 2;
      const bw = Math.max(0.1, Math.min(1, c.barWidth ?? 0.8));
      const gap = Math.max(0, c.barGap ?? 1.5);

      const baseColor =
        m === "listening"
          ? c.listeningColor
          : m === "thinking"
            ? c.thinkingColor
            : m === "speaking"
              ? c.speakingColor
              : c.idleColor;
      const baseHue = (hexToHue(baseColor || "#dc2626") + (c.hueShift || 0)) % 360;

      const drawBars = () => {
        const effW = Math.max(0.5, (slot - gap) * bw);
        for (let i = 0; i < bars; i++) {
          const dist = Math.abs(i - bars / 2) / (bars / 2);
          const env = Math.pow(1 - dist, 1.1);
          const v =
            (Math.sin(t * 1.6 + i * 0.22) * 0.22 +
              Math.sin(t * 2.8 + i * 0.11) * 0.14 +
              Math.sin(t * 0.7 + i * 0.35) * 0.1 +
              Math.sin(t * 4.2 + i * 0.07) * 0.06 +
              0.12) *
            env *
            amp;
          const barH = Math.abs(v) * h * 0.45;
          const x = sx + i * slot + slot / 2;
          const hue = c.useRainbow ? (baseHue + i * 4) % 360 : baseHue;
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${Math.min(70, 55 * bright)}%)`;
          if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = `hsl(${hue}, ${sat}%, 50%)`;
          } else {
            ctx.shadowBlur = 0;
          }
          if (c.mirror) {
            ctx.fillRect(x - effW / 2, midY - barH, effW, barH * 2);
          } else {
            ctx.fillRect(x - effW / 2, midY - barH * 2, effW, barH * 2);
          }
        }
      };

      const drawLine = () => {
        ctx.beginPath();
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        const hue = baseHue;
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${Math.min(70, 55 * bright)}%)`;
        if (glow > 0) {
          ctx.shadowBlur = glow;
          ctx.shadowColor = `hsl(${hue}, ${sat}%, 50%)`;
        }
        for (let i = 0; i <= bars; i++) {
          const dist = Math.abs(i - bars / 2) / (bars / 2);
          const env = Math.pow(1 - dist, 1.1);
          const v =
            (Math.sin(t * 1.6 + i * 0.22) * 0.22 +
              Math.sin(t * 2.8 + i * 0.11) * 0.14 +
              Math.sin(t * 0.7 + i * 0.35) * 0.1 +
              0.12) *
            env *
            amp;
          const x = sx + (i / bars) * useW;
          const y = midY - v * h * 0.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      const drawDots = () => {
        for (let i = 0; i < bars; i++) {
          const dist = Math.abs(i - bars / 2) / (bars / 2);
          const env = Math.pow(1 - dist, 1.1);
          const v = (Math.sin(t * 2 + i * 0.3) * 0.5 + 0.5) * env * amp;
          const x = sx + i * slot + slot / 2;
          const y = midY - v * h * 0.3;
          const hue = c.useRainbow ? (baseHue + i * 4) % 360 : baseHue;
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${Math.min(70, 55 * bright)}%)`;
          if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = `hsl(${hue}, ${sat}%, 50%)`;
          }
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, lw), 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const drawPulse = () => {
        const radius = Math.max(8, energy * h * 0.6);
        const hue = baseHue;
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${Math.min(70, 55 * bright)}%)`;
        ctx.lineWidth = lw;
        if (glow > 0) {
          ctx.shadowBlur = glow * 2;
          ctx.shadowColor = `hsl(${hue}, ${sat}%, 50%)`;
        }
        ctx.beginPath();
        ctx.arc(w / 2, midY, radius, 0, Math.PI * 2);
        ctx.stroke();
      };

      const drawEqualizer = () => {
        const cols = Math.max(8, Math.min(64, bars / 4));
        const colW = useW / cols;
        for (let i = 0; i < cols; i++) {
          const v = Math.abs(Math.sin(t * 2 + i * 0.6) + Math.sin(t * 5 + i * 0.2)) * 0.5;
          const segH = v * amp * h * 0.5;
          const x = sx + i * colW + 1;
          const hue = c.useRainbow ? (baseHue + i * 12) % 360 : baseHue;
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${Math.min(70, 55 * bright)}%)`;
          if (glow > 0) {
            ctx.shadowBlur = glow;
            ctx.shadowColor = `hsl(${hue}, ${sat}%, 50%)`;
          }
          ctx.fillRect(x, midY - segH, Math.max(1, colW - 2), segH * 2);
        }
      };

      const pattern = c.wavePattern || "wave";
      if (pattern === "smooth") drawLine();
      else if (pattern === "dots") drawDots();
      else if (pattern === "pulse") drawPulse();
      else if (pattern === "equalizer") drawEqualizer();
      else drawBars(); // wave + bars share the bar pattern

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [cfg.wavePosition, cfg.reducedMotion, cfg.wavePattern]);

  if (cfg.wavePosition === "off") return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={ref}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: `${height}px`,
          opacity: cfg.reducedMotion ? 0 : 0.85,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
