'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  X,
  AlertTriangle,
  FileQuestion,
  Ban,
  CheckCircle,
  Shield,
  Brain,
  Rocket,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface CardData {
  icon: ReactNode;
  title: string;
  description: string;
}

const problems: CardData[] = [
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
    title: 'Unknown Credit Issues',
    description:
      'Hidden derogatories and errors silently tank your approval odds.',
  },
  {
    icon: <X className="h-5 w-5 text-orange-400" />,
    title: 'Lender Requirement Gaps',
    description:
      'Every lender has different thresholds you can\'t see until it\'s too late.',
  },
  {
    icon: <FileQuestion className="h-5 w-5 text-red-400" />,
    title: 'No Clear Next Steps',
    description:
      'Generic advice wastes months when you need a specific action plan.',
  },
  {
    icon: <Ban className="h-5 w-5 text-orange-400" />,
    title: 'Wasted Applications',
    description:
      'Each denial adds a hard inquiry that makes the next one even harder.',
  },
];

const solutions: CardData[] = [
  {
    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    title: 'Complete Credit Analysis',
    description:
      'We surface every factor affecting your fundability in minutes.',
  },
  {
    icon: <Shield className="h-5 w-5 text-green-400" />,
    title: 'Lender Matching Intelligence',
    description:
      'AI maps your profile against real lender criteria before you apply.',
  },
  {
    icon: <Brain className="h-5 w-5 text-green-400" />,
    title: 'AI-Guided Action Plan',
    description:
      'Step-by-step fixes ranked by impact so you improve the fastest.',
  },
  {
    icon: <Rocket className="h-5 w-5 text-green-400" />,
    title: 'Apply Only When Ready',
    description:
      'Submit applications only when approval probability is highest.',
  },
];

function AnimatedCard({
  card,
  index,
  side,
  borderColor,
}: {
  card: CardData;
  index: number;
  side: 'left' | 'right';
  borderColor: string;
}) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, x: side === 'left' ? -20 : 20 }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className={`relative rounded-xl bg-[hsl(var(--card))] backdrop-blur-sm p-5 border border-[hsl(var(--border))] ${borderColor}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">{card.icon}</div>
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

function ConnectorLine({ index }: { index: number }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={inView ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.12 }}
      className="hidden lg:flex items-center justify-center"
    >
      <div className="flex items-center gap-1">
        <div className="h-px w-6 bg-gradient-to-r from-red-500/40 to-transparent" />
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="none"
          className="text-[hsl(var(--muted-foreground))]"
        >
          <path
            d="M0 6h12M10 1l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="h-px w-6 bg-gradient-to-r from-transparent to-green-500/40" />
      </div>
    </motion.div>
  );
}

export default function WhyFundingSection() {
  const [headerRef, headerInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [ctaRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="relative bg-[hsl(var(--background))] py-24 overflow-hidden">
      {/* Subtle gradient shift */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-900/30" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Why Funding Comes First
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Most people don&apos;t get funded because they don&apos;t know
            what&apos;s blocking them. We fix that before you ever fill out an
            application.
          </p>
        </motion.div>

        {/* Problem / Solution Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* Left — Problems */}
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={headerInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="mb-5 inline-block text-xs font-semibold uppercase tracking-widest text-red-400"
            >
              The Problem
            </motion.span>
            <div className="flex flex-col gap-4">
              {problems.map((card, i) => (
                <AnimatedCard
                  key={card.title}
                  card={card}
                  index={i}
                  side="left"
                  borderColor="border-l-2 border-l-red-500/50"
                />
              ))}
            </div>
          </div>

          {/* Connector arrows (visible on lg+) */}
          <div className="hidden lg:flex flex-col justify-around py-10">
            {problems.map((_, i) => (
              <ConnectorLine key={i} index={i} />
            ))}
          </div>

          {/* Right — Solutions */}
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={headerInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="mb-5 inline-block text-xs font-semibold uppercase tracking-widest text-green-400"
            >
              The Memelli Way
            </motion.span>
            <div className="flex flex-col gap-4">
              {solutions.map((card, i) => (
                <AnimatedCard
                  key={card.title}
                  card={card}
                  index={i}
                  side="right"
                  borderColor="border-l-2 border-l-green-500/50"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 flex justify-center"
        >
          <button
            type="button"
            className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Start Free Prequalification
          </button>
        </motion.div>
      </div>
    </section>
  );
}
