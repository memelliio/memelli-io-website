'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { API_URL } from '@/lib/config';
import {
  Radio,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Shield,
  Search,
  Wrench,
  Eye,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Send,
  Terminal,
  Wifi,
  WifiOff,
  Server,
  Clock,
  Hash,
  RotateCcw,
  Rocket
} from 'lucide-react';
import TaskDialog from './task-dialog';
import SpeedModePanel from '@/components/mua/speed-mode-panel';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type PoolStatus = 'healthy' | 'active' | 'degraded' | 'down' | 'expanding';
type PoolTier = 'critical' | 'standard' | 'support';
type AgentLayer = 'sentinel' | 'diagnostic' | 'repair' | 'validation';
type EventSeverity = 'critical' | 'warning' | 'info';

interface PoolSummary {
  domain: string;
  displayName: string;
  tier: PoolTier;
  status: PoolStatus;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  queueDepth: number;
  maxAgents: number;
  autoExpand: boolean;
  metrics: {
    totalEvents: number;
    eventsHandled: number;
    eventsFailed: number;
    avgHandleTimeMs: number;
    lastEventAt: string | null;
    totalDispatches: number;
    totalReturns: number;
    expansionsTriggered: number;
  };
}

interface AggregatedMetrics {
  totalPools: number;
  totalAgents: number;
  activeAgents: number;
  dispatchedAgents: number;
  idleAgents: number;
  errorAgents: number;
  maxCapacity: number;
  utilizationPct: number;
  totalEvents: number;
  eventsHandled: number;
  eventsFailed: number;
  totalDispatches: number;
  totalReturns: number;
  expansionsTriggered: number;
  unhandledEvents: number;
  tierBreakdown: {
    critical: PoolSummary[];
    standard: PoolSummary[];
    support: PoolSummary[];
  };
  poolBreakdown: PoolSummary[];
}

interface PoolEvent {
  id: string;
  type: string;
  severity: EventSeverity;
  source: string;
  message: string;
  timestamp: string;
  handled: boolean;
  resolution: string | null;
  assignedAgentId: string | null;
}

interface ExecutionStatus {
  running: boolean;
  cyclesCompleted: number;
  eventsProcessed: number;
  repairsAttempted: number;
  repairsSucceeded: number;
  lastCycleAt: string | null;
  uptimeSeconds: number;
}

