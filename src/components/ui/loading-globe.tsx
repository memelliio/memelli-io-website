'use client';

/**
 * LoadingGlobe — Replaces spinning circles with the Memelli red gradient sphere.
 *
 * Sizes:
 *   sm   = 24px  (inline loading)
 *   md   = 32px  (inline loading, default)
 *   lg   = 48px  (page / section loading)
 *   xl   = 64px  (full-page loading)
 */

import { type CSSProperties } from 'react';

export type GlobeSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<GlobeSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

interface LoadingGlobeProps {
  size?: GlobeSize;
  /** Optional extra className on the wrapper */
  className?: string;
  /** Override pixel size directly */
  px?: number;
}

export function LoadingGlobe({ size = 'md', className = '', px }: LoadingGlobeProps) {
  const dim = px ?? SIZE_MAP[size];
  const coreDim = Math.round(dim * 0.7);

  const wrapperStyle: CSSProperties = {
    width: dim,
    height: dim,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const glowStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(225,29,46,0.3) 0%, transparent 70%)',
    animation: 'loading-globe-pulse 1.8s ease-in-out infinite',
  };

  const coreStyle: CSSProperties = {
    width: coreDim,
    height: coreDim,
    borderRadius: '50%',
    background: `
      radial-gradient(circle at 35% 35%, rgba(240,112,128,0.6) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(225,29,46,0.9) 0%, rgba(215,38,56,1) 60%, rgba(120,15,25,1) 100%)
    `,
    boxShadow: '0 0 12px rgba(225,29,46,0.4), 0 0 24px rgba(225,29,46,0.15)',
    animation: 'loading-globe-spin 3s linear infinite, loading-globe-breathe 1.8s ease-in-out infinite',
    position: 'relative',
  };

  return (
    <span className={className} style={wrapperStyle} role="status" aria-label="Loading">
      <span style={glowStyle} />
      <span style={coreStyle} />
      <style>{`
        @keyframes loading-globe-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes loading-globe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loading-globe-breathe {
          0%, 100% { box-shadow: 0 0 8px rgba(225,29,46,0.3), 0 0 16px rgba(225,29,46,0.1); }
          50% { box-shadow: 0 0 16px rgba(225,29,46,0.5), 0 0 32px rgba(225,29,46,0.2); }
        }
      `}</style>
    </span>
  );
}

/**
 * Full-page loading overlay — centered globe with optional message.
 */
export function PageLoadingGlobe({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-4">
      <LoadingGlobe size="lg" />
      {message && (
        <p className="text-sm text-zinc-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}
