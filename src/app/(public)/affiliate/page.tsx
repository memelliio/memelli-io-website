'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardContent, CardFooter, CardTitle } from '@memelli/ui';
import { API_URL } from '@/lib/config';

type TierKey = 'lite' | 'pro';

interface Program {
  key: TierKey;
  name: string;
  subtitle: string;
  commission: string;
  price: string;
  idealFor: string;
  features: string[];
  highlighted?: boolean;
}

const programs: Program[] = [
  {
    key: 'lite',
    name: 'Infinity Lite',
    subtitle: 'Referral Affiliate',
    commission: '10%',
    price: 'Free',
    idealFor: 'Anyone who wants to earn by referring people to Memelli. Share your link, earn commissions. No cost, no commitment.',
    features: [
      'Free to join',
      '10% commission on all referrals',
      'Unique referral link & QR codes',
      'Simple tracking dashboard',
      'Marketing materials provided',
      'Monthly payouts',
      'Email support',
    ],
  },
  {
    key: 'pro',
    name: 'Infinity Pro',
    subtitle: 'Full Partner Program',
    commission: 'Custom',
    price: 'Contact Us',
    highlighted: true,
    idealFor: 'Businesses that want to offer Memelli services under their own brand with a full partner dashboard, team management, and branding controls.',
    features: [
      'Higher commission rates',
      'Co-branded mode: your logo in header with "Partnered with [Your Name]" on memelli.com',
      'White-label mode: your own custom domain, your logo, "Powered by Memelli OS" in footer',
      'Full partner dashboard',
      'Team management & roles',
      'Branding controls',
      'Pipeline visibility',
      'Dedicated partner success manager',
    ],
  },
];

const steps = [
  {
    number: '1',
    title: 'Choose Your Program',
    description: 'Pick Lite for simple referrals or Pro for a full branded partner experience.',
  },
  {
    number: '2',
    title: 'Share & Promote',
    description: 'Get your referral link and marketing materials. Promote Memelli to your audience or clients.',
  },
  {
    number: '3',
    title: 'Earn',
    description: 'Earn recurring commissions every month for as long as your referrals stay subscribed.',
  },
];

const benefits = [
  {
    title: 'Recurring Commissions',
    description: 'Earn every single month your referrals remain active -- not just a one-time payout.',
  },
  {
    title: 'Real-Time Dashboard',
    description: 'Track clicks, signups, conversions, and payouts with a live analytics dashboard.',
  },
  {
    title: 'Marketing Materials',
    description: 'Access banners, email templates, landing pages, and social media assets ready to use.',
  },
  {
    title: 'Your Brand, Your Way',
    description: 'Pro partners choose co-branded or full white-label mode with their own custom domain.',
  },
];

const faqs = [
  {
    q: 'How do I get paid?',
    a: 'Commissions are paid monthly via PayPal or bank transfer on the 1st of each month for the prior month\'s earnings. Minimum payout threshold is $50.',
  },
  {
    q: 'What is the difference between Lite and Pro?',
    a: 'Lite is a free referral program -- share your link, earn 10% commission. Pro is a full partner program with higher commissions, branding controls, team management, and the option to run Memelli under your own brand (co-branded or white-label).',
  },
  {
    q: 'What is co-branded vs white-label?',
    a: 'Co-branded means your logo appears in the header alongside "Partnered with [Your Name]" on memelli.com. White-label means you get your own custom domain with your branding front and center, and "Powered by Memelli OS" in the footer.',
  },
  {
    q: 'Can I upgrade from Lite to Pro?',
    a: 'Absolutely. You can upgrade at any time from your partner dashboard. Your existing referrals carry over.',
  },
  {
    q: 'Is there a minimum number of referrals required?',
    a: 'No minimums. You earn commissions from your very first referral.',
  },
  {
    q: 'What products can I promote?',
    a: 'All Memelli products and services are eligible. You earn your commission rate on the full subscription value of every referred customer.',
  },
  {
    q: 'How long does approval take?',
    a: 'Lite applications are typically approved within 24 hours. Pro partnerships involve a brief onboarding call to set up your branding and configuration.',
  },
];

