'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Smart Task Routing',
    description:
      'Tasks are automatically assigned to the right person or agent based on skills, availability, workload, and priority — no manual triage.',
  },
  {
    icon: '📋',
    title: 'Priority Queues',
    description:
      'Every task gets a priority score. AI weighs urgency, business impact, and deadlines to surface the most important work at the top — always.',
  },
  {
    icon: '🤖',
    title: 'AI Task Generation',
    description:
      'Trigger task creation from CRM events, deal stage changes, form submissions, and workflow steps. No more forgetting critical follow-ups.',
  },
  {
    icon: '🔁',
    title: 'Recurring & Dependent Tasks',
    description:
      'Set tasks to repeat on schedule or chain tasks so follow-on work triggers automatically when prerequisites are complete.',
  },
  {
    icon: '📈',
    title: 'Team Capacity View',
    description:
      'See real-time workload across your entire team. Spot bottlenecks, redistribute work, and prevent burnout with capacity dashboards.',
  },
  {
    icon: '💬',
    title: 'Inline Collaboration',
    description:
      'Comment, mention teammates, attach files, and log time directly on tasks. Full audit trail on every action taken.',
  },
];

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 40% 20%, rgba(251,191,36,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-amber-400 mb-8">
            Task Engine · Smart Routing
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Tasks That Route{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Themselves
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Intelligent task management with AI-powered routing, priority queues, and automatic
            assignment. Stop managing tasks — start completing them.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
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

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">The Engine Behind Your Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Task management built for speed. Everything is assigned, tracked, and escalated automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-amber-500/20 transition-all"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How routing works */}
      <div className="border-t border-border py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-12">How Smart Routing Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { num: '01', label: 'Task Created', desc: 'By user, automation, or AI agent.' },
              { num: '02', label: 'AI Classifies', desc: 'Type, urgency, and required skill.' },
              { num: '03', label: 'Routed', desc: 'Assigned to best-fit human or agent.' },
              { num: '04', label: 'Executed & Logged', desc: 'Outcome tracked, next steps triggered.' },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-400 font-black text-sm">
                  {s.num}
                </div>
                <div className="font-semibold text-sm mb-1">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to clear your backlog?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Let AI route, prioritize, and assign every task. Your team focuses on execution.
        </p>
        <Link
          href="/start"
          className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
