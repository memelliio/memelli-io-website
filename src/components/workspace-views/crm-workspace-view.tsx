'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GitMerge,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  Badge,
  Skeleton,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PipelineStageSummary {
  id: string;
  name: string;
  color: string;
  dealCount: number;
  totalValue: number;
  order: number;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  contactName?: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  companyName?: string;
  stageName?: string;
  stage?: { name: string };
  pipelineName?: string;
  pipeline?: { name: string };
  daysInStage?: number;
  createdAt: string;
  updatedAt?: string;
}

interface CRMAnalytics {
  totalDeals: number;
  pipelineValue: number;
  winRate: number;
  activeContacts: number;
  dealsChange?: number;
  valueChange?: number;
  winRateChange?: number;
  contactsChange?: number;
  pipelineStages?: PipelineStageSummary[];
  recentDeals?: Deal[];
  dealVelocity?: { stage: string; avgDays: number }[];
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CRMWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getContactName(d: Deal): string {
  if (d.contactName) return d.contactName;
  if (d.contact)
    return (
      [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ') ||
      d.contact.email ||
      ''
    );
  return '';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function trendDir(val?: number): 'up' | 'down' | 'flat' | undefined {
  if (val == null) return undefined;
  return val > 0 ? 'up' : val < 0 ? 'down' : 'flat';
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function CRMSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton variant="stat-card" />
        <Skeleton variant="stat-card" />
        <Skeleton variant="stat-card" />
        <Skeleton variant="stat-card" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CRMWorkspaceView({ compact = false }: CRMWorkspaceViewProps) {
  const api = useApi();

  const { data: analytics, isLoading, error } = useQuery<CRMAnalytics>({
    queryKey: ['crm', 'analytics'],
    queryFn: async () => {
      const res = await api.get<any>('/api/analytics?module=crm');
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const totalDeals = analytics?.totalDeals ?? 0;
  const pipelineValue = analytics?.pipelineValue ?? 0;
  const winRate = analytics?.winRate ?? 0;
  const activeContacts = analytics?.activeContacts ?? 0;

  const stages = useMemo(
    () =>
      (analytics?.pipelineStages ?? [])
        .slice()
        .sort((a, b) => a.order - b.order),
    [analytics?.pipelineStages],
  );

  const recentDeals = useMemo(
    () =>
      (analytics?.recentDeals ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, compact ? 5 : 10),
    [analytics?.recentDeals, compact],
  );

  const velocityData = useMemo(
    () =>
      (analytics?.dealVelocity ?? []).map((v) => ({
        stage: v.stage,
        days: v.avgDays,
      })),
    [analytics?.dealVelocity],
  );

  if (isLoading) return <CRMSkeleton />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-950/30 backdrop-blur-xl px-5 py-3 text-sm text-red-300">
          {error instanceof Error ? error.message : 'Failed to load CRM data'}
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Active Deals"
          value={totalDeals}
          icon={<GitMerge className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          change={analytics?.dealsChange}
          trend={trendDir(analytics?.dealsChange)}
        />
        <MetricTile
          label="Pipeline Value"
          value={fmtCurrency(pipelineValue)}
          icon={<DollarSign className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          change={analytics?.valueChange}
          trend={trendDir(analytics?.valueChange)}
        />
        <MetricTile
          label="Win Rate"
          value={`${winRate}%`}
          icon={<TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          change={analytics?.winRateChange}
          trend={trendDir(analytics?.winRateChange)}
        />
        <MetricTile
          label="New Contacts"
          value={activeContacts}
          icon={<Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          change={analytics?.contactsChange}
          trend={trendDir(analytics?.contactsChange)}
        />
      </div>

      {/* Pipeline + Recent Deals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pipeline Stages */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {stages.length === 0 ? (
              <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No pipeline data yet</p>
            ) : (
              <div className="space-y-4">
                {stages.map((stage) => {
                  const maxVal = Math.max(...stages.map((s) => s.totalValue), 1);
                  const pct = Math.max(4, (stage.totalValue / maxVal) * 100);
                  return (
                    <div key={stage.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="text-[hsl(var(--foreground))] font-medium text-sm">{stage.name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                            {stage.dealCount} deal{stage.dealCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-[hsl(var(--foreground))] text-sm">
                          {fmtCurrency(stage.totalValue)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{ width: `${pct}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Recent Deals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentDeals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No deals yet</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between px-5 py-3 transition-all duration-200 hover:bg-white/[0.04]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{deal.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {getContactName(deal) && (
                          <span className="truncate text-xs text-[hsl(var(--muted-foreground))]">{getContactName(deal)}</span>
                        )}
                        <Badge
                          variant={deal.status === 'WON' ? 'success' : deal.status === 'LOST' ? 'error' : 'primary'}
                        >
                          {deal.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      {deal.value != null && (
                        <p className="tabular-nums text-sm font-semibold text-red-400">{fmtCurrency(deal.value)}</p>
                      )}
                      <p className="flex items-center justify-end gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <Clock className="h-3 w-3" /> {relativeTime(deal.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deal Velocity */}
      {!compact && velocityData.length > 0 && (
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-5">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Deal Velocity</CardTitle>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                Average days per pipeline stage
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <Zap className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <BarChart data={velocityData} xKey="stage" yKey="days" color="#E11D2E" height={220} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
