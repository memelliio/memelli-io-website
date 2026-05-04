'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import {
  ShoppingCart, Users, GraduationCap, Search, MessageSquare, BarChart3,
  Network, FileText, Globe, Zap, Settings, CreditCard, Store, BookOpen,
  TrendingUp, Mail, Phone, Bot, Shield, Activity, Building2, Home,
  Briefcase, Heart, DollarSign, Award, ChevronRight, Download, Calendar,
  Cpu, Database, Layers, GitBranch, Lock, RefreshCw, Eye, Check,
  ArrowRight, Sparkles
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — counts up when scrolled into view
   ══════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2000, decimals = 0 }: {
  end: number; suffix?: string; prefix?: string; duration?: number; decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FADE-IN SECTION — reveals on scroll
   ══════════════════════════════════════════════════════════════════════ */

function FadeInSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   GLASS CARD
   ══════════════════════════════════════════════════════════════════════ */

function GlassCard({ children, className = '', hover = true }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div className={`
      rounded-2xl border border-border bg-white/[0.02] backdrop-blur-xl
      ${hover ? 'transition-all duration-300 hover:border-border hover:bg-muted hover:shadow-lg hover:shadow-red-500/[0.03]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   GRADIENT DIVIDER
   ══════════════════════════════════════════════════════════════════════ */

function GradientDivider() {
  return (
    <div className="relative py-16">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2">
        <div className="mx-auto h-full max-w-4xl bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PARTICLE BACKGROUND — canvas-based particle field
   ══════════════════════════════════════════════════════════════════════ */

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const init = () => {
      resize();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.min(120, Math.floor((w * h) / 8000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
      }));
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 29, 46, ${p.o})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(225, 29, 46, ${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED GLOBE — CSS-based rotating globe
   ══════════════════════════════════════════════════════════════════════ */

function AnimatedGlobe({ color = '#E11D2E', size = 200 }: { color?: string; size?: number }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)` }}
      />
      {/* Main sphere */}
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${color}44, ${color}11 50%, transparent 70%)`,
          border: `1px solid ${color}33`,
          boxShadow: `0 0 60px ${color}15, inset 0 0 40px ${color}08`,
        }}
      />
      {/* Grid lines */}
      <div className="absolute inset-4 rounded-full overflow-hidden" style={{ animation: 'spin 20s linear infinite' }}>
        {[0, 30, 60, 90, 120, 150].map((deg) => (
          <div
            key={deg}
            className="absolute inset-0"
            style={{
              borderRight: `1px solid ${color}15`,
              transform: `rotateY(${deg}deg)`,
              borderRadius: '50%',
            }}
          />
        ))}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: `${pct}%`,
              width: `${100 - Math.abs(pct - 50)}%`,
              height: '1px',
              background: `${color}12`,
            }}
          />
        ))}
      </div>
      {/* Core dot */}
      <div
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}88` }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FEATURE GRID ITEM
   ══════════════════════════════════════════════════════════════════════ */

