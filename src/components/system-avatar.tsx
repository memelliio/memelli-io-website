'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface SystemAvatarProps {
  educationScore: number; // 0-100
  domainScores: Record<string, number>; // domain -> 0-100
  pulse: number; // 0-100 (heartbeat strength)
  pulseHealth: 'healthy' | 'stressed' | 'failing' | 'offline';
  bpm: number;
  abilityMeter: number; // 0-100
  actionMeter: number; // 0-100
  laneCount: number;
  throughput: number;
  currentFocus: string;
  awakeningStatus: 'sleeping' | 'waking' | 'awake' | 'alive';
}

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const EDUCATION_DOMAINS = [
  'commerce',
  'crm',
  'coaching',
  'seo',
  'analytics',
  'automation',
  'ai',
  'security',
  'infrastructure',
  'communications',
];

// Brain region positions (cx, cy relative to head center, radius)
const BRAIN_REGIONS: Array<{ cx: number; cy: number; r: number; domain: string }> = [
  { cx: -14, cy: -8, r: 5, domain: 'commerce' },
  { cx: -6, cy: -14, r: 5, domain: 'crm' },
  { cx: 6, cy: -14, r: 5, domain: 'coaching' },
  { cx: 14, cy: -8, r: 5, domain: 'seo' },
  { cx: -16, cy: 2, r: 5, domain: 'analytics' },
  { cx: -8, cy: -2, r: 5, domain: 'automation' },
  { cx: 8, cy: -2, r: 5, domain: 'ai' },
  { cx: 16, cy: 2, r: 5, domain: 'security' },
  { cx: -6, cy: 8, r: 5, domain: 'infrastructure' },
  { cx: 6, cy: 8, r: 5, domain: 'communications' },
];

const HEALTH_COLORS = {
  healthy: '#10b981',
  stressed: '#f59e0b',
  failing: '#ef4444',
  offline: '#3f3f46',
};

const AURA_OPACITY = {
  sleeping: 0.05,
  waking: 0.15,
  awake: 0.3,
  alive: 0.55,
};

const AURA_BLUR = {
  sleeping: 20,
  waking: 30,
  awake: 40,
  alive: 55,
};

// Number of particles for data flow along veins
const VEIN_PARTICLE_COUNT = 24;

/* ================================================================== */
/*  AVATAR CSS — UPGRADED WITH RICH ANIMATIONS                         */
/* ================================================================== */

