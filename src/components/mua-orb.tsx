'use client';

import { useRef, useEffect, useCallback, memo } from 'react';

/**
 * MUA Orb — Memelli Cockpit Agent animated icon (MUA acronym kept for structural reasons; legacy expansion was "Memelli Universe Agent" — see CLAUDE.md)
 *
 * Pure Canvas 2D — no Three.js, no WebGL crashes.
 * Minimal, elegant design:
 *   - Smooth gradient orb with subtle plasma
 *   - Memelli logo centered
 *   - Sound wave bars on both sides
 *   - Single glass ring
 *   - State-reactive animations
 *   - Memelli red glow aesthetic (2026 Apple dark)
 */

export type MUAState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'dispatching' | 'error';

interface MUAOrbProps {
  state?: MUAState;
  size?: number;
  onClick?: () => void;
}

// ── State configs — Memelli red palette ─────────────────────────────────
const STATE_CONFIG: Record<MUAState, {
  ringColor1: string; ringColor2: string;
  plasmaSpeed: number; waveIntensity: number;
  pulseSpeed: number; glowOpacity: number;
}> = {
  idle:        { ringColor1: '#E11D2E', ringColor2: '#B71E2E', plasmaSpeed: 0.3, waveIntensity: 0.3, pulseSpeed: 1.5, glowOpacity: 0.25 },
  listening:   { ringColor1: '#F07080', ringColor2: '#E11D2E', plasmaSpeed: 0.5, waveIntensity: 1.0, pulseSpeed: 2.0, glowOpacity: 0.45 },
  thinking:    { ringColor1: '#B71E2E', ringColor2: '#D72638', plasmaSpeed: 1.2, waveIntensity: 0.5, pulseSpeed: 3.0, glowOpacity: 0.4 },
  speaking:    { ringColor1: '#E84855', ringColor2: '#E11D2E', plasmaSpeed: 0.8, waveIntensity: 0.9, pulseSpeed: 2.5, glowOpacity: 0.5 },
  dispatching: { ringColor1: '#f59e0b', ringColor2: '#E11D2E', plasmaSpeed: 1.5, waveIntensity: 0.7, pulseSpeed: 4.0, glowOpacity: 0.45 },
  error:       { ringColor1: '#9B1B2E', ringColor2: '#f97316', plasmaSpeed: 0.2, waveIntensity: 0.2, pulseSpeed: 1.0, glowOpacity: 0.3 },
};

// ── Wave bar layout ────────────────────────────────────────────────────
const WAVE_BARS = [
  { offset: 0.42, height: 0.18 },
  { offset: 0.35, height: 0.28 },
  { offset: 0.28, height: 0.38 },
  { offset: 0.22, height: 0.22 },
];

