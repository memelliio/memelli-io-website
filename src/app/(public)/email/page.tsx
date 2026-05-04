'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '✉️',
    title: 'Campaign Builder',
    description:
      'Design stunning emails with a drag-and-drop editor. Pre-built templates, custom HTML, mobile-responsive — launched with one click to any segment.',
  },
  {
    icon: '🔁',
    title: 'Automated Sequences',
    description:
      'Welcome series, onboarding flows, win-back campaigns, upsell sequences — build once, run forever. Every email personalized to the recipient.',
  },
  {
    icon: '🧠',
    title: 'AI Copywriting',
    description:
      'Generate subject lines, body copy, and CTAs with AI. A/B test automatically and let the system promote the winner without lifting a finger.',
  },
  {
    icon: '🎯',
    title: 'Smart Segmentation',
    description:
      'Segment by behavior, engagement score, purchase history, CRM stage, or any custom field. Send the right message to exactly the right people.',
  },
  {
    icon: '📊',
    title: 'Revenue Attribution',
    description:
      'Know exactly how much revenue each email, sequence, and campaign generated. Attribution that goes beyond opens and clicks.',
  },
  {
    icon: '🛡️',
    title: 'Deliverability Engine',
    description:
      'Built-in warm-up, dedicated IPs, DKIM/SPF/DMARC management, and spam score checking. Your emails land in the inbox — not spam.',
  },
];

export default function EmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 40% 20%, rgba(249,115,22,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-400 mb-8">
            Email · Campaigns · Sequences
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Email That{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Actually Converts
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-written campaigns and automated sequences that grow revenue while you sleep.
            Beautiful designs, inbox-perfect deliverability, and revenue attribution built in.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
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
            { value: '42:1', label: 'Avg Email ROI' },
            { value: '99%', label: 'Inbox Rate' },
            { value: 'AI', label: 'Copywriting Built-In' },
            { value: '∞', label: 'Sequences & Lists' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-orange-400">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Everything Email, Nothing Missing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Replace Mailchimp, ActiveCampaign, and Klaviyo with one platform that also runs your entire business.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-muted p-6 hover:border-orange-500/20 transition-all"
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
        <h2 className="text-3xl font-black mb-4">Ready to turn your list into revenue?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start sending AI-written emails in minutes. Your first 10,000 contacts are free.
        </p>
        <Link
          href="/start"
          className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