const avatarCSS = `
  /* ---- HEARTBEAT ---- */
  @keyframes avatar-heartbeat {
    0%, 100% { transform: scale(1); opacity: var(--heart-base-opacity, 0.6); }
    8% { transform: scale(1.18); opacity: 1; }
    15% { transform: scale(0.92); opacity: var(--heart-base-opacity, 0.6); }
    22% { transform: scale(1.08); opacity: 0.9; }
    35% { transform: scale(1); opacity: var(--heart-base-opacity, 0.6); }
  }
  @keyframes avatar-heartbeat-fast {
    0%, 100% { transform: scale(1); opacity: var(--heart-base-opacity, 0.6); }
    6% { transform: scale(1.25); opacity: 1; }
    12% { transform: scale(0.88); opacity: var(--heart-base-opacity, 0.6); }
    18% { transform: scale(1.12); opacity: 0.95; }
    28% { transform: scale(1); opacity: var(--heart-base-opacity, 0.6); }
  }
  @keyframes avatar-heart-ring {
    0% { r: 14; opacity: 0.3; }
    50% { r: 24; opacity: 0; }
    100% { r: 14; opacity: 0.3; }
  }

  /* ---- EYES ---- */
  @keyframes avatar-eye-scan {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(1.8px); }
    40% { transform: translateX(0.5px); }
    60% { transform: translateX(-1.8px); }
    80% { transform: translateX(-0.5px); }
  }
  @keyframes avatar-eye-blink {
    0%, 92%, 100% { transform: scaleY(1); }
    94% { transform: scaleY(0.08); }
    96% { transform: scaleY(1); }
  }
  @keyframes avatar-eye-blink-2 {
    0%, 88%, 100% { transform: scaleY(1); }
    90% { transform: scaleY(0.08); }
    92% { transform: scaleY(1); }
  }

  /* ---- VEIN / NERVE FLOW ---- */
  @keyframes avatar-nerve-flow {
    0% { stroke-dashoffset: 20; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes avatar-nerve-flow-reverse {
    0% { stroke-dashoffset: -20; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes avatar-nerve-pulse {
    0%, 100% { opacity: var(--nerve-base, 0.2); stroke-width: var(--nerve-width, 0.6); }
    50% { opacity: calc(var(--nerve-base, 0.2) * 2.5); stroke-width: calc(var(--nerve-width, 0.6) * 1.6); }
  }
  @keyframes avatar-spine-flow {
    0% { stroke-dashoffset: 40; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes avatar-spine-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.85; }
  }

  /* ---- BRAIN ---- */
  @keyframes avatar-brain-pulse {
    0%, 100% { opacity: var(--brain-min, 0.4); filter: brightness(1); }
    50% { opacity: var(--brain-max, 1); filter: brightness(1.3); }
  }
  @keyframes avatar-brain-glow-ring {
    0%, 100% { opacity: 0.2; r: var(--ring-r, 7); }
    50% { opacity: 0.5; r: calc(var(--ring-r, 7) + 1.5); }
  }

  /* ---- AURA ---- */
  @keyframes avatar-aura-breathe {
    0%, 100% { opacity: var(--aura-base); transform: scale(1); }
    50% { opacity: calc(var(--aura-base) * 1.5); transform: scale(1.04); }
  }
  @keyframes avatar-aura-pulse {
    0%, 100% { opacity: var(--aura-base); filter: blur(var(--aura-blur)); }
    30% { opacity: calc(var(--aura-base) * 1.8); filter: blur(calc(var(--aura-blur) * 0.85)); }
    60% { opacity: var(--aura-base); filter: blur(var(--aura-blur)); }
  }

  /* ---- BREATHING (whole figure) ---- */
  @keyframes avatar-breathe {
    0%, 100% { transform: scaleX(1) scaleY(1); }
    40% { transform: scaleX(1.008) scaleY(1.012); }
    60% { transform: scaleX(1.008) scaleY(1.012); }
  }

  /* ---- PROCESSING LABEL ---- */
  @keyframes avatar-processing {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }

  /* ---- PARTICLE FLOW along veins ---- */
  @keyframes avatar-particle-flow {
    0% { offset-distance: 0%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { offset-distance: 100%; opacity: 0; }
  }

  /* ---- VEIN GLOW PULSE ---- */
  @keyframes avatar-vein-glow {
    0%, 100% { filter: drop-shadow(0 0 1px var(--vein-color, #10b981)); opacity: var(--vein-base, 0.3); }
    50% { filter: drop-shadow(0 0 4px var(--vein-color, #10b981)); opacity: calc(var(--vein-base, 0.3) * 2); }
  }
`;

/* ================================================================== */
/*  VEIN PARTICLE COMPONENT                                            */
/* ================================================================== */

