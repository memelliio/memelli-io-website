'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  CreditCard,
  FileSearch,
  Brain,
  FolderOpen,
  Building2,
  ShieldCheck,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: FileSearch,
    title: 'Credit Analysis',
    description:
      'AI reads your full tri-bureau report and breaks down every tradeline, inquiry, and derogatory mark into plain-English insights you can act on.',
  },
  {
    icon: Brain,
    title: 'Decision Engine',
    description:
      'Matches your credit profile against real lender criteria to predict approval odds and recommend the best products before you apply.',
  },
  {
    icon: FolderOpen,
    title: 'Document Management',
    description:
      'Secure vault for pay stubs, tax returns, and ID verification. Auto-organized by client and file type, ready for lender submission.',
  },
  {
    icon: Building2,
    title: 'Lender Matching',
    description:
      'AI scans partner lender requirements and surfaces only the offers you actually qualify for — no wasted applications, no surprises.',
  },
  {
    icon: CheckCircle2,
    title: 'Credit Repair Guidance',
    description:
      'Automated dispute letter generation, score-improvement action plans, and progress tracking that keeps clients on the fastest path to approval.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Built In',
    description:
      'SOC 2 compliant infrastructure with 256-bit encryption, full audit trails, and FCRA-ready workflows baked into every credit pull.',
  },
];

const steps = [
  { num: '01', title: 'Pull Report', description: 'Soft pull from all three bureaus in under 5 seconds — zero impact on your score.' },
  { num: '02', title: 'AI Analysis', description: 'Credit Analyst breaks down every factor affecting your score into actionable insights.' },
  { num: '03', title: 'Action Plan', description: 'Get a personalized roadmap — disputes to file, accounts to pay, and timelines to follow.' },
  { num: '04', title: 'Apply Ready', description: 'Submit prequalified applications to matched lenders with one click.' },
];

const testimonials = [
  {
    name: 'Marcus T.',
    role: 'Credit Repair Client',
    quote: 'The AI analysis found 3 errors on my report I never would have caught. My score jumped 68 points in 45 days.',
  },
  {
    name: 'Jennifer L.',
    role: 'Mortgage Broker',
    quote: 'I replaced my entire credit review workflow with Memelli. What took me 2 hours per client now takes 5 minutes.',
  },
  {
    name: 'Anthony W.',
    role: 'Auto Dealership Finance',
    quote: 'The lender matching alone saved us from dozens of wasted applications. Approval rates are up 35% since we switched.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function CreditPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-red-400" />
            Credit Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Know Where You Stand
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Before You Apply
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Pull credit reports, analyze tradelines with AI, and get matched to lenders you actually
            qualify for — all from one dashboard, in minutes.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Pull Your Credit Report
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Master Your Credit
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From credit pull to lender approval — every step automated and AI-enhanced.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                  <f.icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How It{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">From credit pull to lender-ready in four steps.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-semibold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-medium text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Testimonials ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Professionals
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what clients and brokers are saying about Memelli Credit.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border"
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
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple,{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No hidden fees, no per-pull charges. One plan that scales with your client base and includes every AI agent, every feature, every update.
            </p>
            <div className="mt-8">
              <Link href="/pricing">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  See Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to unlock your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              credit potential?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pull your report, see your analysis, and discover what you qualify for — in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Pull Your Credit Report
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
