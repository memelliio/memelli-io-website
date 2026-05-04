'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  AlertCircle,
  RotateCcw,
  Trash2,
  Radio,
  Calendar
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ServiceStatus = 'operational' | 'degraded' | 'down';
type OverallStatus = 'operational' | 'degraded' | 'outage';

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  metrics: Record<string, string | number>;
  lastCheck: string;
}

interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed24h: number;
  failed24h: number;
  avgProcessingTime: string;
}

interface WorkerHealth {
  name: string;
  status: 'running' | 'idle' | 'stopped';
  currentJob: string | null;
  cpuUsage: number;
  memory: string;
  uptime: string;
}

interface FailedJob {
  id: string;
  queue: string;
  errorMessage: string;
  failedAt: string;
  retryCount: number;
}

interface EventThroughput {
  lastHour: number;
  last24h: number;
  breakdown: { type: string; count: number }[];
}

interface IncidentAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface SystemHealthData {
  overall: OverallStatus;
  services: ServiceHealth[];
  queues: QueueHealth[];
  workers: WorkerHealth[];
  failedJobs: FailedJob[];
  eventThroughput: EventThroughput;
  incidents: IncidentAlert[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SERVICE_ICONS: Record<string, React.ComponentType<any>> = {
  'API Server': Server,
  PostgreSQL: Database,
  Redis: HardDrive,
  'BullMQ Workers': Cpu,
  'SSE Server': Radio,
  'Cron Scheduler': Calendar
};

function statusColor(status: ServiceStatus | 'running' | 'idle' | 'stopped'): string {
  switch (status) {
    case 'operational':
    case 'running':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'degraded':
    case 'idle':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'down':
    case 'stopped':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    default:
      return 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
  }
}

function overallDot(status: OverallStatus): string {
  switch (status) {
    case 'operational':
      return 'bg-emerald-400';
    case 'degraded':
      return 'bg-yellow-400';
    case 'outage':
      return 'bg-red-400';
    default:
      return 'bg-[hsl(var(--muted-foreground))]';
  }
}

function overallLabel(status: OverallStatus): string {
  switch (status) {
    case 'operational':
      return 'All Systems Operational';
    case 'degraded':
      return 'Degraded Performance';
    case 'outage':
      return 'System Outage';
    default:
      return 'Unknown';
  }
}

function severityBadge(severity: 'critical' | 'warning' | 'info') {
  const map = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };
  return map[severity];
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
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
    return formatTime(iso);
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SystemHealthPage() {
  const api = useApi();

  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    if (!data) setLoading(true);
    setError(null);

    const res = await api.get<SystemHealthData>('/api/admin/health');
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setData(res.data);
    }

    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  /* Action handlers */
  const handleRetryJob = async (jobId: string, queue: string) => {
    await api.post(`/api/admin/queues/${queue}/jobs/${jobId}/retry`, {});
    fetchHealth(true);
  };

  const handleDeleteJob = async (jobId: string, queue: string) => {
    await api.del(`/api/admin/queues/${queue}/jobs/${jobId}`);
    fetchHealth(true);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ---- Header ---- */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Activity className="h-7 w-7 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
              {data && (
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${overallDot(data.overall)} animate-pulse`} />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{overallLabel(data.overall)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="flex h-9 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ---- Loading ---- */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
            <LoadingGlobe size="lg" />
            <p className="mt-3 text-sm">Checking system health...</p>
          </div>
        )}

        {/* ---- Error ---- */}
        {!loading && error && !data && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchHealth(true)}
              className="mt-4 rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ---- Data ---- */}
        {data && (
          <>
            {/* ── 1. Service Status Grid ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-400" />
                Service Status
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.services.map((svc) => {
                  const Icon = SERVICE_ICONS[svc.name] ?? Server;
                  return (
                    <div
                      key={svc.name}
                      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{svc.name}</span>
                        </div>
                        <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(svc.status)}`}>
                          {svc.status === 'operational' ? 'Operational' : svc.status === 'degraded' ? 'Degraded' : 'Down'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(svc.metrics).map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{key}</p>
                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                        <Clock className="h-3 w-3" />
                        <span>Last check: {relativeTime(svc.lastCheck)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 2. Queue Health Table ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Queue Health
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Queue</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Waiting</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Active</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Completed (24h)</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Failed (24h)</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Avg Processing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.queues.map((q) => (
                      <tr key={q.name} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors">
                        <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{q.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${q.waiting > 100 ? 'text-yellow-400 font-medium' : 'text-[hsl(var(--foreground))]'}`}>
                            {q.waiting.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{q.active.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-emerald-400">{q.completed24h.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${q.failed24h > 0 ? 'text-red-400 font-medium' : 'text-[hsl(var(--muted-foreground))]'}`}>
                            {q.failed24h.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--muted-foreground))]">{q.avgProcessingTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 3. Worker Health ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                Worker Health
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Worker</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Current Job</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">CPU</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Memory</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workers.map((w) => (
                      <tr key={w.name} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors">
                        <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{w.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusColor(w.status)}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] max-w-[200px] truncate">
                          {w.currentJob ?? <span className="text-[hsl(var(--muted-foreground))]">&mdash;</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${w.cpuUsage > 80 ? 'text-red-400 font-medium' : w.cpuUsage > 50 ? 'text-yellow-400' : 'text-[hsl(var(--foreground))]'}`}>
                            {w.cpuUsage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{w.memory}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--muted-foreground))]">{w.uptime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 4. Failed Jobs ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                Failed Jobs
                {data.failedJobs.length > 0 && (
                  <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/30">
                    {data.failedJobs.length}
                  </span>
                )}
              </h2>
              {data.failedJobs.length === 0 ? (
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-8 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500/50" />
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">No failed jobs</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Job ID</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Queue</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Error</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Failed At</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Retries</th>
                        <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.failedJobs.map((job) => (
                        <tr key={job.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">{job.id}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--foreground))]">
                              {job.queue}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-red-400/80 text-xs max-w-[300px] truncate">{job.errorMessage}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs">{formatTime(job.failedAt)}</td>
                          <td className="px-4 py-3 text-center text-[hsl(var(--muted-foreground))]">{job.retryCount}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleRetryJob(job.id, job.queue)}
                                className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-blue-400 transition-colors"
                                title="Retry"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id, job.queue)}
                                className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── 5. Event Throughput ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                Event Throughput
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Last Hour</p>
                  <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">{data.eventThroughput.lastHour.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">events processed</p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Last 24h</p>
                  <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">{data.eventThroughput.last24h.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">events processed</p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
                  <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">Event Types Breakdown</p>
                  {data.eventThroughput.breakdown.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">No events</p>
                  ) : (
                    <div className="space-y-2">
                      {data.eventThroughput.breakdown.map((evt) => (
                        <div key={evt.type} className="flex items-center justify-between">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{evt.type}</span>
                          <span className="text-xs font-medium text-[hsl(var(--foreground))]">{evt.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── 6. Recent Incidents / Alerts ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Recent Incidents &amp; Alerts
              </h2>
              {data.incidents.length === 0 ? (
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-8 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500/50" />
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">No recent incidents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-start gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4"
                    >
                      <span className={`mt-0.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityBadge(inc.severity)}`}>
                        {inc.severity === 'critical' ? (
                          <XCircle className="h-3 w-3" />
                        ) : inc.severity === 'warning' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {inc.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase">{inc.type}</span>
                          {inc.resolved ? (
                            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              Resolved
                            </span>
                          ) : (
                            <span className="rounded-md bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-medium text-red-400">
                              Open
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[hsl(var(--foreground))]">{inc.message}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(inc.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
