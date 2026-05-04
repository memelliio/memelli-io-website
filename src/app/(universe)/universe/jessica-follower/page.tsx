'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';
import {
  Eye,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Cpu,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Layers,
  Users,
  Zap,
  Shield,
  Radio,
  ArrowRight,
  Bot,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface StageResult {
  stage: string;
  status: string;
  timestamp: string;
  duration?: number;
  details?: string;
}

interface FailureEvent {
  point: string;
  expected: string;
  actual: string;
  healExpected: boolean;
  healExecuted: boolean;
}

interface HealEvent {
  trigger: string;
  action: string;
  result: string;
  durationMs: number;
}

interface TaskTreeChild {
  id: string;
  type: string;
  status: string;
}

interface JessicaTrace {
  traceId: string;
  directiveId: string;
  source: string;
  userId: string;
  role: string;
  originalText: string;
  interpretedIntent: string;
  selectedWorkflow: string;
  status: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  currentStage: string;
  stageResults: StageResult[];
  touchedPools: string[];
  touchedSections: string[];
  touchedAgents: string[];
  taskTree: { parentId: string; children: TaskTreeChild[] } | null;
  claudeUsage: { used: boolean; calls: number; lanes: string[] };
  failureEvents: FailureEvent[];
  healEvents: HealEvent[];
  finalOutcome: string | null;
}

interface Stats {
  activeTraces: number;
  completedToday: number;
  failedToday: number;
  healedToday: number;
  unresolvedToday: number;
  avgDurationMs: number;
  claudeCallsToday: number;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const ALL_STAGES = [
  'input_received',
  'intent_parsed',
  'context_loaded',
  'workflow_selected',
  'task_decomposed',
  'pools_assigned',
  'agents_dispatched',
  'execution_started',
  'stage_1_complete',
  'stage_2_complete',
  'stage_3_complete',
  'validation_running',
  'healing_check',
  'result_aggregated',
  'response_delivered',
];

const STAGE_LABELS: Record<string, string> = {
  input_received: 'Input',
  intent_parsed: 'Intent',
  context_loaded: 'Context',
  workflow_selected: 'Workflow',
  task_decomposed: 'Decompose',
  pools_assigned: 'Pools',
  agents_dispatched: 'Dispatch',
  execution_started: 'Execute',
  stage_1_complete: 'Stage 1',
  stage_2_complete: 'Stage 2',
  stage_3_complete: 'Stage 3',
  validation_running: 'Validate',
  healing_check: 'Heal Check',
  result_aggregated: 'Aggregate',
  response_delivered: 'Deliver',
};

const STATUS_COLORS: Record<string, string> = {
  running: 'text-blue-400',
  completed: 'text-emerald-400',
  completed_with_heal: 'text-amber-400',
  partial_success: 'text-orange-400',
  failed: 'text-red-400',
  failed_unresolved: 'text-red-500',
};

const STATUS_BG: Record<string, string> = {
  running: 'bg-blue-500/10 border-blue-500/20',
  completed: 'bg-emerald-500/10 border-emerald-500/20',
  completed_with_heal: 'bg-amber-500/10 border-amber-500/20',
  partial_success: 'bg-orange-500/10 border-orange-500/20',
  failed: 'bg-red-500/10 border-red-500/20',
  failed_unresolved: 'bg-red-500/15 border-red-500/30',
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

/* ================================================================== */
/*  Animated Counter                                                    */
/* ================================================================== */

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const startVal = prevRef.current;
    const duration = 500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value]);

  return <span className={className}>{displayed}</span>;
}

/* ================================================================== */
/*  SVG Timeline Path                                                   */
/* ================================================================== */

