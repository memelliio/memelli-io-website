'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const tiers = [
  {
    name: 'Free Prequalification',
    price: 'Free',
    features: [
      'Check funding readiness',
      'Credit analysis',
      'Action plan',
      'AI guidance',
    ],
    cta: 'Start Free',
    href: '/prequal',
    accent: {
      border: 'border-green-500',
      text: 'text-green-400',
      hover: 'hover:bg-green-500/10',
      ring: 'ring-green-500/50',
    },
  },
  {
    name: 'Command Center Access',
    price: 'From $49/mo',
    features: [
      'CRM',
      'Commerce',
      'Coaching',
      'Communications',
      'Website Builder',
      'AI Workforce',
    ],
    cta: 'See Plans',
    href: '/pricing',
    accent: {
      border: 'border-blue-500',
      text: 'text-blue-400',
      hover: 'hover:bg-blue-500/10',
      ring: 'ring-blue-500/50',
    },
  },
  {
    name: 'Business Deployment',
    price: 'From $149/mo',
    features: [
      'Deploy multiple sites',
      'Traffic engine',
      'Lead generation',
      'Full AI departments',
    ],
    cta: 'See Plans',
    href: '/pricing',
    accent: {
      border: 'border-blue-500',
      text: 'text-blue-400',
      hover: 'hover:bg-blue-500/10',
      ring: 'ring-blue-500/50',
    },
  },
  {
    name: 'White-Label / Reseller',
    price: 'From $299/mo',
    features: [
      'Your brand, your domain',
      'Resell the entire platform',
      'Affiliate engine',
      'Full white-label control',
    ],
    cta: 'See Plans',
    href: '/pricing',
    accent: {
      border: 'border-amber-500',
      text: 'text-amber-400',
      hover: 'hover:bg-amber-500/10',
      ring: 'ring-amber-500/50',
    },
  },
];

export default function PlansPreviewSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section className="relative bg-[hsl(var(--background))] py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-white">
            Start Free. Scale Everything.
          </h2>
          <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
            Begin with prequalification. Unlock the cockpit as you grow.
          </p>
        </motion.div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className={`relative overflow-hidden rounded-2xl border-t-4 ${tier.accent.border} bg-[hsl(var(--card))] p-6 backdrop-blur-md`}
            >
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <p className={`mt-2 text-2xl font-semibold ${tier.accent.text}`}>
                {tier.price}
              </p>

              <ul className="mt-5 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[hsl(var(--foreground))]">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${tier.accent.text}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`mt-6 block w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition ${tier.accent.border} ${tier.accent.text} ${tier.accent.hover}`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center text-sm text-[hsl(var(--muted-foreground))]"
        >
          All plans include AI workforce access and connected systems.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-8 text-center"
        >
          <a
            href="/pricing"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            View All Plans
          </a>
        </motion.div>
      </div>
    </section>
  );
}
