'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Target,
  Zap,
  Send,
  TrendingUp,
  Users,
  Radio,
  Globe,
  Video,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeadScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

interface SourceBreakdown {
  source: string;
  count: number;
  conversionRate: number;
}

interface RecentSignal {
  id: string;
  source: string;
  contentPreview: string;
  tenant: string;
  score: number;
  status: string;
  discoveredAt: string;
}

interface ActiveCampaign {
  id: string;
  name: string;
  tenant: string;
  type: string;
  messagesSent: number;
  replies: number;
  conversionRate: number;
}

interface VideoQueueStats {
  pending: number;
  inProgress: number;
  completedToday: number;
  recentVideos: { id: string; tenant: string; title: string; createdAt: string }[];
}

interface LeadStats {
  discoveredToday: number;
  hotLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  totalLeads30d: number;
  scoreDistribution: LeadScoreBucket[];
  sourceBreakdown: SourceBreakdown[];
  recentSignals: RecentSignal[];
  campaigns: ActiveCampaign[];
  videoQueue: VideoQueueStats;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function scoreBadge(score: number) {
  let color = 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
  if (score >= 90) color = 'bg-red-500/20 text-red-400 border-red-500/30';
  else if (score >= 70) color = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  else if (score >= 40) color = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {score}
    </span>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    new: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    qualified: 'bg-red-500/20 text-red-400 border-red-500/30',
    converted: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  };
  const cls = map[status.toLowerCase()] ?? map.archived;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
}

const SOURCE_ICONS: Record<string, React.ComponentType<any>> = {
  reddit: MessageSquare,
  craigslist: Globe,
  google: Globe,
  instagram: Radio,
  manual: Target,
  csv: ArrowRight,
  webhook: Zap,
};

/* ------------------------------------------------------------------ */
/*  Score bar colors                                                    */
/* ------------------------------------------------------------------ */

const SCORE_COLORS: Record<string, { bar: string; text: string }> = {
  Hot: { bar: 'bg-red-500', text: 'text-red-400' },
  Strong: { bar: 'bg-orange-500', text: 'text-orange-400' },
  Nurture: { bar: 'bg-blue-500', text: 'text-blue-400' },
  Archive: { bar: 'bg-[hsl(var(--muted-foreground))]', text: 'text-[hsl(var(--muted-foreground))]' },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LeadsOverviewPage() {
  const api = useApi();

  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get<LeadStats>('/api/admin/leads/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setStats(res.data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  /* ---- Helpers ---- */
  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');
  const pct = (v: number | undefined | null) => (v != null ? `${v.toFixed(1)}%` : '\u2014');

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-blue-500" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading lead generation data...</p>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 max-w-md text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load lead data</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---- Derived values ---- */
  const scoreDistribution = stats?.scoreDistribution ?? [];
  const maxScoreCount = Math.max(...scoreDistribution.map((b) => b.count), 1);
  const sourceBreakdown = stats?.sourceBreakdown ?? [];
  const recentSignals = stats?.recentSignals ?? [];
  const campaigns = stats?.campaigns ?? [];
  const videoQueue = stats?.videoQueue;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            LeadPulse &mdash; Lead Generation
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            All lead generation activity across the Memelli Universe
          </p>
        </div>

        {/* ── Stats Row (5 cards) ──────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Discovered Today</span>
              <Target className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.discoveredToday)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Leads discovered</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Hot Leads</span>
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.hotLeads)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Score 90+</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Active Campaigns</span>
              <Send className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.activeCampaigns)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Outreach running</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Conversion Rate</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{pct(stats?.conversionRate)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Lead to customer</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Total Leads (30d)</span>
              <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.totalLeads30d)}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Last 30 days</p>
          </div>
        </div>

        {/* ── Lead Score Distribution + Source Breakdown ────────── */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">

          {/* Score Distribution */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              Lead Score Distribution
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
              {scoreDistribution.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No score data available</p>
              ) : (
                scoreDistribution.map((bucket) => {
                  const colors = SCORE_COLORS[bucket.label] ?? { bar: 'bg-[hsl(var(--muted-foreground))]', text: 'text-[hsl(var(--muted-foreground))]' };
                  const widthPct = (bucket.count / maxScoreCount) * 100;
                  return (
                    <div key={bucket.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${colors.text}`}>{bucket.label}</span>
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">({bucket.min}&ndash;{bucket.max})</span>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{bucket.count.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[hsl(var(--muted))]">
                        <div
                          className={`h-3 rounded-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Source Breakdown */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Radio className="h-5 w-5 text-blue-400" />
              Source Breakdown
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              {sourceBreakdown.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No source data available</p>
              ) : (
                <div className="space-y-3">
                  {sourceBreakdown.map((src) => {
                    const Icon = SOURCE_ICONS[src.source.toLowerCase()] ?? Globe;
                    return (
                      <div key={src.source} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-3">
                        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))] flex-1">{src.source}</span>
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{src.count.toLocaleString()}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right">{src.conversionRate.toFixed(1)}% cvr</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Signals Table ─────────────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Recent Signals
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            {recentSignals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent signals</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Content</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Discovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {recentSignals.map((signal) => {
                      const Icon = SOURCE_ICONS[signal.source.toLowerCase()] ?? Globe;
                      return (
                        <tr key={signal.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                              <span className="text-[hsl(var(--foreground))]">{signal.source}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-[hsl(var(--muted-foreground))] truncate">{signal.contentPreview}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[hsl(var(--foreground))]">{signal.tenant}</span>
                          </td>
                          <td className="px-4 py-3">{scoreBadge(signal.score)}</td>
                          <td className="px-4 py-3">{statusBadge(signal.status)}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                            {formatTime(signal.discoveredAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Active Campaigns + Video Queue ───────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Active Campaigns — spans 2 cols */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-400" />
              Active Campaigns
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
              {campaigns.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No active campaigns</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Campaign</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Sent</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Replies</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">CVR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[hsl(var(--foreground))] font-medium">{c.name}</span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{c.tenant}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-400">
                              {c.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--foreground))]">{c.messagesSent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-[hsl(var(--foreground))]">{c.replies.toLocaleString()}</td>
                          <td className="px-4 py-3 text-[hsl(var(--foreground))]">{c.conversionRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Video Generation Queue */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-400" />
              Video Generation Queue
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
              {/* Queue stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-center">
                  <p className="text-lg font-bold text-yellow-400">{val(videoQueue?.pending)}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-1">Pending</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{val(videoQueue?.inProgress)}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-1">In Progress</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{val(videoQueue?.completedToday)}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-1">Done Today</p>
                </div>
              </div>

              {/* Recent generated videos */}
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Recent Videos</p>
                {!videoQueue?.recentVideos?.length ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No recent videos</p>
                ) : (
                  <ul className="space-y-2">
                    {videoQueue.recentVideos.map((v) => (
                      <li key={v.id} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-2.5">
                        <Video className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[hsl(var(--foreground))] truncate">{v.title}</p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{v.tenant}</p>
                        </div>
                        <span className="text-[11px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{formatTime(v.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
