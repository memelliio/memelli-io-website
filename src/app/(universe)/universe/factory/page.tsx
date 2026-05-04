'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Code2,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Activity,
  Zap,
  Rocket,
  Eye,
  FileCode,
  Hammer,
  DollarSign,
  Gauge,
  Layers,
  Shield,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Circle,
  Package,
  Terminal,
  GitBranch,
  Play,
  Pause,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

type AgentStatus = 'building' | 'idle' | 'deploying' | 'reviewing';
type BuildEventType = 'start' | 'progress' | 'complete' | 'error' | 'deploy' | 'heal';
type PipelineStage = 'code' | 'typecheck' | 'build' | 'deploy' | 'verify' | 'live';
type StageStatus = 'waiting' | 'active' | 'done' | 'error';

interface FactoryAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentFile: string | null;
  progress: number;
  linesWritten: number;
  timeElapsed: number; // seconds
  totalBuilds: number;
  totalLines: number;
}

interface BuildEvent {
  id: string;
  timestamp: string;
  type: BuildEventType;
  agentName: string;
  message: string;
  details?: string;
}

interface BuildHistoryEntry {
  id: string;
  pages: number;
  duration: string;
  status: 'success' | 'failed' | 'building';
  timestamp: string;
}

interface PipelineState {
  stage: PipelineStage;
  status: StageStatus;
  progress: number;
}

