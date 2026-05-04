'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  X,
  Check,
  Clock,
  DollarSign,
  Users,
  Bot,
  Cpu,
  Database,
  Globe,
  Layers,
  Rocket,
  ShoppingCart,
  GraduationCap,
  Search,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Code,
  Server,
  Brain,
  Activity,
  Target,
  TrendingUp,
  ChevronRight,
  Store,
  Scissors,
  UtensilsCrossed,
  BookOpen,
  Building2,
  Briefcase,
  Heart,
  Palette,
  Dumbbell,
  Camera,
  Music,
  Wrench,
  FileCode,
  Package,
  Terminal,
  Gauge,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─── constants ──────────────────────────────────────────────────── */
const ACCENT = '#E11D2E';
const TOTAL_SLIDES = 17;

/* ─── animated counter hook ──────────────────────────────────────── */
function useAnimatedCounter(target: number, active: boolean, duration = 2000, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setDisplay(`${prefix}0${suffix}`);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, target, duration, prefix, suffix]);

  return display;
}

/* ─── particle background ────────────────────────────────────────── */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 5 === 0 ? ACCENT : 'rgba(255,255,255,0.15)',
            animation: `particleFloat ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── slide wrapper ──────────────────────────────────────────────── */
function SlideShell({
  children,
  gradient,
}: {
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 overflow-hidden"
      style={{ background: gradient || 'transparent' }}
    >
      {children}
    </div>
  );
}

/* ─── Slide 1: Title ─────────────────────────────────────────────── */
function TitleSlide({ active }: { active: boolean }) {
  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 40%, rgba(225,29,46,0.12) 0%, transparent 70%)">
      <ParticleField />
      <div className={`relative z-10 text-center transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: ACCENT }}>
            <Zap className="w-8 h-8 text-[hsl(var(--foreground))]" />
          </div>
          <span className="text-[hsl(var(--muted-foreground))] text-xl font-medium tracking-widest uppercase">Memelli OS</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[hsl(var(--foreground))] mb-6 leading-tight">
          The <span style={{ color: ACCENT }}>$20</span> Build Factory
        </h1>
        <p className="text-xl md:text-2xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
          Full-stack SaaS platforms built by AI agents in under an hour.
        </p>
        <div className="flex items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
          <span className="text-sm">Use arrow keys to navigate</span>
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 2: The Old Way ───────────────────────────────────────── */
function OldWaySlide({ active }: { active: boolean }) {
  const items = [
    { label: 'Hire a Dev Agency', cost: '$25,000 - $50,000', time: '3-6 months', delay: 0 },
    { label: 'Freelance Developer', cost: '$5,000 - $15,000', time: '4-12 weeks', delay: 150 },
    { label: 'DIY No-Code Tools', cost: '$2,000 - $5,000', time: '2-6 months', delay: 300 },
    { label: 'Dev Team In-House', cost: '$80,000+ /year', time: 'Ongoing', delay: 450 },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 30% 60%, rgba(225,29,46,0.08) 0%, transparent 60%)">
      <div className={`text-center mb-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">The Old Way</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">Expensive. Slow. Painful.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {items.map((item, i) => (
          <div
            key={i}
            className={`group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 transition-all duration-700 hover:border-red-900/50 hover:bg-[hsl(var(--card))] ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
            style={{ transitionDelay: `${item.delay + 200}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{item.label}</h3>
              <X className="w-6 h-6 text-red-500 group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-red-400">
                <DollarSign className="w-4 h-4" />
                <span className="font-mono text-sm">{item.cost}</span>
              </div>
              <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 3: The New Way ───────────────────────────────────────── */
function NewWaySlide({ active }: { active: boolean }) {
  const cost = useAnimatedCounter(20, active, 1500, '$');
  const minutes = useAnimatedCounter(47, active, 2000, '', ' min');

  return (
    <SlideShell gradient="radial-gradient(ellipse at 60% 40%, rgba(34,197,94,0.08) 0%, transparent 60%)">
      <div className={`text-center mb-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">The New Way</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">AI agents build in parallel. You supervise.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {[
          { icon: DollarSign, label: 'Total Cost', value: cost, color: 'text-green-400', borderColor: 'border-green-900/50' },
          { icon: Clock, label: 'Build Time', value: minutes, color: 'text-green-400', borderColor: 'border-green-900/50' },
          { icon: Bot, label: 'AI Agents', value: '40 parallel', color: 'text-green-400', borderColor: 'border-green-900/50' },
        ].map((item, i) => (
          <div
            key={i}
            className={`group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 text-center transition-all duration-700 hover:${item.borderColor} hover:scale-105 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ transitionDelay: `${i * 200 + 300}ms` }}
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2">{item.label}</p>
            <p className={`text-3xl font-black ${item.color} font-mono`}>{item.value}</p>
            <Check className="w-5 h-5 text-green-500 mx-auto mt-3" />
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 4: What Gets Built ───────────────────────────────────── */
function WhatGetsBuiltSlide({ active }: { active: boolean }) {
  const products = [
    { icon: Scissors, label: 'Barbershop' },
    { icon: UtensilsCrossed, label: 'Restaurant' },
    { icon: GraduationCap, label: 'Course Platform' },
    { icon: Store, label: 'E-Commerce' },
    { icon: Building2, label: 'Real Estate' },
    { icon: Briefcase, label: 'Consulting' },
    { icon: Heart, label: 'Healthcare' },
    { icon: Palette, label: 'Creative Studio' },
    { icon: Dumbbell, label: 'Fitness / Gym' },
    { icon: Camera, label: 'Photography' },
    { icon: Music, label: 'Music Studio' },
    { icon: Wrench, label: 'Home Services' },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 50%, rgba(225,29,46,0.06) 0%, transparent 60%)">
      <div className={`text-center mb-10 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">What Gets Built</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">Any business. Any industry. One factory.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl w-full">
        {products.map((item, i) => (
          <div
            key={i}
            className={`group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 text-center transition-all duration-500 hover:border-red-900/50 hover:bg-[hsl(var(--card))] hover:scale-105 cursor-default ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            style={{ transitionDelay: `${i * 80 + 200}ms` }}
          >
            <item.icon className="w-8 h-8 mx-auto mb-3 text-[hsl(var(--muted-foreground))] group-hover:text-red-400 transition-colors" />
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">{item.label}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 5: 262 Pages ─────────────────────────────────────────── */
function PagesSlide({ active }: { active: boolean }) {
  const total = useAnimatedCounter(262, active, 2500);
  const categories = [
    { label: 'Dashboard Pages', count: '100+', color: 'bg-red-500/20 text-red-400' },
    { label: 'Universe Admin', count: '35', color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Partner Portals', count: '16', color: 'bg-primary/20 text-primary' },
    { label: 'Public Pages', count: '30+', color: 'bg-green-500/20 text-green-400' },
    { label: 'Auth & Onboarding', count: '12', color: 'bg-amber-500/20 text-amber-400' },
    { label: 'API Endpoints', count: '69+', color: 'bg-cyan-500/20 text-cyan-400' },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 30%, rgba(225,29,46,0.1) 0%, transparent 60%)">
      <div className={`text-center mb-10 transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <p className="text-xl text-[hsl(var(--muted-foreground))] mb-4">Total Pages & Routes</p>
        <h2 className="text-7xl md:text-9xl font-black text-[hsl(var(--foreground))] font-mono" style={{ textShadow: `0 0 80px ${ACCENT}40` }}>
          {total}
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">pages, routes, and API endpoints</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {categories.map((cat, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 text-center transition-all duration-500 ${cat.color.split(' ')[0]} ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${i * 100 + 800}ms` }}
          >
            <p className={`text-2xl font-black font-mono ${cat.color.split(' ')[1]}`}>{cat.count}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{cat.label}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 6: The Stack ─────────────────────────────────────────── */
function StackSlide({ active }: { active: boolean }) {
  const stack = [
    { icon: Globe, label: 'Next.js 15', desc: 'App Router + RSC', row: 0 },
    { icon: Server, label: 'Fastify 5', desc: 'High-perf API', row: 0 },
    { icon: Database, label: 'Prisma 6', desc: 'Type-safe ORM', row: 1 },
    { icon: Activity, label: 'BullMQ', desc: '9 Queue Workers', row: 1 },
    { icon: Brain, label: 'Claude AI', desc: 'Agent Intelligence', row: 2 },
    { icon: Zap, label: 'Redis', desc: 'Real-time Cache', row: 2 },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 40% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)">
      <div className={`text-center mb-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">The Stack</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">Enterprise-grade. Production-ready. Battle-tested.</p>
      </div>
      <div className="max-w-4xl w-full space-y-4">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex justify-center gap-4">
            {stack.filter((s) => s.row === row).map((item, i) => (
              <div
                key={i}
                className={`group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-64 text-center transition-all duration-700 hover:border-blue-800/50 hover:scale-105 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${(row * 2 + i) * 150 + 200}ms` }}
              >
                <item.icon className="w-10 h-10 mx-auto mb-3 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <h3 className="text-[hsl(var(--foreground))] font-bold text-lg">{item.label}</h3>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">{item.desc}</p>
                {/* connector line */}
                {row < 2 && (
                  <div className="absolute -bottom-4 left-1/2 w-px h-4 bg-[hsl(var(--muted))] group-hover:bg-blue-700 transition-colors" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 7: Build Cost Breakdown ──────────────────────────────── */
function CostBreakdownSlide({ active }: { active: boolean }) {
  const bars = [
    { label: 'Agency', cost: '$25,000', pct: 100, color: 'bg-red-600' },
    { label: 'Freelancer', cost: '$8,000', pct: 32, color: 'bg-orange-500' },
    { label: 'DIY + Months', cost: '$3,000', pct: 12, color: 'bg-amber-500' },
    { label: 'Build Factory', cost: '$20', pct: 0.8, color: 'bg-green-500', highlight: true },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 60%, rgba(225,29,46,0.06) 0%, transparent 60%)">
      <div className={`text-center mb-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">Cost Comparison</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">Same result. Radically different cost.</p>
      </div>
      <div className="max-w-3xl w-full space-y-6">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}
            style={{ transitionDelay: `${i * 200 + 300}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${bar.highlight ? 'text-green-400 text-lg' : 'text-[hsl(var(--foreground))]'}`}>
                {bar.label}
              </span>
              <span className={`font-mono font-bold ${bar.highlight ? 'text-green-400 text-xl' : 'text-[hsl(var(--muted-foreground))]'}`}>
                {bar.cost}
              </span>
            </div>
            <div className="h-8 bg-[hsl(var(--card))] rounded-full overflow-hidden border border-[hsl(var(--border))]">
              <div
                className={`h-full rounded-full transition-all duration-1500 ease-out ${bar.color} ${bar.highlight ? 'shadow-lg shadow-green-500/20' : ''}`}
                style={{
                  width: active ? `${Math.max(bar.pct, 3)}%` : '0%',
                  transitionDelay: `${i * 200 + 500}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 8: Real Products Built ───────────────────────────────── */
function ProductsSlide({ active }: { active: boolean }) {
  const products = [
    { icon: Users, label: 'CRM Engine', desc: 'Pipelines, deals, contacts, custom fields, automations', color: 'from-blue-500/10 to-blue-900/5', iconColor: 'text-blue-400' },
    { icon: ShoppingCart, label: 'Commerce Engine', desc: 'Stores, products, orders, subscriptions, affiliates', color: 'from-green-500/10 to-green-900/5', iconColor: 'text-green-400' },
    { icon: GraduationCap, label: 'Coaching Engine', desc: 'Programs, modules, lessons, enrollments, certificates', color: 'from-purple-500/10 to-purple-900/5', iconColor: 'text-primary' },
    { icon: Search, label: 'SEO Traffic Engine', desc: 'Keyword clusters, AI articles, IndexNow, rankings', color: 'from-amber-500/10 to-amber-900/5', iconColor: 'text-amber-400' },
  ];

  return (
    <SlideShell>
      <div className={`text-center mb-10 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">Real Products Built</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">The Four Engines of Memelli OS</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {products.map((p, i) => (
          <div
            key={i}
            className={`group bg-gradient-to-br ${p.color} border border-[hsl(var(--border))] rounded-2xl p-8 transition-all duration-700 hover:scale-105 hover:border-[hsl(var(--border))] ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${i * 150 + 200}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <p.icon className={`w-7 h-7 ${p.iconColor}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1">{p.label}</h3>
                <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 9: The Agent Army ────────────────────────────────────── */
function AgentArmySlide({ active }: { active: boolean }) {
  const agentCount = useAnimatedCounter(40, active, 1800);
  const pools = [
    'MUA Core', 'Workstation', 'Workflows', 'OmniFlow',
    'Admin', 'API', 'Workers', 'Deploy', 'Patrol', 'Security',
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 40%, rgba(225,29,46,0.1) 0%, transparent 60%)">
      <div className={`text-center mb-8 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-2">The Agent Army</h2>
        <p className="text-6xl md:text-8xl font-black font-mono mt-4" style={{ color: ACCENT, textShadow: `0 0 60px ${ACCENT}30` }}>
          {agentCount}
        </p>
        <p className="text-[hsl(var(--muted-foreground))] text-lg">agents working in parallel</p>
      </div>
      <div className="max-w-4xl w-full">
        <div className="grid grid-cols-5 gap-3">
          {pools.map((pool, i) => (
            <div
              key={i}
              className={`group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-center transition-all duration-500 hover:border-red-900/40 hover:bg-[hsl(var(--card))] ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{ transitionDelay: `${i * 80 + 600}ms` }}
            >
              <Bot className="w-6 h-6 mx-auto mb-2 text-[hsl(var(--muted-foreground))] group-hover:text-red-400 transition-colors" />
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">{pool}</p>
            </div>
          ))}
        </div>
        {/* agent dots visualization */}
        <div className={`mt-8 flex flex-wrap justify-center gap-1.5 transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1200ms' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all duration-300 hover:scale-150"
              style={{
                background: ACCENT,
                opacity: 0.4 + Math.random() * 0.6,
                animation: `agentPulse ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 10: How To Start ─────────────────────────────────────── */
function HowToStartSlide({ active }: { active: boolean }) {
  const steps = [
    { num: '01', title: 'Describe Your Business', desc: 'Tell the sphere what you need. Natural language. No technical knowledge required.', icon: Target },
    { num: '02', title: 'Agents Build It', desc: '40 parallel agents construct your entire platform: pages, API, database, integrations.', icon: Cpu },
    { num: '03', title: 'Go Live', desc: 'Your production-ready platform deploys automatically. Start operating immediately.', icon: Rocket },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 50%, rgba(225,29,46,0.06) 0%, transparent 60%)">
      <div className={`text-center mb-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-4">How To Start</h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))]">Three steps. That is it.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full items-stretch">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            <div
              className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 text-center w-full transition-all duration-700 hover:border-red-900/40 hover:scale-105 flex-1 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 250 + 300}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${ACCENT}15` }}>
                <step.icon className="w-8 h-8" style={{ color: ACCENT }} />
              </div>
              <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] tracking-widest">{step.num}</span>
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mt-2 mb-3">{step.title}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">{step.desc}</p>
            </div>
            {i < 2 && (
              <ArrowRight className={`hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 250 + 800}ms` }} />
            )}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Slide 11: ROI ──────────────────────────────────────────────── */
function ROISlide({ active }: { active: boolean }) {
  const spent = useAnimatedCounter(1150, active, 1500, '$');
  const value = useAnimatedCounter(500, active, 2500, '$', 'K+');
  const roi = useAnimatedCounter(43378, active, 3000, '', '%');

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.1) 0%, transparent 60%)">
      <div className={`text-center transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <h2 className="text-4xl md:text-6xl font-black text-[hsl(var(--foreground))] mb-12">Return on Investment</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className={`transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`} style={{ transitionDelay: '400ms' }}>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2 uppercase tracking-widest">Total Spent</p>
            <p className="text-4xl md:text-5xl font-black font-mono text-[hsl(var(--foreground))]">{spent}</p>
          </div>
          <div className={`transition-all duration-500 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '800ms' }}>
            <ArrowRight className="w-8 h-8 text-green-500" />
          </div>
          <div className={`transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionDelay: '600ms' }}>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2 uppercase tracking-widest">Equivalent Value</p>
            <p className="text-4xl md:text-5xl font-black font-mono text-green-400">{value}</p>
          </div>
        </div>
        <div className={`mt-12 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1200ms' }}>
          <p className="text-[hsl(var(--muted-foreground))] text-sm uppercase tracking-widest mb-2">ROI</p>
          <p className="text-6xl md:text-8xl font-black font-mono text-green-400" style={{ textShadow: '0 0 60px rgba(34,197,94,0.3)' }}>
            {roi}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 12: CTA ──────────────────────────────────────────────── */
function CTASlide({ active }: { active: boolean }) {
  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 50%, rgba(225,29,46,0.15) 0%, transparent 60%)">
      <ParticleField />
      <div className={`relative z-10 text-center transition-all duration-1000 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <Sparkles className="w-16 h-16 mx-auto mb-8 text-red-400 animate-pulse" />
        <h2 className="text-5xl md:text-7xl font-black text-[hsl(var(--foreground))] mb-6">
          Ready to Build?
        </h2>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-xl mx-auto mb-10">
          Stop paying thousands. Stop waiting months. Build your entire platform today.
        </p>
        <button
          className="group relative px-10 py-5 rounded-2xl text-[hsl(var(--foreground))] font-bold text-xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: ACCENT,
            boxShadow: `0 0 40px ${ACCENT}40`,
            animation: 'ctaPulse 2s ease-in-out infinite',
          }}
        >
          <span className="flex items-center gap-3">
            Start Building
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-6">$20 per build &middot; No subscription &middot; Production-ready</p>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 13: REAL BUILD SPECS ─────────────────────────────────── */
function BuildSpecsSlide({ active }: { active: boolean }) {
  const pages = useAnimatedCounter(262, active, 2000);
  const compileTime = useAnimatedCounter(289, active, 2200);
  const files = useAnimatedCounter(4504, active, 2500);
  const cores = useAnimatedCounter(30, active, 1500);

  const routes = [
    { route: '/universe/command-center', size: '17.9 kB', pct: 100, type: 'dynamic' },
    { route: '/universe/agents', size: '14.1 kB', pct: 79, type: 'dynamic' },
    { route: '/universe/map', size: '12.8 kB', pct: 71, type: 'dynamic' },
    { route: '/universe/jessica-follower', size: '11.6 kB', pct: 65, type: 'dynamic' },
    { route: '/universe/guide', size: '10.2 kB', pct: 57, type: 'dynamic' },
    { route: '/universe/activation', size: '9.7 kB', pct: 54, type: 'dynamic' },
    { route: '/universe/deploy', size: '8.4 kB', pct: 47, type: 'dynamic' },
    { route: '/universe/diagnostics', size: '7.9 kB', pct: 44, type: 'dynamic' },
    { route: '/dashboard', size: '6.2 kB', pct: 35, type: 'ssr' },
    { route: '/universe/crm', size: '5.8 kB', pct: 32, type: 'dynamic' },
    { route: '/universe/commerce', size: '5.4 kB', pct: 30, type: 'dynamic' },
    { route: '/universe/coaching', size: '4.9 kB', pct: 27, type: 'dynamic' },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 30%, rgba(225,29,46,0.12) 0%, transparent 60%)">
      <div className={`w-full max-w-5xl mx-auto transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
            <Cpu className="w-3.5 h-3.5" /> REAL BUILD SPECS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))]">Production Build Output</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Actual compile results — not estimates</p>
        </div>

        {/* top-level stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: FileCode, label: 'Pages Compiled', value: pages, color: 'text-red-400', bg: `${ACCENT}10` },
            { icon: Clock, label: 'Seconds Compile', value: `${(Number(compileTime.replace(/[^0-9]/g, '')) / 10).toFixed(1)}`, color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
            { icon: Package, label: 'Deployment Files', value: files, color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
            { icon: Cpu, label: 'Core Turbo Machine', value: `${cores}-core`, color: 'text-primary', bg: 'rgba(239,68,68,0.1)' },
          ].map((s, i) => (
            <div
              key={i}
              className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 text-center transition-all duration-500 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              style={{ transitionDelay: `${i * 100 + 300}ms` }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: s.bg }}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* route size breakdown */}
        <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
            Route Bundle Sizes (Top 12)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-4 text-right font-mono">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <code className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{r.route}</code>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${r.type === 'ssr' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}>
                        {r.type.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">{r.size}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all ease-out"
                      style={{
                        width: active ? `${r.pct}%` : '0%',
                        background: ACCENT,
                        transitionDuration: '1500ms',
                        transitionDelay: `${i * 60 + 1000}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-3 flex items-center justify-center gap-2 text-sm transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1800ms' }}>
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-semibold">Zero errors, zero warnings on final build</span>
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 14: REAL SPEED METRICS ───────────────────────────────── */
function SpeedMetricsSlide({ active }: { active: boolean }) {
  const cards = [
    { metric: '3 System Guide Pages', value: '~1 Hour', detail: 'Built simultaneously by parallel agents', icon: Layers, color: 'red' },
    { metric: 'Per Page Output', value: '500-800', detail: 'Lines of production React code', icon: Code, color: 'blue' },
    { metric: 'Backend APIs', value: '150-560', detail: 'Lines per route file, fully typed', icon: Server, color: 'purple' },
    { metric: 'Redis Engines', value: 'Real-Time', detail: 'Live data, not mocks', icon: Database, color: 'green' },
    { metric: 'Parallel Agents', value: '3-5', detail: 'Building simultaneously, no conflicts', icon: Users, color: 'amber' },
    { metric: 'Deploy Pipeline', value: '< 3 min', detail: 'Commit → build → live', icon: Rocket, color: 'red' },
  ];

  const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    red: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400', iconBg: 'bg-red-500/10' },
    blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400', iconBg: 'bg-blue-500/10' },
    purple: { border: 'border-primary/20', bg: 'bg-primary/80/5', text: 'text-primary', iconBg: 'bg-primary/10' },
    green: { border: 'border-green-500/20', bg: 'bg-green-500/5', text: 'text-green-400', iconBg: 'bg-green-500/10' },
    amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', iconBg: 'bg-amber-500/10' },
  };

  return (
    <SlideShell gradient="radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.08) 0%, transparent 60%)">
      <div className={`w-full max-w-5xl mx-auto transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
            <Gauge className="w-3.5 h-3.5" /> REAL SPEED METRICS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))]">Development Velocity</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Measured production throughput</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map((card, i) => {
            const c = colorMap[card.color];
            return (
              <div
                key={i}
                className={`${c.border} ${c.bg} border rounded-xl p-5 transition-all duration-600 hover:scale-[1.03] ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 120 + 200}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">{card.metric}</div>
                    <div className={`text-xl font-black ${c.text}`}>{card.value}</div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">{card.detail}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* speed comparison */}
        <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1000ms' }}>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">Traditional Team vs. Agent Factory</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[hsl(var(--muted-foreground))]">Traditional Team (6 weeks)</span>
                <span className="text-[hsl(var(--muted-foreground))]">$150K-250K</span>
              </div>
              <div className="h-5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[hsl(var(--muted))] transition-all duration-[2000ms] ease-out" style={{ width: active ? '100%' : '0%', transitionDelay: '1200ms' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: ACCENT }}>Agent Factory (3 days)</span>
                <span className="font-semibold" style={{ color: ACCENT }}>$1,150</span>
              </div>
              <div className="h-5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-[2000ms] ease-out" style={{ width: active ? '7%' : '0%', background: ACCENT, transitionDelay: '1400ms', minWidth: active ? '24px' : '0' }} />
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <span className="text-3xl font-black text-[hsl(var(--foreground))]">14x</span>
            <span className="text-sm text-[hsl(var(--muted-foreground))] ml-2">faster delivery</span>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 15: REAL DELIVERABLES SHOWCASE ───────────────────────── */
function DeliverablesSlide({ active }: { active: boolean }) {
  const deliverables = [
    { route: '/universe/guide', lines: 539, desc: '12 doc sections, live search, AI generation', features: ['Live Search', 'AI Gen', '12 Sections'], icon: Layers },
    { route: '/universe/map', lines: 642, desc: '8 system sections, 5s live polling, health scores', features: ['Real-time', 'Health Scores', '8 Systems'], icon: Globe },
    { route: '/universe/jessica-follower', lines: 828, desc: '15-stage timeline, 3s polling, failure tracking', features: ['15 Stages', '3s Polling', 'Failure Track'], icon: Bot },
    { route: '/dashboard', lines: 0, desc: '100+ pages, full business operations', features: ['100+ Pages', 'CRM', 'Commerce'], icon: Activity },
    { route: '/universe/command-center', lines: 0, desc: '17.9 kB, real-time agent orchestration', features: ['17.9 kB', 'Live Dispatch', 'Orchestration'], icon: Terminal },
    { route: '/universe/agents', lines: 0, desc: '14.1 kB, workforce management with org chart', features: ['14.1 kB', 'Org Chart', 'Pool Mgmt'], icon: Users },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 50%, rgba(225,29,46,0.06) 0%, transparent 60%)">
      <div className={`w-full max-w-5xl mx-auto transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
            <Package className="w-3.5 h-3.5" /> REAL DELIVERABLES
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))]">What We Actually Built</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Live production pages with real stats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {deliverables.map((page, i) => (
            <div
              key={i}
              className={`group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-all duration-500 hover:border-red-900/40 hover:scale-[1.03] ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}20` }}>
                  <page.icon className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <div>
                  <code className="text-sm text-[hsl(var(--foreground))] font-semibold">{page.route}</code>
                  {page.lines > 0 && <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{page.lines} lines</div>}
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{page.desc}</p>
              <div className="flex flex-wrap gap-1">
                {page.features.map((f) => (
                  <span key={f} className="text-[9px] font-medium px-1.5 py-0.5 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded text-[hsl(var(--muted-foreground))]">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* summary row */}
        <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 flex flex-wrap items-center justify-center gap-6 text-center transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1000ms' }}>
          {[
            { value: '262', label: 'Total Pages' },
            { value: '50K+', label: 'Lines of Code' },
            { value: '35+', label: 'API Endpoints' },
            { value: '4', label: 'Business Engines' },
          ].map((s, i) => (
            <div key={i} className="px-3">
              <div className="text-xl font-black text-[hsl(var(--foreground))]">{s.value}</div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.label}</div>
              {i < 3 && <div className="hidden md:block" />}
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 16: COST PER DELIVERABLE ─────────────────────────────── */
function CostPerDeliverableSlide({ active }: { active: boolean }) {
  const costItems = [
    { label: 'Per Page', factory: '$4.40', factoryVal: 4.4, traditional: '$2,500', traditionalVal: 2500, ratio: 568 },
    { label: 'Per Line of Code', factory: '$0.02', factoryVal: 0.02, traditional: '$2.50', traditionalVal: 2.5, ratio: 125 },
    { label: 'Per Engine', factory: '$28', factoryVal: 28, traditional: '$25,000', traditionalVal: 25000, ratio: 893 },
    { label: 'Per API Endpoint', factory: '$3', factoryVal: 3, traditional: '$1,500', traditionalVal: 1500, ratio: 500 },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 40% 60%, rgba(34,197,94,0.08) 0%, transparent 60%)">
      <div className={`w-full max-w-5xl mx-auto transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-semibold mb-3">
            <DollarSign className="w-3.5 h-3.5" /> COST PER DELIVERABLE
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))]">
            Total Build Cost: <span style={{ color: ACCENT }}>$1,150</span>
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Agent Factory vs. Traditional Development</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {costItems.map((item, i) => (
            <div
              key={i}
              className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-all duration-600 hover:border-green-900/40 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${i * 150 + 200}ms` }}
            >
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">{item.label}</div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-3xl font-black" style={{ color: ACCENT }}>{item.factory}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Agent Factory</div>
                </div>
                <div className="text-[hsl(var(--muted-foreground))] text-base mb-1">vs</div>
                <div>
                  <div className="text-lg font-semibold text-[hsl(var(--muted-foreground))] line-through">{item.traditional}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Traditional</div>
                </div>
              </div>
              {/* comparison bars */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-[hsl(var(--muted))] rounded-full flex-1" />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))] w-16 text-right">Traditional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full flex-1 transition-all duration-[1500ms] ease-out" style={{ background: ACCENT, maxWidth: active ? `${Math.max(100 / (item.ratio / 10), 2)}%` : '0%', transitionDelay: `${i * 150 + 600}ms`, minWidth: active ? '4px' : '0' }} />
                  <span className="text-[9px] w-16 text-right" style={{ color: ACCENT }}>Factory</span>
                </div>
              </div>
              <div className="text-center mt-3">
                <span className="text-lg font-black text-green-400">{item.ratio}x</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">cheaper</span>
              </div>
            </div>
          ))}
        </div>

        {/* industry rates */}
        <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Industry Rate Comparison</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[hsl(var(--muted-foreground))]">$150-300</div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Developer hourly rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[hsl(var(--muted-foreground))]">$5K+</div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Minimum project</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: ACCENT }}>$1,150</div>
              <div className="text-[10px] font-semibold" style={{ color: ACCENT }}>262-page OS platform</div>
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Slide 17: QUALITY INDICATORS ───────────────────────────────── */
function QualitySlide({ active }: { active: boolean }) {
  const qualityItems = [
    { label: 'TypeScript Strict Mode', status: 'pass' as const, detail: 'Zero type errors across entire codebase', icon: Code, color: 'green' },
    { label: 'Self-Healing Deploy', status: 'active' as const, detail: 'Auto-detects and fixes build failures', icon: Shield, color: 'blue' },
    { label: 'Real-Time Monitoring', status: 'active' as const, detail: 'Live dashboards, not placeholder UIs', icon: Activity, color: 'blue' },
    { label: 'Production Database', status: 'pass' as const, detail: 'Real data — no mocks, no stubs', icon: Database, color: 'green' },
    { label: 'Multi-Tenant Architecture', status: 'pass' as const, detail: 'Enterprise-grade from day one', icon: Users, color: 'green' },
    { label: '9 BullMQ Worker Queues', status: 'active' as const, detail: 'Async processing at massive scale', icon: Server, color: 'blue' },
  ];

  const archStats = [
    { label: 'Business Engines', value: '4', sub: 'CRM, Commerce, Coaching, SEO' },
    { label: 'Worker Queues', value: '9', sub: 'BullMQ async processing' },
    { label: 'Doctrine Stages', value: '43', sub: 'Complete constitution' },
    { label: 'Agent Pools', value: '13', sub: 'Autonomous workforce' },
  ];

  return (
    <SlideShell gradient="radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.06) 0%, transparent 60%)">
      <div className={`w-full max-w-5xl mx-auto transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" /> QUALITY INDICATORS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))]">Enterprise-Grade Quality</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Every metric verified in production</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {qualityItems.map((item, i) => {
            const isPass = item.status === 'pass';
            return (
              <div
                key={i}
                className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 transition-all duration-500 hover:scale-[1.02] ${isPass ? 'hover:border-green-500/30' : 'hover:border-blue-500/30'} ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: `${i * 100 + 200}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPass ? 'bg-green-500/10 border border-green-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                    <item.icon className={`w-4 h-4 ${isPass ? 'text-green-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{item.label}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isPass ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {item.status === 'pass' ? 'PASS' : 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* architecture breakdown */}
        <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '900ms' }}>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: ACCENT }} />
            Architecture Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {archStats.map((stat, i) => (
              <div key={i} className="p-2">
                <div className="text-2xl font-black text-[hsl(var(--foreground))]">{stat.value}</div>
                <div className="text-xs font-semibold text-[hsl(var(--foreground))] mt-1">{stat.label}</div>
                <div className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function PowerSlidesPage() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      if (index < 0 || index >= TOTAL_SLIDES) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  /* keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === 'End') { e.preventDefault(); goTo(TOTAL_SLIDES - 1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, goTo]);

  /* touch nav */
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) { diff > 0 ? next() : prev(); }
  };

  const slides = [
    TitleSlide, OldWaySlide, NewWaySlide, WhatGetsBuiltSlide,
    PagesSlide, StackSlide, CostBreakdownSlide, ProductsSlide,
    AgentArmySlide, HowToStartSlide, ROISlide,
    BuildSpecsSlide, SpeedMetricsSlide, DeliverablesSlide,
    CostPerDeliverableSlide, QualitySlide,
    CTASlide,
  ];

  return (
    <>
      {/* global keyframes */}
      <style jsx global>{`
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.5; }
          75% { transform: translateY(-30px) translateX(15px); opacity: 0.7; }
        }
        @keyframes agentPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 40px ${ACCENT}40; }
          50% { box-shadow: 0 0 80px ${ACCENT}60, 0 0 120px ${ACCENT}20; }
        }
        .duration-1500 { transition-duration: 1500ms; }
      `}</style>

      <div
        ref={containerRef}
        className="fixed inset-0 bg-[hsl(var(--background))] overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
      >
        {/* progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--card))] z-50">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((current + 1) / TOTAL_SLIDES) * 100}%`,
              background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}CC)`,
            }}
          />
        </div>

        {/* slide counter */}
        <div className="absolute top-4 right-6 z-50 text-[hsl(var(--muted-foreground))] font-mono text-sm">
          <span className="text-[hsl(var(--foreground))]">{String(current + 1).padStart(2, '0')}</span>
          <span className="mx-1">/</span>
          <span>{String(TOTAL_SLIDES).padStart(2, '0')}</span>
        </div>

        {/* slides */}
        <div className="relative w-full h-full">
          {slides.map((SlideComponent, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-600 ease-out"
              style={{
                opacity: current === i ? 1 : 0,
                transform: current === i
                  ? 'translateX(0) scale(1)'
                  : i < current
                    ? 'translateX(-8%) scale(0.95)'
                    : 'translateX(8%) scale(0.95)',
                pointerEvents: current === i ? 'auto' : 'none',
                transitionDuration: '600ms',
              }}
            >
              <SlideComponent active={current === i} />
            </div>
          ))}
        </div>

        {/* navigation arrows */}
        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))] transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {current < TOTAL_SLIDES - 1 && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))] transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {/* slide indicator dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                current === i
                  ? 'w-8 h-2'
                  : 'w-2 h-2 hover:bg-[hsl(var(--muted-foreground))]'
              }`}
              style={{
                background: current === i ? ACCENT : 'rgba(113,113,122,0.5)',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
