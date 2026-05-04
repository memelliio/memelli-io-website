'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Globe, FileSearch, ArrowUpDown, MousePointerClick,
  TrendingUp, HelpCircle, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  PieChart,
  Skeleton,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrafficPoint {
  date: string;
  sessions: number;
  clicks: number;
}

interface TopThread {
  id: string;
  title: string;
  url: string;
  sessions: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

interface PipelineStats {
  discovered: number;
  queued: number;
  answered: number;
  published: number;
}

interface CoverageSlice {
  status: string;
  count: number;
}

interface SeoAnalyticsData {
  organicTraffic: number;
  organicTrafficChange: number;
  indexedPages: number;
  indexedPagesChange: number;
  avgPosition: number;
  avgPositionChange: number;
  ctr: number;
  ctrChange: number;
  trafficOverTime: TrafficPoint[];
  topThreads: TopThread[];
  pipeline: PipelineStats;
  indexCoverage: CoverageSlice[];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SeoAnalyticsPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<SeoAnalyticsData>({
    queryKey: ['analytics', 'seo'],
    queryFn: async () => {
      const res = await api.get<SeoAnalyticsData>('/api/analytics?module=seo');
      return res.data!;
    },
  });

  /* ---- Loading state ---- */
  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="SEO Analytics"
          subtitle="Organic search performance, index coverage, and question pipeline"
        />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-card border border-white/[0.04]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-card border border-white/[0.04]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl bg-card border border-white/[0.04]" />
          <Skeleton className="h-72 rounded-2xl bg-card border border-white/[0.04]" />
        </div>
        <Skeleton className="h-64 rounded-2xl bg-card border border-white/[0.04]" />
      </div>
    );
  }

  /* ---- Derive trend direction ---- */
  const trend = (v: number): 'up' | 'down' | 'flat' =>
    v > 0 ? 'up' : v < 0 ? 'down' : 'flat';

  /* For avg position, lower is better so invert trend */
  const positionTrend = (v: number): 'up' | 'down' | 'flat' =>
    v < 0 ? 'up' : v > 0 ? 'down' : 'flat';

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="SEO Analytics"
        subtitle="Organic search performance, index coverage, and question pipeline"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'SEO' },
        ]}
      />

      {/* ---- Metric Tiles ---- */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <MetricTile
          label="Organic Traffic"
          value={data.organicTraffic.toLocaleString()}
          change={data.organicTrafficChange}
          trend={trend(data.organicTrafficChange)}
          icon={<Globe className="h-4 w-4" />}
        />
        <MetricTile
          label="Indexed Pages"
          value={data.indexedPages.toLocaleString()}
          change={data.indexedPagesChange}
          trend={trend(data.indexedPagesChange)}
          icon={<FileSearch className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg Position"
          value={data.avgPosition.toFixed(1)}
          change={data.avgPositionChange}
          trend={positionTrend(data.avgPositionChange)}
          icon={<ArrowUpDown className="h-4 w-4" />}
        />
        <MetricTile
          label="Click-Through Rate"
          value={`${data.ctr.toFixed(1)}%`}
          change={data.ctrChange}
          trend={trend(data.ctrChange)}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
      </div>

      {/* ---- Traffic Over Time ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-foreground tracking-tight">
            <TrendingUp className="h-4 w-4 text-red-400" />
            Organic Traffic Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {data.trafficOverTime.length > 0 ? (
            <LineChart
              data={data.trafficOverTime}
              xKey="date"
              yKey="sessions"
              series={[
                { key: 'sessions', color: '#3b82f6', label: 'Sessions' },
                { key: 'clicks', color: '#3b82f6', label: 'Clicks' },
              ]}
              height={320}
            />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No traffic data available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---- Top Threads & Question Pipeline ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Threads by Traffic */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Top Threads by Traffic</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {data.topThreads.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No thread data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      <th className="pb-3 pr-4">Thread</th>
                      <th className="pb-3 pr-4 text-right">Sessions</th>
                      <th className="pb-3 pr-4 text-right">Impr.</th>
                      <th className="pb-3 pr-4 text-right">CTR</th>
                      <th className="pb-3 text-right">Pos.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.topThreads.map((thread) => (
                      <tr key={thread.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="max-w-[220px] truncate py-3.5 pr-4 text-foreground tracking-tight">
                          {thread.title}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-4 text-right font-medium text-foreground">
                          {thread.sessions.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-4 text-right text-muted-foreground">
                          {thread.impressions.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-4 text-right text-muted-foreground">
                          {thread.ctr.toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap py-3.5 text-right text-muted-foreground">
                          {thread.avgPosition.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Discovery Pipeline */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-foreground tracking-tight">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              Question Discovery Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {[
              { label: 'Discovered', value: data.pipeline.discovered, color: 'bg-blue-600', icon: Globe },
              { label: 'Queued', value: data.pipeline.queued, color: 'bg-amber-600', icon: AlertTriangle },
              { label: 'Answered', value: data.pipeline.answered, color: 'bg-red-600', icon: CheckCircle2 },
              { label: 'Published', value: data.pipeline.published, color: 'bg-emerald-600', icon: CheckCircle2 },
            ].map((step) => {
              const max = Math.max(data.pipeline.discovered, 1);
              const pct = Math.max(6, Math.round((step.value / max) * 100));
              return (
                <div key={step.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {step.label}
                    </span>
                    <span className="font-medium text-foreground">
                      {step.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04]">
                    <div
                      className={`h-full rounded-full ${step.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ---- Index Coverage ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Index Coverage</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {data.indexCoverage.length > 0 ? (
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              <PieChart
                data={data.indexCoverage}
                xKey="status"
                yKey="count"
                donut
                height={260}
              />
              <div className="space-y-3.5">
                {data.indexCoverage.map((slice, i) => {
                  const colors = ['#3b82f6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
                  const total = data.indexCoverage.reduce((s, c) => s + c.count, 0);
                  const pct = total > 0 ? ((slice.count / total) * 100).toFixed(1) : '0';
                  const StatusIcon =
                    slice.status.toLowerCase().includes('valid') || slice.status.toLowerCase().includes('indexed')
                      ? CheckCircle2
                      : slice.status.toLowerCase().includes('error')
                        ? XCircle
                        : AlertTriangle;
                  return (
                    <div key={slice.status} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <StatusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 text-sm text-foreground">{slice.status}</span>
                      <span className="text-sm font-medium text-foreground">
                        {slice.count.toLocaleString()}
                      </span>
                      <span className="w-12 text-right text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No index coverage data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