function TimelineSVG({
  stages,
  getStageStatus,
}: {
  stages: string[];
  getStageStatus: (stage: string) => 'completed' | 'active' | 'pending' | 'failed';
}) {
  const completedCount = stages.filter((s) => getStageStatus(s) === 'completed').length;
  const activeIdx = stages.findIndex((s) => getStageStatus(s) === 'active');
  const progressPct = stages.length > 1
    ? ((activeIdx >= 0 ? activeIdx : completedCount) / (stages.length - 1)) * 100
    : 0;

  return (
    <svg className="w-full h-3 mb-2" viewBox="0 0 1000 12" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="timelineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset={`${progressPct}%`} stopColor="#34d399" stopOpacity="0.6" />
          <stop offset={`${progressPct + 1}%`} stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#71717a" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Background track */}
      <line x1="20" y1="6" x2="980" y2="6" stroke="rgba(255,255,255,0.04)" strokeWidth="2" strokeLinecap="round" />
      {/* Progress track */}
      <line x1="20" y1="6" x2={20 + (960 * progressPct / 100)} y2="6" stroke="url(#timelineGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Animated pulse along progress */}
      {activeIdx >= 0 && (
        <circle r="3" fill="#3b82f6" opacity="0.8">
          <animateMotion dur="1.5s" repeatCount="indefinite" path={`M${20 + (960 * progressPct / 100) - 20},6 L${20 + (960 * progressPct / 100)},6`} />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Stage dots */}
      {stages.map((stage, i) => {
        const x = 20 + (960 * i / (stages.length - 1));
        const status = getStageStatus(stage);
        const fill = status === 'completed' ? '#34d399' : status === 'active' ? '#3b82f6' : status === 'failed' ? '#f87171' : '#3f3f46';
        return (
          <g key={stage}>
            {status === 'active' && (
              <circle cx={x} cy="6" r="5" fill={fill} opacity="0.2">
                <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy="6" r="3" fill={fill} className="transition-all duration-300" />
          </g>
        );
      })}
    </svg>
  );
}

/* ================================================================== */
/*  Expandable Event Card                                               */
/* ================================================================== */

function ExpandableFailureCard({ event, index }: { event: FailureEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden transition-all duration-250"
      style={{ animation: `slideInUp 250ms ${index * 60}ms both` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[hsl(var(--muted))] transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-red-400 font-medium">{event.point}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded transition-all duration-200 ${
            event.healExecuted
              ? 'bg-emerald-500/10 text-emerald-400'
              : event.healExpected
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {event.healExecuted ? 'Healed' : event.healExpected ? 'Heal Expected' : 'Unresolved'}
          </span>
        </div>
        <ChevronRight className={`h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-250 ease-out ${
        expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 text-[12px] space-y-1 border-t border-[hsl(var(--border))] pt-2">
          <div className="text-[hsl(var(--muted-foreground))]">
            Expected: <span className="text-[hsl(var(--muted-foreground))]">{event.expected}</span>
          </div>
          <div className="text-[hsl(var(--muted-foreground))]">
            Actual: <span className="text-[hsl(var(--muted-foreground))]">{event.actual}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandableHealCard({ event, index }: { event: HealEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden transition-all duration-250"
      style={{ animation: `slideInUp 250ms ${index * 60}ms both` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[hsl(var(--muted))] transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-amber-400 font-medium">{event.trigger}</span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatDuration(event.durationMs)}</span>
        </div>
        <ChevronRight className={`h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-250 ease-out ${
        expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 text-[12px] space-y-1 border-t border-[hsl(var(--border))] pt-2">
          <div className="text-[hsl(var(--muted-foreground))]">
            Action: <span className="text-[hsl(var(--muted-foreground))]">{event.action}</span>
          </div>
          <div className="text-[hsl(var(--muted-foreground))]">
            Result: <span className="text-[hsl(var(--muted-foreground))]">{event.result}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function JessicaFollowerPage() {
  const [currentTrace, setCurrentTrace] = useState<JessicaTrace | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTraces, setRecentTraces] = useState<JessicaTrace[]>([]);
  const [failedTraces, setFailedTraces] = useState<JessicaTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<JessicaTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [seeding, setSeeding] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────

  const fetchCurrent = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/jessica-follower/current`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setCurrentTrace(json.trace);
        setStats(json.stats);
        setIsLive(json.active);
        setConnectionStatus('connected');
        setLastUpdate(new Date());
      }
    } catch {
      setConnectionStatus('error');
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/jessica-follower/recent?limit=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) setRecentTraces(json.traces);
    } catch {
      /* silent */
    }
  }, []);

  const fetchFailed = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/jessica-follower/failed`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) setFailedTraces(json.traces);
    } catch {
      /* silent */
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCurrent(), fetchRecent(), fetchFailed()]);
    setLoading(false);
  }, [fetchCurrent, fetchRecent, fetchFailed]);

  // ── Seed a test trace (creates real trace in Redis via API) ─────────
  const seedTestTrace = useCallback(async () => {
    setSeeding(true);
    try {
      const token = getToken();
      // Start a trace
      const startRes = await fetch(`${API_URL}/api/admin/jessica-follower/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          source: 'dashboard',
          userId: 'admin',
          role: 'SUPER_ADMIN',
          text: 'System health check — verify all pools and engines are operational',
        }),
      });
      const startJson = await startRes.json();
      if (!startJson.success) return;

      const traceId = startJson.traceId;

      // Simulate progression through stages with delays
      const stages = [
        { stage: 'intent_parsed', status: 'completed', details: 'Intent: system_health_check' },
        { stage: 'context_loaded', status: 'completed', details: 'Loaded 12 pool contexts' },
        { stage: 'workflow_selected', status: 'completed', details: 'Workflow: health_sweep' },
        { stage: 'task_decomposed', status: 'completed', details: 'Decomposed into 3 sub-tasks' },
        { stage: 'pools_assigned', status: 'completed', details: 'Assigned: self-healing, diagnostics, deployment' },
        { stage: 'agents_dispatched', status: 'completed', details: '6 agents dispatched' },
        { stage: 'execution_started', status: 'completed', details: 'Execution begun' },
        { stage: 'stage_1_complete', status: 'completed', details: 'Pool scan complete' },
        { stage: 'stage_2_complete', status: 'completed', details: 'Engine validation done' },
        { stage: 'stage_3_complete', status: 'completed', details: 'Health metrics aggregated' },
        { stage: 'validation_running', status: 'completed', details: 'All checks passed' },
        { stage: 'healing_check', status: 'completed', details: 'No healing needed' },
        { stage: 'result_aggregated', status: 'completed', details: '12/12 pools healthy' },
      ];

      for (const s of stages) {
        await new Promise((r) => setTimeout(r, 200));
        await fetch(`${API_URL}/api/admin/jessica-follower/stage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ traceId, ...s }),
        });
      }

      // Complete the trace
      await fetch(`${API_URL}/api/admin/jessica-follower/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          traceId,
          outcome: 'System health check completed successfully. All 12 pools operational. No issues detected.',
        }),
      });

      // Refresh
      await fetchAll();
    } catch {
      /* silent */
    } finally {
      setSeeding(false);
    }
  }, [fetchAll]);

  // ── Polling ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
    // Poll every 3s when live, 5s otherwise (faster for more "alive" feel)
    pollRef.current = setInterval(() => {
      fetchCurrent();
    }, isLive ? 3000 : 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchAll, fetchCurrent, isLive]);

  // Refresh recent/failed less frequently
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecent();
      fetchFailed();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchRecent, fetchFailed]);

  // ── Active trace (selected or current) ─────────────────────────────────

  const activeTrace = selectedTrace || currentTrace;

  // ── Stage tracker helpers ──────────────────────────────────────────────

  const getStageStatus = (stage: string): 'completed' | 'active' | 'pending' | 'failed' => {
    if (!activeTrace) return 'pending';
    const result = activeTrace.stageResults.find((r) => r.stage === stage);
    if (!result) {
      // Check if current stage is past this one
      const currentIdx = ALL_STAGES.indexOf(activeTrace.currentStage);
      const stageIdx = ALL_STAGES.indexOf(stage);
      if (stageIdx < currentIdx) return 'completed';
      if (stageIdx === currentIdx) return 'active';
      return 'pending';
    }
    if (result.status === 'failed') return 'failed';
    if (result.status === 'completed') return 'completed';
    return 'active';
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Render                                                             */
  /* ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 relative">
      {/* Background grid pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(225,29,46,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,46,0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* ═══════════════════════ Header ═══════════════════════ */}
      <div className="flex items-center justify-between relative z-10" style={{ animation: 'fadeInUp 300ms both' }}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/15 group">
            <Eye className="h-5 w-5 text-red-400 transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              Melli Follower
              <span className="ml-2 text-sm font-normal text-[hsl(var(--muted-foreground))]">
                Live Command Trace
              </span>
            </h1>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
              See exactly what Melli does, moment by moment
            </p>
          </div>
          {isLive && (
            <span className="ml-3 flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 transition-all duration-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-[11px] mr-2">
            <span className="relative flex h-2 w-2">
              {connectionStatus === 'connected' && (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </>
              )}
              {connectionStatus === 'error' && (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              )}
              {connectionStatus === 'loading' && (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
            <span className={
              connectionStatus === 'connected' ? 'text-emerald-400' :
              connectionStatus === 'error' ? 'text-red-400' : 'text-amber-400'
            }>
              {connectionStatus === 'connected' ? 'CONNECTED' : connectionStatus === 'error' ? 'RETRY' : 'CONNECTING'}
            </span>
            {lastUpdate && (
              <span className="text-[hsl(var(--muted-foreground))] ml-1">{lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>

          <button
            onClick={seedTestTrace}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/15 transition-all duration-200 disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${seeding ? 'animate-pulse' : ''}`} />
            {seeding ? 'Seeding...' : 'Seed Trace'}
          </button>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2 text-[12px] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 group"
          >
            <RefreshCw className={`h-3.5 w-3.5 transition-transform duration-200 ${loading ? 'animate-spin' : 'group-hover:rotate-90'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════════════ Stats Cards ═══════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
        <StatCard
          label="Active"
          value={stats?.activeTraces ?? 0}
          icon={<Radio className="h-3.5 w-3.5" />}
          color="blue"
          pulse={isLive}
          index={0}
        />
        <StatCard
          label="Completed"
          value={stats?.completedToday ?? 0}
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          color="emerald"
          index={1}
        />
        <StatCard
          label="Warnings"
          value={(stats?.failedToday ?? 0) + (stats?.healedToday ?? 0)}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          color="amber"
          index={2}
        />
        <StatCard
          label="Healed"
          value={stats?.healedToday ?? 0}
          icon={<Wrench className="h-3.5 w-3.5" />}
          color="orange"
          index={3}
        />
        <StatCard
          label="Unresolved"
          value={stats?.unresolvedToday ?? 0}
          icon={<XCircle className="h-3.5 w-3.5" />}
          color="red"
          index={4}
        />
        <StatCard
          label="Avg Time"
          value={stats ? formatDuration(stats.avgDurationMs) : '--'}
          icon={<Clock className="h-3.5 w-3.5" />}
          color="zinc"
          isText
          index={5}
        />
        <StatCard
          label="Claude Calls"
          value={stats?.claudeCallsToday ?? 0}
          icon={<Cpu className="h-3.5 w-3.5" />}
          color="red"
          index={6}
        />
      </div>

      {/* ═══════════════════════ Main Layout ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        {/* ── Center: Stage Timeline ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active trace info */}
          {activeTrace ? (
            <div
              className={`rounded-2xl border p-4 transition-all duration-300 ${STATUS_BG[activeTrace.status] || 'bg-[hsl(var(--card))] border-[hsl(var(--border))]'}`}
              style={{ animation: 'fadeInUp 300ms both' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300 ${STATUS_COLORS[activeTrace.status] || 'text-[hsl(var(--muted-foreground))]'}`}>
                      {activeTrace.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {activeTrace.traceId}
                    </span>
                  </div>
                  <p className="text-[14px] text-[hsl(var(--foreground))] font-medium truncate">
                    &ldquo;{activeTrace.originalText}&rdquo;
                  </p>
                  {activeTrace.interpretedIntent && (
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">
                      Intent: <span className="text-[hsl(var(--muted-foreground))]">{activeTrace.interpretedIntent}</span>
                      {activeTrace.selectedWorkflow && (
                        <> &middot; Workflow: <span className="text-[hsl(var(--muted-foreground))]">{activeTrace.selectedWorkflow}</span></>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-[hsl(var(--muted-foreground))] shrink-0 ml-3">
                  <div>{activeTrace.source} &middot; {activeTrace.role}</div>
                  <div>{timeAgo(activeTrace.startedAt)}</div>
                </div>
              </div>

              {/* SVG Timeline Path */}
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                  Execution Stages
                </div>

                <TimelineSVG stages={ALL_STAGES} getStageStatus={getStageStatus} />

                <div className="flex flex-wrap gap-1">
                  {ALL_STAGES.map((stage, idx) => {
                    const status = getStageStatus(stage);
                    const stageResult = activeTrace.stageResults.find((r) => r.stage === stage);
                    return (
                      <div
                        key={stage}
                        className="flex items-center gap-1"
                        title={stageResult?.details || stage}
                      >
                        <div
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : status === 'active'
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                              : status === 'failed'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                          }`}
                          style={{
                            animation: status === 'active' ? 'stagePulse 2s ease-in-out infinite' : 'none',
                          }}
                        >
                          {status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
                          {status === 'active' && <Activity className="h-2.5 w-2.5" />}
                          {status === 'failed' && <XCircle className="h-2.5 w-2.5" />}
                          {STAGE_LABELS[stage] || stage}
                          {stageResult?.duration != null && (
                            <span className="text-[9px] opacity-60 ml-0.5">
                              {formatDuration(stageResult.duration)}
                            </span>
                          )}
                        </div>
                        {idx < ALL_STAGES.length - 1 && (
                          <ArrowRight className="h-2.5 w-2.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Final outcome */}
              {activeTrace.finalOutcome && (
                <div className="mt-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-3 transition-all duration-300" style={{ animation: 'fadeInUp 300ms both' }}>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                    Final Outcome
                  </div>
                  <p className="text-[12px] text-[hsl(var(--foreground))]">
                    {activeTrace.finalOutcome}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center" style={{ animation: 'fadeInUp 300ms both' }}>
              <Eye className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
              <p className="text-[13px] text-[hsl(var(--muted-foreground))]">No active trace</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                {connectionStatus === 'error'
                  ? 'Cannot reach API — retrying connection...'
                  : recentTraces.length === 0
                    ? 'No traces in Redis yet. Click "Seed Trace" to create a test trace.'
                    : 'Waiting for Melli to process a command...'}
              </p>
              {connectionStatus === 'connected' && recentTraces.length === 0 && (
                <button
                  onClick={seedTestTrace}
                  disabled={seeding}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-[12px] text-red-400 hover:bg-red-500/15 transition-all duration-200 disabled:opacity-50"
                >
                  <Zap className={`h-3.5 w-3.5 ${seeding ? 'animate-pulse' : ''}`} />
                  {seeding ? 'Creating...' : 'Create Test Trace'}
                </button>
              )}
            </div>
          )}

          {/* ── Failure Gap Panel ── */}
          {activeTrace && activeTrace.failureEvents.length > 0 && (
            <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-4" style={{ animation: 'fadeInUp 300ms 100ms both' }}>
              <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Failure Events ({activeTrace.failureEvents.length})
              </div>
              <div className="space-y-2">
                {activeTrace.failureEvents.map((f, i) => (
                  <ExpandableFailureCard key={i} event={f} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Heal Events ── */}
          {activeTrace && activeTrace.healEvents.length > 0 && (
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-4" style={{ animation: 'fadeInUp 300ms 150ms both' }}>
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5" />
                Heal Events ({activeTrace.healEvents.length})
              </div>
              <div className="space-y-2">
                {activeTrace.healEvents.map((h, i) => (
                  <ExpandableHealCard key={i} event={h} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Side Panel ── */}
        <div className="space-y-4">
          {/* Task Tree */}
          {activeTrace?.taskTree && (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" style={{ animation: 'fadeInUp 300ms 50ms both' }}>
              <div className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                Task Tree
              </div>
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] mb-2">
                Parent: <span className="text-[hsl(var(--muted-foreground))] font-mono">{activeTrace.taskTree.parentId}</span>
              </div>
              <div className="space-y-1">
                {activeTrace.taskTree.children.map((child, i) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-1.5 text-[11px] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                    style={{ animation: `slideInUp 200ms ${i * 40}ms both` }}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      child.status === 'completed' ? 'bg-emerald-400' :
                      child.status === 'running' ? 'bg-blue-400' :
                      child.status === 'failed' ? 'bg-red-400' : 'bg-[hsl(var(--muted))]'
                    }`}>
                      {child.status === 'running' && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping" />
                      )}
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))] font-mono truncate flex-1">{child.id}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">{child.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pool / Agent Touches */}
          {activeTrace && (activeTrace.touchedPools.length > 0 || activeTrace.touchedAgents.length > 0) && (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" style={{ animation: 'fadeInUp 300ms 100ms both' }}>
              <div className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Touched Resources
              </div>
              {activeTrace.touchedPools.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1.5">
                    Pools ({activeTrace.touchedPools.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeTrace.touchedPools.map((p, i) => (
                      <span
                        key={p}
                        className="rounded-md bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 text-[10px] text-blue-400 hover:bg-blue-500/15 transition-colors duration-150"
                        style={{ animation: `fadeInUp 200ms ${i * 30}ms both` }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {activeTrace.touchedSections.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1.5">
                    Sections ({activeTrace.touchedSections.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeTrace.touchedSections.map((s, i) => (
                      <span
                        key={s}
                        className="rounded-md bg-red-500/10 border border-red-500/15 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/15 transition-colors duration-150"
                        style={{ animation: `fadeInUp 200ms ${i * 30}ms both` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {activeTrace.touchedAgents.length > 0 && (
                <div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1.5">
                    Agents ({activeTrace.touchedAgents.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeTrace.touchedAgents.map((a, i) => (
                      <span
                        key={a}
                        className="rounded-md bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400 font-mono hover:bg-emerald-500/15 transition-colors duration-150"
                        style={{ animation: `fadeInUp 200ms ${i * 30}ms both` }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claude Usage */}
          {activeTrace && (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4" style={{ animation: 'fadeInUp 300ms 150ms both' }}>
              <div className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5" />
                Claude Usage
              </div>
              {activeTrace.claudeUsage.used ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[hsl(var(--muted-foreground))]">API Calls</span>
                    <span className="text-[hsl(var(--foreground))] font-medium">{activeTrace.claudeUsage.calls}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Lanes</div>
                    <div className="flex flex-wrap gap-1">
                      {activeTrace.claudeUsage.lanes.map((lane, i) => (
                        <span
                          key={lane}
                          className="rounded-md bg-red-500/10 border border-red-500/15 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/15 transition-colors duration-150"
                          style={{ animation: `fadeInUp 200ms ${i * 30}ms both` }}
                        >
                          {lane}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">No Claude calls for this trace</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════ History Table ═══════════════════════ */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden relative z-10">
        <button
          onClick={() => {
            setExpandedHistory(!expandedHistory);
            if (!expandedHistory) fetchRecent();
          }}
          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[hsl(var(--muted))] transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[12px] font-semibold text-[hsl(var(--muted-foreground))]">
              Recent History
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              ({recentTraces.length} traces)
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${expandedHistory ? 'rotate-0' : '-rotate-90'}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          expandedHistory ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-[hsl(var(--border))]">
            {recentTraces.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
                No recent traces
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentTraces.map((trace, i) => (
                  <button
                    key={trace.traceId}
                    onClick={() => setSelectedTrace(
                      selectedTrace?.traceId === trace.traceId ? null : trace
                    )}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[hsl(var(--muted))] transition-all duration-200 ${
                      selectedTrace?.traceId === trace.traceId ? 'bg-[hsl(var(--muted))] border-l-2 border-l-red-500' : ''
                    }`}
                    style={{ animation: expandedHistory ? `slideInLeft 200ms ${i * 25}ms both` : 'none' }}
                  >
                    <span className={`relative h-2 w-2 rounded-full shrink-0 transition-colors duration-300 ${
                      trace.status === 'completed' ? 'bg-emerald-400' :
                      trace.status === 'running' ? 'bg-blue-400' :
                      trace.status === 'completed_with_heal' ? 'bg-amber-400' :
                      trace.status === 'failed' || trace.status === 'failed_unresolved' ? 'bg-red-400' :
                      'bg-orange-400'
                    }`}>
                      {trace.status === 'running' && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping" />
                      )}
                    </span>
                    <span className="text-[12px] text-[hsl(var(--foreground))] truncate flex-1 min-w-0">
                      {trace.originalText}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
                      {trace.source}
                    </span>
                    <span className={`text-[10px] shrink-0 transition-colors duration-300 ${STATUS_COLORS[trace.status] || 'text-[hsl(var(--muted-foreground))]'}`}>
                      {trace.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0 w-16 text-right tabular-nums">
                      {timeAgo(trace.startedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════ Failed/Healed Summary ═══════════════════════ */}
      {failedTraces.length > 0 && (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4 relative z-10" style={{ animation: 'fadeInUp 300ms both' }}>
          <div className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Failed / Healed Traces ({failedTraces.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {failedTraces.slice(0, 6).map((trace, i) => (
              <button
                key={trace.traceId}
                onClick={() => setSelectedTrace(trace)}
                className="flex items-center gap-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-3 py-2 text-left hover:bg-[hsl(var(--card))] hover:border-[hsl(var(--border))] transition-all duration-200"
                style={{ animation: `fadeInUp 200ms ${i * 50}ms both` }}
              >
                <span className={`h-2 w-2 rounded-full shrink-0 transition-colors duration-300 ${
                  trace.status === 'completed_with_heal' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate flex-1">
                  {trace.originalText}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  {trace.failureEvents.length}F / {trace.healEvents.length}H
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes stagePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  Stat Card Component                                                */
/* ================================================================== */

function StatCard({
  label,
  value,
  icon,
  color,
  pulse,
  isText,
  index,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  pulse?: boolean;
  isText?: boolean;
  index: number;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/15',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/15',
    red: 'text-red-400 bg-red-500/10 border-red-500/15',
    zinc: 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/$1 border-[hsl(var(--border))]',
  };

  const textColor: Record<string, string> = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    zinc: 'text-[hsl(var(--muted-foreground))]',
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-200 hover:scale-[1.02] ${colorMap[color] || colorMap.zinc}`}
      style={{ animation: `fadeInUp 250ms ${index * 50}ms both` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className={`transition-colors duration-300 ${textColor[color] || 'text-[hsl(var(--muted-foreground))]'}`}>{icon}</span>
      </div>
      <div className={`text-lg font-bold ${textColor[color] || 'text-[hsl(var(--foreground))]'} ${pulse ? 'animate-pulse' : ''}`}>
        {isText ? value : <AnimatedCounter value={typeof value === 'number' ? value : 0} />}
      </div>
    </div>
  );
}
