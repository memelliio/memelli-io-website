'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Search,
  FileText,
  MessageSquare,
  Globe,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Pipeline node data                                                 */
/* ------------------------------------------------------------------ */

const pipelineNodes = [
  {
    title: 'Question Discovery',
    icon: Search,
    description: 'AI finds trending questions daily',
  },
  {
    title: 'Thread Generation',
    icon: FileText,
    description: 'Creates authoritative forum threads',
  },
  {
    title: 'Discussion Expansion',
    icon: MessageSquare,
    description: 'AI adds depth and follow-ups',
  },
  {
    title: 'Search Indexing',
    icon: Globe,
    description: 'Signals search engines automatically',
  },
  {
    title: 'Traffic Capture',
    icon: TrendingUp,
    description: 'Visitors find your content',
  },
  {
    title: 'Lead Conversion',
    icon: Target,
    description: 'Traffic converts through your CRM',
  },
];

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  suffix,
  label,
  inView,
}: {
  value: number;
  suffix: string;
  label: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const duration = 1600;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [inView, value]);

  return (
    <div className="text-center">
      <span className="text-3xl font-bold text-white">
        {count.toLocaleString()}
        {suffix}
      </span>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flowing dot on connector line                                      */
/* ------------------------------------------------------------------ */

function FlowingDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"
      initial={{ left: '0%', opacity: 0 }}
      animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: 'linear',
      }}
    />
  );
}

function FlowingDotVertical({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"
      initial={{ top: '0%', opacity: 0 }}
      animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: 'linear',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline node card                                                 */
/* ------------------------------------------------------------------ */

function PipelineNode({
  node,
  index,
  inView,
}: {
  node: (typeof pipelineNodes)[number];
  index: number;
  inView: boolean;
}) {
  const Icon = node.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className="relative flex flex-col items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 backdrop-blur-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/15">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>
      <h3 className="text-sm font-semibold text-white">{node.title}</h3>
      <p className="text-center text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        {node.description}
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                       */
/* ------------------------------------------------------------------ */

export default function TrafficEngineSection() {
  const { ref: headerRef, inView: headerInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const { ref: pipelineRef, inView: pipelineInView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))] py-24">
      {/* Subtle horizontal gradient bands */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[20%] h-px bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent" />
        <div className="absolute inset-x-0 top-[40%] h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent" />
        <div className="absolute inset-x-0 top-[60%] h-px bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent" />
        <div className="absolute inset-x-0 top-[80%] h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-white">
            Traffic That Runs Itself
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            Forum SEO, daily question discovery, automated thread generation,
            and search engine indexing&nbsp;&mdash; all running in the
            background.
          </p>
        </motion.div>

        {/* Pipeline flow — horizontal on desktop, vertical on mobile */}
        <div ref={pipelineRef}>
          {/* Desktop: horizontal */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-6 gap-0">
              {pipelineNodes.map((node, i) => (
                <div key={node.title} className="relative flex flex-col items-center">
                  <PipelineNode
                    node={node}
                    index={i}
                    inView={pipelineInView}
                  />
                  {/* Horizontal connector */}
                  {i < pipelineNodes.length - 1 && (
                    <div className="absolute right-0 top-1/2 z-10 h-0.5 w-full -translate-y-1/2 translate-x-1/2">
                      <div className="relative h-full w-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-500/30" />
                        <FlowingDot delay={i * 0.5} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile / Tablet: vertical */}
          <div className="flex flex-col items-center gap-0 lg:hidden">
            {pipelineNodes.map((node, i) => (
              <div key={node.title} className="relative w-full max-w-xs">
                <PipelineNode
                  node={node}
                  index={i}
                  inView={pipelineInView}
                />
                {/* Vertical connector */}
                {i < pipelineNodes.length - 1 && (
                  <div className="mx-auto h-8 w-0.5">
                    <div className="relative h-full w-full">
                      <div className="absolute inset-0 bg-blue-500/30" />
                      <FlowingDotVertical delay={i * 0.5} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-8 backdrop-blur-md sm:grid-cols-3"
        >
          <AnimatedCounter
            value={1000}
            suffix="+"
            label="Questions discovered daily"
            inView={statsInView}
          />
          <AnimatedCounter
            value={50}
            suffix="+"
            label="Threads generated per week"
            inView={statsInView}
          />
          <AnimatedCounter
            value={24}
            suffix="/7"
            label="Indexing signals sent"
            inView={statsInView}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="mt-10 text-center"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-transparent px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-blue-500/60 hover:bg-blue-500/10 hover:shadow-[0_0_20px_-4px_rgba(239,68,68,0.3)]"
          >
            See the Traffic System
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
