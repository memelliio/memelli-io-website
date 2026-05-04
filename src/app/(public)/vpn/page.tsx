'use client';

import Link from 'next/link';
import { Shield, Globe, EyeOff, Bot, MousePointerClick, ArrowRight, Wifi, Zap } from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Globe,
    title: 'Residential IP Addresses',
    description: 'Route traffic through real residential IPs across 40+ countries. Bypass geo-blocks and appear as a genuine local user wherever you need.',
  },
  {
    icon: EyeOff,
    title: 'Zero Logs Policy',
    description: 'We never record your browsing activity, connection timestamps, or IP history. Your privacy is absolute — no exceptions.',
  },
  {
    icon: Bot,
    title: 'Agent Task Routing',
    description: 'AI agents on your account automatically route their web tasks through the VPN. Scraping, research, and automation stay private by default.',
  },
  {
    icon: MousePointerClick,
    title: 'One-Click Setup',
    description: 'Connect in seconds from your dashboard. No config files, no manual setup. Pick a country, click connect, and you are online.',
  },
];

const stats = [
  { value: '40+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Unlimited', label: 'Bandwidth' },
];

/* ──────────────────────────── NAV ──────────────────────────── */

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-[hsl(var(--background))] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-bold tracking-widest text-white">
          MEMELLI.IO
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/start"
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all hover:bg-green-400 hover:shadow-[0_0_24px_rgba(34,197,94,0.35)]"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function VpnPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-40">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-green-500/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-400" />
            Infinity VPN
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Browse Private,
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Work Free
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Residential IPs, zero logs, and AI-native agent routing — the VPN built
            for modern teams and autonomous workflows.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(34,197,94,0.3)] transition-all hover:bg-green-400 hover:shadow-[0_0_36px_rgba(34,197,94,0.4)]"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/vpn"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur-xl transition-all hover:border-white/[0.14] hover:bg-muted"
            >
              Open VPN Dashboard
            </Link>
            <Link
              href="/dashboard/vpn-browser"
              className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-7 py-3.5 text-base font-semibold text-green-300 backdrop-blur-xl transition-all hover:border-green-500/40 hover:bg-green-500/10"
            >
              <Wifi className="h-4 w-4" />
              Try with VPN Browser
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-3 divide-x divide-white/[0.04] rounded-2xl border border-border bg-card backdrop-blur-xl">
            {stats.map((s) => (
              <div key={s.label} className="py-10 text-center">
                <div className="text-3xl font-bold text-green-400">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Privacy built for{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                AI workflows
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every feature designed for teams running automation at scale.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-green-500/[0.04]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
                  <f.icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border border-green-500/10 bg-green-500/5 px-10 py-14 backdrop-blur-xl">
            <Zap className="mx-auto mb-6 h-10 w-10 text-green-400" />
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to go{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                fully private?
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Connect in seconds. No credit card required for the free tier.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(34,197,94,0.3)] transition-all hover:bg-green-400"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/vpn"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur-xl transition-all hover:border-white/[0.14]"
              >
                Open VPN Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
