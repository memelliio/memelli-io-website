'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Search,
} from 'lucide-react';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

interface SeoAnalytics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalQuestions: number;
  totalBacklinks: number;
  averagePosition: number | null;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SEOWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SEOWorkspaceView({ compact = false }: SEOWorkspaceViewProps) {
  const api = useApi();

  const { data, isLoading } = useQuery<SeoAnalytics>({
    queryKey: ['seo-analytics'],
    queryFn: async () => {
      const res = await api.get<SeoAnalytics>('/api/seo/analytics/overview');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const d = data;

  const pipelineStages: PipelineStage[] = d
    ? [
        { label: 'Questions', count: d.totalQuestions, color: 'bg-[hsl(var(--muted-foreground))]' },
        { label: 'Articles', count: d.totalArticles, color: 'bg-amber-500' },
        { label: 'Published', count: d.publishedArticles, color: 'bg-red-500' },
        { label: 'Backlinks', count: d.totalBacklinks, color: 'bg-emerald-500' },
      ]
    : [];

  const pipelineTotal = pipelineStages.reduce((s, p) => s + p.count, 0) || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <Search className="h-8 w-8 mb-3 text-[hsl(var(--muted-foreground))]" />
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">No SEO data yet</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Start discovering questions and creating threads</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Total Articles"
          value={d.totalArticles}
          icon={<FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Published"
          value={d.publishedArticles}
          icon={<CheckCircle2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend="up"
        />
        <MetricTile
          label="Total Questions"
          value={d.totalQuestions}
          icon={<HelpCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Avg. Position"
          value={d.averagePosition != null ? String(d.averagePosition) : '--'}
          icon={<TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
      </div>

      {/* Question Pipeline */}
      <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
        <CardHeader className="p-5">
          <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Question Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {pipelineStages.map((stage) => (
              <div key={stage.label} className="text-center">
                <p className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{stage.count.toLocaleString()}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{stage.label}</p>
              </div>
            ))}
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
            {pipelineStages.map((stage) => (
              <div
                key={stage.label}
                className={`${stage.color} transition-all`}
                style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Discovered</span>
            <ArrowRight className="h-2.5 w-2.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Approved</span>
            <ArrowRight className="h-2.5 w-2.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Thread Created</span>
            <ArrowRight className="h-2.5 w-2.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Indexed</span>
          </div>
        </CardContent>
      </Card>

      {/* Content Overview */}
      {!compact && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
            <CardHeader className="p-5">
              <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Content Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-4 text-center">
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{d.publishedArticles}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Published</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-4 text-center">
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{d.draftArticles}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Drafts</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-4 text-center">
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{d.totalBacklinks}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Backlinks</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-4 text-center">
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{d.averagePosition ?? '--'}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Avg. Position</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
            <CardHeader className="p-5">
              <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">
                View your article rankings and search performance in the Rankings section.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
