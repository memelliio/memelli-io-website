'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  Phone,
  MessageSquare,
  MessagesSquare,
  Bot,
  Headphones,
  Ticket,
  ArrowRight,
  Star,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Phone,
    title: 'Business Phone',
    description:
      'Get local and toll-free numbers with AI-powered call routing, recording, transcription, and analytics — all managed from one dashboard.',
  },
  {
    icon: MessageSquare,
    title: 'SMS Messaging',
    description:
      'Send and receive business text messages at scale with automated sequences, templates, and two-way conversations that close deals.',
  },
  {
    icon: MessagesSquare,
    title: 'Live Chat',
    description:
      'Embed a branded live chat widget on your site that seamlessly hands off between AI and human agents based on conversation complexity.',
  },
  {
    icon: Bot,
    title: 'AI Receptionist',
    description:
      'Never miss a call again. AI answers, qualifies callers, books appointments, and routes urgent requests — 24/7, in any language.',
  },
  {
    icon: Headphones,
    title: 'Call Center',
    description:
      'Full inbound and outbound call center with IVR menus, queue management, whisper coaching, and real-time supervisor dashboards.',
  },
  {
    icon: Ticket,
    title: 'Ticket System',
    description:
      'Every call, text, and chat auto-creates a support ticket with full context. AI suggests resolutions and escalates when needed.',
  },
];

const steps = [
  { num: '01', title: 'Connect Your Numbers', description: 'Port existing numbers or get new ones — local, toll-free, or international.' },
  { num: '02', title: 'Configure AI Agents', description: 'Set your greeting, qualification questions, routing rules, and escalation triggers.' },
  { num: '03', title: 'Go Live Instantly', description: 'Calls, texts, and chats start flowing through your AI-powered communications hub.' },
  { num: '04', title: 'AI Optimizes 24/7', description: 'Response times, resolution rates, and customer satisfaction improve automatically.' },
];

const testimonials = [
  {
    name: 'Daniel R.',
    role: 'Operations Manager',
    quote: 'The AI receptionist handles 80% of our calls without a human. Our team only deals with complex issues now.',
  },
  {
    name: 'Christine M.',
    role: 'Small Business Owner',
    quote: 'I replaced my answering service, chat widget, and SMS tool with Memelli Communications. One bill, one dashboard, way better.',
  },
  {
    name: 'Kevin P.',
    role: 'Support Lead',
    quote: 'The ticket system auto-categorizes and suggests resolutions before my agents even open them. Resolution time dropped 60%.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function CommunicationsPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white antialiased">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm font-medium text-red-300">
            <Phone className="h-4 w-4" />
            Communications Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI Phone, SMS &amp; Chat
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Operator
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Business phone, SMS, live chat, AI receptionist, call center, and ticketing — unified in one
            platform with AI agents handling everything.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-white/[0.14] text-muted-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Communicate Smarter
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete communications platform with AI baked into every channel.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-7 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-red-500/[0.04]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 p-3">
                  <f.icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How It{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">From zero to a fully automated communications hub in four steps.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-bold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-semibold tracking-tight text-white">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof / Testimonials ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Trusted by{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Businesses
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what teams are saying about Memelli Communications.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7 transition-all duration-200 hover:border-border"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-red-400 text-red-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple,{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              No hidden fees, no per-minute charges. One plan that scales with your call volume and includes every AI agent, every channel, every update.
            </p>
            <div className="mt-10">
              <Link href="/pricing">
                <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  See Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to upgrade your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              communications?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of businesses communicating smarter with Memelli Communications.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-500/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl border-border hover:border-white/[0.14] text-muted-foreground">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
