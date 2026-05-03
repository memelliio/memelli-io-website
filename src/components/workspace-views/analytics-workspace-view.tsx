'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, GitMerge, DollarSign, BarChart2, BookOpen, Zap,
  ShoppingBag, TrendingUp, GraduationCap, Search, ChevronRight,
  Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OverviewStats {
  contacts?: number;
  openDeals?: number;
  pipelineValue?: number;
  monthlyRevenue?: number;
  publishedArticles?: number;
  aiCommands?: number;
  contactsTrend?: number;
  revenueTrend?: number;
}

interface EngineStats {
  commerce?: { stores: number; products: number; orders: number; revenue: number; ordersTrend?: number };
  crm?: { pipelines: number; deals: number; winRate: number; dealsTrend?: number };
  coaching?: { programs: number; activeEnrollments: number; completions: number; enrollmentsTrend?: number };
  seo?: { questions: number; articles: number; published: number; indexed: number; publishedTrend?: number };
}

interface SystemEvent {
  id: string;
  name: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatHero({ label, value, icon: Icon, accent, trend }: { label: string; value: string | number; icon: React.ComponentType<{className?: string}>; accent?: boolean; trend?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest">{label}</p>
        <div className={`rounded-xl p-1.5 ${accent ? 'bg-red-950/50' : 'bg-white/[0.03]'}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs last month</span>
        </div>
      )}
    </div>
  );
}

function MiniChart({ data, color = 'primary' }: { data: ChartPoint[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barColor = color === 'green' ? 'bg-emerald-500' : color === 'yellow' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${barColor} opacity-60`}
          style={{ height: `${(d.value / max) * 100}%`, minHeight: '2px' }}
          title={`${d.label}: ${d.value}`}
        />
      ))}
    </div>
  );
}

