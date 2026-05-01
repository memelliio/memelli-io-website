'use client';

import { motion } from 'framer-motion';

/* ─── Types ─── */

interface AiThinkingLogoProps {
  thinking: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

/* ─── Memelli "M" Mark SVG ─── */

function MemelliMark({ size }: { size: number }) {
  // Clean geometric M — proportional to viewBox 0 0 48 48
  return (
    <path
      d="M8 38V14l10 14 6-14 6 14 10-14v24"
      fill="none"
      stroke="currentColor"
      strokeWidth={size <= 24 ? 4 : 3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/* ─── Component ─── */

export default function AiThinkingLogo({
  thinking,
  size = 'md',
  className,
}: AiThinkingLogoProps) {
  const px = SIZES[size];
  const center = 24; // half of viewBox 48
  const orbitRadius = 20;

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glow layer — only visible when thinking */}
      <motion.div
        animate={
          thinking
            ? { opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }
            : { opacity: 0, scale: 1 }
        }
        transition={
          thinking
            ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Orbital ring — rotating when thinking */}
        <motion.circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="url(#orbital-gradient)"
          strokeWidth={1.5}
          strokeDasharray="8 52"
          strokeLinecap="round"
          animate={
            thinking
              ? { rotate: 360, opacity: 1 }
              : { rotate: 0, opacity: 0 }
          }
          transition={
            thinking
              ? {
                  rotate: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: { duration: 0.4 },
                }
              : { opacity: { duration: 0.3 } }
          }
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Second orbital ring — counter-rotating */}
        <motion.circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="url(#orbital-gradient)"
          strokeWidth={1}
          strokeDasharray="4 58"
          strokeLinecap="round"
          animate={
            thinking
              ? { rotate: -360, opacity: 0.6 }
              : { rotate: 0, opacity: 0 }
          }
          transition={
            thinking
              ? {
                  rotate: {
                    duration: 4.5,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: { duration: 0.4 },
                }
              : { opacity: { duration: 0.3 } }
          }
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* The M mark — pulses subtly when thinking */}
        <motion.g
          animate={
            thinking
              ? { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            thinking
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          style={{
            transformOrigin: `${center}px ${center}px`,
            color: 'white',
          }}
        >
          <MemelliMark size={px} />
        </motion.g>

        {/* Gradient definitions */}
        <defs>
          <linearGradient
            id="orbital-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
