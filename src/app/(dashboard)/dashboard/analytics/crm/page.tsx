'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Target, TrendingUp, Timer } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  BarChart,
  Skeleton,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PipelineStagePerformance {
  stage: string;
  deals: number;
  value: number;
  avgDays: number;
}

interface DealVelocityPoint {
  period: string;
  qualification: number;
  proposal: number;
  negotiation: number;
  closing: number;
}

interface WinLossTrendPoint {
  period: string;
  won: number;
  lost: number;
}

interface Salesperson {
  id: string;
  name: string;
  dealsClosed: number;
  revenue: number;
  winRate: number;
  avgDealSize: number;
}

interface CrmAnalyticsData {
  metrics: {
    dealsClosed: number;
    dealsClosedChange: number;
    revenue: number;
    revenueChange: number;
    winRate: number;
    winRateChange: number;
    avgDealSize: number;
    avgDealSizeChange: number;
  };
  pipelinePerformance: PipelineStagePerformance[];
  dealVelocity: DealVelocityPoint[];
  winLossTrend: WinLossTrendPoint[];
  topSalespeople: Salesperson[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function trendDir(v: number): 'up' | 'down' | 'flat' {
  if (v > 0) return 'up';
  if (v < 0) return 'down';
  return 'flat';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CrmAnalyticsPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<CrmAnalyticsData>({
    queryKey: ['analytics', 'crm'],
    queryFn: async () => {
      const res = await api.get<CrmAnalyticsData>('/api/analytics?module=crm');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const m = data?.metrics;

  return (
    <div className="space-y-8">
      <PageHeader
        title="CRM Analytics"
        subtitle="Pipeline performance, deal velocity, and sales insights"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'CRM' },
        ]}
      />

      {/* ---- Metric Tiles ---- */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <MetricTile
            label="Deals Closed"
            value={m?.dealsClosed?.toLocaleString() ?? '0'}
            change={m?.dealsClosedChange}
            trend={trendDir(m?.dealsClosedChange ?? 0)}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricTile
            label="Revenue"
            value={fmt(m?.revenue ?? 0)}
            change={m?.revenueChange}
            trend={trendDir(m?.revenueChange ?? 0)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricTile
            label="Win Rate"
            value={`${(m?.winRate ?? 0).toFixed(1)}%`}
            change={m?.winRateChange}
            trend={trendDir(m?.winRateChange ?? 0)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricTile
            label="Avg Deal Size"
            value={fmt(m?.avgDealSize ?? 0)}
            change={m?.avgDealSizeChange}
            trend={trendDir(m?.avgDealSizeChange ?? 0)}
            icon={<Timer className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ---- Pipeline Performance (Bar Chart) ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Pipeline Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton variant="card" />
          ) : data?.pipelinePerformance?.length ? (
            <BarChart
              data={data.pipelinePerformance}
              xKey="stage"
              yKey="value"
              series={[
                { key: 'deals', color: '#3b82f6', label: 'Deals' },
                { key: 'value', color: '#3b82f6', label: 'Value ($)' },
              ]}
              height={320}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No pipeline data available.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Deal Velocity (Line Chart) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Deal Velocity</CardTitle>
            <p className="text-xs text-muted-foreground">Avg days per stage over time</p>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" />
            ) : data?.dealVelocity?.length ? (
              <LineChart
                data={data.dealVelocity}
                xKey="period"
                yKey="qualification"
                series={[
                  { key: 'qualification', color: '#3b82f6', label: 'Qualification' },
                  { key: 'proposal', color: '#3b82f6', label: 'Proposal' },
                  { key: 'negotiation', color: '#f59e0b', label: 'Negotiation' },
                  { key: 'closing', color: '#10b981', label: 'Closing' },
                ]}
                height={280}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No velocity data available.</p>
            )}
          </CardContent>
        </Card>

        {/* ---- Win/Loss Trend (Line Chart -- 2 series) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Win / Loss Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" />
            ) : data?.winLossTrend?.length ? (
              <LineChart
                data={data.winLossTrend}
                xKey="period"
                yKey="won"
                series={[
                  { key: 'won', color: '#10b981', label: 'Won' },
                  { key: 'lost', color: '#3b82f6', label: 'Lost' },
                ]}
                height={280}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No win/loss data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Top Salespeople Table ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Top Salespeople</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton variant="table-row" count={5} />
          ) : data?.topSalespeople?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Name
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Deals Closed
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Revenue
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Win Rate
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Avg Deal Size
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.topSalespeople.map((sp) => (
                    <tr key={sp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-medium text-foreground tracking-tight">{sp.name}</td>
                      <td className="py-3.5 text-right text-foreground">{sp.dealsClosed}</td>
                      <td className="py-3.5 text-right font-medium text-emerald-400">
                        {fmt(sp.revenue)}
                      </td>
                      <td className="py-3.5 text-right text-foreground">{sp.winRate.toFixed(1)}%</td>
                      <td className="py-3.5 text-right text-foreground">{fmt(sp.avgDealSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No salespeople data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
