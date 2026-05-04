'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🤖',
    title: '40+ Specialized Agents',
    description:
      'Deploy a full AI workforce out of the box — sales agents, support agents, content agents, ops agents, and more. Each pre-trained for its role.',
  },
  {
    icon: '⚡',
    title: '24/7 Parallel Execution',
    description:
      'Agents run simultaneously around the clock. While you sleep, your AI workforce is qualifying leads, sending follow-ups, and processing tasks.',
  },
  {
    icon: '🧠',
    title: 'Context-Aware Intelligence',
    description:
      'Every agent has full memory of your business — your CRM, your contacts, your deals, your tone. No re-training, no prompting from scratch.',
  },
  {
    icon: '🔗',
    title: 'Cross-System Coordination',
    description:
      'Agents talk to each other. A lead qualifier passes hot leads to the sales agent, which triggers an email sequence and logs activity in CRM — automatically.',
  },
  {
    icon: '📊',
    title: 'Real-Time Agent Dashboard',
    description:
      'Monitor every agent live. See what tasks are running, what was completed, what was escalated, and what output was produced — second by second.',
  },
  {
    icon: '🛠️',
    title: 'Build Custom Agents',
    description:
      'Not enough? Build your own agents with natural-language instructions. Define goals, tools, triggers, and escalation rules — no code required.',
  },
];

export default function AiAgentsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(16,185,129,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-8">
            AI Workforce · 40+ Agents Live
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Your AI Workforce,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Always On
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            40+ specialized AI agents running in parallel — 24 hours a day, 7 days a week.
            Sales, support, operations, and content handled while you focus on growth.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Deploy Your AI Team
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

      {/* Stats bar */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '40+', label: 'Pre-built Agents' },
            { value: '24/7', label: 'Uptime Guarantee' },
            { value: '∞', label: 'Parallel Tasks' },
            { value: '<2s', label: 'Avg Response Time' },
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
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Everything Your Workforce Needs
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Not a chatbot. A full AI staff that executes, coordinates, and reports — just like a human team.
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

      {/* Agent roles showcase */}
      <div className="border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-4">Meet Your Team</h2>
            <p className="text-muted-foreground">A sample of the agents ready to work for you today.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Lead Qualifier', dept: 'Sales', desc: 'Scores and routes every inbound lead.' },
              { name: 'Follow-Up Agent', dept: 'Sales', desc: 'Sends personalized follow-ups on schedule.' },
              { name: 'Support Resolver', dept: 'Support', desc: 'Handles tier-1 support tickets end-to-end.' },
              { name: 'Content Writer', dept: 'Marketing', desc: 'Drafts blog posts, emails, and social copy.' },
              { name: 'Invoice Processor', dept: 'Finance', desc: 'Generates, sends, and tracks invoices.' },
              { name: 'Booking Agent', dept: 'Ops', desc: 'Manages calendar, confirms appointments.' },
            ].map((a) => (
              <div
                key={a.name}
                className="rounded-xl border border-border bg-white/[0.02] p-5 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  {a.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-emerald-400 mb-1">{a.dept}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to hire your AI workforce?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start free. Deploy 40+ agents in minutes. Watch your business run itself.
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
