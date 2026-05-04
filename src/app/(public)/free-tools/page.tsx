'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  CreditCard,
  Search,
  BarChart3,
  Map,
  Calculator,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';

/* ──────────────────────────── TOOLS DATA ──────────────────────────── */

const tools = [
  {
    icon: Building2,
    title: 'Incorporate Your Business',
    description:
      'Choose the right entity type, generate formation documents, and file with your state — guided step by step with AI.',
    href: '/free-tools/incorporate',
    color: 'red',
  },
  {
    icon: FileText,
    title: 'Get Your EIN',
    description:
      'Apply for your Employer Identification Number instantly. We walk you through every IRS field so nothing gets rejected.',
    href: '/free-tools/ein',
    color: 'violet',
  },
  {
    icon: CreditCard,
    title: 'Credit Score Check',
    description:
      'See where you stand across all three bureaus. Soft pull only — zero impact on your score, full tri-bureau breakdown.',
    href: '/free-tools/credit-check',
    color: 'blue',
  },
  {
    icon: Search,
    title: 'Soft Pull Pre-Qualification',
    description:
      'Find out what you qualify for before you apply. AI matches your profile to real lender criteria with no hard inquiry.',
    href: '/free-tools/prequal',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'SBS Score Simulator',
    description:
      'Model how paying off balances, removing derogatories, or adding tradelines will change your Small Business Score.',
    href: '/free-tools/sbs-simulator',
    color: 'amber',
  },
  {
    icon: Map,
    title: 'Business Credit Roadmap',
    description:
      'Get a personalized step-by-step plan to build business credit from scratch. Tier 1 through Tier 4, mapped out for you.',
    href: '/free-tools/credit-roadmap',
    color: 'cyan',
  },
  {
    icon: Calculator,
    title: 'Funding Calculator',
    description:
      'Estimate how much funding you can access based on your revenue, credit profile, and time in business. Instant results.',
    href: '/free-tools/funding-calculator',
    color: 'pink',
  },
  {
    icon: ClipboardCheck,
    title: 'Document Checklist',
    description:
      'Know exactly what paperwork you need before applying for funding. Customized by loan type, entity, and lender requirements.',
    href: '/free-tools/document-checklist',
    color: 'orange',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'hover:border-red-500/20',     glow: 'group-hover:shadow-red-500/5' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'hover:border-violet-500/20',  glow: 'group-hover:shadow-violet-500/5' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'hover:border-blue-500/20',    glow: 'group-hover:shadow-blue-500/5' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'hover:border-emerald-500/20', glow: 'group-hover:shadow-emerald-500/5' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'hover:border-amber-500/20',   glow: 'group-hover:shadow-amber-500/5' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'hover:border-cyan-500/20',    glow: 'group-hover:shadow-cyan-500/5' },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'hover:border-pink-500/20',    glow: 'group-hover:shadow-pink-500/5' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'hover:border-orange-500/20',  glow: 'group-hover:shadow-orange-500/5' },
};

/* ──────────────────────────── LEAD CAPTURE MODAL ──────────────────────────── */

function LeadCaptureModal({
  tool,
  onClose,
}: {
  tool: (typeof tools)[number];
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/public/lead-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          source: 'free-tools',
          tool: tool.title,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      }).catch(() => {
        // Silently fail — still show success so user can access tool
      });
    } catch {
      // Silently fail
    }

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card backdrop-blur-2xl p-8 text-center shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">You&apos;re In</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecting you to {tool.title} now.
          </p>
          <Link
            href={tool.href}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
          >
            Open Tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card backdrop-blur-2xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${colorMap[tool.color].bg}`}>
          <tool.icon className={`h-6 w-6 ${colorMap[tool.color].text}`} />
        </div>

        <h3 className="text-center text-xl font-semibold text-white">
          {tool.title}
        </h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your info to access this free tool. No credit card required.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-border focus:bg-white/[0.05]"
          />
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-border focus:bg-white/[0.05]"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-border focus:bg-white/[0.05]"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Free'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our{' '}
          <Link href="/terms" className="text-muted-foreground underline hover:text-muted-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-muted-foreground underline hover:text-muted-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function FreeToolsPage() {
  const [activeTool, setActiveTool] = useState<(typeof tools)[number] | null>(null);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-red-400" />
            100% Free &mdash; No Credit Card
          </div>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Free Business Tools
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Everything you need to form your business, check your credit, estimate funding,
            and build a credit roadmap &mdash; all free, all AI-powered.
          </p>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => {
              const c = colorMap[tool.color];
              return (
                <button
                  key={tool.title}
                  onClick={() => setActiveTool(tool)}
                  className={`group relative flex flex-col rounded-2xl border border-border bg-card backdrop-blur-xl p-7 text-left transition-all duration-200 ${c.border} hover:shadow-xl ${c.glow}`}
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg}`}>
                    <tool.icon className={`h-5 w-5 ${c.text}`} />
                  </div>

                  <h3 className="mb-2 text-[15px] font-medium text-white leading-snug">
                    {tool.title}
                  </h3>

                  <p className="mb-6 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-400 transition-colors group-hover:text-red-300">
                    Start Free
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Need the{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Full Platform?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              These free tools are powered by the same AI that runs the full Memelli operating system.
              Upgrade to unlock credit repair, lender matching, CRM, and more.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-white"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lead Capture Modal ── */}
      {activeTool && (
        <LeadCaptureModal
          tool={activeTool}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}
