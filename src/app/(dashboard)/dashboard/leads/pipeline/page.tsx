'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Radar,
  UserSearch,
  Fingerprint,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Activity,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Skeleton,
  MetricTile,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface PipelineData {
  stages: { slug: string; count: number }[];
  totalLeads: number;
}

/* ------------------------------------------------------------------ */
/*  Stage definitions                                                  */
/* ------------------------------------------------------------------ */

const STAGE_META: Record<
  string,
  { color: string; icon: React.ReactNode; description: string; order: number }
> = {
  signal: {
    color: '#f59e0b',
    icon: <Radar className="h-5 w-5" />,
    description: 'Raw signals detected from sources',
    order: 0,
  },
  profile: {
    color: '#10b981',
    icon: <UserSearch className="h-5 w-5" />,
    description: 'Contact profiles enriched',
    order: 1,
  },
  identity: {
    color: '#3b82f6',
    icon: <Fingerprint className="h-5 w-5" />,
    description: 'Identity verified & merged',
    order: 2,
  },
  score: {
    color: '#f59e0b',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Lead scored by intent model',
    order: 3,
  },
  qualify: {
    color: '#10b981',
    icon: <ShieldCheck className="h-5 w-5" />,
    description: 'Qualified & ready for outreach',
    order: 4,
  },
};

const STAGE_ORDER = ['signal', 'profile', 'identity', 'score', 'qualify'];

function buildStages(apiStages?: { slug: string; count: number }[]): PipelineStage[] {
  return STAGE_ORDER.map((slug, idx) => {
    const meta = STAGE_META[slug]!;
    const apiMatch = apiStages?.find((s) => s.slug === slug);
    return {
      id: String(idx + 1),
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      count: apiMatch?.count ?? 0,
      color: meta.color,
      icon: meta.icon,
      description: meta.description,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PipelinePage() {
  const api = useApi();

  const { data, isLoading } = useQuery<PipelineData>({
    queryKey: ['lead-pipeline'],
    queryFn: async () => {
      const res = await api.get<PipelineData>('/api/leads/pipeline');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const stages = buildStages(data?.stages);
  const totalLeads = data?.totalLeads ?? 0;
  const qualifiedCount = stages.find((s) => s.slug === 'qualify')?.count ?? 0;
  const conversionRate = totalLeads > 0 ? ((qualifiedCount / totalLeads) * 100).toFixed(1) : '0';
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <PageHeader
        title="Lead Pipeline"
        subtitle="Signal-to-qualified lead conversion funnel"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Pipeline' },
        ]}
      />

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <MetricTile
            label="Total Leads"
            value={totalLeads.toLocaleString()}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricTile
            label="Qualified"
            value={qualifiedCount.toLocaleString()}
            icon={<CheckCircle2 className="h-4 w-4" />}
            trend={qualifiedCount > 0 ? 'up' : 'flat'}
          />
          <MetricTile
            label="Conversion Rate"
            value={`${conversionRate}%`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricTile
            label="Active Stages"
            value={stages.filter((s) => s.count > 0).length}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Visual Pipeline Flow */}
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl shadow-lg shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
              {stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-center">
                  <Link href={`/dashboard/leads/pipeline/${stage.slug}`} className="block">
                    <div className="group relative min-w-[170px] cursor-pointer">
                      {/* Color accent bar */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                        style={{ backgroundColor: stage.color }}
                      />

                      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 pt-4 hover:bg-white/[0.05] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-200">
                        {/* Icon + Name */}
                        <div className="flex items-center gap-2 mb-3">
                          <span style={{ color: stage.color }}>{stage.icon}</span>
                          <span className="text-sm font-semibold tracking-tight text-foreground">{stage.name}</span>
                        </div>

                        {/* Count */}
                        <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground mb-2">
                          {stage.count.toLocaleString()}
                        </div>

                        {/* Percentage badge */}
                        <Badge
                          variant="default"
                          className="text-xs border-white/[0.06]"
                          style={{ color: stage.color }}
                        >
                          {totalLeads > 0
                            ? `${((stage.count / totalLeads) * 100).toFixed(0)}%`
                            : '0%'}{' '}
                          of total
                        </Badge>

                        {/* Mini bar */}
                        <div className="mt-3 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${(stage.count / maxCount) * 100}%`,
                              backgroundColor: stage.color,
                            }}
                          />
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Flow arrow */}
                  {idx < stages.length - 1 && (
                    <div className="flex flex-col items-center mx-3 shrink-0">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      {totalLeads > 0 && stages[idx + 1].count > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                          {((stages[idx + 1].count / Math.max(stage.count, 1)) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Detail Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stages.map((stage) => (
            <Link key={stage.id} href={`/dashboard/leads/pipeline/${stage.slug}`}>
              <Card className="rounded-2xl border-white/[0.04] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full shadow-lg shadow-black/10">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center h-10 w-10 rounded-xl"
                        style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                      >
                        {stage.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">{stage.name}</h3>
                        <p className="text-xs text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                      {stage.count.toLocaleString()}
                    </span>
                    <Badge
                      variant="default"
                      className="text-xs border-white/[0.06]"
                      style={{ color: stage.color }}
                    >
                      {totalLeads > 0
                        ? `${((stage.count / totalLeads) * 100).toFixed(1)}%`
                        : '0%'}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(stage.count / maxCount) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
