'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scissors,
  Home,
  UtensilsCrossed,
  Dumbbell,
  Church,
  Camera,
  Scale,
  Dog,
  GraduationCap,
  Heart,
  Car,
  Gem,
  Zap,
  Users,
  ShoppingCart,
  BookOpen,
  BarChart3,
  Globe,
  Mail,
  Link,
  Monitor,
  ArrowRight,
  Check,
  X,
  Clock,
  DollarSign,
  Cpu,
  Rocket,
  Sparkles,
  ChevronDown,
  Bot,
  Layers,
  Trophy,
  Target,
  TrendingUp,
  Shield,
  FileCode2,
  Timer,
  AlertTriangle,
  Wrench,
  Database,
  Activity,
  Search,
  MessageSquare,
  Code2,
  GitBranch,
  Package,
  Server,
  Gauge,
  Star,
  Eye,
  Brain,
  Play,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Animated Counter Hook
   ═══════════════════════════════════════════════════════════════════════════ */

function useAnimatedCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHasStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    let frame: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Intersection Observer Hook for Fade-In
   ═══════════════════════════════════════════════════════════════════════════ */

function useFadeIn(threshold: number = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Progress Bar Component
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgressBar({ value, max, label, color = 'bg-red-600', displayValue }: {
  value: number; max: number; label: string; color?: string; displayValue?: string;
}) {
  const [width, setWidth] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setWidth((value / max) * 100); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, max]);

  return (
    <div ref={barRef} className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
        <span className="text-[hsl(var(--foreground))] font-mono">{displayValue ?? value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${width}%`, transition: 'width 1.5s ease-out' }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Comparison Meter Component
   ═══════════════════════════════════════════════════════════════════════════ */

function ComparisonMeter({ label, them, us, unit = '', themLabel = 'Traditional', usLabel = 'Memelli' }: {
  label: string; them: number; us: number; unit?: string; themLabel?: string; usLabel?: string;
}) {
  const ratio = them > 0 ? us / them : 0;
  const savings = them > 0 ? Math.round((1 - ratio) * 100) : 100;

  return (
    <div className="space-y-2">
      <div className="text-sm text-[hsl(var(--foreground))] font-medium">{label}</div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[hsl(var(--muted-foreground))] w-20 shrink-0">{themLabel}</span>
          <div className="flex-1 h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div className="h-full bg-[hsl(var(--muted))] rounded-full" style={{ width: '100%' }} />
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono w-24 text-right shrink-0">{unit}{them.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-red-400 w-20 shrink-0">{usLabel}</span>
          <div className="flex-1 h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full" style={{ width: `${Math.max(ratio * 100, 2)}%`, transition: 'width 1s ease-out' }} />
          </div>
          <span className="text-xs text-red-400 font-mono w-24 text-right shrink-0">{unit}{us.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-950/50 text-red-400 border-red-800">
          {savings}% less
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Badge Component
   ═══════════════════════════════════════════════════════════════════════════ */

function Badge({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'red';
}) {
  const colors = {
    default: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
    success: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
    warning: 'bg-amber-950/50 text-amber-400 border-amber-800',
    red: 'bg-red-950/50 text-red-400 border-red-800',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[variant]}`}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Stat Card (with animated counter)
   ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({ value, label, suffix = '', prefix = '', icon: Icon, accent = false }: {
  value: number; label: string; suffix?: string; prefix?: string;
  icon: LucideIcon; accent?: boolean;
}) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div className={`rounded-xl border p-5 ${accent
      ? 'bg-red-950/20 border-red-900/50'
      : 'bg-[hsl(var(--card))] border-[hsl(var(--border))]'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${accent ? 'bg-red-900/30' : 'bg-[hsl(var(--muted))]'}`}>
          <Icon className={`w-4 h-4 ${accent ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`} />
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-bold font-mono ${accent ? 'text-red-400' : 'text-[hsl(var(--foreground))]'}`}>
        <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deliverable Card (expandable)
   ═══════════════════════════════════════════════════════════════════════════ */

function DeliverableCard({ title, lines, pages, icon: Icon, color, features }: {
  title: string; lines: number; pages: string; icon: LucideIcon; color: string; features: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:border-[hsl(var(--border))] transition-colors">
      <div
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-[hsl(var(--foreground))]" />
          </div>
          <div>
            <h4 className="text-[hsl(var(--foreground))] font-medium">{title}</h4>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{lines.toLocaleString()} lines</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{pages}</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-[hsl(var(--border))] pt-3">
          <div className="grid grid-cols-2 gap-1.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section Wrapper with Fade
   ═══════════════════════════════════════════════════════════════════════════ */

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useFadeIn();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section Header
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ number, title, subtitle }: {
  number: string; title: string; subtitle: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-red-500 font-mono text-sm font-bold tracking-wider">Chapter {number}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-red-900/50 to-transparent" />
      </div>
      <h2 className="text-3xl md:text-5xl font-bold text-[hsl(var(--foreground))] mb-2 tracking-tight">{title}</h2>
      <p className="text-[hsl(var(--muted-foreground))] text-lg max-w-2xl">{subtitle}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════════════════════ */

interface Product {
  icon: LucideIcon;
  name: string;
  description: string;
  traditional: string;
  factory: string;
  traditionalTime: string;
  factoryTime: string;
}

const products: Product[] = [
  { icon: Scissors, name: 'Barbershop Website', description: 'Full site with online booking, gallery, staff profiles', traditional: '$3,500', factory: '$20', traditionalTime: '3-4 weeks', factoryTime: '< 1 hour' },
  { icon: Home, name: 'Real Estate Agent Site', description: 'Property listings, search filters, lead capture, IDX ready', traditional: '$8,000', factory: '$20', traditionalTime: '6-8 weeks', factoryTime: '< 1 hour' },
  { icon: UtensilsCrossed, name: 'Restaurant Ordering', description: 'Digital menu, online ordering, delivery zones, payments', traditional: '$12,000', factory: '$20', traditionalTime: '8-12 weeks', factoryTime: '< 1 hour' },
  { icon: Dumbbell, name: 'Fitness Coach App', description: 'Programs, workout plans, progress tracking, client portal', traditional: '$15,000', factory: '$20', traditionalTime: '10-14 weeks', factoryTime: '< 1 hour' },
  { icon: Church, name: 'Church Website', description: 'Events calendar, donations, sermons, member portal', traditional: '$4,000', factory: '$20', traditionalTime: '4-6 weeks', factoryTime: '< 1 hour' },
  { icon: Camera, name: 'Photography Portfolio', description: 'Gallery, booking calendar, client proofing, packages', traditional: '$3,000', factory: '$20', traditionalTime: '3-4 weeks', factoryTime: '< 1 hour' },
  { icon: Scale, name: 'Law Firm Site', description: 'Practice areas, intake forms, consultation booking, blog', traditional: '$7,000', factory: '$20', traditionalTime: '5-8 weeks', factoryTime: '< 1 hour' },
  { icon: Dog, name: 'Dog Grooming', description: 'Service menu, online scheduling, pet profiles, reminders', traditional: '$2,500', factory: '$20', traditionalTime: '2-3 weeks', factoryTime: '< 1 hour' },
  { icon: GraduationCap, name: 'Online Course Platform', description: '10 lessons, quizzes, certificates, student dashboard', traditional: '$20,000', factory: '$20', traditionalTime: '12-16 weeks', factoryTime: '< 1 hour' },
  { icon: Heart, name: 'Nonprofit Donation Platform', description: 'Campaigns, recurring donations, impact reports, events', traditional: '$5,000', factory: '$20', traditionalTime: '4-6 weeks', factoryTime: '< 1 hour' },
  { icon: Car, name: 'Car Detailing', description: 'Service packages, booking, before/after gallery, reviews', traditional: '$2,000', factory: '$20', traditionalTime: '2-3 weeks', factoryTime: '< 1 hour' },
  { icon: Gem, name: 'Wedding Planner Portal', description: 'Vendor directory, timeline, budget tracker, client login', traditional: '$10,000', factory: '$20', traditionalTime: '8-12 weeks', factoryTime: '< 1 hour' },
];

interface ComparisonRow {
  feature: string;
  agency: string;
  freelancer: string;
  diy: string;
  factory: string;
}

const comparisonData: ComparisonRow[] = [
  { feature: 'Simple Website', agency: '$3,000 - $8,000', freelancer: '$1,500 - $4,000', diy: '$0 + 40hrs', factory: '$20' },
  { feature: 'E-Commerce Store', agency: '$8,000 - $25,000', freelancer: '$4,000 - $10,000', diy: '$30/mo + 80hrs', factory: '$20' },
  { feature: 'Online Courses', agency: '$15,000 - $30,000', freelancer: '$8,000 - $15,000', diy: '$99/mo + 100hrs', factory: '$20' },
  { feature: 'CRM + Pipeline', agency: '$10,000 - $20,000', freelancer: '$5,000 - $12,000', diy: '$50/mo + 60hrs', factory: '$20' },
  { feature: 'Full Platform', agency: '$50,000+', freelancer: '$25,000+', diy: '$200/mo + 200hrs', factory: '$20' },
  { feature: 'Time to Launch', agency: '8-16 weeks', freelancer: '4-10 weeks', diy: '2-6 months', factory: '< 1 hour' },
  { feature: 'Ongoing Support', agency: '$500/mo', freelancer: '$200/mo', diy: 'You', factory: 'AI Agents 24/7' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Product Card
   ═══════════════════════════════════════════════════════════════════════════ */

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { ref, isVisible } = useFadeIn(0.1);
  const Icon = product.icon;

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 transition-all duration-500 hover:border-red-900/50 hover:shadow-lg hover:shadow-red-950/20 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${(index % 4) * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/0 to-red-900/0 transition-all duration-500 group-hover:from-red-950/10 group-hover:to-red-900/5" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/40 text-red-400 transition-colors group-hover:bg-red-900/40 group-hover:text-red-300">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{product.name}</h3>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{product.description}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Traditional</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))] line-through">{product.traditional}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{product.traditionalTime}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Factory</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-red-400">{product.factory}</span>
              <span className="text-xs text-red-400/70">{product.factoryTime}</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 group-hover:w-full"
              style={{ width: '99%' }}
            />
          </div>
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            Save <span className="font-semibold text-red-400">99%+</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Timeline Step
   ═══════════════════════════════════════════════════════════════════════════ */

function TimelineStep({ time, title, desc, active }: {
  time: string; title: string; desc: string; active?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full shrink-0 ${active ? 'bg-red-500 ring-4 ring-red-500/20' : 'bg-[hsl(var(--muted))]'}`} />
        <div className="w-px flex-1 bg-[hsl(var(--muted))]" />
      </div>
      <div className="pb-8">
        <span className="text-xs font-mono text-red-400">{time}</span>
        <h4 className="text-[hsl(var(--foreground))] font-medium mt-0.5">{title}</h4>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function MarketingEbookPage() {
  const pagesBuilt = useAnimatedCounter(262, 2500);
  const totalCost = useAnimatedCounter(1150, 2500);
  const agentsCount = useAnimatedCounter(40, 2000);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ─── Reading progress bar ─── */}
      <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-[hsl(var(--card))]">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150"
          style={{
            width: `${Math.min((scrollY / (typeof document !== 'undefined' ? document.documentElement.scrollHeight - window.innerHeight : 1)) * 100, 100)}%`,
          }}
        />
      </div>

      {/* ─── Floating CTA ─── */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${scrollY > 800 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <button className="bg-red-600 hover:bg-red-700 text-[hsl(var(--foreground))] px-6 py-3 rounded-full font-medium shadow-lg shadow-red-900/30 flex items-center gap-2 transition-colors">
          <Rocket className="w-4 h-4" />
          Start Building
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          COVER — Hero with Real Build Stats
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,46,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,46,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-950/20 blur-[120px]" />

        <div className="relative z-10 max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-900/30 bg-red-950/20 px-4 py-1.5 text-sm text-red-400">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Build Factory</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-[hsl(var(--foreground))]">262 Pages.</span>
            <br />
            <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">28.9 Seconds.</span>
            <br />
            <span className="text-[hsl(var(--muted-foreground))]">$4.40 Each.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-xl">
            We built an entire enterprise operating system &mdash; 50,000+ lines of production code,
            4,504 deployment files, zero errors &mdash; in one continuous build session.
            This is how the Memelli Factory works.
          </p>

          {/* Hero stat badges */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <Badge variant="success">
              <DollarSign className="w-3 h-3" /> $4.40 per page
            </Badge>
            <Badge variant="success">
              <Code2 className="w-3 h-3" /> $0.02 per line of code
            </Badge>
            <Badge variant="success">
              <Clock className="w-3 h-3" /> 3 min commit-to-live
            </Badge>
            <Badge variant="success">
              <Shield className="w-3 h-3" /> Zero type errors
            </Badge>
          </div>

          {/* Hero Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <StatCard value={262} label="Pages Built" icon={FileCode2} accent />
            <StatCard value={4504} label="Deploy Files" icon={Package} />
            <StatCard value={50000} label="Lines of Code" icon={Code2} suffix="+" />
            <StatCard value={0} label="Errors" icon={Shield} />
          </div>

          <div className="animate-bounce text-[hsl(var(--muted-foreground))]">
            <ChevronDown className="mx-auto h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 01 — THE PROBLEM
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="mx-auto max-w-4xl px-6 py-24 sm:py-32" id="problem">
        <SectionHeader number="01" title="The Problem" subtitle="Digital products cost too much and take too long." />
        <div className="space-y-6 text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
          <p>
            Every day, thousands of small businesses need a digital presence.
            A barbershop wants online booking. A fitness coach wants a course platform.
            A nonprofit wants a donation page. Simple requests.
          </p>
          <div className="my-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
            <p className="mb-6 text-center text-sm font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">
              What they&apos;re told it costs
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { range: '$5K - $10K', label: 'Simple Website', icon: Globe },
                { range: '$10K - $25K', label: 'E-Commerce Platform', icon: ShoppingCart },
                { range: '$15K - $30K', label: 'Course Platform', icon: GraduationCap },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="mx-auto mb-3 h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                  <div className="mb-1 text-2xl font-bold text-[hsl(var(--foreground))]">{item.range}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <p>
            And the timeline? <span className="font-semibold text-[hsl(var(--foreground))]">4 to 16 weeks</span>.
            By then, the market has moved. The motivation has faded. The competitor already launched.
          </p>
          <blockquote className="my-8 border-l-2 border-red-800 pl-6 italic text-[hsl(var(--foreground))]">
            &ldquo;The barrier to digital isn&apos;t talent or ideas.
            It&apos;s cost, time, and complexity.
            We removed all three.&rdquo;
          </blockquote>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 02 — THE BUILD (Real Telemetry)
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="mx-auto max-w-6xl px-6 py-24 sm:py-32" id="build">
        <SectionHeader
          number="02"
          title="The Build That Broke the Model"
          subtitle="One build session. 262 production pages. Every metric tracked."
        />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Telemetry Bars */}
          <div className="space-y-6 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
            <h3 className="text-[hsl(var(--foreground))] font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-400" /> Build Telemetry
            </h3>
            <ProgressBar value={262} max={262} label="Pages Compiled" color="bg-red-600" />
            <ProgressBar value={4504} max={5000} label="Deployment Files" color="bg-red-600" />
            <ProgressBar value={50000} max={50000} label="Lines of Code" color="bg-emerald-600" displayValue="50,000+" />
            <ProgressBar value={0} max={100} label="Type Errors" color="bg-emerald-600" displayValue="0" />
            <ProgressBar value={0} max={100} label="Build Warnings" color="bg-emerald-600" displayValue="0" />

            <div className="pt-4 border-t border-[hsl(var(--border))] grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[hsl(var(--foreground))]">28.9<span className="text-sm text-[hsl(var(--muted-foreground))]">s</span></div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Compile Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[hsl(var(--foreground))]">$1,150</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-red-400">3<span className="text-sm text-[hsl(var(--muted-foreground))]">min</span></div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Commit to Live</div>
              </div>
            </div>
          </div>

          {/* Right: Build Timeline */}
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-6">
            <h3 className="text-[hsl(var(--foreground))] font-semibold flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-red-400" /> Build Timeline
            </h3>
            <TimelineStep time="T+0:00" title="Agents Dispatched" desc="3-5 parallel Claude agents spawn, each assigned modules" active />
            <TimelineStep time="T+0:15" title="Core Architecture" desc="Database schema, API routes, auth layer scaffolded" active />
            <TimelineStep time="T+0:30" title="Engine Build Phase" desc="CRM, Commerce, Coaching, SEO engines built simultaneously" active />
            <TimelineStep time="T+0:45" title="Frontend Assembly" desc="262 pages generated with live data binding" active />
            <TimelineStep time="T+0:55" title="Self-Heal Pass" desc="Type checker runs, errors auto-fixed by repair agents" active />
            <TimelineStep time="T+1:00" title="Deploy" desc="4,504 files compiled in 28.9s — zero errors, pushed live" active />

            <div className="mt-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Total elapsed: ~1 hour</span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">From empty repo to production enterprise OS</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 03 — SPEED PROOF
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="bg-[hsl(var(--card))] border-y border-[hsl(var(--border))]" id="speed">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <SectionHeader
            number="03"
            title="Speed Proof"
            subtitle="How we build faster than any team on Earth."
          />

          <div className="grid md:grid-cols-3 gap-6">
            {/* Parallel Agents */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-900/30">
                  <Cpu className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-[hsl(var(--foreground))] font-semibold">Parallel Agents</h3>
              </div>
              <div className="text-4xl font-bold font-mono text-red-400 mb-2">3&ndash;5</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Agents build simultaneously. Each produces 500&ndash;800 lines of production code per task.</p>
              <div className="mt-4 space-y-2">
                {[
                  { color: 'bg-emerald-500', label: 'Agent Alpha — CRM Engine' },
                  { color: 'bg-emerald-500', label: 'Agent Beta — Commerce Engine' },
                  { color: 'bg-emerald-500', label: 'Agent Gamma — Frontend Pages' },
                  { color: 'bg-blue-500', label: 'Agent Delta — API Routes' },
                  { color: 'bg-blue-500', label: 'Agent Epsilon — Self-Heal' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className={`w-2 h-2 rounded-full ${a.color} animate-pulse`} />
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full-Stack Sync */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-900/30">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-[hsl(var(--foreground))] font-semibold">Full-Stack Sync</h3>
              </div>
              <div className="text-4xl font-bold font-mono text-emerald-400 mb-2">1:1</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Every frontend page has its backend API built alongside it. No gaps between UI and data.</p>
              <div className="mt-4 space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
                {[
                  ['pages/crm/contacts', 'GET /api/crm/contacts'],
                  ['pages/commerce/orders', 'GET /api/commerce/orders'],
                  ['pages/coaching/programs', 'GET /api/coaching/programs'],
                ].map(([page, api], i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[hsl(var(--muted))]">
                    <span>{page}</span>
                    <ArrowRight className="w-3 h-3 text-[hsl(var(--muted-foreground))] shrink-0 mx-1" />
                    <span className="text-emerald-400">{api}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Self-Healing Pipeline */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-900/30">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-[hsl(var(--foreground))] font-semibold">Self-Healing Pipeline</h3>
              </div>
              <div className="text-4xl font-bold font-mono text-amber-400 mb-2">0</div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Errors shipped. The system catches and fixes its own bugs before deploy.</p>
              <div className="mt-4 space-y-2">
                {[
                  'Type errors detected — auto-repaired',
                  'Import mismatches — resolved at build',
                  'Missing deps — installed automatically',
                  'Route conflicts — reconciled',
                  'Redis engines — production-verified',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[hsl(var(--muted-foreground))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 04 — REAL DELIVERABLES SHOWCASE
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="max-w-6xl mx-auto px-6 py-24 sm:py-32" id="deliverables">
        <SectionHeader
          number="04"
          title="What You Actually Get"
          subtitle="Not wireframes. Not prototypes. Production applications with real data."
        />

        {/* Flagship Deliverables */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-red-400" />
              <Badge variant="red">FLAGSHIP</Badge>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">System Guide</h3>
            <div className="font-mono text-sm text-[hsl(var(--muted-foreground))] mt-1">539 lines &middot; 12 sections</div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3">Live search, AI-generated docs, interactive subsystem explorer. Real-time system documentation.</p>
          </div>
          <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-red-400" />
              <Badge variant="red">FLAGSHIP</Badge>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">Universe Map</h3>
            <div className="font-mono text-sm text-[hsl(var(--muted-foreground))] mt-1">642 lines &middot; Real-time topology</div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3">5-second polling, live agent status, pool health, Claude lane monitoring. Mission control dashboard.</p>
          </div>
          <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-red-400" />
              <Badge variant="red">FLAGSHIP</Badge>
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">Melli Follower</h3>
            <div className="font-mono text-sm text-[hsl(var(--muted-foreground))] mt-1">828 lines &middot; 15-stage trace</div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-3">Live command timeline, failure/heal tracking, Claude usage metrics. AI observability dashboard.</p>
          </div>
        </div>

        {/* Module Deliverables Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <DeliverableCard
            title="CRM Engine"
            lines={8500}
            pages="20+ pages"
            icon={Users}
            color="bg-blue-700"
            features={[
              'Pipeline management', 'Deal tracking', 'Contact database',
              'Segment builder', 'AI sales agent', 'Activity timeline',
              'Custom fields', 'Email integration', 'Lead scoring', 'Bulk operations',
            ]}
          />
          <DeliverableCard
            title="Commerce Engine"
            lines={10200}
            pages="25+ pages"
            icon={ShoppingCart}
            color="bg-emerald-700"
            features={[
              'Store builder', 'Product catalog', 'Order management',
              'Auction system', 'Subscriptions', 'Payment processing',
              'Inventory tracking', 'Discount codes', 'Affiliate payouts', 'Tax calculator',
            ]}
          />
          <DeliverableCard
            title="Coaching Engine"
            lines={6800}
            pages="15+ pages"
            icon={GraduationCap}
            color="bg-primary"
            features={[
              'Program builder', 'Lesson editor', 'Quiz system',
              'Certificate generator', 'Enrollment tracking', 'Progress analytics',
              'Module sequencing', 'Media support', 'Student dashboard', 'Completion logic',
            ]}
          />
          <DeliverableCard
            title="SEO Traffic Engine"
            lines={8900}
            pages="20+ pages"
            icon={Search}
            color="bg-amber-700"
            features={[
              'AI article generation', 'Keyword clusters', 'Bulk generation',
              'IndexNow integration', 'Ranking tracker', 'Content calendar',
              'Competitor analysis', 'Meta optimization', 'Internal linking', 'Performance dashboard',
            ]}
          />
          <DeliverableCard
            title="Communications Hub"
            lines={7200}
            pages="15+ pages"
            icon={MessageSquare}
            color="bg-cyan-700"
            features={[
              'SMS messaging', 'Email campaigns', 'Live chat widget',
              'Call management', 'Voicemail system', 'IVR builder',
              'Template library', 'Conversation threads', 'AI auto-reply', 'Analytics',
            ]}
          />
          <DeliverableCard
            title="Agent Operations"
            lines={5500}
            pages="12+ pages"
            icon={Bot}
            color="bg-red-700"
            features={[
              'Agent pool dashboard', 'Spawn controls', 'Health monitoring',
              'Task assignment', 'Performance metrics', 'Self-healing',
              'Claude lane management', 'Queue depth tracking', 'Patrol grid', 'Diagnostics',
            ]}
          />
        </div>

        {/* Total Output Bar */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-[hsl(var(--foreground))] font-semibold">Total Build Output</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Everything above ships in a single build</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { val: '262', label: 'Pages', color: 'text-red-400' },
                { val: '50K+', label: 'Lines', color: 'text-[hsl(var(--foreground))]' },
                { val: '35+', label: 'API Routes', color: 'text-[hsl(var(--foreground))]' },
                { val: '100%', label: 'Type-Safe', color: 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-8 bg-[hsl(var(--muted))] hidden md:block" />}
                  <div className="text-center px-2">
                    <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 05 — QUALITY PROOF
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="bg-[hsl(var(--card))] border-y border-[hsl(var(--border))]" id="quality">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <SectionHeader
            number="05"
            title="Quality Proof"
            subtitle="Enterprise-grade from line one. Not a prototype — production architecture."
          />

          {/* Quality Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[
              { icon: Shield, label: 'TypeScript Strict', desc: 'Zero any types', color: 'text-emerald-400' },
              { icon: Wrench, label: 'Self-Healing Deploy', desc: 'Auto-fix pipeline', color: 'text-amber-400' },
              { icon: Database, label: 'Production DB', desc: 'Real data day one', color: 'text-blue-400' },
              { icon: Layers, label: 'Multi-Tenant', desc: 'Enterprise isolation', color: 'text-primary' },
              { icon: Server, label: '9 Worker Queues', desc: 'Async processing', color: 'text-cyan-400' },
              { icon: Globe, label: '35+ Integrations', desc: 'API gateway ready', color: 'text-red-400' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
                <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                <div className="text-sm font-medium text-[hsl(var(--foreground))]">{item.label}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Architecture Stack */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 mb-10">
            <h3 className="text-[hsl(var(--foreground))] font-semibold mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" /> Production Architecture Stack
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { layer: 'Frontend', tech: 'Next.js 15 + App Router', detail: 'Server components, streaming, ISR', color: 'border-l-blue-500' },
                { layer: 'API', tech: 'Fastify 5 + TypeScript', detail: 'Schema validation, JWT + API keys', color: 'border-l-emerald-500' },
                { layer: 'Data', tech: 'Prisma 6 + PostgreSQL', detail: 'Multi-tenant, migrations, type-safe', color: 'border-l-amber-500' },
                { layer: 'Workers', tech: 'BullMQ + Redis', detail: '9 queues, retry logic, dead letter', color: 'border-l-red-500' },
              ].map((s, i) => (
                <div key={i} className={`border-l-2 ${s.color} pl-4`}>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{s.layer}</div>
                  <div className="text-sm text-[hsl(var(--foreground))] font-medium mt-1">{s.tech}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What Others Ship vs What Memelli Ships */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> What Others Ship
              </h3>
              <div className="space-y-3">
                {[
                  'WordPress themes with 47 plugins',
                  'Drag-and-drop page builders',
                  'Shared hosting, shared databases',
                  'No backend — just forms to email',
                  'Generic templates, same as 10K others',
                  '"Custom" means they changed the colors',
                  'Breaks when you need something new',
                  'No API, no integrations, no scale',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted))] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-400" /> What Memelli Ships
              </h3>
              <div className="space-y-3">
                {[
                  'Custom TypeScript — every line written for you',
                  'Enterprise architecture (multi-tenant, RBAC)',
                  'Production PostgreSQL database from day one',
                  'Full REST API with JWT + API key auth',
                  'AI agent workforce built into your platform',
                  '9 async worker queues for background jobs',
                  'Self-healing deployment pipeline',
                  'Scales from 1 user to 100,000',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 06 — WHAT $20 BUYS
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="px-6 py-24 sm:py-32" id="products">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            number="06"
            title={`What $20 Buys`}
            subtitle="Each of these is a complete, deployed product. Not a mockup. Not a wireframe. A live, working system."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.name} product={product} index={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 07 — THE COST COMPARISON
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="bg-[hsl(var(--card))] border-y border-[hsl(var(--border))]" id="pricing">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <SectionHeader
            number="07"
            title="The Real Comparison"
            subtitle="We're not slightly cheaper. We're a different category."
          />

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[hsl(var(--card))]">
                    <th className="text-left p-4 text-[hsl(var(--muted-foreground))] font-medium">Feature</th>
                    <th className="text-center p-4 text-[hsl(var(--muted-foreground))] font-medium border-l border-[hsl(var(--border))]">Agency</th>
                    <th className="text-center p-4 text-[hsl(var(--muted-foreground))] font-medium border-l border-[hsl(var(--border))]">Freelancer</th>
                    <th className="text-center p-4 text-[hsl(var(--muted-foreground))] font-medium border-l border-[hsl(var(--border))]">DIY</th>
                    <th className="text-center p-4 text-red-400 font-medium border-l border-[hsl(var(--border))] bg-red-950/20">Memelli Factory</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`${i < comparisonData.length - 1 ? 'border-b border-[hsl(var(--border))]' : ''} transition-colors hover:bg-[hsl(var(--card))]`}
                    >
                      <td className="p-4 font-medium text-[hsl(var(--foreground))]">{row.feature}</td>
                      <td className="border-l border-[hsl(var(--border))] p-4 text-center text-[hsl(var(--muted-foreground))]">{row.agency}</td>
                      <td className="border-l border-[hsl(var(--border))] p-4 text-center text-[hsl(var(--muted-foreground))]">{row.freelancer}</td>
                      <td className="border-l border-[hsl(var(--border))] p-4 text-center text-[hsl(var(--muted-foreground))]">{row.diy}</td>
                      <td className="border-l border-[hsl(var(--border))] bg-red-950/10 p-4 text-center font-semibold text-red-400">{row.factory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Comparison Meters */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
              <h3 className="text-[hsl(var(--foreground))] font-semibold">Cost Comparison</h3>
              <ComparisonMeter label="Full-stack SaaS Platform" them={37500} us={1150} unit="$" />
              <ComparisonMeter label="Per-page Cost" them={1250} us={4} unit="$" />
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
              <h3 className="text-[hsl(var(--foreground))] font-semibold">Time Comparison</h3>
              <ComparisonMeter label="Time to First Deploy (hours)" them={720} us={3} />
              <ComparisonMeter label="Pages Per Day" them={2} us={262} themLabel="Dev team" />
            </div>
          </div>

          {/* Savings Calculator */}
          <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-8 text-center">
            <Trophy className="mx-auto mb-4 h-8 w-8 text-red-400" />
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Your Savings</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">Building a 262-page enterprise platform</p>
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold font-mono text-[hsl(var(--muted-foreground))] line-through">$37,500</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Agency Quote</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-red-400">$1,150</div>
                <div className="text-xs text-red-400 mt-1">Memelli Cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-emerald-400">97%</div>
                <div className="text-xs text-emerald-400 mt-1">Saved</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 08 — HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="mx-auto max-w-6xl px-6 py-24 sm:py-32" id="how">
        <SectionHeader
          number="08"
          title="How the Factory Works"
          subtitle="From your idea to a live production system in under an hour."
        />

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              icon: Target,
              title: 'You Describe It',
              desc: 'Tell us what you need in plain language. No specs, no wireframes required.',
              accent: 'from-red-600 to-red-500',
            },
            {
              step: '02',
              icon: Brain,
              title: 'AI Architects',
              desc: 'Melli decomposes your request into modules, schemas, APIs, and pages.',
              accent: 'from-red-500 to-red-400',
            },
            {
              step: '03',
              icon: Cpu,
              title: 'Agents Build',
              desc: '3-5 parallel agents write production TypeScript. Self-healing catches all errors.',
              accent: 'from-red-400 to-orange-400',
            },
            {
              step: '04',
              icon: Rocket,
              title: 'Live in Minutes',
              desc: '28.9-second compile, zero-error deploy. Live with real data from minute one.',
              accent: 'from-orange-400 to-amber-400',
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              {i < 3 && (
                <div className="hidden md:block absolute top-8 left-full w-6 z-10">
                  <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                </div>
              )}
              <div className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 h-full transition-all duration-300 hover:border-red-900/40">
                <div className="shrink-0 mb-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-[hsl(var(--foreground))] shadow-lg`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-red-400/60">
                  Step {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 09 — LIVE BUILD METRICS
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="bg-[hsl(var(--card))] border-y border-[hsl(var(--border))]" id="metrics">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <SectionHeader
            number="09"
            title="Live Build Metrics"
            subtitle="Real numbers from the actual build — not projections, not estimates."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard value={262} label="Pages" icon={FileCode2} accent />
            <StatCard value={50000} label="Lines of Code" icon={Code2} suffix="+" />
            <StatCard value={4504} label="Deploy Files" icon={Package} />
            <StatCard value={35} label="API Routes" icon={Server} suffix="+" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard value={9} label="Worker Queues" icon={Activity} />
            <StatCard value={43} label="Doctrine Stages" icon={Layers} />
            <StatCard value={13} label="Agent Pools" icon={Bot} />
            <StatCard value={1} label="Database" icon={Database} />
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h3 className="text-[hsl(var(--foreground))] font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-400" /> Cost Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Build', value: '$1,150', sub: 'All-in cost' },
                { label: 'Per Page', value: '$4.40', sub: '262 pages' },
                { label: 'Per Line', value: '$0.02', sub: '50K+ lines' },
                { label: 'Compile', value: '28.9s', sub: 'Full build' },
                { label: 'To Live', value: '3 min', sub: 'Commit to prod' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-[hsl(var(--muted))]">
                  <div className="text-xl font-bold font-mono text-[hsl(var(--foreground))]">{item.value}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{item.label}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 10 — CTA
          ═══════════════════════════════════════════════════════════════════ */}
      <Section className="px-6 py-24 sm:py-40" id="cta">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-950/15 blur-[100px]" />

          <div className="relative z-10">
            <Badge variant="red">
              <Rocket className="w-3 h-3" /> Ready to Build
            </Badge>

            <h2 className="mt-6 mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your Platform.
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Built in an Hour.
              </span>
            </h2>

            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
              262 pages. 50,000 lines of code. Enterprise architecture.
              Zero errors. $4.40 per page. Ready?
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 text-lg font-semibold text-[hsl(var(--foreground))] shadow-lg shadow-red-950/30 transition-all duration-300 hover:from-red-500 hover:to-red-400 hover:shadow-xl hover:shadow-red-950/40 hover:-translate-y-0.5">
                <Zap className="w-5 h-5" />
                Start Your Build
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-8 py-4 rounded-xl font-semibold text-lg border border-[hsl(var(--border))] flex items-center gap-2 transition-colors">
                <Play className="w-5 h-5" />
                Watch a Build
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              {[
                'No templates',
                'No subscriptions',
                'Full ownership',
                'Production-ready',
                'Self-healing deploys',
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-red-400/60" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <div className="border-t border-[hsl(var(--border))] px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-red-500" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Built by the Memelli Universe AI Operating System</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <span>262 pages</span>
            <span>&middot;</span>
            <span>28.9s compile</span>
            <span>&middot;</span>
            <span>$4.40/page</span>
            <span>&middot;</span>
            <span>Zero errors</span>
            <span>&middot;</span>
            <span>Powered by <span ref={agentsCount.ref}>{agentsCount.count}</span>+ AI agents</span>
          </div>
        </div>
      </div>
    </div>
  );
}
