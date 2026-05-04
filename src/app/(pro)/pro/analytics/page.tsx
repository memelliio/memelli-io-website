'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  GitMerge,
  DollarSign,
  Percent,
  Clock,
  BarChart3,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProAnalytics {
  referrals: number;
  clients: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgOnboardingDays: number;
  stageCompletionRates: { stage: string; rate: number }[];
  trafficSources: { source: string; count: number; percentage: number }[];
  serviceAdoption: { service: string; count: number; percentage: number }[];
  topReferralLinks: { name: string; clicks: number; conversions: number; revenue: number }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <div className="rounded-xl bg-white/[0.04] p-1.5">
          <Icon
            className={color ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 text-primary'}
            style={color ? { color } : undefined}
          />
        </div>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-zinc-100">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal Bar                                                      */
/* ------------------------------------------------------------------ */

function HBar({ label, value, percentage, color }: { label: string; value: string; percentage: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-zinc-400">{label}</span>
      <div className="flex-1">
        <div className="h-5 w-full rounded-lg bg-white/[0.03]">
          <div
            className="h-5 rounded-lg transition-all duration-300"
            style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <span className="w-16 text-right text-xs font-medium text-white/70">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Date range presets                                                   */
/* ------------------------------------------------------------------ */

const dateRanges = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1y', value: '1y' },
  { label: 'All', value: 'all' },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProAnalyticsPage() {
  const api = useApi();
  const [range, setRange] = useState('30d');

  const { data: analytics, isLoading } = useQuery<ProAnalytics>({
    queryKey: ['pro-analytics', range],
    queryFn: async () => {
      const res = await api.get<ProAnalytics>(`/api/pro/analytics?range=${range}`);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load analytics');
      return res.data;
    },
    staleTime: 60_000,
  });

  const stageRates = analytics?.stageCompletionRates ?? [];
  const trafficSources = analytics?.trafficSources ?? [];
  const serviceAdoption = analytics?.serviceAdoption ?? [];
  const topLinks = analytics?.topReferralLinks ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Track your performance, pipeline, and referrals.</p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-1 backdrop-blur-xl">
          {dateRanges.map((d) => (
            <button
              key={d.value}
              onClick={() => setRange(d.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                range === d.value
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-zinc-400 hover:text-white/70'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Referrals" value={fmtNum(analytics?.referrals ?? 0)} icon={MousePointerClick} color="#3b82f6" />
          <StatCard label="Clients" value={fmtNum(analytics?.clients ?? 0)} icon={Users} color="#3b82f6" />
          <StatCard label="Conversions" value={fmtNum(analytics?.conversions ?? 0)} icon={GitMerge} color="#22c55e" />
          <StatCard label="Revenue" value={fmtCurrency(analytics?.revenue ?? 0)} icon={DollarSign} color="#f59e0b" />
          <StatCard label="Conv. Rate" value={`${(analytics?.conversionRate ?? 0).toFixed(1)}%`} icon={Percent} color="#06b6d4" />
          <StatCard label="Avg Onboarding" value={`${analytics?.avgOnboardingDays ?? 0}d`} icon={Clock} color="#f97316" />
        </div>
      )}

      {/* Pipeline metrics + Traffic sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stage completion rates */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <BarChart3 className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Stage Completion Rates</h3>
          </div>
          <div className="space-y-3 p-5">
            {stageRates.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No data yet.</p>
            ) : (
              stageRates.map((s) => (
                <HBar
                  key={s.stage}
                  label={s.stage}
                  value={`${s.rate.toFixed(0)}%`}
                  percentage={s.rate}
                  color="#ef4444"
                />
              ))
            )}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Traffic Sources</h3>
          </div>
          <div className="space-y-3 p-5">
            {trafficSources.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No traffic data yet.</p>
            ) : (
              trafficSources.map((s) => (
                <HBar
                  key={s.source}
                  label={s.source}
                  value={fmtNum(s.count)}
                  percentage={s.percentage}
                  color="#3b82f6"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Service adoption + Top referral links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Service adoption */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Service Adoption</h3>
          </div>
          <div className="space-y-3 p-5">
            {serviceAdoption.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No adoption data yet.</p>
            ) : (
              serviceAdoption.map((s) => (
                <HBar
                  key={s.service}
                  label={s.service}
                  value={fmtNum(s.count)}
                  percentage={s.percentage}
                  color="#22c55e"
                />
              ))
            )}
          </div>
        </div>

        {/* Top referral links */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
            <MousePointerClick className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Top Referral Links</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topLinks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No referral data yet.</p>
            ) : (
              topLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-bold text-zinc-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/70">{link.name}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>{fmtNum(link.clicks)} clicks</span>
                    <span>{link.conversions} conv</span>
                    <span className="font-medium text-emerald-400">{fmtCurrency(link.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
