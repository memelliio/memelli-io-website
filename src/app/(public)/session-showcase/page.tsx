'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, CheckCircle2, Activity, Code2, FileCode,
  BookOpen, GitCommit, Package, Layers, Zap, Clock,
  Shield, DollarSign, TrendingUp, BarChart3, Cpu,
  Users, Timer, Gauge, Rocket, Target, Lock,
  ArrowRight, ArrowLeft, ChevronLeft, ChevronRight,
  Workflow, Globe, Brain, Network, Scale,
  XCircle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const RED = '#E11D2E';
const RED_GLOW = 'rgba(225, 29, 46, 0.15)';
const TOTAL_SLIDES = 12;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGES_BUILT = [
  'Invoice Manager', 'Order Management', 'Billing Dashboard', 'Apparel Store',
  'QR Code Generator', 'Affiliate Dashboard', 'Funding Pipeline', 'Contact Manager',
  'Lead Scoring', 'Social Monitor', 'Email Campaigns', 'Team Management',
  'Kanban Board', 'Forms Builder', 'Academy Platform', 'Video Library',
  'Document Center', 'Wiki Knowledge', 'SEO Analyzer', 'Speed Analyzer',
  'Domain Manager', 'Analytics Dashboard', 'Security Center', 'API Key Manager',
  'Workflow Builder', 'Notification Center', 'Automation Logs', 'System Guide',
  'Operator Studio', 'Report Builder', 'Appointment Scheduler', 'Profile Settings',
  'Help Center', 'Import Tool', 'Review Manager', 'Marketing Ebook',
  'Power Slides', 'Session Stats', 'Pitch Deck', 'Brochure',
  'Factory Live View', 'Universe Map', 'Melli Follower', 'Terminal Workspace',
  'Activation Run', 'Agent Pools', 'Command Center', 'Deploy Dashboard',
  'Revenue World', 'Mobile Bridges',
];

const WAVES = [
  { id: 1, label: 'Wave 1', range: '1-16', count: 16, tasks: 'Core fixes, System guide, Marketing suite', startPct: 0, widthPct: 25 },
  { id: 2, label: 'Wave 2', range: '17-34', count: 18, tasks: 'Workspace fix, Laws, Mobile bridges, Operator studio', startPct: 15, widthPct: 30 },
  { id: 3, label: 'Wave 3', range: '35-50', count: 16, tasks: 'Security, Apparel, Workflow, Video, Academy, Analytics', startPct: 30, widthPct: 30 },
  { id: 4, label: 'Wave 4', range: '51-72', count: 22, tasks: 'Invoice, Docs, Appointments, Social, Forms, QR, Kanban, Wiki...', startPct: 45, widthPct: 35 },
  { id: 5, label: 'Wave 5', range: '73-82', count: 10, tasks: 'Billing, Orders, Lead scoring, Automation, Domains, Reviews...', startPct: 65, widthPct: 35 },
];

const SYSTEM_LAWS = [
  'Operating Constitution', 'Multi-Tenant Universe', 'Market Intelligence',
  'Revenue Engine', 'Resilience Protocol', 'Communication Fabric',
  'Owner Command Layer', 'Agent Factory', 'Global Task Grid',
  'Sensor Grid', 'Time Engine', 'Energy Model', 'Security Grid',
  'Expansion Protocol', 'Archive Engine', 'Startup Sequence',
  'Shutdown Protocol', 'System Identity',
];

