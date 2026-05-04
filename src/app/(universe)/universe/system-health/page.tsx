'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Layers,
  RefreshCw,
  Rocket,
  Server,
  Shield,
  Users,
  Wifi,
  XCircle,
  Zap,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
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

interface SystemHealthData {
  overall: 'operational' | 'degraded' | 'outage';
  services: ServiceHealth[];
  queues: QueueHealth[];
  workers: Array<{ name: string; status: string; uptime: string }>;
  incidents: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  eventThroughput: {
    lastHour: number;
    last24h: number;
  };
}

interface ClaudeLane {
  id: string;
  laneName: string;
  accountLabel: string;
  status: string;
  apiKeyEnvVar: string;
}

interface AgentPoolMetrics {
  pools: Array<{
    domain: string;
    status: string;
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
  }>;
  totals: {
    totalPools: number;
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
  };
}

interface PatrolStatus {
  domains: Array<{
    domain: string;
    enabled: boolean;
    totalFindings: number;
    totalRuns: number;
    lastRunAt: string | null;
  }>;
  totalDomains: number;
  activeDomains: number;
  totalFindings: number;
  totalRuns: number;
}

interface DeployHistory {
  deployments: Array<{
    id: string;
    service: string;
    version: string;
    environment: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
  }>;
  count: number;
}

interface RevenueOverview {
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    revenueGrowth: number;
    churnRate: number;
    ltv: number;
  };
}

