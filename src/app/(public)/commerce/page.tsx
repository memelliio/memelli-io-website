'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  ShoppingBag,
  Package,
  DollarSign,
  Truck,
  Bot,
  BarChart3,
  Zap,
  ArrowRight,
  Store,
  Tags,
  Users,
  Star,
  CheckCircle2,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Store,
    title: 'AI Store Builder',
    description:
      'Launch a fully branded storefront in minutes. AI generates product descriptions, categories, and layouts tailored to your market.',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    description:
      'Track stock levels, manage variants, and predict demand with AI that prevents stockouts and eliminates overstock waste automatically.',
  },
  {
    icon: Tags,
    title: 'Automated Pricing',
    description:
      'Maximize margins with real-time pricing optimization. AI analyzes competitors, demand signals, and seasonality to set the perfect price.',
  },
  {
    icon: Truck,
    title: 'Order Fulfillment',
    description:
      'From order confirmation to shipping labels, the entire fulfillment workflow runs on autopilot with intelligent routing and tracking.',
  },
  {
    icon: BarChart3,
    title: 'Customer Analytics',
    description:
      'Deep insights into customer lifetime value, conversion funnels, purchase patterns, and cohort behavior — updated in real time.',
  },
  {
    icon: Users,
    title: 'Affiliate Engine',
    description:
      'Launch and manage an affiliate program on autopilot. AI tracks referrals, calculates commissions, and recruits top-performing partners.',
  },
];

const steps = [
  { num: '01', title: 'Describe Your Products', description: 'Tell AI what you sell — it builds your catalog, descriptions, and categories.' },
  { num: '02', title: 'AI Builds Your Store', description: 'Storefront, pricing, imagery, and checkout generated in seconds.' },
  { num: '03', title: 'Connect Payments', description: 'Accept credit cards, subscriptions, and global payments instantly.' },
  { num: '04', title: 'AI Optimizes Everything', description: 'Pricing, inventory, promotions, and fulfillment adjust automatically 24/7.' },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'E-commerce Founder',
    quote: 'Memelli built my entire store in under 10 minutes. The AI pricing alone paid for itself in the first week.',
  },
  {
    name: 'David K.',
    role: 'DTC Brand Owner',
    quote: 'I replaced three separate tools with Memelli Commerce. Inventory, fulfillment, analytics — all in one place, all automated.',
  },
  {
    name: 'Priya R.',
    role: 'Dropshipping Operator',
    quote: 'The affiliate engine brought in 40% more revenue without me lifting a finger. This platform is the real deal.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function CommercePage() {
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
            <ShoppingBag className="h-4 w-4 text-red-400" />
            Commerce Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI Commerce
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Operator
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Build stores, manage inventory, optimize pricing, and automate fulfillment — all driven by
            AI agents that run your commerce operation around the clock.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Selling Today
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
                Sell Online
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete commerce platform with AI baked into every layer.
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
            <p className="mt-4 text-muted-foreground">From zero to a fully operational AI store in four steps.</p>
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
                Entrepreneurs
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what business owners are saying about Memelli Commerce.
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
              No hidden fees, no per-transaction charges. One plan that scales with your business and includes every AI agent, every feature, every update.
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
            Ready to launch your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              AI-powered store?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of entrepreneurs selling smarter with Memelli Commerce.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Selling Today
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
