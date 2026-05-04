'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Globe,
  Activity,
  Cpu,
  Shield,
  Rocket,
  Eye,
  Brain,
  Layers,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Wrench,
  XCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface UniverseData {
  name: string;
  status: 'energized' | 'degraded' | 'offline';
  agentsTotal: number;
  agentsActive: number;
  poolsTotal: number;
  sectionsTotal: number;
  claudeLanes: { total: number; active: number; inFlight: number };
  healthScore: number;
}

interface PoolAgent {
  id: string;
  role: string;
  status: string;
  currentTask: string | null;
  heartbeat: string;
}

interface Pool {
  name: string;
  status: string;
  active: number;
  floor: number;
  deficit: number;
  agents: PoolAgent[];
}

interface Section {
  name: string;
  status: string;
  agentCount: number;
  pools: Pool[];
}

interface ClaudeLane {
  keyId: string;
  health: string;
  inFlight: number;
  maxInFlight: number;
  rpm: number;
  cost: { input: number; output: number; total: number };
}

interface RecentTask {
  id: string;
  type: string;
  status: string;
  lane: string;
  durationMs: number;
}

interface RecentError {
  message: string;
  source: string;
  timestamp: string;
}

interface HealingEvent {
  trigger: string;
  action: string;
  result: string;
}

interface MapData {
  universe: UniverseData;
  sections: Section[];
  claudeLanes: ClaudeLane[];
  recentTasks: RecentTask[];
  recentErrors: RecentError[];
  recentHealing: HealingEvent[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Section icon map                                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

const SECTION_ICONS: Record<string, typeof Globe> = {
  Interface: Globe,
  Orchestration: Brain,
  Execution: Cpu,
  Memory: Database,
  Deployment: Rocket,
  Security: Shield,
  Patrol: Eye,
  Knowledge: Layers,
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Status helpers                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function statusColor(status: string): string {
  switch (status) {
    case 'energized':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
    case 'success':
      return 'text-emerald-400';
    case 'degraded':
    case 'DEGRADED':
    case 'COOLING':
      return 'text-amber-400';
    case 'offline':
    case 'down':
    case 'DISABLED':
    case 'error':
      return 'text-red-400';
    default:
      return 'text-[hsl(var(--muted-foreground))]';
  }
}

function statusGlow(status: string): string {
  switch (status) {
    case 'energized':
    case 'healthy':
    case 'HEALTHY':
      return 'shadow-emerald-500/20';
    case 'degraded':
    case 'DEGRADED':
    case 'COOLING':
      return 'shadow-amber-500/20';
    case 'offline':
    case 'down':
    case 'DISABLED':
      return 'shadow-red-500/20';
    default:
      return 'shadow-zinc-500/10';
  }
}

function statusDot(status: string): string {
  switch (status) {
    case 'energized':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
      return 'bg-emerald-400';
    case 'degraded':
    case 'DEGRADED':
    case 'COOLING':
      return 'bg-amber-400';
    case 'offline':
    case 'down':
    case 'DISABLED':
    case 'error':
      return 'bg-red-400';
    default:
      return 'bg-[hsl(var(--muted-foreground))]';
  }
}

function statusStrokeColor(status: string): string {
  switch (status) {
    case 'energized':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
      return '#34d399';
    case 'degraded':
    case 'DEGRADED':
    case 'COOLING':
      return '#fbbf24';
    case 'offline':
    case 'down':
    case 'DISABLED':
    case 'error':
      return '#f87171';
    default:
      return '#71717a';
  }
}

function healthScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

function healthScoreStroke(score: number): string {
  if (score >= 90) return '#34d399';
  if (score >= 70) return '#fbbf24';
  return '#f87171';
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Animated Health Score Ring                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function HealthScoreRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const target = score;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        {/* Glow ring */}
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={healthScoreStroke(score)}
          strokeWidth="6"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 8px ${healthScoreStroke(score)}40)` }}
        />
        {/* Pulse dot at end of arc */}
        <circle
          cx={60 + 52 * Math.cos(((animatedScore / 100) * 360 - 90) * Math.PI / 180)}
          cy={60 + 52 * Math.sin(((animatedScore / 100) * 360 - 90) * Math.PI / 180)}
          r="4"
          fill={healthScoreStroke(score)}
          className="animate-pulse"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[48px] font-black leading-none ${healthScoreColor(score)}`}>
          {animatedScore}
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mt-1">Health</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Components                                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function UniverseNode({ data }: { data: UniverseData }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Animated Health Score Ring */}
      <HealthScoreRing score={data.healthScore} />

      {/* Status badge */}
      <div className={`mt-4 flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 ${
        data.status === 'energized'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : data.status === 'degraded'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusDot(data.status)}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${statusDot(data.status)}`} />
        </span>
        {data.status}
      </div>

      {/* Stats row with animated counters */}
      <div className="mt-6 grid grid-cols-4 gap-6">
        <AnimatedStatBox label="Total Agents" value={data.agentsTotal} />
        <AnimatedStatBox label="Active" value={data.agentsActive} />
        <AnimatedStatBox label="Pools" value={data.poolsTotal} />
        <StatBox label="Claude Lanes" value={`${data.claudeLanes.active}/${data.claudeLanes.total}`} />
      </div>
    </div>
  );
}

