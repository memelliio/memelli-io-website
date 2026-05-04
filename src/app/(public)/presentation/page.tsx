'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  Printer,
  Flame,
  Package,
  ShoppingCart,
  FileText,
  Building2,
  ChevronRight,
  Zap,
  Clock,
  Code2,
  FileStack,
  Shield,
  CreditCard,
  Users,
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  CheckCircle2,
  Layers,
  CircuitBoard,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

const BRAND = {
  name: 'ForgePress Industries',
  tagline: 'Precision DTF & Heat Press Equipment',
  primary: '#0F172A',
  accent: '#F97316',
  support: '#10B981',
  bg: '#FFFFFF',
  text: '#111827',
};

const BUILD_STATS = [
  { label: 'Command Received', value: 1, suffix: '', icon: Zap, duration: 800 },
  { label: 'Build Time', value: 4.2, suffix: 's', icon: Clock, duration: 1200 },
  { label: 'Lines of Code', value: 2847, suffix: '', icon: Code2, duration: 2000 },
  { label: 'Pages Generated', value: 4, suffix: '', icon: FileStack, duration: 1000 },
];

const PRODUCTS = [
  {
    id: 'fp-4060-pro',
    name: 'FP-4060 Pro DTF Printer',
    category: 'DTF Printer',
    description: 'Industrial-grade direct-to-film printer with dual Epson i3200 heads. 40cm print width, white ink circulation, automatic powder shaker included.',
    specs: ['Dual i3200 Heads', '40cm Width', '1440dpi', 'Auto Powder'],
    price: 8499,
    icon: Printer,
    badge: 'Best Seller',
  },
  {
    id: 'fp-6090-ultra',
    name: 'FP-6090 Ultra DTF Printer',
    category: 'DTF Printer',
    description: 'High-volume production DTF system with quad printhead array. 60cm width, integrated dryer, and smart ink management for 24/7 operation.',
    specs: ['Quad Heads', '60cm Width', '2400dpi', 'Integrated Dryer'],
    price: 12999,
    icon: Printer,
    badge: 'Flagship',
  },
  {
    id: 'fp-3030-entry',
    name: 'FP-3030 Entry DTF Printer',
    category: 'DTF Printer',
    description: 'Compact desktop DTF printer perfect for startups and small shops. Single Epson printhead, low maintenance, plug-and-play setup.',
    specs: ['Single Head', '30cm Width', '1200dpi', 'Desktop Size'],
    price: 3299,
    icon: Printer,
    badge: 'Entry Level',
  },
  {
    id: 'hp-1620-auto',
    name: 'HP-1620 Auto Heat Press',
    category: 'Heat Press',
    description: 'Fully automatic pneumatic heat press with 16x20" platen. Digital PID controller, auto-open, slide-out drawer for safe operation.',
    specs: ['16x20" Platen', 'Pneumatic', 'Auto-Open', 'PID Control'],
    price: 2499,
    icon: Flame,
    badge: null,
  },
  {
    id: 'hp-2440-industrial',
    name: 'HP-2440 Industrial Press',
    category: 'Heat Press',
    description: 'Large-format industrial heat press for production environments. 24x40" platen, dual-station capability, heavy-duty steel frame.',
    specs: ['24x40" Platen', 'Dual Station', '500lb Pressure', 'Industrial'],
    price: 5999,
    icon: Flame,
    badge: 'Production',
  },
  {
    id: 'hp-1215-compact',
    name: 'HP-1215 Compact Press',
    category: 'Heat Press',
    description: 'Space-saving clamshell heat press ideal for small batch runs. 12x15" platen, even heat distribution, digital timer and temp display.',
    specs: ['12x15" Platen', 'Clamshell', 'Digital Display', 'Compact'],
    price: 899,
    icon: Flame,
    badge: null,
  },
  {
    id: 'bundle-startup',
    name: 'Startup Bundle',
    category: 'Starter Bundle',
    description: 'Everything to launch your DTF business: FP-3030 Entry printer, HP-1215 Compact press, 100m film roll, starter ink set, and training access.',
    specs: ['Printer + Press', '100m Film', 'Ink Set', 'Training'],
    price: 4499,
    icon: Package,
    badge: 'Save $699',
  },
  {
    id: 'bundle-production',
    name: 'Production Bundle',
    category: 'Starter Bundle',
    description: 'Full production setup: FP-4060 Pro printer, HP-1620 Auto press, 500m film, full CMYK+W ink set, 1-year extended warranty, and onboarding.',
    specs: ['Printer + Press', '500m Film', 'Full Ink Kit', '1-Year Warranty'],
    price: 10999,
    icon: Package,
    badge: 'Save $1,999',
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(end: number, duration: number, shouldStart: boolean) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, shouldStart]);

  return count;
}

/* ═══════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════ */

