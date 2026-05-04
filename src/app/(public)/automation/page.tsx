'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🔀',
    title: 'Visual Workflow Builder',
    description:
      'Drag-and-drop automation canvas. Connect triggers, conditions, actions, and branches without writing a single line of code.',
  },
  {
    icon: '🧠',
    title: 'AI-Powered Triggers',
    description:
      'Go beyond time-based triggers. AI detects intent signals, sentiment changes, and behavioral patterns to fire workflows at exactly the right moment.',
  },
  {
    icon: '⚡',
    title: 'Multi-Step Sequences',
    description:
      'Chain unlimited actions across your entire stack — CRM updates, email sends, SMS blasts, task creation, agent dispatches — in a single flow.',
  },
  {
    icon: '🔌',
    title: 'Deep Native Integrations',
    description:
      'Every Memelli OS module is a first-class automation citizen. Connect CRM, email, SMS, payments, coaching, and AI agents — no Zapier needed.',
  },
  {
    icon: '📊',
    title: 'Flow Analytics',
    description:
      'See exactly how many times each workflow ran, where contacts dropped off, and what revenue each automation directly influenced.',
  },
  {
    icon: '🛡️',
    title: 'Error Handling & Retry',
    description:
      'Built-in failure detection with automatic retries, fallback branches, and alert notifications so your automations never silently break.',
  },
];

export default function AutomationPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(56,189,248,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-4 py-1.5 text-xs font-medium text-sky-400 mb-8">
            Workflows & Automation
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Automate Everything.{' '}
            <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
              Miss Nothing.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Build visual workflows that run your business end-to-end. AI triggers, smart
            branching, and real-time execution — no engineers required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Automating Free
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
          <h2 className="text-3xl md:text-4xl font-black mb-4">Automation That Actually Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Most automation tools break. Memelli OS workflows are AI-reinforced and self-healing.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-sky-500/20 transition-all"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div className="border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-4">Popular Workflow Templates</h2>
            <p className="text-muted-foreground">Launch in seconds. Customize to your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'New Lead → Qualify → Nurture',
                desc: 'AI scores lead, sends welcome email, assigns to sales rep, schedules follow-up.',
              },
              {
                title: 'Deal Won → Onboarding Sequence',
                desc: 'Auto-creates client folder, sends welcome kit, books kickoff call.',
              },
              {
                title: 'Payment Failed → Recovery Flow',
                desc: 'Retry payment, send SMS alert, offer alternate payment method.',
              },
              {
                title: 'Review Request → Reputation Loop',
                desc: 'Post-purchase trigger sends review request at optimal open-rate time.',
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-xl border border-border bg-white/[0.02] p-5"
              >
                <div className="font-semibold text-sm mb-1">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to automate your growth?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Build your first workflow in under 5 minutes. No code. No Zapier. Just results.
        </p>
        <Link
          href="/start"
          className="inline-block bg-sky-600 hover:bg-sky-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
