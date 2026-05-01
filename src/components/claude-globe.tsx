'use client';

import { useRef, useEffect, useCallback, memo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Claude Globe — Claude's own globe, SEPARATE from Melli's               */
/*                                                                           */
/*  Blue accent (#3B82F6) instead of Melli's red (#E11D2E)                 */
/*  Canvas 2D — no Three.js, lightweight, perfect for floating use           */
/*                                                                           */
/*  Three states:                                                            */
/*    SLEEP  — standby, reduced intensity                                    */
/*    IDLE   — ready, moderate energy                                        */
/*    LIVE   — active, full intensity (pulsing)                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type ClaudeGlobeState = 'sleep' | 'idle' | 'live';

export interface ClaudeGlobeProps {
  size?: number;
  state?: ClaudeGlobeState;
  className?: string;
  onClick?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Configs — Blue palette                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface StateCfg {
  coreColor1: string;
  coreColor2: string;
  coreColor3: string;
  glowColor: string;
  ringColor: string;
  plasmaSpeed: number;
  pulseSpeed: number;
  glowOpacity: number;
  ringOpacity: number;
  particleCount: number;
  particleSpeed: number;
  intensity: number;
}

const STATE_CONFIGS: Record<ClaudeGlobeState, StateCfg> = {
  sleep: {
    coreColor1: '#1E40AF',  // blue-800
    coreColor2: '#1D4ED8',  // blue-700
    coreColor3: '#1E3A5F',  // dark blue
    glowColor: '#3B82F6',   // blue-500
    ringColor: '#3B82F6',
    plasmaSpeed: 0.3,
    pulseSpeed: 1.2,
    glowOpacity: 0.15,
    ringOpacity: 0.15,
    particleCount: 4,
    particleSpeed: 0.2,
    intensity: 0.25,
  },
  idle: {
    coreColor1: '#2563EB',  // blue-600
    coreColor2: '#3B82F6',  // blue-500
    coreColor3: '#1D4ED8',  // blue-700
    glowColor: '#60A5FA',   // blue-400
    ringColor: '#3B82F6',
    plasmaSpeed: 0.6,
    pulseSpeed: 2.0,
    glowOpacity: 0.3,
    ringOpacity: 0.25,
    particleCount: 6,
    particleSpeed: 0.5,
    intensity: 0.6,
  },
  live: {
    coreColor1: '#3B82F6',  // blue-500
    coreColor2: '#60A5FA',  // blue-400
    coreColor3: '#2563EB',  // blue-600
    glowColor: '#93C5FD',   // blue-300
    ringColor: '#60A5FA',
    plasmaSpeed: 1.2,
    pulseSpeed: 3.0,
    glowOpacity: 0.5,
    ringOpacity: 0.4,
    particleCount: 8,
    particleSpeed: 1.0,
    intensity: 1.0,
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Particle data (pre-generated for stable positions)                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  phase: number;
  size: number;
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
      radius: 0.6 + Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      size: 1 + Math.random() * 2,
    });
  }
  return particles;
}

const PARTICLES = generateParticles(12);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Claude Globe Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ClaudeGlobeInner({
  size = 80,
  state = 'sleep',
  className,
  onClick,
}: ClaudeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const currentState = useRef(state);
  currentState.current = state;

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

    const cfg = STATE_CONFIGS[currentState.current];
    const t = timeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const orbR = w * 0.3;
    const ringR = orbR + w * 0.06;

    // ── Outer glow aura ──────────────────────────────────────────
    const pulse = 0.5 + 0.5 * Math.sin(t * cfg.pulseSpeed * 0.5);
    const glowGrad = ctx.createRadialGradient(cx, cy, orbR * 0.3, cx, cy, orbR * 2.2);
    glowGrad.addColorStop(0, hexAlpha(cfg.glowColor, cfg.glowOpacity * (0.8 + pulse * 0.4)));
    glowGrad.addColorStop(0.4, hexAlpha(cfg.glowColor, cfg.glowOpacity * 0.4));
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Orbital ring ─────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, ringR, ringR * 0.35, Math.PI * 0.15, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(cfg.ringColor, cfg.ringOpacity * (0.7 + pulse * 0.3));
    ctx.lineWidth = w * 0.008;
    ctx.stroke();
    ctx.restore();

    // ── Second ring (counter-tilted) ─────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, ringR * 0.95, ringR * 0.3, -Math.PI * 0.2, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(cfg.ringColor, cfg.ringOpacity * 0.5);
    ctx.lineWidth = w * 0.005;
    ctx.stroke();
    ctx.restore();

    // ── Orbiting particles ───────────────────────────────────────
    const activeCount = cfg.particleCount;
    for (let i = 0; i < activeCount; i++) {
      const p = PARTICLES[i % PARTICLES.length];
      const angle = p.angle + t * p.speed * cfg.particleSpeed;
      const pr = ringR * p.radius;

      // Project onto tilted ellipse
      const px = cx + Math.cos(angle) * pr;
      const py = cy + Math.sin(angle) * pr * 0.35;

      const flash = Math.pow(Math.max(Math.sin(t * 2 + p.phase), 0), 4);
      const alpha = 0.3 + flash * 0.7;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, p.size * dpr * cfg.intensity, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha('#93C5FD', alpha * cfg.intensity);
      ctx.shadowColor = cfg.glowColor;
      ctx.shadowBlur = 4 * cfg.intensity;
      ctx.fill();
      ctx.restore();
    }

    // ── Main gradient orb — Blue ─────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.clip();

    // Base gradient
    const orbGrad = ctx.createRadialGradient(cx * 0.85, cy * 0.85, orbR * 0.05, cx, cy, orbR);
    orbGrad.addColorStop(0, cfg.coreColor2);
    orbGrad.addColorStop(0.3, cfg.coreColor1);
    orbGrad.addColorStop(0.7, cfg.coreColor3);
    orbGrad.addColorStop(1, '#0F172A');  // slate-900
    ctx.fillStyle = orbGrad;
    ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);

    // Plasma wisps (2 rotating blue spots)
    const plasmaAngle = t * cfg.plasmaSpeed;
    for (let i = 0; i < 2; i++) {
      const angle = plasmaAngle + i * Math.PI;
      const px = cx + Math.cos(angle) * orbR * 0.3;
      const py = cy + Math.sin(angle) * orbR * 0.3;
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, orbR * 0.6);
      const colors = ['#60A5FA', '#1E40AF'];
      pGrad.addColorStop(0, colors[i] + '40');
      pGrad.addColorStop(0.5, colors[i] + '15');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);
    }

    // Glass specular highlight (top-left)
    const specGrad = ctx.createRadialGradient(
      cx - orbR * 0.3, cy - orbR * 0.35, 0,
      cx - orbR * 0.3, cy - orbR * 0.35, orbR * 0.7
    );
    specGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
    specGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
    specGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = specGrad;
    ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);

    ctx.restore();

    // ── Breathing pulse ring around orb ──────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR + 1, 0, Math.PI * 2);
    ctx.shadowColor = cfg.glowColor;
    ctx.shadowBlur = w * 0.06 * (0.5 + pulse * 0.5) * cfg.intensity;
    ctx.strokeStyle = hexAlpha('#BFDBFE', 0.1 + pulse * 0.1);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ── Center "C" letter mark ───────────────────────────────────
    ctx.save();
    const fontSize = orbR * 0.7;
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hexAlpha('#E0F2FE', 0.85 * cfg.intensity + 0.15);
    ctx.fillText('C', cx, cy + fontSize * 0.03);
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
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          cursor: onClick ? 'pointer' : 'default',
        }}
        aria-label="Claude AI Globe"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Hex + alpha helper                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + a;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ClaudeGlobe = memo(ClaudeGlobeInner);
export default ClaudeGlobe;
