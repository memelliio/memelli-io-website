'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  Crosshair,
  Fingerprint,
  TrendingUp,
  Mail,
  Video,
  Workflow,
  ArrowRight,
  Star,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Crosshair,
    title: 'Multi-Source Discovery',
    description:
      'AI hunts leads across LinkedIn, job boards, directories, social media, and the open web — surfacing prospects your competitors miss.',
  },
  {
    icon: Fingerprint,
    title: 'Identity Resolution',
    description:
      'Match fragmented data points into complete lead profiles with verified emails, phone numbers, company info, and social handles.',
  },
  {
    icon: TrendingUp,
    title: 'Lead Scoring',
    description:
      'AI ranks every lead by fit, intent, and engagement signals so your team focuses on the highest-probability opportunities first.',
  },
  {
    icon: Mail,
    title: 'Outreach Campaigns',
    description:
      'Launch personalized email and SMS sequences that adapt in real time based on opens, clicks, replies, and conversion patterns.',
  },
  {
    icon: Video,
    title: 'AI Video Generation',
    description:
      'Create personalized video messages for each prospect using AI-generated visuals, voiceover, and dynamic scenes at scale.',
  },
  {
    icon: Workflow,
    title: 'Pipeline Automation',
    description:
      'From discovery to closed deal, every stage of your pipeline runs on autopilot with intelligent follow-ups and handoff triggers.',
  },
];

const steps = [
  { num: '01', title: 'Define Your ICP', description: 'Tell AI who your ideal customer is — industry, size, role, signals.' },
  { num: '02', title: 'AI Hunts Leads', description: 'Agents scour the web 24/7 and deliver verified, scored leads to your pipeline.' },
  { num: '03', title: 'Engage Automatically', description: 'Personalized outreach launches across email, SMS, and video instantly.' },
  { num: '04', title: 'Close More Deals', description: 'AI optimizes every touchpoint so you convert more prospects into paying customers.' },
];

const testimonials = [
  {
    name: 'Marcus D.',
    role: 'Sales Director',
    quote: 'LeadPulse found 3x more qualified leads than our old tool — and the AI video outreach gets a 40% response rate.',
  },
  {
    name: 'Vanessa K.',
    role: 'Growth Marketer',
    quote: 'We replaced four separate lead gen tools with one platform. Identity resolution alone saved us 15 hours a week.',
  },
  {
    name: 'Ryan S.',
    role: 'Agency CEO',
    quote: 'The pipeline automation is unreal. Leads come in scored, enriched, and ready for outreach without anyone touching a thing.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white antialiased">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm font-medium text-red-300">
            <Crosshair className="h-4 w-4" />
            LeadPulse Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI Lead
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Hunter
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Discover, enrich, score, and engage leads across every channel — powered by AI agents that
            fill your pipeline around the clock.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Finding Leads
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-white/[0.14] text-muted-foreground">
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
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Fill Your Pipeline
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete lead generation platform with AI baked into every layer.
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
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">{f.title}</h3>
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
            <p className="mt-4 text-muted-foreground">From cold market to full pipeline in four steps.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-bold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-semibold tracking-tight text-white">{s.title}</h3>
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
                Sales Teams
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what revenue leaders are saying about Memelli LeadPulse.
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
                  <p className="text-sm font-semibold text-white">{t.name}</p>
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
              No hidden fees, no per-lead charges. One plan that scales with your pipeline and includes every AI agent, every feature, every update.
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
            Ready to fill your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              pipeline with AI?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of sales teams closing more deals with Memelli LeadPulse.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Finding Leads
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-white/[0.14] text-muted-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
