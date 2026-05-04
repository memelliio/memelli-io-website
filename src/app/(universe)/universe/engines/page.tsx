'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Users,
  ShoppingBag,
  GraduationCap,
  Phone,
  Target,
  CreditCard,
  CheckCircle,
  BadgeDollarSign,
  Search,
  Globe,
  Handshake,
  Bot,
  Activity,
  X,
  AlertTriangle,
  Clock,
  Zap,
  Layers,
  RefreshCw,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

type EngineStatus = 'healthy' | 'degraded' | 'down';

interface EngineJob {
  id: string;
  name: string;
  status: 'running' | 'queued' | 'failed' | 'completed';
  timestamp: string;
}

interface EngineError {
  id: string;
  message: string;
  timestamp: string;
  count: number;
}

interface TenantUsage {
  id: string;
  name: string;
  activeJobs: number;
  lastActive: string;
}

interface EngineData {
  id: string;
  name: string;
  description: string;
  status: EngineStatus;
  activeTenants: number;
  activeJobs: number;
  queueDepth: number;
  errorRate: number;
  uptime: number;
  responseTime: number;
  recentJobs: EngineJob[];
  recentErrors: EngineError[];
  tenantUsage: TenantUsage[];
  workerCount: number;
  workersHealthy: number;
}

interface EnginesStatusResponse {
  engines: EngineData[];
  summary: {
    totalActiveJobs: number;
    totalQueueDepth: number;
    failedJobs24h: number;
    avgResponseTime: number;
  };
}

/* ─────────────────────────── Engine Config ─────────────────────────── */

const ENGINE_META: Record<string, { icon: LucideIcon; gradient: string }> = {
  crm:              { icon: Users,           gradient: 'from-blue-500/20 to-blue-600/5' },
  commerce:         { icon: ShoppingBag,     gradient: 'from-emerald-500/20 to-emerald-600/5' },
  coaching:         { icon: GraduationCap,   gradient: 'from-red-500/20 to-red-600/5' },
  communications:   { icon: Phone,           gradient: 'from-cyan-500/20 to-cyan-600/5' },
  leadpulse:        { icon: Target,          gradient: 'from-orange-500/20 to-orange-600/5' },
  credit:           { icon: CreditCard,      gradient: 'from-yellow-500/20 to-yellow-600/5' },
  approval:         { icon: CheckCircle,     gradient: 'from-green-500/20 to-green-600/5' },
  funding:          { icon: BadgeDollarSign,  gradient: 'from-lime-500/20 to-lime-600/5' },
  'forum-seo':      { icon: Search,          gradient: 'from-pink-500/20 to-pink-600/5' },
  'website-builder': { icon: Globe,          gradient: 'from-indigo-500/20 to-indigo-600/5' },
  affiliate:        { icon: Handshake,       gradient: 'from-amber-500/20 to-amber-600/5' },
  'ai-workforce':   { icon: Bot,             gradient: 'from-violet-500/20 to-violet-600/5' },
};

/* ─────────────────────────── Fallback Data ─────────────────────────── */

function buildFallbackData(): EnginesStatusResponse {
  const engines: EngineData[] = [
    { id: 'crm', name: 'CRM', description: 'Customer relationship management' },
    { id: 'commerce', name: 'Commerce', description: 'E-commerce & stores' },
    { id: 'coaching', name: 'Coaching', description: 'Learning & programs' },
    { id: 'communications', name: 'Communications', description: 'Calls, SMS, chat, tickets' },
    { id: 'leadpulse', name: 'LeadPulse', description: 'Lead generation & outreach' },
    { id: 'credit', name: 'Credit / Prequal', description: 'Credit pulls & prequalification' },
    { id: 'approval', name: 'Approval', description: 'Soft pull approvals' },
    { id: 'funding', name: 'Funding', description: 'Business funding' },
    { id: 'forum-seo', name: 'Forum SEO', description: 'Forum-driven traffic engine' },
    { id: 'website-builder', name: 'Website Builder', description: 'Site generation' },
    { id: 'affiliate', name: 'Affiliate / Reseller', description: 'Partner programs' },
    { id: 'ai-workforce', name: 'AI Workforce', description: 'AI agent departments' },
  ].map((e) => ({
    ...e,
    status: 'healthy' as EngineStatus,
    activeTenants: 0,
    activeJobs: 0,
    queueDepth: 0,
    errorRate: 0,
    uptime: 100,
    responseTime: 0,
    recentJobs: [],
    recentErrors: [],
    tenantUsage: [],
    workerCount: 0,
    workersHealthy: 0,
  }));

  return {
    engines,
    summary: { totalActiveJobs: 0, totalQueueDepth: 0, failedJobs24h: 0, avgResponseTime: 0 },
  };
}

