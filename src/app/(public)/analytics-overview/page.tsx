'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '💹',
    title: 'Revenue Analytics',
    description:
      'Live revenue dashboards broken down by product, channel, rep, and time period. See what is driving growth and what is holding it back — in real time.',
  },
  {
    icon: '🧩',
    title: 'Cohort Analysis',
    description:
      'Group customers by acquisition date, source, or plan and track their behavior over time. Identify your best cohorts and double down on what acquires them.',
  },
  {
    icon: '💰',
    title: 'LTV Modeling',
    description:
      'Predictive lifetime value models per segment, channel, and product. Know exactly how much you can invest to acquire and retain each customer type.',
  },
  {
    icon: '📊',
    title: 'Funnel Analytics',
    description:
      'Visualize your entire customer journey from first touch to retention. See exactly where people drop off and what changes will move the needle most.',
  },
  {
    icon: '🎯',
    title: 'Campaign Attribution',
    description:
      'Multi-touch attribution across email, SMS, paid ads, organic, and referral. Know which channels are actually producing revenue — not just clicks.',
  },
  {
    icon: '🤖',
    title: 'AI Insights Engine',
    description:
      'AI surfaces the most important trends, anomalies, and opportunities in your data — proactively. No more digging for insights; they come to you.',
  },
];

export default function AnalyticsOverviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 55% 20%, rgba(236,72,153,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-1.5 text-xs font-medium text-pink-400 mb-8">
            Analytics · Revenue · Cohorts · LTV
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Data That Drives{' '}
            <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              Decisions
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Unified analytics across revenue, marketing, sales, and operations. AI surfaces
            the insights that matter so you can act fast and grow faster.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Free
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
            { value: '50+', label: 'Pre-built Dashboards' },
            { value: 'Real-Time', label: 'Data Refresh' },
            { value: 'AI', label: 'Insight Alerts' },
            { value: '100%', label: 'Cross-Module Data' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-pink-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Analytics Across Every Module</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every module in Memelli OS feeds into a unified analytics layer. One truth, across your entire business.
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

      {/* Dashboard categories */}
      <div className="border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-4">Pre-Built Dashboard Library</h2>
            <p className="text-muted-foreground">50+ dashboards ready to activate on day one.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Revenue Overview',
              'Sales Pipeline',
              'Churn & Retention',
              'Email Performance',
              'SMS Engagement',
              'Agent Productivity',
              'Funnel Conversion',
              'Customer LTV',
            ].map((d) => (
              <div
                key={d}
                className="rounded-lg border border-border bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground text-center"
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to see your business clearly?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Connect your data once. Every dashboard populates instantly. AI starts surfacing insights in minutes.
        </p>
        <Link
          href="/start"
          className="inline-block bg-red-600 hover:bg-red-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