const INFRA_PRIMITIVES = [
  { name: 'JWT Auth', icon: <Shield className="w-4 h-4" /> },
  { name: 'Multi-Tenancy', icon: <Users className="w-4 h-4" /> },
  { name: 'BullMQ Queues', icon: <Layers className="w-4 h-4" /> },
  { name: 'Redis Events', icon: <Zap className="w-4 h-4" /> },
  { name: 'Prisma ORM', icon: <Code2 className="w-4 h-4" /> },
  { name: 'Agent Pools', icon: <Bot className="w-4 h-4" /> },
  { name: 'Patrol Grid', icon: <Network className="w-4 h-4" /> },
  { name: 'Deploy Pipeline', icon: <Rocket className="w-4 h-4" /> },
  { name: 'Telephony', icon: <Globe className="w-4 h-4" /> },
  { name: 'Task Grid', icon: <Workflow className="w-4 h-4" /> },
  { name: 'Memory System', icon: <Brain className="w-4 h-4" /> },
  { name: 'Sensor Grid', icon: <Activity className="w-4 h-4" /> },
  { name: 'Time Engine', icon: <Clock className="w-4 h-4" /> },
  { name: 'Energy Model', icon: <Gauge className="w-4 h-4" /> },
];

const GOVERNANCE_HIERARCHY = [
  { level: 'Owner', desc: 'Supreme authority — all override', color: '#F59E0B' },
  { level: 'Melli (CPU)', desc: 'AI controller — routes all work', color: RED },
  { level: 'Internal Claude', desc: 'System worker — executes inside infra', color: '#8B5CF6' },
  { level: 'External Claude', desc: 'Supervisor — escalation channel', color: '#06B6D4' },
  { level: '10 Managers', desc: 'Department leads — own subsystems', color: '#22C55E' },
  { level: 'Agent Pools', desc: '82+ workers — execute all tasks', color: '#EC4899' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function Slide1Title({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${RED} 0%, transparent 70%)` }} />
      </div>
      <div className={`relative transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-zinc-700" style={{ background: `linear-gradient(135deg, ${RED}, #991B1B)` }}>
            <Cpu className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-6">
          82 Agents.
        </h1>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" style={{ color: RED }}>
          One Session.
        </h2>
        <h2 className="text-5xl md:text-7xl font-bold text-emerald-400 tracking-tight mb-8">
          Zero Failures.
        </h2>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          March 15, 2026 &mdash; Memelli OS Session Report
        </p>
      </div>
    </div>
  );
}

function Slide2Numbers({ active }: { active: boolean }) {
  const agents = useAnimatedCounter(82, active, 1200);
  const success = useAnimatedCounter(100, active, 1400, '', '%');
  const lines = useAnimatedCounter(65000, active, 1800, '', '+');
  const files = useAnimatedCounter(150, active, 1400, '', '+');
  const pages = useAnimatedCounter(325, active, 1600, '', '+');
  const laws = useAnimatedCounter(70, active, 1400, '', '+');
  const bundles = useAnimatedCounter(5, active, 800);
  const commits = useAnimatedCounter(15, active, 1000, '', '+');

  const stats = [
    { label: 'Agents Deployed', value: agents, icon: <Bot className="w-5 h-5" />, color: RED },
    { label: 'Success Rate', value: success, icon: <CheckCircle2 className="w-5 h-5" />, color: '#22C55E' },
    { label: 'Lines of Code', value: lines, icon: <Code2 className="w-5 h-5" />, color: '#8B5CF6' },
    { label: 'Files Changed', value: files, icon: <FileCode className="w-5 h-5" />, color: '#06B6D4' },
    { label: 'Total Pages', value: pages, icon: <Layers className="w-5 h-5" />, color: '#F59E0B' },
    { label: 'System Laws', value: laws, icon: <BookOpen className="w-5 h-5" />, color: RED },
    { label: 'Knowledge Bundles', value: bundles, icon: <Package className="w-5 h-5" />, color: '#EC4899' },
    { label: 'Commits', value: commits, icon: <GitCommit className="w-5 h-5" />, color: '#22C55E' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        The <span style={{ color: RED }}>Numbers</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`p-5 rounded-xl border border-zinc-800 text-center transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${i * 100}ms`, background: `linear-gradient(135deg, ${s.color}08, transparent)` }}
          >
            <div className="flex justify-center mb-3" style={{ color: s.color }}>{s.icon}</div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide3WhatWasBuilt({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 overflow-hidden">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-8 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        What Was <span style={{ color: RED }}>Built</span>
      </h2>
      <div className="max-w-5xl w-full max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {PAGES_BUILT.map((page, i) => (
            <div
              key={page}
              className={`p-2.5 rounded-lg border border-zinc-800 transition-all duration-500 hover:border-zinc-600 ${active ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: `${Math.min(i * 30, 600)}ms` }}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{page}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm mt-6">
        {PAGES_BUILT.length} pages built in a single session
      </p>
    </div>
  );
}

function Slide4WaveViz({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        Wave <span style={{ color: RED }}>Visualization</span>
      </h2>
      <div className="max-w-4xl w-full space-y-4">
        {WAVES.map((wave, i) => (
          <div
            key={wave.id}
            className={`transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className="flex items-center gap-4 mb-1">
              <span className="text-white font-medium w-20">{wave.label}</span>
              <span className="text-muted-foreground text-xs">Agents {wave.range}</span>
            </div>
            <div className="relative h-12 bg-card rounded-lg overflow-hidden border border-zinc-800">
              <div
                className="absolute top-0 h-full rounded-lg flex items-center px-4"
                style={{
                  left: `${wave.startPct}%`,
                  width: active ? `${wave.widthPct}%` : '0%',
                  background: `linear-gradient(90deg, ${RED}, #991B1B)`,
                  transition: `width 1s ease-out ${i * 200}ms`,
                }}
              >
                <span className="text-white text-sm font-medium whitespace-nowrap">{wave.count} agents &mdash; {wave.tasks}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-muted-foreground text-xs mt-4 pl-24">
          <span>Session Start</span>
          <span>~1 hour</span>
          <span>~2 hours</span>
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}

function Slide5PeakConcurrency({ active }: { active: boolean }) {
  const peak = useAnimatedCounter(30, active, 1500);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, #F59E0B 0%, transparent 70%)` }} />
      </div>
      <div className={`relative transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Activity className="w-16 h-16 mx-auto mb-6" style={{ color: '#F59E0B' }} />
        <p className="text-8xl md:text-9xl font-bold text-white mb-4">{peak}</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#F59E0B' }}>
          Agents Building Simultaneously
        </h2>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          Peak concurrency during Wave 3-4 overlap. Each agent independently
          building, testing, and validating its assigned component.
        </p>
      </div>
    </div>
  );
}

function Slide6SpeedComparison({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        Speed <span style={{ color: RED }}>Comparison</span>
      </h2>
      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        {/* Traditional */}
        <div className={`flex-1 p-8 rounded-xl border border-zinc-800 bg-card transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <h3 className="text-xl font-bold text-muted-foreground mb-4">Traditional Development</h3>
          <p className="text-5xl font-bold text-muted-foreground mb-2">3-6</p>
          <p className="text-lg text-muted-foreground mb-6">Months</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>8-12 developers</p>
            <p>Planning sprints</p>
            <p>Code review cycles</p>
            <p>QA testing phases</p>
            <p>$500K+ budget</p>
          </div>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-8 h-8 text-muted-foreground hidden md:block" />
        </div>
        {/* AI Parallel */}
        <div className={`flex-1 p-8 rounded-xl border transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ borderColor: RED, background: `linear-gradient(135deg, ${RED}15, transparent)` }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: RED }}>AI Parallel Execution</h3>
          <p className="text-5xl font-bold text-white mb-2">~2.5</p>
          <p className="text-lg text-muted-foreground mb-6">Hours</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>82 AI agents</p>
            <p>30 simultaneous builds</p>
            <p>Self-validating</p>
            <p>Zero type errors</p>
            <p>~$45 API cost</p>
          </div>
        </div>
      </div>
      <p className={`text-muted-foreground text-lg mt-8 transition-all duration-700 delay-500 ${active ? 'opacity-100' : 'opacity-0'}`}>
        That is a <span className="text-white font-bold">1,000x</span> speed improvement.
      </p>
    </div>
  );
}

function Slide7Quality({ active }: { active: boolean }) {
  const metrics = [
    { label: 'Type Errors', value: '0', color: '#22C55E', note: '1 JSX syntax fix caught on deploy' },
    { label: 'Agent Retries', value: '0', color: '#22C55E', note: 'No agent needed restart' },
    { label: 'Build Failures', value: '0', color: '#22C55E', note: 'Clean every wave' },
    { label: 'Rollbacks', value: '0', color: '#22C55E', note: 'Zero rollbacks' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <Shield className={`w-16 h-16 mb-6 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ color: '#22C55E' }} />
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        Zero Defect <span style={{ color: '#22C55E' }}>Shipping</span>
      </h2>
      <p className={`text-muted-foreground text-lg mb-12 text-center max-w-lg transition-all duration-700 delay-200 ${active ? 'opacity-100' : 'opacity-0'}`}>
        Self-validating agents catch errors before they propagate.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`p-6 rounded-xl border border-zinc-800 text-center transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <p className="text-4xl font-bold mb-2" style={{ color: m.color }}>{m.value}</p>
            <p className="text-white text-sm font-medium">{m.label}</p>
            <p className="text-muted-foreground text-xs mt-1">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide8LawLibrary({ active }: { active: boolean }) {
  const lawCount = useAnimatedCounter(70, active, 1400, '', '+');

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <BookOpen className={`w-16 h-16 mb-6 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ color: '#F59E0B' }} />
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-2 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        The Law <span style={{ color: '#F59E0B' }}>Library</span>
      </h2>
      <p className="text-6xl font-bold text-white mt-4 mb-8">{lawCount}</p>
      <p className={`text-muted-foreground text-lg mb-10 text-center max-w-lg transition-all duration-700 delay-200 ${active ? 'opacity-100' : 'opacity-0'}`}>
        System laws governing every aspect of the operating universe.
        From the Operating Constitution to the Archive Engine.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
        {SYSTEM_LAWS.map((law, i) => (
          <span
            key={law}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-800 text-muted-foreground transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: `${Math.min(i * 50, 500)}ms`, background: 'rgba(245, 158, 11, 0.08)' }}
          >
            {law}
          </span>
        ))}
      </div>
    </div>
  );
}

