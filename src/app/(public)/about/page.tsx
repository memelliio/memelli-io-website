import Link from 'next/link';

const values = [
  {
    title: 'AI for Everyone',
    description:
      'We believe every entrepreneur deserves access to the same powerful tools that big corporations have -- without the enterprise price tag or technical barriers.',
  },
  {
    title: 'Radical Simplicity',
    description:
      'Complex technology should feel simple. Our platform does the heavy lifting so you can focus on growing your business, not fighting software.',
  },
  {
    title: 'Relentless Automation',
    description:
      'If a task can be automated, it should be. We build AI agents that work 24/7 so our customers never have to do repetitive work again.',
  },
  {
    title: 'Customer-First Engineering',
    description:
      'Every feature we build starts with a real customer need. We ship fast, iterate faster, and never stop listening.',
  },
  {
    title: 'Transparency',
    description:
      'Honest pricing, clear communication, no hidden fees. We grow when our customers grow -- our incentives are aligned.',
  },
  {
    title: 'Bold Vision',
    description:
      'We are building the future of work. Not incremental improvements -- a fundamental shift in how businesses operate.',
  },
];

const team = [
  { name: 'Coming Soon', role: 'CEO & Founder', image: null },
  { name: 'Coming Soon', role: 'CTO', image: null },
  { name: 'Coming Soon', role: 'Head of Product', image: null },
  { name: 'Coming Soon', role: 'Head of AI', image: null },
];

const milestones = [
  { year: '2024', event: 'Memelli founded with a vision to democratize AI business operations' },
  { year: '2024', event: 'First AI agent framework built and tested with early customers' },
  { year: '2025', event: 'Memelli OS launched with 10 integrated products' },
  { year: '2025', event: 'Affiliate program launched to scale through community' },
  { year: 'Next', event: 'Expanding AI workforce capabilities and industry verticals' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
          <div className="h-80 w-80 rounded-full bg-red-600/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card backdrop-blur-2xl px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(147,51,234,0.5)]" />
            Our Story
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            AI Companies{' '}
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              for Everyone
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            We started Memelli with a simple belief: every entrepreneur should be able to
            run a fully-staffed business without hiring a single employee. AI makes that
            possible. We make it simple.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-2xl p-10">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Our{' '}
                  <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
                    Mission
                  </span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  To give every entrepreneur an AI-powered company that works 24/7 -- handling
                  sales, marketing, operations, and customer support so they can focus on what
                  matters: their vision and their customers.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We are not building another tool. We are building the operating system for the
                  next generation of businesses -- where AI agents are your employees, and the
                  entire company runs autonomously.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Our{' '}
                  <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
                    Vision
                  </span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  A world where starting and running a business is as simple as describing what
                  you want. Where AI handles the execution, and humans focus on creativity,
                  relationships, and strategy.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We envision millions of AI-powered businesses launched through Memelli,
                  creating economic opportunity for people who previously couldn&apos;t afford to
                  hire a team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            What We{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Stand For
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-6 transition-all duration-200 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/[0.03]"
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            Our{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Journey
            </span>
          </h2>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-900/20 text-xs font-bold text-red-300">
                    {m.year}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="mt-2 h-full w-px bg-muted" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            The{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Team
            </span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-6 text-center transition-all duration-200 hover:border-red-500/20"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold text-foreground">
            Join the{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Revolution
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The future of business is autonomous. Be part of it.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 px-8 py-3 text-base font-semibold text-white shadow-[0_0_20px_rgba(147,51,234,0.15)] hover:shadow-[0_0_30px_rgba(147,51,234,0.25)] transition-all duration-200 sm:w-auto"
            >
              Start Your AI Company
            </Link>
            <Link
              href="/contact"
              className="w-full rounded-xl bg-muted hover:bg-muted border border-border px-8 py-3 text-base font-semibold text-foreground transition-all duration-200 sm:w-auto"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
