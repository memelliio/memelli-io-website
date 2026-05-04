'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  ShoppingCart, Users, GraduationCap, Search,
  Bot, Brain, Shield, Zap, Rocket, TrendingUp,
  DollarSign, Target, Clock, Globe, Layers,
  Building2, Cpu, MessageSquare, Phone, Mail,
  BarChart3, Sparkles, Lock, Network, FileText,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const RED = '#E11D2E';
const RED_GLOW = 'rgba(225, 29, 46, 0.15)';
const RED_GLOW_STRONG = 'rgba(225, 29, 46, 0.3)';
const TOTAL_SLIDES = 13;

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, active: boolean, duration = 1200, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setDisplay(`${prefix}0${suffix}`); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, target, duration, prefix, suffix]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SLIDE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function SlideTitle({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${RED} 0%, transparent 70%)` }} />
      </div>

      <div className={`relative transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo mark */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-zinc-700" style={{ background: `linear-gradient(135deg, ${RED}, #991B1B)` }}>
            <Cpu className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight mb-6">
          Memelli <span style={{ color: RED }}>OS</span>
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground font-light mb-4">
          The AI-Built Operating System
        </p>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Built by Claude. Operated by Melli. Owned by you.
        </p>

        <div className="mt-12 flex items-center gap-2 text-muted-foreground text-sm">
          <span>Press</span>
          <kbd className="px-2 py-1 bg-muted rounded border border-zinc-700 text-muted-foreground text-xs">&#8594;</kbd>
          <span>or</span>
          <kbd className="px-2 py-1 bg-muted rounded border border-zinc-700 text-muted-foreground text-xs">Space</kbd>
          <span>to navigate</span>
        </div>
      </div>
    </div>
  );
}