function MUAOrbInner({ state = 'idle', size = 64, onClick }: MUAOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const logoLoaded = useRef(false);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const currentState = useRef(state);
  currentState.current = state;

  // Load logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { logoRef.current = img; logoLoaded.current = true; };
    img.src = '/memelli-logo-white.png';
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = size * dpr;
    const h = size * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    const cfg = STATE_CONFIG[currentState.current];
    const t = timeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const orbR = w * 0.28; // Main orb radius
    const ringR = orbR + w * 0.035;

    // ── Outer glow ──────────────────────────────────────────────
    const glowGrad = ctx.createRadialGradient(cx, cy, orbR * 0.5, cx, cy, orbR * 2);
    glowGrad.addColorStop(0, `${cfg.ringColor1}${Math.round(cfg.glowOpacity * 40).toString(16).padStart(2, '0')}`);
    glowGrad.addColorStop(0.5, `${cfg.ringColor2}${Math.round(cfg.glowOpacity * 20).toString(16).padStart(2, '0')}`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Wave bars (left side) ───────────────────────────────────
    const barWidth = w * 0.022;
    const barRadius = barWidth / 2;
    for (let i = 0; i < WAVE_BARS.length; i++) {
      const bar = WAVE_BARS[i];
      const phase = t * cfg.pulseSpeed + i * 0.8;
      const amp = cfg.waveIntensity * (0.5 + 0.5 * Math.sin(phase));
      const barH = w * bar.height * (0.4 + 0.6 * amp);
      const bx = cx - w * bar.offset;
      const by = cy - barH / 2;

      // Gradient per bar
      const barGrad = ctx.createLinearGradient(bx, by, bx, by + barH);
      barGrad.addColorStop(0, cfg.ringColor1);
      barGrad.addColorStop(1, cfg.ringColor2);
      ctx.fillStyle = barGrad;
      ctx.globalAlpha = 0.4 + 0.3 * amp;

      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(bx - barWidth / 2 + barRadius, by);
      ctx.lineTo(bx + barWidth / 2 - barRadius, by);
      ctx.quadraticCurveTo(bx + barWidth / 2, by, bx + barWidth / 2, by + barRadius);
      ctx.lineTo(bx + barWidth / 2, by + barH - barRadius);
      ctx.quadraticCurveTo(bx + barWidth / 2, by + barH, bx + barWidth / 2 - barRadius, by + barH);
      ctx.lineTo(bx - barWidth / 2 + barRadius, by + barH);
      ctx.quadraticCurveTo(bx - barWidth / 2, by + barH, bx - barWidth / 2, by + barH - barRadius);
      ctx.lineTo(bx - barWidth / 2, by + barRadius);
      ctx.quadraticCurveTo(bx - barWidth / 2, by, bx - barWidth / 2 + barRadius, by);
      ctx.closePath();
      ctx.fill();
    }

    // ── Wave bars (right side — mirrored) ───────────────────────
    for (let i = 0; i < WAVE_BARS.length; i++) {
      const bar = WAVE_BARS[i];
      const phase = t * cfg.pulseSpeed + i * 0.8 + 0.4; // slight phase offset
      const amp = cfg.waveIntensity * (0.5 + 0.5 * Math.sin(phase));
      const barH = w * bar.height * (0.4 + 0.6 * amp);
      const bx = cx + w * bar.offset;
      const by = cy - barH / 2;

      const barGrad = ctx.createLinearGradient(bx, by, bx, by + barH);
      barGrad.addColorStop(0, cfg.ringColor2);
      barGrad.addColorStop(1, cfg.ringColor1);
      ctx.fillStyle = barGrad;
      ctx.globalAlpha = 0.4 + 0.3 * amp;

      ctx.beginPath();
      ctx.moveTo(bx - barWidth / 2 + barRadius, by);
      ctx.lineTo(bx + barWidth / 2 - barRadius, by);
      ctx.quadraticCurveTo(bx + barWidth / 2, by, bx + barWidth / 2, by + barRadius);
      ctx.lineTo(bx + barWidth / 2, by + barH - barRadius);
      ctx.quadraticCurveTo(bx + barWidth / 2, by + barH, bx + barWidth / 2 - barRadius, by + barH);
      ctx.lineTo(bx - barWidth / 2 + barRadius, by + barH);
      ctx.quadraticCurveTo(bx - barWidth / 2, by + barH, bx - barWidth / 2, by + barH - barRadius);
      ctx.lineTo(bx - barWidth / 2, by + barRadius);
      ctx.quadraticCurveTo(bx - barWidth / 2, by, bx - barWidth / 2 + barRadius, by);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Glass outer ring ────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = w * 0.008;
    ctx.stroke();
    ctx.restore();

    // ── Main gradient orb — Memelli red ──────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.clip();

    // Base gradient (smooth dark red → red)
    const orbGrad = ctx.createRadialGradient(cx, cy, orbR * 0.1, cx, cy, orbR);
    orbGrad.addColorStop(0, '#E11D2E');
    orbGrad.addColorStop(0.3, '#E84855');
    orbGrad.addColorStop(0.6, '#B71E2E');
    orbGrad.addColorStop(0.85, '#9B1B2E');
    orbGrad.addColorStop(1, '#7A1520');
    ctx.fillStyle = orbGrad;
    ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);

    // Subtle swirling plasma overlay (2 dots, lower opacity)
    const plasmaAngle = t * cfg.plasmaSpeed;
    for (let i = 0; i < 2; i++) {
      const angle = plasmaAngle + (i * Math.PI);
      const px = cx + Math.cos(angle) * orbR * 0.25;
      const py = cy + Math.sin(angle) * orbR * 0.25;
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, orbR * 0.6);

      const colors = ['#F07080', '#B71E2E'];
      pGrad.addColorStop(0, colors[i] + '30');
      pGrad.addColorStop(0.6, colors[i] + '10');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);
    }

    // Glass highlight (top-left specular)
    const specGrad = ctx.createRadialGradient(
      cx - orbR * 0.3, cy - orbR * 0.3, 0,
      cx - orbR * 0.3, cy - orbR * 0.3, orbR * 0.8
    );
    specGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
    specGrad.addColorStop(0.4, 'rgba(255,255,255,0.04)');
    specGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = specGrad;
    ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);

    // ── Logo ────────────────────────────────────────────────────
    if (logoLoaded.current && logoRef.current) {
      const logoSize = orbR * 1.3;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        logoRef.current,
        cx - logoSize / 2,
        cy - logoSize / 2,
        logoSize,
        logoSize,
      );
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // ── Breathing pulse (subtle scale via shadow) ───────────────
    const pulse = 0.5 + 0.5 * Math.sin(t * cfg.pulseSpeed * 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.shadowColor = cfg.ringColor1;
    ctx.shadowBlur = w * 0.04 * (1 + pulse * 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }, [size]);

  // Animation loop
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      timeRef.current += 0.016;
      draw();
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [draw]);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/20">
      <canvas
        ref={canvasRef}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          cursor: onClick ? 'pointer' : 'default',
        }}
      />
    </div>
  );
}

const MUAOrb = memo(MUAOrbInner);
export default MUAOrb;
export type { MUAOrbProps };