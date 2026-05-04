'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
} from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  LineChart,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FunnelStep {
  stage: string;
  count: number;
}

interface SourceROIItem {
  source: string;
  leads: number;
  cost: number;
}

interface ScoreBucket {
  range: string;
  count: number;
}

interface MonthlyTrendPoint {
  month: string;
  leads: number;
  converted: number;
}

interface AnalyticsData {
  metrics: {
    totalLeads: number;
    conversionRate: number;
    avgScore: number;
    costPerLead: number;
    leadsTrend: 'up' | 'down' | 'flat';
    leadsChange: number;
    conversionTrend: 'up' | 'down' | 'flat';
    conversionChange: number;
    scoreTrend: 'up' | 'down' | 'flat';
    scoreChange: number;
    cplTrend: 'up' | 'down' | 'flat';
    cplChange: number;
  };
  funnel: FunnelStep[];
  sourceROI: SourceROIItem[];
  scoreDistribution: ScoreBucket[];
  monthlyTrend: MonthlyTrendPoint[];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LeadAnalyticsPage() {
  const api = useApi();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['lead-analytics'],
    queryFn: async () => {
      const res = await api.get<AnalyticsData>('/api/leads/analytics');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Leads Analytics"
        subtitle="Funnel performance, source ROI, scoring distribution, and trends"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Analytics' },
        ]}
        className="mb-8"
      />

      {isLoading ? <LoadingSkeleton /> : analytics ? <AnalyticsDashboard analytics={analytics} /> : <EmptyAnalytics />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyAnalytics() {
  return (
    <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="py-16 text-center">
        <Target className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground tracking-tight">No analytics data yet. Analytics will populate once you have leads.</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

function AnalyticsDashboard({ analytics }: { analytics: AnalyticsData }) {
  const { metrics, funnel, sourceROI, scoreDistribution, monthlyTrend } = analytics;

  /* Transform data for charts */
  const funnelData = funnel.map((s) => ({ label: s.stage, value: s.count }));

  const sourceData = sourceROI.map((s) => ({
    label: s.source,
    leads: s.leads,
    cost: s.cost,
  }));

  const scoreData = scoreDistribution.map((b) => ({ label: b.range, value: b.count }));

  const trendData = monthlyTrend.map((m) => ({
    label: m.month,
    leads: m.leads,
    converted: m.converted,
  }));

  return (
    <div className="space-y-8">
      {/* ---- Metric Tiles ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricTile
          label="Total Leads"
          value={metrics.totalLeads.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          trend={metrics.leadsTrend}
          change={metrics.leadsChange}
        />
        <MetricTile
          label="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={metrics.conversionTrend}
          change={metrics.conversionChange}
        />
        <MetricTile
          label="Avg Score"
          value={metrics.avgScore.toFixed(0)}
          icon={<Target className="h-4 w-4" />}
          trend={metrics.scoreTrend}
          change={metrics.scoreChange}
        />
        <MetricTile
          label="Cost Per Lead"
          value={`$${metrics.costPerLead.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={metrics.cplTrend}
          change={metrics.cplChange}
        />
      </div>

      {/* ---- Row 1: Funnel + Source ROI ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="tracking-tight">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={funnelData}
              xKey="label"
              yKey="value"
              color="#3b82f6"
              height={320}
            />
          </CardContent>
        </Card>

        {/* Source ROI */}
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="tracking-tight">Source ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={sourceData}
              xKey="label"
              yKey="leads"
              height={320}
              series={[
                { key: 'leads', color: '#3b82f6', label: 'Leads' },
                { key: 'cost', color: '#3b82f6', label: 'Cost ($)' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* ---- Row 2: Score Distribution + Monthly Trend ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="tracking-tight">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={scoreData}
              xKey="label"
              yKey="value"
              color="#10b981"
              height={320}
            />
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="tracking-tight">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={trendData}
              xKey="label"
              yKey="leads"
              height={320}
              series={[
                { key: 'leads', color: '#3b82f6', label: 'Leads' },
                { key: 'converted', color: '#10b981', label: 'Converted' },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
