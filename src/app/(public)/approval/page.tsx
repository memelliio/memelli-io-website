'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  BadgeCheck,
  Fingerprint,
  Zap,
  Share2,
  Building2,
  ShieldCheck,
  Plug,
  ArrowRight,
  Star,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Fingerprint,
    title: 'Soft Pull Technology',
    description:
      'Check approval status without impacting credit scores. Quick, safe, and completely invisible to other lenders on the report.',
  },
  {
    icon: Zap,
    title: 'Instant Decisions',
    description:
      'AI-powered underwriting returns approve or decline in seconds, not days. Real-time decisioning that keeps applicants engaged.',
  },
  {
    icon: Share2,
    title: 'Shareable Approvals',
    description:
      'Generate branded approval pages with unique links. Share results with clients, partners, or embed directly on your website.',
  },
  {
    icon: Building2,
    title: 'Lender Network',
    description:
      'Connected to a growing network of partner lenders. One application surfaces every offer your client qualifies for.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy Protected',
    description:
      'SOC 2 compliant with 256-bit encryption. Applicant data is never shared without consent and auto-purges on schedule.',
  },
  {
    icon: Plug,
    title: 'Integration Ready',
    description:
      'REST API, webhooks, and embeddable widgets let you plug approvals into any CRM, website, or workflow in minutes.',
  },
];

const steps = [
  { num: '01', title: 'Applicant Submits Info', description: 'Name, SSN, and basic details through your branded intake form.' },
  { num: '02', title: 'Soft Pull Runs Instantly', description: 'Credit data retrieved in seconds with zero impact on their score.' },
  { num: '03', title: 'AI Renders Decision', description: 'Approval engine evaluates eligibility and returns a verdict in real time.' },
  { num: '04', title: 'Branded Page Generated', description: 'A shareable approval page with your branding, ready to send or embed.' },
];

const testimonials = [
  {
    name: 'Rachel S.',
    role: 'Mortgage Loan Officer',
    quote: 'We went from 48-hour turnaround to instant approvals. Clients love the branded approval pages — it feels premium.',
  },
  {
    name: 'Omar J.',
    role: 'Auto Finance Manager',
    quote: 'The soft pull technology means we can prequalify everyone who walks in the door without hurting their credit. Game changer.',
  },
  {
    name: 'Lisa D.',
    role: 'Fintech Founder',
    quote: 'We embedded the API into our app in one afternoon. The webhook integration is clean and the docs are excellent.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function ApprovalPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground antialiased">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm font-medium text-red-300">
            <BadgeCheck className="h-4 w-4" />
            Approval Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Soft Pull Approvals
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              in Minutes
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Check approval status in seconds with zero impact on credit scores. Generate branded,
            shareable approval pages your clients will love.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Check Your Approval
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-border text-muted-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Approvals That{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Convert
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Fast decisions, beautiful results, zero credit impact.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-7 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-red-500/[0.04]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 p-3">
                  <f.icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How It{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">From application to branded approval page in four steps.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-bold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-semibold tracking-tight text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Testimonials ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Lenders & Brokers
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what finance professionals are saying about Memelli Approval.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7 transition-all duration-200 hover:border-border"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-red-400 text-red-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple,{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No hidden fees, no per-approval charges. One plan that scales with your volume and includes every AI agent, every feature, every update.
            </p>
            <div className="mt-10">
              <Link href="/pricing">
                <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  See Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready for instant{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              approvals?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Set up your approval engine in minutes. Start converting applicants today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Check Your Approval
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-border text-muted-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
