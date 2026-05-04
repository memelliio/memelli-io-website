'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🚀',
    title: 'Burst Execution Mode',
    description:
      'When time-sensitive work hits, Speed Lanes instantly allocate dedicated compute — skipping the standard queue so critical tasks finish in seconds, not minutes.',
  },
  {
    icon: '⚡',
    title: 'Priority Escalation',
    description:
      'Define SLA thresholds. When a task breaches its deadline window, it auto-escalates into a Speed Lane — no human intervention required.',
  },
  {
    icon: '🧵',
    title: 'Dedicated Thread Pools',
    description:
      'Speed Lane tasks run in isolated thread pools, completely insulated from normal workload pressure. Zero contention, maximum throughput.',
  },
  {
    icon: '📡',
    title: 'Live Execution Feed',
    description:
      'Watch Speed Lane jobs execute in real time. See input, output, duration, and token usage for every task that ran in the fast lane.',
  },
  {
    icon: '🎛️',
    title: 'Configurable Lane Rules',
    description:
      'Set rules per workflow, per agent, or per task type. Choose which work earns Speed Lane access based on your business priorities.',
  },
  {
    icon: '📈',
    title: 'Throughput Analytics',
    description:
      'Track how many tasks used Speed Lanes, time-to-completion vs standard lane, and ROI of fast execution across your operations.',
  },
];

export default function SpeedLanesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(248,113,113,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 mb-8">
            ⚡ Speed Lanes · Burst AI Execution
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            When Seconds{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Matter Most
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Bypass the standard queue instantly. Speed Lanes give your most critical AI tasks
            dedicated burst capacity so they execute in seconds — every time.
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

      {/* Speed comparison */}
      <div className="border-y border-border py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-muted-foreground">Standard Lane vs. Speed Lane</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-white/[0.02] p-6 text-center">
              <div className="text-2xl font-black text-muted-foreground mb-1">12–45s</div>
              <div className="text-sm text-muted-foreground">Standard Queue</div>
              <div className="text-xs text-muted-foreground mt-2">Subject to load, shared resources</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <div className="text-2xl font-black text-red-400 mb-1">&lt;2s</div>
              <div className="text-sm text-red-400">Speed Lane</div>
              <div className="text-xs text-muted-foreground mt-2">Dedicated capacity, zero contention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Built for Business-Critical Speed</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Not every task needs a Speed Lane. But the ones that do will never wait.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-red-500/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to move at the speed of AI?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Enable Speed Lanes on your account and give your most important tasks the fast track they deserve.
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