interface ConnectionReport {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  connections: Array<{
    name: string;
    status: string;
    latencyMs: number;
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Status helpers                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function statusColor(status: string): string {
  switch (status) {
    case 'operational':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
    case 'ACTIVE':
    case 'running':
    case 'available':
    case 'success':
    case 'completed':
      return 'text-emerald-400';
    case 'degraded':
    case 'DEGRADED':
    case 'warning':
    case 'COOLING':
    case 'paused':
    case 'cooldown':
      return 'text-amber-400';
    case 'down':
    case 'outage':
    case 'DISABLED':
    case 'error':
    case 'ERROR':
    case 'exhausted':
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-[hsl(var(--muted-foreground))]';
  }
}

function statusDot(status: string): string {
  switch (status) {
    case 'operational':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
    case 'ACTIVE':
    case 'running':
    case 'available':
    case 'success':
    case 'completed':
      return 'bg-emerald-400';
    case 'degraded':
    case 'DEGRADED':
    case 'warning':
    case 'COOLING':
    case 'paused':
    case 'cooldown':
      return 'bg-amber-400';
    case 'down':
    case 'outage':
    case 'DISABLED':
    case 'error':
    case 'ERROR':
    case 'exhausted':
    case 'failed':
      return 'bg-red-400';
    default:
      return 'bg-[hsl(var(--muted-foreground))]';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'operational':
    case 'healthy':
    case 'HEALTHY':
    case 'active':
    case 'running':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'degraded':
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'down':
    case 'outage':
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-[hsl(var(--muted))] border-[hsl(var(--border))]';
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    default:
      return 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border-[hsl(var(--border))]';
  }
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function OverallStatusBanner({ status }: { status: string }) {
  const label =
    status === 'operational'
      ? 'All Systems Operational'
      : status === 'degraded'
        ? 'System Degraded'
        : 'System Outage';

  return (
    <div
      className={`rounded-2xl border px-6 py-4 flex items-center gap-4 transition-all duration-300 ${statusBg(
        status
      )}`}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${statusDot(
            status
          )}`}
        />
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${statusDot(status)}`}
        />
      </div>
      <div>
        <span
          className={`text-[16px] font-bold ${statusColor(status)}`}
        >
          {label}
        </span>
        <span className="text-[11px] text-[hsl(var(--muted-foreground))] ml-3">
          Last checked: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  status,
}: {
  icon: typeof Globe;
  label: string;
  value: string | number;
  sub?: string;
  status?: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all duration-200 hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))]">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`h-4 w-4 ${status ? statusColor(status) : 'text-[hsl(var(--muted-foreground))]'}`}
        />
        <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
          {label}
        </span>
      </div>
      <div className="text-[24px] font-bold text-[hsl(var(--foreground))] tabular-nums leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{sub}</div>
      )}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Globe }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <h2 className="text-[14px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  API Health Section                                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function ApiHealthSection({ services }: { services: ServiceHealth[] }) {
  return (
    <div>
      <SectionHeader title="API & Infrastructure" icon={Server} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map((svc) => (
          <div
            key={svc.name}
            className={`rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-all duration-200 hover:bg-[hsl(var(--card))]`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {svc.status === 'operational' && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${statusDot(svc.status)}`}
                  />
                </span>
                <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {svc.name}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${statusColor(svc.status)}`}
              >
                {svc.status}
              </span>
            </div>
            {Object.keys(svc.metrics).length > 0 && (
              <div className="space-y-0.5">
                {Object.entries(svc.metrics).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between text-[11px]"
                  >
                    <span className="text-[hsl(var(--muted-foreground))]">{key}</span>
                    <span className="text-[hsl(var(--muted-foreground))] font-mono">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Claude Lanes Section                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function ClaudeLanesSection({ lanes }: { lanes: ClaudeLane[] }) {
  return (
    <div>
      <SectionHeader title="Claude API Keys" icon={Zap} />
      {lanes.length === 0 ? (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          No Claude lanes registered
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {lanes.map((lane) => (
            <div
              key={lane.id}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-all duration-200 hover:bg-[hsl(var(--card))]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-[hsl(var(--foreground))] truncate">
                  {lane.laneName}
                </span>
                <span
                  className={`relative flex h-2 w-2 rounded-full ${statusDot(lane.status)}`}
                >
                  {(lane.status === 'available' || lane.status === 'active' || lane.status === 'ACTIVE') && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Status</span>
                  <span className={`font-medium ${statusColor(lane.status)}`}>
                    {lane.status}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Account</span>
                  <span className="text-[hsl(var(--muted-foreground))]">{lane.accountLabel}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Key</span>
                  <span className="text-[hsl(var(--muted-foreground))] font-mono text-[10px]">
                    {lane.apiKeyEnvVar}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Queue Depths Section                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function QueueDepthsSection({ queues }: { queues: QueueHealth[] }) {
  const totalWaiting = queues.reduce((s, q) => s + q.waiting, 0);
  const totalActive = queues.reduce((s, q) => s + q.active, 0);
  const totalFailed = queues.reduce((s, q) => s + q.failed24h, 0);

  return (
    <div>
      <SectionHeader title="BullMQ Queues" icon={Layers} />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {totalWaiting}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Waiting
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-blue-400 tabular-nums">
            {totalActive}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Active
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div
            className={`text-[20px] font-bold tabular-nums ${totalFailed > 0 ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`}
          >
            {totalFailed}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Failed
          </div>
        </div>
      </div>

      {/* Queue list */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0 px-3 py-2 border-b border-[hsl(var(--border))] text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">
          <span>Queue</span>
          <span className="text-right">Waiting</span>
          <span className="text-right">Active</span>
          <span className="text-right">Done</span>
          <span className="text-right">Failed</span>
        </div>
        {queues.map((q) => (
          <div
            key={q.name}
            className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0 px-3 py-2 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-100"
          >
            <span className="text-[12px] text-[hsl(var(--foreground))] font-medium truncate">
              {q.name.replace(/_/g, ' ')}
            </span>
            <span
              className={`text-[12px] text-right tabular-nums ${q.waiting > 0 ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'}`}
            >
              {q.waiting}
            </span>
            <span
              className={`text-[12px] text-right tabular-nums ${q.active > 0 ? 'text-blue-400' : 'text-[hsl(var(--muted-foreground))]'}`}
            >
              {q.active}
            </span>
            <span className="text-[12px] text-right tabular-nums text-[hsl(var(--muted-foreground))]">
              {q.completed24h.toLocaleString()}
            </span>
            <span
              className={`text-[12px] text-right tabular-nums ${q.failed24h > 0 ? 'text-red-400 font-medium' : 'text-[hsl(var(--muted-foreground))]'}`}
            >
              {q.failed24h}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Agent Pool Section                                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function AgentPoolSection({ data }: { data: AgentPoolMetrics | null }) {
  if (!data) {
    return (
      <div>
        <SectionHeader title="Agent Pools" icon={Users} />
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          Loading agent pool data...
        </div>
      </div>
    );
  }

  const { totals, pools } = data;

  return (
    <div>
      <SectionHeader title="Agent Pools" icon={Users} />

      {/* Totals */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {totals.totalAgents}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Total
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-emerald-400 tabular-nums">
            {totals.activeAgents}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Active
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-blue-400 tabular-nums">
            {totals.idleAgents}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Idle
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div
            className={`text-[20px] font-bold tabular-nums ${totals.errorAgents > 0 ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`}
          >
            {totals.errorAgents}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Error
          </div>
        </div>
      </div>

      {/* Pool utilization bars */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden divide-y divide-white/[0.02]">
        {pools.slice(0, 12).map((pool) => {
          const utilization =
            pool.totalAgents > 0
              ? Math.round((pool.activeAgents / pool.totalAgents) * 100)
              : 0;
          return (
            <div key={pool.domain} className="px-3 py-2 hover:bg-[hsl(var(--muted))] transition-colors duration-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusDot(pool.status)}`}
                  />
                  <span className="text-[12px] text-[hsl(var(--foreground))] font-medium truncate">
                    {pool.domain}
                  </span>
                </div>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums">
                  {pool.activeAgents}/{pool.totalAgents}
                </span>
              </div>
              <div className="h-1 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    utilization > 80
                      ? 'bg-red-500'
                      : utilization > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          );
        })}
        {pools.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
            No pools registered
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Patrol Grid Section                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function PatrolGridSection({ data }: { data: PatrolStatus | null }) {
  if (!data) {
    return (
      <div>
        <SectionHeader title="Patrol Grid" icon={Shield} />
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          Loading patrol data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Patrol Grid" icon={Shield} />

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {data.activeDomains}/{data.totalDomains}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Active Domains
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {data.totalRuns}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Total Runs
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div
            className={`text-[20px] font-bold tabular-nums ${data.totalFindings > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {data.totalFindings}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Findings
          </div>
        </div>
      </div>

      {/* Domain status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {data.domains.map((d) => (
          <div
            key={d.domain}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-2 flex items-center gap-2"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${d.enabled ? (d.totalFindings > 0 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-[hsl(var(--muted))]'}`}
            />
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
              {d.domain}
            </span>
            {d.totalFindings > 0 && (
              <span className="text-[10px] text-amber-400 font-medium ml-auto shrink-0">
                {d.totalFindings}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Recent Deploys Section                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function RecentDeploysSection({ data }: { data: DeployHistory | null }) {
  if (!data || data.deployments.length === 0) {
    return (
      <div>
        <SectionHeader title="Recent Deploys" icon={Rocket} />
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          No recent deployments
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Recent Deploys" icon={Rocket} />
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden divide-y divide-white/[0.02]">
        {data.deployments.slice(0, 8).map((deploy) => (
          <div
            key={deploy.id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors duration-100"
          >
            {deploy.status === 'COMPLETED' || deploy.status === 'DEPLOYED' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : deploy.status === 'FAILED' || deploy.status === 'ROLLED_BACK' ? (
              <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[hsl(var(--foreground))]">
                  {deploy.service}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                  v{deploy.version}
                </span>
              </div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {deploy.environment}
              </span>
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
              {timeAgo(deploy.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Revenue Summary Section                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function RevenueSummarySection({ data }: { data: RevenueOverview | null }) {
  if (!data) {
    return (
      <div>
        <SectionHeader title="Revenue" icon={DollarSign} />
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          Loading revenue data...
        </div>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div>
      <SectionHeader title="Revenue" icon={DollarSign} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            MRR
          </div>
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {formatCurrency(overview.mrr)}
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            ARR
          </div>
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {formatCurrency(overview.arr)}
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            Active Subs
          </div>
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {overview.activeSubscriptions}
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            Growth
          </div>
          <div
            className={`text-[20px] font-bold tabular-nums ${overview.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {overview.revenueGrowth >= 0 ? '+' : ''}
            {overview.revenueGrowth.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            Churn
          </div>
          <div
            className={`text-[20px] font-bold tabular-nums ${overview.churnRate > 5 ? 'text-red-400' : overview.churnRate > 2 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {overview.churnRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5">
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
            LTV
          </div>
          <div className="text-[20px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {formatCurrency(overview.ltv)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Incidents Section                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function IncidentsSection({
  incidents,
}: {
  incidents: SystemHealthData['incidents'];
}) {
  if (incidents.length === 0) {
    return (
      <div>
        <SectionHeader title="Incidents" icon={AlertTriangle} />
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-[12px] text-emerald-400">
            No active incidents
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Incidents" icon={AlertTriangle} />
      <div className="space-y-2">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${severityColor(inc.severity)}`}
          >
            {inc.severity === 'critical' ? (
              <XCircle className="h-4 w-4 shrink-0" />
            ) : inc.severity === 'warning' ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Activity className="h-4 w-4 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium truncate block">
                {inc.message}
              </span>
            </div>
            <span className="text-[10px] opacity-60 shrink-0 uppercase font-medium">
              {inc.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Connections Section                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function ConnectionsSection({ data }: { data: ConnectionReport | null }) {
  if (!data) {
    return (
      <div>
        <SectionHeader title="Connections" icon={Wifi} />
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))]">
          Checking connections...
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Connections" icon={Wifi} />
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[18px] font-bold text-[hsl(var(--foreground))] tabular-nums">
            {data.summary.total}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Total
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div className="text-[18px] font-bold text-emerald-400 tabular-nums">
            {data.summary.healthy}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Healthy
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div
            className={`text-[18px] font-bold tabular-nums ${data.summary.degraded > 0 ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'}`}
          >
            {data.summary.degraded}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Degraded
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-center">
          <div
            className={`text-[18px] font-bold tabular-nums ${data.summary.down > 0 ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`}
          >
            {data.summary.down}
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Down
          </div>
        </div>
      </div>

      {data.connections && data.connections.length > 0 && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden divide-y divide-white/[0.02]">
          {data.connections.map((conn) => (
            <div
              key={conn.name}
              className="flex items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--muted))] transition-colors duration-100"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDot(conn.status)}`}
              />
              <span className="text-[12px] text-[hsl(var(--foreground))] font-medium flex-1 truncate">
                {conn.name}
              </span>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
                {conn.latencyMs}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function SystemHealthPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data states
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [lanes, setLanes] = useState<ClaudeLane[]>([]);
  const [agentPools, setAgentPools] = useState<AgentPoolMetrics | null>(null);
  const [patrol, setPatrol] = useState<PatrolStatus | null>(null);
  const [deploys, setDeploys] = useState<DeployHistory | null>(null);
  const [revenue, setRevenue] = useState<RevenueOverview | null>(null);
  const [connections, setConnections] = useState<ConnectionReport | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled([
      // 0: System health
      api.get<SystemHealthData>('/api/admin/health'),
      // 1: Claude lanes
      api.get<ClaudeLane[]>('/api/admin/claude-lanes/lanes'),
      // 2: Agent pools
      api.get<AgentPoolMetrics>('/api/admin/agent-pools'),
      // 3: Patrol grid
      api.get<PatrolStatus>('/api/admin/patrol-grid/status'),
      // 4: Recent deploys
      api.get<DeployHistory>('/api/admin/deployments/history?limit=8'),
      // 5: Revenue
      api.get<RevenueOverview>('/api/admin/revenue-dashboard'),
      // 6: Connections
      api.get<ConnectionReport>('/api/admin/connections/check'),
    ]);

    // Process each result independently so partial failures don't block
    if (results[0].status === 'fulfilled' && results[0].value.data) {
      setHealth(results[0].value.data);
      setFetchError(null);
    } else if (results[0].status === 'fulfilled' && results[0].value.error) {
      setFetchError(results[0].value.error);
    }

    if (results[1].status === 'fulfilled' && results[1].value.data) {
      setLanes(Array.isArray(results[1].value.data) ? results[1].value.data : []);
    }

    if (results[2].status === 'fulfilled' && results[2].value.data) {
      const poolData = results[2].value.data as any;
      // The agent-pools endpoint returns { pools: [...], totals: {...} } via getAggregatedMetrics
      if (poolData && poolData.pools) {
        setAgentPools(poolData);
      } else if (poolData && Array.isArray(poolData)) {
        // Fallback if it returns an array
        const pools = poolData;
        const totals = {
          totalPools: pools.length,
          totalAgents: pools.reduce((s: number, p: any) => s + (p.totalAgents || 0), 0),
          activeAgents: pools.reduce((s: number, p: any) => s + (p.activeAgents || 0), 0),
          idleAgents: pools.reduce((s: number, p: any) => s + (p.idleAgents || 0), 0),
          errorAgents: pools.reduce((s: number, p: any) => s + (p.errorAgents || 0), 0),
        };
        setAgentPools({ pools, totals });
      }
    }

    if (results[3].status === 'fulfilled' && results[3].value.data) {
      setPatrol(results[3].value.data);
    }

    if (results[4].status === 'fulfilled' && results[4].value.data) {
      setDeploys(results[4].value.data);
    }

    if (results[5].status === 'fulfilled' && results[5].value.data) {
      setRevenue(results[5].value.data);
    }

    if (results[6].status === 'fulfilled' && results[6].value.data) {
      setConnections(results[6].value.data);
    }

    setLoading(false);
    setLastRefresh(new Date());
  }, [api]);

  // Initial fetch + 10s polling
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading && !health) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingGlobe size="lg" />
      </div>
    );
  }

  if (fetchError && !health) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-[13px] text-[hsl(var(--muted-foreground))]">{fetchError}</p>
          <button
            onClick={fetchAll}
            className="mt-4 text-[12px] text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.012] z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between relative z-10"
        style={{ animation: 'fadeInUp 300ms both' }}
      >
        <div>
          <h1 className="text-[22px] font-bold text-[hsl(var(--foreground))]">
            System Health
          </h1>
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">
            Entire system status in one view -- polling every 10s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200 group"
          >
            <RefreshCw className="h-3 w-3 transition-transform duration-200 group-hover:rotate-90" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {health && (
        <div style={{ animation: 'fadeInUp 300ms 50ms both' }}>
          <OverallStatusBanner status={health.overall} />
        </div>
      )}

      {/* Top metric cards */}
      {health && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          style={{ animation: 'fadeInUp 300ms 100ms both' }}
        >
          <MetricCard
            icon={Server}
            label="API Status"
            value={health.overall === 'operational' ? 'Healthy' : health.overall === 'degraded' ? 'Degraded' : 'Down'}
            status={health.overall}
          />
          <MetricCard
            icon={Zap}
            label="Claude Keys"
            value={`${lanes.filter((l) => l.status === 'available' || l.status === 'active' || l.status === 'ACTIVE').length}/${lanes.length}`}
            sub="active / total"
            status={lanes.length > 0 ? 'operational' : 'degraded'}
          />
          <MetricCard
            icon={Activity}
            label="Events (1h)"
            value={health.eventThroughput.lastHour}
            sub={`${health.eventThroughput.last24h.toLocaleString()} last 24h`}
          />
          <MetricCard
            icon={Users}
            label="Agents"
            value={agentPools?.totals.totalAgents ?? 0}
            sub={`${agentPools?.totals.activeAgents ?? 0} active`}
            status={agentPools && agentPools.totals.errorAgents > 0 ? 'warning' : 'operational'}
          />
        </div>
      )}

      {/* Incidents */}
      {health && health.incidents.length > 0 && (
        <div style={{ animation: 'fadeInUp 300ms 150ms both' }}>
          <IncidentsSection incidents={health.incidents} />
        </div>
      )}

      {/* Main two-column grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        style={{ animation: 'fadeInUp 300ms 200ms both' }}
      >
        {/* Left column */}
        <div className="space-y-6">
          {health && <ApiHealthSection services={health.services} />}
          <ClaudeLanesSection lanes={lanes} />
          <RevenueSummarySection data={revenue} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {health && <QueueDepthsSection queues={health.queues} />}
          <AgentPoolSection data={agentPools} />
        </div>
      </div>

      {/* Bottom three-column grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ animation: 'fadeInUp 300ms 300ms both' }}
      >
        <PatrolGridSection data={patrol} />
        <RecentDeploysSection data={deploys} />
        <ConnectionsSection data={connections} />
      </div>

      {/* No incidents banner (only show when there ARE no incidents and system is operational) */}
      {health && health.incidents.length === 0 && (
        <div style={{ animation: 'fadeInUp 300ms 350ms both' }}>
          <IncidentsSection incidents={[]} />
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