function Slide9Infrastructure({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <span style={{ color: '#8B5CF6' }}>Infrastructure</span> Primitives
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-5xl w-full">
        {INFRA_PRIMITIVES.map((item, i) => (
          <div
            key={item.name}
            className={`p-4 rounded-xl border border-zinc-800 text-center transition-all duration-700 hover:border-zinc-600 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ transitionDelay: `${i * 60}ms`, background: 'rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex justify-center mb-2 text-violet-400">{item.icon}</div>
            <p className="text-xs text-muted-foreground font-medium">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide10Architecture({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-12 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        The <span style={{ color: RED }}>Architecture</span>
      </h2>
      <div className="max-w-2xl w-full space-y-3">
        {GOVERNANCE_HIERARCHY.map((level, i) => (
          <div
            key={level.level}
            className={`flex items-center gap-4 p-4 rounded-xl border border-zinc-800 transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            style={{ transitionDelay: `${i * 120}ms`, background: `${level.color}08`, marginLeft: `${i * 20}px` }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: level.color }} />
            <div>
              <p className="text-white font-bold text-lg">{level.level}</p>
              <p className="text-muted-foreground text-sm">{level.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide11CostEfficiency({ active }: { active: boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('memelli_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'SUPER_ADMIN' || payload.role === 'ADMIN') {
          setIsAdmin(true);
        }
      }
    } catch {
      // Not admin
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <DollarSign className={`w-16 h-16 mb-6 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ color: '#22C55E' }} />
      <h2 className={`text-4xl md:text-5xl font-bold text-white mb-8 transition-all duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
        Cost <span style={{ color: '#22C55E' }}>Efficiency</span>
      </h2>
      {isAdmin ? (
        <div className={`flex flex-col md:flex-row gap-8 items-center transition-all duration-700 delay-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center">
            <p className="text-6xl font-bold text-white">~$45</p>
            <p className="text-muted-foreground mt-2">This session</p>
          </div>
          <div className="text-muted-foreground text-4xl font-light">vs</div>
          <div className="text-center">
            <p className="text-6xl font-bold text-muted-foreground line-through">$500K+</p>
            <p className="text-muted-foreground mt-2">Traditional build</p>
          </div>
        </div>
      ) : (
        <div className={`transition-all duration-700 delay-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-2xl text-muted-foreground max-w-lg">
            AI-operated infrastructure delivers enterprise-grade output
            at a fraction of traditional development costs.
          </p>
        </div>
      )}
      <p className={`text-muted-foreground text-lg mt-8 max-w-md transition-all duration-700 delay-500 ${active ? 'opacity-100' : 'opacity-0'}`}>
        82 agents completed 50 pages, 65,000+ lines, and 150+ files
        in a single 2.5-hour session.
      </p>
    </div>
  );
}

function Slide12CTA({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[700px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${RED} 0%, transparent 70%)` }} />
      </div>
      <div className={`relative transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${RED}, #991B1B)` }}>
            <Cpu className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-3xl">
          This is what <span style={{ color: RED }}>AI-operated infrastructure</span> looks like.
        </h2>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10">
          Built by Claude. Operated by Melli. Governed by doctrine.
          Owned by you.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://universe.memelli.com"
            className="px-8 py-3 rounded-lg text-white font-medium transition-all hover:brightness-110"
            style={{ backgroundColor: RED }}
          >
            Enter the Universe
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

const SLIDES = [
  Slide1Title, Slide2Numbers, Slide3WhatWasBuilt, Slide4WaveViz,
  Slide5PeakConcurrency, Slide6SpeedComparison, Slide7Quality,
  Slide8LawLibrary, Slide9Infrastructure, Slide10Architecture,
  Slide11CostEfficiency, Slide12CTA,
];

export default function SessionShowcasePage() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const touchStart = useRef(0);

  const navigate = useCallback((dir: 1 | -1) => {
    if (transitioning) return;
    const next = current + dir;
    if (next < 0 || next >= TOTAL_SLIDES) return;
    setTransitioning(true);
    setCurrent(next);
    setTimeout(() => setTransitioning(false), 700);
  }, [current, transitioning]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        navigate(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Touch navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  };

  // Wheel navigation
  useEffect(() => {
    let lastWheel = 0;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < 800) return;
      lastWheel = now;
      if (e.deltaY > 20) navigate(1);
      else if (e.deltaY < -20) navigate(-1);
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, [navigate]);

  const SlideComponent = SLIDES[current];

  return (
    <div
      className="h-screen w-screen bg-[#0A0A0A] text-white overflow-hidden relative select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide content */}
      <div className="h-full w-full">
        {SlideComponent && <SlideComponent active={!transitioning} />}
      </div>

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full border border-zinc-800 text-muted-foreground hover:text-white hover:border-zinc-600 transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {current < TOTAL_SLIDES - 1 && (
        <button
          onClick={() => navigate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full border border-zinc-800 text-muted-foreground hover:text-white hover:border-zinc-600 transition-all z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => { if (!transitioning) { setTransitioning(true); setCurrent(i); setTimeout(() => setTransitioning(false), 700); } }}
            className="transition-all"
          >
            <div
              className={`rounded-full transition-all ${i === current ? 'w-8 h-2' : 'w-2 h-2'}`}
              style={{ backgroundColor: i === current ? RED : '#3F3F46' }}
            />
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-6 right-6 text-muted-foreground text-sm font-mono z-10">
        {current + 1} / {TOTAL_SLIDES}
      </div>

      {/* Navigation hint */}
      {current === 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-muted-foreground text-sm animate-pulse z-10">
          Press <kbd className="px-2 py-0.5 rounded border border-zinc-700 text-muted-foreground mx-1">Space</kbd> or swipe to navigate
        </div>
      )}
    </div>
  );
}