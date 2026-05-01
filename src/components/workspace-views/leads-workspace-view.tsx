'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Flame,
  TrendingUp,
  Globe,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  PieChart,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeadAnalytics {
  totalLeads: number;
  hotLeads: number;
  conversionRate: number;
  sourceCount: number;
  sourceBreakdown: { label: string; value: number }[];
  scoreDistribution: { label: string; value: number }[];
  recentSignals: {
    id: string;
    title: string;
    source: string;
    score: number;
    detectedAt: string;
  }[];
  trends: {
    totalTrend: 'up' | 'down' | 'flat';
    totalChange: number;
    hotTrend: 'up' | 'down' | 'flat';
    hotChange: number;
    conversionTrend: 'up' | 'down' | 'flat';
    conversionChange: number;
    sourceTrend: 'up' | 'down' | 'flat';
    sourceChange: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LeadsWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBadgeVariant(score: number): 'default' | 'muted' | 'info' {
  if (score >= 80) return 'default';
  if (score >= 50) return 'muted';
  return 'info';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LeadsWorkspaceView({ compact = false }: LeadsWorkspaceViewProps) {
  const api = useApi();

  const { data: analytics, isLoading } = useQuery<LeadAnalytics>({
    queryKey: ['leads-analytics'],
    queryFn: async () => {
      const res = await api.get<LeadAnalytics>('/api/leads/analytics');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <Users className="h-8 w-8 mb-3 text-[hsl(var(--muted-foreground))]" />
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">No lead data yet</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Start capturing signals to populate your lead dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Total Leads"
          value={analytics.totalLeads.toLocaleString()}
          icon={<Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={analytics.trends.totalTrend}
          change={analytics.trends.totalChange}
        />
        <MetricTile
          label="Hot Leads"
          value={analytics.hotLeads.toLocaleString()}
          icon={<Flame className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={analytics.trends.hotTrend}
          change={analytics.trends.hotChange}
        />
        <MetricTile
          label="Conversion Rate"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={analytics.trends.conversionTrend}
          change={analytics.trends.conversionChange}
        />
        <MetricTile
          label="Source Count"
          value={analytics.sourceCount}
          icon={<Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={analytics.trends.sourceTrend}
          change={analytics.trends.sourceChange}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Lead Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <BarChart
              data={analytics.scoreDistribution}
              xKey="label"
              yKey="value"
              color="#10b981"
              height={220}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <PieChart
              data={analytics.sourceBreakdown}
              xKey="label"
              yKey="value"
              height={220}
              donut
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Signals */}
      {!compact && (
        <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Recent Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {analytics.recentSignals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">No signals detected yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="pb-2.5 pr-4 font-medium text-[hsl(var(--muted-foreground))] tracking-tight">Signal</th>
                      <th className="pb-2.5 pr-4 font-medium text-[hsl(var(--muted-foreground))] tracking-tight">Source</th>
                      <th className="pb-2.5 pr-4 font-medium text-[hsl(var(--muted-foreground))] tracking-tight text-right">Score</th>
                      <th className="pb-2.5 font-medium text-[hsl(var(--muted-foreground))] tracking-tight text-right">Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {analytics.recentSignals.slice(0, 10).map((signal) => (
                      <tr key={signal.id} className="hover:bg-white/[0.03] transition-colors duration-150">
                        <td className="py-2.5 pr-4">
                          <span className="font-medium text-[hsl(var(--foreground))] truncate block max-w-[280px]">{signal.title}</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={scoreBadgeVariant(signal.score)}>{signal.source}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <span className={`font-semibold tabular-nums ${scoreColor(signal.score)}`}>{signal.score}</span>
                        </td>
                        <td className="py-2.5 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {relativeTime(signal.detectedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
