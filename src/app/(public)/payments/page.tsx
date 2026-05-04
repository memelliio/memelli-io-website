'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🛒',
    title: 'One-Click Checkout',
    description:
      'Frictionless checkout with one-click upsells, order bumps, and post-purchase offers. Optimized for conversion — average checkout abandonment reduced by 40%.',
  },
  {
    icon: '🔁',
    title: 'Subscription Plans',
    description:
      'Build and manage recurring revenue effortlessly. Trial periods, plan upgrades, downgrades, pauses, and cancellations — all handled automatically.',
  },
  {
    icon: '🧾',
    title: 'Smart Invoicing',
    description:
      'Create, send, and track professional invoices. AI follows up on unpaid invoices, sends reminders, and escalates past-due accounts automatically.',
  },
  {
    icon: '💳',
    title: 'Multiple Payment Methods',
    description:
      'Accept cards, ACH, bank transfers, digital wallets, buy-now-pay-later, and crypto. Meet customers where they want to pay.',
  },
  {
    icon: '🔒',
    title: 'Fraud & Dispute Protection',
    description:
      'AI-powered fraud detection blocks bad actors before they charge back. Automated dispute response with evidence collection included.',
  },
  {
    icon: '📊',
    title: 'Payment Analytics',
    description:
      'Track revenue by product, channel, plan, and rep. See failed payments, recovery rates, and net revenue after refunds — live.',
  },
];

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(161,161,170,0.1) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-500/20 bg-card0/5 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
            Payments · Checkout · Plans · Invoices
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Payments Built for{' '}
            <span className="bg-gradient-to-r from-zinc-200 to-white bg-clip-text text-transparent">
              Growth
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Checkout flows, subscription plans, invoicing, and payment analytics — all
            connected to your CRM, email, and AI agents. Collect revenue at every touchpoint.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-white hover:bg-card text-black font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Collecting Free
            </Link>
            <Link
              href="/login"
              className="border border-white/10 hover:border-white/20 text-muted-foreground px-8 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '2.4%', label: 'Processing Rate' },
            { value: '140+', label: 'Currencies Supported' },
            { value: '<2%', label: 'Failed Payment Rate' },
            { value: '$0', label: 'Setup Fees' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-muted-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Everything You Need to Get Paid</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Replace Stripe + Chargebee + FreshBooks with one integrated payment layer inside Memelli OS.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-zinc-400/20 transition-all"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to start collecting revenue?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create your first checkout page in minutes. No card required to start.
        </p>
        <Link
          href="/start"
          className="inline-block bg-white hover:bg-card text-black font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