/* ─────────────────────────── Helpers ─────────────────────────── */

const STATUS_CONFIG: Record<EngineStatus, { dot: string; label: string; bg: string; text: string }> = {
  healthy:  { dot: 'bg-emerald-400', label: 'Healthy',  bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  degraded: { dot: 'bg-amber-400',  label: 'Degraded', bg: 'bg-amber-500/10',  text: 'text-amber-400' },
  down:     { dot: 'bg-primary/70',     label: 'Down',     bg: 'bg-primary/10',     text: 'text-primary' },
};

function formatUptime(pct: number): string {
  return pct >= 99.99 ? '100%' : `${pct.toFixed(2)}%`;
}

function formatMs(ms: number): string {
  if (ms < 1) return '< 1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/* ─────────────────────────── Components ─────────────────────────── */

function StatusDot({ status }: { status: EngineStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'healthy' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-40`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = 'text-[hsl(var(--foreground))]',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
          <p className={`text-lg font-semibold ${accent}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ status, uptime }: { status: EngineStatus; uptime: number }) {
  const color =
    status === 'healthy' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-primary/80';
  const width = Math.max(uptime, 5);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
      <div className={`h-full rounded-full ${color} transition-all duration-200`} style={{ width: `${width}%` }} />
    </div>
  );
}

function EngineCard({ engine, onClick }: { engine: EngineData; onClick: () => void }) {
  const meta = ENGINE_META[engine.id] ?? { icon: Activity, gradient: 'from-zinc-500/20 to-zinc-600/5' };
  const Icon = meta.icon;
  const statusCfg = STATUS_CONFIG[engine.status];

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 text-left transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient}`}>
            <Icon className="h-5 w-5 text-[hsl(var(--foreground))]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{engine.name}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed truncate">{engine.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={engine.status} />
          <span className={`text-xs font-medium ${statusCfg.text}`}>{statusCfg.label}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Tenants</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{engine.activeTenants}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Jobs</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{engine.activeJobs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Queue</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{engine.queueDepth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Errors (24h)</span>
          <span className={`font-medium ${engine.errorRate > 5 ? 'text-primary' : engine.errorRate > 1 ? 'text-amber-400' : 'text-[hsl(var(--foreground))]'}`}>
            {engine.errorRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Uptime bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[hsl(var(--muted-foreground))]">Uptime</span>
          <span className="text-[hsl(var(--foreground))] font-medium">{formatUptime(engine.uptime)}</span>
        </div>
        <HealthBar status={engine.status} uptime={engine.uptime} />
      </div>

      {/* Expand hint */}
      <div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
          View details <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

/* ─────────────────────────── Detail Drawer ─────────────────────────── */

function EngineDrawer({ engine, onClose }: { engine: EngineData; onClose: () => void }) {
  const meta = ENGINE_META[engine.id] ?? { icon: Activity, gradient: 'from-zinc-500/20 to-zinc-600/5' };
  const Icon = meta.icon;
  const statusCfg = STATUS_CONFIG[engine.status];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-[hsl(var(--background))] shadow-2xl shadow-black/60 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient}`}>
              <Icon className="h-5 w-5 text-[hsl(var(--foreground))]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{engine.name}</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{engine.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status overview */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Status</h3>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ${statusCfg.bg}`}>
              <StatusDot status={engine.status} />
              <span className={`text-sm font-medium ${statusCfg.text}`}>{statusCfg.label}</span>
            </div>
          </section>

          {/* Metrics grid */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Tenants', value: engine.activeTenants },
                { label: 'Active Jobs', value: engine.activeJobs },
                { label: 'Queue Depth', value: engine.queueDepth },
                { label: 'Error Rate', value: `${engine.errorRate.toFixed(1)}%` },
                { label: 'Uptime', value: formatUptime(engine.uptime) },
                { label: 'Avg Response', value: formatMs(engine.responseTime) },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                  <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{m.label}</p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{m.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Worker health */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Worker Health</h3>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              {engine.workerCount === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">No workers registered</p>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--foreground))]">
                    {engine.workersHealthy} / {engine.workerCount} healthy
                  </span>
                  <HealthBar
                    status={
                      engine.workersHealthy === engine.workerCount
                        ? 'healthy'
                        : engine.workersHealthy > 0
                        ? 'degraded'
                        : 'down'
                    }
                    uptime={engine.workerCount > 0 ? (engine.workersHealthy / engine.workerCount) * 100 : 0}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Queue depth over time placeholder */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Queue Depth Over Time</h3>
            <div className="flex h-24 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Chart available when metrics are streaming</p>
            </div>
          </section>

          {/* Recent jobs */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Recent Jobs</h3>
            {engine.recentJobs.length === 0 ? (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">No recent jobs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {engine.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[hsl(var(--foreground))] truncate">{job.name}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{job.timestamp}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : job.status === 'running'
                          ? 'bg-primary/10 text-primary'
                          : job.status === 'queued'
                          ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Error log */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Error Log (24h)</h3>
            {engine.recentErrors.length === 0 ? (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">No errors in the last 24 hours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {engine.recentErrors.map((err) => (
                  <div
                    key={err.id}
                    className="rounded-xl border border-primary/20 bg-primary/80/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-primary/80 truncate">{err.message}</p>
                      <span className="shrink-0 ml-2 text-[10px] text-primary/70">x{err.count}</span>
                    </div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{err.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tenant usage */}
          <section>
            <h3 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Tenant Usage</h3>
            {engine.tenantUsage.length === 0 ? (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">No tenants connected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {engine.tenantUsage.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[hsl(var(--foreground))] truncate">{t.name}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Last active: {t.lastActive}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">{t.activeJobs} jobs</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function EnginesPage() {
  const api = useApi();

  const [data, setData] = useState<EnginesStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<EngineData | null>(null);

  const fetchStatus = useCallback(async () => {
    const res = await api.get<EnginesStatusResponse>('/api/admin/engines/status');
    if (res.error) {
      // Use fallback data so the page is always useful
      setData(buildFallbackData());
      setError(res.error);
    } else {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="bg-[hsl(var(--background))] min-h-screen">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed animate-pulse">Loading engine status...</p>
          </div>
        </div>
      </div>
    );
  }

  const engines = data?.engines ?? [];
  const summary = data?.summary ?? { totalActiveJobs: 0, totalQueueDepth: 0, failedJobs24h: 0, avgResponseTime: 0 };

  const issueCount = engines.filter((e) => e.status !== 'healthy').length;

  return (
    <div className="bg-[hsl(var(--background))] min-h-screen">
      <div className="space-y-6 p-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Engines</h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Health and status of all Memelli Universe engines
            </p>
          </div>
          <div className="flex items-center gap-3">
            {issueCount === 0 ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
                <StatusDot status="healthy" />
                All systems operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {issueCount} issue{issueCount > 1 ? 's' : ''} detected
              </span>
            )}
            <button
              onClick={() => {
                setLoading(true);
                fetchStatus();
              }}
              className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              Could not reach engine status API. Showing fallback data.
            </p>
            <span className="ml-auto text-xs text-amber-500/70 truncate max-w-[200px]">{error}</span>
          </div>
        )}

        {/* ── System Summary Bar ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Active Jobs"
            value={summary.totalActiveJobs.toLocaleString()}
            icon={Zap}
            accent="text-primary"
          />
          <SummaryCard
            label="Queue Depth"
            value={summary.totalQueueDepth.toLocaleString()}
            icon={Layers}
            accent="text-cyan-400"
          />
          <SummaryCard
            label="Failed (24h)"
            value={summary.failedJobs24h.toLocaleString()}
            icon={AlertTriangle}
            accent={summary.failedJobs24h > 0 ? 'text-primary' : 'text-[hsl(var(--foreground))]'}
          />
          <SummaryCard
            label="Avg Response"
            value={formatMs(summary.avgResponseTime)}
            icon={Clock}
            accent="text-emerald-400"
          />
        </div>

        {/* ── Engine Cards Grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {engines.map((engine) => (
            <EngineCard key={engine.id} engine={engine} onClick={() => setSelectedEngine(engine)} />
          ))}
        </div>

        {/* ── Detail Drawer ── */}
        {selectedEngine && (
          <EngineDrawer engine={selectedEngine} onClose={() => setSelectedEngine(null)} />
        )}
      </div>
    </div>
  );
}