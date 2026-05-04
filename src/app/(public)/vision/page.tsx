'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Zap, TrendingUp, Shield, Rocket, Brain,
  Package, CreditCard, Bot, DollarSign,
  CheckCircle2, Clock, ArrowRight, Mail, Phone,
  Sparkles, Activity, Globe, Server, Users,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, active: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, target, duration]);

  return value;
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
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FADE-IN WRAPPER
   ═══════════════════════════════════════════════════════════════════════════════ */

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LIVE PULSE DOT
   ═══════════════════════════════════════════════════════════════════════════════ */

function PulseDot({ color = 'bg-emerald-500' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  prefix = '',
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.3);
  const count = useAnimatedCounter(value, inView);

  return (
    <FadeIn delay={delay}>
      <div
        ref={ref}
        className="group relative overflow-hidden rounded-2xl border border-border bg-white/[0.02] p-6 md:p-8 transition-all duration-300 hover:border-border hover:bg-muted"
      >
        {/* Subtle top-edge glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-3 text-3xl font-light tracking-tight text-white md:text-4xl">
              {prefix}{count.toLocaleString()}{suffix}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PulseDot />
            <Icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground" />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TIMELINE PHASE
   ═══════════════════════════════════════════════════════════════════════════════ */

type PhaseStatus = 'complete' | 'active' | 'next' | 'queued' | 'future';

const statusConfig: Record<PhaseStatus, { color: string; dotColor: string; label: string; barWidth: string }> = {
  complete: { color: 'text-emerald-400', dotColor: 'bg-emerald-500', label: 'COMPLETE', barWidth: 'w-full' },
  active:   { color: 'text-amber-400',   dotColor: 'bg-amber-500',   label: 'ACTIVE',   barWidth: 'w-3/5' },
  next:     { color: 'text-blue-400',    dotColor: 'bg-blue-500',    label: 'NEXT',     barWidth: 'w-1/4' },
  queued:   { color: 'text-violet-400',  dotColor: 'bg-violet-500',  label: 'QUEUED',   barWidth: 'w-[8%]' },
  future:   { color: 'text-muted-foreground',    dotColor: 'bg-muted',    label: 'FUTURE',   barWidth: 'w-[3%]' },
};

function TimelinePhase({
  phase,
  title,
  description,
  status,
  delay,
  isLast = false,
}: {
  phase: number;
  title: string;
  description: string;
  status: PhaseStatus;
  delay: number;
  isLast?: boolean;
}) {
  const cfg = statusConfig[status];

  return (
    <FadeIn delay={delay}>
      <div className="relative flex gap-6 md:gap-8">
        {/* Vertical line + dot */}
        <div className="flex flex-col items-center">
          <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-[#0a0a0f] text-[13px] font-semibold ${cfg.color}`}>
            {phase}
          </div>
          {!isLast && (
            <div className="w-px flex-1 bg-gradient-to-b from-white/[0.08] to-transparent" />
          )}
        </div>

        {/* Content */}
        <div className="pb-12 md:pb-16">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-medium text-foreground md:text-xl">{title}</h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${cfg.color} border-current/20`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {description}
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${cfg.dotColor} ${cfg.barWidth} transition-all duration-1000`} />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function ProductCard({
  icon: Icon,
  title,
  description,
  spawning = true,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  spawning?: boolean;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-white/[0.02] p-6 md:p-8 transition-all duration-300 hover:border-border hover:bg-muted">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {spawning && (
            <div className="flex items-center gap-1.5">
              <PulseDot color="bg-emerald-500" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-500/70">
                Spawning
              </span>
            </div>
          )}
        </div>

        <h3 className="mt-5 text-[15px] font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   NOTIFICATION FORM
   ═══════════════════════════════════════════════════════════════════════════════ */

function NotifyForm() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!email && !phone) return;
      // Mock submission
      setSubmitted(true);
    },
    [email, phone]
  );

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-6 py-4"
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <p className="text-[14px] text-emerald-300">
          You are on the list. We will reach out the moment sessions open.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-border bg-white/[0.02] py-3 pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-border focus:bg-muted"
          />
        </div>
      </div>
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Phone (optional)
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="w-full rounded-xl border border-border bg-white/[0.02] py-3 pl-10 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-border focus:bg-muted"
          />
        </div>
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-card px-6 py-3 text-[13px] font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98] sm:shrink-0"
      >
        Notify Me
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function BelieverDashboard() {
  return (
    <div className="relative min-h-screen bg-[hsl(var(--background))]">
      {/* Subtle ambient gradient at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]" />

      {/* ─── SECTION 1: HERO WELCOME ─────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-24 md:px-8 md:pt-32 md:pb-36">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.02] px-4 py-1.5">
              <PulseDot />
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Believers Only
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to the{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Universe
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-relaxed text-muted-foreground md:text-[18px]">
              I told you I had a big brain. Memelli OS is LIVE and spawning. This is bigger
              than anything you have imagined. Welcome to the inside.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-white/[0.08]">
                <span className="text-[13px] font-bold text-white">M</span>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-muted-foreground">Mel Briggs</p>
                <p className="text-[11px] text-muted-foreground">Founder, Memelli Universe</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── SECTION 2: LIVE UNIVERSE STATS ──────────────────────────── */}
      <section className="px-6 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-12 md:mb-16">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Live Telemetry
              </p>
              <h2 className="mt-2 text-2xl font-light tracking-tight text-muted-foreground md:text-3xl">
                Universe Status
              </h2>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Package}     label="Products Spawned"       value={847}  delay={0}    />
            <StatCard icon={Zap}         label="Revenue Engines Active" value={8}    delay={0.05} />
            <StatCard icon={Bot}         label="AI Agents Online"       value={1300} suffix="+" delay={0.1} />
            <StatCard icon={Server}      label="API Lanes at Tier 4"    value={3}    suffix=" of 5" delay={0.15} />
            <StatCard icon={Activity}    label="Features in Queue"      value={320}  suffix="+" delay={0.2} />
            <StatCard icon={Shield}      label="Uptime"                 value={99}   suffix=".9%" delay={0.25} />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── SECTION 3: VISION TIMELINE ──────────────────────────────── */}
      <section className="px-6 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="mb-12 md:mb-16">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Roadmap
              </p>
              <h2 className="mt-2 text-2xl font-light tracking-tight text-muted-foreground md:text-3xl">
                Vision Timeline
              </h2>
            </div>
          </FadeIn>

          <div>
            <TimelinePhase
              phase={1}
              title="Core OS"
              description="420+ pages, 250+ API routes, 43-stage constitution, full agent architecture. The foundation is built and operational."
              status="complete"
              delay={0}
            />
            <TimelinePhase
              phase={2}
              title="Revenue Engines"
              description="8 engines spawning across commerce, credit, coaching, affiliates, and AI workforce. Revenue infrastructure activating."
              status="active"
              delay={0.1}
            />
            <TimelinePhase
              phase={3}
              title="Marketplace Expansion"
              description="Stripe Connect, Fiverr integration, Etsy syndication, and multi-platform product distribution."
              status="next"
              delay={0.2}
            />
            <TimelinePhase
              phase={4}
              title="Social Army"
              description="300-500 automated accounts, SEO supernova content engine, multi-platform organic reach at scale."
              status="queued"
              delay={0.3}
            />
            <TimelinePhase
              phase={5}
              title="Full Automation"
              description="Screen recording to Playwright pipeline. Zero-human task execution. The universe runs itself."
              status="future"
              delay={0.4}
              isLast
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── SECTION 4: WHAT WE'RE BUILDING ──────────────────────────── */}
      <section className="px-6 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="mb-12 md:mb-16">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Product Suite
              </p>
              <h2 className="mt-2 text-2xl font-light tracking-tight text-muted-foreground md:text-3xl">
                What We Are Building
              </h2>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProductCard
              icon={Globe}
              title="Free Business Tools"
              description="Corp Builder, EIN filing, soft credit pulls. Free tools that bring entrepreneurs into the universe and build trust from day one."
              delay={0}
            />
            <ProductCard
              icon={CreditCard}
              title="Credit Intelligence"
              description="SBS Simulator, business credit builder, auto funder matching. AI-driven credit infrastructure that finds money for people."
              delay={0.08}
            />
            <ProductCard
              icon={Brain}
              title="AI Workforce"
              description="1,300+ autonomous agents. Self-healing, self-deploying, self-educating. An entire digital workforce that never sleeps."
              delay={0.16}
            />
            <ProductCard
              icon={DollarSign}
              title="Revenue Streams"
              description="8 revenue engines targeting $5K-$50K customer lifetime value. Subscriptions, commissions, services, and AI-generated income."
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── SECTION 5: VISION SESSIONS ──────────────────────────────── */}
      <section className="px-6 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.02] px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Coming Soon
                </span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-center text-2xl font-light tracking-tight text-foreground md:text-3xl">
              Memelli OS Vision Sessions
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="mx-auto mt-2 text-center text-[14px] italic text-muted-foreground">
              Where the Universe Expands
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
              Be the first to join our live sessions where we reveal new spawns, demo the
              technology, and map the future. You will be notified the moment registration opens.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10">
              <NotifyForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ─── SECTION 6: PERSONAL NOTE ────────────────────────────────── */}
      <section className="px-6 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="text-[16px] font-light leading-relaxed text-muted-foreground md:text-[18px]">
              Thank you for believing. This is just the beginning.
              <br />
              The universe does not stop spawning.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-muted" />
              <p className="text-[13px] font-medium text-muted-foreground">Mel Briggs</p>
              <div className="h-px w-8 bg-muted" />
            </div>
            <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">Founder</p>
          </FadeIn>
        </div>
      </section>

      {/* Bottom ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(120,119,198,0.04),transparent)]" />
    </div>
  );
}
