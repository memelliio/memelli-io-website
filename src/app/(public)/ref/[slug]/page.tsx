import Link from 'next/link';

const highlights = [
  { stat: '10+', label: 'AI Products' },
  { stat: '50+', label: 'AI Agents' },
  { stat: '24/7', label: 'Always Working' },
];

const features = [
  {
    title: 'Full AI Workforce',
    desc: 'Get an entire team of AI agents that handle sales, marketing, operations, and support -- all working together.',
  },
  {
    title: 'No Technical Skills Needed',
    desc: 'Just tell your AI company what you need in plain English. No coding, no complex setup.',
  },
  {
    title: 'Scale Instantly',
    desc: 'Add new AI agents, products, and capabilities on demand. Your company grows as fast as you do.',
  },
  {
    title: 'Works While You Sleep',
    desc: 'Your AI workforce operates 24/7. Wake up to completed tasks, new leads, and growing revenue.',
  },
];

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // In production, you'd fetch affiliate data from the database using the slug.
  // For now we derive a display name from the slug.
  const affiliateName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-red-600/[0.04] blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-violet-600/[0.03] blur-[120px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Affiliate badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-red-500/15 bg-red-500/5 px-5 py-2 text-sm text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Referred by {affiliateName}
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-white/90">
            Your AI Company,
            <br />
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-violet-500 bg-clip-text text-transparent">
              Ready to Work
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg text-muted-foreground font-light">
            {affiliateName} thinks you&apos;d love Memelli OS -- the operating system that gives you
            an entire AI workforce running your business 24/7.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/register?ref=${slug}`}
              className="w-full rounded-xl bg-red-600 px-10 py-4 text-lg font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500 sm:w-auto"
            >
              Start Your AI Company Free
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-10 py-4 text-lg font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-border sm:w-auto"
            >
              View Pricing
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-md grid-cols-3 gap-6">
            {highlights.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-semibold bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                  {s.stat}
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white/90">
            Why Entrepreneurs Choose{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Memelli
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7 transition-all duration-250 hover:border-red-500/15 hover:bg-card"
              >
                <h3 className="mb-2 text-sm font-semibold text-white/90">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Social proof */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-red-500/10 bg-card backdrop-blur-xl p-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white/90">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
                Forward-Thinking Entrepreneurs
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground font-light">
              Businesses are replacing entire teams with Memelli OS. One platform,
              50+ AI agents, zero employees to manage.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">100x</div>
                <p className="text-sm text-muted-foreground font-light">
                  Faster than building a team
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">$0</div>
                <p className="text-sm text-muted-foreground font-light">
                  Salaries or benefits required
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7">
                <div className="mb-3 text-2xl font-semibold text-red-400">24/7</div>
                <p className="text-sm text-muted-foreground font-light">
                  Your AI company never stops
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-28 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white/90">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground font-light">
            {affiliateName} invited you for a reason. Start your free trial today --
            no credit card required.
          </p>
          <Link
            href={`/register?ref=${slug}`}
            className="mt-10 inline-block w-full rounded-xl bg-red-600 px-10 py-4 text-lg font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500 sm:w-auto"
          >
            Start Your AI Company Free
          </Link>
        </div>
      </section>
    </div>
  );
}
