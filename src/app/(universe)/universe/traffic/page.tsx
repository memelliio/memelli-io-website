'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Search,
  TrendingUp,
  Globe,
  FileText,
  BarChart3,
  RefreshCw,
  Link2,
  Eye,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CycleStage {
  name: string;
  key: string;
  countToday: number;
  status: 'running' | 'idle' | 'error';
}

interface TopStats {
  questionsDiscoveredToday: number;
  threadsCreatedToday: number;
  pagesIndexed: number;
  repingSignalsSent: number;
  totalTraffic30d: number;
  authorityScoreAvg: number;
}

interface TopSite {
  id: string;
  name: string;
  tenant: string;
  domain: string;
  totalThreads: number;
  indexedPages: number;
  monthlyTraffic: number;
  authorityScore: number;
  topThread: string;
}

interface QuestionQueue {
  pendingApproval: number;
  pendingThreadCreation: number;
  priorityDistribution: { high: number; medium: number; low: number };
}

interface IndexingHealth {
  sitemapUpdatedAt: string | null;
  crawlEvents24h: number;
  indexCoveragePct: number;
  repingScheduleStatus: 'on_schedule' | 'behind' | 'paused';
}

interface RecentThread {
  id: string;
  title: string;
  category: string;
  tenant: string;
  status: 'created' | 'expanded' | 'refreshed';
  traffic: number;
  timestamp: string;
}