function SlideProblem({ active }: { active: boolean }) {
  const items = [
    { icon: Layers, text: 'Businesses need 5-10 different SaaS tools', detail: 'CRM, email, website, payments, support, analytics...' },
    { icon: DollarSign, text: 'Average spend: $2,000-10,000/month on software', detail: 'Costs compound as you grow' },
    { icon: Clock, text: 'Months to set up, integrate, and maintain', detail: 'Constant updates, migrations, and breakages' },
    { icon: Bot, text: 'No AI, no automation, no intelligence', detail: 'Manual work multiplied across every tool' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto">
      <div className={`transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: RED }}>The Problem</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
          Software is <span className="text-muted-foreground">broken</span> for business
        </h2>

        <div className="grid gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-5 p-6 rounded-xl border border-zinc-800 bg-card backdrop-blur-sm"
              style={{
                transitionDelay: `${i * 120}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'all 0.5s ease',
              }}
            >
              <div className="p-3 rounded-lg bg-muted">
                <item.icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg text-white font-medium">{item.text}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideSolution({ active }: { active: boolean }) {
  const items = [
    { icon: Globe, label: 'One platform replaces all of them', color: '#3B82F6' },
    { icon: Brain, label: 'AI-first from day one', color: '#8B5CF6' },
    { icon: Zap, label: 'Built in hours, not months', color: '#F59E0B' },
    { icon: Shield, label: 'Self-healing, self-monitoring, always improving', color: '#10B981' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto text-center">
      <div className={`transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: RED }}>The Solution</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
          One OS. <span style={{ color: RED }}>Every tool.</span> AI-powered.
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.5s ease',
              }}
            >
              <div className="p-4 rounded-xl" style={{ background: `${item.color}20` }}>
                <item.icon className="w-8 h-8" style={{ color: item.color }} />
              </div>
              <p className="text-lg text-white font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlidePlatform({ active }: { active: boolean }) {
  const engines = [
    { icon: ShoppingCart, name: 'Commerce', color: '#3B82F6', items: ['Stores', 'Products', 'Orders', 'Subscriptions'] },
    { icon: Users, name: 'CRM', color: '#10B981', items: ['Pipelines', 'Deals', 'Contacts', 'Communications'] },
    { icon: GraduationCap, name: 'Coaching', color: '#8B5CF6', items: ['Programs', 'Lessons', 'Certificates', 'Enrollments'] },
    { icon: Search, name: 'SEO Traffic', color: '#F59E0B', items: ['Articles', 'Keywords', 'Rankings', 'IndexNow'] },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-6xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>The Platform</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Four Engines. <span className="text-muted-foreground">One Universe.</span>
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {engines.map((engine, i) => (
            <div
              key={i}
              className="relative p-8 rounded-2xl border border-zinc-800 bg-card backdrop-blur-sm overflow-hidden"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s ease',
              }}
            >
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: engine.color }} />

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg" style={{ background: `${engine.color}20` }}>
                  <engine.icon className="w-6 h-6" style={{ color: engine.color }} />
                </div>
                <h3 className="text-xl font-bold text-white">{engine.name}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {engine.items.map((item, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 rounded-full text-sm border"
                    style={{ borderColor: `${engine.color}30`, color: engine.color, background: `${engine.color}10` }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideAI({ active }: { active: boolean }) {
  const features = [
    { icon: MessageSquare, title: 'Melli', desc: 'Handles all customer interactions via voice, chat, SMS', color: '#EC4899' },
    { icon: Brain, title: 'Claude', desc: 'Architects, builds, and deploys the entire platform', color: '#8B5CF6' },
    { icon: Bot, title: '40+ Agents', desc: 'Specialized AI workers operating 24/7', color: '#3B82F6' },
    { icon: Shield, title: 'Self-Healing', desc: 'Detects and fixes its own bugs autonomously', color: '#10B981' },
    { icon: Rocket, title: 'Self-Deploying', desc: 'Ships its own updates without human intervention', color: '#F59E0B' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>The AI Advantage</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Not AI-<span className="text-muted-foreground">assisted</span>. AI-<span style={{ color: RED }}>native</span>.
        </h2>

        <div className="grid gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-5 p-5 rounded-xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 100}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'all 0.5s ease',
              }}
            >
              <div className="p-3 rounded-lg shrink-0" style={{ background: `${f.color}15` }}>
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <div>
                <span className="text-white font-semibold text-lg">{f.title}</span>
                <span className="text-muted-foreground ml-3">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideMarket({ active }: { active: boolean }) {
  const v1 = useAnimatedCounter(300, active, 1400, '$', 'B+');
  const v2 = useAnimatedCounter(30, active, 1200, '', 'M+');
  const v3 = useAnimatedCounter(120, active, 1000, '$', 'K');
  const v4 = useAnimatedCounter(1, active, 800, '<', '%');

  const stats = [
    { value: v1, label: 'Global SaaS Market', sub: 'Growing 15% YoY' },
    { value: v2, label: 'SMBs in US Alone', sub: 'Every one needs software' },
    { value: v3, label: 'Avg SaaS Spend / SMB / Year', sub: 'And rising fast' },
    { value: v4, label: 'AI-First Platform Penetration', sub: 'Massive blue ocean' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto text-center">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: RED }}>Market Opportunity</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
          A <span style={{ color: RED }}>massive</span> market. Almost <span className="text-muted-foreground">zero</span> competition.
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {stats.map((s, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.5s ease',
              }}
            >
              <p className="text-4xl md:text-5xl font-bold mb-2" style={{ color: RED }}>{s.value}</p>
              <p className="text-white font-medium text-lg">{s.label}</p>
              <p className="text-muted-foreground text-sm mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideBusinessModel({ active }: { active: boolean }) {
  const tiers = [
    { name: 'Starter', price: '$49', period: '/mo', features: ['4 Engines', 'AI Chat', '1 User', 'Basic Analytics'], highlight: false },
    { name: 'Pro', price: '$149', period: '/mo', features: ['Everything in Starter', 'SMS + Voice', '5 Users', 'Agent Workforce', 'Custom Domain'], highlight: true },
    { name: 'Enterprise', price: '$499', period: '/mo', features: ['Everything in Pro', 'White-Label', 'Unlimited Users', 'Priority Support', 'API Access'], highlight: false },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-6xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>Business Model</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          Simple pricing. <span className="text-muted-foreground">Massive value.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12">Plus: affiliate network, white-label, and API access</p>

        <div className="grid grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-2xl border ${tier.highlight ? 'border-red-500/50' : 'border-zinc-800'} bg-card`}
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.5s ease',
                boxShadow: tier.highlight ? `0 0 40px ${RED_GLOW}` : 'none',
              }}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: RED }}>
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: tier.highlight ? RED : 'white' }}>{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <div className="space-y-3">
                {tier.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-4 h-4" style={{ color: RED }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideTraction({ active }: { active: boolean }) {
  const v1 = useAnimatedCounter(262, active, 1400, '', '+');
  const v2 = useAnimatedCounter(4, active, 800);
  const v3 = useAnimatedCounter(43, active, 1200);

  const milestones = [
    { value: v1, label: 'Pages Built', icon: FileText },
    { value: v2, label: 'Engine Platform Live', icon: Rocket },
    { value: v3, label: 'Doctrine Stages (System Law)', icon: Lock },
  ];

  const features = [
    'Multi-tenant architecture ready',
    'Credit/funding integration',
    'SMS, email, chat, voice communications',
    'Agent workforce operational',
    'Self-healing deployment pipeline',
    'Full observability dashboard',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>Traction</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Already <span style={{ color: RED }}>built</span>. Already <span className="text-muted-foreground">running</span>.
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-10">
          {milestones.map((m, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.5s ease',
              }}
            >
              <m.icon className="w-8 h-8 mx-auto mb-3" style={{ color: RED }} />
              <p className="text-3xl font-bold text-white">{m.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                transitionDelay: `${(i + 3) * 100}ms`,
                opacity: active ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RED }} />
              <span className="text-muted-foreground text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideMoat({ active }: { active: boolean }) {
  const moats = [
    { icon: Zap, title: 'AI-Built = 100x Faster Iteration', desc: 'Ship features in minutes, not sprints. Competitors can\'t match this speed.', color: '#F59E0B' },
    { icon: Shield, title: 'Self-Healing = Near-Zero Maintenance', desc: 'System detects and repairs issues autonomously. Ops cost approaches zero.', color: '#10B981' },
    { icon: Bot, title: 'Agent Workforce = Scales Without Hiring', desc: '40+ AI agents that never sleep, never quit, never need PTO.', color: '#3B82F6' },
    { icon: Lock, title: 'Doctrine System = Compounding Knowledge', desc: '43 stages of institutional memory. Every lesson makes the system smarter.', color: '#8B5CF6' },
    { icon: Rocket, title: 'First-Mover in AI-Native OS', desc: 'Not bolting AI onto legacy. Built AI-native from line one.', color: RED },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>Competitive Moat</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Five walls they <span className="text-muted-foreground">can't</span> climb
        </h2>

        <div className="space-y-4">
          {moats.map((m, i) => (
            <div
              key={i}
              className="flex items-start gap-5 p-5 rounded-xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 120}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateX(0)' : `translateX(${i % 2 === 0 ? '-' : ''}20px)`,
                transition: 'all 0.5s ease',
              }}
            >
              <div className="p-3 rounded-lg shrink-0" style={{ background: `${m.color}15` }}>
                <m.icon className="w-6 h-6" style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{m.title}</p>
                <p className="text-muted-foreground text-sm mt-1">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideUnitEconomics({ active }: { active: boolean }) {
  const costPage = useAnimatedCounter(440, active, 1000, '$');
  const costPlatform = useAnimatedCounter(1150, active, 1200, '$');
  const traditional = useAnimatedCounter(500, active, 1400, '$', 'K+');
  const margin = useAnimatedCounter(85, active, 1000, '', '%+');
  const cac = useAnimatedCounter(50, active, 800, '$');

  const metrics = [
    { label: 'Cost to Build a Page', value: costPage, sub: 'AI agent labor cost', color: '#10B981' },
    { label: 'Cost to Build Entire Platform', value: costPlatform, sub: '262+ pages, 4 engines', color: '#3B82F6' },
    { label: 'Traditional Equivalent', value: traditional, sub: 'Dev team, 12-18 months', color: '#EF4444' },
    { label: 'Subscription Margin', value: margin, sub: 'Near-zero marginal cost', color: '#8B5CF6' },
    { label: 'CAC Target', value: cac, sub: 'AI-driven acquisition', color: '#F59E0B' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto text-center">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: RED }}>Unit Economics</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
          The numbers <span style={{ color: RED }}>speak</span>
        </h2>

        <div className="grid grid-cols-5 gap-4">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 120}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease',
              }}
            >
              <p className="text-3xl font-bold mb-1" style={{ color: m.color }}>{m.value}</p>
              <p className="text-white text-sm font-medium mb-1">{m.label}</p>
              <p className="text-muted-foreground text-xs">{m.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-4 rounded-xl border border-zinc-800 bg-card inline-block">
          <p className="text-muted-foreground text-sm">
            <span className="text-white font-semibold">434x cost advantage</span> over traditional development
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideRoadmap({ active }: { active: boolean }) {
  const quarters = [
    { q: 'Q1 2026', title: 'Platform Launch', items: ['4-engine platform live', 'Agent workforce active', '262+ pages deployed'], done: true },
    { q: 'Q2 2026', title: 'White-Label + Partners', items: ['Partner portal (Lite + Pro)', 'Custom domain routing', 'Affiliate engine'], done: false },
    { q: 'Q3 2026', title: 'Mobile + Voice-First', items: ['Native mobile app', 'Voice command interface', 'Deepgram integration'], done: false },
    { q: 'Q4 2026', title: 'Marketplace', items: ['Third-party agents', 'Template marketplace', 'Developer API'], done: false },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-6xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>Roadmap</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Where we're <span style={{ color: RED }}>going</span>
        </h2>

        <div className="grid grid-cols-4 gap-6 relative">
          {/* Timeline line */}
          <div className="absolute top-[52px] left-0 right-0 h-[2px] bg-muted" />

          {quarters.map((q, i) => (
            <div
              key={i}
              className="relative"
              style={{
                transitionDelay: `${i * 200}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s ease',
              }}
            >
              {/* Timeline dot */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-6 h-6 rounded-full border-2 z-10 relative"
                  style={{
                    borderColor: q.done ? RED : '#3f3f46',
                    background: q.done ? RED : '#18181b',
                  }}
                >
                  {q.done && <div className="absolute inset-1 rounded-full bg-white" />}
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${q.done ? 'border-red-500/30' : 'border-zinc-800'} bg-card`}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: q.done ? RED : '#71717a' }}>{q.q}</p>
                <h3 className="text-lg font-bold text-white mb-3">{q.title}</h3>
                <div className="space-y-2">
                  {q.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {q.done ? (
                        <span style={{ color: RED }}>&#10003;</span>
                      ) : (
                        <span className="text-muted-foreground">&#9675;</span>
                      )}
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideTeam({ active }: { active: boolean }) {
  const team = [
    { name: 'Mel Briggs', role: 'Founder & Owner', desc: 'Vision, strategy, and supreme authority. Builder of the universe.', icon: Building2, color: RED },
    { name: 'Claude', role: 'AI Architect', desc: 'System design, code generation, and deployment. Anthropic\'s most capable AI.', icon: Brain, color: '#8B5CF6' },
    { name: 'Melli', role: 'AI Operator', desc: 'Customer-facing voice and chat. Deepgram Aurora powered. Always on.', icon: MessageSquare, color: '#EC4899' },
    { name: 'Agent Workforce', role: '40+ Specialized Agents', desc: 'Sales, support, engineering, QA, deploy, patrol, and more.', icon: Network, color: '#3B82F6' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-5xl mx-auto">
      <div className={`transition-all duration-700 w-full ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: RED }}>The Team</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          Human vision. <span className="text-muted-foreground">AI execution.</span>
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {team.map((t, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl border border-zinc-800 bg-card"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.5s ease',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl" style={{ background: `${t.color}15` }}>
                  <t.icon className="w-8 h-8" style={{ color: t.color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t.name}</h3>
                  <p className="text-sm" style={{ color: t.color }}>{t.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideAsk({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 max-w-4xl mx-auto text-center relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${RED} 0%, transparent 70%)` }} />
      </div>

      <div className={`relative transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: RED }}>The Ask</p>
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          We're looking for<br />
          <span style={{ color: RED }}>strategic partners</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join us in building the first AI-native operating system for business. This is the ground floor.
        </p>

        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="w-5 h-5" style={{ color: RED }} />
            <span className="text-lg">mel@memelli.com</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Globe className="w-5 h-5" style={{ color: RED }} />
            <span className="text-lg">universe.memelli.com</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/brochure"
            className="px-6 py-3 rounded-lg border border-zinc-700 text-muted-foreground hover:border-zinc-500 transition-colors text-sm"
          >
            View Brochure
          </Link>
          <Link
            href="/performance"
            className="px-6 py-3 rounded-lg border border-zinc-700 text-muted-foreground hover:border-zinc-500 transition-colors text-sm"
          >
            See Performance
          </Link>
          <Link
            href="/start"
            className="px-6 py-3 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
            style={{ background: RED }}
          >
            Request Demo
          </Link>
        </div>

        <p className="mt-12 text-muted-foreground text-sm">
          Built entirely by AI. This pitch deck included.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PITCH DECK
   ═══════════════════════════════════════════════════════════════════════════════ */

const SLIDES = [
  SlideTitle,
  SlideProblem,
  SlideSolution,
  SlidePlatform,
  SlideAI,
  SlideMarket,
  SlideBusinessModel,
  SlideTraction,
  SlideMoat,
  SlideUnitEconomics,
  SlideRoadmap,
  SlideTeam,
  SlideAsk,
];

const SLIDE_LABELS = [
  'Title',
  'Problem',
  'Solution',
  'Platform',
  'AI Advantage',
  'Market',
  'Business Model',
  'Traction',
  'Moat',
  'Unit Economics',
  'Roadmap',
  'Team',
  'The Ask',
];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number) => {
    if (transitioning || index < 0 || index >= TOTAL_SLIDES || index === current) return;
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => setTransitioning(false), 600);
  }, [current, transitioning]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

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

  // Touch support
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) { diff > 0 ? next() : prev(); }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[hsl(var(--background))] overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-card z-50">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${((current + 1) / TOTAL_SLIDES) * 100}%`,
            background: `linear-gradient(90deg, ${RED}, #991B1B)`,
          }}
        />
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-6 z-50 flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-mono">
          {String(current + 1).padStart(2, '0')} / {TOTAL_SLIDES}
        </span>
      </div>

      {/* Slide label */}
      <div className="absolute top-4 left-6 z-50">
        <span className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
          {SLIDE_LABELS[current]}
        </span>
      </div>

      {/* Slides */}
      {SLIDES.map((SlideComponent, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-500 ease-out"
          style={{
            opacity: current === i ? 1 : 0,
            transform: current === i ? 'scale(1)' : current > i ? 'scale(0.95)' : 'scale(1.05)',
            pointerEvents: current === i ? 'auto' : 'none',
          }}
        >
          <SlideComponent active={current === i} />
        </div>
      ))}

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-card border border-zinc-800 text-muted-foreground hover:text-white hover:border-zinc-600 transition-all backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {current < TOTAL_SLIDES - 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-card border border-zinc-800 text-muted-foreground hover:text-white hover:border-zinc-600 transition-all backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Slide dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300"
            style={{
              width: current === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: current === i ? RED : '#3f3f46',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
