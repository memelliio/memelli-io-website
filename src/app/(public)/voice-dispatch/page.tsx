'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '📞',
    title: 'Intelligent Call Routing',
    description:
      'Every inbound call is analyzed in real time — caller ID, history, intent, and urgency — then routed to the right destination instantly.',
  },
  {
    icon: '🤖',
    title: 'AI Voice Agents',
    description:
      'AI answers calls, qualifies callers, handles FAQs, books appointments, and takes messages — with a natural voice that represents your brand.',
  },
  {
    icon: '👤',
    title: 'Smart Human Escalation',
    description:
      'When AI detects the call needs a human, it transfers with full context — caller name, intent, prior conversation summary — in real time.',
  },
  {
    icon: '📝',
    title: 'Auto Transcription & Summary',
    description:
      'Every call is transcribed, summarized, and logged to CRM automatically. No manual notes. No missed follow-ups. Perfect call record.',
  },
  {
    icon: '📊',
    title: 'Call Analytics Dashboard',
    description:
      'Track call volume, AI resolution rate, transfer rate, average handle time, and revenue attributed to calls — all in one dashboard.',
  },
  {
    icon: '🌐',
    title: 'Multi-Number & IVR',
    description:
      'Assign dedicated numbers per campaign, department, or channel. Build custom IVR trees with drag-and-drop logic in minutes.',
  },
];

export default function VoiceDispatchPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(245,158,11,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-amber-400 mb-8">
            Voice Dispatch · AI or Human · Real-Time
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Every Call Routed{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Perfectly
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI answers, qualifies, and handles calls — transferring to humans only when it
            truly matters. Your phone system is now a revenue machine.
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

      {/* Stats */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '70%', label: 'Calls Resolved by AI' },
            { value: '0', label: 'Missed Calls' },
            { value: '100%', label: 'Calls Transcribed' },
            { value: '<1s', label: 'Routing Decision' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-amber-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">The Phone System Your Business Deserves</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Replace your old phone system with AI-powered voice dispatch that scales infinitely and never misses a call.
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

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-border">
        <h2 className="text-3xl font-black mb-4">Ready to never miss another call?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Set up your AI voice dispatcher in minutes. Every call answered, every lead captured.
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
