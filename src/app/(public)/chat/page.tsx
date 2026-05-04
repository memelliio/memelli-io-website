'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-First Chat Widget',
    description:
      'Your website chat is handled by AI first. It answers questions, qualifies leads, and books appointments before any human gets involved.',
  },
  {
    icon: '🔀',
    title: 'Seamless Human Handoff',
    description:
      'When AI detects a situation that needs human touch — frustration, complex request, or high-value opportunity — it transfers the chat instantly.',
  },
  {
    icon: '🧠',
    title: 'Knowledge Base Integration',
    description:
      'Connect your docs, FAQs, and product info. The AI answers questions accurately using your content — no hallucinations, no wrong answers.',
  },
  {
    icon: '📱',
    title: 'Omnichannel Inbox',
    description:
      'Website chat, SMS, WhatsApp, Instagram DMs — all conversations flow into one unified inbox. Agents and AI respond from the same place.',
  },
  {
    icon: '📊',
    title: 'Chat Analytics',
    description:
      'Track CSAT scores, resolution rates, first-response times, and revenue generated per conversation. Know exactly what chat is worth.',
  },
  {
    icon: '🎨',
    title: 'Fully Branded Widget',
    description:
      'Match your brand perfectly. Custom colors, logo, welcome message, and launcher position. Installs in 30 seconds with one line of code.',
  },
];

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(45,212,191,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-medium text-teal-400 mb-8">
            Live Chat · AI-First · Human When It Counts
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Chat That{' '}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Closes Deals
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI handles your chat 24/7 — qualifying leads, answering questions, booking calls.
            When a human is needed, the handoff is instant and context-perfect.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Add Chat to Your Site
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
            { value: '85%', label: 'Resolved by AI' },
            { value: '<3s', label: 'Avg First Response' },
            { value: '3x', label: 'More Leads Captured' },
            { value: '24/7', label: 'Always Available' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-teal-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">The Smartest Chat on Your Site</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Not a basic widget. A full AI support and sales agent embedded on every page of your site.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-teal-500/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to capture more leads from your site?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Install in 30 seconds. AI starts qualifying your visitors immediately.
        </p>
        <Link
          href="/start"
          className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
