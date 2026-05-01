'use client';

import { useEffect, useState, useCallback } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const PERIODS = ['Today', '7d', '30d', '90d'] as const;
type Period = typeof PERIODS[number];

/* =========================================================================
   Types — real API response shapes
   ========================================================================= */

interface DashboardData {
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    change: number;
  };
  users: {
    total: number;
    new: number;
    active: number;
  };
  deals: {
    open: number;
    won: number;
    lost: number;
    pipeline_value: number;
  };
  commerce: {
    orders: number;
    revenue: number;
  };
  leads: {
    total: number;
    converted: number;
  };
  coaching: {
    enrollments: number;
    completions: number;
  };
}

interface TimelinePoint {
  date: string;
  label?: string;
  revenue?: number;
  value?: number;
}

interface EngineStats {
  crm?: number | { count?: number; total?: number; value?: number };
  commerce?: number | { count?: number; total?: number; value?: number };
  coaching?: number | { count?: number; total?: number; value?: number };
  leads?: number | { count?: number; total?: number; value?: number };
  seo?: number | { count?: number; total?: number; value?: number };
  [key: string]: unknown;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_dev_token') ||
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

function safe(n: unknown): number {
  const v = Number(n);
  return isFinite(v) ? v : 0;
}

function extractEngineValue(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    return safe(obj.count ?? obj.total ?? obj.value ?? 0);
  }
  return 0;
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtPct(n: number): string {
  if (n === 0) return '0%';
  const leads = safe(n);
  return `${leads.toFixed(1)}%`;
}

function displayOrDash(v: unknown, formatter: (n: number) => string = fmtNum): string {
  const n = Number(v);
  if (!isFinite(n)) return '--';
  return formatter(n);
}

function changeColor(change: number): string {
  if (change > 0) return '#22c55e';
  if (change < 0) return '#ef4444';
  return '#71717a';
}

function changeArrow(change: number): string {
  if (change > 0) return '+' + change + '%';
  if (change < 0) return String(change) + '%';
  return '0%';
}

function periodToParam(p: Period): string {
  if (p === 'Today') return '1d';
  return p;
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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      className={`rounded-xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  changeVal,
}: {
  label: string;
  value: string;
  sub?: string;
  changeVal?: number;
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-white text-2xl font-black leading-none tracking-tight">{value}</p>
      {sub && <p className="text-[11px] font-mono text-zinc-600">{sub}</p>}
      {changeVal !== undefined && (
        <p className="text-xs font-medium" style={{ color: changeColor(changeVal) }}>
          {changeVal > 0 ? '+' : ''}{changeVal}% vs prior
        </p>
      )}
    </Card>
  );
}

function SparkBars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="flex items-end gap-1 h-16 w-full">
      {points.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max((p.value / max) * 100, 4)}%`,
              background: 'linear-gradient(to top, #dc2626, #f97316)',
              opacity: 0.85,
              minHeight: '3px',
            }}
            title={`${p.label}: ${fmtCurrency(p.value)}`}
          />
          <span className="text-[9px] font-mono text-zinc-600 truncate w-full text-center">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-20 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono text-zinc-500 w-8 text-right shrink-0">{fmtNum(value)}</span>
    </div>
  );
}

/* =========================================================================
   Main component
   ========================================================================= */

