'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  MousePointerClick,
  UserPlus,
  Percent,
  Users,
  ArrowRightLeft,
  TrendingUp,
  Download,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface DailyPoint {
  date: string;
  clicks: number;
  signups: number;
  conversionRate: number;
}

interface MetricsSummary {
  clicks: number;
  uniqueVisitors: number;
  signups: number;
  conversions: number;
  conversionRate: number;
}

interface TopLinkPerf {
  id: string;
  name: string;
  clicks: number;
  signups: number;
  conversions: number;
  convRate: number;
}

interface TopAssetPerf {
  id: string;
  name: string;
  downloads: number;
}

interface AnalyticsData {
  daily: DailyPoint[];
  summary: MetricsSummary;
  topLinks: TopLinkPerf[];
  topAssets: TopAssetPerf[];
}

/* ------------------------------------------------------------------ */
/*  Date range presets                                                  */
/* ------------------------------------------------------------------ */

type RangeKey = '7d' | '30d' | '90d' | 'all';

const ranges: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

/* ------------------------------------------------------------------ */
/*  Simple bar chart                                                    */
/* ------------------------------------------------------------------ */

function BarChart({
  data,
  dataKey,
  color,
  label,
  formatValue,
}: {
  data: DailyPoint[];
  dataKey: keyof DailyPoint;
  color: string;
  label: string;
  formatValue?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => Number(d[dataKey]) || 0), 1);
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-zinc-100">{label}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">No data available.</p>
      ) : (
        <div className="flex items-end gap-1" style={{ height: '160px' }}>
          {data.map((d, i) => {
            const val = Number(d[dataKey]) || 0;
            const pct = (val / maxVal) * 100;
            return (
              <div
                key={i}
                className="group relative flex-1"
                style={{ height: '100%' }}
              >
                <div
                  className={`absolute bottom-0 w-full rounded-t-sm ${color} opacity-60 transition-all duration-200 hover:opacity-90`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/[0.06] bg-zinc-900/90 backdrop-blur-xl px-2.5 py-1.5 text-[10px] text-zinc-400 shadow-2xl group-hover:block">
                  <p className="font-medium text-zinc-100">{d.date}</p>
                  <p>{fmt(val)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-white/15">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const api = useApi();
  const [range, setRange] = useState<RangeKey>('30d');

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['lite-analytics', range],
    queryFn: async () => {
      const res = await api.get<AnalyticsData>(`/api/lite/analytics?range=${range}`);
      if (res.error || !res.data) {
        return { daily: [], summary: { clicks: 0, uniqueVisitors: 0, signups: 0, conversions: 0, conversionRate: 0 }, topLinks: [], topAssets: [] };
      }
      return res.data;
    },
    staleTime: 60_000,
  });

  const { daily, summary, topLinks, topAssets } = analytics ?? {
    daily: [],
    summary: { clicks: 0, uniqueVisitors: 0, signups: 0, conversions: 0, conversionRate: 0 },
    topLinks: [],
    topAssets: [],
  };

  const summaryMetrics = useMemo(() => [
    { label: 'Clicks', value: summary.clicks.toLocaleString(), icon: MousePointerClick },
    { label: 'Unique Visitors', value: summary.uniqueVisitors.toLocaleString(), icon: Users },
    { label: 'Signups', value: summary.signups.toLocaleString(), icon: UserPlus },
    { label: 'Conversions', value: summary.conversions.toLocaleString(), icon: ArrowRightLeft },
    { label: 'Conv. Rate', value: `${summary.conversionRate.toFixed(1)}%`, icon: Percent },
  ], [summary]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Track your referral performance over time.</p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-1">
          <Calendar className="ml-2 h-3.5 w-3.5 text-zinc-400" />
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                range === r.key
                  ? 'bg-primary/20 text-primary shadow-sm'
                  : 'text-zinc-400 hover:text-white/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {summaryMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{m.label}</span>
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="mt-2 text-lg font-bold tracking-tight text-zinc-100">{m.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChart data={daily} dataKey="clicks" color="bg-blue-400" label="Clicks Over Time" />
        <BarChart data={daily} dataKey="signups" color="bg-emerald-400" label="Signups Over Time" />
        <BarChart
          data={daily}
          dataKey="conversionRate"
          color="bg-red-400"
          label="Conversion Rate Trend"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Links */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Top Links Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">Link</th>
                  <th className="px-5 py-3 text-right">Clicks</th>
                  <th className="px-5 py-3 text-right">Signups</th>
                  <th className="px-5 py-3 text-right">Conv.</th>
                  <th className="px-5 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {topLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-400">No data.</td>
                  </tr>
                ) : (
                  topLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-5 py-3 font-medium text-white/70">{link.name}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{link.clicks.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{link.signups.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{link.conversions.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{link.convRate.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Assets */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <Download className="h-4 w-4 text-emerald-400/70" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Top Assets by Downloads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3 text-right">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {topAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-zinc-400">No data.</td>
                  </tr>
                ) : (
                  topAssets.map((asset, i) => (
                    <tr key={asset.id} className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-5 py-3 text-zinc-400">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-white/70">{asset.name}</td>
                      <td className="px-5 py-3 text-right text-zinc-400">{asset.downloads.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