interface PoolDetail {
  domain: string;
  displayName: string;
  tier: PoolTier;
  status: PoolStatus;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  queueDepth: number;
  maxAgents: number;
  autoExpand: boolean;
  metrics: PoolSummary['metrics'];
  layerBreakdown: Record<string, { total: number; idle: number; active: number; dispatched: number; error: number }>;
  recentEvents: PoolEvent[];
  config: Record<string, number | boolean>;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const STATUS_COLORS: Record<PoolStatus, { bg: string; text: string; border: string; dot: string }> = {
  healthy:   { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  active:    { bg: 'bg-primary/80/[0.08]', text: 'text-primary', border: 'border-primary/20', dot: 'bg-primary/70' },
  degraded:  { bg: 'bg-amber-500/[0.08]',  text: 'text-amber-400',  border: 'border-amber-500/20',  dot: 'bg-amber-400'  },
  down:      { bg: 'bg-primary/80/[0.08]',     text: 'text-primary',     border: 'border-primary/20',     dot: 'bg-primary/70'     },
  expanding: { bg: 'bg-primary/80/[0.08]',  text: 'text-primary',  border: 'border-primary/20',  dot: 'bg-primary/70'  }
};

const TIER_LABELS: Record<PoolTier, { label: string; color: string }> = {
  critical: { label: 'CRITICAL', color: 'text-primary bg-primary/80/[0.08] border-primary/20' },
  standard: { label: 'STANDARD', color: 'text-primary bg-primary/80/[0.08] border-primary/20' },
  support:  { label: 'SUPPORT',  color: 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border-[hsl(var(--border))]' }
};

function severityBadge(severity: EventSeverity): string {
  const map = {
    critical: 'bg-primary/80/[0.08] text-primary border-primary/20',
    warning:  'bg-amber-500/[0.08] text-amber-400 border-amber-500/20',
    info:     'bg-primary/80/[0.08] text-primary border-primary/20'
  };
  return map[severity];
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 5) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return iso;
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ================================================================== */
/*  Environment Detection                                             */
/* ================================================================== */

function getEnvironmentInfo() {
  const apiUrl = API_URL;
  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isDev = isLocal || apiUrl.includes('staging') || apiUrl.includes('dev');
  return {
    apiUrl,
    mode: isDev ? 'DEVELOPMENT' : 'PRODUCTION',
    modeColor: isDev ? 'text-amber-400' : 'text-emerald-400',
    modeBg: isDev ? 'bg-amber-500/[0.08] border-amber-500/20' : 'bg-emerald-500/[0.08] border-emerald-500/20',
    modeDot: isDev ? 'bg-amber-400' : 'bg-emerald-400'
  };
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function CommandCenterPage() {
  const api = useApi();
  const env = getEnvironmentInfo();

  // -- Data state --
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<(PoolEvent & { pool?: string })[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // -- UI state --
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [poolDetail, setPoolDetail] = useState<PoolDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'pools' | 'events' | 'actions'>('pools');

  // -- Quick Actions state --
  const [dispatchDomain, setDispatchDomain] = useState('');
  const [dispatchTask, setDispatchTask] = useState('');
  const [dispatchLayer, setDispatchLayer] = useState<AgentLayer>('repair');
  const [dispatchMode, setDispatchMode] = useState<'smart' | 'manual'>('smart');
  const [dispatchPriority, setDispatchPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  const [eventDomain, setEventDomain] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventSeverity, setEventSeverity] = useState<EventSeverity>('info');
  const [eventMessage, setEventMessage] = useState('');
  const [pushingEvent, setPushingEvent] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const [healthChecking, setHealthChecking] = useState(false);

  const eventFeedRef = useRef<HTMLDivElement>(null);

  /* -- Fetch All Data -- */
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        // Fetch from three sources in parallel:
        // 1. /api/admin/agent-pools — pool metrics + tier breakdown
        // 2. /api/admin/command-center/live-feed — recent events across all pools
        // 3. /api/admin/command-center — system status (execution engine + health engine)
        const [metricsRes, feedRes, statusRes] = await Promise.all([
          api.get<AggregatedMetrics>('/api/admin/agent-pools'),
          api.get<{ events: (PoolEvent & { pool?: string; domain?: string })[] }>('/api/admin/command-center/live-feed'),
          api.get<{ agentPools: AggregatedMetrics; executionEngine: ExecutionStatus; healthEngine: unknown; environment: unknown }>('/api/admin/command-center'),
        ]);
        if (metricsRes.data) {
          setMetrics(metricsRes.data);
          setApiConnected(true);
        } else if (metricsRes.error) {
          setApiConnected(false);
        }
        // Live feed events include domain field instead of pool
        if (feedRes.data?.events) {
          setRecentEvents(feedRes.data.events.map(e => ({ ...e, pool: e.pool || e.domain })));
        }
        if (statusRes.data?.executionEngine) {
          setExecutionStatus(statusRes.data.executionEngine);
        }
      } catch {
        setApiConnected(false);
      }
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* -- Fetch pool detail -- */
  const fetchPoolDetail = useCallback(
    async (domain: string) => {
      setLoadingDetail(true);
      try {
        const res = await api.get<{ pool: PoolDetail }>(`/api/admin/agent-pools/${domain}`);
        if (res.data?.pool) setPoolDetail(res.data.pool);
      } catch { /* silent */ }
      setLoadingDetail(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* -- Auto-refresh every 5 seconds -- */
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* -- Pool expand/collapse -- */
  const togglePool = (domain: string) => {
    if (expandedPool === domain) {
      setExpandedPool(null);
      setPoolDetail(null);
    } else {
      setExpandedPool(domain);
      fetchPoolDetail(domain);
    }
  };

  /* -- Quick Actions -- */
  const handleDispatch = async () => {
    if (!dispatchTask) return;
    setDispatching(true);
    setDispatchResult(null);

    if (dispatchMode === 'smart') {
      // Smart dispatch — auto-classifies domain + layer from natural language
      const res = await api.post<{ dispatch: { domain: string; layer: string }; agent: { id: string } | null; message: string }>(
        '/api/admin/command-center/dispatch',
        { task: dispatchTask, priority: dispatchPriority }
      );
      if (res.error) {
        setDispatchResult(`Error: ${res.error}`);
      } else {
        const d = res.data;
        setDispatchResult(
          d?.agent
            ? `Dispatched to ${d.dispatch.layer} agent in ${d.dispatch.domain} pool`
            : `Event queued in ${d?.dispatch.domain} pool (no idle ${d?.dispatch.layer} agent)`
        );
        setDispatchTask('');
      }
    } else {
      // Manual dispatch — requires pool + layer selection
      if (!dispatchDomain) {
        setDispatchResult('Error: Select a target pool for manual dispatch');
        setDispatching(false);
        return;
      }
      const res = await api.post(`/api/admin/agent-pools/${dispatchDomain}/dispatch`, {
        task: dispatchTask,
        layer: dispatchLayer,
      });
      if (res.error) {
        setDispatchResult(`Error: ${res.error}`);
      } else {
        setDispatchResult('Agent dispatched successfully');
        setDispatchTask('');
      }
    }

    setDispatching(false);
    fetchData(true);
  };

  const handlePushEvent = async () => {
    if (!eventDomain || !eventType) return;
    setPushingEvent(true);
    setPushResult(null);
    const res = await api.post(`/api/admin/agent-pools/${eventDomain}/events`, {
      type: eventType,
      severity: eventSeverity,
      message: eventMessage || eventType,
      source: 'command-center'
    });
    if (res.error) {
      setPushResult(`Error: ${res.error}`);
    } else {
      setPushResult('Event pushed successfully');
      setEventType('');
      setEventMessage('');
    }
    setPushingEvent(false);
    fetchData(true);
  };

  const handleHealthCheck = async () => {
    setHealthChecking(true);
    // Trigger a real health check cycle through the command center
    await api.post('/api/admin/command-center/health-check', {});
    await fetchData(true);
    setHealthChecking(false);
  };

  /* -- Pool domains for action dropdowns -- */
  const allDomains = metrics?.poolBreakdown?.map(p => p.domain) ?? [];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1800px] px-6 py-8">

        {/* ====== HEADER ====== */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <Radio className="h-8 w-8 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
                <span className="relative inline-flex h-5 w-5 rounded-full bg-primary/80" />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
                Command Center
              </h1>
              <p className="mt-2 text-[hsl(var(--muted-foreground))] leading-relaxed">
                Mission control for the Memelli agent workforce
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Environment Badge */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${env.modeBg}`}>
              <span className={`h-2 w-2 rounded-full ${env.modeDot} ${env.mode === 'PRODUCTION' ? '' : 'animate-pulse'}`} />
              <span className={env.modeColor}>{env.mode}</span>
            </div>

            {/* Connection Status */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
              apiConnected === null ? 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]' :
              apiConnected ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.08]' :
              'border-primary/20 text-primary bg-primary/80/[0.08]'
            }`}>
              {apiConnected === null ? (
                <LoadingGlobe size="sm" />
              ) : apiConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span>{apiConnected === null ? 'Connecting...' : apiConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))]">
              <Clock className="h-4 w-4" />
              <span>5s refresh</span>
              <span className="text-[hsl(var(--muted-foreground))]">{lastRefresh.toLocaleTimeString()}</span>
            </div>

            {/* Manual refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ====== API URL BAR ====== */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-6 py-4 text-xs">
          <Server className="h-5 w-5 text-[hsl(var(--muted-foreground))] shrink-0" />
          <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">API Target:</span>
          <code className="font-mono text-[hsl(var(--foreground))] truncate">{env.apiUrl}</code>
          <span className="text-white/[0.04] mx-2">|</span>
          <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Frontend:</span>
          <code className="font-mono text-[hsl(var(--foreground))] truncate">{typeof window !== 'undefined' ? window.location.origin : 'SSR'}</code>
        </div>

        {/* ====== AGENT INTELLIGENCE — COMMAND BAR ====== */}
        <div className="mb-8">
          <TaskDialog />
        </div>

        {/* ====== SPEED MODE ====== */}
        <div className="mb-8 max-w-md">
          <SpeedModePanel />
        </div>

        {/* ====== LOADING ====== */}
        {loading && !metrics && (
          <div className="flex flex-col items-center justify-center py-32 text-[hsl(var(--muted-foreground))]">
            <div className="relative">
              <LoadingGlobe size="xl" />
              <Radio className="absolute inset-0 m-auto h-4 w-4 text-primary animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">Connecting to agent workforce...</p>
          </div>
        )}

        {/* ====== ERROR STATE ====== */}
        {!loading && !metrics && apiConnected === false && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <WifiOff className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Unable to load</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md text-center">
              Could not connect to the agent workforce API. The system will automatically retry.
            </p>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="mt-4 flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Retry now
            </button>
          </div>
        )}

        {metrics && (
          <>
            {/* ====== GLOBAL STATS GRID ====== */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              <StatCard label="Total Pools" value={metrics.totalPools} icon={<Layers className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />} />
              <StatCard label="Total Agents" value={formatNumber(metrics.totalAgents)} highlight icon={<Cpu className="h-4 w-4 text-primary" />} />
              <StatCard label="Idle" value={formatNumber(metrics.idleAgents)} color="text-emerald-400" icon={<Shield className="h-4 w-4 text-emerald-400" />} />
              <StatCard label="Active" value={metrics.activeAgents} color="text-primary" pulse={metrics.activeAgents > 0} icon={<Activity className="h-4 w-4 text-primary" />} />
              <StatCard label="Dispatched" value={metrics.dispatchedAgents} color="text-primary" icon={<ArrowUpRight className="h-4 w-4 text-primary" />} />
              <StatCard label="Errors" value={metrics.errorAgents} color={metrics.errorAgents > 0 ? 'text-primary' : 'text-[hsl(var(--muted-foreground))]'} icon={<XCircle className="h-4 w-4 text-primary" />} />
              <StatCard label="Utilization" value={`${metrics.utilizationPct}%`} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
              <StatCard label="Capacity" value={formatNumber(metrics.maxCapacity)} color="text-[hsl(var(--muted-foreground))]" icon={<Hash className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />} />
            </div>

            {/* ====== EXECUTION ENGINE + DISPATCH STATS ROW ====== */}
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Execution Engine Status */}
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Execution Engine
                  </h2>
                  {executionStatus && (
                    <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${
                      executionStatus.running
                        ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20'
                        : 'bg-primary/80/[0.08] text-primary border border-primary/20'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${executionStatus.running ? 'bg-emerald-400 animate-pulse' : 'bg-primary/70'}`} />
                      {executionStatus.running ? 'RUNNING' : 'STOPPED'}
                    </span>
                  )}
                </div>
                {executionStatus ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <MiniStat label="Cycles Run" value={executionStatus.cyclesCompleted} color="text-primary" />
                    <MiniStat label="Events Processed" value={executionStatus.eventsProcessed} color="text-emerald-400" />
                    <MiniStat label="Repairs Attempted" value={executionStatus.repairsAttempted} color="text-amber-400" />
                    <MiniStat label="Repairs Succeeded" value={executionStatus.repairsSucceeded} color="text-emerald-400" />
                    <MiniStat label="Uptime" value={formatUptime(executionStatus.uptimeSeconds)} isText />
                    <MiniStat label="Last Cycle" value={executionStatus.lastCycleAt ? relativeTime(executionStatus.lastCycleAt) : 'Never'} isText />
                  </div>
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">Execution engine status not available</p>
                )}
              </div>

              {/* Dispatch Metrics */}
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-6">
                  <Activity className="h-4 w-4 text-primary" />
                  Dispatch Metrics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MetricTile icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Total Events" value={metrics.totalEvents} />
                  <MetricTile icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} label="Handled" value={metrics.eventsHandled} />
                  <MetricTile icon={<XCircle className="h-4 w-4 text-primary" />} label="Failed" value={metrics.eventsFailed} />
                  <MetricTile icon={<ArrowUpRight className="h-4 w-4 text-primary" />} label="Dispatches" value={metrics.totalDispatches} />
                  <MetricTile icon={<ArrowDownLeft className="h-4 w-4 text-primary" />} label="Returns" value={metrics.totalReturns} />
                  <MetricTile icon={<Zap className="h-4 w-4 text-primary" />} label="Expansions" value={metrics.expansionsTriggered} />
                </div>
              </div>
            </div>

            {/* ====== TAB BAR ====== */}
            <div className="mb-8 flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 w-fit">
              {([
                { key: 'pools' as const, label: 'Agent Pools', icon: Layers },
                { key: 'events' as const, label: 'Live Event Feed', icon: Activity },
                { key: 'actions' as const, label: 'Quick Actions', icon: Terminal },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-primary/80/[0.08] text-primary/80'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ====== POOLS TAB ====== */}
            {activeTab === 'pools' && (
              <div className="space-y-8">
                {(['critical', 'standard', 'support'] as PoolTier[]).map(tier => {
                  const pools = metrics.tierBreakdown?.[tier] ?? [];
                  if (pools.length === 0) return null;
                  const tl = TIER_LABELS[tier];
                  return (
                    <section key={tier}>
                      <div className="mb-6 flex items-center gap-4">
                        <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium ${tl.color}`}>
                          {tl.label}
                        </span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {pools.length} pools &middot; {pools.reduce((s, p) => s + p.totalAgents, 0)} agents
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {pools.map(pool => {
                          const isExpanded = expandedPool === pool.domain;
                          const sc = STATUS_COLORS[pool.status] || STATUS_COLORS.healthy;
                          const utilPct = pool.totalAgents > 0 ? Math.round((pool.activeAgents / pool.totalAgents) * 100) : 0;

                          return (
                            <div
                              key={pool.domain}
                              className={`rounded-2xl border bg-[hsl(var(--card))] transition-all duration-200 ${
                                isExpanded ? 'border-primary/20 md:col-span-2 xl:col-span-3' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
                              }`}
                            >
                              <button
                                onClick={() => togglePool(pool.domain)}
                                className="flex w-full items-center justify-between p-6 text-left"
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${sc.bg}`}>
                                    <Layers className={`h-4 w-4 ${sc.text}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{pool.displayName}</span>
                                      <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[11px] uppercase tracking-wider font-medium ${sc.bg} ${sc.text} ${sc.border}`}>
                                        <span className={`h-2 w-2 rounded-full ${sc.dot} ${pool.status === 'active' ? 'animate-pulse' : ''}`} />
                                        {pool.status}
                                      </span>
                                      {pool.autoExpand && (
                                        <span className="text-[10px] text-primary bg-primary/80/[0.08] border border-primary/20 rounded-lg px-2 py-0.5">AUTO</span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                                      {pool.totalAgents}/{pool.maxAgents} agents &middot; {utilPct}% util &middot; Q:{pool.queueDepth}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="hidden sm:flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                                    <span><span className="text-emerald-400 font-medium">{pool.idleAgents}</span> idle</span>
                                    <span><span className="text-primary font-medium">{pool.activeAgents}</span> active</span>
                                  </div>
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                                </div>
                              </button>

                              {/* Expanded Detail */}
                              {isExpanded && (
                                <div className="border-t border-[hsl(var(--border))] p-6 space-y-6">
                                  {loadingDetail && !poolDetail ? (
                                    <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">
                                      <LoadingGlobe size="sm" /> Loading pool detail...
                                    </div>
                                  ) : poolDetail ? (
                                    <>
                                      {/* Layer breakdown */}
                                      <div>
                                        <h3 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                                          <Zap className="h-4 w-4 text-primary" />
                                          Layer Breakdown
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          {(['sentinel', 'diagnostic', 'repair', 'validation'] as AgentLayer[]).map(layer => {
                                            const LAYER_COLORS_MAP: Record<AgentLayer, { bg: string; text: string; border: string }> = {
                                              sentinel:   { bg: 'bg-primary/80/[0.08]',    text: 'text-primary',    border: 'border-primary/20'    },
                                              diagnostic: { bg: 'bg-primary/80/[0.08]',  text: 'text-primary',  border: 'border-primary/20'  },
                                              repair:     { bg: 'bg-amber-500/[0.08]',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
                                              validation: { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', border: 'border-emerald-500/20' }
                                            };
                                            const LAYER_ICONS_MAP: Record<AgentLayer, typeof Eye> = {
                                              sentinel: Eye, diagnostic: Search, repair: Wrench, validation: Shield
                                            };
                                            const lc = LAYER_COLORS_MAP[layer];
                                            const LayerIcon = LAYER_ICONS_MAP[layer];
                                            const lb = poolDetail.layerBreakdown[layer] || { total: 0, idle: 0, active: 0, dispatched: 0, error: 0 };
                                            return (
                                              <div key={layer} className={`rounded-2xl border ${lc.border} bg-[hsl(var(--background))] p-4`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                  <LayerIcon className={`h-4 w-4 ${lc.text}`} />
                                                  <span className={`text-[11px] font-medium uppercase tracking-wider ${lc.text}`}>{layer}</span>
                                                </div>
                                                <div className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">{lb.total}</div>
                                                <div className="space-y-1 text-xs">
                                                  <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Idle</span><span className="text-emerald-400">{lb.idle}</span></div>
                                                  <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Active</span><span className="text-primary">{lb.active}</span></div>
                                                  <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Dispatched</span><span className="text-primary">{lb.dispatched}</span></div>
                                                  {lb.error > 0 && <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Error</span><span className="text-primary">{lb.error}</span></div>}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Pool Metrics */}
                                      <div>
                                        <h3 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-primary" />
                                          Pool Metrics
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <MiniStat label="Total Events" value={poolDetail.metrics.totalEvents} />
                                          <MiniStat label="Handled" value={poolDetail.metrics.eventsHandled} color="text-emerald-400" />
                                          <MiniStat label="Failed" value={poolDetail.metrics.eventsFailed} color="text-primary" />
                                          <MiniStat label="Dispatches" value={poolDetail.metrics.totalDispatches} color="text-primary" />
                                          <MiniStat label="Returns" value={poolDetail.metrics.totalReturns} color="text-primary" />
                                          <MiniStat label="Expansions" value={poolDetail.metrics.expansionsTriggered} color="text-primary" />
                                          <MiniStat label="Avg Handle (ms)" value={`${poolDetail.metrics.avgHandleTimeMs}ms`} isText />
                                          <MiniStat label="Last Event" value={poolDetail.metrics.lastEventAt ? relativeTime(poolDetail.metrics.lastEventAt) : 'Never'} isText />
                                        </div>
                                      </div>

                                      {/* Recent Events */}
                                      {poolDetail.recentEvents && poolDetail.recentEvents.length > 0 && (
                                        <div>
                                          <h3 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                                            Recent Events ({poolDetail.recentEvents.length})
                                          </h3>
                                          <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                            {poolDetail.recentEvents.map(evt => (
                                              <div key={evt.id} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-xs">
                                                <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${severityBadge(evt.severity)}`}>
                                                  {evt.severity}
                                                </span>
                                                <span className="text-[hsl(var(--foreground))] font-medium truncate">{evt.type}</span>
                                                <span className="text-[hsl(var(--muted-foreground))] truncate">{evt.message}</span>
                                                {evt.handled && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
                                                <span className="text-[hsl(var(--muted-foreground))] ml-auto shrink-0">{relativeTime(evt.timestamp)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* ====== EVENTS TAB ====== */}
            {activeTab === 'events' && (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
                  <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                    Live Event Feed
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-normal uppercase tracking-wider">auto-refreshing every 5s</span>
                  </h2>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{recentEvents.length} events</span>
                </div>
                <div ref={eventFeedRef} className="max-h-[600px] overflow-y-auto divide-y divide-white/[0.04]">
                  {recentEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                      <Activity className="h-8 w-8 mb-3 opacity-30" />
                      <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">No recent events</p>
                    </div>
                  ) : (
                    recentEvents.map((evt, i) => (
                      <div key={evt.id ?? i} className="flex items-center gap-4 px-6 py-4 text-xs hover:bg-[hsl(var(--muted))] transition-all duration-200">
                        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider shrink-0 ${severityBadge(evt.severity)}`}>
                          {evt.severity}
                        </span>
                        {evt.pool && (
                          <span className="text-[hsl(var(--muted-foreground))] font-mono text-[10px] shrink-0 bg-[hsl(var(--muted))] rounded-lg px-2 py-1">
                            {evt.pool}
                          </span>
                        )}
                        <span className="text-[hsl(var(--foreground))] font-medium truncate">{evt.type}</span>
                        <span className="text-[hsl(var(--muted-foreground))] truncate hidden md:inline leading-relaxed">{evt.message}</span>
                        {evt.assignedAgentId && (
                          <span className="text-primary font-mono text-[10px] shrink-0">
                            agent:{evt.assignedAgentId.slice(0, 8)}
                          </span>
                        )}
                        {evt.handled ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 ml-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 ml-auto" />
                        )}
                        <span className="text-[hsl(var(--muted-foreground))] shrink-0">{relativeTime(evt.timestamp)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ====== ACTIONS TAB ====== */}
            {activeTab === 'actions' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Dispatch Agent */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-6">
                    <Rocket className="h-4 w-4 text-primary" />
                    Dispatch Agent
                  </h3>
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1 w-fit">
                      <button
                        type="button"
                        onClick={() => setDispatchMode('smart')}
                        className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          dispatchMode === 'smart' ? 'bg-primary/80/[0.08] text-primary/80' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                        }`}
                      >
                        Smart (Auto-Classify)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDispatchMode('manual')}
                        className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          dispatchMode === 'manual' ? 'bg-primary/80/[0.08] text-primary/80' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                        }`}
                      >
                        Manual (Pick Pool)
                      </button>
                    </div>

                    {dispatchMode === 'smart' && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Priority</label>
                        <select
                          value={dispatchPriority}
                          onChange={e => setDispatchPriority(e.target.value as 'low' | 'normal' | 'high' | 'critical')}
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    )}

                    {dispatchMode === 'manual' && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Target Pool</label>
                          <select
                            value={dispatchDomain}
                            onChange={e => setDispatchDomain(e.target.value)}
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          >
                            <option value="">Select a pool...</option>
                            {allDomains.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Agent Layer</label>
                          <select
                            value={dispatchLayer}
                            onChange={e => setDispatchLayer(e.target.value as AgentLayer)}
                            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          >
                            <option value="sentinel">Sentinel (Monitor/Watch)</option>
                            <option value="diagnostic">Diagnostic (Investigate)</option>
                            <option value="repair">Repair (Fix/Build)</option>
                            <option value="validation">Validation (Verify/Test)</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Task Description</label>
                      <textarea
                        value={dispatchTask}
                        onChange={e => setDispatchTask(e.target.value)}
                        placeholder={dispatchMode === 'smart' ? 'Describe the task — domain and layer will be auto-detected...' : 'Describe the task for the agent...'}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleDispatch}
                      disabled={dispatching || !dispatchTask || (dispatchMode === 'manual' && !dispatchDomain)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-primary/80 transition-all duration-200 disabled:opacity-50"
                    >
                      {dispatching ? <LoadingGlobe size="sm" /> : <Send className="h-4 w-4" />}
                      {dispatchMode === 'smart' ? 'Smart Dispatch' : 'Dispatch'}
                    </button>
                    {dispatchResult && (
                      <p className={`text-xs leading-relaxed ${dispatchResult.startsWith('Error') ? 'text-primary' : 'text-emerald-400'}`}>
                        {dispatchResult}
                      </p>
                    )}
                  </div>
                </div>

                {/* Push Event */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-6">
                    <Zap className="h-4 w-4 text-primary" />
                    Push Event
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Target Pool</label>
                      <select
                        value={eventDomain}
                        onChange={e => setEventDomain(e.target.value)}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      >
                        <option value="">Select a pool...</option>
                        {allDomains.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Event Type</label>
                        <input
                          value={eventType}
                          onChange={e => setEventType(e.target.value)}
                          placeholder="e.g. health_check"
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Severity</label>
                        <select
                          value={eventSeverity}
                          onChange={e => setEventSeverity(e.target.value as EventSeverity)}
                          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2">Message</label>
                      <input
                        value={eventMessage}
                        onChange={e => setEventMessage(e.target.value)}
                        placeholder="Optional message..."
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      />
                    </div>
                    <button
                      onClick={handlePushEvent}
                      disabled={pushingEvent || !eventDomain || !eventType}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-primary/80 transition-all duration-200 disabled:opacity-50"
                    >
                      {pushingEvent ? <LoadingGlobe size="sm" /> : <Zap className="h-4 w-4" />}
                      Push Event
                    </button>
                    {pushResult && (
                      <p className={`text-xs leading-relaxed ${pushResult.startsWith('Error') ? 'text-primary' : 'text-emerald-400'}`}>
                        {pushResult}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Utility Actions */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-6">
                    <Terminal className="h-4 w-4 text-primary" />
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleHealthCheck}
                      disabled={healthChecking}
                      className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-3 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 disabled:opacity-50"
                    >
                      {healthChecking ? <LoadingGlobe size="sm" /> : <Activity className="h-4 w-4 text-emerald-400" />}
                      Trigger Health Check
                    </button>
                    <button
                      onClick={() => { setDispatchDomain('deployment'); setDispatchTask('Force deploy latest build'); }}
                      className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-3 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                    >
                      <Rocket className="h-4 w-4 text-amber-400" />
                      Force Deploy
                    </button>
                    <button
                      onClick={() => fetchData(true)}
                      className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-3 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4 text-primary" />
                      Refresh All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function StatCard({
  label, value, color, highlight, pulse, icon
}: {
  label: string; value: string | number; color?: string; highlight?: boolean; pulse?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border bg-[hsl(var(--card))] p-5 ${highlight ? 'border-primary/20' : 'border-[hsl(var(--border))]'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-xl font-semibold ${color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
        {pulse && (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary/80" />
          </span>
        )}
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
      {icon}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{formatNumber(value)}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, isText }: { label: string; value: string | number; color?: string; isText?: boolean }) {
  return (
    <div className="rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
      <p className={`text-sm font-medium ${isText ? 'text-[hsl(var(--muted-foreground))]' : color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
    </div>
  );
}