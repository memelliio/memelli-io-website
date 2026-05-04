'use client';

import Link from 'next/link';
import { Button } from '@memelli/ui';
import {
  GraduationCap,
  BookOpen,
  Video,
  Award,
  Bot,
  Zap,
  ArrowRight,
  BarChart3,
  Brain,
  Users,
  Layers,
  ClipboardCheck,
} from 'lucide-react';

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  {
    icon: Layers,
    title: 'Program Builder',
    description:
      'Design complete coaching programs in minutes. AI generates modules, lessons, quizzes, and assignments based on your expertise and goals.',
  },
  {
    icon: Brain,
    title: 'AI Coach',
    description:
      'An always-on AI coaching assistant that answers student questions, provides personalized feedback, and guides learners through your curriculum 24/7.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description:
      'Track completion rates, quiz performance, engagement metrics, and student satisfaction. AI identifies at-risk learners before they drop off.',
  },
  {
    icon: Award,
    title: 'Certificates',
    description:
      'Issue branded certificates automatically upon program completion. Track credentials, validate achievements, and build student portfolios.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quiz Engine',
    description:
      'Create adaptive quizzes and assessments that adjust difficulty based on student performance. AI generates questions from your content automatically.',
  },
  {
    icon: Users,
    title: 'Student Portal',
    description:
      'A dedicated portal where students access lessons, track progress, earn certificates, and interact with AI coaching — all under your brand.',
  },
];

const steps = [
  { num: '01', title: 'Define Your Expertise', description: 'Tell AI your subject matter and target audience.' },
  { num: '02', title: 'AI Builds Your Program', description: 'Modules, lessons, quizzes, and assignments generated instantly.' },
  { num: '03', title: 'Enroll Students', description: 'Accept registrations with automated onboarding and drip scheduling.' },
  { num: '04', title: 'AI Coaches & Certifies', description: 'Students learn with AI support and earn branded certificates.' },
];

const agents = [
  {
    name: 'Coaching Director',
    role: 'Orchestrates your entire program',
    description:
      'Manages curriculum structure, schedules content releases, monitors program health, and optimizes the learning journey for maximum student outcomes.',
  },
  {
    name: 'Content Creator',
    role: 'Generates course material',
    description:
      'Drafts lesson content, creates quiz questions, builds assignments, and generates supplementary materials aligned with your teaching style.',
  },
  {
    name: 'Student Guide',
    role: 'Supports every learner',
    description:
      'Answers student questions in real time, provides personalized study recommendations, sends progress nudges, and escalates complex issues to you.',
  },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function CoachingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white">
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden px-6 pb-32 pt-36">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[800px] w-[800px] rounded-full bg-red-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-5 py-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-red-400" />
            Coaching Engine
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            AI Coaching
            <br />
            <span className="bg-gradient-to-r from-red-400 via-violet-400 to-red-500 bg-clip-text text-transparent">
              Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Create professional coaching programs, deliver engaging content, and let AI handle
            student support — scale your expertise without scaling your time.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create Your First Program
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Teach at Scale
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete coaching platform with AI woven into every step of the learning journey.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                  <f.icon className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Agents ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted backdrop-blur-xl px-4 py-1.5 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5 text-red-400" />
              AI Agents
            </div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your AI Coaching{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Team
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Specialized AI agents that build content, guide students, and manage your programs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-200 hover:border-border"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                  <Zap className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-white">{agent.name}</h3>
                <p className="mt-1 text-sm font-medium text-red-400">{agent.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How It{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card backdrop-blur-xl">
                  <span className="text-sm font-semibold text-red-400">{s.num}</span>
                </div>
                <h3 className="mb-2 font-medium text-white">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to monetize your{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              expertise?
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join coaches and educators building AI-powered programs on Memelli.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create Your First Program
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
