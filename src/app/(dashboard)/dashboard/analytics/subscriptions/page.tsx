'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, TrendingDown, Users,
  ArrowUpRight, ArrowDownRight, Download, Zap, Crown,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

// ─── Types — matches GET /api/admin/revenue-dashboard response ────────────────

interface RevOverview {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  revenueGrowth: number;
  churnRate: number;
  ltv: number;
}

interface TierBucket {
  tier: string;
  count: number;
  mrr: number;
  percentOfTotal: number;
  color: string;
}

interface RevenueStream {
  id: string;
  name: string;
  revenue: number;
  previousRevenue: number;
  growth: number;
  icon: string;
  detail: string;
  sparkline: number[];
}

interface RevDashboard {
  overview: RevOverview;
  subscriptionTiers: TierBucket[];
  streams: RevenueStream[];
  pipeline: { name: string; count: number; conversionRate: number }[];
  forecast: {
    currentMonth: number;
    nextMonths: { month: string; projected: number }[];
    milestones: { label: string; target: number; current: number }[];
  };
  costs: {
    items: { name: string; amount: number }[];
    totalCosts: number;
    totalRevenue: number;
    margin: number;
    burnRate: number;
    runwayMonths: number;
  };
  opportunities: {
    title: string;
    description: string;
    estimatedValue: number;
    type: string;
  }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: '7d',  label: '7D'  },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '6m',  label: '6M'  },
  { id: '1y',  label: '1Y'  },
  { id: 'all', label: 'All' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-muted ${className}`} />
  );
}

// ─── Metric Tile ─────────────────────────────────────────────────────────────

function Tile({
  label, value, sub, icon, accent = 'zinc',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'red' | 'zinc' | 'amber' | 'sky' | 'violet';
}) {
  const accentMap = {
    emerald: 'text-emerald-400',
    red:     'text-red-400',
    zinc:    'text-foreground',
    amber:   'text-amber-400',
    sky:     'text-sky-400',
    violet:  'text-violet-400',
  };

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── SVG MRR Sparkline (tier breakdown bar chart) ────────────────────────────

function TierBarChart({ tiers }: { tiers: TierBucket[] }) {
  const maxMrr = Math.max(...tiers.map((t) => t.mrr), 1);

  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <div key={t.tier}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground font-medium">{t.tier}</span>
            <span className="text-foreground tabular-nums">
              {t.count} subs · {t.mrr > 0 ? fmt(t.mrr) : '--'} MRR · {t.percentOfTotal}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxMrr > 0 ? (t.mrr / maxMrr) * 100 : 0}%`,
                backgroundColor: t.color || '#3b82f6',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Forecast Table ───────────────────────────────────────────────────────────

function ForecastSection({ forecast }: { forecast: RevDashboard['forecast'] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Next months projection */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Revenue Forecast</h2>
        <p className="text-xs text-muted-foreground mb-5">Projected MRR for next 3 months</p>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground pb-2 border-b border-white/[0.06]">
            <span>Month</span>
            <span>Projected MRR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="text-violet-400 font-semibold tabular-nums">{fmt(forecast.currentMonth)}</span>
          </div>
          {forecast.nextMonths.map((m) => (
            <div key={m.month} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{m.month}</span>
              <span className="text-emerald-400 font-semibold tabular-nums">{fmt(m.projected)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">MRR Milestones</h2>
        <p className="text-xs text-muted-foreground mb-5">Progress toward key revenue goals</p>
        <div className="space-y-4">
          {forecast.milestones.map((ms) => {
            const progress = ms.target > 0 ? Math.min((ms.current / ms.target) * 100, 100) : 0;
            return (
              <div key={ms.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{ms.label}</span>
                  <span className="text-foreground tabular-nums">{fmt(ms.current)} / {fmt(ms.target)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{progress.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Cost / Margin ────────────────────────────────────────────────────────────

function CostSection({ costs }: { costs: RevDashboard['costs'] }) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Cost & Margin</h2>
      <p className="text-xs text-muted-foreground mb-5">Monthly infrastructure and operating costs</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Revenue</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{fmt(costs.totalRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Total Costs</p>
          <p className="text-xl font-bold text-red-400 tabular-nums">{fmt(costs.totalCosts)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Margin</p>
          <p className={`text-xl font-bold tabular-nums ${costs.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {costs.margin.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Runway</p>
          <p className="text-xl font-bold text-amber-400 tabular-nums">{costs.runwayMonths}mo</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Item</th>
              <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Monthly</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {costs.items.map((item) => (
              <tr key={item.name} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 text-foreground">{item.name}</td>
                <td className="py-3 text-right text-red-400 tabular-nums font-semibold">{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Export CSV ──────────────────────────────────────────────────────────────

function exportCSV(data: RevDashboard) {
  const lines: string[] = [];

  lines.push('--- Overview ---');
  lines.push('Metric,Value');
  lines.push(`MRR,${data.overview.mrr}`);
  lines.push(`ARR,${data.overview.arr}`);
  lines.push(`Active Subscribers,${data.overview.activeSubscriptions}`);
  lines.push(`Revenue Growth %,${data.overview.revenueGrowth}`);
  lines.push(`Churn Rate %,${data.overview.churnRate}`);
  lines.push(`LTV,${data.overview.ltv}`);

  lines.push('');
  lines.push('--- Tier Breakdown ---');
  lines.push('Tier,Count,MRR,% of Total');
  data.subscriptionTiers.forEach((t) => {
    lines.push(`${t.tier},${t.count},${t.mrr},${t.percentOfTotal}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subscription-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubscriptionAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const api = useApi();

  const { data, isLoading, isError } = useQuery<RevDashboard>({
    queryKey: ['analytics', 'revenue-dashboard'],
    queryFn: async () => {
      const res = await api.get<RevDashboard>('/api/admin/revenue-dashboard');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const overview = data?.overview;
  const tiers = data?.subscriptionTiers ?? [];

  const handleExport = useCallback(() => {
    if (data) exportCSV(data);
  }, [data]);

  return (
    <div className="min-h-screen bg-card px-6 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Subscription Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">MRR, churn, retention, and subscriber lifecycle</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-1 rounded-xl bg-card border border-white/[0.04] p-1">
            {DATE_RANGES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === d.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-white/[0.04] hover:border-white/[0.08] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-red-400 mb-6">Failed to load subscription data. Please try again.</p>
      )}

      {/* ── Top Metric Tiles ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <Tile
            label="Current MRR"
            value={fmt(overview?.mrr ?? 0)}
            sub={`${(overview?.revenueGrowth ?? 0) >= 0 ? '+' : ''}${(overview?.revenueGrowth ?? 0).toFixed(1)}% vs last month`}
            icon={<DollarSign className="h-4 w-4" />}
            accent="emerald"
          />
          <Tile
            label="Active Subscribers"
            value={(overview?.activeSubscriptions ?? 0).toLocaleString()}
            icon={<Users className="h-4 w-4" />}
            accent="sky"
          />
          <Tile
            label="Churn Rate"
            value={pct(overview?.churnRate ?? 0)}
            sub={(overview?.churnRate ?? 0) <= 4 ? 'Healthy' : 'Needs attention'}
            icon={<TrendingDown className="h-4 w-4" />}
            accent={(overview?.churnRate ?? 0) <= 4 ? 'emerald' : 'red'}
          />
          <Tile
            label="ARR"
            value={fmt(overview?.arr ?? 0)}
            sub="Annual run rate"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="violet"
          />
        </div>
      )}

      {/* ── Secondary Metrics ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <Tile
            label="LTV"
            value={fmt(overview?.ltv ?? 0)}
            sub="Customer lifetime value"
            icon={<Crown className="h-4 w-4" />}
            accent="emerald"
          />
          <Tile
            label="Revenue Growth"
            value={`${(overview?.revenueGrowth ?? 0) >= 0 ? '+' : ''}${pct(overview?.revenueGrowth ?? 0)}`}
            sub="Month over month"
            icon={(overview?.revenueGrowth ?? 0) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            accent={(overview?.revenueGrowth ?? 0) >= 0 ? 'emerald' : 'red'}
          />
          <Tile
            label="Active Tiers"
            value={tiers.filter((t) => t.count > 0).length.toString()}
            sub="Subscription tiers with members"
            icon={<Zap className="h-4 w-4" />}
            accent="amber"
          />
          <Tile
            label="Paid Subscribers"
            value={tiers.filter((t) => t.mrr > 0).reduce((s, t) => s + t.count, 0).toLocaleString()}
            sub="Excluding free/trial tiers"
            icon={<Users className="h-4 w-4" />}
            accent="violet"
          />
        </div>
      )}

      {/* ── Tier Breakdown ── */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Subscription Tier Breakdown</h2>
        <p className="text-xs text-muted-foreground mb-5">Active subscribers and MRR contribution by tier</p>
        {isLoading ? (
          <SkeletonBlock className="h-40" />
        ) : !tiers.length ? (
          <p className="text-sm text-muted-foreground">No subscription data available.</p>
        ) : (
          <>
            <TierBarChart tiers={tiers} />
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Tier</th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Subscribers</th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">MRR</th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">% of Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {tiers.map((t) => (
                    <tr key={t.tier} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/[0.04] bg-muted text-foreground"
                          style={{ borderColor: t.color + '44' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.tier}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{t.count.toLocaleString()}</td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400 tabular-nums">
                        {t.mrr > 0 ? fmt(t.mrr) : '--'}
                      </td>
                      <td className="py-3.5 text-right text-muted-foreground tabular-nums">{t.percentOfTotal}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Revenue Streams ── */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Revenue Streams</h2>
        <p className="text-xs text-muted-foreground mb-5">All revenue sources and their performance</p>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-16" />
            ))}
          </div>
        ) : !data?.streams?.length ? (
          <p className="text-sm text-muted-foreground">No stream data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Stream</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Growth</th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground pl-6">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.streams.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-medium text-foreground">{s.name}</td>
                    <td className="py-3.5 text-right font-semibold text-emerald-400 tabular-nums">
                      {s.revenue > 0 ? fmt(s.revenue) : '--'}
                    </td>
                    <td className="py-3.5 text-right tabular-nums">
                      {s.revenue > 0 ? (
                        <span className={s.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {s.growth >= 0 ? '+' : ''}{s.growth.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-6 text-muted-foreground text-xs">{s.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Forecast + Milestones ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
      ) : data?.forecast ? (
        <div className="mb-6">
          <ForecastSection forecast={data.forecast} />
        </div>
      ) : null}

      {/* ── Cost & Margin ── */}
      {isLoading ? (
        <SkeletonBlock className="h-64 mb-6" />
      ) : data?.costs ? (
        <div className="mb-6">
          <CostSection costs={data.costs} />
        </div>
      ) : null}

      {/* ── Opportunities ── */}
      {!isLoading && data?.opportunities?.length ? (
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Revenue Opportunities</h2>
          <p className="text-xs text-muted-foreground mb-5">Detected growth levers based on live data</p>
          <div className="space-y-3">
            {data.opportunities.map((op, i) => (
              <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted border border-white/[0.04]">
                <div>
                  <p className="text-sm font-medium text-foreground">{op.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{op.description}</p>
                </div>
                {op.estimatedValue > 0 && (
                  <span className="shrink-0 text-sm font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                    +{fmt(op.estimatedValue)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
