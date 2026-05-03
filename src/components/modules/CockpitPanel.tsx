'use client';

import { useEffect, useState, useCallback } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
const REFRESH_INTERVAL = 30_000;

/* =========================================================================
   Types — real /api/cockpit/* response shapes
   ========================================================================= */

interface ServiceHealth {
  name: string;
  url: string;
  status: 'up' | 'down';
  responseTimeMs: number;
  lastChecked: string;
  error?: string;
}

interface QueueDepth {
  key: string;
  name: string;
  waiting: number;
  active: number;
  completed?: number;
  failed: number;
  delayed: number;
  depth?: number;
  error?: string;
}

interface StatusData {
  overall: 'all_operational' | 'degraded' | 'all_down';
  services: ServiceHealth[];
  queues: {
    discovered: number;
    depths: QueueDepth[];
    totalWaiting: number;
    totalActive: number;
  };
  workers: {
    total: number;
    online: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    pools: number;
  };
  checkedAt: string;
}

interface QueuesData {
  totalQueues: number;
  totalDepth: number;
  totalFailed: number;
  queues: QueueDepth[];
  ts: string;
}

interface WorkerEntry {
  agentId: string;
  status: string;
  lastHeartbeat: string | null;
  currentTask: string | null;
  startedAt: string | null;
  tasksCompleted: number;
}

interface WorkersData {
  totalWorkers: number;
  online: number;
  stale: number;
  workers: WorkerEntry[];
  ts: string;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    null
  );
}

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json === 'object' && 'data' in json) return json.data as T;
    return json as T;
  } catch {
    return null;
  }
}

function fmtTime(iso: string | null): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--';
  }
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '--';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  } catch {
    return '--';
  }
}

function overallColor(status: string): string {
  if (status === 'all_operational') return '#22c55e';
  if (status === 'degraded') return '#f59e0b';
  return '#ef4444';
}

function overallLabel(status: string): string {
  if (status === 'all_operational') return 'All Operational';
  if (status === 'degraded') return 'Degraded';
  return 'Major Outage';
}

function workerStatusColor(status: string): string {
  if (status === 'working' || status === 'online') return '#22c55e';
  if (status === 'idle') return '#f59e0b';
  if (status === 'stale') return '#f97316';
  return '#ef4444';
}

/* =========================================================================
   Sub-components
   ========================================================================= */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
      className={`rounded-xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: 'up' | 'down' }) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: 8,
        height: 8,
        background: status === 'up' ? '#22c55e' : '#ef4444',
        boxShadow: status === 'up'
          ? '0 0 6px rgba(34,197,94,0.6)'
          : '0 0 6px rgba(239,68,68,0.6)',
      }}
    />
  );
}

function QueueBar({ queue }: { queue: QueueDepth }) {
  const total = queue.waiting + queue.active + queue.delayed + queue.failed;
  const activeWidth = total > 0 ? Math.max((queue.active / total) * 100, 0) : 0;
  const waitingWidth = total > 0 ? Math.max((queue.waiting / total) * 100, 0) : 0;
  const failedWidth = total > 0 ? Math.max((queue.failed / total) * 100, 0) : 0;

  const shortName = queue.key
    .replace(/_queue$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-400 truncate">{shortName}</span>
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          {queue.active > 0 && (
            <span style={{ color: '#f97316' }}>
              {queue.active} active
            </span>
          )}
          {queue.waiting > 0 && (
            <span style={{ color: '#a3a3a3' }}>
              {queue.waiting} waiting
            </span>
          )}
          {queue.failed > 0 && (
            <span style={{ color: '#ef4444' }}>
              {queue.failed} failed
            </span>
          )}
          {total === 0 && (
            <span style={{ color: '#3f3f46' }}>idle</span>
          )}
        </div>
      </div>

      {/* Segmented bar */}
      <div
        className="h-1.5 rounded-full w-full overflow-hidden flex"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {activeWidth > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${activeWidth}%`,
              background: 'linear-gradient(to right, #dc2626, #f97316)',
            }}
          />
        )}
        {waitingWidth > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${waitingWidth}%`, background: 'rgba(161,161,170,0.4)' }}
          />
        )}
        {failedWidth > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${failedWidth}%`, background: '#7f1d1d' }}
          />
        )}
      </div>
    </div>
  );
}

