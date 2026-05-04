'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Plan {
  name: string;
  monthly: number;
  description: string;
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const plans: Plan[] = [
  {
    name: 'Starter',
    monthly: 49,
    description: 'Everything you need to launch. Basic CRM, one site, and email support to get moving.',
    cta: 'Start Free Trial',
    ctaHref: '/register?plan=starter',
    highlighted: false,
    features: [
      'Basic CRM pipeline',
      '1 deployed site',
      'Email support',
      'Contact management',
      'Deal tracking',
      'Basic reporting',
    ],
  },
  {
    name: 'Professional',
    monthly: 149,
    badge: 'Most Popular',
    description: 'Full CRM power with SEO tools, three sites, and phone support to scale faster.',
    cta: 'Start Free Trial',
    ctaHref: '/register?plan=professional',
    highlighted: true,
    features: [
      'Full CRM suite',
      '3 deployed sites',
      'Phone + email support',
      'SEO traffic tools',
      'Lead generation',
      'Custom fields & pipelines',
      'Advanced reporting',
      'Email campaigns',
    ],
  },
  {
    name: 'Business',
    monthly: 299,
    description: 'The complete platform. Commerce, coaching, analytics, and priority support included.',
    cta: 'Start Free Trial',
    ctaHref: '/register?plan=business',
    highlighted: false,
    features: [
      'Everything in Professional',
      'Commerce engine',
      'Coaching platform',
      'Advanced analytics',
      'Priority support',
      '10 deployed sites',
      'Automation workflows',
      'Team collaboration',
      'Custom dashboards',
    ],
  },
  {
    name: 'Enterprise',
    monthly: 499,
    description: 'Unlimited everything. Custom features, a dedicated agent, and full API access.',
    cta: 'Start Free Trial',
    ctaHref: '/register?plan=enterprise',
    highlighted: false,
    features: [
      'Everything in Business',
      'Unlimited sites',
      'Custom feature development',
      'Dedicated account agent',
      'Full API access',
      'White-label options',
      'Custom integrations',
      'SLA guarantee',
      'Onboarding concierge',
      'Unlimited team members',
    ],
  },
];

const ANNUAL_DISCOUNT = 0.20;

const comparisonFeatures = [
  { feature: 'CRM', starter: 'Basic', professional: 'Full', business: 'Full', enterprise: 'Full' },
  { feature: 'Deployed Sites', starter: '1', professional: '3', business: '10', enterprise: 'Unlimited' },
  { feature: 'Contact Management', starter: true, professional: true, business: true, enterprise: true },
  { feature: 'Deal Tracking', starter: true, professional: true, business: true, enterprise: true },
  { feature: 'Custom Fields', starter: false, professional: true, business: true, enterprise: true },
  { feature: 'Custom Pipelines', starter: false, professional: true, business: true, enterprise: true },
  { feature: 'SEO Traffic Tools', starter: false, professional: true, business: true, enterprise: true },
  { feature: 'Lead Generation', starter: false, professional: true, business: true, enterprise: true },
  { feature: 'Email Campaigns', starter: false, professional: true, business: true, enterprise: true },
  { feature: 'Commerce Engine', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'Coaching Platform', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'Advanced Analytics', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'Automation Workflows', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'Team Collaboration', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'Custom Dashboards', starter: false, professional: false, business: true, enterprise: true },
  { feature: 'White-label', starter: false, professional: false, business: false, enterprise: true },
  { feature: 'Custom Integrations', starter: false, professional: false, business: false, enterprise: true },
  { feature: 'API Access', starter: false, professional: false, business: false, enterprise: true },
  { feature: 'Dedicated Agent', starter: false, professional: false, business: false, enterprise: true },
  { feature: 'SLA Guarantee', starter: false, professional: false, business: false, enterprise: true },
  { feature: 'Support', starter: 'Email', professional: 'Phone', business: 'Priority', enterprise: 'Dedicated' },
];