interface FactoryData {
  stats: {
    activeAgents: number;
    pagesBuiltToday: number;
    linesWritten: number;
    currentBuildCost: number;
    buildSpeed: number;
    deployQueueDepth: number;
  };
  agents: FactoryAgent[];
  events: BuildEvent[];
  buildHistory: BuildHistoryEntry[];
  quality: {
    typeErrors: number;
    buildWarnings: number;
    selfHealRate: number;
    errorsCaught: number;
    selfHeals: number;
  };
  pipeline: PipelineState[];
  costEfficiency: {
    costPerPage: number;
    costPerLine: number;
    linesPerMinute: number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Demo Data — used when API is unavailable
   ═══════════════════════════════════════════════════════════════════════════ */

const AGENT_NAMES = [
  'MUA-Prime', 'Builder-Alpha', 'Builder-Beta', 'Builder-Gamma',
  'Builder-Delta', 'Reviewer-1', 'DeployOps-1', 'Healer-1',
  'Builder-Epsilon', 'Builder-Zeta', 'Builder-Eta', 'Builder-Theta',
];

const AGENT_ROLES = [
  'Lead Orchestrator', 'Page Builder', 'Page Builder', 'Component Builder',
  'API Wire Agent', 'Code Reviewer', 'Deploy Agent', 'Self-Heal Agent',
  'Page Builder', 'Style Agent', 'Page Builder', 'Integration Agent',
];

const FILES = [
  '/universe/factory/page.tsx',
  '/universe/dashboard/stats.tsx',
  '/components/ui/animated-counter.tsx',
  '/universe/agents/pool-view.tsx',
  '/api/admin/factory-status/route.ts',
  '/universe/commerce/checkout.tsx',
  '/components/ui/pipeline-stage.tsx',
  '/universe/crm/deals/page.tsx',
  '/hooks/useFactoryPolling.ts',
  '/universe/coaching/modules.tsx',
];

function generateDemoAgents(): FactoryAgent[] {
  return AGENT_NAMES.map((name, i) => {
    const isActive = i < 5;
    const isDeploying = i === 6;
    const isReviewing = i === 5;
    const status: AgentStatus = isActive ? 'building' : isDeploying ? 'deploying' : isReviewing ? 'reviewing' : 'idle';
    return {
      id: `agent-${i}`,
      name,
      role: AGENT_ROLES[i] || 'General Agent',
      status,
      currentFile: status !== 'idle' ? FILES[i % FILES.length] || null : null,
      progress: status === 'idle' ? 0 : Math.floor(Math.random() * 80) + 10,
      linesWritten: status === 'idle' ? 0 : Math.floor(Math.random() * 400) + 50,
      timeElapsed: status === 'idle' ? 0 : Math.floor(Math.random() * 300) + 30,
      totalBuilds: Math.floor(Math.random() * 50) + 5,
      totalLines: Math.floor(Math.random() * 15000) + 1000,
    };
  });
}

function generateDemoEvents(): BuildEvent[] {
  const types: BuildEventType[] = ['start', 'progress', 'complete', 'error', 'deploy', 'heal'];
  const messages = [
    { type: 'start' as const, msg: 'started building /universe/factory/page.tsx' },
    { type: 'progress' as const, msg: 'wrote 150 lines \u2014 component: FactoryFloor' },
    { type: 'complete' as const, msg: 'completed \u2014 540 lines, 0 errors' },
    { type: 'deploy' as const, msg: 'Build triggered \u2014 compiling 263 pages...' },
    { type: 'deploy' as const, msg: 'Deploy successful \u2014 live at memelli.com' },
    { type: 'error' as const, msg: 'Type error in commerce/checkout.tsx:142' },
    { type: 'heal' as const, msg: 'Self-healed type error \u2014 fixed import path' },
    { type: 'start' as const, msg: 'started building /universe/crm/deals/page.tsx' },
    { type: 'progress' as const, msg: 'wrote 280 lines \u2014 component: DealPipeline' },
    { type: 'complete' as const, msg: 'completed \u2014 380 lines, 0 errors' },
    { type: 'start' as const, msg: 'started building /universe/coaching/modules.tsx' },
    { type: 'progress' as const, msg: 'wrote 95 lines \u2014 component: ModuleGrid' },
    { type: 'deploy' as const, msg: 'Build triggered \u2014 compiling 271 pages...' },
    { type: 'complete' as const, msg: 'completed \u2014 620 lines, 1 warning' },
    { type: 'deploy' as const, msg: 'Deploy successful \u2014 live at memelli.com' },
  ];

  const now = Date.now();
  return messages.map((m, i) => ({
    id: `evt-${i}`,
    timestamp: new Date(now - (messages.length - i) * 45000).toISOString(),
    type: m.type,
    agentName: AGENT_NAMES[i % 5] || 'Builder-Alpha',
    message: m.msg,
  }));
}

function generateDemoBuildHistory(): BuildHistoryEntry[] {
  return [
    { id: 'bh-1', pages: 12, duration: '2m 34s', status: 'success', timestamp: new Date(Date.now() - 900000).toISOString() },
    { id: 'bh-2', pages: 8, duration: '1m 48s', status: 'success', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'bh-3', pages: 15, duration: '3m 12s', status: 'success', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'bh-4', pages: 3, duration: '0m 42s', status: 'failed', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { id: 'bh-5', pages: 22, duration: '4m 55s', status: 'success', timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: 'bh-6', pages: 6, duration: '1m 15s', status: 'success', timestamp: new Date(Date.now() - 18000000).toISOString() },
    { id: 'bh-7', pages: 10, duration: '2m 08s', status: 'success', timestamp: new Date(Date.now() - 21600000).toISOString() },
    { id: 'bh-8', pages: 1, duration: '0m 18s', status: 'building', timestamp: new Date(Date.now() - 60000).toISOString() },
    { id: 'bh-9', pages: 18, duration: '3m 50s', status: 'success', timestamp: new Date(Date.now() - 28800000).toISOString() },
    { id: 'bh-10', pages: 5, duration: '1m 02s', status: 'success', timestamp: new Date(Date.now() - 32400000).toISOString() },
  ];
}

function generateDemoData(): FactoryData {
  return {
    stats: {
      activeAgents: 7,
      pagesBuiltToday: 47,
      linesWritten: 18420,
      currentBuildCost: 12.84,
      buildSpeed: 342,
      deployQueueDepth: 3,
    },
    agents: generateDemoAgents(),
    events: generateDemoEvents(),
    buildHistory: generateDemoBuildHistory(),
    quality: {
      typeErrors: 0,
      buildWarnings: 3,
      selfHealRate: 94,
      errorsCaught: 12,
      selfHeals: 11,
    },
    pipeline: [
      { stage: 'code', status: 'done', progress: 100 },
      { stage: 'typecheck', status: 'done', progress: 100 },
      { stage: 'build', status: 'active', progress: 68 },
      { stage: 'deploy', status: 'waiting', progress: 0 },
      { stage: 'verify', status: 'waiting', progress: 0 },
      { stage: 'live', status: 'waiting', progress: 0 },
    ],
    costEfficiency: {
      costPerPage: 0.27,
      costPerLine: 0.0007,
      linesPerMinute: 342,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utility Components
   ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = value;
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) { setDisplay(value); return; }
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="tabular-nums font-mono">
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}
    </span>
  );
}

function StatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    building: 'bg-[#E11D2E]',
    idle: 'bg-[hsl(var(--muted))]',
    deploying: 'bg-violet-500',
    reviewing: 'bg-amber-500',
  };
  const pulse = status === 'building' || status === 'deploying';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${colors[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
}

function GlassCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════════════════ */

/* ---- Top Stats Bar ---- */
function StatsBar({ stats }: { stats: FactoryData['stats'] }) {
  const items = [
    { label: 'Active Agents', value: stats.activeAgents, icon: Bot, color: 'text-[#E11D2E]' },
    { label: 'Pages Built Today', value: stats.pagesBuiltToday, icon: FileCode, color: 'text-emerald-400' },
    { label: 'Lines Written', value: stats.linesWritten, icon: Code2, color: 'text-sky-400' },
    { label: 'Build Cost', value: stats.currentBuildCost, icon: DollarSign, color: 'text-amber-400', prefix: '$', decimals: 2 },
    { label: 'Build Speed', value: stats.buildSpeed, icon: Gauge, color: 'text-violet-400', suffix: ' l/min' },
    { label: 'Deploy Queue', value: stats.deployQueueDepth, icon: Layers, color: 'text-orange-400' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <GlassCard key={item.label} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{item.label}</span>
          </div>
          <div className={`text-2xl font-bold ${item.color}`}>
            <AnimatedCounter value={item.value} prefix={item.prefix} suffix={item.suffix} decimals={item.decimals} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

/* ---- Agent Card ---- */
function AgentCard({ agent, onClick }: { agent: FactoryAgent; onClick: () => void }) {
  const isActive = agent.status !== 'idle';
  const statusLabels: Record<AgentStatus, string> = {
    building: 'Building', idle: 'Idle', deploying: 'Deploying', reviewing: 'Reviewing',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
        isActive
          ? 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
          : 'bg-[hsl(var(--background))] border-[hsl(var(--border))] opacity-50 hover:opacity-70'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} />
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{agent.name}</span>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
          agent.status === 'building' ? 'bg-[#E11D2E]/20 text-[#E11D2E]' :
          agent.status === 'deploying' ? 'bg-violet-500/20 text-violet-400' :
          agent.status === 'reviewing' ? 'bg-amber-500/20 text-amber-400' :
          'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
        }`}>
          {statusLabels[agent.status]}
        </span>
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">{agent.role}</p>
      {isActive && agent.currentFile && (
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono truncate mb-2">{agent.currentFile}</p>
      )}
      {isActive && (
        <>
          <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5 mb-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                agent.status === 'building' ? 'bg-[#E11D2E]' :
                agent.status === 'deploying' ? 'bg-violet-500' : 'bg-amber-500'
              }`}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
            <span>{agent.linesWritten} lines</span>
            <span>{formatTime(agent.timeElapsed)}</span>
          </div>
        </>
      )}
    </button>
  );
}