function VeinParticles({
  pathId,
  count,
  color,
  active,
  speed,
}: {
  pathId: string;
  count: number;
  color: string;
  active: boolean;
  speed: number;
}) {
  if (!active) return null;

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          r="1.5"
          fill={color}
          opacity="0"
        >
          <animateMotion
            dur={`${speed}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * speed}s`}
          >
            <mpath xlinkHref={`#${pathId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            keyTimes="0;0.1;0.85;1"
            dur={`${speed}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * speed}s`}
          />
          <animate
            attributeName="r"
            values="1;2;1"
            dur={`${speed}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * speed}s`}
          />
        </circle>
      ))}
    </>
  );
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function SystemAvatar({
  educationScore,
  domainScores,
  pulse,
  pulseHealth,
  bpm,
  abilityMeter,
  actionMeter,
  laneCount,
  throughput,
  currentFocus,
  awakeningStatus,
}: SystemAvatarProps) {
  const [heartPhase, setHeartPhase] = useState(0);
  const heartRef = useRef<number>(0);
  const [blinkSeed] = useState(() => Math.random() * 2 + 3); // random blink interval 3-5s

  // Heartbeat timer
  useEffect(() => {
    if (pulseHealth === 'offline') return;
    const interval = bpm > 0 ? 60000 / bpm : 1000;
    const iv = setInterval(() => {
      heartRef.current += 1;
      setHeartPhase(heartRef.current);
    }, interval);
    return () => clearInterval(iv);
  }, [bpm, pulseHealth]);

  const healthColor = HEALTH_COLORS[pulseHealth];
  const auraOpacity = AURA_OPACITY[awakeningStatus];
  const auraBlur = AURA_BLUR[awakeningStatus];
  const brainGlow = educationScore / 100;
  const isProcessing = currentFocus !== '' && currentFocus !== 'idle';
  const heartbeatSpeed = pulseHealth === 'stressed' ? 0.6 : pulseHealth === 'failing' ? 0.4 : 1;
  const isAlive = awakeningStatus === 'alive';
  const isAwake = awakeningStatus === 'awake' || isAlive;
  const particlesActive = throughput > 0 || isProcessing;
  const breathSpeed = isAlive ? 3.5 : isAwake ? 5 : 7;

  // SVG dimensions
  const W = 200;
  const H = 400;
  const headCX = W / 2;
  const headCY = 55;
  const bodyCX = W / 2;

  // Nerve base opacity scales with awakening
  const nerveBase = awakeningStatus === 'alive' ? 0.5 : awakeningStatus === 'awake' ? 0.35 : awakeningStatus === 'waking' ? 0.2 : 0.08;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: avatarCSS }} />
      <div className="relative flex flex-col items-center" style={{ width: 220, height: 480 }}>
        {/* AURA - overall glow behind the figure — now PULSES with heartbeat */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 280,
            height: 480,
            top: -20,
            left: -30,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 50% 35%, ${healthColor}${Math.round(auraOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
            animation: `avatar-aura-pulse ${heartbeatSpeed * 1.5}s ease-in-out infinite`,
            // @ts-expect-error CSS custom property
            '--aura-base': auraOpacity,
            '--aura-blur': `${auraBlur}px`,
          }}
        />
        {/* Secondary aura layer for depth */}
        {isAwake && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: 320,
              height: 520,
              top: -40,
              left: -50,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at 50% 40%, ${healthColor}${Math.round(auraOpacity * 0.3 * 255).toString(16).padStart(2, '0')} 0%, transparent 55%)`,
              filter: `blur(${auraBlur + 20}px)`,
              animation: `avatar-aura-breathe ${breathSpeed + 1}s ease-in-out infinite`,
              // @ts-expect-error CSS custom property
              '--aura-base': auraOpacity * 0.3,
            }}
          />
        )}

        {/* BREATHING WRAPPER — subtle chest expansion on the whole SVG */}
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="relative z-10"
          style={{
            filter: `drop-shadow(0 0 ${isAlive ? 14 : isAwake ? 8 : 3}px ${healthColor}50)`,
            animation: pulseHealth !== 'offline' ? `avatar-breathe ${breathSpeed}s ease-in-out infinite` : 'none',
            transformOrigin: `${bodyCX}px 160px`,
          }}
        >
          <defs>
            <filter id="avatarGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="brainGlow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <filter id="brainGlowStrong">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="heartGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="veinGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="particleGlow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={healthColor} stopOpacity={0.9} />
              <stop offset="50%" stopColor={healthColor} stopOpacity={0.5} />
              <stop offset="100%" stopColor={healthColor} stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="leftArmGrad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={abilityMeter / 100} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={abilityMeter / 300} />
            </linearGradient>
            <linearGradient id="rightArmGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={actionMeter / 100} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={actionMeter / 300} />
            </linearGradient>

            {/* ==== VEIN PATHS (reused for particles) ==== */}
            <path id="vein-shoulder-l" d={`M ${bodyCX - 30} 110 Q ${bodyCX - 45} 100, ${bodyCX - 55} 130`} />
            <path id="vein-shoulder-r" d={`M ${bodyCX + 30} 110 Q ${bodyCX + 45} 100, ${bodyCX + 55} 130`} />
            <path id="vein-torso-l" d={`M ${bodyCX - 20} 120 L ${bodyCX - 25} 180 L ${bodyCX - 20} 240`} />
            <path id="vein-torso-r" d={`M ${bodyCX + 20} 120 L ${bodyCX + 25} 180 L ${bodyCX + 20} 240`} />
            <path id="vein-leg-l" d={`M ${bodyCX - 15} 250 L ${bodyCX - 20} 310 L ${bodyCX - 18} 370`} />
            <path id="vein-leg-r" d={`M ${bodyCX + 15} 250 L ${bodyCX + 20} 310 L ${bodyCX + 18} 370`} />
            <path id="vein-cross-1" d={`M ${bodyCX - 30} 140 Q ${bodyCX} 155, ${bodyCX + 30} 140`} />
            <path id="vein-cross-2" d={`M ${bodyCX - 25} 200 Q ${bodyCX} 210, ${bodyCX + 25} 200`} />
            <path id="vein-spine" d={`M ${bodyCX} 88 L ${bodyCX} 250`} />
          </defs>

          {/* ==================== NERVOUS SYSTEM (PULSING VEINS) ==================== */}
          {/* Shoulder nerves — now pulse with data flow */}
          <path
            d={`M ${bodyCX - 30} 110 Q ${bodyCX - 45} 100, ${bodyCX - 55} 130`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.8"
            opacity={nerveBase}
            strokeDasharray="4 6"
            style={{
              animation: `avatar-nerve-flow 1.5s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 2}s ease-in-out infinite`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase,
              '--nerve-width': 0.8,
            }}
          />
          {/* Shoulder nerve GLOW layer */}
          <path
            d={`M ${bodyCX - 30} 110 Q ${bodyCX - 45} 100, ${bodyCX - 55} 130`}
            fill="none"
            stroke={healthColor}
            strokeWidth="3"
            opacity={nerveBase * 0.3}
            filter="url(#veinGlow)"
            style={{
              animation: `avatar-nerve-pulse ${heartbeatSpeed * 2}s ease-in-out infinite`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.3,
              '--nerve-width': 3,
            }}
          />
          <path
            d={`M ${bodyCX + 30} 110 Q ${bodyCX + 45} 100, ${bodyCX + 55} 130`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.8"
            opacity={nerveBase}
            strokeDasharray="4 6"
            style={{
              animation: `avatar-nerve-flow-reverse 1.5s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 2}s ease-in-out infinite 0.3s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase,
              '--nerve-width': 0.8,
            }}
          />
          <path
            d={`M ${bodyCX + 30} 110 Q ${bodyCX + 45} 100, ${bodyCX + 55} 130`}
            fill="none"
            stroke={healthColor}
            strokeWidth="3"
            opacity={nerveBase * 0.3}
            filter="url(#veinGlow)"
            style={{
              animation: `avatar-nerve-pulse ${heartbeatSpeed * 2}s ease-in-out infinite 0.3s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.3,
              '--nerve-width': 3,
            }}
          />

          {/* Torso nerves */}
          <path
            d={`M ${bodyCX - 20} 120 L ${bodyCX - 25} 180 L ${bodyCX - 20} 240`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.6"
            opacity={nerveBase * 0.8}
            strokeDasharray="3 5"
            style={{
              animation: `avatar-nerve-flow 2s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 2.5}s ease-in-out infinite 0.5s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.8,
              '--nerve-width': 0.6,
            }}
          />
          <path
            d={`M ${bodyCX + 20} 120 L ${bodyCX + 25} 180 L ${bodyCX + 20} 240`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.6"
            opacity={nerveBase * 0.8}
            strokeDasharray="3 5"
            style={{
              animation: `avatar-nerve-flow-reverse 2s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 2.5}s ease-in-out infinite 0.7s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.8,
              '--nerve-width': 0.6,
            }}
          />

          {/* Leg nerves */}
          <path
            d={`M ${bodyCX - 15} 250 L ${bodyCX - 20} 310 L ${bodyCX - 18} 370`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.5"
            opacity={nerveBase * 0.6}
            strokeDasharray="3 5"
            style={{
              animation: `avatar-nerve-flow 2.5s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 3}s ease-in-out infinite`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.6,
              '--nerve-width': 0.5,
            }}
          />
          <path
            d={`M ${bodyCX + 15} 250 L ${bodyCX + 20} 310 L ${bodyCX + 18} 370`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.5"
            opacity={nerveBase * 0.6}
            strokeDasharray="3 5"
            style={{
              animation: `avatar-nerve-flow-reverse 2.5s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 3}s ease-in-out infinite 0.4s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.6,
              '--nerve-width': 0.5,
            }}
          />

          {/* Cross-body data lines — pulse with activity */}
          <path
            d={`M ${bodyCX - 30} 140 Q ${bodyCX} 155, ${bodyCX + 30} 140`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.5"
            opacity={nerveBase * 0.5}
            strokeDasharray="2 4"
            style={{
              animation: `avatar-nerve-flow 1s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 1.5}s ease-in-out infinite`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.5,
              '--nerve-width': 0.5,
            }}
          />
          <path
            d={`M ${bodyCX - 25} 200 Q ${bodyCX} 210, ${bodyCX + 25} 200`}
            fill="none"
            stroke={healthColor}
            strokeWidth="0.5"
            opacity={nerveBase * 0.5}
            strokeDasharray="2 4"
            style={{
              animation: `avatar-nerve-flow 1.2s linear infinite, avatar-nerve-pulse ${heartbeatSpeed * 1.8}s ease-in-out infinite 0.2s`,
              // @ts-expect-error CSS custom property
              '--nerve-base': nerveBase * 0.5,
              '--nerve-width': 0.5,
            }}
          />

          {/* ==================== VEIN PARTICLES (data flowing along veins) ==================== */}
          {particlesActive && (
            <g filter="url(#particleGlow)">
              <VeinParticles pathId="vein-shoulder-l" count={3} color={healthColor} active={particlesActive} speed={2} />
              <VeinParticles pathId="vein-shoulder-r" count={3} color={healthColor} active={particlesActive} speed={2.2} />
              <VeinParticles pathId="vein-torso-l" count={4} color={healthColor} active={particlesActive} speed={3} />
              <VeinParticles pathId="vein-torso-r" count={4} color={healthColor} active={particlesActive} speed={3.3} />
              <VeinParticles pathId="vein-leg-l" count={3} color={healthColor} active={particlesActive} speed={3.5} />
              <VeinParticles pathId="vein-leg-r" count={3} color={healthColor} active={particlesActive} speed={3.8} />
              <VeinParticles pathId="vein-cross-1" count={2} color={isProcessing ? '#06b6d4' : healthColor} active={particlesActive} speed={1.5} />
              <VeinParticles pathId="vein-cross-2" count={2} color={isProcessing ? '#06b6d4' : healthColor} active={particlesActive} speed={1.8} />
              <VeinParticles pathId="vein-spine" count={5} color={healthColor} active={particlesActive} speed={2} />
            </g>
          )}

          {/* ==================== BODY WIREFRAME ==================== */}
          {/* Torso */}
          <path
            d={`M ${bodyCX - 30} 95 Q ${bodyCX - 35} 170, ${bodyCX - 22} 250 L ${bodyCX + 22} 250 Q ${bodyCX + 35} 170, ${bodyCX + 30} 95 Z`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
          />
          {/* Torso fill (very subtle) */}
          <path
            d={`M ${bodyCX - 30} 95 Q ${bodyCX - 35} 170, ${bodyCX - 22} 250 L ${bodyCX + 22} 250 Q ${bodyCX + 35} 170, ${bodyCX + 30} 95 Z`}
            fill={`${healthColor}08`}
          />

          {/* ==================== SPINE (The Rail) — ENHANCED ==================== */}
          {/* Spine glow background */}
          <line
            x1={bodyCX}
            y1={88}
            x2={bodyCX}
            y2={250}
            stroke={healthColor}
            strokeWidth="8"
            strokeLinecap="round"
            opacity={0.06 + (throughput / 100) * 0.08}
            filter="url(#brainGlow)"
            style={{
              animation: `avatar-spine-pulse ${heartbeatSpeed * 2}s ease-in-out infinite`,
            }}
          />
          {/* Spine core */}
          <line
            x1={bodyCX}
            y1={88}
            x2={bodyCX}
            y2={250}
            stroke="url(#spineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={0.5 + (throughput / 100) * 0.5}
            strokeDasharray="6 3"
            style={{ animation: throughput > 0 ? `avatar-spine-flow 1s linear infinite, avatar-spine-pulse ${heartbeatSpeed * 2}s ease-in-out infinite` : 'none' }}
          />

          {/* ==================== HEAD ==================== */}
          {/* Head outline */}
          <ellipse
            cx={headCX}
            cy={headCY}
            rx={24}
            ry={28}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.2"
          />
          {/* Head glow based on education — pulses with knowledge level */}
          <ellipse
            cx={headCX}
            cy={headCY}
            rx={24}
            ry={28}
            fill={`${healthColor}${Math.round(brainGlow * 25).toString(16).padStart(2, '0')}`}
            filter="url(#brainGlowStrong)"
            style={{
              animation: educationScore > 30 ? `avatar-brain-pulse 4s ease-in-out infinite` : 'none',
              // @ts-expect-error CSS custom property
              '--brain-min': 0.3 + brainGlow * 0.2,
              '--brain-max': 0.5 + brainGlow * 0.5,
            }}
          />

          {/* Neck */}
          <line
            x1={headCX}
            y1={83}
            x2={headCX}
            y2={95}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />

          {/* ==================== BRAIN REGIONS — GLOW + FADE ==================== */}
          {BRAIN_REGIONS.map((region, idx) => {
            const score = domainScores[region.domain] ?? 0;
            const isLit = score >= 30;
            const intensity = score / 100;
            const delayS = (idx * 0.4).toFixed(1);
            return (
              <g key={region.domain}>
                {/* Glow halo (always present when lit, fades in/out) */}
                {isLit && (
                  <circle
                    cx={headCX + region.cx}
                    cy={headCY + region.cy}
                    r={region.r + 3}
                    fill={healthColor}
                    opacity={intensity * 0.15}
                    filter="url(#brainGlowStrong)"
                    style={{
                      animation: `avatar-brain-glow-ring ${3 + idx * 0.3}s ease-in-out infinite ${delayS}s`,
                      // @ts-expect-error CSS custom property
                      '--ring-r': region.r + 3,
                    }}
                  />
                )}
                {/* Core circle */}
                <circle
                  cx={headCX + region.cx}
                  cy={headCY + region.cy}
                  r={region.r}
                  fill={isLit ? healthColor : 'rgba(255,255,255,0.03)'}
                  opacity={isLit ? 0.25 + intensity * 0.6 : 0.12}
                  style={isLit ? {
                    animation: `avatar-brain-pulse ${2.5 + idx * 0.2}s ease-in-out infinite ${delayS}s`,
                    // @ts-expect-error CSS custom property
                    '--brain-min': 0.25 + intensity * 0.2,
                    '--brain-max': 0.5 + intensity * 0.5,
                  } : undefined}
                />
                {/* Outer ring */}
                {isLit && (
                  <circle
                    cx={headCX + region.cx}
                    cy={headCY + region.cy}
                    r={region.r + 1.5}
                    fill="none"
                    stroke={healthColor}
                    strokeWidth="0.5"
                    opacity={0.2 + intensity * 0.3}
                    style={{
                      animation: `avatar-brain-glow-ring ${3 + idx * 0.3}s ease-in-out infinite ${delayS}s`,
                      // @ts-expect-error CSS custom property
                      '--ring-r': region.r + 1.5,
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* ==================== EYES — BLINK + TRACK ==================== */}
          {/* Left eye group — blinks on its own cycle */}
          <g
            style={{
              transformOrigin: `${headCX - 8}px ${headCY - 2}px`,
              animation: `avatar-eye-blink ${blinkSeed.toFixed(1)}s ease-in-out infinite`,
            }}
          >
            {/* Left eye socket */}
            <ellipse
              cx={headCX - 8}
              cy={headCY - 2}
              rx={3.5}
              ry={2.2}
              fill="none"
              stroke={isProcessing ? '#06b6d4' : 'rgba(255,255,255,0.3)'}
              strokeWidth="0.8"
            />
            {/* Left pupil — tracks left/right */}
            <circle
              cx={headCX - 8}
              cy={headCY - 2}
              r={1.3}
              fill={isProcessing ? '#06b6d4' : isAwake ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'}
              style={{
                animation: isAwake ? `avatar-eye-scan ${isProcessing ? 1.5 : 4}s ease-in-out infinite` : 'none',
              }}
            />
            {/* Left eye inner glow */}
            {isProcessing && (
              <ellipse
                cx={headCX - 8}
                cy={headCY - 2}
                rx={3}
                ry={1.8}
                fill="#06b6d4"
                opacity={0.08}
              />
            )}
          </g>

          {/* Right eye group — slightly offset blink */}
          <g
            style={{
              transformOrigin: `${headCX + 8}px ${headCY - 2}px`,
              animation: `avatar-eye-blink-2 ${(blinkSeed + 0.7).toFixed(1)}s ease-in-out infinite`,
            }}
          >
            {/* Right eye socket */}
            <ellipse
              cx={headCX + 8}
              cy={headCY - 2}
              rx={3.5}
              ry={2.2}
              fill="none"
              stroke={isProcessing ? '#06b6d4' : 'rgba(255,255,255,0.3)'}
              strokeWidth="0.8"
            />
            {/* Right pupil — tracks left/right (offset) */}
            <circle
              cx={headCX + 8}
              cy={headCY - 2}
              r={1.3}
              fill={isProcessing ? '#06b6d4' : isAwake ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'}
              style={{
                animation: isAwake ? `avatar-eye-scan ${isProcessing ? 1.5 : 4}s ease-in-out infinite 0.15s` : 'none',
              }}
            />
            {/* Right eye inner glow */}
            {isProcessing && (
              <ellipse
                cx={headCX + 8}
                cy={headCY - 2}
                rx={3}
                ry={1.8}
                fill="#06b6d4"
                opacity={0.08}
              />
            )}
          </g>

          {/* Eye glow beams when processing */}
          {isProcessing && (
            <>
              <circle cx={headCX - 8} cy={headCY - 2} r={6} fill="#06b6d4" opacity={0.12} filter="url(#brainGlowStrong)">
                <animate attributeName="opacity" values="0.08;0.18;0.08" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={headCX + 8} cy={headCY - 2} r={6} fill="#06b6d4" opacity={0.12} filter="url(#brainGlowStrong)">
                <animate attributeName="opacity" values="0.08;0.18;0.08" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
              </circle>
            </>
          )}

          {/* ==================== CHEST / HEART — REALISTIC BEATING ==================== */}
          <g
            style={{
              transformOrigin: `${bodyCX}px 155px`,
              animation: pulseHealth !== 'offline'
                ? `${pulseHealth === 'failing' ? 'avatar-heartbeat-fast' : 'avatar-heartbeat'} ${heartbeatSpeed}s ease-in-out infinite`
                : 'none',
              // @ts-expect-error CSS custom property
              '--heart-base-opacity': 0.3 + (pulse / 100) * 0.4,
            }}
          >
            {/* Heart ambient glow (large, soft) */}
            <circle
              cx={bodyCX}
              cy={152}
              r={22}
              fill={healthColor}
              opacity={0.04 + (pulse / 100) * 0.06}
              filter="url(#heartGlow)"
            />
            {/* Heart shape — filled with glow */}
            <path
              d={`M ${bodyCX} 165
                  C ${bodyCX - 5} 158, ${bodyCX - 14} 145, ${bodyCX - 14} 150
                  C ${bodyCX - 14} 143, ${bodyCX - 5} 140, ${bodyCX} 148
                  C ${bodyCX + 5} 140, ${bodyCX + 14} 143, ${bodyCX + 14} 150
                  C ${bodyCX + 14} 145, ${bodyCX + 5} 158, ${bodyCX} 165 Z`}
              fill={healthColor}
              opacity={0.3 + (pulse / 100) * 0.5}
              filter="url(#heartGlow)"
            />
            {/* Heart outline */}
            <path
              d={`M ${bodyCX} 165
                  C ${bodyCX - 5} 158, ${bodyCX - 14} 145, ${bodyCX - 14} 150
                  C ${bodyCX - 14} 143, ${bodyCX - 5} 140, ${bodyCX} 148
                  C ${bodyCX + 5} 140, ${bodyCX + 14} 143, ${bodyCX + 14} 150
                  C ${bodyCX + 14} 145, ${bodyCX + 5} 158, ${bodyCX} 165 Z`}
              fill="none"
              stroke={healthColor}
              strokeWidth="0.8"
              opacity={0.6}
            />
            {/* Heart pulse ring — expands outward with each beat */}
            <circle cx={bodyCX} cy={152} r={14} fill="none" stroke={healthColor} strokeWidth="0.6" opacity={0.2}>
              <animate attributeName="r" values="14;26;14" dur={`${heartbeatSpeed}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur={`${heartbeatSpeed}s`} repeatCount="indefinite" />
            </circle>
            {/* Second heart ring (offset) */}
            <circle cx={bodyCX} cy={152} r={14} fill="none" stroke={healthColor} strokeWidth="0.4" opacity={0.15}>
              <animate attributeName="r" values="14;30;14" dur={`${heartbeatSpeed}s`} repeatCount="indefinite" begin={`${heartbeatSpeed * 0.15}s`} />
              <animate attributeName="opacity" values="0.15;0;0.15" dur={`${heartbeatSpeed}s`} repeatCount="indefinite" begin={`${heartbeatSpeed * 0.15}s`} />
            </circle>
          </g>

          {/* ==================== LEFT ARM (ABILITY) ==================== */}
          <path
            d={`M ${bodyCX - 30} 100 Q ${bodyCX - 50} 115, ${bodyCX - 55} 150`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${bodyCX - 55} 150 Q ${bodyCX - 52} 180, ${bodyCX - 45} 210`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${bodyCX - 30} 100 Q ${bodyCX - 50} 115, ${bodyCX - 55} 150 Q ${bodyCX - 52} 180, ${bodyCX - 45} 210`}
            fill="none"
            stroke="url(#leftArmGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#brainGlow)"
          />
          <circle
            cx={bodyCX - 45}
            cy={210}
            r={4}
            fill="#10b981"
            opacity={abilityMeter / 200}
            filter="url(#brainGlow)"
          />

          {/* ==================== RIGHT ARM (ACTION) ==================== */}
          <path
            d={`M ${bodyCX + 30} 100 Q ${bodyCX + 50} 115, ${bodyCX + 55} 150`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${bodyCX + 55} 150 Q ${bodyCX + 52} 180, ${bodyCX + 45} 210`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${bodyCX + 30} 100 Q ${bodyCX + 50} 115, ${bodyCX + 55} 150 Q ${bodyCX + 52} 180, ${bodyCX + 45} 210`}
            fill="none"
            stroke="url(#rightArmGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#brainGlow)"
          />
          <circle
            cx={bodyCX + 45}
            cy={210}
            r={4}
            fill="#06b6d4"
            opacity={actionMeter / 200}
            filter="url(#brainGlow)"
          />

          {/* ==================== LEGS ==================== */}
          <path
            d={`M ${bodyCX - 12} 250 Q ${bodyCX - 18} 300, ${bodyCX - 22} 360 L ${bodyCX - 28} 380`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d={`M ${bodyCX + 12} 250 Q ${bodyCX + 18} 300, ${bodyCX + 22} 360 L ${bodyCX + 28} 380`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <line x1={bodyCX - 28} y1={380} x2={bodyCX - 36} y2={383} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round" />
          <line x1={bodyCX + 28} y1={380} x2={bodyCX + 36} y2={383} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round" />
        </svg>

        {/* ==================== LABELS OVERLAY ==================== */}

        {/* Focus label under eyes */}
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: 78, left: '50%', transform: 'translateX(-50%)', width: 140 }}
        >
          {isProcessing && (
            <span
              className="text-[8px] font-mono uppercase tracking-[0.12em] text-cyan-400 text-center truncate max-w-full"
              style={{ animation: 'avatar-processing 2s ease-in-out infinite' }}
            >
              {currentFocus}
            </span>
          )}
          {!isProcessing && awakeningStatus !== 'sleeping' && (
            <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-zinc-600 text-center">
              IDLE
            </span>
          )}
        </div>

        {/* BPM label at heart */}
        <div
          className="absolute z-20 flex items-center gap-1"
          style={{ top: 185, left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: healthColor }}>
            {bpm}
          </span>
          <span className="text-[7px] font-mono uppercase" style={{ color: healthColor, opacity: 0.6 }}>
            BPM
          </span>
        </div>

        {/* Left arm label (ABILITY) */}
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: 230, left: 12 }}
        >
          <span className="text-[8px] font-mono text-emerald-500/60 uppercase tracking-wider">
            ABL
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
            {abilityMeter}%
          </span>
        </div>

        {/* Right arm label (ACTION) */}
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: 230, right: 12 }}
        >
          <span className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-wider">
            ACT
          </span>
          <span className="text-[10px] font-mono font-bold text-cyan-400 tabular-nums">
            {actionMeter}%
          </span>
        </div>

        {/* Spine / Rail label */}
        <div
          className="absolute z-20 flex items-center gap-1"
          style={{ top: 275, left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider">
            RAIL
          </span>
          <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
            {laneCount}L
          </span>
          <span className="text-[7px] font-mono text-zinc-600">
            &middot;
          </span>
          <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
            {throughput}/s
          </span>
        </div>

        {/* Education score at top of head */}
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ top: -2, left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: educationScore > 50 ? '#10b981' : educationScore > 20 ? '#f59e0b' : '#71717a' }}>
            {educationScore}%
          </span>
          <span className="text-[6px] font-mono uppercase tracking-[0.15em] text-zinc-600">
            EDUCATION
          </span>
        </div>

        {/* Awakening status at bottom */}
        <div className="mt-1 flex flex-col items-center">
          <span
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{
              color: awakeningStatus === 'alive'
                ? '#10b981'
                : awakeningStatus === 'awake'
                  ? '#10b981'
                  : awakeningStatus === 'waking'
                    ? '#f59e0b'
                    : '#3f3f46',
              opacity: awakeningStatus === 'alive' ? 1 : 0.7,
            }}
          >
            {awakeningStatus === 'alive' ? 'FULLY ALIVE' : awakeningStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </>
  );
}