interface SeoStats {
  cycle: CycleStage[];
  topStats: TopStats;
  topSites: TopSite[];
  questionQueue: QuestionQueue;
  indexingHealth: IndexingHealth;
  recentThreads: RecentThread[];
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage icons                                               */
/* ------------------------------------------------------------------ */

const STAGE_ICONS: Record<string, React.ComponentType<any>> = {
  discovery: Search,
  scoring: BarChart3,
  thread_creation: FileText,
  answering: Zap,
  expansion: TrendingUp,
  linking: Link2,
  indexing: Globe,
  reping: RefreshCw,
  monitoring: Eye,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusColor(status: 'running' | 'idle' | 'error') {
  switch (status) {
    case 'running':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
    case 'idle':
      return 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/$1 border-[hsl(var(--border))]';
    case 'error':
      return 'text-red-400 bg-red-400/10 border-red-500/30';
  }
}

function statusDot(status: 'running' | 'idle' | 'error') {
  const colors = {
    running: 'bg-emerald-400',
    idle: 'bg-[hsl(var(--muted-foreground))]',
    error: 'bg-red-400',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />;
}

function threadStatusBadge(status: 'created' | 'expanded' | 'refreshed') {
  const map = {
    created: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    expanded: 'bg-red-500/20 text-red-400 border-red-500/30',
    refreshed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${map[status]}`}>
      {status}
    </span>
  );
}

function repingBadge(status: 'on_schedule' | 'behind' | 'paused') {
  const map = {
    on_schedule: { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'On Schedule' },
    behind: { cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Behind' },
    paused: { cls: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]', label: 'Paused' },
  };
  const { cls, label } = map[status];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function val(v: number | undefined | null) {
  return v != null ? v.toLocaleString() : '\u2014';
}

function pct(v: number | undefined | null) {
  return v != null ? `${v}%` : '\u2014';
}

function formatTime(iso: string | null) {
  if (!iso) return '\u2014';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TrafficSeoPage() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SeoStats | null>(null);

  const fetchData = useCallback(async () => {
    const res = await api.get<SeoStats>('/api/admin/seo/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Loading State ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading SEO engine data...</p>
        </div>
      </div>
    );
  }

  /* ── Error State ───────────────────────────────────────── */
  if (error && !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-orange-400" />
          <p className="text-sm text-[hsl(var(--foreground))]">Failed to load SEO stats</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="mt-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cycle = data?.cycle ?? [];
  const stats = data?.topStats;
  const sites = data?.topSites ?? [];
  const queue = data?.questionQueue;
  const indexing = data?.indexingHealth;
  const threads = data?.recentThreads ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Traffic &amp; SEO Engine</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Forum SEO traffic engine status across the Memelli Universe</p>
        </div>

        {/* ── Daily Cycle Status (Pipeline) ─────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-400" />
            Daily Cycle Status
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {cycle.map((stage, i) => {
                const Icon = STAGE_ICONS[stage.key] ?? Zap;
                return (
                  <div key={stage.key} className="flex items-center">
                    <div className={`rounded-lg border px-4 py-3 flex flex-col items-center gap-1.5 min-w-[110px] ${statusColor(stage.status)}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium whitespace-nowrap">{stage.name}</span>
                      <span className="text-lg font-bold">{val(stage.countToday)}</span>
                      <div className="flex items-center gap-1">
                        {statusDot(stage.status)}
                        <span className="text-[10px] uppercase font-semibold">{stage.status}</span>
                      </div>
                    </div>
                    {i < cycle.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] mx-1 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
              {cycle.length === 0 && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center w-full">No cycle data available</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Top Stats Row ──────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Questions Discovered</span>
              <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.questionsDiscoveredToday)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Today</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Threads Created</span>
              <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.threadsCreatedToday)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Today</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Pages Indexed</span>
              <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.pagesIndexed)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reping Signals</span>
              <RefreshCw className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.repingSignalsSent)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Sent today</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total Traffic</span>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.totalTraffic30d)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Last 30 days</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Authority Score</span>
              <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.authorityScoreAvg)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Average</p>
          </div>
        </div>

        {/* ── Top Performing Sites + Question Queue ───────────── */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Top Performing Sites Table — spans 2 cols */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Top Performing Sites
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Site</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Threads</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Indexed</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Traffic/mo</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Authority</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Top Thread</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {sites.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">No site data available</td>
                      </tr>
                    ) : (
                      sites.map((site) => (
                        <tr key={site.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-[hsl(var(--foreground))]">{site.name}</p>
                              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{site.domain}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{site.tenant}</td>
                          <td className="px-4 py-3 text-right text-[hsl(var(--foreground))] font-medium">{val(site.totalThreads)}</td>
                          <td className="px-4 py-3 text-right text-[hsl(var(--foreground))] font-medium">{val(site.indexedPages)}</td>
                          <td className="px-4 py-3 text-right text-[hsl(var(--foreground))] font-medium">{val(site.monthlyTraffic)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                              {val(site.authorityScore)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs max-w-[200px] truncate">{site.topThread || '\u2014'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Question Queue — right column */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-400" />
              Question Queue
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Pending Approval</span>
                  <span className="text-lg font-bold text-[hsl(var(--foreground))]">{val(queue?.pendingApproval)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Pending Thread Creation</span>
                  <span className="text-lg font-bold text-[hsl(var(--foreground))]">{val(queue?.pendingThreadCreation)}</span>
                </div>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-4">
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Priority Distribution</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">High</span>
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{val(queue?.priorityDistribution?.high)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Medium</span>
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{val(queue?.priorityDistribution?.medium)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--muted-foreground))]" />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Low</span>
                    </div>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{val(queue?.priorityDistribution?.low)}</span>
                  </div>
                </div>

                {/* Priority bar */}
                {queue?.priorityDistribution && (() => {
                  const total = queue.priorityDistribution.high + queue.priorityDistribution.medium + queue.priorityDistribution.low;
                  if (total === 0) return null;
                  const hPct = (queue.priorityDistribution.high / total) * 100;
                  const mPct = (queue.priorityDistribution.medium / total) * 100;
                  return (
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div className="bg-red-400" style={{ width: `${hPct}%` }} />
                      <div className="bg-yellow-400" style={{ width: `${mPct}%` }} />
                      <div className="bg-[hsl(var(--muted-foreground))] flex-1" />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Indexing Health ──────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            Indexing Health
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Sitemap Updated</span>
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-lg font-bold text-[hsl(var(--foreground))] mt-2">{formatTime(indexing?.sitemapUpdatedAt ?? null)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Last update</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Crawl Events</span>
                <Eye className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(indexing?.crawlEvents24h)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Last 24 hours</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Index Coverage</span>
                <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{pct(indexing?.indexCoveragePct)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Of total pages</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reping Schedule</span>
                <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="mt-2">
                {indexing?.repingScheduleStatus ? repingBadge(indexing.repingScheduleStatus) : <span className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{'\u2014'}</span>}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Current status</p>
            </div>
          </div>
        </div>

        {/* ── Recent Thread Activity ──────────────────────────── */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Recent Thread Activity
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Traffic</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {threads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">No recent thread activity</td>
                    </tr>
                  ) : (
                    threads.map((thread) => (
                      <tr key={thread.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[hsl(var(--foreground))] font-medium max-w-[300px] truncate block">{thread.title}</span>
                            <ArrowUpRight className="h-3 w-3 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{thread.category}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{thread.tenant}</td>
                        <td className="px-4 py-3">{threadStatusBadge(thread.status)}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--foreground))] font-medium">{val(thread.traffic)}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">{formatTime(thread.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