function AnimatedStatBox({ label, value }: { label: string; value: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 600;
    const startTime = performance.now();
    const startVal = displayed;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-[22px] font-bold text-[hsl(var(--foreground))] tabular-nums">{displayed.toLocaleString()}</span>
      <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[22px] font-bold text-[hsl(var(--foreground))]">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
    </div>
  );
}

function SectionCard({
  section,
  expanded,
  onToggle,
  zoomedSection,
  onZoom,
  index,
}: {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
  zoomedSection: string | null;
  onZoom: (name: string | null) => void;
  index: number;
}) {
  const Icon = SECTION_ICONS[section.name] || Layers;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const isZoomed = zoomedSection === section.name;
  const isHidden = zoomedSection !== null && !isZoomed;

  return (
    <div
      className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg transition-all duration-300 ${statusGlow(section.status)} ${
        isZoomed ? 'col-span-full' : ''
      } ${isHidden ? 'hidden' : ''}`}
      style={{ animation: `fadeInUp 300ms ${index * 80}ms both` }}
    >
      {/* Glow effect for healthy nodes */}
      {section.status === 'healthy' && (
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.04) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Card header */}
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 p-4 text-left hover:bg-[hsl(var(--muted))] rounded-t-2xl transition-colors duration-200"
        >
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            section.status === 'healthy' ? 'bg-emerald-500/10' : section.status === 'degraded' ? 'bg-amber-500/10' : 'bg-red-500/10'
          }`}>
            <Icon className={`h-5 w-5 ${statusColor(section.status)} transition-transform duration-200`} />
            {/* Node glow pulse */}
            {section.status === 'healthy' && (
              <div className="absolute inset-0 rounded-xl bg-emerald-500/10 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))] truncate">{section.name}</h3>
              <span className={`relative inline-flex h-2 w-2 rounded-full ${statusDot(section.status)}`}>
                {section.status === 'healthy' && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {section.agentCount.toLocaleString()} agents
              </span>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {section.pools.length} pools
              </span>
            </div>
          </div>
          <Chevron className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0 transition-transform duration-200" />
        </button>

        {/* Zoom button */}
        <button
          onClick={() => onZoom(isZoomed ? null : section.name)}
          className="absolute top-4 right-12 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] transition-colors duration-200"
          title={isZoomed ? 'Minimize' : 'Zoom in'}
        >
          {isZoomed ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded pool list */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${
        expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-[hsl(var(--border))] px-4 pb-4 space-y-2 pt-3">
          {section.pools.map((pool, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 hover:bg-[hsl(var(--muted))] transition-all duration-200"
              style={{ animation: expanded ? `fadeInUp 200ms ${i * 40}ms both` : 'none' }}
            >
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusDot(pool.status)}`}>
                {pool.status === 'active' && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-medium text-[hsl(var(--foreground))] truncate block">
                  {pool.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))] shrink-0">
                <span>
                  <span className="text-[hsl(var(--foreground))] font-medium">{pool.active}</span> active
                </span>
                <span>
                  <span className="text-[hsl(var(--muted-foreground))]">{pool.floor}</span> floor
                </span>
                {pool.deficit > 0 && (
                  <span className="text-amber-400 font-medium">-{pool.deficit}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClaudeLaneCard({ lane, index }: { lane: ClaudeLane; index: number }) {
  const utilization = lane.maxInFlight > 0
    ? Math.round((lane.inFlight / lane.maxInFlight) * 100)
    : 0;

  return (
    <div
      className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-lg transition-all duration-300 hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))] ${statusGlow(lane.health)}`}
      style={{ animation: `fadeInUp 300ms ${index * 80}ms both` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${statusColor(lane.health)} transition-colors duration-300`} />
          <span className="text-[13px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
            {lane.keyId}
          </span>
        </div>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${statusColor(lane.health)} transition-colors duration-300`}>
          {lane.health}
        </span>
      </div>

      {/* Utilization bar with animation */}
      <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{
            width: `${utilization}%`,
            boxShadow: utilization > 0 ? `0 0 8px ${utilization > 80 ? '#ef4444' : utilization > 50 ? '#f59e0b' : '#10b981'}40` : 'none',
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">In-flight</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{lane.inFlight}/{lane.maxInFlight}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">RPM</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{lane.rpm}</span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-[hsl(var(--muted-foreground))]">Cost</span>
          <span className="text-[hsl(var(--foreground))] font-medium">${lane.cost.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({
  tasks,
  errors,
  healing,
}: {
  tasks: RecentTask[];
  errors: RecentError[];
  healing: HealingEvent[];
}) {
  const [tab, setTab] = useState<'tasks' | 'errors' | 'healing'>('tasks');

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[hsl(var(--border))]">
        {(['tasks', 'errors', 'healing'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-[12px] font-medium uppercase tracking-wider transition-all duration-200 ${
              tab === t
                ? 'text-red-400 border-b-2 border-red-500 bg-red-500/5'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {t === 'tasks' && <Activity className="h-3.5 w-3.5" />}
            {t === 'errors' && <AlertTriangle className="h-3.5 w-3.5" />}
            {t === 'healing' && <Wrench className="h-3.5 w-3.5" />}
            {t}
            <span className={`ml-1 text-[10px] ${tab === t ? 'text-red-400/70' : 'text-[hsl(var(--muted-foreground))]'}`}>
              {t === 'tasks' ? tasks.length : t === 'errors' ? errors.length : healing.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content with staggered slide-in */}
      <div className="max-h-[320px] overflow-y-auto">
        {tab === 'tasks' && (
          <div className="divide-y divide-white/[0.03]">
            {tasks.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-[hsl(var(--muted-foreground))]">No recent tasks</div>
            )}
            {tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                style={{ animation: `slideInLeft 250ms ${i * 30}ms both` }}
              >
                {task.status === 'success' || task.status === 'completed' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : task.status === 'failed' || task.status === 'error' ? (
                  <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                )}
                <span className="text-[12px] text-[hsl(var(--muted-foreground))] truncate flex-1">{task.type}</span>
                {task.durationMs > 0 && (
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">{task.durationMs}ms</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'errors' && (
          <div className="divide-y divide-white/[0.03]">
            {errors.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-[hsl(var(--muted-foreground))]">No recent errors</div>
            )}
            {errors.map((err, i) => (
              <div
                key={i}
                className="px-4 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                style={{ animation: `slideInLeft 250ms ${i * 30}ms both` }}
              >
                <div className="text-[12px] text-red-300 truncate">{err.message}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{err.source}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{err.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'healing' && (
          <div className="divide-y divide-white/[0.03]">
            {healing.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-[hsl(var(--muted-foreground))]">No recent healing events</div>
            )}
            {healing.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                style={{ animation: `slideInLeft 250ms ${i * 30}ms both` }}
              >
                <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))] truncate block">{h.trigger}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate block">{h.action}</span>
                </div>
                <span className={`text-[10px] font-medium ${h.result === 'success' ? 'text-emerald-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                  {h.result}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Animated Connection Lines (SVG)                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function AnimatedConnectionLine({ direction }: { direction: 'down' | 'spread' }) {
  if (direction === 'down') {
    return (
      <div className="flex justify-center py-2">
        <svg width="2" height="32" className="overflow-visible">
          <defs>
            <linearGradient id="lineGradDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D2E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E11D2E" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line x1="1" y1="0" x2="1" y2="32" stroke="url(#lineGradDown)" strokeWidth="1.5" />
          {/* Pulse dot traveling down */}
          <circle r="2" fill="#E11D2E" opacity="0.8">
            <animateMotion dur="2s" repeatCount="indefinite" path="M1,0 L1,32" />
          </circle>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <svg width="600" height="24" className="overflow-visible max-w-xl w-full" viewBox="0 0 600 24" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGradSpread" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E11D2E" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#E11D2E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E11D2E" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Center stem down */}
        <line x1="300" y1="0" x2="300" y2="12" stroke="#E11D2E" strokeOpacity="0.2" strokeWidth="1" />
        {/* Horizontal bar */}
        <line x1="60" y1="12" x2="540" y2="12" stroke="url(#lineGradSpread)" strokeWidth="1" />
        {/* Branch stems */}
        {[60, 180, 300, 420, 540].map((x) => (
          <line key={x} x1={x} y1="12" x2={x} y2="24" stroke="#E11D2E" strokeOpacity="0.15" strokeWidth="1" />
        ))}
        {/* Animated pulse along horizontal */}
        <circle r="3" fill="#E11D2E" opacity="0.6">
          <animateMotion dur="3s" repeatCount="indefinite" path="M60,12 L540,12" />
        </circle>
        <circle r="3" fill="#E11D2E" opacity="0.4">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1.5s" path="M540,12 L60,12" />
        </circle>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Mini Map                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function MiniMap({ sections, healthScore }: { sections: Section[]; healthScore: number }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-40 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 shadow-2xl shadow-black/30">
      <div className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 font-semibold">System Overview</div>

      {/* Mini health */}
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle
            cx="10" cy="10" r="7" fill="none"
            stroke={healthScoreStroke(healthScore)}
            strokeWidth="2"
            strokeDasharray={`${(healthScore / 100) * 44} 44`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-[11px] font-bold ${healthScoreColor(healthScore)}`}>{healthScore}</span>
      </div>

      {/* Section dots */}
      <div className="grid grid-cols-4 gap-1.5">
        {sections.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-0.5" title={s.name}>
            <div className={`h-2.5 w-2.5 rounded-sm ${statusDot(s.status)} transition-colors duration-300`} />
            <span className="text-[7px] text-[hsl(var(--muted-foreground))] truncate w-full text-center">{s.name.slice(0, 4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function UniverseMapPage() {
  const api = useApi();
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [zoomedSection, setZoomedSection] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await api.get<MapData>('/api/admin/universe-map');
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, [api]);

  // Initial fetch + 5s polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingGlobe size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-[13px] text-[hsl(var(--muted-foreground))]">{error}</p>
          <button onClick={fetchData} className="mt-4 text-[12px] text-red-400 hover:text-red-300 transition-colors duration-200">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Mini Map */}
      <MiniMap sections={data.sections} healthScore={data.universe.healthScore} />

      {/* Background grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      {/* ═══════════════ Header ═══════════════ */}
      <div className="flex items-center justify-between relative z-10" style={{ animation: 'fadeInUp 300ms both' }}>
        <div>
          <h1 className="text-[22px] font-bold text-[hsl(var(--foreground))]">Universe Map</h1>
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">
            Real-time system topology -- {data.universe.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 group"
          >
            <RefreshCw className="h-3 w-3 transition-transform duration-200 group-hover:rotate-90" />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════ Universe Node (top level) ═══════════════ */}
      <div
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-xl shadow-black/20 relative z-10 overflow-hidden"
        style={{ animation: 'fadeInUp 400ms 100ms both' }}
      >
        {/* Subtle radial glow behind */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at center, ${healthScoreStroke(data.universe.healthScore)}08 0%, transparent 60%)`,
        }} />
        <UniverseNode data={data.universe} />
      </div>

      {/* Connection from universe to sections */}
      <AnimatedConnectionLine direction="spread" />

      {/* ═══════════════ Sections Grid ═══════════════ */}
      <div className="relative z-10">
        <h2 className="text-[14px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
          System Sections
        </h2>
        <div className={`grid gap-3 ${zoomedSection ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {data.sections.map((section, i) => (
            <SectionCard
              key={section.name}
              section={section}
              expanded={expandedSections.has(section.name)}
              onToggle={() => toggleSection(section.name)}
              zoomedSection={zoomedSection}
              onZoom={setZoomedSection}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Connection from sections to lanes */}
      <AnimatedConnectionLine direction="down" />

      {/* ═══════════════ Claude Lanes Panel ═══════════════ */}
      <div className="relative z-10">
        <h2 className="text-[14px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
          Claude Execution Lanes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.claudeLanes.length === 0 && (
            <div className="col-span-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
              No Claude lanes initialized
            </div>
          )}
          {data.claudeLanes.map((lane, i) => (
            <ClaudeLaneCard key={lane.keyId} lane={lane} index={i} />
          ))}
        </div>
      </div>

      {/* ═══════════════ Live Activity Feed ═══════════════ */}
      <div className="relative z-10" style={{ animation: 'fadeInUp 400ms 400ms both' }}>
        <h2 className="text-[14px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">
          Live Activity
        </h2>
        <ActivityFeed
          tasks={data.recentTasks}
          errors={data.recentErrors}
          healing={data.recentHealing}
        />
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