function WorkerRow({ worker }: { worker: WorkerEntry }) {
  const color = workerStatusColor(worker.status);
  const shortId = worker.agentId.length > 12
    ? `${worker.agentId.slice(0, 6)}...${worker.agentId.slice(-4)}`
    : worker.agentId;

  return (
    <div
      className="flex items-center gap-3 py-2 border-b last:border-b-0"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 5px ${color}80` }}
      />
      <span className="text-xs font-mono text-zinc-400 w-28 shrink-0 truncate">{shortId}</span>
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded capitalize shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {worker.status}
      </span>
      <span className="text-[10px] font-mono text-zinc-600 flex-1 truncate">
        {worker.currentTask ? worker.currentTask : 'idle'}
      </span>
      <span className="text-[10px] font-mono text-zinc-600 shrink-0">
        {fmtRelative(worker.lastHeartbeat)}
      </span>
    </div>
  );
}

/* =========================================================================
   Main Component
   ========================================================================= */

export function CockpitPanel() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [queues, setQueues] = useState<QueuesData | null>(null);
  const [workers, setWorkers] = useState<WorkersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    const [statusRes, queuesRes, workersRes] = await Promise.all([
      apiFetch<StatusData>('/api/cockpit/status'),
      apiFetch<QueuesData>('/api/cockpit/queues'),
      apiFetch<WorkersData>('/api/cockpit/workers'),
    ]);

    if (!statusRes && !queuesRes && !workersRes) {
      setError(true);
    } else {
      if (statusRes) setStatus(statusRes);
      if (queuesRes) setQueues(queuesRes);
      if (workersRes) setWorkers(workersRes);
      setLastRefresh(new Date());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  const overallStatus = status?.overall ?? 'all_down';
  const services = status?.services ?? [];
  const queueList = queues?.queues ?? status?.queues?.depths ?? [];
  const workerList = workers?.workers ?? [];

  return (
    <div
      className="flex flex-col h-full w-full overflow-y-auto text-zinc-100"
      style={{ background: 'rgba(10,10,10,0.97)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Cockpit
          </span>

          {/* Overall status badge */}
          {!loading && !error && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: `${overallColor(overallStatus)}18`,
                color: overallColor(overallStatus),
                border: `1px solid ${overallColor(overallStatus)}40`,
              }}
            >
              {overallLabel(overallStatus)}
            </span>
          )}

          {loading && (
            <span className="text-[10px] font-mono text-zinc-600 animate-pulse">
              refreshing...
            </span>
          )}
          {error && !loading && (
            <span className="text-[10px] font-mono text-red-600">API unreachable</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] font-mono text-zinc-600">
              {fmtTime(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-[10px] font-mono px-2 py-1 rounded transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: loading ? '#3f3f46' : '#a3a3a3',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 space-y-6 min-h-0">

        {/* 1. Summary tiles */}
        {status && (
          <section>
            <SectionHeader>System Overview</SectionHeader>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Services up */}
              <Card className="flex flex-col gap-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Services</p>
                <p className="text-2xl font-black text-white leading-none">
                  {services.filter((s) => s.status === 'up').length}
                  <span className="text-zinc-600 text-base font-normal">/{services.length}</span>
                </p>
                <p className="text-[10px] font-mono text-zinc-600">online</p>
              </Card>

              {/* Queues */}
              <Card className="flex flex-col gap-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Queue Depth</p>
                <p
                  className="text-2xl font-black leading-none"
                  style={{
                    color: (queues?.totalDepth ?? status.queues?.totalWaiting ?? 0) > 0
                      ? '#f97316'
                      : '#22c55e',
                  }}
                >
                  {queues?.totalDepth ?? status.queues?.totalWaiting ?? 0}
                </p>
                <p className="text-[10px] font-mono text-zinc-600">
                  {queues?.totalFailed ?? 0} failed
                </p>
              </Card>

              {/* Workers */}
              <Card className="flex flex-col gap-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Workers</p>
                <p className="text-2xl font-black text-white leading-none">
                  {workers?.online ?? status.workers.online}
                  <span className="text-zinc-600 text-base font-normal">
                    /{workers?.totalWorkers ?? status.workers.total}
                  </span>
                </p>
                <p className="text-[10px] font-mono text-zinc-600">
                  {workers?.stale ?? 0} stale
                </p>
              </Card>

              {/* Agent pool */}
              <Card className="flex flex-col gap-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Agents</p>
                <p className="text-2xl font-black text-white leading-none">
                  {status.agents.active}
                  <span className="text-zinc-600 text-base font-normal">
                    /{status.agents.total}
                  </span>
                </p>
                <p className="text-[10px] font-mono text-zinc-600">
                  {status.agents.pools} pool{status.agents.pools !== 1 ? 's' : ''}
                </p>
              </Card>
            </div>
          </section>
        )}

        {/* 2. Service health list */}
        <section>
          <SectionHeader>Service Health</SectionHeader>
          <Card className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {services.length === 0 && (
              <p className="text-xs text-zinc-600 font-mono py-2">No service data</p>
            )}
            {services.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusDot status={svc.status} />
                  <span className="text-sm font-medium text-zinc-200 truncate">{svc.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-600">
                    {svc.responseTimeMs}ms
                  </span>
                  {svc.error && (
                    <span
                      className="text-[10px] font-mono truncate max-w-28"
                      style={{ color: '#ef4444' }}
                      title={svc.error}
                    >
                      {svc.error}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: svc.status === 'up'
                        ? 'rgba(34,197,94,0.1)'
                        : 'rgba(239,68,68,0.1)',
                      color: svc.status === 'up' ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {svc.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </section>

        {/* 3. Queue depths */}
        <section>
          <SectionHeader>
            Queue Depths
            {queueList.length > 0 && (
              <span className="ml-1 text-zinc-600">({queueList.length})</span>
            )}
          </SectionHeader>
          <Card className="space-y-4">
            {queueList.length === 0 && (
              <p className="text-xs text-zinc-600 font-mono">No queue data</p>
            )}
            {queueList.map((q) => (
              <QueueBar key={q.key} queue={q} />
            ))}

            {/* Totals row */}
            {queueList.length > 0 && (
              <div
                className="flex items-center justify-between pt-3 border-t text-[10px] font-mono"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <span className="text-zinc-600">
                  {queueList.length} queues
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500">
                    Active:{' '}
                    <span style={{ color: '#f97316' }}>
                      {queueList.reduce((s, q) => s + q.active, 0)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    Waiting:{' '}
                    <span className="text-zinc-300">
                      {queueList.reduce((s, q) => s + q.waiting, 0)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    Failed:{' '}
                    <span style={{ color: '#ef4444' }}>
                      {queueList.reduce((s, q) => s + q.failed, 0)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* 4. Worker list */}
        <section>
          <SectionHeader>
            Workers
            {workerList.length > 0 && (
              <span className="ml-1 text-zinc-600">({workerList.length})</span>
            )}
          </SectionHeader>
          <Card>
            {workerList.length === 0 && (
              <p className="text-xs text-zinc-600 font-mono">No active workers</p>
            )}
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {workerList.map((w) => (
                <WorkerRow key={w.agentId} worker={w} />
              ))}
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