function FeatureItem({ icon: Icon, title, desc, delay = 0 }: {
  icon: React.ComponentType<any>; title: string; desc: string; delay?: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <GlassCard className="p-5 h-full">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
          <Icon className="h-5 w-5 text-red-400" />
        </div>
        <h4 className="text-[14px] font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
      </GlassCard>
    </FadeInSection>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TECH STACK BADGE
   ══════════════════════════════════════════════════════════════════════ */

function TechBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   USE CASE CARD
   ══════════════════════════════════════════════════════════════════════ */

function UseCaseCard({ icon: Icon, title, desc, delay = 0 }: {
  icon: React.ComponentType<any>; title: string; desc: string; delay?: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <GlassCard className="p-6 text-center h-full">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/5 border border-red-500/10">
          <Icon className="h-7 w-7 text-red-400" />
        </div>
        <h4 className="text-[15px] font-semibold text-foreground">{title}</h4>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
      </GlassCard>
    </FadeInSection>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PRICING CARD
   ══════════════════════════════════════════════════════════════════════ */

function PricingCard({ tier, price, desc, features, featured = false, delay = 0 }: {
  tier: string; price: string; desc: string; features: string[]; featured?: boolean; delay?: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <div className={`
        relative rounded-2xl border p-8 h-full flex flex-col
        ${featured
          ? 'border-red-500/30 bg-gradient-to-b from-red-500/[0.06] to-transparent shadow-lg shadow-red-500/[0.05]'
          : 'border-border bg-white/[0.02]'
        }
      `}>
        {featured && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Most Popular
          </div>
        )}
        <h4 className="text-[18px] font-bold text-foreground">{tier}</h4>
        <p className="mt-1 text-[12px] text-muted-foreground">{desc}</p>
        <div className="mt-6">
          <span className="text-[36px] font-bold text-foreground">{price}</span>
          {price !== 'Custom' && <span className="text-[13px] text-muted-foreground">/month</span>}
        </div>
        <ul className="mt-6 flex-1 space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <span className="text-[13px] text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/register"
          className={`mt-8 block rounded-xl py-3 text-center text-[13px] font-semibold transition-all duration-200 ${
            featured
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500'
              : 'border border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Get Started
        </Link>
      </div>
    </FadeInSection>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   AGENT POOL VISUAL
   ══════════════════════════════════════════════════════════════════════ */

function AgentPoolVisual() {
  const pools = [
    { name: 'Commerce', count: 40, color: '#E11D2E' },
    { name: 'CRM', count: 35, color: '#3B82F6' },
    { name: 'Coaching', count: 30, color: '#8B5CF6' },
    { name: 'SEO', count: 25, color: '#10B981' },
    { name: 'Deploy', count: 20, color: '#F59E0B' },
    { name: 'Patrol', count: 15, color: '#EC4899' },
    { name: 'Comms', count: 30, color: '#06B6D4' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {pools.map((pool, idx) => (
        <FadeInSection key={pool.name} delay={idx * 80}>
          <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
            <div className="mx-auto mb-2 flex flex-wrap justify-center gap-[3px]" style={{ maxWidth: 80 }}>
              {Array.from({ length: Math.min(pool.count, 16) }).map((_, i) => (
                <div
                  key={i}
                  className="h-[6px] w-[6px] rounded-full"
                  style={{
                    background: pool.color,
                    opacity: 0.4 + (i / 16) * 0.6,
                    animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="text-[20px] font-bold text-foreground">{pool.count}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{pool.name}</p>
          </div>
        </FadeInSection>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN BROCHURE PAGE
   ══════════════════════════════════════════════════════════════════════ */

export default function BrochurePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))]">

      {/* ─── SECTION 1: COVER ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24">
        <ParticleBackground />

        {/* Radial gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#09090b_80%)]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <FadeInSection>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[12px] font-medium text-muted-foreground">Powered by Claude AI</span>
            </div>
          </FadeInSection>

          {/* Title */}
          <FadeInSection delay={100}>
            <h1 className="text-[56px] font-bold leading-[1.05] tracking-tight text-white sm:text-[72px] lg:text-[88px]">
              Memelli <span className="text-red-500">OS</span>
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={200}>
            <p className="mt-6 text-[20px] leading-relaxed text-muted-foreground sm:text-[24px]">
              The AI-First Operating System for Business
            </p>
          </FadeInSection>

          {/* Description */}
          <FadeInSection delay={300}>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              One platform runs your commerce, CRM, coaching, SEO, communications, and more.
              Managed by AI agents that never sleep. Built on Claude.
            </p>
          </FadeInSection>

          {/* CTAs */}
          <FadeInSection delay={400}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
              >
                <Calendar className="h-4 w-4" />
                Schedule Demo
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-[14px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-white"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </FadeInSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-5 w-5 rotate-90 text-muted-foreground" />
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 2: WHAT IS MEMELLI OS ────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              The Platform
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              What Is Memelli OS?
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            <p className="mx-auto mt-6 max-w-3xl text-center text-[16px] leading-relaxed text-muted-foreground">
              Memelli OS is an AI-first business operating system that replaces your stack of disconnected tools
              with one intelligent platform. Commerce, CRM, coaching, SEO, communications, analytics, and
              automation -- all wired together, all managed by AI agents that handle the work while you
              focus on growth.
            </p>
          </FadeInSection>

          {/* 4 Pillar Cards */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShoppingCart, title: 'Commerce', desc: 'Stores, products, orders, subscriptions, auctions, and affiliate revenue.', color: '#E11D2E' },
              { icon: Users, title: 'CRM', desc: 'Pipelines, deals, contacts, custom fields, and communication history.', color: '#3B82F6' },
              { icon: GraduationCap, title: 'Coaching', desc: 'Programs, modules, lessons, enrollments, quizzes, and certificates.', color: '#8B5CF6' },
              { icon: Search, title: 'SEO Traffic', desc: 'Keyword clusters, AI article generation, IndexNow, and ranking tracking.', color: '#10B981' },
            ].map((pillar, idx) => (
              <FadeInSection key={pillar.title} delay={idx * 100}>
                <GlassCard className="p-6 h-full">
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: `${pillar.color}15` }}
                  >
                    <pillar.icon className="h-6 w-6" style={{ color: pillar.color }} />
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </GlassCard>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={500}>
            <p className="mt-12 text-center text-[15px] font-medium text-muted-foreground">
              One platform. Every business function. <span className="text-red-400">AI-managed.</span>
            </p>
          </FadeInSection>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 3: THE AI LAYER ──────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Dual AI Architecture
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              The AI Layer
            </h2>
          </FadeInSection>

          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Melli */}
            <FadeInSection delay={100}>
              <GlassCard className="p-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-red-500/[0.04] blur-3xl" />
                <div className="relative flex items-start gap-6">
                  <AnimatedGlobe color="#E11D2E" size={120} />
                  <div className="flex-1">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Operator</span>
                    </div>
                    <h3 className="text-[24px] font-bold text-foreground">Melli</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      Your AI operator. Melli handles customer conversations, routes inquiries,
                      qualifies leads, books appointments, and manages communications across SMS,
                      email, chat, and voice -- 24/7.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </FadeInSection>

            {/* Claude */}
            <FadeInSection delay={200}>
              <GlassCard className="p-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/[0.04] blur-3xl" />
                <div className="relative flex items-start gap-6">
                  <AnimatedGlobe color="#3B82F6" size={120} />
                  <div className="flex-1">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Architect</span>
                    </div>
                    <h3 className="text-[24px] font-bold text-foreground">Claude</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      Your AI architect. Claude builds systems, writes code, deploys infrastructure,
                      repairs issues, and manages the entire platform autonomously -- from schema
                      changes to production deployments.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </FadeInSection>
          </div>

          <FadeInSection delay={300}>
            <div className="mt-12 text-center">
              <p className="text-[17px] font-medium text-muted-foreground">
                Melli talks to your customers. Claude builds your systems.
              </p>
              <p className="mt-3 text-[14px] text-muted-foreground">
                <span className="font-semibold text-red-400">40+ parallel agents</span> handle everything -- commerce,
                support, content, deployment, monitoring, and repair. Simultaneously.
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 4: FEATURE GRID ──────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Everything Included
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              What&apos;s Included
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[14px] text-muted-foreground">
              Every tool your business needs, wired together in one platform.
            </p>
          </FadeInSection>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FeatureItem icon={Users} title="CRM" desc="Pipelines, deals, contacts, and custom fields" delay={0} />
            <FeatureItem icon={Store} title="E-Commerce" desc="Stores, products, subscriptions, and payments" delay={50} />
            <FeatureItem icon={GraduationCap} title="Coaching" desc="Courses, quizzes, certificates, and enrollments" delay={100} />
            <FeatureItem icon={Search} title="SEO Engine" desc="AI articles, keyword clusters, and rankings" delay={150} />
            <FeatureItem icon={MessageSquare} title="Communications" desc="SMS, email, live chat, voice, and IVR" delay={200} />
            <FeatureItem icon={BarChart3} title="Analytics" desc="Dashboards and reports per engine" delay={250} />
            <FeatureItem icon={Network} title="Affiliate Portal" desc="Infinity Network with Lite and Pro tiers" delay={300} />
            <FeatureItem icon={FileText} title="Client Portal" desc="Documents, forms, and secure file sharing" delay={350} />
            <FeatureItem icon={Globe} title="Website Builder" desc="AI-powered site creation and hosting" delay={400} />
            <FeatureItem icon={Zap} title="Lead Generation" desc="Market signals, scoring, and outreach" delay={450} />
            <FeatureItem icon={Settings} title="Workflow Automation" desc="OmniFlow visual workflow builder" delay={500} />
            <FeatureItem icon={CreditCard} title="Credit & Funding" desc="Credit repair, prequalification, and business funding" delay={550} />
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 5: HOW IT'S BUILT ────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Engineering
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              Built by AI, for Humans
            </h2>
          </FadeInSection>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { value: <AnimatedCounter end={262} suffix="+" />, label: 'Pages in One Deploy' },
              { value: <AnimatedCounter end={4.40} prefix="$" decimals={2} />, label: 'Per Page Cost' },
              { value: <AnimatedCounter end={28.9} suffix="s" decimals={1} />, label: 'Compile Time' },
              { value: <AnimatedCounter end={43} suffix="" />, label: 'System Stages' },
            ].map((stat, idx) => (
              <FadeInSection key={idx} delay={idx * 100}>
                <GlassCard className="p-6 text-center" hover={false}>
                  <p className="text-[32px] font-bold text-white sm:text-[40px]">{stat.value}</p>
                  <p className="mt-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </GlassCard>
              </FadeInSection>
            ))}
          </div>

          {/* Properties */}
          <FadeInSection delay={400}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <TechBadge label="TypeScript Strict" />
              <TechBadge label="Self-Healing" />
              <TechBadge label="Multi-Tenant" />
              <TechBadge label="Zero-Trust Security" />
              <TechBadge label="Auto-Deploying" />
              <TechBadge label="Event-Driven" />
            </div>
          </FadeInSection>

          {/* Tech stack visual */}
          <FadeInSection delay={500}>
            <GlassCard className="mt-12 p-8" hover={false}>
              <h3 className="mb-6 text-center text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                Technology Stack
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { icon: Layers, label: 'Next.js 15', desc: 'App Router' },
                  { icon: Cpu, label: 'Fastify 5', desc: 'API Kernel' },
                  { icon: Database, label: 'PostgreSQL', desc: 'Prisma 6 ORM' },
                  { icon: Activity, label: 'BullMQ', desc: '9 Queue Workers' },
                  { icon: GitBranch, label: 'Turborepo', desc: 'Monorepo' },
                  { icon: Lock, label: 'JWT RS256', desc: 'Auth Layer' },
                ].map((tech, idx) => (
                  <div key={idx} className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <tech.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] font-semibold text-foreground">{tech.label}</p>
                    <p className="text-[11px] text-muted-foreground">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </FadeInSection>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 6: AGENT WORKFORCE ───────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Autonomous Operations
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              The Agent Workforce
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[16px] text-muted-foreground">
              Your business runs 24/7 -- agents never sleep.
            </p>
          </FadeInSection>

          <div className="mt-16">
            <AgentPoolVisual />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: RefreshCw, title: 'Self-Healing', desc: 'Agents detect and repair issues before you notice them.' },
              { icon: Shield, title: 'Self-Validating', desc: 'Every deployment is tested, verified, and monitored.' },
              { icon: Zap, title: 'Auto-Deploying', desc: 'Code ships to production without manual intervention.' },
              { icon: Eye, title: 'Patrol Grid', desc: '20 domains monitored continuously for anomalies.' },
            ].map((item, idx) => (
              <FadeInSection key={item.title} delay={idx * 100}>
                <GlassCard className="p-5">
                  <item.icon className="mb-3 h-5 w-5 text-red-400" />
                  <h4 className="text-[14px] font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.desc}</p>
                </GlassCard>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 7: USE CASES ─────────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Built For You
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              For Every Business
            </h2>
          </FadeInSection>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <UseCaseCard
              icon={Home}
              title="Real Estate Agencies"
              desc="Manage listings, qualify leads, automate follow-ups, and close deals with AI-powered pipelines."
              delay={0}
            />
            <UseCaseCard
              icon={BookOpen}
              title="Coaching Businesses"
              desc="Deliver courses, track progress, issue certificates, and grow your client base automatically."
              delay={100}
            />
            <UseCaseCard
              icon={ShoppingCart}
              title="E-Commerce Brands"
              desc="Run your store, manage inventory, process orders, and optimize conversions with AI."
              delay={200}
            />
            <UseCaseCard
              icon={Briefcase}
              title="Service Businesses"
              desc="Schedule appointments, manage client relationships, and automate billing and communications."
              delay={300}
            />
            <UseCaseCard
              icon={Network}
              title="Affiliate Networks"
              desc="Track referrals, manage commissions, provide partner portals, and scale your network."
              delay={400}
            />
            <UseCaseCard
              icon={DollarSign}
              title="Credit & Funding Companies"
              desc="Prequalify clients, manage credit repair workflows, and streamline funding applications."
              delay={500}
            />
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 8: PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <FadeInSection>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
              Simple Pricing
            </p>
            <h2 className="mt-4 text-center text-[36px] font-bold leading-tight text-white sm:text-[44px]">
              Pricing Preview
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-[14px] text-muted-foreground">
              Everything included. No add-ons. No hidden fees.
            </p>
          </FadeInSection>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <PricingCard
              tier="Starter"
              price="$97"
              desc="For solo entrepreneurs and small teams"
              features={[
                'All 4 engines included',
                'Up to 1,000 contacts',
                'AI assistant (Melli)',
                'SMS + email + chat',
                'Basic analytics',
                'Community support',
              ]}
              delay={0}
            />
            <PricingCard
              tier="Pro"
              price="$297"
              desc="For growing businesses that need scale"
              features={[
                'Everything in Starter',
                'Unlimited contacts',
                'Full agent workforce',
                'Workflow automation',
                'Affiliate portal',
                'Priority support',
                'Custom domain',
                'Advanced analytics',
              ]}
              featured
              delay={100}
            />
            <PricingCard
              tier="Enterprise"
              price="Custom"
              desc="For organizations that need full control"
              features={[
                'Everything in Pro',
                'Dedicated agent pools',
                'White-label portal',
                'Custom integrations',
                'SLA guarantee',
                'Dedicated support',
                'On-boarding concierge',
              ]}
              delay={200}
            />
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─── SECTION 9: CTA ───────────────────────────────────────────── */}
      <section className="relative px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,29,46,0.06)_0%,_transparent_60%)]" />

          <FadeInSection>
            <h2 className="relative text-[40px] font-bold leading-tight text-white sm:text-[52px]">
              Start Building Your <span className="text-red-500">Universe</span>
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            <p className="relative mt-6 text-[16px] leading-relaxed text-muted-foreground">
              Join the next generation of AI-powered businesses. Your entire operation,
              managed by intelligent agents, running on one platform.
            </p>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-[15px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-white"
              >
                Create Account
              </Link>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="relative mt-12 flex flex-col items-center gap-2 text-[13px] text-muted-foreground">
              <p>questions@memelli.com</p>
              <p>memelli.com</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Global keyframe for globe spin */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @media print {
          header, footer, .floating-sphere, .public-sphere-chat { display: none !important; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}