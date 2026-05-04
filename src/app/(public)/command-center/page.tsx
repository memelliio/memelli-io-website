'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🎛️',
    title: 'Unified Operations Dashboard',
    description:
      'Every agent, workflow, task queue, and system alert in one command view. See the heartbeat of your entire business operation — live.',
  },
  {
    icon: '📡',
    title: 'Real-Time Dispatch',
    description:
      'Dispatch tasks to any agent pool instantly. Override routing rules, escalate priority, and inject work directly into any queue from the command panel.',
  },
  {
    icon: '👁️',
    title: 'Agent Monitoring',
    description:
      'See every active agent, what task it is executing, how long it has been running, and its output as it generates — in real time.',
  },
  {
    icon: '🚨',
    title: 'Alert Center',
    description:
      'Configurable alert rules for queue depth, agent errors, SLA breaches, revenue anomalies, and system health. Get notified the moment something needs attention.',
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    description:
      'Admins see everything. Managers see their department. Team members see their own queue. Granular permissions ensure the right eyes are on the right data.',
  },
  {
    icon: '📊',
    title: 'Operations Reports',
    description:
      'Daily, weekly, and monthly ops reports generated automatically. Agent throughput, task completion rates, queue efficiency, and SLA compliance — all summarized.',
  },
];

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(129,140,248,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-medium text-indigo-400 mb-8">
            Command Center · Dispatch · Monitor · Control
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Command Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Entire Operation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            One control room for every agent, workflow, task, and alert in your business.
            Dispatch work, monitor execution, and resolve issues — all from a single pane.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
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

      {/* Live status indicators */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 'All Systems', label: 'Status', sub: 'Operational' },
            { value: '∞', label: 'Active Agents', sub: 'Monitored live' },
            { value: '0', label: 'Open Alerts', sub: 'Updated every 5s' },
            { value: '99.9%', label: 'Uptime', sub: 'Last 30 days' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-indigo-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5 font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Total Operational Visibility</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From high-level business health to individual agent task output — Command Center shows you everything.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-indigo-500/20 transition-all"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What you can control */}
      <div className="border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-4">Everything Under Your Control</h2>
            <p className="text-muted-foreground">Click to act. No code. No tickets. Just command.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                category: 'Dispatch',
                items: ['Send task to any agent', 'Escalate priority instantly', 'Override queue routing', 'Inject bulk work items'],
              },
              {
                category: 'Monitor',
                items: ['Live agent execution feed', 'Queue depth by pool', 'SLA breach tracker', 'Error log & replay'],
              },
              {
                category: 'Control',
                items: ['Pause / resume any agent', 'Drain pool safely', 'Kill runaway processes', 'Force re-queue failed tasks'],
              },
            ].map((c) => (
              <div
                key={c.category}
                className="rounded-xl border border-border bg-white/[0.02] p-6"
              >
                <div className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-widest">{c.category}</div>
                <ul className="space-y-2">
                  {c.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to take command?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Every Memelli OS account includes Command Center. See your entire operation from one screen.
        </p>
        <Link
          href="/start"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