/* ---- Agent Detail Modal ---- */
function AgentDetailModal({ agent, onClose }: { agent: FactoryAgent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm" onClick={onClose}>
      <GlassCard className="p-6 w-full max-w-md mx-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <StatusDot status={agent.status} />
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{agent.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors">
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Role</span>
            <span className="text-[hsl(var(--foreground))]">{agent.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Status</span>
            <span className={`font-medium ${
              agent.status === 'building' ? 'text-[#E11D2E]' :
              agent.status === 'deploying' ? 'text-violet-400' :
              agent.status === 'reviewing' ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'
            }`}>{agent.status.toUpperCase()}</span>
          </div>
          {agent.currentFile && (
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Current File</span>
              <span className="text-[hsl(var(--foreground))] font-mono text-xs">{agent.currentFile}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Progress</span>
            <span className="text-[hsl(var(--foreground))]">{agent.progress}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Lines Written (now)</span>
            <span className="text-[hsl(var(--foreground))]">{agent.linesWritten.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Time Elapsed</span>
            <span className="text-[hsl(var(--foreground))]">{formatTime(agent.timeElapsed)}</span>
          </div>
          <hr className="border-[hsl(var(--border))]" />
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Total Builds</span>
            <span className="text-[hsl(var(--foreground))]">{agent.totalBuilds}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Total Lines Written</span>
            <span className="text-[hsl(var(--foreground))]">{agent.totalLines.toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ---- Build Feed ---- */
function BuildFeed({ events }: { events: BuildEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!paused && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events, paused]);

  const typeColors: Record<BuildEventType, string> = {
    start: 'text-sky-400',
    progress: 'text-sky-300',
    complete: 'text-emerald-400',
    error: 'text-red-400',
    deploy: 'text-violet-400',
    heal: 'text-amber-400',
  };

  const typeIcons: Record<BuildEventType, React.ReactNode> = {
    start: <Play className="h-3 w-3" />,
    progress: <Code2 className="h-3 w-3" />,
    complete: <CheckCircle2 className="h-3 w-3" />,
    error: <XCircle className="h-3 w-3" />,
    deploy: <Rocket className="h-3 w-3" />,
    heal: <Wrench className="h-3 w-3" />,
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {events.map((evt) => (
          <div
            key={evt.id}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors duration-150"
          >
            <span className={`mt-0.5 flex-shrink-0 ${typeColors[evt.type]}`}>{typeIcons[evt.type]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono flex-shrink-0">{formatTimestamp(evt.timestamp)}</span>
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{evt.agentName}</span>
              </div>
              <p className={`text-xs ${typeColors[evt.type]} leading-relaxed`}>{evt.message}</p>
            </div>
          </div>
        ))}
      </div>
      {paused && (
        <div className="text-center py-1">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-1">
            <Pause className="h-3 w-3" /> Paused — move mouse away to resume
          </span>
        </div>
      )}
    </div>
  );
}

/* ---- Deploy Pipeline ---- */
function DeployPipeline({ pipeline }: { pipeline: PipelineState[] }) {
  const stageLabels: Record<PipelineStage, string> = {
    code: 'Code', typecheck: 'Type Check', build: 'Build',
    deploy: 'Deploy', verify: 'Verify', live: 'Live',
  };
  const stageIcons: Record<PipelineStage, React.ReactNode> = {
    code: <Code2 className="h-4 w-4" />,
    typecheck: <Shield className="h-4 w-4" />,
    build: <Hammer className="h-4 w-4" />,
    deploy: <Rocket className="h-4 w-4" />,
    verify: <Eye className="h-4 w-4" />,
    live: <Zap className="h-4 w-4" />,
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {pipeline.map((p, i) => (
        <div key={p.stage} className="flex items-center">
          <div className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-300 min-w-[80px] ${
            p.status === 'active' ? 'bg-[#E11D2E]/10 border-[#E11D2E]/40 shadow-[0_0_15px_rgba(225,29,46,0.15)]' :
            p.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30' :
            p.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
            'bg-[hsl(var(--card))] border-[hsl(var(--border))]'
          }`}>
            <div className={`${
              p.status === 'active' ? 'text-[#E11D2E] animate-pulse' :
              p.status === 'done' ? 'text-emerald-400' :
              p.status === 'error' ? 'text-red-400' :
              'text-[hsl(var(--muted-foreground))]'
            }`}>
              {p.status === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> :
               p.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> :
               stageIcons[p.stage]}
            </div>
            <span className={`text-[10px] font-medium ${
              p.status === 'active' ? 'text-[#E11D2E]' :
              p.status === 'done' ? 'text-emerald-400' :
              p.status === 'error' ? 'text-red-400' :
              'text-[hsl(var(--muted-foreground))]'
            }`}>
              {stageLabels[p.stage]}
            </span>
            {p.status === 'active' && (
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1">
                <div className="h-1 rounded-full bg-[#E11D2E] transition-all duration-500" style={{ width: `${p.progress}%` }} />
              </div>
            )}
          </div>
          {i < pipeline.length - 1 && (
            <ArrowRight className={`h-3.5 w-3.5 mx-1 flex-shrink-0 ${
              pipeline[i + 1]?.status === 'done' || pipeline[i + 1]?.status === 'active'
                ? 'text-[hsl(var(--muted-foreground))]' : 'text-zinc-800'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function FactoryPage() {
  const [data, setData] = useState<FactoryData>(generateDemoData);
  const [isLive, setIsLive] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<FactoryAgent | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Polling ---- */
  const fetchFactory = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
      const res = await fetch(`${apiUrl}/api/admin/factory-status`, { headers });
      if (res.ok) {
        const json = await res.json();
        const payload = json?.data || json;
        if (payload?.stats) {
          setData(payload);
          setIsLive(true);
          return;
        }
      }
      setIsLive(false);
    } catch {
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    fetchFactory();
    pollRef.current = setInterval(fetchFactory, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchFactory]);

  /* ---- Simulated ticking for demo mode ---- */
  useEffect(() => {
    if (isLive) return;
    tickRef.current = setInterval(() => {
      setData((prev) => {
        const next = { ...prev };
        // Animate stats
        next.stats = {
          ...prev.stats,
          linesWritten: prev.stats.linesWritten + Math.floor(Math.random() * 15) + 1,
          buildSpeed: Math.max(200, prev.stats.buildSpeed + Math.floor(Math.random() * 20) - 10),
          currentBuildCost: +(prev.stats.currentBuildCost + 0.01 + Math.random() * 0.02).toFixed(2),
        };
        // Animate agent progress
        next.agents = prev.agents.map((a) => {
          if (a.status === 'idle') return a;
          const newProgress = Math.min(100, a.progress + Math.floor(Math.random() * 5));
          const newLines = a.linesWritten + Math.floor(Math.random() * 8);
          const newTime = a.timeElapsed + 2;
          if (newProgress >= 100) {
            return { ...a, status: 'idle' as AgentStatus, progress: 0, linesWritten: 0, timeElapsed: 0, currentFile: null };
          }
          return { ...a, progress: newProgress, linesWritten: newLines, timeElapsed: newTime };
        });
        // Animate pipeline
        next.pipeline = prev.pipeline.map((p) => {
          if (p.status === 'active') {
            const newP = Math.min(100, p.progress + Math.floor(Math.random() * 8) + 2);
            if (newP >= 100) return { ...p, status: 'done' as StageStatus, progress: 100 };
            return { ...p, progress: newP };
          }
          return p;
        });
        // Advance pipeline to next stage
        const activeIdx = next.pipeline.findIndex((p) => p.status === 'active');
        if (activeIdx === -1) {
          const nextWaiting = next.pipeline.findIndex((p) => p.status === 'waiting');
          if (nextWaiting !== -1) {
            next.pipeline = next.pipeline.map((p, i) =>
              i === nextWaiting ? { ...p, status: 'active' as StageStatus, progress: 0 } : p
            );
          } else {
            // Reset pipeline
            next.pipeline = next.pipeline.map((p, i) => ({
              ...p,
              status: i === 0 ? 'active' as StageStatus : 'waiting' as StageStatus,
              progress: i === 0 ? 0 : 0,
            }));
            next.stats.pagesBuiltToday = prev.stats.pagesBuiltToday + 1;
          }
        }
        return next;
      });
    }, 2000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isLive]);

  const activeAgents = data.agents.filter((a) => a.status !== 'idle');
  const idleAgents = data.agents.filter((a) => a.status === 'idle');
  const traditionalCostPerLine = 150 / 60 / 5; // $150/hr, 5 lines/min
  const costSavingsPercent = Math.round((1 - data.costEfficiency.costPerLine / traditionalCostPerLine) * 100);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 p-4 lg:p-6 max-w-[1920px] mx-auto space-y-4">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E11D2E]/20 flex items-center justify-center">
              <Hammer className="h-5 w-5 text-[#E11D2E]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Build Factory</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Live assembly line — agents building in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* LIVE indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              isLive
                ? 'bg-[#E11D2E]/10 border-[#E11D2E]/30 text-[#E11D2E]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isLive ? 'bg-[#E11D2E]' : 'bg-amber-500'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-[#E11D2E]' : 'bg-amber-500'}`} />
              </span>
              {isLive ? 'LIVE' : 'DEMO'}
            </div>
          </div>
        </div>

        {/* ---- Top Stats ---- */}
        <StatsBar stats={data.stats} />

        {/* ---- Main 3-Column Grid ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* LEFT — Agent Assembly Line */}
          <div className="lg:col-span-3">
            <GlassCard className="p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#E11D2E]" />
                  Agent Assembly Line
                </h2>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{activeAgents.length} active</span>
              </div>

              {/* Active agents */}
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {activeAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
                ))}
              </div>

              {/* Reserve pool */}
              {idleAgents.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-[hsl(var(--muted))]" />
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reserve Pool</span>
                    <div className="h-px flex-1 bg-[hsl(var(--muted))]" />
                  </div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                    {idleAgents.map((agent) => (
                      <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          {/* CENTER — Live Build Feed */}
          <div className="lg:col-span-5">
            <GlassCard className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-sky-400" />
                  Live Build Feed
                </h2>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{data.events.length} events</span>
              </div>
              <div className="flex-1 min-h-[300px] max-h-[600px]">
                <BuildFeed events={data.events} />
              </div>
            </GlassCard>
          </div>

          {/* RIGHT — Factory Stats */}
          <div className="lg:col-span-4 space-y-4">
            {/* Today's Production */}
            <GlassCard className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-emerald-400" />
                Today&apos;s Production
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pages Built', value: data.stats.pagesBuiltToday, color: 'text-emerald-400' },
                  { label: 'Total Lines', value: data.stats.linesWritten, color: 'text-sky-400' },
                  { label: 'Errors Caught', value: data.quality.errorsCaught, color: 'text-red-400' },
                  { label: 'Self-Heals', value: data.quality.selfHeals, color: 'text-amber-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-[hsl(var(--background))] rounded-lg p-3 border border-[hsl(var(--border))]">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">{item.label}</span>
                    <div className={`text-xl font-bold mt-1 ${item.color}`}>
                      <AnimatedCounter value={item.value} />
                    </div>
                  </div>
                ))}
                <div className="col-span-2 bg-[hsl(var(--background))] rounded-lg p-3 border border-[hsl(var(--border))]">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">Cost So Far</span>
                  <div className="text-xl font-bold mt-1 text-amber-400">
                    <AnimatedCounter value={data.stats.currentBuildCost} prefix="$" decimals={2} />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Build History */}
            <GlassCard className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <GitBranch className="h-4 w-4 text-violet-400" />
                Build History
              </h2>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {data.buildHistory.map((bh) => (
                  <div key={bh.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        bh.status === 'success' ? 'bg-emerald-400' :
                        bh.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <span className="text-xs text-[hsl(var(--foreground))]">{bh.pages} pages</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{bh.duration}</span>
                      <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${
                        bh.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        bh.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{bh.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Cost Efficiency */}
            <GlassCard className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Cost Efficiency
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Cost per page</span>
                  <span className="text-[hsl(var(--foreground))] font-mono">${data.costEfficiency.costPerPage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Cost per line</span>
                  <span className="text-[hsl(var(--foreground))] font-mono">${data.costEfficiency.costPerLine.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Lines per minute</span>
                  <span className="text-[hsl(var(--foreground))] font-mono">{data.costEfficiency.linesPerMinute}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[hsl(var(--muted-foreground))]">vs Traditional Dev ($150/hr)</span>
                    <span className="text-emerald-400 font-semibold">{costSavingsPercent}% savings</span>
                  </div>
                  <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${costSavingsPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Quality Score */}
            <GlassCard className="p-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-sky-400" />
                Quality Score
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Type errors</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    data.quality.typeErrors === 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>{data.quality.typeErrors}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Build warnings</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    data.quality.buildWarnings === 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>{data.quality.buildWarnings}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Self-heal rate</span>
                  <span className="text-emerald-400 font-mono font-semibold">{data.quality.selfHealRate}%</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ---- Deploy Pipeline (Bottom) ---- */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4 text-violet-400" />
              Deploy Pipeline
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span>Build: 2m 34s</span>
              <span>Deploy: 47s</span>
              <span>Total: 3m 21s</span>
            </div>
          </div>
          <DeployPipeline pipeline={data.pipeline} />
        </GlassCard>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(113, 113, 122, 0.5);
        }
      `}</style>
    </div>
  );
}
