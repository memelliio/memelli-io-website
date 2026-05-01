'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { SphereState } from './sphere-animated';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Universal Globe — THE single globe component for all contexts            */
/*                                                                           */
/*  Three states:                                                            */
/*    SLEEP  — standby, reduced intensity (maps to SphereAnimated 'idle')    */
/*    IDLE   — ready, moderate energy (maps to SphereAnimated 'listening')   */
/*    LIVE   — active, full intensity (maps to SphereAnimated 'speaking')    */
/*                                                                           */
/*  Used by: homepage, floating widget, MUA panel, loading states            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type GlobeState = 'sleep' | 'idle' | 'live';

export interface UniversalGlobeProps {
  size: number;
  state: GlobeState;
  className?: string;
  onClick?: () => void;
  audioAmplitude?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Mapping                                                            */
/*                                                                           */
/*  SphereAnimated internally maps its SphereState to 3 intensity tiers:     */
/*    'idle'        -> SLEEP_CFG (25% intensity)                             */
/*    'listening'   -> IDLE_CFG  (60% intensity)                             */
/*    'thinking'    -> LIVE_CFG  (120% intensity)                            */
/*    'speaking'    -> LIVE_SPEAK_CFG (120% with pulse emphasis)             */
/*    'dispatching' -> LIVE_MAX_CFG (max intensity)                          */
/*                                                                           */
/*  We map GlobeState to SphereState to leverage these tiers:                */
/*    sleep -> 'idle'      (SLEEP_CFG — reduced intensity)                   */
/*    idle  -> 'listening' (IDLE_CFG — moderate energy)                      */
/*    live  -> 'speaking'  (LIVE_SPEAK_CFG — active, outward pulse)          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function mapGlobeToSphereState(globeState: GlobeState): SphereState {
  switch (globeState) {
    case 'sleep':
      return 'idle';
    case 'idle':
      return 'listening';
    case 'live':
      return 'speaking';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CSS Fallback Globe — renders when WebGL is unavailable                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CSSFallbackGlobe({
  size,
  state,
  className,
  onClick,
}: {
  size: number;
  state: GlobeState;
  className?: string;
  onClick?: () => void;
}) {
  const intensity = state === 'live' ? 1.0 : state === 'idle' ? 0.6 : 0.25;
  const pulseSpeed = state === 'live' ? '1.5s' : state === 'idle' ? '2.5s' : '4s';
  const ringSpeed1 = state === 'live' ? '8s' : state === 'idle' ? '15s' : '25s';
  const ringSpeed2 = state === 'live' ? '12s' : state === 'idle' ? '20s' : '35s';
  const ringSpeed3 = state === 'live' ? '18s' : state === 'idle' ? '28s' : '40s';

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${className ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli AI Globe"
    >
      {/* Outer glow aura */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          background: `radial-gradient(circle, rgba(225,29,46,${0.12 * intensity}) 0%, transparent 70%)`,
          animation: `cssFallbackPulse ${pulseSpeed} ease-in-out infinite`,
        }}
      />

      {/* Core orb with animated gradient */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: `radial-gradient(circle at 35% 35%, rgba(225,29,46,${0.9 * intensity}) 0%, rgba(225,29,46,${0.6 * intensity}) 30%, rgba(139,16,32,${0.8 * intensity}) 60%, rgba(5,5,7,${0.9 * intensity}) 100%)`,
          boxShadow: `0 0 ${size * 0.3 * intensity}px rgba(225,29,46,${0.4 * intensity}), 0 0 ${size * 0.6 * intensity}px rgba(225,29,46,${0.15 * intensity}), inset 0 0 ${size * 0.15}px rgba(255,180,180,${0.15 * intensity})`,
          animation: `cssFallbackPulse ${pulseSpeed} ease-in-out infinite`,
        }}
      />

      {/* Inner highlight shimmer */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          top: `${size * 0.18}px`,
          left: `${size * 0.22}px`,
          background: `radial-gradient(circle, rgba(255,200,200,${0.2 * intensity}) 0%, transparent 70%)`,
          animation: `cssFallbackShimmer 3s ease-in-out infinite`,
        }}
      />

      {/* Primary orbital ring — tilted */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          border: `1.5px solid rgba(225,29,46,${0.25 * intensity})`,
          animation: `spin ${ringSpeed1} linear infinite`,
          transform: 'rotateX(60deg)',
        }}
      />

      {/* Secondary ring — counter-rotating, different tilt */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.88,
          height: size * 0.88,
          border: `1px solid rgba(225,29,46,${0.15 * intensity})`,
          animation: `spin ${ringSpeed2} linear infinite reverse`,
          transform: 'rotateX(75deg) rotateY(20deg)',
        }}
      />

      {/* Outer ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.05,
          height: size * 1.05,
          border: `1px solid rgba(225,29,46,${0.08 * intensity})`,
          animation: `spin ${ringSpeed3} linear infinite`,
        }}
      />

      {/* Orbit dot — a small dot traveling along the primary ring */}
      <div
        className="absolute"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          left: `${(size - size * 0.92) / 2}px`,
          top: `${(size - size * 0.92) / 2}px`,
          animation: `spin ${ringSpeed1} linear infinite`,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            top: -2,
            left: '50%',
            marginLeft: -2,
            background: `rgba(225,29,46,${0.7 * intensity})`,
            boxShadow: `0 0 6px rgba(225,29,46,${0.5 * intensity})`,
          }}
        />
      </div>

      <style>{`
        @keyframes cssFallbackPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes cssFallbackShimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Error Boundary — catches WebGL crashes and renders CSS fallback          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface EBProps {
  children: ReactNode;
  fallback: ReactNode;
}
interface EBState {
  hasError: boolean;
}

class GlobeErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Dynamic import — SSR disabled                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SphereAnimated = dynamic(() => import('./sphere-animated'), {
  ssr: false,
  loading: () => (
    <div className="relative flex items-center justify-center w-full h-full">
      <div
        className="absolute rounded-full"
        style={{
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle at 35% 35%, #E11D2E 0%, #8B1020 60%, #050507 100%)',
          boxShadow: '0 0 40px rgba(225,29,46,0.3), 0 0 80px rgba(225,29,46,0.1)',
          animation: 'globeLoaderPulse 2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full animate-spin"
        style={{
          width: '80%',
          height: '80%',
          border: '1.5px solid rgba(225,29,46,0.2)',
          borderTopColor: 'rgba(225,29,46,0.5)',
          animationDuration: '3s',
        }}
      />
      <style>{`
        @keyframes globeLoaderPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UniversalGlobe                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UniversalGlobe({
  size,
  state,
  className,
  onClick,
  audioAmplitude = 0,
}: UniversalGlobeProps) {
  const [webglAvailable, setWebglAvailable] = useState(true);

  // Detect WebGL support on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglAvailable(false);
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  const sphereState = mapGlobeToSphereState(state);

  const fallback = (
    <CSSFallbackGlobe
      size={size}
      state={state}
      className={className}
      onClick={onClick}
    />
  );

  if (!webglAvailable) {
    return fallback;
  }

  return (
    <div className={className}>
      <GlobeErrorBoundary fallback={fallback}>
        <SphereAnimated
          state={sphereState}
          size={size}
          audioAmplitude={audioAmplitude}
          onClick={onClick}
        />
      </GlobeErrorBoundary>
    </div>
  );
}

export default UniversalGlobe;
