'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Cpu, Layers, Zap, Shield, Code2, Activity, Users, Bot,
  ArrowRight, GitCommit, Clock, CheckCircle, Terminal, Sparkles,
  Radio, Eye, Wrench, MessageSquare, BarChart3, Network,
  ChevronRight, Globe, Brain, Workflow, Server, Database,
  Lock, RefreshCw, Target, TrendingUp, Mic, Volume2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const RED = '#E11D2E';
const BLUE = '#3B82F6';
const RED_GLOW = 'rgba(225, 29, 46, 0.15)';
const BLUE_GLOW = 'rgba(59, 130, 246, 0.15)';

/* ── Stats ────────────────────────────────────────────────────────────────────── */

interface Stat {
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const STATS: Stat[] = [
  { value: 262, suffix: '+', label: 'Pages Built', color: BLUE },
  { value: 50000, suffix: '+', label: 'Lines of TypeScript', color: RED },
  { value: 43, suffix: '', label: 'Doctrine Stages', color: BLUE },
  { value: 13, suffix: '', label: 'Agent Pools', color: RED },
  { value: 9, suffix: '', label: 'Worker Queues', color: BLUE },
  { value: 35, suffix: '+', label: 'API Integrations', color: RED },
  { value: 16, suffix: '', label: 'Agents in Single Session', color: BLUE },
  { value: 10434, suffix: '', label: 'Lines in One Commit', color: RED },
  { value: 28.9, suffix: 's', label: 'Compile Time', color: BLUE },
  { value: 0, suffix: '', label: 'Type Errors', color: '#10B981' },
];

/* ── Agent Pools ──────────────────────────────────────────────────────────────── */

interface Pool {
  name: string;
  agents: number;
  icon: typeof Cpu;
  color: string;
}

const AGENT_POOLS: Pool[] = [
  { name: 'CRM Pool', agents: 12, icon: Users, color: '#3B82F6' },
  { name: 'Commerce Pool', agents: 12, icon: BarChart3, color: '#10B981' },
  { name: 'Coaching Pool', agents: 10, icon: Brain, color: '#8B5CF6' },
  { name: 'SEO Pool', agents: 10, icon: Target, color: '#F59E0B' },
  { name: 'DeployOps Pool', agents: 8, icon: Server, color: '#EF4444' },
  { name: 'Communication Pool', agents: 8, icon: MessageSquare, color: '#06B6D4' },
  { name: 'Security Pool', agents: 6, icon: Shield, color: '#EC4899' },
  { name: 'Analytics Pool', agents: 6, icon: Activity, color: '#14B8A6' },
  { name: 'AI Orchestration Pool', agents: 8, icon: Cpu, color: '#6366F1' },
  { name: 'Patrol Grid Pool', agents: 6, icon: Radio, color: '#F97316' },
  { name: 'Task Grid Pool', agents: 8, icon: Layers, color: '#84CC16' },
  { name: 'Data Fabric Pool', agents: 6, icon: Database, color: '#A855F7' },
  { name: 'Integration Pool', agents: 6, icon: Network, color: '#0EA5E9' },
];

/* ── Flow Steps ───────────────────────────────────────────────────────────────── */

interface FlowStep {
  step: number;
  label: string;
  detail: string;
  icon: typeof Cpu;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  { step: 1, label: 'Owner Directive', detail: 'Voice, text, or screenshot input', icon: Mic, color: '#F59E0B' },
  { step: 2, label: 'Melli Receives', detail: 'Classifies intent and priority', icon: Globe, color: RED },
  { step: 3, label: 'Routes to Claude', detail: 'Task decomposition begins', icon: Brain, color: BLUE },
  { step: 4, label: 'Decompose Tasks', detail: 'Break into parallel micro-tasks', icon: Workflow, color: '#8B5CF6' },
  { step: 5, label: 'Agent Pools Execute', detail: '40+ agents work simultaneously', icon: Users, color: '#10B981' },
  { step: 6, label: 'Self-Validation', detail: 'TypeScript checker, zero errors', icon: CheckCircle, color: '#06B6D4' },
  { step: 7, label: 'Auto Deploy', detail: 'Pipeline pushes to production', icon: Server, color: '#F97316' },
  { step: 8, label: 'Self-Healing', detail: 'Patrol grid catches any breaks', icon: RefreshCw, color: '#EC4899' },
];

/* ── Session Deliverables ─────────────────────────────────────────────────────── */

interface SessionItem {
  name: string;
  duration: number; // minutes
  start: number;    // minute offset
  color: string;
}

const SESSION_ITEMS: SessionItem[] = [
  { name: 'Marketing Ebook', start: 0, duration: 9, color: '#3B82F6' },
  { name: 'Power Slides', start: 0, duration: 4, color: '#10B981' },
  { name: 'Factory Live View', start: 1, duration: 6, color: '#8B5CF6' },
  { name: 'System Guide Upgrade', start: 2, duration: 10, color: '#F59E0B' },
  { name: 'Universe Map', start: 2, duration: 10, color: '#06B6D4' },
  { name: 'Melli Follower', start: 3, duration: 10, color: '#EC4899' },
  { name: 'TypeScript Checker', start: 4, duration: 3, color: '#EF4444' },
  { name: 'Deploy-Repair Bridge', start: 5, duration: 5, color: '#14B8A6' },
  { name: 'MUA Chat Fix', start: 6, duration: 4, color: '#A855F7' },
  { name: 'Orb Fix', start: 7, duration: 3, color: '#F97316' },
  { name: 'Window Manager', start: 8, duration: 2, color: '#84CC16' },
  { name: 'Claude Terminal', start: 3, duration: 10, color: '#0EA5E9' },
  { name: 'Session Dashboard', start: 4, duration: 10, color: '#6366F1' },
  { name: 'Globe System', start: 5, duration: 8, color: '#E11D2E' },
  { name: 'Deploy Agents', start: 1, duration: 12, color: '#D946EF' },
  { name: 'Self-Healing Mesh', start: 6, duration: 7, color: '#22D3EE' },
];

const SESSION_TOTAL_MIN = 14;

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 2000, trigger = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const isFloat = target % 1 !== 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(isFloat ? Math.round(current * 10) / 10 : Math.floor(current));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, trigger]);

  return count;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatCard({ stat, trigger }: { stat: Stat; trigger: boolean }) {
  const count = useCountUp(stat.value, stat.value > 1000 ? 2500 : 1800, trigger);
  const display = stat.value % 1 !== 0 ? count.toFixed(1) : count.toLocaleString();

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card">
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse at center, ${stat.color}10 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="text-3xl font-bold tracking-tight" style={{ color: stat.color }}>
          {display}{stat.suffix}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

function AIGlobe({ color, label, size = 120 }: { color: string; label: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`, transform: 'scale(1.5)' }} />
        {/* Core sphere */}
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${color}40`, background: `radial-gradient(circle at 35% 35%, ${color}25 0%, ${color}08 50%, transparent 70%)` }} />
        {/* Inner ring */}
        <div className="absolute inset-3 rounded-full border" style={{ borderColor: `${color}20` }} />
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}80` }} />
        {/* Orbiting ring */}
        <div className="absolute inset-0 rounded-full border border-dashed animate-spin" style={{ borderColor: `${color}15`, animationDuration: '20s' }} />
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION DIVIDER
   ═══════════════════════════════════════════════════════════════════════════════ */

function SectionDivider() {
  return (
    <div className="mx-auto my-0 h-px max-w-5xl" style={{ background: `linear-gradient(to right, transparent, ${RED}40, ${BLUE}40, transparent)` }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function ClaudePartnershipPage() {
  const statsView = useInView(0.15);
  const poolsView = useInView(0.15);
  const sessionView = useInView(0.15);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">

      {/* ─── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full blur-[140px]" style={{ background: RED_GLOW }} />
          <div className="absolute right-1/4 top-20 h-96 w-96 rounded-full blur-[140px]" style={{ background: BLUE_GLOW }} />
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Logos bar */}
          <div className="mb-10 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 backdrop-blur-xl">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RED, boxShadow: `0 0 8px ${RED}60` }} />
              <span className="text-sm font-medium text-muted-foreground">Memelli OS</span>
            </div>
            <span className="text-muted-foreground text-lg font-light">x</span>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 backdrop-blur-xl">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: BLUE, boxShadow: `0 0 8px ${BLUE}60` }} />
              <span className="text-sm font-medium text-muted-foreground">Anthropic Claude</span>
            </div>
          </div>

          {/* Globes */}
          <div className="mb-12 flex items-center justify-center gap-16">
            <AIGlobe color={RED} label="Melli" size={130} />
            {/* Connection beam */}
            <div className="relative hidden sm:block">
              <div className="h-px w-24" style={{ background: `linear-gradient(to right, ${RED}, ${BLUE})` }} />
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/40 animate-pulse" />
            </div>
            <AIGlobe color={BLUE} label="Claude" size={130} />
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">Memelli OS</span>
            <span className="text-muted-foreground mx-4">x</span>
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">Claude</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground leading-relaxed">
            What happens when an operating system is built entirely by AI
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Anthropic Claude -- Opus, Sonnet, and Haiku</span>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 1: The Partnership ──────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-400">
            <Brain className="h-3.5 w-3.5" />
            The Partnership
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Claude doesn&apos;t just power Memelli OS --{' '}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              Claude IS the architect
            </span>
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <Code2 className="mb-3 h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Every Line of Code</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                262+ pages, 50,000+ lines of TypeScript. Every service, every API route, every React component -- written by Claude. Not generated scaffolding. Production code.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Layers className="mb-3 h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Multi-Model Strategy</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Opus handles system architecture and doctrine. Sonnet writes features and integrations. Haiku powers fast classification and routing. Each model in its optimal role.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Cpu className="mb-3 h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold">AI as Operating System</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Not a chatbot. Not an assistant. Claude functions as the CPU of a living operating system -- decomposing tasks, managing agent pools, deploying code, and self-healing.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Shield className="mb-3 h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold">43-Stage Constitution</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Claude authored a 43-stage operating constitution -- from boot sequence to shutdown protocol, security grid to expansion protocol. A complete governance framework for autonomous operation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 2: By The Numbers ───────────────────────────────────────── */}
      <section className="px-6 py-24" ref={statsView.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            By The Numbers
          </div>

          <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
            Built at{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              machine speed
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map((s) => (
              <StatCard key={s.label} stat={s} trigger={statsView.inView} />
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 3: Two AI Personalities ─────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            Two AI Personalities
          </div>

          <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
            <span style={{ color: RED }}>Melli</span>
            <span className="text-muted-foreground mx-3">&</span>
            <span style={{ color: BLUE }}>Claude</span>
          </h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Melli Card */}
            <div className="rounded-xl border p-6" style={{ borderColor: `${RED}20`, background: `linear-gradient(135deg, ${RED}05 0%, transparent 60%)` }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${RED}15` }}>
                  <Globe className="h-5 w-5" style={{ color: RED }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: RED }}>Melli</h3>
                  <p className="text-xs text-muted-foreground">Customer-Facing AI Operator</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Role', value: 'Customer-facing AI operator' },
                  { label: 'Voice', value: 'Deepgram Aurora -- cheerful, expressive' },
                  { label: 'Wake Word', value: '"Hey Melli"' },
                  { label: 'Globe', value: 'Red (#E11D2E)' },
                  { label: 'Handles', value: 'Conversations, routing, customer service, intent classification' },
                ].map((row) => (
                  <div key={row.label} className="flex gap-3">
                    <span className="w-20 shrink-0 text-muted-foreground">{row.label}</span>
                    <span className="text-muted-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Claude Card */}
            <div className="rounded-xl border p-6" style={{ borderColor: `${BLUE}20`, background: `linear-gradient(135deg, ${BLUE}05 0%, transparent 60%)` }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${BLUE}15` }}>
                  <Brain className="h-5 w-5" style={{ color: BLUE }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: BLUE }}>Claude</h3>
                  <p className="text-xs text-muted-foreground">System Architect & Supervisor</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Role', value: 'System architect & supervisor' },
                  { label: 'Voice', value: 'Terminal -- precise, structured' },
                  { label: 'Wake Word', value: '"Hey Claude"' },
                  { label: 'Globe', value: 'Blue (#3B82F6)' },
                  { label: 'Handles', value: 'Architecture, builds, deploys, monitoring, self-healing' },
                ].map((row) => (
                  <div key={row.label} className="flex gap-3">
                    <span className="w-20 shrink-0 text-muted-foreground">{row.label}</span>
                    <span className="text-muted-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 4: How Claude Works Inside Memelli OS ───────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-400">
            <Workflow className="h-3.5 w-3.5" />
            System Flow
          </div>

          <h2 className="mb-12 text-3xl font-bold tracking-tight sm:text-4xl">
            How Claude works{' '}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              inside Memelli OS
            </span>
          </h2>

          {/* Flow diagram */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px sm:left-8" style={{ background: `linear-gradient(to bottom, ${RED}40, ${BLUE}40, ${RED}40)` }} />

            <div className="space-y-6">
              {FLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="group relative flex items-start gap-5 pl-2 sm:pl-4">
                    {/* Step circle */}
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300 group-hover:scale-110" style={{ borderColor: `${step.color}40`, background: `${step.color}15`, color: step.color }}>
                      {step.step}
                    </div>
                    {/* Content */}
                    <div className="flex-1 rounded-xl border border-border bg-card p-4 transition-all duration-300 group-hover:border-white/[0.10] group-hover:bg-card">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: step.color }} />
                        <h3 className="font-semibold text-foreground">{step.label}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                    {/* Arrow */}
                    {i < FLOW_STEPS.length - 1 && (
                      <ChevronRight className="absolute -bottom-4 left-[1.35rem] h-3.5 w-3.5 rotate-90 text-muted-foreground sm:left-[1.85rem]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 5: Agent Architecture ───────────────────────────────────── */}
      <section className="px-6 py-24" ref={poolsView.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Network className="h-3.5 w-3.5" />
            Agent Architecture
          </div>

          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Claude as{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CPU controller
            </span>
          </h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            40+ parallel agents operate as CPU cores. Claude decomposes every directive into micro-tasks, dispatches them across domain-specific pools, and monitors execution in real time.
          </p>

          {/* CPU Diagram */}
          <div className="mb-10 rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: `${BLUE}30`, background: `${BLUE}10` }}>
                <Cpu className="h-5 w-5" style={{ color: BLUE }} />
                <span className="text-sm font-semibold" style={{ color: BLUE }}>Claude CPU Controller</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: `${RED}30`, background: `${RED}10` }}>
                <Globe className="h-5 w-5" style={{ color: RED }} />
                <span className="text-sm font-semibold" style={{ color: RED }}>Melli Interface</span>
              </div>
            </div>

            {/* Pool Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {AGENT_POOLS.map((pool) => {
                const Icon = pool.icon;
                return (
                  <div key={pool.name} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-white/[0.10]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${pool.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: pool.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-muted-foreground">{pool.name}</div>
                      <div className="text-[10px] text-muted-foreground">{pool.agents} agents</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom labels */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3" /> Self-Healing Mesh</span>
              <span className="flex items-center gap-1.5"><Radio className="h-3 w-3" /> Patrol Grid</span>
              <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> Continuous Monitoring</span>
              <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3" /> Auto-Repair</span>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 6: Real Session Proof ───────────────────────────────────── */}
      <section className="px-6 py-24" ref={sessionView.ref}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-1.5 text-sm text-green-400">
            <GitCommit className="h-3.5 w-3.5" />
            Live Session Proof
          </div>

          <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
            March 15, 2026 Session
          </h2>
          <p className="mb-10 text-muted-foreground">
            16 agents deployed simultaneously. 10,434 lines committed. All running in parallel.
          </p>

          {/* Gantt Chart */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            {/* Timeline header */}
            <div className="mb-3 flex items-end border-b border-border pb-2">
              <div className="w-36 shrink-0 text-[10px] text-muted-foreground sm:w-44">AGENT</div>
              <div className="flex flex-1">
                {Array.from({ length: SESSION_TOTAL_MIN + 1 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
                    {i}m
                  </div>
                ))}
              </div>
            </div>

            {/* Bars */}
            <div className="space-y-1.5">
              {SESSION_ITEMS.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-36 shrink-0 truncate pr-2 text-[11px] text-muted-foreground sm:w-44">
                    {item.name}
                  </div>
                  <div className="relative flex-1 h-5">
                    <div
                      className="absolute top-0.5 h-4 rounded-sm transition-all duration-700"
                      style={{
                        left: `${(item.start / SESSION_TOTAL_MIN) * 100}%`,
                        width: sessionView.inView ? `${(item.duration / SESSION_TOTAL_MIN) * 100}%` : '0%',
                        backgroundColor: `${item.color}30`,
                        border: `1px solid ${item.color}50`,
                        transitionDelay: `${Math.random() * 400}ms`,
                      }}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 rounded-l-sm" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-blue-400" /> 16 agents</span>
              <span className="flex items-center gap-1.5"><Code2 className="h-3 w-3 text-green-400" /> 10,434 lines</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> ~14 min total</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-400" /> 0 type errors</span>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 7: What This Means ──────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Implications
          </div>

          <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
            What this{' '}
            <span className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              means
            </span>
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 text-3xl font-bold text-blue-400">Production Code</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI can build and operate entire SaaS platforms. Not mockups, not prototypes -- production code running on real infrastructure, serving real customers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 text-3xl font-bold text-red-400">Live Systems</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Self-healing deployment pipelines, autonomous agent pools, continuous monitoring. The system operates itself and repairs itself without human intervention.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-green-400">$20</span>
                <span className="text-sm text-muted-foreground">vs</span>
                <span className="text-lg text-muted-foreground line-through">$25,000</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The cost model changes everything. What previously required a team of engineers and months of salary now costs the price of a Claude subscription.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">1 hour</span>
                <span className="text-sm text-muted-foreground">vs</span>
                <span className="text-lg text-muted-foreground line-through">3 months</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The speed model changes everything. Features that take engineering teams quarters to deliver are built and deployed in a single session.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Section 8: Technical Integration ────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-400">
            <Terminal className="h-3.5 w-3.5" />
            Technical Integration
          </div>

          <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
            How Claude connects to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              the infrastructure
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: 'Multi-Key API Fleet', desc: '4 API keys operating as pooled lanes. Each key is an independent execution path.' },
              { icon: Code2, title: 'Anthropic SDK', desc: 'Direct SDK integration with Claude API. Opus for architecture, Sonnet for features, Haiku for speed.' },
              { icon: Activity, title: 'Rate Limiting', desc: 'Adaptive capacity probing every 30 seconds. Weighted distribution across all lanes.' },
              { icon: RefreshCw, title: 'Cooldown & Failover', desc: 'Circuit breaker at 20% failure rate. Automatic lane rotation on 429 responses.' },
              { icon: BarChart3, title: 'Budget Tracking', desc: 'Per-key usage monitoring. Tier-based cost allocation across Opus, Sonnet, and Haiku.' },
              { icon: Zap, title: 'Lane Autoscaling', desc: 'Capacity-weighted distribution formula. Small lane protection for tier 1 keys.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-white/[0.10]">
                  <Icon className="mb-3 h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 bottom-0 h-80 w-80 rounded-full blur-[120px]" style={{ background: RED_GLOW }} />
          <div className="absolute right-1/3 bottom-0 h-80 w-80 rounded-full blur-[120px]" style={{ background: BLUE_GLOW }} />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it{' '}
            <span className="bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent">
              in action
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Explore the platform that Claude built from the ground up.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/brochure"
              className="group flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${RED}, ${RED}CC)` }}
            >
              Explore Memelli OS
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/performance"
              className="group flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-7 py-3 text-sm font-semibold text-blue-400 transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              See Live Performance
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/start"
              className="group flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-border hover:bg-card"
            >
              Start Building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer Attribution ──────────────────────────────────────────────── */}
      <div className="border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          This page was built by Claude. Memelli OS is powered by Anthropic Claude AI.
        </p>
      </div>
    </div>
  );
}