export default function AffiliatePage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    tier: 'lite' as TierKey,
    message: '',
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const TIER_MAP: Record<TierKey, string> = {
    lite: 'INFINITY_LITE',
    pro: 'INFINITY_PRO',
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/partners/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          company: form.company || undefined,
          website: form.website || undefined,
          desiredTier: TIER_MAP[form.tier],
          message: form.message || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Something went wrong. Please try again.');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToSignup(tierKey?: TierKey) {
    if (tierKey) {
      setForm((prev) => ({ ...prev, tier: tierKey }));
    }
    document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-foreground antialiased">
        <section className="flex min-h-[70vh] items-center justify-center px-6 py-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl font-bold text-white shadow-lg shadow-red-500/20">
              &#10003;
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Application Received</h1>
            <p className="mt-4 text-muted-foreground">
              We&apos;ll review your application and get back to you within 48 hours.
              Check your email for a confirmation.
            </p>
            <Link
              href="/"
              className="mt-10 inline-block rounded-xl bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-500"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground antialiased">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-6 py-24 text-center sm:py-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm font-medium text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Infinity Network
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Join the{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Infinity Network
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Two programs. One mission. Refer and earn with Infinity Lite, or build a full branded
            partner business with Infinity Pro.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20 px-8"
              onClick={() => scrollToSignup()}
            >
              Apply Now
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl border-border hover:border-white/[0.14] text-muted-foreground" onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}>
              View Programs
            </Button>
          </div>
        </div>
      </section>

      {/* Programs — Two Big Cards Side by Side */}
      <section id="programs" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight">
            Infinity{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Programs
            </span>
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-muted-foreground">
            Choose the program that fits your goals. Start free with Lite or go all-in with Pro.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {programs.map((program) => (
              <Card
                key={program.key}
                className={`relative flex flex-col rounded-2xl border bg-card backdrop-blur-xl transition-all duration-200 ${
                  program.highlighted
                    ? 'border-red-500/30 shadow-lg shadow-red-500/[0.06]'
                    : 'border-border hover:border-border'
                }`}
              >
                {program.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-red-500/20">
                    Full Partner
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl tracking-tight">{program.name}</CardTitle>
                  <p className="text-sm font-medium text-red-400/80">{program.subtitle}</p>
                  <div className="mt-3 text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                    {program.commission}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {program.key === 'lite' ? 'commission on all referrals' : 'commission rates'}
                  </p>
                  <div className="mt-3 text-lg font-semibold text-foreground">{program.price}</div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{program.idealFor}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {program.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={program.highlighted ? 'primary' : 'outline'}
                    className={`w-full rounded-xl ${program.highlighted ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20' : 'border-border hover:border-white/[0.14] text-muted-foreground'}`}
                    onClick={() => scrollToSignup(program.key)}
                  >
                    {program.key === 'lite' ? 'Join Free' : 'Contact Us'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight">
            How It{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            Getting started is simple. Three steps to your first commission.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent sm:block" />
                )}
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-xl font-bold text-white shadow-lg shadow-red-500/20">
                  {step.number}
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight">
            Partner{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Benefits
            </span>
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            Everything you need to succeed as a Memelli partner.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((b) => (
              <Card key={b.title} className="rounded-2xl border border-border bg-card backdrop-blur-xl transition-all duration-200 hover:border-border">
                <CardHeader>
                  <CardTitle className="tracking-tight">{b.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section id="signup-form" className="px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 sm:p-12">
            <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight">
              Join the{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Infinity Network
              </span>
            </h2>
            <p className="mb-10 text-center text-muted-foreground">
              Choose your program and apply below. We&apos;ll review your application within 48 hours.
            </p>

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  placeholder="Jane Smith"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="jane@example.com"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
                <Input
                  label="Company"
                  placeholder="Your Company LLC"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                />
              </div>

              <Input
                label="Website"
                type="url"
                placeholder="https://yoursite.com"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tier" className="text-sm font-medium text-muted-foreground">
                  Infinity Program
                </label>
                <select
                  id="tier"
                  value={form.tier}
                  onChange={(e) => updateField('tier', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3 py-2 text-sm text-foreground hover:border-white/[0.10] focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors duration-200"
                >
                  {programs.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name} -- {p.commission} ({p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-muted-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Tell us about your audience, promotion strategy, or any questions you have..."
                  className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground hover:border-white/[0.10] focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors duration-200"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={submitting}
                className="w-full bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20"
              >
                Submit Application
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-muted-foreground">
            Everything you need to know about the Infinity Network.
          </p>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl transition-all duration-200 hover:border-border"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card backdrop-blur-xl p-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to Start{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Earning?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join the Infinity Network and start earning recurring commissions with Memelli.
            Free to start with Lite, or go Pro for a full branded partner experience.
          </p>
          <Button
            size="lg"
            className="mt-10 bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20 px-8"
            onClick={() => scrollToSignup()}
          >
            Apply Now
          </Button>
        </div>
      </section>
    </div>
  );
}