export function AnalyticsPanel() {
  const [period, setPeriod] = useState<Period>('7d');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [timeline, setTimeline] = useState<{ label: string; value: number }[]>([]);
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);

    const param = periodToParam(p);

    const [dashRes, timelineRes, engineRes] = await Promise.all([
      apiFetch<DashboardData>(`/api/analytics/dashboard?period=${param}`),
      apiFetch<TimelinePoint[] | { points?: TimelinePoint[]; data?: TimelinePoint[] }>(
        `/api/analytics/timeline?period=${param}`
      ),
      apiFetch<EngineStats>(`/api/analytics/engine-stats?period=${param}`),
    ]);

    if (!dashRes) {
      setError(true);
    } else {
      setDashboard(dashRes);
    }

    if (timelineRes) {
      const raw: TimelinePoint[] = Array.isArray(timelineRes)
        ? timelineRes
        : ((timelineRes as { points?: TimelinePoint[]; data?: TimelinePoint[] }).points ??
          (timelineRes as { points?: TimelinePoint[]; data?: TimelinePoint[] }).data ??
          []);
      const mapped = raw.slice(-7).map((pt) => ({
        label: pt.label ?? new Date(pt.date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: safe(pt.revenue ?? pt.value ?? 0),
      }));
      setTimeline(mapped);
    } else {
      setTimeline([]);
    }

    setEngineStats(engineRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const d = dashboard;

  /* Derived engine bar data */
  const engineRows: { label: string; value: number; color: string }[] = (() => {
    if (!engineStats && !d) return [];
    const rows = [
      {
        label: 'CRM',
        value: engineStats
          ? extractEngineValue(engineStats.crm)
          : safe(d?.deals.open) + safe(d?.deals.won),
        color: '#dc2626',
      },
      {
        label: 'Commerce',
        value: engineStats
          ? extractEngineValue(engineStats.commerce)
          : safe(d?.commerce.orders),
        color: '#f97316',
      },
      {
        label: 'Coaching',
        value: engineStats
          ? extractEngineValue(engineStats.coaching)
          : safe(d?.coaching.enrollments),
        color: '#f59e0b',
      },
      {
        label: 'Leads',
        value: engineStats
          ? extractEngineValue(engineStats.leads)
          : safe(d?.leads.total),
        color: '#22c55e',
      },
      {
        label: 'SEO',
        value: engineStats ? extractEngineValue(engineStats.seo) : 0,
        color: '#3b82f6',
      },
    ];
    return rows;
  })();

  const engineMax = Math.max(...engineRows.map((r) => r.value), 1);

  /* Revenue hero values */
  const heroRevenue = d ? fmtCurrency(safe(d.revenue.total)) : '--';
  const heroChange = d ? safe(d.revenue.change) : 0;
  const heroChangeFmt = d ? changeArrow(heroChange) : '--';

  /* Lead conversion % */
  const convPct =
    d && safe(d.leads.total) > 0
      ? fmtPct((safe(d.leads.converted) / safe(d.leads.total)) * 100)
      : '--';

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-transparent text-zinc-100">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Analytics</span>
          {loading && (
            <span className="text-[10px] font-mono text-zinc-600 animate-pulse">loading...</span>
          )}
          {error && !loading && (
            <span className="text-[10px] font-mono text-red-600">API unreachable</span>
          )}
        </div>

        {/* Period tabs */}
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150"
              style={{
                background: period === p ? '#dc2626' : 'transparent',
                color: period === p ? '#fff' : '#71717a',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 space-y-6 min-h-0">

        {/* 1. Revenue Hero */}
        <section>
          <SectionHeader>Revenue</SectionHeader>
          <Card className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <p className="text-white text-4xl font-black leading-none tracking-tight">
                {heroRevenue}
              </p>
              <p
                className="text-sm font-mono font-semibold pb-0.5"
                style={{ color: changeColor(heroChange) }}
              >
                {heroChangeFmt}
              </p>
            </div>

            <div className="flex gap-4 text-[11px] font-mono text-zinc-500">
              <span>Today <span className="text-zinc-300">{d ? fmtCurrency(safe(d.revenue.today)) : '--'}</span></span>
              <span>This Week <span className="text-zinc-300">{d ? fmtCurrency(safe(d.revenue.thisWeek)) : '--'}</span></span>
              <span>This Month <span className="text-zinc-300">{d ? fmtCurrency(safe(d.revenue.thisMonth)) : '--'}</span></span>
            </div>

            {/* Sparkline */}
            {timeline.length > 0 && <SparkBars points={timeline} />}
          </Card>
        </section>

        {/* 2. Stats grid (2x3) */}
        <section>
          <SectionHeader>Overview</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="New Users"
              value={displayOrDash(d?.users.new)}
              sub={`${displayOrDash(d?.users.active)} active / ${displayOrDash(d?.users.total)} total`}
            />
            <MetricTile
              label="Open Deals"
              value={displayOrDash(d?.deals.open)}
              sub={`Pipeline ${d ? fmtCurrency(safe(d.deals.pipeline_value)) : '--'}`}
            />
            <MetricTile
              label="Orders"
              value={displayOrDash(d?.commerce.orders)}
              sub={`Revenue ${d ? fmtCurrency(safe(d.commerce.revenue)) : '--'}`}
            />
            <MetricTile
              label="Lead Conversions"
              value={convPct}
              sub={`${displayOrDash(d?.leads.converted)} of ${displayOrDash(d?.leads.total)}`}
            />
            <MetricTile
              label="Coaching Enrollments"
              value={displayOrDash(d?.coaching.enrollments)}
              sub={`${displayOrDash(d?.coaching.completions)} completions`}
            />
            <MetricTile
              label="Deals Won / Lost"
              value={`${displayOrDash(d?.deals.won)} / ${displayOrDash(d?.deals.lost)}`}
            />
          </div>
        </section>

        {/* 3. Engine breakdown */}
        <section>
          <SectionHeader>Engine Breakdown</SectionHeader>
          <Card className="space-y-3">
            {engineRows.map((r) => (
              <HorizontalBar
                key={r.label}
                label={r.label}
                value={r.value}
                max={engineMax}
                color={r.color}
              />
            ))}
            {engineRows.length === 0 && (
              <p className="text-xs text-zinc-600 font-mono text-center py-2">No engine data</p>
            )}
          </Card>
        </section>

        {/* 4. Timeline bar chart (last 7 days) */}
        {timeline.length > 0 && (
          <section>
            <SectionHeader>Revenue Timeline — Last 7 Days</SectionHeader>
            <Card>
              <div className="flex items-end gap-2 h-24">
                {timeline.map((pt, i) => {
                  const max = Math.max(...timeline.map((x) => x.value), 1);
                  const pct = Math.max((pt.value / max) * 100, 4);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                      <span className="text-[9px] font-mono text-zinc-600">
                        {fmtCurrency(pt.value)}
                      </span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${pct}%`,
                          background: 'linear-gradient(to top, #dc2626, #f97316)',
                          opacity: 0.8,
                          minHeight: '3px',
                        }}
                        title={`${pt.label}: ${fmtCurrency(pt.value)}`}
                      />
                      <span className="text-[9px] font-mono text-zinc-600 truncate w-full text-center">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

      </div>
    </div>
  );
}
