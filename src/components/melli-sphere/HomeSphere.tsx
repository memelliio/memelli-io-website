'use client';

/**
 * HomeSphere — audio-reactive, fully configurable crystal orb.
 *
 * All visual parameters driven by SphereConfig:
 *   hue, saturation, energy, speed, audioSensitivity, pulseEnabled,
 *   logoOpacity, coronaSize, breatheAmp,
 *   logoBackground, logoRotation, logoSwingAmp, logoShake, logoGlow,
 *   logoWave, logoShadow, coronaEnabled, coronaHue
 *
 * Canvas draws at 1.35× display size — outer glow bleeds past every
 * corner so no square boundary is visible.
 */

import { useRef, useEffect } from 'react';
import { type SphereConfig, DEFAULT_SPHERE_CONFIG, hslRgba } from './sphere-config';

type SphereState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface HomeSphereProps {
  state?: SphereState;
  size?: number;
  audioLevel?: number;      // 0–1 live amplitude
  config?: Partial<SphereConfig>;
}

const STATE_CFG = {
  idle:      { glowA: 0.45, pulseA: 0.00, logoAlpha: 0.55, logoScale: 0.94, logoSpeed: 0.015, breatheAmp: 0.030, breatheSpeed: 1.4, brightness: 0.55 },
  listening: { glowA: 0.68, pulseA: 0.38, logoAlpha: 0.80, logoScale: 0.96, logoSpeed: 0.025, breatheAmp: 0.050, breatheSpeed: 2.0, brightness: 1.00 },
  thinking:  { glowA: 0.58, pulseA: 0.12, logoAlpha: 0.70, logoScale: 0.96, logoSpeed: 0.022, breatheAmp: 0.040, breatheSpeed: 1.8, brightness: 0.85 },
  speaking:  { glowA: 0.88, pulseA: 0.55, logoAlpha: 0.95, logoScale: 1.00, logoSpeed: 0.042, breatheAmp: 0.070, breatheSpeed: 2.6, brightness: 1.00 },
};

