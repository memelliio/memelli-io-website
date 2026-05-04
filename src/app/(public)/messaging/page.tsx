'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '📱',
    title: 'SMS & MMS Campaigns',
    description:
      'Blast personalized SMS or MMS messages to thousands of contacts in seconds. Rich media, GIFs, images — all supported with carrier-optimized delivery.',
  },
  {
    icon: '🤖',
    title: 'AI-Written Messages',
    description:
      'Stop staring at a blank message composer. AI generates personalized SMS copy based on contact data, behavior history, and your brand voice.',
  },
  {
    icon: '🔁',
    title: 'Drip & Sequence Flows',
    description:
      'Set up multi-step SMS sequences that run on autopilot. Day 1 welcome, day 3 check-in, day 7 offer — all automated and personalized.',
  },
  {
    icon: '💬',
    title: 'Two-Way Conversations',
    description:
      'Real two-way texting inbox. Customers reply and conversations are routed to the right rep or AI agent. Never miss a response.',
  },
  {
    icon: '📊',
    title: 'Delivery & Engagement Analytics',
    description:
      'Track delivery rates, open rates, reply rates, and conversions per message, per campaign, and per segment — in real time.',
  },
  {
    icon: '🔌',
    title: 'Omnichannel Sync',
    description:
      'Every SMS conversation is logged in CRM, linked to deals, and synced with your email and chat history. Full contact timeline, always.',
  },
];

export default function MessagingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(192,132,252,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/80/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            SMS · MMS · Omnichannel Messaging
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Text Your Customers.{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Convert More.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-powered SMS and MMS messaging that feels personal at scale. Campaigns,
            sequences, two-way conversations, and omnichannel sync — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Messaging Free
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
            { value: '98%', label: 'SMS Open Rate' },
            { value: '45%', label: 'Avg Reply Rate' },
            { value: '<5s', label: 'Delivery Time' },
            { value: '160+', label: 'Countries Supported' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Every Messaging Tool You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            SMS still has the highest open rate of any channel. Memelli OS makes it trivial to use it at full power.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-primary/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to reach customers where they actually read?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          SMS outperforms every other channel. Start your first campaign free today.
        </p>
        <Link
          href="/start"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
