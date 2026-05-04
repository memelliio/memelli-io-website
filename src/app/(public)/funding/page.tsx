'use client';

import Link from 'next/link';

const FEATURES = [
  {
    icon: '💼',
    title: 'Business Credit Building',
    description:
      'Establish and grow your business credit profile with a structured program. Vendor tradelines, net-30 accounts, and tier-by-tier credit building — guided by AI.',
  },
  {
    icon: '🏦',
    title: 'Funding Match Engine',
    description:
      'AI analyzes your business profile and matches you to the highest-probability funding options — SBA loans, business lines of credit, equipment financing, and more.',
  },
  {
    icon: '🎯',
    title: 'Grant Discovery',
    description:
      'AI continuously scans federal, state, local, and private grant databases for funding your business qualifies for — and helps you apply.',
  },
  {
    icon: '📋',
    title: 'Application Autopilot',
    description:
      'Pre-fill applications with your business data, AI writes supporting narratives, and tracks submission status across all active applications in one dashboard.',
  },
  {
    icon: '📈',
    title: 'Funding Readiness Score',
    description:
      'Know exactly where you stand. Your Funding Readiness Score shows lenders what they see — and gives you a step-by-step plan to improve it.',
  },
  {
    icon: '🔔',
    title: 'Pipeline Alerts',
    description:
      'Get notified when a new grant opens, when a lender responds, when your credit score changes, and when new funding opportunities match your profile.',
  },
];

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20 px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, rgba(252,211,77,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-amber-600 mb-8">
            Funding Pipeline · Business Credit · Grants
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Get the Capital{' '}
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              Your Business Needs
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-powered funding pipeline that builds your business credit, finds the right
            lenders, discovers grants, and automates your applications — end to end.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/start"
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Your Funding Journey
            </Link>
            <Link
              href="/login"
              className="memelli-pill px-8 py-3 text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-8">
        <div className="memelli-card max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6 py-8">
          {[
            { value: '$250K+', label: 'Avg Funding Accessed' },
            { value: '1,200+', label: 'Grant Sources Scanned' },
            { value: '90 days', label: 'To First Approval' },
            { value: 'AI', label: 'Application Writing' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-amber-600">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Your Funding Team, Powered by AI</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stop leaving money on the table. The average business qualifies for funding they never knew existed.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="memelli-tile p-6"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funding stages */}
      <div className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-12">The Funding Pipeline Stages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stage: 'Stage 1', title: 'Foundation', desc: 'Build credit, register properly, establish vendor accounts.' },
              { stage: 'Stage 2', title: 'Visibility', desc: 'Grow credit score, open bank products, access higher limits.' },
              { stage: 'Stage 3', title: 'Scale', desc: 'Access SBA loans, revenue-based financing, private capital.' },
            ].map((s) => (
              <div
                key={s.stage}
                className="memelli-tile p-6 text-left"
              >
                <div className="text-xs font-bold text-amber-600 mb-1">{s.stage}</div>
                <div className="font-bold text-lg mb-2 text-foreground">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6">
        <h2 className="text-3xl font-black mb-4">Ready to unlock business capital?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start with a free Funding Readiness Score. See exactly where you stand and what to do next.
        </p>
        <Link
          href="/start"
          className="inline-block bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          Get Your Free Score
        </Link>
      </div>
    </div>
  );
}