export function HomeSphere({
  state = 'idle',
  size = 320,
  audioLevel = 0,
  config: configOverride = {},
}: HomeSphereProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const timeRef     = useRef(0);
  const stateRef    = useRef(state);
  const audioRef    = useRef(audioLevel);
  const cfgRef      = useRef<typeof STATE_CFG[SphereState]>({ ...STATE_CFG[state] });
  const brightnessRef = useRef(STATE_CFG[state].brightness);
  const logoRef     = useRef<HTMLImageElement | null>(null);
  const visRef      = useRef<SphereConfig>({ ...DEFAULT_SPHERE_CONFIG });

  stateRef.current = state;
  audioRef.current = audioLevel;
  Object.assign(visRef.current, DEFAULT_SPHERE_CONFIG, configOverride);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/melli-orb.png';
    img.onload = () => { logoRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const OVER = 1.35;
    const DRAW = Math.round(size * OVER);
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = DRAW * dpr;
    canvas.height = DRAW * dpr;
    ctx.scale(dpr, dpr);

    const cx = DRAW / 2;
    const cy = DRAW / 2;
    const r  = size * 0.44;

    function draw(t: number) {
      const target = STATE_CFG[stateRef.current];
      const c      = cfgRef.current;
      const vis    = visRef.current;

      // Lerp state config
      const L = 0.05;
      c.glowA        += (target.glowA        - c.glowA)        * L;
      c.pulseA       += (target.pulseA       - c.pulseA)       * L;
      c.logoAlpha    += (target.logoAlpha    - c.logoAlpha)    * L;
      c.logoScale    += (target.logoScale    - c.logoScale)    * L;
      c.logoSpeed    += (target.logoSpeed    - c.logoSpeed)    * L;
      c.breatheAmp   += (target.breatheAmp   - c.breatheAmp)   * L;
      c.breatheSpeed += (target.breatheSpeed - c.breatheSpeed) * L;
      // Lerp brightness — use user config if set, else fall back to state defaults
      const targetBrightness = stateRef.current === 'idle'
        ? vis.idleBrightness
        : vis.activeBrightness;
      brightnessRef.current += (targetBrightness - brightnessRef.current) * L;
      if (canvas) canvas.style.filter = `brightness(${brightnessRef.current.toFixed(3)})`;

      // Apply user config multipliers
      const av         = audioRef.current * vis.audioSensitivity;
      const audioBoost = 1 + av * 1.8;
      const glowA      = Math.min(0.95, c.glowA * vis.energy * audioBoost);
      const spd        = vis.speed;
      const { hue, saturation: sat } = vis;

      // Corona hue — custom or inherit
      const cHue = vis.coronaHue >= 0 ? vis.coronaHue : hue;

      ctx.clearRect(0, 0, DRAW, DRAW);

      // ── Outer corona ─────────────────────────────────────────────
      if (vis.coronaEnabled) {
        const coronaR = DRAW * 0.76 * vis.coronaSize;
        const corona  = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, coronaR);
        corona.addColorStop(0,    hslRgba(cHue, sat, 38, glowA * 0.90));
        corona.addColorStop(0.28, hslRgba(cHue, sat, 25, glowA * 0.40));
        corona.addColorStop(0.58, hslRgba(cHue, sat, 14, glowA * 0.14));
        corona.addColorStop(1,    'transparent');
        ctx.fillStyle = corona;
        ctx.fillRect(0, 0, DRAW, DRAW);
      }

      // ── Sphere body (optional — off when logoBackground=false) ────
      if (vis.logoBackground) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const body = ctx.createRadialGradient(cx - r * 0.18, cy - r * 0.20, 0, cx, cy, r * 1.02);
        body.addColorStop(0,   hslRgba(hue, sat, 8,  1));
        body.addColorStop(0.5, hslRgba(hue, sat, 4,  1));
        body.addColorStop(1,   hslRgba(hue, sat, 1,  1));
        ctx.fillStyle = body;
        ctx.fill();
      }

      // ── Clip inside sphere ────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Inner ambient glow (only with background)
      if (vis.logoBackground) {
        const innerG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.92);
        innerG.addColorStop(0,    hslRgba(hue, sat, 55, Math.min(0.90, glowA * 0.72)));
        innerG.addColorStop(0.32, hslRgba(hue, sat, 40, Math.min(0.55, glowA * 0.40)));
        innerG.addColorStop(0.68, hslRgba(hue, sat, 22, Math.min(0.22, glowA * 0.18)));
        innerG.addColorStop(1,    'transparent');
        ctx.fillStyle = innerG;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        // Audio waveform burst (inside ball)
        if (av > 0.05) {
          const waveR = r * (0.55 + av * 0.38);
          const waveG = ctx.createRadialGradient(cx, cy, waveR * 0.7, cx, cy, waveR);
          waveG.addColorStop(0,   hslRgba(hue, sat, 65, av * 0.55));
          waveG.addColorStop(0.6, hslRgba(hue, sat, 50, av * 0.24));
          waveG.addColorStop(1,   'transparent');
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
          ctx.fillStyle = waveG;
          ctx.fill();
        }
      }

      // Thinking scan line
      if (stateRef.current === 'thinking') {
        const scanY = cy - r + ((t * spd * 72) % (r * 2));
        const sg = ctx.createLinearGradient(cx - r, scanY, cx + r, scanY);
        sg.addColorStop(0,   'transparent');
        sg.addColorStop(0.5, hslRgba(hue, sat, 65, c.glowA * 0.30));
        sg.addColorStop(1,   'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(cx - r, scanY, r * 2, 2.5);
      }

      // ── Logo ──────────────────────────────────────────────────────
      if (logoRef.current) {
        const breatheAmpFinal = c.breatheAmp * vis.breatheAmp;
        const breathe  = 1 + (breatheAmpFinal + av * 0.12) * Math.sin(t * c.breatheSpeed * spd);

        // Rotation mode
        let logoRot = 0;
        if (vis.logoRotation === 'spin') {
          logoRot = t * c.logoSpeed * spd;
        } else if (vis.logoRotation === 'swing') {
          // pendulum: -swingAmp ↔ +swingAmp (left ↔ right)
          logoRot = Math.sin(t * c.logoSpeed * spd * 3.5) * vis.logoSwingAmp;
        }
        // 'none' → logoRot stays 0

        // Logo size — 3× bigger than before
        const logoSize = r * 2 * c.logoScale * breathe * 1.5;
        const alpha    = Math.min(0.98, c.logoAlpha * vis.logoOpacity + av * 0.18);

        // Shake offset — position jitter on audio
        const shakeX = vis.logoShake && av > 0.08 ? (Math.random() - 0.5) * av * r * 0.14 : 0;
        const shakeY = vis.logoShake && av > 0.08 ? (Math.random() - 0.5) * av * r * 0.14 : 0;

        // Sound wave rings radiating from logo
        if (vis.logoWave && av > 0.04) {
          const waveCount = 3;
          for (let wi = 0; wi < waveCount; wi++) {
            const wph   = (t * 2.8 * spd + wi * 0.9) % 1.4;
            const wRad  = (logoSize / 2) * (0.7 + wph * 0.9);
            const wAlpha = av * 0.65 * (1 - wph / 1.4);
            ctx.beginPath();
            ctx.arc(cx + shakeX, cy + shakeY, wRad, 0, Math.PI * 2);
            ctx.strokeStyle = hslRgba(hue, sat, 70, wAlpha);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Logo glow halo — lights up on audio
        if (vis.logoGlow) {
          const glowRad = logoSize * (0.55 + av * 0.6);
          const logoGlowG = ctx.createRadialGradient(
            cx + shakeX, cy + shakeY, 0,
            cx + shakeX, cy + shakeY, glowRad
          );
          logoGlowG.addColorStop(0,   hslRgba(hue, sat, 70, 0.30 + av * 0.50));
          logoGlowG.addColorStop(0.45, hslRgba(hue, sat, 55, 0.12 + av * 0.18));
          logoGlowG.addColorStop(1,   'transparent');
          ctx.fillStyle = logoGlowG;
          ctx.fillRect(
            cx + shakeX - glowRad, cy + shakeY - glowRad,
            glowRad * 2, glowRad * 2
          );
        }

        // Draw logo
        ctx.save();
        ctx.translate(cx + shakeX, cy + shakeY);
        ctx.rotate(logoRot);
        ctx.globalAlpha = alpha;
        // With background: screen blends with dark sphere. Without: normal render
        ctx.globalCompositeOperation = vis.logoBackground ? 'screen' : 'source-over';
        ctx.drawImage(logoRef.current, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      }

      // ── Orbiting particles ────────────────────────────────────────
      const orbitBands = [
        { radius: r * 0.50, speed: 0.9 * spd,  count: 4, sz: 2.2, hShift:  0 },
        { radius: r * 0.72, speed: -0.6 * spd, count: 6, sz: 1.6, hShift: 15 },
        { radius: r * 0.85, speed: 0.4 * spd,  count: 3, sz: 2.8, hShift: -8 },
      ];
      for (const ob of orbitBands) {
        for (let pi = 0; pi < ob.count; pi++) {
          const angle = t * ob.speed + (pi * Math.PI * 2 / ob.count);
          const px = cx + Math.cos(angle) * ob.radius;
          const py = cy + Math.sin(angle) * ob.radius;
          const depth = (Math.sin(angle) + 1) / 2;
          const pAlpha = (0.25 + depth * 0.65) * c.logoAlpha * glowA;
          const pSize  = ob.sz * (0.55 + depth * 0.45);
          const pg = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
          pg.addColorStop(0, hslRgba(hue + ob.hShift, sat, 75, pAlpha));
          pg.addColorStop(0.4, hslRgba(hue + ob.hShift, sat, 55, pAlpha * 0.5));
          pg.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = pg;
          ctx.fill();
        }
      }

      ctx.restore(); // end sphere clip

      // ── Glass highlight (only with background) ────────────────────
      if (vis.logoBackground) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const hi = ctx.createRadialGradient(
          cx - r * 0.46, cy - r * 0.46, 0,
          cx - r * 0.20, cy - r * 0.20, r * 0.72
        );
        hi.addColorStop(0,    'rgba(255,255,255,0.22)');
        hi.addColorStop(0.40, 'rgba(255,255,255,0.05)');
        hi.addColorStop(1,    'transparent');
        ctx.fillStyle = hi;
        ctx.fill();

        // Bottom reflection
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const lo = ctx.createRadialGradient(cx + r * 0.28, cy + r * 0.35, 0, cx + r * 0.20, cy + r * 0.28, r * 0.30);
        lo.addColorStop(0, hslRgba(hue, sat, 45, glowA * 0.09));
        lo.addColorStop(1, 'transparent');
        ctx.fillStyle = lo;
        ctx.fill();
      }

      // ── Edge ring (logoShadow toggle) ─────────────────────────────
      if (vis.logoShadow) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hslRgba(hue, sat, 55, Math.min(0.90, glowA * 0.55 + av * 0.35));
        ctx.lineWidth = 1.5 + av * 2;
        ctx.stroke();
      }

      // ── Pulse rings ───────────────────────────────────────────────
      const effectivePulse = vis.pulseEnabled ? Math.max(c.pulseA, av * 0.8) : av * 0.6;
      if (effectivePulse > 0.02) {
        const rings    = av > 0.15 ? 5 : 3;
        const pulseFrq = (2.2 + av * 3.5) * spd;
        for (let ri = 0; ri < rings; ri++) {
          const ph    = (t * pulseFrq + ri * (1.5 / rings)) % 1.5;
          const rr    = r * (1.005 + ph * 0.32);
          const alpha = Math.max(0, effectivePulse * (1 - ph / 1.5));
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = hslRgba(hue, sat, 55, alpha);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // ── Orbital rings ─────────────────────────────────────────────
      const ringAlpha = c.glowA * 0.18;
      if (ringAlpha > 0.02) {
        // Ring 1 — tilted like a planet orbit, rotating slowly
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.22 * spd);
        ctx.scale(1, 0.28);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
        ctx.strokeStyle = hslRgba(hue, sat, 65, ringAlpha);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 16]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Ring 2 — opposite tilt, faster rotation
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-t * 0.35 * spd + 1.1);
        ctx.scale(0.30, 1);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.10, 0, Math.PI * 2);
        ctx.strokeStyle = hslRgba(hue + 20, sat, 60, ringAlpha * 0.7);
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 20]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    const tick = () => {
      timeRef.current += 0.016;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        display: 'block',
        background: 'transparent',
        imageRendering: 'auto',
      }}
    />
  );
}
