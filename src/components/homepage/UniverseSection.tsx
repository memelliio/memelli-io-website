'use client';

// NAMING NOTE 2026-04-30: file/component name "UniverseSection" is the legacy
// label for what is now "Command Center" / "cockpit". Display strings + section
// id #universe were kept (active anchor). Component identifier left in place to
// avoid touching every consumer; rename deferred to stage-2 pass. See CLAUDE.md.

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Users,
  ShoppingBag,
  GraduationCap,
  Phone,
  Globe,
  Search,
  Target,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

/* ── Engine data ─────────────────────────────────────── */

const engines = [
  { name: 'CRM', color: 'red', icon: Users, desc: 'Manage contacts, pipelines, and relationships in one place.' },
  { name: 'Commerce', color: 'emerald', icon: ShoppingBag, desc: 'Sell products, services, and subscriptions effortlessly.' },
  { name: 'Coaching', color: 'amber', icon: GraduationCap, desc: 'Deliver courses, programs, and 1-on-1 coaching at scale.' },
  { name: 'Communications', color: 'pink', icon: Phone, desc: 'Call, text, and email from a single unified inbox.' },
  { name: 'Website Builder', color: 'cyan', icon: Globe, desc: 'Launch stunning sites and funnels without code.' },
  { name: 'Forum SEO', color: 'teal', icon: Search, desc: 'Dominate search with community-driven content.' },
  { name: 'Lead Generation', color: 'rose', icon: Target, desc: 'Attract and capture leads on autopilot.' },
  { name: 'Credit / Funding', color: 'orange', icon: CreditCard, desc: 'Access business credit and funding pathways.' },
  { name: 'Approval', color: 'green', icon: CheckCircle, desc: 'Streamline reviews, sign-offs, and compliance.' },
] as const;

/* ── Color maps ──────────────────────────────────────── */

const borderMap: Record<string, string> = {
  red: 'border-red-500',
  emerald: 'border-emerald-500',
  amber: 'border-amber-500',
  pink: 'border-pink-500',
  cyan: 'border-cyan-500',
  teal: 'border-teal-500',
  rose: 'border-rose-500',
  orange: 'border-orange-500',
  green: 'border-green-500',
};

const textMap: Record<string, string> = {
  red: 'text-red-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  pink: 'text-pink-400',
  cyan: 'text-cyan-400',
  teal: 'text-teal-400',
  rose: 'text-rose-400',
  orange: 'text-orange-400',
  green: 'text-green-400',
};

const glowMap: Record<string, string> = {
  red: 'shadow-red-500/20',
  emerald: 'shadow-emerald-500/20',
  amber: 'shadow-amber-500/20',
  pink: 'shadow-pink-500/20',
  cyan: 'shadow-cyan-500/20',
  teal: 'shadow-teal-500/20',
  rose: 'shadow-rose-500/20',
  orange: 'shadow-orange-500/20',
  green: 'shadow-green-500/20',
};

const strokeMap: Record<string, string> = {
  red: '#E11D2E',
  emerald: '#10b981',
  amber: '#f59e0b',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  rose: '#f43f5e',
  orange: '#f97316',
  green: '#22c55e',
};

/* ── Helpers ─────────────────────────────────────────── */

function orbitPosition(index: number, total: number, rx: number, ry: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: Math.cos(angle) * rx,
    y: Math.sin(angle) * ry,
  };
}

/* ── Component ───────────────────────────────────────── */

