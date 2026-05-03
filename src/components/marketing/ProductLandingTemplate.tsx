import Link from 'next/link';
import type { Product } from '@memelli/ui';

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface AgentHighlight {
  name: string;
  role: string;
  description: string;
  status?: 'active' | 'standby' | 'learning';
}

interface ProductLandingTemplateProps {
  product: Product;
  heroTitle: string;
  heroSubtitle: string;
  features: Feature[];
  howItWorks: HowItWorksStep[];
  agentHighlights: AgentHighlight[];
  ctaText?: string;
  heroImage?: React.ReactNode;
}

function accentVar(accentColor: string) {
  return { '--product-accent': accentColor } as React.CSSProperties;
}

export default function ProductLandingTemplate({
  product,
  heroTitle,
  heroSubtitle,
  features,
  howItWorks,
  agentHighlights,
  ctaText = 'Get Started Free',
  heroImage,
}: ProductLandingTemplateProps) {
  return (
    <div className="bg-background text-foreground" style={accentVar(product.accentColor)}>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-[600px] w-[600px] rounded-full blur-3xl opacity-15"
            style={{ backgroundColor: `hsl(${product.accentColor})` }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
            style={{
              borderColor: `hsl(${product.accentColor} / 0.3)`,
              backgroundColor: `hsl(${product.accentColor} / 0.1)`,
              color: `hsl(${product.accentColor})`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: `hsl(${product.accentColor})` }}
            />
            {product.name}
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {heroSubtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-lg px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 sm:w-auto"
              style={{
                background: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.8))`,
                boxShadow: `0 10px 25px hsl(${product.accentColor} / 0.2)`,
              }}
            >
              {ctaText}
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-border bg-muted px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted/80 sm:w-auto"
            >
              View Pricing
            </Link>
          </div>

          {heroImage && <div className="mx-auto mt-16 max-w-3xl">{heroImage}</div>}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.6))`,
                }}
              >
                Succeed
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Powerful features, zero complexity. AI handles the heavy lifting.
            </p>
          </div>

          <div className={`grid gap-6 sm:grid-cols-2 ${features.length >= 4 ? 'lg:grid-cols-4' : features.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg"
                style={{
                  borderColor: `hsl(${product.accentColor} / 0.15)`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, hsl(${product.accentColor} / 0.08), transparent)`,
                  }}
                />
                <div className="relative">
                  <div className="mb-4 text-3xl">{f.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workforce Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: `hsl(${product.accentColor} / 0.3)`,
                backgroundColor: `hsl(${product.accentColor} / 0.1)`,
                color: `hsl(${product.accentColor})`,
              }}
            >
              AI-Powered Workforce
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Your AI{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.6))`,
                }}
              >
                {product.name}
              </span>{' '}
              Team
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Dedicated AI agents working around the clock so you don&apos;t have to.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agentHighlights.map((agent) => (
              <div
                key={agent.name}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                    style={{ backgroundColor: `hsl(${product.accentColor})` }}
                  >
                    AI
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        agent.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : agent.status === 'learning'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          agent.status === 'active'
                            ? 'bg-green-400 animate-pulse'
                            : agent.status === 'learning'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-muted-foreground'
                        }`}
                      />
                      {agent.status === 'active' ? 'Active' : agent.status === 'learning' ? 'Learning' : 'Standby'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How It{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.6))`,
                }}
              >
                Works
              </span>
            </h2>
          </div>

          <div className="space-y-0">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative flex gap-6 pb-12 last:pb-0">
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div
                    className="absolute left-5 top-12 h-full w-px"
                    style={{ backgroundColor: `hsl(${product.accentColor} / 0.2)` }}
                  />
                )}
                {/* Step number */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: `hsl(${product.accentColor})` }}
                >
                  {step.step}
                </div>
                {/* Content */}
                <div className="pt-1.5">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Link */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="rounded-2xl border p-10"
            style={{
              borderColor: `hsl(${product.accentColor} / 0.2)`,
              background: `linear-gradient(135deg, hsl(${product.accentColor} / 0.05), transparent)`,
            }}
          >
            <h2 className="text-2xl font-bold">
              {product.name} is included in every Memelli OS plan
            </h2>
            <p className="mt-3 text-muted-foreground">
              See what&apos;s included at every tier.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: `hsl(${product.accentColor})` }}
            >
              View Pricing Plans
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to put{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.6))`,
              }}
            >
              {product.name}
            </span>{' '}
            to work?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Your AI team is ready. No setup, no training, no hiring.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-lg px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 sm:w-auto"
              style={{
                background: `linear-gradient(135deg, hsl(${product.accentColor}), hsl(${product.accentColor} / 0.8))`,
                boxShadow: `0 10px 25px hsl(${product.accentColor} / 0.2)`,
              }}
            >
              {ctaText}
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
