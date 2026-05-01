'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  ShieldCheck,
  Banknote,
  GraduationCap,
  Store,
  BarChart3,
  Phone,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface PathCard {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
  borderColor: string;
  glowColor: string;
}

const paths: PathCard[] = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Credit Repair',
    description: 'Fix what\u2019s blocking approvals',
    accent: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/10',
  },
  {
    icon: <Banknote className="h-6 w-6" />,
    title: 'Funding Programs',
    description: 'Access matched capital sources',
    accent: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/10',
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Business Coaching',
    description: 'Structured programs to build fundable businesses',
    accent: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/10',
  },
  {
    icon: <Store className="h-6 w-6" />,
    title: 'Business Setup',
    description: 'Deploy sites, stores, and operations',
    accent: 'text-teal-400',
    borderColor: 'border-teal-500/40',
    glowColor: 'shadow-teal-500/10',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Traffic Systems',
    description: 'Generate leads and search visibility',
    accent: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/10',
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: 'Communications',
    description: 'Professional phone, SMS, and support',
    accent: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    glowColor: 'shadow-indigo-500/10',
  },
];

/* Grid positions for SVG flow lines — maps each card index to an (x, y) target */
const cardPositions = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
];

function FlowLines({ inView }: { inView: boolean }) {
  /*
   * SVG viewBox covers the region between the analysis node and the grid.
   * We draw 6 curved paths from a center origin to approximate card positions.
   */
  const originX = 300;
  const originY = 0;

  const targets = [
    { x: 60, y: 120 },
    { x: 300, y: 110 },
    { x: 540, y: 120 },
    { x: 60, y: 220 },
    { x: 300, y: 210 },
    { x: 540, y: 220 },
  ];

  return (
    <svg
      viewBox="0 0 600 240"
      className="mx-auto mb-2 hidden w-full max-w-4xl lg:block"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      {targets.map((t, i) => {
        const midY = originY + (t.y - originY) * 0.5;
        const d = `M${originX},${originY} C${originX},${midY} ${t.x},${midY} ${t.x},${t.y}`;
        return (
          <motion.path
            key={i}
            d={d}
            stroke="url(#line-gradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{
              duration: 0.8,
              delay: 0.3 + i * 0.1,
              ease: 'easeOut',
            }}
          />
        );
      })}
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(168 85 247 / 0.5)" />
          <stop offset="100%" stopColor="rgb(168 85 247 / 0.15)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PathCardItem({ card, index }: { card: PathCard; index: number }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className={`relative rounded-xl bg-[hsl(var(--card))] backdrop-blur-sm p-5 border ${card.borderColor} shadow-lg ${card.glowColor}`}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 shrink-0 ${card.accent}`}>{card.icon}</div>
        <div>
          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{card.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {card.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AfterPrequalSection() {
  const [headerRef, headerInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [flowRef, flowInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [bottomRef, bottomInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="relative bg-[hsl(var(--background))] py-24 overflow-hidden">
      {/* Radial center glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-blue-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Your Path After Analysis
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Once you know where you stand, Memelli routes you into the right
            program.
          </p>
        </motion.div>

        {/* Top Node — Prequalification Complete */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={headerInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-6 w-fit"
        >
          <div className="relative rounded-xl border border-blue-500/40 bg-[hsl(var(--card))] px-8 py-4 text-center shadow-lg shadow-blue-500/20">
            <div className="absolute -inset-px rounded-xl bg-blue-500/5 blur-sm" />
            <span className="relative text-sm font-semibold text-blue-300">
              Prequalification Complete
            </span>
          </div>
        </motion.div>

        {/* Arrow down */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={headerInView ? { opacity: 1, scaleY: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
          className="mx-auto mb-6 flex origin-top justify-center"
        >
          <div className="h-10 w-px bg-gradient-to-b from-blue-500/50 to-blue-500/10" />
        </motion.div>

        {/* Middle Node — AI Analyzes Your Profile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={headerInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mb-4 w-fit"
        >
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-4 text-center">
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
              AI Analyzes Your Profile
            </span>
          </div>
        </motion.div>

        {/* SVG Flow Lines (desktop) */}
        <div ref={flowRef}>
          <FlowLines inView={flowInView} />
        </div>

        {/* Mobile arrow */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={flowInView ? { opacity: 1, scaleY: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mx-auto mb-6 flex origin-top justify-center lg:hidden"
        >
          <div className="h-10 w-px bg-gradient-to-b from-blue-500/50 to-blue-500/10" />
        </motion.div>

        {/* 3x2 Path Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((card, i) => (
            <PathCardItem key={card.title} card={card} index={i} />
          ))}
        </div>

        {/* Bottom Text */}
        <motion.p
          ref={bottomRef}
          initial={{ opacity: 0, y: 16 }}
          animate={bottomInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 text-center text-sm text-[hsl(var(--muted-foreground))]"
        >
          Every path is powered by AI agents working in the background.
        </motion.p>
      </div>
    </section>
  );
}
