'use client';

import Link from 'next/link';
import {
  Users,
  TrendingUp,
  Mail,
  Bot,
  ArrowRight,
  BarChart3,
  Brain,
  Star,
  Zap,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Users,
    title: 'Contacts',
    description: 'Enrich every contact automatically with social profiles, company data, and interaction history. AI surfaces insights you would miss.',
  },
  {
    icon: TrendingUp,
    title: 'Deals & Pipelines',
    description: 'Visualize every deal across custom stages. AI predicts close probability, flags stalled deals, and recommends next actions.',
  },
  {
    icon: Mail,
    title: 'AI Follow-up',
    description: 'Never drop a lead. AI drafts and sends personalized follow-ups based on engagement patterns, deal stage, and buyer behavior.',
  },
  {
    icon: Star,
    title: 'Auto-scoring',
    description: 'Leads are scored automatically against your ideal customer profile. Hot leads get routed for immediate action before they go cold.',
  },
  {
    icon: BarChart3,
    title: 'Forecasting',
    description: 'Accurate revenue predictions powered by pipeline velocity and conversion patterns. Plan quarters with confidence.',
  },
  {
    icon: Brain,
    title: 'AI Coaching',
    description: 'Get deal-level recommendations on the next best action. AI analyses your win/loss patterns and coaches your team in real time.',
  },
];

const stats = [
  { value: '3×', label: 'More Pipeline' },
  { value: '40%', label: 'Faster Close' },
  { value: '24/7', label: 'AI Working' },
];

/* ──────────────────────────── NAV ──────────────────────────── */

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-[hsl(var(--background))] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-bold tracking-widest text-white">
          MEMELLI.IO
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/start"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(59,130,246,0.25)] transition-all hover:bg-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function CrmPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-40">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-blue-500/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-blue-400" />
            Melli CRM
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI-Powered Pipelines
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-500 bg-clip-text text-transparent">
              That Close Deals
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Track contacts, manage deals, and let AI handle follow-up — a CRM that
            works as hard as you do, around the clock.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-400 hover:shadow-[0_0_36px_rgba(59,130,246,0.4)]"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/crm"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur-xl transition-all hover:border-white/[0.14] hover:bg-muted"
            >
              Open CRM
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 divide-x divide-white/[0.04] rounded-2xl border border-border bg-card backdrop-blur-xl">
            {stats.map((s) => (
              <div key={s.label} className="py-10 text-center">
                <div className="text-3xl font-bold text-blue-400">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything your sales team{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                needs to win
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI-native relationship management built for modern sales teams.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-blue-500/[0.04]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                  <f.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 px-10 py-14 backdrop-blur-xl">
            <Zap className="mx-auto mb-6 h-10 w-10 text-blue-400" />
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to close more deals{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                with AI?
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands of sales teams already using Melli CRM to accelerate revenue.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-400"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/crm"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur-xl transition-all hover:border-white/[0.14]"
              >
                Open CRM
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
