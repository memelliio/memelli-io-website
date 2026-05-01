'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import dynamic from 'next/dynamic';
import type { SphereState } from './sphere-3d';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Lazy-loaded renderers                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const Sphere3D = dynamic(() => import('./sphere-3d'), {
  ssr: false,
  loading: () => <OrbFallbackShimmer />,
});

const MUAOrb = dynamic(() => import('./mua-orb'), {
  ssr: false,
  loading: () => <OrbFallbackShimmer />,
});

function OrbFallbackShimmer() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-16 h-16 rounded-full bg-red-900/40 animate-pulse" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  WebGL detection                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State color map (matches sphere-3d brand colors)                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATE_COLORS: Record<SphereState, string> = {
  idle: '#D72638',
  listening: '#E84855',
  thinking: '#F07080',
  speaking: '#D72638',
  dispatching: '#E84855',
  error: '#B71E2E',
};

const STATE_LABELS: Record<SphereState, string> = {
  idle: 'IDLE',
  listening: 'LISTENING',
  thinking: 'THINKING',
  speaking: 'SPEAKING',
  dispatching: 'DISPATCHING',
  error: 'ERROR',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SIZE_COLLAPSED = 280;
const SIZE_EXPANDED = 400;
const SIZE_MINIMIZED = 60;
const MARGIN = 16;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Props                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PersonaWindowProps {
  state?: SphereState;
  audioAmplitude?: number;
  onSphereClick?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PersonaWindow({
  state = 'idle',
  audioAmplitude = 0,
  onSphereClick,
}: PersonaWindowProps) {
  /* ── State ─────────────────────────────────────────────────────────────── */
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mounted, setMounted] = useState(false);

  /* ── Refs ──────────────────────────────────────────────────────────────── */
  const dragRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const size = minimized
    ? SIZE_MINIMIZED
    : expanded
      ? SIZE_EXPANDED
      : SIZE_COLLAPSED;

  const color = STATE_COLORS[state];

  /* ── Init position + WebGL detection ───────────────────────────────────── */
  useEffect(() => {
    setHasWebGL(detectWebGL());
    setPosition({
      x: window.innerWidth - SIZE_COLLAPSED - MARGIN,
      y: window.innerHeight - SIZE_COLLAPSED - MARGIN - 40,
    });
    setMounted(true);
  }, []);

  /* ── Keep window in-bounds on resize ───────────────────────────────────── */
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - size - MARGIN),
        y: Math.min(prev.y, window.innerHeight - size - MARGIN),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [size]);

  /* ── Drag handlers (mouse) ─────────────────────────────────────────────── */
  const onDragStart = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      dragRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      posStartRef.current = { ...position };
    },
    [position],
  );

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: Math.max(0, Math.min(posStartRef.current.x + dx, window.innerWidth - size)),
        y: Math.max(0, Math.min(posStartRef.current.y + dy, window.innerHeight - size)),
      });
    };
    const onUp = () => {
      dragRef.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [size]);

  /* ── Drag handlers (touch) ─────────────────────────────────────────────── */
  const onTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      dragRef.current = true;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      posStartRef.current = { ...position };
    },
    [position],
  );

  useEffect(() => {
    const onTouchMove = (e: globalThis.TouchEvent) => {
      if (!dragRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setPosition({
        x: Math.max(0, Math.min(posStartRef.current.x + dx, window.innerWidth - size)),
        y: Math.max(0, Math.min(posStartRef.current.y + dy, window.innerHeight - size)),
      });
    };
    const onTouchEnd = () => {
      dragRef.current = false;
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [size]);

  /* ── Toggle handlers ───────────────────────────────────────────────────── */
  const handleExpandToggle = useCallback(() => {
    if (minimized) {
      setMinimized(false);
      return;
    }
    setExpanded((prev) => !prev);
  }, [minimized]);

  const handleMinimize = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    setMinimized((prev) => !prev);
    setExpanded(false);
  }, []);

  /* ── Don't render until client mount ───────────────────────────────────── */
  if (!mounted) return null;

  /* ── Minimized state: small pulsing dot ────────────────────────────────── */
  if (minimized) {
    return (
      <div
        ref={windowRef}
        className="fixed z-50 cursor-pointer select-none"
        style={{
          left: position.x,
          top: position.y,
          width: SIZE_MINIMIZED,
          height: SIZE_MINIMIZED,
          transition: 'width 300ms ease, height 300ms ease, left 300ms ease, top 300ms ease',
        }}
        onClick={handleExpandToggle}
        role="button"
        tabIndex={0}
        aria-label="Expand Memelli persona"
      >
        <div
          className="relative w-full h-full rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
          }}
        >
          {/* Pulsing dot */}
          <div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}80`,
              animation: 'persona-pulse 2s ease-in-out infinite',
            }}
          />
          {/* Outer pulse ring */}
          <div
            className="absolute rounded-full border-2"
            style={{
              width: 36,
              height: 36,
              borderColor: color,
              opacity: 0.3,
              animation: 'persona-ring-expand 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Drag handle (top sliver) */}
        <div
          className="absolute top-0 left-0 w-full h-3 cursor-grab active:cursor-grabbing"
          onMouseDown={onDragStart}
          onTouchStart={onTouchStart}
        />

        <style jsx>{`
          @keyframes persona-pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.3); opacity: 1; }
          }
          @keyframes persona-ring-expand {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  /* ── Full / Expanded state ─────────────────────────────────────────────── */
  const sphereSize = expanded ? SIZE_EXPANDED - 80 : SIZE_COLLAPSED - 60;

  return (
    <div
      ref={windowRef}
      className="fixed z-50 select-none"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size + 40, // extra for label below
        transition: 'width 300ms ease, height 300ms ease',
      }}
    >
      {/* Window container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-black/60 backdrop-blur-xl border border-white/[0.06]"
        style={{
          height: size,
          boxShadow: `0 0 30px ${color}20, 0 8px 32px rgba(0,0,0,0.6)`,
          transition: 'height 300ms ease, box-shadow 300ms ease',
        }}
      >
        {/* ── Drag handle bar ──────────────────────────────────────────── */}
        <div
          className="absolute top-0 left-0 w-full h-7 z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={onDragStart}
          onTouchStart={onTouchStart}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Minimize button ──────────────────────────────────────────── */}
        <button
          className="absolute top-1.5 right-2 z-20 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={handleMinimize}
          aria-label="Minimize persona"
        >
          <div className="w-2 h-0.5 rounded-full bg-white/60" />
        </button>

        {/* ── Sphere / Orb ─────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center w-full cursor-pointer"
          style={{
            height: size,
            paddingTop: 24,
            transition: 'height 300ms ease',
          }}
          onClick={() => {
            if (onSphereClick) {
              onSphereClick();
            } else {
              handleExpandToggle();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Memelli AI Persona"
        >
          <Suspense fallback={<OrbFallbackShimmer />}>
            {hasWebGL ? (
              <Sphere3D
                state={state}
                size={sphereSize}
                audioAmplitude={audioAmplitude}
              />
            ) : (
              <MUAOrb
                state={state}
                size={sphereSize}
              />
            )}
          </Suspense>
        </div>

        {/* ── Subtle inner glow at bottom ──────────────────────────────── */}
        <div
          className="absolute bottom-0 left-0 w-full h-16 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${color}15, transparent)`,
          }}
        />
      </div>

      {/* ── State label below window ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            animation:
              state !== 'idle'
                ? 'persona-label-pulse 1.5s ease-in-out infinite'
                : 'none',
          }}
        />
        <span
          className="text-[10px] font-mono uppercase tracking-[0.2em]"
          style={{
            color: state === 'error' ? '#ef4444' : 'rgba(255,255,255,0.5)',
          }}
        >
          {STATE_LABELS[state]}
        </span>
      </div>

      <style jsx>{`
        @keyframes persona-label-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
