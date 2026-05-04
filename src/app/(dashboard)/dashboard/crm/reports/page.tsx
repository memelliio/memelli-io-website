'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  LineChart,
  PieChart,
  Skeleton,
} from '@memelli/ui';
import {
  BarChart3,
  Clock,
  Trophy,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StageMetric {
  stage: string;
  deals: number;
  value: number;
  avgDays: number;
}

interface RevenueMonth {
  month: string;
  revenue: number;
  deals: number;
}

interface Performer {
  id: string;
  name: string;
  won: number;
  lost: number;
  revenue: number;
  winRate: number;
}

interface ReportsData {
  pipeline: StageMetric[];
  velocity: StageMetric[];
  winLoss: { label: string; value: number }[];
  revenueByMonth: RevenueMonth[];
  topPerformers: Performer[];
  summary: {
    totalDeals: number;
    totalRevenue: number;
    avgDealSize: number;
    overallWinRate: number;
  };
}

type DateRange = '7d' | '30d' | '90d' | 'all';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function extractData(raw: any): ReportsData {
  const d = raw?.data ?? raw ?? {};

  // Pipeline — deals by stage
  const pipeline: StageMetric[] = Array.isArray(d.pipeline)
    ? d.pipeline
    : Array.isArray(d.dealsByStage)
      ? d.dealsByStage.map((s: any) => ({
          stage: s.stageName ?? s.stage ?? s.name ?? 'Unknown',
          deals: s.count ?? s.deals ?? 0,
          value: s.value ?? 0,
          avgDays: s.avgDays ?? 0,
        }))
      : [];

  // Velocity — avg days per stage
  const velocity: StageMetric[] = Array.isArray(d.velocity)
    ? d.velocity
    : pipeline.map((s) => ({ ...s }));

  // Win/Loss
  const winLoss: { label: string; value: number }[] = Array.isArray(d.winLoss)
    ? d.winLoss
    : (() => {
        const won = d.summary?.wonDeals ?? d.wonDeals ?? 0;
        const lost = d.summary?.lostDeals ?? d.lostDeals ?? 0;
        const open = d.summary?.openDeals ?? d.openDeals ?? 0;
        const arr: { label: string; value: number }[] = [];
        if (won) arr.push({ label: 'Won', value: won });
        if (lost) arr.push({ label: 'Lost', value: lost });
        if (open) arr.push({ label: 'Open', value: open });
        return arr;
      })();

  // Revenue by month
  const revenueByMonth: RevenueMonth[] = Array.isArray(d.revenueByMonth)
    ? d.revenueByMonth
    : [];

  // Top performers
  const topPerformers: Performer[] = Array.isArray(d.topPerformers)
    ? d.topPerformers
    : [];

  // Summary
  const summary = d.summary ?? {
    totalDeals: pipeline.reduce((s, p) => s + p.deals, 0),
    totalRevenue: pipeline.reduce((s, p) => s + p.value, 0),
    avgDealSize: 0,
    overallWinRate: 0,
  };

  return { pipeline, velocity, winLoss, revenueByMonth, topPerformers, summary };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CRMReportsPage() {
  const api = useApi();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { data, isLoading } = useQuery<ReportsData>({
    queryKey: ['crm', 'reports', dateRange],
    queryFn: async () => {
      const [prRes, stRes, actRes] = await Promise.all([
        api.get<any>(`/api/crm/reports/pipeline-report?range=${dateRange}`),
        api.get<any>(`/api/crm/reports/deals-by-stage?range=${dateRange}`),
        api.get<any>(`/api/crm/reports/activity-report?range=${dateRange}`),
      ]);
      // Merge all three responses into a unified shape
      const pr = prRes.data?.data ?? prRes.data ?? {};
      const st = stRes.data?.data ?? stRes.data ?? {};
      const act = actRes.data?.data ?? actRes.data ?? {};
      return extractData({ ...pr, ...st, ...act, dealsByStage: st });
    },
  });

  const {
    pipeline = [],
    velocity = [],
    winLoss = [],
    revenueByMonth = [],
    topPerformers = [],
    summary = { totalDeals: 0, totalRevenue: 0, avgDealSize: 0, overallWinRate: 0 },
  } = data ?? {};

  /* ------ Skeleton state ------ */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-card space-y-8 p-8">
        <Skeleton variant="line" className="h-8 w-64 bg-card" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-80 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card space-y-8 p-8">
      {/* Header + date range */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="CRM Reports"
          subtitle="Pipeline performance, deal velocity, and win/loss analysis"
        />
        <div className="flex bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-xs font-medium tracking-wider transition-all duration-200 ${
                dateRange === range
                  ? 'bg-primary/80/[0.08] text-primary/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Deals', value: summary.totalDeals.toLocaleString(), icon: BarChart3, accent: 'text-primary' },
          { label: 'Total Revenue', value: fmt(summary.totalRevenue), icon: DollarSign, accent: 'text-emerald-400' },
          { label: 'Avg Deal Size', value: fmt(summary.avgDealSize), icon: TrendingUp, accent: 'text-blue-400' },
          { label: 'Win Rate', value: `${summary.overallWinRate}%`, icon: Trophy, accent: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10">
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                <p className={`text-xl font-semibold tracking-tight ${stat.accent}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Pipeline Performance — deals by stage */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline Performance
            </h3>
          </div>
          <div className="p-6">
            {pipeline.length > 0 ? (
              <BarChart
                data={pipeline}
                xKey="stage"
                yKey="deals"
                color="#3b82f6"
                height={280}
              />
            ) : (
              <p className="py-12 text-center text-muted-foreground leading-relaxed">No pipeline data available.</p>
            )}
          </div>
        </div>

        {/* 2. Deal Velocity — avg days per stage */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <Clock className="h-5 w-5 text-blue-400" />
              Deal Velocity
            </h3>
          </div>
          <div className="p-6">
            {velocity.length > 0 ? (
              <BarChart
                data={velocity}
                xKey="stage"
                yKey="avgDays"
                color="#3b82f6"
                height={280}
              />
            ) : (
              <p className="py-12 text-center text-muted-foreground leading-relaxed">No velocity data available.</p>
            )}
          </div>
        </div>

        {/* 3. Win/Loss Ratio — pie chart */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <Trophy className="h-5 w-5 text-amber-400" />
              Win / Loss Ratio
            </h3>
          </div>
          <div className="p-6">
            {winLoss.length > 0 ? (
              <PieChart
                data={winLoss}
                xKey="label"
                yKey="value"
                colors={['#10b981', '#3b82f6', '#f59e0b']}
                donut
                height={280}
              />
            ) : (
              <p className="py-12 text-center text-muted-foreground leading-relaxed">No win/loss data available.</p>
            )}
          </div>
        </div>

        {/* 4. Revenue by Month — line chart */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Revenue by Month
            </h3>
          </div>
          <div className="p-6">
            {revenueByMonth.length > 0 ? (
              <LineChart
                data={revenueByMonth}
                xKey="month"
                yKey="revenue"
                color="#3b82f6"
                height={280}
              />
            ) : (
              <p className="py-12 text-center text-muted-foreground leading-relaxed">No revenue data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Top Performers table */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Top Performers
          </h3>
        </div>
        <div className="p-6">
          {topPerformers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4 text-right">Won</th>
                    <th className="pb-3 pr-4 text-right">Lost</th>
                    <th className="pb-3 pr-4 text-right">Win Rate</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {topPerformers.map((p, i) => (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary/80">
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-right text-emerald-400 font-medium">{p.won}</td>
                      <td className="py-3.5 pr-4 text-right text-primary font-medium">{p.lost}</td>
                      <td className="py-3.5 pr-4 text-right">
                        <span
                          className={`font-semibold ${
                            p.winRate >= 60
                              ? 'text-emerald-400'
                              : p.winRate >= 40
                                ? 'text-amber-400'
                                : 'text-primary'
                          }`}
                        >
                          {p.winRate}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-foreground">
                        {fmt(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground leading-relaxed">No performer data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}