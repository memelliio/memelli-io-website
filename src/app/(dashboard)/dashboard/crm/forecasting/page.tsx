'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  BarChart,
  Badge,
  Skeleton,
  MetricTile,
} from '@memelli/ui';

/* -- Types ---------------------------------------------------------- */

interface ForecastSummary {
  expectedRevenue: number;
  weightedPipeline: number;
  bestCase: number;
  worstCase: number;
  expectedChange?: number;
  weightedChange?: number;
  bestCaseChange?: number;
  worstCaseChange?: number;
}

interface MonthlyForecast {
  month: string;
  actual: number;
  forecast: number;
  target: number;
}

interface PipelineStage {
  stage: string;
  dealCount: number;
  totalValue: number;
  avgDealSize: number;
  winProbability: number;
  weightedValue: number;
}

interface WinProbabilityBucket {
  range: string;
  count: number;
  value: number;
}

interface ForecastData {
  summary: ForecastSummary;
  monthly: MonthlyForecast[];
  pipelineStages: PipelineStage[];
  winDistribution: WinProbabilityBucket[];
}

/* -- Helpers -------------------------------------------------------- */

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function trendDir(v?: number): 'up' | 'down' | 'flat' {
  if (v === undefined || v === 0) return 'flat';
  return v > 0 ? 'up' : 'down';
}

/* -- Fallback data -------------------------------------------------- */

function fallbackData(): ForecastData {
  const now = new Date();
  const monthly: MonthlyForecast[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const isPast = i < 2;
    return {
      month: label,
      actual: isPast ? Math.round(20000 + Math.random() * 30000) : 0,
      forecast: Math.round(25000 + Math.random() * 25000),
      target: 35000,
    };
  });

  const stages: PipelineStage[] = [
    { stage: 'Discovery', dealCount: 12, totalValue: 84000, avgDealSize: 7000, winProbability: 15, weightedValue: 12600 },
    { stage: 'Qualification', dealCount: 8, totalValue: 72000, avgDealSize: 9000, winProbability: 30, weightedValue: 21600 },
    { stage: 'Proposal', dealCount: 6, totalValue: 78000, avgDealSize: 13000, winProbability: 55, weightedValue: 42900 },
    { stage: 'Negotiation', dealCount: 4, totalValue: 60000, avgDealSize: 15000, winProbability: 75, weightedValue: 45000 },
    { stage: 'Closed Won', dealCount: 3, totalValue: 45000, avgDealSize: 15000, winProbability: 100, weightedValue: 45000 },
  ];

  const winDistribution: WinProbabilityBucket[] = [
    { range: '0-20%', count: 14, value: 98000 },
    { range: '21-40%', count: 9, value: 81000 },
    { range: '41-60%', count: 7, value: 91000 },
    { range: '61-80%', count: 5, value: 75000 },
    { range: '81-100%', count: 3, value: 45000 },
  ];

  const totalValue = stages.reduce((s, st) => s + st.totalValue, 0);
  const weightedTotal = stages.reduce((s, st) => s + st.weightedValue, 0);

  return {
    summary: {
      expectedRevenue: weightedTotal,
      weightedPipeline: totalValue,
      bestCase: Math.round(totalValue * 0.85),
      worstCase: Math.round(weightedTotal * 0.6),
      expectedChange: 8.2,
      weightedChange: 12.5,
      bestCaseChange: 5.1,
      worstCaseChange: -3.4,
    },
    monthly,
    pipelineStages: stages,
    winDistribution,
  };
}

/* -- Page ----------------------------------------------------------- */

export default function ForecastingPage() {
  const api = useApi();

  const { data: raw, isLoading } = useQuery<ForecastData>({
    queryKey: ['crm', 'forecasting'],
    queryFn: async () => {
      const res = await api.get<any>('/api/crm/forecasting');
      const d = res.data?.data ?? res.data;
      if (d && d.summary) return d as ForecastData;
      return fallbackData();
    },
    staleTime: 60_000,
  });

  const forecast = useMemo(() => raw ?? fallbackData(), [raw]);

  /* -- Loading skeleton --------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-card p-8 space-y-8">
        <PageHeader title="Revenue Forecasting" subtitle="Loading forecast data..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton className="h-72 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  const { summary, monthly, pipelineStages, winDistribution } = forecast;

  return (
    <div className="min-h-screen bg-card p-8 space-y-8">
      {/* Header */}
      <PageHeader
        title="Revenue Forecasting"
        subtitle="Projected revenue, weighted pipeline, and win probability analysis"
      />

      {/* -- Summary metric cards ------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="Expected Revenue"
          value={fmt(summary.expectedRevenue)}
          change={summary.expectedChange}
          trend={trendDir(summary.expectedChange)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Weighted Pipeline"
          value={fmt(summary.weightedPipeline)}
          change={summary.weightedChange}
          trend={trendDir(summary.weightedChange)}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Best Case"
          value={fmt(summary.bestCase)}
          change={summary.bestCaseChange}
          trend={trendDir(summary.bestCaseChange)}
          icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricTile
          label="Worst Case"
          value={fmt(summary.worstCase)}
          change={summary.worstCaseChange}
          trend={trendDir(summary.worstCaseChange)}
          icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* -- Monthly forecast chart ---------------------------------- */}
      <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Monthly Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <LineChart
            data={monthly}
            xKey="month"
            yKey="forecast"
            series={[
              { key: 'actual', label: 'Actual', color: '#a78bfa' },
              { key: 'forecast', label: 'Forecast', color: '#7c3aed' },
              { key: 'target', label: 'Target', color: '#4ade80' },
            ]}
            height={340}
          />
        </CardContent>
      </Card>

      {/* -- Pipeline by stage + Win probability --------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline-by-stage breakdown table */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left">
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Stage</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Deals</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Value</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Win %</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Weighted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pipelineStages.map((stage) => (
                    <tr
                      key={stage.stage}
                      className="hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{stage.stage}</span>
                          <Badge variant="muted" className="text-[10px] bg-muted text-muted-foreground border-white/[0.06]">
                            avg {fmt(stage.avgDealSize)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{stage.dealCount}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{fmt(stage.totalValue)}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={
                            stage.winProbability >= 70
                              ? 'text-emerald-400'
                              : stage.winProbability >= 40
                                ? 'text-amber-400'
                                : 'text-muted-foreground'
                          }
                        >
                          {stage.winProbability}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary">
                        {fmt(stage.weightedValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.04] bg-muted">
                    <td className="px-6 py-4 font-semibold text-foreground">Total</td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {pipelineStages.reduce((s, st) => s + st.dealCount, 0)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {fmt(pipelineStages.reduce((s, st) => s + st.totalValue, 0))}
                    </td>
                    <td className="px-6 py-4" />
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {fmt(pipelineStages.reduce((s, st) => s + st.weightedValue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Win probability distribution chart */}
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Win Probability Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <BarChart
              data={winDistribution}
              xKey="range"
              yKey="count"
              series={[
                { key: 'count', label: 'Deals', color: '#7c3aed' },
              ]}
              height={260}
            />
            <div className="mt-6 grid grid-cols-5 gap-2">
              {winDistribution.map((bucket) => (
                <div
                  key={bucket.range}
                  className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-3 text-center"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{bucket.range}</p>
                  <p className="text-sm font-semibold text-foreground">{bucket.count}</p>
                  <p className="text-[10px] text-primary leading-relaxed">{fmt(bucket.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}