const faqs = [
  {
    q: 'How does the free trial work?',
    a: 'Every paid plan includes a 14-day free trial. You get full access to all features in your chosen tier with no credit card required. At the end of the trial, you can subscribe or your account will revert to read-only mode.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrades take effect immediately and you pay the prorated difference. Downgrades apply at the end of your current billing cycle so you keep access for the time you have already paid.',
  },
  {
    q: 'What is the annual pricing?',
    a: 'Annual plans save you 20% compared to monthly billing. You pay for 12 months upfront at the discounted rate. Annual subscriptions can be cancelled at any time and you keep access until the end of your paid term.',
  },
  {
    q: 'What happens after my trial ends?',
    a: 'If you do not subscribe, your data is preserved for 30 days in read-only mode. You can subscribe at any time during that window to restore full access. After 30 days, inactive trial accounts are archived.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Monthly plans can be cancelled at any time with no refund for the current month. Annual plans include a 30-day money-back guarantee from the date of purchase.',
  },
  {
    q: 'What is a dedicated account agent?',
    a: 'Enterprise subscribers get a dedicated AI agent that learns your business processes, preferences, and workflows. It acts as your primary point of contact within the platform and can handle tasks, answer questions, and coordinate with other system agents on your behalf.',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.3 4.3a1 1 0 0 1 1.4 0L8 6.6l2.3-2.3a1 1 0 1 1 1.4 1.4L9.4 8l2.3 2.3a1 1 0 0 1-1.4 1.4L8 9.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L6.6 8 4.3 5.7a1 1 0 0 1 0-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function formatPrice(amount: number) {
  return `$${amount}`;
}

function renderCell(value: boolean | string) {
  if (value === true) return <CheckIcon className="mx-auto text-red-400" />;
  if (value === false) return <XMark className="mx-auto text-muted-foreground" />;
  return <span>{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubscriptionsPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function price(monthly: number) {
    if (annual) {
      const discounted = Math.round(monthly * (1 - ANNUAL_DISCOUNT));
      return discounted;
    }
    return monthly;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[480px] w-[480px] rounded-full bg-red-600/8 blur-[160px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Subscription{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Plans
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Choose the plan that fits your business. Start with a free trial, upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors duration-200 ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-7 w-[52px] rounded-full transition-colors duration-200 ${
                annual ? 'bg-red-600' : 'bg-muted'
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  annual ? 'translate-x-[25px]' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors duration-200 ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {annual && (
              <span className="rounded-full bg-red-600/10 border border-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-400">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== Plan Cards ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const monthly = price(plan.monthly);
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border backdrop-blur-2xl transition-all duration-200 ${
                  plan.highlighted
                    ? 'border-red-500/30 bg-red-950/20 shadow-[0_0_60px_rgba(147,51,234,0.08)] scale-[1.03]'
                    : 'border-border bg-card'
                }`}
              >
                {/* Colored top border accent */}
                <div
                  className={`h-px rounded-t-2xl ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-zinc-700 to-transparent'
                  }`}
                />

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
                    <span className="text-4xl font-bold tracking-tight text-white">
                      {formatPrice(monthly)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  {annual && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="line-through">${plan.monthly}/mo</span>
                      <span className="ml-2 text-red-400">billed annually</span>
                    </p>
                  )}
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
            );
          })}
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
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Starter</th>
                  <th className="px-6 py-4 text-center font-semibold text-red-400">Professional</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Business</th>
                  <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/[0.03] last:border-0 ${
                      i % 2 === 0 ? 'bg-[hsl(var(--background))]/30' : 'bg-card'
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{renderCell(row.starter)}</td>
                    <td className="px-6 py-3.5 text-center text-red-300">{renderCell(row.professional)}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{renderCell(row.business)}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{renderCell(row.enterprise)}</td>
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
            Start Your Free{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Trial Today
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            No credit card required. Full access for 14 days. Pick a plan and start building.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="bg-red-600 hover:bg-red-500 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.15)] hover:shadow-[0_0_30px_rgba(147,51,234,0.25)] transition-all duration-200"
              >
                Start Free Trial
              </Button>
            </Link>
            <a href="mailto:sales@memelli.com">
              <Button
                variant="outline"
                size="lg"
                className="px-8 rounded-xl bg-muted hover:bg-muted border border-border text-foreground transition-all duration-200"
              >
                Talk to Sales
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
