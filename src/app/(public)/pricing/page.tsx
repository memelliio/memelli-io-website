'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    borderColor: 'border-zinc-700',
    accentColor: 'bg-muted',
    description: 'Get started with funding readiness, credit analysis, and AI guidance at zero cost.',
    cta: 'Get Started Free',
    ctaHref: '/register',
    highlighted: false,
    features: [
      'Funding readiness check',
      'Credit analysis report',
      'AI guidance & recommendations',
      'Basic CRM pipeline',
      'Community support',
    ],
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    borderColor: 'border-blue-500/60',
    accentColor: 'bg-blue-500',
    description: 'Everything free plus commerce, coaching, communications, and AI-powered automation.',
    cta: 'Start Starter',
    ctaHref: '/register',
    highlighted: false,
    features: [
      'Everything in Free',
      'Commerce storefront',
      'Coaching programs',
      'Communications (phone + SMS)',
      'AI-powered automation',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    borderColor: 'border-red-500/60',
    accentColor: 'bg-red-500',
    badge: 'Most Popular',
    description: 'Unlock SEO traffic, lead generation, website builder, and a full AI workforce.',
    cta: 'Start Professional',
    ctaHref: '/register',
    highlighted: true,
    features: [
      'Everything in Starter',
      'Forum SEO Traffic engine',
      'LeadPulse lead generation',
      'Website Builder (3 deployed sites)',
      'Full AI workforce',
      'Custom domain',
      'Priority support',
    ],
  },
];

const comparisonRows = [
  { feature: 'Funding Readiness Check', free: true, starter: true, professional: true },
  { feature: 'Credit Analysis', free: true, starter: true, professional: true },
  { feature: 'AI Guidance', free: true, starter: true, professional: true },
  { feature: 'Basic CRM', free: true, starter: true, professional: true },
  { feature: 'Commerce Storefront', free: false, starter: true, professional: true },
  { feature: 'Coaching Programs', free: false, starter: true, professional: true },
  { feature: 'Communications', free: false, starter: true, professional: true },
  { feature: 'AI Automation', free: false, starter: true, professional: true },
  { feature: 'Forum SEO Traffic', free: false, starter: false, professional: true },
  { feature: 'LeadPulse Lead Gen', free: false, starter: false, professional: true },
  { feature: 'Website Builder', free: false, starter: false, professional: true },
  { feature: 'Deployed Sites', free: '\u2014', starter: '\u2014', professional: '3' },
  { feature: 'Custom Domain', free: false, starter: false, professional: true },
  { feature: 'Support', free: 'Community', starter: 'Email', professional: 'Priority' },
];

const faqs = [
  {
    q: 'How does billing work?',
    a: 'All paid plans are billed monthly. You can upgrade, downgrade, or cancel at any time. When you upgrade, the new features activate instantly and you are charged the prorated difference. When you downgrade, the change takes effect at the end of your current billing cycle.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. You can switch between plans whenever you want from your account settings. Upgrades take effect immediately, and downgrades apply at the end of your current billing period so you never lose access mid-cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'The Free plan is free forever with no credit card required. For paid plans, you can start with the Free tier to explore the platform and upgrade when you are ready to unlock more features and AI agents.',
  },
  {
    q: 'What are AI agents and how do they work?',
    a: 'AI agents are your virtual employees. Each agent specializes in a task -- writing content, managing leads, processing orders, handling customer support. The more agents on your plan, the more your business can handle simultaneously without hiring.',
  },
  {
    q: 'What happens if I exceed my plan limits?',
    a: 'We will notify you when you are approaching your limits and recommend an upgrade. Your existing workflows will not be disrupted -- you simply will not be able to add new agents or sites beyond your plan cap until you upgrade.',
  },
  {
    q: 'Do I need any technical knowledge?',
    a: 'Not at all. Memelli OS is built for entrepreneurs, not engineers. Everything is configured through a simple dashboard. Just tell your AI company what you need in plain language and it gets done.',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.3 4.3a1 1 0 0 1 1.4 0L8 6.6l2.3-2.3a1 1 0 1 1 1.4 1.4L9.4 8l2.3 2.3a1 1 0 0 1-1.4 1.4L8 9.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L6.6 8 4.3 5.7a1 1 0 0 1 0-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function renderCellValue(value: boolean | string) {
  if (value === true) return <CheckIcon className="mx-auto text-red-400" />;
  if (value === false) return <XIcon className="mx-auto text-muted-foreground" />;
  return <span>{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[480px] w-[480px] rounded-full bg-red-600/8 blur-[160px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Plans That Scale{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              With You
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Start free and upgrade as your business grows. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ===== Plan Cards ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border backdrop-blur-2xl transition-all duration-200 ${
                plan.highlighted
                  ? 'border-red-500/30 bg-red-950/20 shadow-[0_0_60px_rgba(147,51,234,0.08)] scale-[1.03]'
                  : 'border-border bg-card'
              }`}
            >
              {/* Colored top border accent */}
              <div className={`h-px rounded-t-2xl ${plan.highlighted ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : 'bg-gradient-to-r from-transparent via-zinc-700 to-transparent'}`} />

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-7 pb-0">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mx-7 mb-6 mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 shrink-0 text-red-400" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="p-7 pt-0">
                <Link href={plan.ctaHref} className="block">
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    size="lg"
                    className={`w-full rounded-xl transition-all duration-200 ${
                      plan.highlighted
                        ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(147,51,234,0.15)] hover:shadow-[0_0_30px_rgba(147,51,234,0.25)]'
                        : 'bg-muted hover:bg-muted border border-border text-foreground'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Feature Comparison Table ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Full Feature{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Comparison
            </span>
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card backdrop-blur-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="min-w-[180px] px-6 py-4 text-left font-semibold text-muted-foreground">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Free</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Starter</th>
                  <th className="px-6 py-4 text-center font-semibold text-red-400">Professional</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/[0.03] last:border-0 ${
                      i % 2 === 0 ? 'bg-[hsl(var(--background))]/30' : 'bg-card'
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{renderCellValue(row.free)}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{renderCellValue(row.starter)}</td>
                    <td className="px-6 py-3.5 text-center text-red-300">{renderCellValue(row.professional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-2xl"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
                >
                  {faq.q}
                  <span
                    className={`ml-4 shrink-0 text-lg text-muted-foreground transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  >
                    {'\u25BE'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-6 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative px-6 pb-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <div className="h-[360px] w-[360px] rounded-full bg-red-600/6 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Start Free{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Today
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            No credit card required. Build your AI-powered business and upgrade only when you are ready.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="bg-red-600 hover:bg-red-500 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.15)] hover:shadow-[0_0_30px_rgba(147,51,234,0.25)] transition-all duration-200"
              >
                Get Started Free
              </Button>
            </Link>
            <a href="mailto:sales@memelli.com">
              <Button variant="outline" size="lg" className="px-8 rounded-xl bg-muted hover:bg-muted border border-border text-foreground transition-all duration-200">
                Talk to Sales
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
