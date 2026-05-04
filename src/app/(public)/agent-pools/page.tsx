'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🏊',
    title: 'Elastic Agent Pools',
    description:
      'Pools expand and contract automatically. Spin up thousands of agents for a campaign launch and scale back down overnight — paying only for what you use.',
  },
  {
    icon: '⚖️',
    title: 'Load Balancing',
    description:
      'Work distributes evenly across all agents in a pool. No single agent is overwhelmed while others sit idle. Maximum throughput, always.',
  },
  {
    icon: '🔒',
    title: 'Tenant Isolation',
    description:
      'Every pool is fully isolated per tenant. Your agents, your data, your execution environment — completely separate from every other account.',
  },
  {
    icon: '📊',
    title: 'Pool Health Monitoring',
    description:
      'Real-time dashboards show pool utilization, queue depth, error rates, and throughput. Detect anomalies before they become outages.',
  },
  {
    icon: '🧩',
    title: 'Specialized Sub-Pools',
    description:
      'Create dedicated pools per function — a sales pool, a support pool, a content pool. Each tuned for its specific domain and workload.',
  },
  {
    icon: '🔄',
    title: 'Drain & Restart Controls',
    description:
      'Gracefully drain a pool for maintenance without dropping tasks. Restart individual agents or whole pools with zero workflow interruption.',
  },
];

export default function AgentPoolsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(52,211,153,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-8">
            Agent Pools · Scale to Thousands
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Scale From One to{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Thousands
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Elastic agent pools that grow with your demand. Run one agent or ten thousand — the
            infrastructure scales automatically, the cost stays rational.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
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

      {/* Scale stats */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Max Agents per Pool' },
            { value: 'Auto', label: 'Scale Direction' },
            { value: '99.9%', label: 'Pool Uptime SLA' },
            { value: '0ms', label: 'Cold Start Penalty' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-emerald-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Enterprise-Grade Pooling Infrastructure</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The same pooling architecture powering Fortune 500 AI deployments — available to every Memelli OS customer.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-emerald-500/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to run at scale?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start with one agent. Scale to thousands without changing your code or your workflow.
        </p>
        <Link
          href="/start"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
