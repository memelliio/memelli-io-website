'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🛒',
    title: 'Commerce Engine',
    description: 'Sell products, run auctions, manage subscriptions, and track payments — all without a third-party platform.',
    gradient: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/20',
  },
  {
    icon: '🎯',
    title: 'CRM Engine',
    description: 'Track deals, manage contacts, visualize pipelines, and close more sales with AI-powered insights.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: '🎓',
    title: 'Coaching Engine',
    description: 'Deliver courses, track student progress, issue certificates, and monetize your expertise at scale.',
    gradient: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/20',
  },
  {
    icon: '📈',
    title: 'SEO Engine',
    description: 'Generate content, rank on Google, track keyword positions, and drive free traffic to your business.',
    gradient: 'from-blue-500/20 to-violet-500/10',
    border: 'border-blue-500/20',
  },
];

const aiCommands = [
  'Add 50 contacts from my CSV',
  'Generate 30 SEO articles for my niche',
  'Show me this month\'s revenue breakdown',
  'Create a new sales pipeline for Q2',
  'Draft a drip email campaign for new leads',
  'Summarize all overdue deals this week',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Public Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Memelli OS
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Now in early access — join 500+ entrepreneurs
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            The AI Business OS
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Built for Entrepreneurs
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Commerce. CRM. Coaching. SEO. All in one place, powered by AI. Stop stitching together
            a dozen tools — Memelli OS does it all.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 hover:shadow-blue-500/30 sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-border bg-muted px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted/80 sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          {/* Fake Dashboard Visual */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-blue-900/20">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <div className="ml-4 h-5 w-48 rounded bg-muted" />
              </div>
              {/* Dashboard layout */}
              <div className="grid grid-cols-4 gap-3 p-4">
                {/* Sidebar */}
                <div className="col-span-1 space-y-2">
                  <div className="h-6 w-full rounded bg-blue-500/20" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                  <div className="h-4 w-3/5 rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                  <div className="h-4 w-2/5 rounded bg-muted" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
                  <div className="h-4 w-3/5 rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                </div>
                {/* Main content */}
                <div className="col-span-3 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
                      <div className="mt-2 h-6 w-1/2 rounded bg-blue-500/40" />
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
                      <div className="mt-2 h-6 w-1/2 rounded bg-blue-500/40" />
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
                      <div className="mt-2 h-6 w-1/2 rounded bg-green-500/40" />
                    </div>
                  </div>
                  {/* Chart bar */}
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="mb-2 h-3 w-1/3 rounded bg-muted-foreground/30" />
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-blue-500/40"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Table rows */}
                  <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                    {[1, 2, 3].map((r) => (
                      <div key={r} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-blue-500/30" />
                        <div className="h-3 flex-1 rounded bg-muted-foreground/20" />
                        <div className="h-3 w-12 rounded bg-green-500/30" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Four Engines.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                One OS.
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything your business needs, deeply integrated and AI-ready.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-xl border ${f.border} bg-gradient-to-br ${f.gradient} p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10`}
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-background to-background">
            <div className="px-8 pt-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Tell Memelli what you need.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  It gets it done.
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Natural language commands that drive real actions across your entire business.
                No more clicking through menus.
              </p>
            </div>

            {/* Terminal */}
            <div className="mt-10 mx-8 mb-0 overflow-hidden rounded-t-xl border border-b-0 border-border bg-[#0d0d0d]">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-muted-foreground">Memelli AI Terminal</span>
              </div>
              <div className="space-y-3 p-5 font-mono text-sm">
                {aiCommands.map((cmd, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 text-blue-500">$</span>
                    <span className={i === 0 ? 'text-foreground' : 'text-muted-foreground/70'}>
                      {cmd}
                    </span>
                    {i === 0 && (
                      <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-blue-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to run your entire business
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              from one place?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of entrepreneurs already using Memelli OS to grow faster.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-8 mt-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-blue-700">
                <span className="text-xs font-bold text-white">M</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">Memelli OS</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Memelli OS. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
