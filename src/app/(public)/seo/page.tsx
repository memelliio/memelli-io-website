'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  Search,
  MessageSquare,
  FileText,
  Globe,
  Layers,
  BarChart3,
  ArrowRight,
  Star,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Search,
    title: 'Daily Question Discovery',
    description:
      'AI scans Reddit, Quora, and niche forums every day to find high-intent questions your business can answer — before your competitors do.',
  },
  {
    icon: FileText,
    title: 'Automated Thread Generation',
    description:
      'Publish expert-level forum threads with cited sources, natural tone, and embedded links that drive organic traffic back to your site.',
  },
  {
    icon: MessageSquare,
    title: 'Discussion Expansion',
    description:
      'AI generates follow-up replies, counter-arguments, and deep dives that keep threads alive and climbing in search rankings.',
  },
  {
    icon: Globe,
    title: 'Search Indexing',
    description:
      'Every thread is optimized for Google indexing with structured data, keyword density, and internal linking that search engines love.',
  },
  {
    icon: Layers,
    title: 'Topic Clusters',
    description:
      'Build interconnected content clusters across forums that establish topical authority and dominate long-tail search results.',
  },
  {
    icon: BarChart3,
    title: 'Traffic Analytics',
    description:
      'Track impressions, clicks, and conversions from every forum thread. See exactly which topics drive revenue and double down.',
  },
];

const steps = [
  { num: '01', title: 'Discover', description: 'AI finds trending questions and underserved topics in your niche every day.' },
  { num: '02', title: 'Generate', description: 'Expert threads and replies are created with your brand voice and linked to your site.' },
  { num: '03', title: 'Index', description: 'Content is optimized for search engines and begins ranking within days, not months.' },
  { num: '04', title: 'Convert', description: 'Forum traffic flows to your site where visitors convert into leads and customers.' },
];

const testimonials = [
  {
    name: 'Jason T.',
    role: 'SaaS Founder',
    quote: 'We went from zero organic forum traffic to 12,000 monthly visitors in six weeks. The ROI on this is insane.',
  },
  {
    name: 'Maria L.',
    role: 'Agency Owner',
    quote: 'Our clients love seeing their brand show up as the expert answer on Reddit and Quora. This replaced our entire content team.',
  },
  {
    name: 'Alex W.',
    role: 'E-commerce Director',
    quote: 'The topic clusters built by Memelli SEO rank faster than any blog post we have ever published. Game changer.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function SeoPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4 text-red-400" />
            Forum SEO Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI-Powered Forum
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Authority Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Discover trending questions, generate expert forum threads, dominate search rankings, and
            convert organic traffic — all on autopilot with AI agents.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Ranking Today
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
                Own Search Results
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete forum SEO platform with AI baked into every layer.
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
                <h3 className="mb-2 text-lg font-medium text-white">{f.title}</h3>
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
            <p className="mt-4 text-muted-foreground">From zero forum presence to search dominance in four steps.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-semibold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-medium text-white">{s.title}</h3>
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
                Growth Teams
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what marketers are saying about Memelli Forum SEO.
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
                  <p className="text-sm font-medium text-white">{t.name}</p>
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
              No hidden fees, no per-thread charges. One plan that scales with your traffic and includes every AI agent, every feature, every update.
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
            Ready to dominate{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              search results?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of businesses driving organic traffic with Memelli Forum SEO.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Ranking Today
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