function StatCard({ stat, index, inView }: { stat: typeof BUILD_STATS[0]; index: number; inView: boolean }) {
  const count = useAnimatedCounter(stat.value, stat.duration, inView);
  const Icon = stat.icon;
  const display = stat.value % 1 !== 0 ? count.toFixed(1) : Math.round(count).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:border-orange-300/50 hover:shadow-lg hover:shadow-orange-500/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-orange-400">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-3xl font-bold tracking-tight text-[#0F172A]">
          {display}{stat.suffix}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════════════════════════ */

function ProductCard({ product, index }: { product: typeof PRODUCTS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = product.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-orange-300/60 hover:shadow-xl hover:shadow-orange-500/10"
    >
      {/* Glass header */}
      <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.12),transparent_60%)]" />
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
        <Icon className="relative h-16 w-16 text-orange-400 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
        {product.badge && (
          <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/30">
            {product.badge}
          </span>
        )}
        <span className="absolute bottom-3 left-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {product.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-[#0F172A] leading-tight">{product.name}</h3>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">{product.description}</p>

        {/* Specs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {product.specs.map((spec) => (
            <span
              key={spec}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {spec}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-2xl font-extrabold text-[#0F172A]">
              ${product.price.toLocaleString()}
            </span>
            <span className="ml-1 text-sm text-slate-400">USD</span>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-[#0F172A] px-4 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:bg-[#1E293B] hover:shadow-xl">
              Buy Now
            </button>
            <button className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-[12px] font-bold text-orange-600 transition-all duration-200 hover:bg-orange-100 hover:border-orange-400">
              Net Terms
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════════════ */

function Section({
  children,
  className = '',
  dark = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative px-4 py-20 md:px-8 lg:py-28 ${
        dark ? 'bg-[#0F172A] text-white' : 'bg-white text-[#111827]'
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PATH CARD (Checkout / Net Terms)
   ═══════════════════════════════════════════════════════════════════════ */

function PathCard({
  title,
  subtitle,
  steps,
  accentColor,
  icon: Icon,
  dark = false,
}: {
  title: string;
  subtitle: string;
  steps: { step: string; detail: string }[];
  accentColor: string;
  icon: React.ComponentType<any>;
  dark?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 ${
        dark
          ? 'border-white/10 bg-muted backdrop-blur-sm'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl ${accentColor}`} />
      <div className="relative">
        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
            dark ? 'bg-white/10' : 'bg-[#0F172A]'
          }`}
        >
          <Icon className={`h-6 w-6 ${dark ? 'text-orange-400' : 'text-orange-400'}`} />
        </div>
        <h3 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-[#0F172A]'}`}>
          {title}
        </h3>
        <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>
        <div className="mt-8 space-y-5">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-[13px] font-bold text-white">
                {i + 1}
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-[#0F172A]'}`}>
                  {s.step}
                </p>
                <p className={`mt-0.5 text-[13px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACCESS BLOCK
   ═══════════════════════════════════════════════════════════════════════ */

function AccessBlock({
  title,
  description,
  href,
  cta,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ComponentType<any>;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-muted p-8 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:bg-muted"
      >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative flex items-start gap-5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 transition-colors duration-300 group-hover:bg-orange-500/20">
            <Icon className="h-7 w-7 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-400 transition-colors duration-200 group-hover:text-orange-300">
              {cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function PresentationPage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="relative overflow-hidden bg-white">
      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-[#0F172A] px-4 text-center"
      >
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 max-w-4xl">
          {/* Animated Wordmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl lg:text-8xl">
                <span className="relative">
                  Forge
                  <span className="text-orange-500">Press</span>
                  <motion.span
                    className="absolute -inset-x-4 -inset-y-2 rounded-lg bg-orange-500/10 blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-orange-400/80"
              >
                Industries
              </motion.p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-2xl font-bold leading-tight text-white/90 md:text-3xl lg:text-4xl"
          >
            Welcome to Your Presentation Page
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400"
          >
            We&apos;d like to show you what our system is all about.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500"
          >
            This entire page -- products, checkout flows, portal access, and spec sheets -- was
            autonomously generated from a single command. No templates. No manual design.
            Built by an AI-native commerce engine in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <a
              href="#products"
              className="group inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:bg-orange-400 hover:shadow-orange-400/30"
            >
              View Products
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-sm font-bold text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-muted hover:text-white"
            >
              How It Works
            </a>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── 2. EXECUTIVE INTRO ───────────────────────────────────── */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-orange-600">
              <CircuitBoard className="h-3.5 w-3.5" />
              Live System Demo
            </span>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
              What You&apos;re Looking At
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              This is a fully functional B2B commerce presentation for{' '}
              <span className="font-semibold text-[#0F172A]">{BRAND.name}</span> --
              a premium DTF printer and heat press equipment supplier. Every product listing,
              checkout path, net terms application, and resource page was generated autonomously
              by a single AI command.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              The system interpreted a natural-language directive, decomposed it into page
              architecture, generated product data with realistic specs and pricing, built the
              complete UI, and deployed it -- all without human intervention. This is the engine
              your investment powers.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ── 3. LIVE BUILD SUMMARY ────────────────────────────────── */}
      <section className="relative bg-slate-50 px-4 py-20 md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
              Build Telemetry
            </h2>
            <p className="mt-3 text-base text-slate-500">
              Real-time metrics from this page&apos;s autonomous generation
            </p>
          </div>
          <div ref={statsRef} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BUILD_STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} inView={statsInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT SHOWCASE ──────────────────────────────────── */}
      <Section id="products">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-orange-600">
            <Layers className="h-3.5 w-3.5" />
            Product Catalog
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
            Equipment Lineup
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
            Professional-grade DTF printers, heat presses, and production bundles
            engineered for B2B operators and print shops.
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PRODUCTS.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </Section>

      {/* ── 5 & 6. CHECKOUT + NET TERMS PATHS ────────────────────── */}
      <Section dark id="how-it-works">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Two Paths to Purchase
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
            Whether you&apos;re ready to buy today or need flexible business terms,
            we&apos;ve built a frictionless path for every buyer.
          </p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <PathCard
            title="Direct Checkout"
            subtitle="Immediate purchase for buyers ready to deploy equipment now."
            icon={ShoppingCart}
            accentColor="bg-orange-500/10"
            dark
            steps={[
              { step: 'Select Equipment', detail: 'Choose from our catalog of printers, presses, and production bundles with full specs visible.' },
              { step: 'Configure & Customize', detail: 'Add accessories, extended warranties, and training packages to your order.' },
              { step: 'Secure Checkout', detail: 'PCI-compliant payment processing with Stripe. Credit card, ACH, or wire transfer accepted.' },
              { step: 'Shipping & Onboarding', detail: 'Freight shipping with tracking. Dedicated onboarding specialist assigned to your account.' },
            ]}
          />
          <PathCard
            title="Apply for Net Terms"
            subtitle="B2B credit facility for qualified businesses. Net 30/60/90 available."
            icon={Building2}
            accentColor="bg-emerald-500/10"
            dark
            steps={[
              { step: 'Business Application', detail: 'Submit your business details, EIN, trade references, and bank information through our secure portal.' },
              { step: 'Automated Underwriting', detail: 'AI-powered credit assessment reviews your application in under 4 hours. No hard credit pull required.' },
              { step: 'Terms & Credit Limit', detail: 'Receive your approved net terms (30/60/90) and revolving credit limit based on qualification tier.' },
              { step: 'Purchase on Account', detail: 'Order equipment against your credit line. Invoices generated automatically. Pay on your terms.' },
            ]}
          />
        </div>
      </Section>

      {/* ── 7, 8, 9. ACCESS BLOCKS ──────────────────────────────── */}
      <section className="relative bg-[#0F172A] px-4 py-20 md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Resources & Access
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
              Everything your team needs to evaluate, compare, and procure equipment.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <AccessBlock
              title="Buyer Portal"
              description="Access your account, order history, net terms status, and equipment management dashboard. Track shipments and manage your fleet."
              href="/presentation/portal"
              cta="Open Portal"
              icon={Users}
              index={0}
            />
            <AccessBlock
              title="Spec Sheets"
              description="Detailed technical specifications for every product in our catalog. Print dimensions, resolution data, power requirements, and maintenance schedules."
              href="/presentation/specs"
              cta="View Specs"
              icon={FileText}
              index={1}
            />
            <AccessBlock
              title="Product Brochure"
              description="Downloadable PDF brochure with complete product lineup, pricing matrix, bundle comparisons, and financing options for your procurement team."
              href="/presentation/brochure"
              cta="Get Brochure"
              icon={BookOpen}
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2744] px-4 py-24 md:px-8 lg:py-32">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-orange-500/[0.06] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 backdrop-blur-sm">
              <Zap className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Ready to Scale Your Operation?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Join hundreds of print shops, apparel brands, and production houses that trust
              {BRAND.name} for their DTF and heat press equipment.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#products"
                className="group inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-10 py-5 text-base font-bold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:bg-orange-400 hover:shadow-orange-400/30"
              >
                Shop Equipment
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <Link
                href="/presentation/portal"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-10 py-5 text-base font-bold text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-muted hover:text-white"
              >
                Apply for Net Terms
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 text-[13px] text-slate-500">
              Questions? Contact our B2B sales team at{' '}
              <span className="font-medium text-orange-400/80">sales@forgepress.com</span>
              {' '}or call{' '}
              <span className="font-medium text-orange-400/80">(800) 555-FORGE</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER BAR ───────────────────────────────────────────── */}
      <div className="border-t border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-[12px] text-slate-400">
            &copy; 2026 {BRAND.name}. All rights reserved. Generated autonomously.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600">System Online</span>
            <span className="ml-2 text-[11px] text-slate-400">Powered by Memelli OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