function fmt(n?: number) {
  if (n === undefined || n === null) return '\u2014';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtNum(n?: number) {
  if (n === undefined || n === null) return '\u2014';
  return n.toLocaleString();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Row({ label, value, raw, trend }: { label: string; value?: string | number; raw?: boolean; trend?: number }) {
  const display = value === undefined || value === null ? '\u2014' : raw ? String(value) : typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
        {display}
        {trend !== undefined && (
          <span className={`text-[10px] ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnalyticsWorkspaceView({ compact = false }: AnalyticsWorkspaceViewProps) {
  const api = useApi();
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewStats>({});
  const [engine, setEngine] = useState<EngineStats>({});
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([]);
  const [ordersChart, setOrdersChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ov, eng, ev, revChart, ordChart] = await Promise.all([
        api.get<OverviewStats>('/api/analytics/overview'),
        api.get<EngineStats>('/api/analytics/engine-stats'),
        api.get<{ items: SystemEvent[] }>('/api/system-events?perPage=10'),
        api.get<{ points: ChartPoint[] }>('/api/analytics/charts/revenue?period=30d'),
        api.get<{ points: ChartPoint[] }>('/api/analytics/charts/orders?period=30d'),
      ]);
      setOverview(ov.data ?? {});
      setEngine(eng.data ?? {});
      setEvents(ev.data?.items ?? []);
      setRevenueChart(revChart.data?.points ?? []);
      setOrdersChart(ordChart.data?.points ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--muted))] border border-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatHero label="Contacts" value={fmtNum(overview.contacts)} icon={Users} trend={overview.contactsTrend} />
          <StatHero label="Open Deals" value={fmtNum(overview.openDeals)} icon={GitMerge} />
          <StatHero label="Pipeline Value" value={fmt(overview.pipelineValue)} icon={DollarSign} accent />
          <StatHero label="Monthly Revenue" value={fmt(overview.monthlyRevenue)} icon={BarChart2} accent trend={overview.revenueTrend} />
          <StatHero label="Published Articles" value={fmtNum(overview.publishedArticles)} icon={BookOpen} />
          <StatHero label="AI Commands" value={fmtNum(overview.aiCommands)} icon={Zap} />
        </div>
      )}

      {/* Charts Row */}
      {!loading && (revenueChart.length > 0 || ordersChart.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {revenueChart.length > 0 && (
            <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-sm text-[hsl(var(--foreground))] tracking-tight">Revenue (30d)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <MiniChart data={revenueChart} color="primary" />
              </CardContent>
            </Card>
          )}
          {ordersChart.length > 0 && (
            <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-sm text-[hsl(var(--foreground))] tracking-tight">Orders (30d)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <MiniChart data={ordersChart} color="primary" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Engine Stats */}
      <div>
        <h2 className="mb-4 text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Engine Performance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl cursor-pointer hover:bg-white/[0.04] transition-all duration-200" onClick={() => router.push('/dashboard/analytics/commerce')}>
            <CardHeader className="pb-2 p-4">
              <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] tracking-tight">
                <ShoppingBag className="h-4 w-4 text-red-400" /> Commerce
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Row label="Stores" value={engine.commerce?.stores} />
              <Row label="Products" value={engine.commerce?.products} />
              <Row label="Orders" value={engine.commerce?.orders} trend={engine.commerce?.ordersTrend} />
              <Row label="Revenue" value={fmt(engine.commerce?.revenue)} raw />
              <div className="pt-1.5 flex items-center gap-1 text-xs text-red-400">
                <span>View details</span><ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl cursor-pointer hover:bg-white/[0.04] transition-all duration-200" onClick={() => router.push('/dashboard/analytics/crm')}>
            <CardHeader className="pb-2 p-4">
              <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] tracking-tight">
                <GitMerge className="h-4 w-4 text-emerald-400" /> CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Row label="Pipelines" value={engine.crm?.pipelines} />
              <Row label="Deals" value={engine.crm?.deals} trend={engine.crm?.dealsTrend} />
              <Row label="Win Rate" value={engine.crm?.winRate !== undefined ? `${engine.crm.winRate}%` : undefined} raw />
              <div className="pt-1.5 flex items-center gap-1 text-xs text-red-400">
                <span>View details</span><ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl cursor-pointer hover:bg-white/[0.04] transition-all duration-200" onClick={() => router.push('/dashboard/analytics/coaching')}>
            <CardHeader className="pb-2 p-4">
              <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] tracking-tight">
                <GraduationCap className="h-4 w-4 text-amber-400" /> Coaching
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Row label="Programs" value={engine.coaching?.programs} />
              <Row label="Active Enrollments" value={engine.coaching?.activeEnrollments} trend={engine.coaching?.enrollmentsTrend} />
              <Row label="Completions" value={engine.coaching?.completions} />
              <div className="pt-1.5 flex items-center gap-1 text-xs text-red-400">
                <span>View details</span><ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl cursor-pointer hover:bg-white/[0.04] transition-all duration-200" onClick={() => router.push('/dashboard/analytics/seo')}>
            <CardHeader className="pb-2 p-4">
              <CardTitle className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))] tracking-tight">
                <Search className="h-4 w-4 text-red-400" /> SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Row label="Questions" value={engine.seo?.questions} />
              <Row label="Articles" value={engine.seo?.articles} />
              <Row label="Published" value={engine.seo?.published} trend={engine.seo?.publishedTrend} />
              <Row label="Indexed" value={engine.seo?.indexed} />
              <div className="pt-1.5 flex items-center gap-1 text-xs text-red-400">
                <span>View details</span><ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Events */}
      {!compact && (
        <Card className="rounded-2xl border-white/[0.04] bg-[hsl(var(--muted))] backdrop-blur-xl">
          <CardHeader className="p-4">
            <CardTitle className="text-[hsl(var(--foreground))] flex items-center gap-2 tracking-tight text-sm">
              <Activity className="h-4 w-4 text-red-400" /> Recent System Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {events.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No recent events.</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 py-3">
                    <Badge variant="primary" className="mt-0.5 shrink-0 font-mono text-xs">
                      {ev.name}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      {ev.payload && (
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))] font-mono">
                          {JSON.stringify(ev.payload).slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">{timeAgo(ev.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
