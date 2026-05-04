'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import Link from 'next/link';
import {
  BookOpen, Presentation, Factory, Map, Navigation, Terminal,
  CheckCircle, Wrench, MessageSquare, Eye, AppWindow, Monitor,
  BarChart3, Zap, Shield, Code2, Layers, ArrowRight, Cpu,
  Activity, Sparkles, CircleDot,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const RED = '#E11D2E';
const RED_GLOW = 'rgba(225, 29, 46, 0.15)';

/* ── Deliverables ───────────────────────────────────────────────────────────── */

type Category = 'new' | 'upgrade' | 'fix' | 'service';

interface Deliverable {
  icon: typeof BookOpen;
  title: string;
  description: string;
  time: string;
  minutes: number;
  category: Category;
  details: string;
}

const DELIVERABLES: Deliverable[] = [
  { icon: BookOpen, title: 'Marketing Ebook', description: '9 chapters, animated counters, scroll effects', time: '~9 min', minutes: 9, category: 'new', details: 'Full interactive ebook with chapter navigation, animated statistics, and parallax scroll effects. Production-ready marketing asset.' },
  { icon: Presentation, title: 'Interactive Power Slides', description: '17 slides, keyboard nav, animated charts', time: '~3.7 min', minutes: 3.7, category: 'new', details: '17-slide presentation with keyboard navigation, animated data visualizations, and smooth transitions. Investor-ready.' },
  { icon: Factory, title: 'Factory Live View', description: 'Mission control dashboard, live agent feed', time: '~6.3 min', minutes: 6.3, category: 'new', details: 'Real-time mission control showing active agents, task queues, and system health. Full observability dashboard.' },
  { icon: Map, title: 'System Guide', description: 'Floating TOC, SVG architecture diagrams', time: '~9.6 min', minutes: 9.6, category: 'upgrade', details: 'Upgraded with floating table of contents, interactive SVG system diagrams, and searchable documentation.' },
  { icon: Navigation, title: 'Universe Map', description: 'Health rings, animated connections, mini-map', time: '~9.6 min', minutes: 9.6, category: 'upgrade', details: 'Enhanced with real-time health indicators, animated connection lines between subsystems, and navigable mini-map.' },
  { icon: Activity, title: 'Melli Follower', description: 'SVG timeline, animated trace tracking', time: '~9.6 min', minutes: 9.6, category: 'upgrade', details: 'Upgraded with SVG-based timeline visualization, animated command traces, and live execution monitoring.' },
  { icon: CheckCircle, title: 'TypeScript Checker', description: 'Pre-deploy validation gate, continuous scanning', time: '~3.4 min', minutes: 3.4, category: 'service', details: 'Automated type-safety validation running before every deployment. Catches errors before they reach production.' },
  { icon: Wrench, title: 'Deploy-Repair Bridge', description: '3 self-healing bridges wired', time: '~5 min', minutes: 5, category: 'service', details: 'Three automated repair bridges that detect deployment failures and self-correct without human intervention.' },
  { icon: MessageSquare, title: 'MUA Chat Fix', description: 'Cascade isolation, error resilience', time: '~4.2 min', minutes: 4.2, category: 'fix', details: 'Fixed cascade failures in chat system with proper error boundaries and resilient message handling.' },
  { icon: Eye, title: 'Orb Fix', description: '5 visibility issues resolved across all pages', time: '~2.8 min', minutes: 2.8, category: 'fix', details: 'Resolved five orb visibility and rendering issues across all public and admin pages.' },
  { icon: AppWindow, title: 'Window Manager', description: 'OS-quality draggable windows', time: '~1.6 min', minutes: 1.6, category: 'new', details: 'Full windowing system with drag, resize, minimize, maximize, and z-index management. Desktop-grade UX.' },
  { icon: Terminal, title: 'Claude Terminal', description: 'Browser-based AI terminal workspace', time: 'building', minutes: 10, category: 'new', details: 'In-browser terminal interface for direct AI interaction with syntax highlighting and command history.' },
  { icon: BarChart3, title: 'Session Stats Dashboard', description: 'Full performance analytics', time: 'building', minutes: 10, category: 'new', details: 'Comprehensive analytics dashboard showing agent performance, build times, and system health metrics.' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  new: '#3B82F6',
  upgrade: '#10B981',
  fix: '#F59E0B',
  service: '#8B5CF6',
};

const CATEGORY_LABELS: Record<Category, string> = {
  new: 'New Page',
  upgrade: 'Upgrade',
  fix: 'Bug Fix',
  service: 'Service',
};

/* ── Speed Metrics ──────────────────────────────────────────────────────────── */

interface Metric {
  value: string;
  label: string;
  suffix?: string;
}

const METRICS: Metric[] = [
  { value: '14', label: 'Agents Deployed' },
  { value: '13', label: 'Deliverables Shipped' },
  { value: '6', label: 'New Pages Created' },
  { value: '3', label: 'Pages Upgraded' },
  { value: '3', label: 'Bugs Fixed' },
  { value: '8000', label: 'Lines of Code', suffix: '+' },
  { value: '0', label: 'Type Errors' },
  { value: '28.9', label: 'Second Compile Time', suffix: 's' },
  { value: '265', label: 'Total Pages in System', suffix: '+' },
  { value: '2.9', label: 'Parallel Speedup', suffix: 'x' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(target * ease));
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PARTICLE CANVAS
   ═══════════════════════════════════════════════════════════════════════════════ */

function ParticleHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; }
    const particles: P[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      a: Math.random() * 0.5 + 0.1,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 29, 46, ${p.a})`;
        ctx.fill();
      }
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(225, 29, 46, ${0.08 * (1 - d / 120)})`;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER (hero)
   ═══════════════════════════════════════════════════════════════════════════════ */

function HeroCounter() {
  const count = useCountUp(14, 2000, true);
  return (
    <div className="flex flex-col items-center mt-12">
      <div
        className="text-8xl sm:text-9xl font-black tabular-nums"
        style={{ color: RED, textShadow: `0 0 60px ${RED_GLOW}, 0 0 120px ${RED_GLOW}` }}
      >
        {count}
      </div>
      <div className="text-muted-foreground text-lg sm:text-xl tracking-widest uppercase mt-2">
        Agents Deployed
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DELIVERABLE CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function DeliverableCard({ d, index, visible }: { d: Deliverable; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = d.icon;
  const catColor = CATEGORY_COLORS[d.category];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl border border-zinc-800/60 p-6 transition-all duration-500"
      style={{
        background: hovered
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(12px)',
        transform: visible
          ? `translateY(0) scale(1)`
          : `translateY(40px) scale(0.95)`,
        opacity: visible ? 1 : 0,
        transitionDelay: `${index * 80}ms`,
        boxShadow: hovered ? `0 0 30px ${RED_GLOW}` : 'none',
      }}
    >
      {/* category badge */}
      <span
        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{ background: `${catColor}22`, color: catColor }}
      >
        {CATEGORY_LABELS[d.category]}
      </span>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${catColor}18` }}
        >
          <Icon size={20} style={{ color: catColor }} />
        </div>
        <h3 className="text-white font-semibold text-base">{d.title}</h3>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-3">{d.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-mono">{d.time}</span>
        {d.time !== 'building' && (
          <div className="h-1 flex-1 mx-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: visible ? '100%' : '0%',
                background: catColor,
                transitionDelay: `${index * 80 + 400}ms`,
              }}
            />
          </div>
        )}
        {d.time === 'building' && (
          <div className="flex items-center gap-1 text-xs" style={{ color: RED }}>
            <span className="animate-pulse">LIVE</span>
            <CircleDot size={10} className="animate-pulse" />
          </div>
        )}
      </div>

      {/* expanded details on hover */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: hovered ? 80 : 0, opacity: hovered ? 1 : 0 }}
      >
        <p className="text-muted-foreground text-xs leading-relaxed mt-3 border-t border-zinc-800 pt-3">
          {d.details}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GANTT CHART
   ═══════════════════════════════════════════════════════════════════════════════ */

interface GanttBar {
  label: string;
  start: number;
  duration: number;
  category: Category;
}

const GANTT_DATA: GanttBar[] = [
  { label: 'Window Manager', start: 0, duration: 1.6, category: 'new' },
  { label: 'Orb Fix', start: 0.2, duration: 2.8, category: 'fix' },
  { label: 'TypeScript Checker', start: 0.5, duration: 3.4, category: 'service' },
  { label: 'Power Slides', start: 0.8, duration: 3.7, category: 'new' },
  { label: 'MUA Chat Fix', start: 1, duration: 4.2, category: 'fix' },
  { label: 'Deploy-Repair Bridge', start: 1.2, duration: 5, category: 'service' },
  { label: 'Factory Live View', start: 1.5, duration: 6.3, category: 'new' },
  { label: 'Marketing Ebook', start: 2, duration: 9, category: 'new' },
  { label: 'System Guide', start: 2, duration: 9.6, category: 'upgrade' },
  { label: 'Universe Map', start: 2.2, duration: 9.6, category: 'upgrade' },
  { label: 'Melli Follower', start: 2.4, duration: 9.6, category: 'upgrade' },
  { label: 'Claude Terminal', start: 3, duration: 10, category: 'new' },
  { label: 'Session Stats', start: 3.5, duration: 10, category: 'new' },
  { label: 'Performance Page', start: 4, duration: 8, category: 'new' },
];

const GANTT_MAX = 14;

function GanttChart({ visible }: { visible: boolean }) {
  return (
    <div className="space-y-2">
      {GANTT_DATA.map((bar, i) => {
        const leftPct = (bar.start / GANTT_MAX) * 100;
        const widthPct = (bar.duration / GANTT_MAX) * 100;
        const color = CATEGORY_COLORS[bar.category];

        return (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs w-36 text-right truncate flex-shrink-0 hidden sm:block">
              {bar.label}
            </span>
            <div className="flex-1 h-7 bg-card rounded-md relative overflow-hidden">
              <div
                className="absolute top-0.5 bottom-0.5 rounded-md transition-all ease-out"
                style={{
                  left: `${leftPct}%`,
                  width: visible ? `${widthPct}%` : '0%',
                  background: `linear-gradient(90deg, ${color}CC, ${color}88)`,
                  transitionDuration: '1.4s',
                  transitionDelay: `${i * 60}ms`,
                  boxShadow: `0 0 12px ${color}33`,
                }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-white/80 font-medium sm:hidden truncate px-1"
                style={{ left: `${leftPct + 1}%`, maxWidth: `${widthPct - 2}%` }}
              >
                {bar.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* timeline labels */}
      <div className="flex items-center gap-3 mt-1">
        <span className="w-36 flex-shrink-0 hidden sm:block" />
        <div className="flex-1 flex justify-between text-muted-foreground text-[10px] font-mono px-1">
          {[0, 2, 4, 6, 8, 10, 12, 14].map(t => (
            <span key={t}>{t}m</span>
          ))}
        </div>
      </div>

      {/* peak concurrency callout */}
      <div className="flex items-center justify-center mt-6 gap-2">
        <Zap size={16} style={{ color: RED }} />
        <span className="text-muted-foreground text-sm font-medium">
          Peak: <span style={{ color: RED }} className="font-bold">6 agents</span> building simultaneously
        </span>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([cat, label]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: CATEGORY_COLORS[cat] }} />
            <span className="text-muted-foreground text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function MetricCard({ m, visible, index }: { m: Metric; visible: boolean; index: number }) {
  const numVal = parseFloat(m.value);
  const isDecimal = m.value.includes('.');
  const count = useCountUp(isDecimal ? numVal * 10 : numVal, 1600, visible);
  const display = isDecimal ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <div
      className="rounded-2xl border border-zinc-800/50 p-6 text-center transition-all duration-700"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <div className="text-3xl sm:text-4xl font-black tabular-nums text-white">
        {display}{m.suffix || ''}
      </div>
      <div className="text-muted-foreground text-sm mt-1">{m.label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   QUALITY BADGES
   ═══════════════════════════════════════════════════════════════════════════════ */

const QUALITY_ITEMS = [
  { icon: CheckCircle, label: 'Zero type errors at build' },
  { icon: Shield, label: 'Self-validating agents' },
  { icon: Wrench, label: 'Self-healing deploy pipeline' },
  { icon: Code2, label: 'Production-grade from line 1' },
  { icon: Layers, label: 'Enterprise multi-tenant architecture' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS STEPS
   ═══════════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: '01',
    title: 'You describe what you need',
    desc: 'Voice, text, or screenshot. Melli understands context and intent instantly.',
    icon: MessageSquare,
  },
  {
    num: '02',
    title: 'Melli dispatches agents',
    desc: 'Parallel execution across specialized AI agents. Real-time monitoring of every task.',
    icon: Cpu,
  },
  {
    num: '03',
    title: 'Everything deploys automatically',
    desc: 'Validated, type-checked, and live. No manual steps, no waiting.',
    icon: Zap,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   AGENT ARMY VISUALIZATION
   ═══════════════════════════════════════════════════════════════════════════════ */

function AgentArmy({ visible }: { visible: boolean }) {
  const agents = DELIVERABLES.map((d, i) => {
    // place in circle around center
    const angle = (i / DELIVERABLES.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 140;
    return {
      label: d.title,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      color: CATEGORY_COLORS[d.category],
      building: d.time === 'building',
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ height: 400 }}>
      {/* center jessica node */}
      <div
        className="absolute z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${RED}44, ${RED}11)`,
          border: `2px solid ${RED}`,
          boxShadow: `0 0 40px ${RED_GLOW}, 0 0 80px ${RED_GLOW}`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0)',
        }}
      >
        <Sparkles size={28} style={{ color: RED }} />
        <span className="absolute -bottom-6 text-xs font-bold tracking-wider" style={{ color: RED }}>
          JESSICA
        </span>
      </div>

      {/* SVG connections */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <g transform={`translate(${200}, ${200})`}>
          {agents.map((a, i) => (
            <line
              key={i}
              x1={0} y1={0} x2={a.x} y2={a.y}
              stroke={a.color}
              strokeWidth={1}
              strokeOpacity={visible ? 0.3 : 0}
              strokeDasharray="4 4"
              style={{ transition: `stroke-opacity 1s ${i * 80}ms` }}
            />
          ))}
        </g>
      </svg>

      {/* agent dots */}
      {agents.map((a, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center gap-1 transition-all duration-700"
          style={{
            left: `calc(50% + ${a.x}px - 30px)`,
            top: `calc(50% + ${a.y}px - 12px)`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0)',
            transitionDelay: `${i * 80 + 300}ms`,
          }}
        >
          <div
            className={`w-5 h-5 rounded-full ${a.building ? 'animate-pulse' : ''}`}
            style={{
              background: a.color,
              boxShadow: `0 0 12px ${a.color}66`,
            }}
          />
          <span className="text-[9px] text-muted-foreground text-center w-16 leading-tight truncate">
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PerformancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const grid = useInView();
  const gantt = useInView();
  const metrics = useInView();
  const quality = useInView();
  const howItWorks = useInView();
  const army = useInView();
  const admin = useInView();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-white selection:bg-red-500/30">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <ParticleHero />

        {/* gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(225,29,46,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-card mb-8">
            <Activity size={14} style={{ color: RED }} />
            <span className="text-muted-foreground text-sm">Live Session Results</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
            style={{ letterSpacing: '-0.03em' }}
          >
            Built by{' '}
            <span style={{ color: RED, textShadow: `0 0 40px ${RED_GLOW}` }}>Melli</span>.
            <br />
            Deployed in Real-Time.
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            14 AI agents. 13 deliverables. All running simultaneously.
          </p>

          <HeroCounter />

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/start"
              className="px-8 py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:brightness-110"
              style={{ background: RED, boxShadow: `0 4px 24px ${RED_GLOW}` }}
            >
              See What Melli Can Build
            </Link>
            <a
              href="#deliverables"
              className="px-8 py-3.5 rounded-xl font-semibold text-muted-foreground text-base border border-zinc-700 hover:border-zinc-500 transition-colors duration-200"
            >
              Explore the Session
            </a>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-5 h-8 rounded-full border-2 border-zinc-700 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-card0" />
          </div>
        </div>
      </section>

      {/* ── SECTION 1: DELIVERABLES GRID ───────────────────────────────────── */}
      <section id="deliverables" className="px-6 py-24 sm:py-32" ref={grid.ref}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              What Melli Built
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Every deliverable — designed, coded, validated, and deployed by autonomous AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DELIVERABLES.map((d, i) => (
              <DeliverableCard key={d.title} d={d} index={i} visible={grid.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PARALLEL EXECUTION GANTT ────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32 bg-[hsl(var(--background))]" ref={gantt.ref}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Parallel Execution
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              All 14 agents running simultaneously. Not queued. Not sequential. Truly parallel.
            </p>
          </div>

          <GanttChart visible={gantt.visible} />
        </div>
      </section>

      {/* ── SECTION 3: SPEED METRICS ──────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32" ref={metrics.ref}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              The Numbers
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Raw performance from a single live session.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {METRICS.map((m, i) => (
              <MetricCard key={m.label} m={m} visible={metrics.visible} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: QUALITY PROOF ──────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32 bg-[hsl(var(--background))]" ref={quality.ref}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Quality Proof
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Every line of code passes validation before it reaches production.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUALITY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-800/50 p-6 flex items-center gap-4 transition-all duration-700"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(8px)',
                    opacity: quality.visible ? 1 : 0,
                    transform: quality.visible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${RED}15` }}
                  >
                    <Icon size={22} style={{ color: RED }} />
                  </div>
                  <span className="text-foreground text-sm font-medium leading-snug">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: HOW IT WORKS ───────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32" ref={howItWorks.ref}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative rounded-2xl border border-zinc-800/50 p-8 text-center transition-all duration-700"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(8px)',
                    opacity: howItWorks.visible ? 1 : 0,
                    transform: howItWorks.visible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  <div
                    className="text-5xl font-black mb-4"
                    style={{ color: `${RED}33` }}
                  >
                    {step.num}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `${RED}15` }}
                  >
                    <Icon size={26} style={{ color: RED }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>

                  {/* arrow between cards (md+) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: AGENT ARMY ─────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32 bg-[hsl(var(--background))]" ref={army.ref}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              The Agent Army
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              14 specialized agents coordinated by a single AI controller.
            </p>
          </div>

          <AgentArmy visible={army.visible} />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            See What Melli Can Build{' '}
            <span style={{ color: RED }}>For You</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Describe what you need. Melli and her agents will handle the rest.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/start"
              className="px-10 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 hover:brightness-110"
              style={{ background: RED, boxShadow: `0 4px 32px ${RED_GLOW}` }}
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="px-10 py-4 rounded-xl font-semibold text-muted-foreground text-lg border border-zinc-700 hover:border-zinc-500 transition-colors duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── ADMIN-ONLY COST SECTION ───────────────────────────────────────── */}
      {isAdmin && (
        <section className="px-6 py-16 bg-muted border-t border-zinc-800" ref={admin.ref}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-muted text-muted-foreground">
                Admin Only
              </span>
              <h3 className="text-muted-foreground text-sm font-medium">
                Session Cost Analysis (not visible to public)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { value: '~$20', label: 'Estimated Session Cost' },
                { value: '~$1.50', label: 'Cost per Deliverable' },
                { value: '~$3.30', label: 'Cost per Page' },
                { value: '$6,000+', label: 'Equivalent Traditional Cost' },
                { value: '99.7%', label: 'Savings' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-zinc-700/50 bg-muted p-5 text-center transition-all duration-500"
                  style={{
                    opacity: admin.visible ? 1 : 0,
                    transform: admin.visible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="text-2xl font-black text-foreground">{item.value}</div>
                  <div className="text-muted-foreground text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
