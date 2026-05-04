'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Layers,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  X,
  Activity,
  Shield,
  Search,
  Wrench,
  Eye,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Cpu
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types (matching API response)                                      */
/* ------------------------------------------------------------------ */

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

interface UnhandledEntry {
  domain: string;
  event: PoolEvent;
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LAYERS: AgentLayer[] = ['sentinel', 'diagnostic', 'repair', 'validation'];

const STATUS_COLORS: Record<PoolStatus, { bg: string; text: string; border: string; dot: string }> = {
  healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  active: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  degraded: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  down: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary/70' },
  expanding: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary/70' }
};

const TIER_COLORS: Record<PoolTier, string> = {
  critical: 'text-primary bg-primary/10 border-primary/30',
  standard: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  support: 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/$1 border-[hsl(var(--border))]'
};

const LAYER_COLORS: Record<AgentLayer, { bg: string; text: string; border: string }> = {
  sentinel: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  diagnostic: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  repair: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  validation: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
};

const LAYER_ICONS: Record<AgentLayer, React.ComponentType<any>> = {
  sentinel: Eye,
  diagnostic: Search,
  repair: Wrench,
  validation: Shield
};

function severityBadge(severity: EventSeverity): string {
  const map = {
    critical: 'bg-primary/20 text-primary border-primary/30',
    warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgentPoolsPage() {
  const api = useApi();

  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [unhandledEvents, setUnhandledEvents] = useState<UnhandledEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [poolDetail, setPoolDetail] = useState<PoolDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resolveModal, setResolveModal] = useState<{ eventId: string; domain: string } | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [scaling, setScaling] = useState<Record<string, boolean>>({});

  /* Fetch overview data */
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const [metricsRes, unhandledRes] = await Promise.all([
          api.get<AggregatedMetrics>('/api/admin/agent-pools'),
          api.get<{ events: UnhandledEntry[]; total: number }>('/api/admin/agent-pools/events/unhandled'),
        ]);
        if (metricsRes.data) {
          setMetrics(metricsRes.data);
          setFetchError(false);
        } else {
          setMetrics((prev) => {
            if (!prev) setFetchError(true);
            return prev;
          });
        }
        if (unhandledRes.data?.events) setUnhandledEvents(unhandledRes.data.events);
      } catch {
        setMetrics((prev) => {
          if (!prev) setFetchError(true);
          return prev;
        });
      }
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* Fetch pool detail when expanded */
  const fetchPoolDetail = useCallback(
    async (domain: string) => {
      setLoadingDetail(true);
      try {
        const res = await api.get<{ pool: PoolDetail }>(`/api/admin/agent-pools/${domain}`);
        if (res.data?.pool) setPoolDetail(res.data.pool);
      } catch {
        // silent
      }
      setLoadingDetail(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* Expand/collapse a pool */
  const togglePool = (domain: string) => {
    if (expandedPool === domain) {
      setExpandedPool(null);
      setPoolDetail(null);
    } else {
      setExpandedPool(domain);
      fetchPoolDetail(domain);
    }
  };

  /* Scale handler */
  const handleScale = async (domain: string, layer: AgentLayer, currentCount: number, delta: number) => {
    const key = `${domain}-${layer}`;
    setScaling((prev) => ({ ...prev, [key]: true }));
    await api.post(`/api/admin/agent-pools/${domain}/scale`, { layer, count: Math.max(0, currentCount + delta) });
    await fetchData(true);
    if (expandedPool === domain) await fetchPoolDetail(domain);
    setScaling((prev) => ({ ...prev, [key]: false }));
  };

  /* Resolve handler */
  const handleResolve = async () => {
    if (!resolveModal) return;
    await api.post(`/api/admin/agent-pools/${resolveModal.domain}/events/${resolveModal.eventId}/resolve`, {
      resolution: resolutionText
    });
    setResolveModal(null);
    setResolutionText('');
    await fetchData(true);
  };

  /* Pool lists by tier */
  const poolsByTier = useMemo(() => {
    if (!metrics) return { critical: [], standard: [], support: [] };
    return metrics.tierBreakdown;
  }, [metrics]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Universal Agent Workforce</h1>
              <p className="mt-1 text-[hsl(var(--muted-foreground))] leading-relaxed">
                {metrics ? `${metrics.totalPools} pools` : '...'} &middot; {metrics ? formatNumber(metrics.totalAgents) : '...'} agents &middot; {metrics ? formatNumber(metrics.maxCapacity) : '...'} max capacity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
              Auto-refresh 10s &middot; {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex h-9 items-center gap-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && !metrics && (
          <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
            <LoadingGlobe size="lg" />
            <p className="mt-3 text-[hsl(var(--muted-foreground))] leading-relaxed">Loading universal workforce...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && !metrics && fetchError && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <AlertCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Unable to load</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md text-center">
              Could not load agent pool data. The system will automatically retry every 10 seconds.
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
            {/* Global Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              <StatCard label="Total Pools" value={metrics.totalPools} />
              <StatCard label="Total Agents" value={formatNumber(metrics.totalAgents)} highlight />
              <StatCard label="Idle (Reserve)" value={formatNumber(metrics.idleAgents)} color="text-emerald-400" />
              <StatCard label="Active" value={metrics.activeAgents} color="text-blue-400" pulse={metrics.activeAgents > 0} />
              <StatCard label="Dispatched" value={metrics.dispatchedAgents} color="text-primary" />
              <StatCard label="Errors" value={metrics.errorAgents} color={metrics.errorAgents > 0 ? 'text-primary' : 'text-[hsl(var(--muted-foreground))]'} />
              <StatCard label="Utilization" value={`${metrics.utilizationPct}%`} />
              <StatCard label="Max Capacity" value={formatNumber(metrics.maxCapacity)} color="text-[hsl(var(--muted-foreground))]" />
            </div>

            {/* Dispatch Metrics Row */}
            <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-5">
              <MetricCard icon={<TrendingUp className="h-4 w-4 text-blue-400" />} label="Total Events" value={metrics.totalEvents} />
              <MetricCard icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} label="Events Handled" value={metrics.eventsHandled} />
              <MetricCard icon={<ArrowUpRight className="h-4 w-4 text-primary" />} label="Total Dispatches" value={metrics.totalDispatches} />
              <MetricCard icon={<ArrowDownLeft className="h-4 w-4 text-cyan-400" />} label="Total Returns" value={metrics.totalReturns} />
              <MetricCard icon={<Zap className="h-4 w-4 text-amber-400" />} label="Auto-Expansions" value={metrics.expansionsTriggered} />
            </div>

            {/* Pool Tiers */}
            {(['critical', 'standard', 'support'] as PoolTier[]).map((tier) => {
              const pools = poolsByTier[tier];
              if (!pools || pools.length === 0) return null;
              return (
                <section key={tier} className="mb-8">
                  <h2 className="mb-6 text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${TIER_COLORS[tier]}`}>
                      {tier}
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))] text-base font-normal leading-relaxed">
                      {pools.reduce((s, p) => s + p.totalAgents, 0)} agents across {pools.length} pools
                    </span>
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {pools.map((pool) => {
                      const isExpanded = expandedPool === pool.domain;
                      const sc = STATUS_COLORS[pool.status] || STATUS_COLORS.healthy;
                      const utilPct = pool.totalAgents > 0 ? Math.round((pool.activeAgents / pool.totalAgents) * 100) : 0;

                      return (
                        <div
                          key={pool.domain}
                          className={`bg-[hsl(var(--card))] border rounded-2xl transition-all duration-200 ${
                            isExpanded
                              ? 'border-primary/50 md:col-span-2 xl:col-span-3'
                              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
                          }`}
                        >
                          {/* Card Header */}
                          <button
                            onClick={() => togglePool(pool.domain)}
                            className="flex w-full items-center justify-between p-6 text-left"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${sc.bg} border ${sc.border}`}>
                                <Layers className={`h-6 w-6 ${sc.text}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-semibold text-[hsl(var(--foreground))] truncate">
                                    {pool.displayName}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${sc.bg} ${sc.text} ${sc.border}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${pool.status === 'active' ? 'animate-pulse' : ''}`} />
                                    {pool.status}
                                  </span>
                                  {pool.autoExpand && (
                                    <span className="text-[10px] text-primary bg-primary/80/[0.08] border border-primary/20 rounded-xl px-2 py-0.5 font-medium uppercase tracking-wider">AUTO-EXPAND</span>
                                  )}
                                </div>
                                <p className="mt-1 text-[hsl(var(--muted-foreground))] leading-relaxed">
                                  {pool.totalAgents}/{pool.maxAgents} agents &middot; {utilPct}% utilized
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <div className="hidden sm:flex items-center gap-6 text-[hsl(var(--muted-foreground))] leading-relaxed">
                                <span>
                                  <span className="text-[hsl(var(--foreground))] font-medium">{pool.activeAgents}</span> active
                                </span>
                                <span>
                                  <span className="text-[hsl(var(--foreground))] font-medium">{pool.idleAgents}</span> idle
                                </span>
                                <span>
                                  Q: <span className="text-[hsl(var(--foreground))] font-medium">{pool.queueDepth}</span>
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <div className="border-t border-[hsl(var(--border))] p-6 space-y-8">
                              {loadingDetail && !poolDetail ? (
                                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))] leading-relaxed">
                                  <LoadingGlobe size="sm" /> Loading pool detail...
                                </div>
                              ) : poolDetail ? (
                                <>
                                  {/* Layer Breakdown */}
                                  <div>
                                    <h3 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-primary" />
                                      Layer Breakdown ({poolDetail.totalAgents} agents)
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {LAYERS.map((layer) => {
                                        const lc = LAYER_COLORS[layer];
                                        const LayerIcon = LAYER_ICONS[layer];
                                        const lb = poolDetail.layerBreakdown[layer] || { total: 0, idle: 0, active: 0, dispatched: 0, error: 0 };
                                        const scaleKey = `${poolDetail.domain}-${layer}`;
                                        const isScaling = scaling[scaleKey];
                                        return (
                                          <div key={layer} className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5`}>
                                            <div className="flex items-center gap-2 mb-4">
                                              <LayerIcon className={`h-4 w-4 ${lc.text}`} />
                                              <span className={`text-[11px] font-medium uppercase tracking-wider ${lc.text}`}>{layer}</span>
                                            </div>
                                            <div className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] mb-3">{lb.total}</div>
                                            <div className="space-y-2 text-[hsl(var(--muted-foreground))] leading-relaxed">
                                              <div className="flex justify-between"><span>Idle</span><span className="text-emerald-400">{lb.idle}</span></div>
                                              <div className="flex justify-between"><span>Active</span><span className="text-blue-400">{lb.active}</span></div>
                                              <div className="flex justify-between"><span>Dispatched</span><span className="text-primary">{lb.dispatched}</span></div>
                                              {lb.error > 0 && <div className="flex justify-between"><span>Error</span><span className="text-primary">{lb.error}</span></div>}
                                            </div>
                                            {/* Scale buttons */}
                                            <div className="mt-4 flex items-center justify-center gap-2">
                                              <button
                                                onClick={() => handleScale(poolDetail.domain, layer, lb.total, -5)}
                                                disabled={isScaling || lb.total <= 1}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 disabled:opacity-30"
                                              >
                                                <Minus className="h-3 w-3" />
                                              </button>
                                              <span className="w-10 text-center text-[hsl(var(--foreground))] font-medium">
                                                {lb.total}
                                              </span>
                                              <button
                                                onClick={() => handleScale(poolDetail.domain, layer, lb.total, 5)}
                                                disabled={isScaling}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 disabled:opacity-30"
                                              >
                                                <Plus className="h-3 w-3" />
                                              </button>
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
                                      <MiniStat label="Dispatches" value={poolDetail.metrics.totalDispatches} color="text-primary" />
                                      <MiniStat label="Returns" value={poolDetail.metrics.totalReturns} color="text-cyan-400" />
                                      <MiniStat label="Expansions" value={poolDetail.metrics.expansionsTriggered} color="text-amber-400" />
                                      <MiniStat label="Queue Depth" value={poolDetail.queueDepth} />
                                      <MiniStat label="Max Agents" value={poolDetail.maxAgents} color="text-[hsl(var(--muted-foreground))]" />
                                      <MiniStat label="Last Event" value={poolDetail.metrics.lastEventAt ? relativeTime(poolDetail.metrics.lastEventAt) : 'Never'} isText />
                                    </div>
                                  </div>

                                  {/* Recent Events */}
                                  {poolDetail.recentEvents.length > 0 && (
                                    <div>
                                      <h3 className="mb-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                                        Recent Events ({poolDetail.recentEvents.length})
                                      </h3>
                                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {poolDetail.recentEvents.map((evt) => (
                                          <div
                                            key={evt.id}
                                            className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-3 text-[hsl(var(--muted-foreground))] leading-relaxed"
                                          >
                                            <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${severityBadge(evt.severity)}`}>
                                              {evt.severity}
                                            </span>
                                            <span className="text-[hsl(var(--foreground))] font-medium">{evt.type}</span>
                                            <span className="text-[hsl(var(--muted-foreground))]">{evt.source}</span>
                                            {evt.assignedAgentId && (
                                              <span className="text-primary font-mono text-[10px]">
                                                agent:{evt.assignedAgentId.slice(0, 8)}
                                              </span>
                                            )}
                                            <span className="text-[hsl(var(--muted-foreground))] ml-auto shrink-0">
                                              {relativeTime(evt.timestamp)}
                                            </span>
                                            {evt.handled ? (
                                              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                                            ) : (
                                              <button
                                                onClick={() => setResolveModal({ eventId: evt.id, domain: poolDetail.domain })}
                                                className="text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-3 py-1.5 transition-all duration-200"
                                              >
                                                Resolve
                                              </button>
                                            )}
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

            {/* Unhandled Events */}
            <section className="mb-8">
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                Unhandled Events
                {unhandledEvents.length > 0 && (
                  <span className="rounded-xl bg-primary/80/[0.08] px-3 py-1 text-[hsl(var(--muted-foreground))] leading-relaxed font-medium border border-primary/30">
                    {unhandledEvents.length}
                  </span>
                )}
              </h2>
              {unhandledEvents.length === 0 ? (
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-8 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-400/50" />
                  <p className="mt-3 text-[hsl(var(--muted-foreground))] leading-relaxed">All events handled &mdash; workforce operating normally</p>
                </div>
              ) : (
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[hsl(var(--muted-foreground))]">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Pool</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Event</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Severity</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Source</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Agent</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))]">Time</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-medium text-[hsl(var(--muted-foreground))] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {unhandledEvents.slice(0, 25).map((entry) => (
                        <tr
                          key={entry.event.id}
                          className="hover:bg-[hsl(var(--muted))] transition-all duration-200"
                        >
                          <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">{entry.domain}</td>
                          <td className="px-6 py-4 text-[hsl(var(--foreground))]">{entry.event.type}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${severityBadge(entry.event.severity)}`}>
                              {entry.event.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] leading-relaxed">{entry.event.source}</td>
                          <td className="px-6 py-4 text-primary font-mono leading-relaxed">
                            {entry.event.assignedAgentId ? entry.event.assignedAgentId.slice(0, 8) : '-'}
                          </td>
                          <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] leading-relaxed">{relativeTime(entry.event.timestamp)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setResolveModal({ eventId: entry.event.id, domain: entry.domain })}
                              className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200 text-[11px] uppercase tracking-wider font-medium"
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Resolve Modal */}
        {resolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[hsl(var(--background))] border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl border">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Resolve Event</h3>
                <button
                  onClick={() => { setResolveModal(null); setResolutionText(''); }}
                  className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                Pool: <span className="text-[hsl(var(--foreground))]">{resolveModal.domain}</span> &middot; Event: <span className="font-mono text-[hsl(var(--muted-foreground))]">{resolveModal.eventId.slice(0, 12)}</span>
              </p>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Resolution notes..."
                className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200 leading-relaxed"
                rows={4}
              />
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setResolveModal(null); setResolutionText(''); }}
                  className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!resolutionText.trim()}
                  className="bg-primary hover:bg-primary/90 text-[hsl(var(--foreground))] rounded-xl px-4 py-2 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, color, highlight, pulse }: { label: string; value: string | number; color?: string; highlight?: boolean; pulse?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-[hsl(var(--card))] p-5 ${highlight ? 'border-primary/30' : 'border-[hsl(var(--border))]'}`}>
      <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className={`text-2xl font-semibold tracking-tight ${color || 'text-[hsl(var(--foreground))]'}`}>{value}</p>
        {pulse && (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary/70" />
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      {icon}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, isText }: { label: string; value: string | number; color?: string; isText?: boolean }) {
  return (
    <div className="rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] p-4">
      <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
      <p className={`mt-1 font-medium ${isText ? 'text-[hsl(var(--muted-foreground))]' : color || 'text-[hsl(var(--foreground))]'} leading-relaxed`}>{value}</p>
    </div>
  );
}