export default function UniverseSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const orbitRx = 320;
  const orbitRy = 260;
  const viewBoxW = 800;
  const viewBoxH = 680;
  const cx = viewBoxW / 2;
  const cy = viewBoxH / 2;

  return (
    <section
      id="universe"
      ref={ref}
      className="relative bg-[hsl(var(--background))] py-24 overflow-hidden"
    >
      {/* ── Star-field background ────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${1 + Math.random() * 1.5}px`,
              height: `${1 + Math.random() * 1.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Subtle radial gradient behind orbit */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[700px] w-[700px] rounded-full bg-red-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Header ─────────────────────────────────────── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2 className="text-4xl font-bold text-white">The Memelli Command Center</h2>
          <p className="mt-4 max-w-2xl mx-auto text-[hsl(var(--muted-foreground))] text-lg leading-relaxed">
            Not a single tool. A connected operating system for building and running real businesses.
          </p>
        </motion.div>

        {/* ── Desktop orbit ──────────────────────────────── */}
        <motion.div
          className="hidden md:flex justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <svg
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            className="w-full max-w-3xl"
            style={{ overflow: 'visible' }}
          >
            {/* ── Connection lines with animated pulse ────── */}
            {engines.map((engine, i) => {
              const pos = orbitPosition(i, engines.length, orbitRx, orbitRy);
              const strokeColor = strokeMap[engine.color];
              return (
                <g key={`line-${i}`}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + pos.x}
                    y2={cy + pos.y}
                    stroke={strokeColor}
                    strokeOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  {/* Animated pulse traveling along line */}
                  <circle r={3} fill={strokeColor} opacity={0.7}>
                    <animateMotion
                      dur={`${2.5 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${cx},${cy} L${cx + pos.x},${cy + pos.y}`}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.8;0"
                      dur={`${2.5 + i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* ── Center Memelli logo/mark ────────────────── */}
            <g>
              {/* Outer glow */}
              <circle cx={cx} cy={cy} r={52} fill="none" stroke="url(#redGlow)" strokeWidth={2}>
                <animate
                  attributeName="r"
                  values="52;56;52"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.4;0.8;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Inner circle */}
              <circle cx={cx} cy={cy} r={44} fill="#18181b" stroke="#E11D2E" strokeWidth={2.5} />
              {/* "M" mark */}
              <text
                x={cx}
                y={cy + 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                fill="#E84855"
                fontSize={32}
                fontWeight={700}
                fontFamily="sans-serif"
              >
                M
              </text>
            </g>

            {/* Gradient defs */}
            <defs>
              <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E11D2E" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#E11D2E" stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* ── Engine nodes ────────────────────────────── */}
            {engines.map((engine, i) => {
              const pos = orbitPosition(i, engines.length, orbitRx, orbitRy);
              const nodeX = cx + pos.x;
              const nodeY = cy + pos.y;
              const isHovered = hoveredIdx === i;
              const strokeColor = strokeMap[engine.color];

              return (
                <g
                  key={`node-${i}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Card background */}
                  <rect
                    x={nodeX - (isHovered ? 58 : 52)}
                    y={nodeY - (isHovered ? 34 : 30)}
                    width={isHovered ? 116 : 104}
                    height={isHovered ? 68 : 60}
                    rx={12}
                    fill="#18181b"
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 2 : 1.5}
                    opacity={isHovered ? 1 : 0.9}
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 12px ${strokeColor}40)` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {/* Icon placeholder (circle) */}
                  <circle
                    cx={nodeX}
                    cy={nodeY - 6}
                    r={12}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    opacity={0.8}
                  />
                  {/* Icon (using foreignObject for Lucide) */}
                  <foreignObject
                    x={nodeX - 9}
                    y={nodeY - 15}
                    width={18}
                    height={18}
                  >
                    <div
                      style={{ color: strokeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <engine.icon size={16} strokeWidth={2} />
                    </div>
                  </foreignObject>
                  {/* Label */}
                  <text
                    x={nodeX}
                    y={nodeY + 16}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#e4e4e7"
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="sans-serif"
                  >
                    {engine.name}
                  </text>

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <foreignObject
                      x={nodeX - 100}
                      y={nodeY + 40}
                      width={200}
                      height={60}
                    >
                      <div className="rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2 text-center shadow-xl">
                        <p className="text-xs text-[hsl(var(--foreground))] leading-tight">{engine.desc}</p>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* ── Mobile 3x3 grid ────────────────────────────── */}
        <div className="md:hidden grid grid-cols-3 gap-3">
          {engines.map((engine, i) => {
            const Icon = engine.icon;
            return (
              <motion.div
                key={engine.name}
                className={`rounded-xl border ${borderMap[engine.color]} bg-[hsl(var(--card))] p-3 text-center shadow-lg ${glowMap[engine.color]}`}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
              >
                <Icon className={`mx-auto mb-1.5 ${textMap[engine.color]}`} size={22} strokeWidth={2} />
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-tight">{engine.name}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Reinforcement text ─────────────────────────── */}
        <motion.p
          className="mt-14 text-center text-[hsl(var(--muted-foreground))] text-base max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Every engine connects. Every workflow is agent-operated. One platform, infinite leverage.
        </motion.p>

        {/* ── CTA ────────────────────────────────────────── */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <button className="inline-flex items-center gap-2 rounded-full border border-red-500/50 px-7 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:border-red-400">
            See How the Command Center Works
          </button>
        </motion.div>
      </div>
    </section>
  );
}
