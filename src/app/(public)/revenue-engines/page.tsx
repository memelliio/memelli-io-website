'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '📈',
    title: 'MRR & ARR Tracking',
    description:
      'Live monthly and annual recurring revenue dashboards. See new MRR, expansion MRR, contraction, churn, and net revenue retention updated in real time.',
  },
  {
    icon: '🔄',
    title: 'Churn Prediction',
    description:
      'AI flags customers at risk of churning before they cancel — based on engagement drops, support tickets, and payment patterns. Intervene before it is too late.',
  },
  {
    icon: '💡',
    title: 'Revenue Forecasting',
    description:
      'Accurate forward-looking revenue models based on current pipeline, conversion rates, expansion patterns, and seasonality. Plan with confidence.',
  },
  {
    icon: '🧩',
    title: 'Cohort Analysis',
    description:
      'Understand how different customer cohorts behave over time. Which acquisition channels produce customers that stay longest and spend most?',
  },
  {
    icon: '💰',
    title: 'LTV Calculation',
    description:
      'Customer lifetime value calculated per segment, per product, and per channel. Know exactly how much you can spend to acquire a customer profitably.',
  },
  {
    icon: '🎯',
    title: 'Revenue Attribution',
    description:
      'Trace every dollar of revenue back to the campaign, channel, workflow, or sales rep that generated it. Full attribution, no dark funnel.',
  },
];

export default function RevenueEnginesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(251,113,133,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-1.5 text-xs font-medium text-pink-400 mb-8">
            Revenue Engines · MRR · ARR · Churn
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Revenue Intelligence{' '}
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              In Real Time
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Live MRR, ARR, churn prediction, LTV, and cohort analysis — all connected to your
            actual business data. Know your revenue story, every minute of every day.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              See Your Revenue Live
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

      {/* Metrics preview */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { metric: 'MRR', value: '$0', sub: 'Monthly Recurring Revenue', color: 'text-pink-400' },
            { metric: 'Churn', value: '—%', sub: 'Monthly Churn Rate', color: 'text-rose-400' },
            { metric: 'LTV', value: '$0', sub: 'Avg Customer Lifetime Value', color: 'text-pink-300' },
            { metric: 'NRR', value: '—%', sub: 'Net Revenue Retention', color: 'text-fuchsia-400' },
          ].map((m) => (
            <div key={m.metric} className="rounded-xl border border-border bg-white/[0.02] p-5 text-center">
              <div className={`text-2xl font-black mb-1 ${m.color}`}>{m.value}</div>
              <div className="text-xs text-muted-foreground font-semibold">{m.metric}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-xs mt-4">Live data populates once you connect your payment source.</p>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Every Revenue Metric That Matters</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stop guessing. Start knowing. Revenue Engines gives you the exact metrics serious founders obsess over.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-pink-500/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to see your revenue engine run?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Connect your payment source and get a live revenue dashboard in under 60 seconds.
        </p>
        <Link
          href="/start"
          className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
