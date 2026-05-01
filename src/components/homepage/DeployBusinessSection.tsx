'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Layers,
  LayoutTemplate,
  Share2,
  Zap,
} from 'lucide-react';

const benefits = [
  {
    icon: Layers,
    title: 'One Business or Fifty',
    description:
      'Deploy sites for one venture or scale across multiple businesses from a single dashboard.',
  },
  {
    icon: LayoutTemplate,
    title: 'Templates for Real Industries',
    description:
      'Credit repair, coaching, e-commerce, consulting, local services — built for actual verticals.',
  },
  {
    icon: Share2,
    title: 'Shared Infrastructure',
    description:
      'All sites powered by the same CRM, comms, and AI workforce. No duplicate tooling.',
  },
  {
    icon: Zap,
    title: 'Launch in Minutes',
    description:
      'AI generates your site, configures systems, and starts traffic automatically.',
  },
];

const siteCards = [
  {
    name: 'Atlanta Credit Repair',
    domain: 'creditrepairatlanta.com',
    status: 'Active',
    accent: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500/30',
    dot: 'bg-emerald-400',
  },
  {
    name: 'Funding Solutions Pro',
    domain: 'fundingsolutionspro.com',
    status: 'Active',
    accent: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500/30',
    dot: 'bg-emerald-400',
  },
  {
    name: 'Business Coach Hub',
    domain: 'businesscoachhub.com',
    status: 'Building',
    accent: 'from-amber-500/20 to-amber-900/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    building: true,
  },
];

export default function DeployBusinessSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative bg-[hsl(var(--background))] py-24 overflow-hidden"
    >
      {/* Subtle gradient from bottom */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-white">
            Deploy Real Businesses
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            Not just pages. Full business operations with traffic, leads,
            communications, and AI workforce built in.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* LEFT — Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-8"
          >
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.25 + i * 0.1 }}
                  className="flex gap-4 border-l-2 border-blue-500/40 pl-5"
                >
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {b.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {b.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* RIGHT — Deployment dashboard visual */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md space-y-[-2rem]">
              {siteCards.map((card, i) => (
                <motion.div
                  key={card.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
                  className="relative"
                  style={{
                    marginLeft: `${i * 12}px`,
                    zIndex: siteCards.length - i,
                  }}
                >
                  <div
                    className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.accent} backdrop-blur-md p-5 shadow-lg shadow-black/30`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {card.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                          {card.domain}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {card.building ? (
                          <>
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                            </span>
                            <span className="text-xs font-medium text-amber-400">
                              Building&hellip;
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${card.dot}`}
                            />
                            <span className="text-xs font-medium text-emerald-400">
                              Active&nbsp;&check;
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for the building card */}
                    {card.building && (
                      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                          initial={{ width: '0%' }}
                          animate={
                            inView
                              ? { width: ['0%', '62%'] }
                              : {}
                          }
                          transition={{
                            duration: 2.5,
                            delay: 0.8,
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-20 flex justify-center"
        >
          <button
            type="button"
            className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30"
          >
            See Business Templates
          </button>
        </motion.div>
      </div>
    </section>
  );
}
