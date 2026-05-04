'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  Globe,
  LayoutTemplate,
  MessageCircle,
  Search,
  PenTool,
  Palette,
  Rocket,
  ArrowRight,
  Star,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: LayoutTemplate,
    title: 'Industry Templates',
    description:
      'Pre-built templates for credit repair, real estate, coaching, e-commerce, and more. AI customizes them to your brand in seconds.',
  },
  {
    icon: MessageCircle,
    title: 'Forum Auto-Setup',
    description:
      'Every site ships with full forum infrastructure. Drive organic traffic, build community, and generate thousands of indexed pages automatically.',
  },
  {
    icon: Search,
    title: 'SEO Structure',
    description:
      'Semantic HTML, auto-generated sitemaps, meta tags, Open Graph, and structured data baked into every page from day one.',
  },
  {
    icon: PenTool,
    title: 'Custom Pages',
    description:
      'Visual page builder with 50+ block types. Create landing pages, case studies, testimonials, and service pages — no code required.',
  },
  {
    icon: Palette,
    title: 'Theme System',
    description:
      'Full theme engine with color palettes, typography controls, and layout presets. Match your brand identity across every page.',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description:
      'Connect your domain, provision SSL, and go live in one click. Zero DevOps, zero downtime, zero complexity.',
  },
];

const steps = [
  { num: '01', title: 'Describe Your Business', description: 'Tell AI what you do — it generates your full site structure, copy, and layout.' },
  { num: '02', title: 'Forum Auto-Configures', description: 'Categories, seed threads, and moderation rules set up based on your industry.' },
  { num: '03', title: 'Customize & Brand', description: 'Adjust colors, fonts, images, and content with the visual editor.' },
  { num: '04', title: 'Deploy Instantly', description: 'Connect your domain and launch. SSL, CDN, and SEO handled automatically.' },
];

const testimonials = [
  {
    name: 'Kevin R.',
    role: 'Credit Repair Business Owner',
    quote: 'I had a full website with a forum live in under 10 minutes. The AI-generated copy was better than what I paid a copywriter for.',
  },
  {
    name: 'Stephanie M.',
    role: 'Real Estate Agent',
    quote: 'The forum drives 60% of my organic traffic now. Clients find me through Google, read the threads, and reach out directly.',
  },
  {
    name: 'Brian C.',
    role: 'E-commerce Founder',
    quote: 'One-click deploy is real. I went from nothing to a fully branded site with SEO and forums in a single afternoon.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function WebsiteBuilderPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white antialiased">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm font-medium text-red-300">
            <Globe className="h-4 w-4" />
            Website Builder
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI Site Generator
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              with Built-In Forum Infrastructure
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Describe your business in one sentence. Get a complete website with forum infrastructure,
            SEO-ready pages, and trust-building content — in under a minute.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Generate Your Website
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
                Launch & Grow
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Templates, forums, SEO, and AI content — all built in from day one.
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
            <p className="mt-4 text-muted-foreground">From zero to a live website with forums in four steps.</p>
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
                Business Owners
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what entrepreneurs are saying about Memelli Website Builder.
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
              No hidden fees, no per-site charges. One plan that scales with your business and includes every AI agent, every feature, every update.
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
            Ready to launch your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              AI-powered website?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Describe your business. AI generates your site. You launch in minutes, not months.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Generate Your Website
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
