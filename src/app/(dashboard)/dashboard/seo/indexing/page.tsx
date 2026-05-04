'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Button,
  Badge,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SitemapStatus {
  url: string;
  lastSubmitted: string;
  pagesSubmitted: number;
  pagesIndexed: number;
  errors: number;
}

interface CrawlEvent {
  id: string;
  url: string;
  status: 'success' | 'error' | 'redirect' | 'pending';
  statusCode: number;
  crawledAt: string;
  responseTime: number;
}

interface PingScheduleEntry {
  id: string;
  url: string;
  nextPing: string;
  lastPing: string | null;
  frequency: string;
  status: string;
}

interface CoveragePoint {
  date: string;
  indexed: number;
  pending: number;
  errors: number;
}

interface IndexingData {
  totalPages: number;
  indexedPages: number;
  pendingPages: number;
  errorPages: number;
  lastSitemapUpdate: string | null;
  sitemaps: SitemapStatus[];
  recentCrawls: CrawlEvent[];
  pingSchedule: PingScheduleEntry[];
  coverageHistory: CoveragePoint[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const crawlStatusConfig: Record<
  string,
  { color: 'success' | 'destructive' | 'warning' | 'muted'; icon: typeof CheckCircle }
> = {
  success: { color: 'success', icon: CheckCircle },
  error: { color: 'destructive', icon: XCircle },
  redirect: { color: 'warning', icon: AlertTriangle },
  pending: { color: 'muted', icon: Clock },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function IndexingPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  /* ---- data fetch ---- */
  const { data, isLoading } = useQuery<IndexingData>({
    queryKey: ['seo-indexing'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the IndexingData object)
      const res = await api.get<IndexingData>('/api/seo/indexing');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  /* ---- mutations ---- */
  const repingMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/seo/indexing/reping', {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo-indexing'] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/seo/indexing/sitemap/regenerate', {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo-indexing'] }),
  });

  const d = data;

  /* ---- next scheduled ping ---- */
  const nextPingEntry = d?.pingSchedule
    ?.filter((e) => e.status === 'active')
    .sort((a, b) => new Date(a.nextPing).getTime() - new Date(b.nextPing).getTime())[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <PageHeader
        title="Indexing Dashboard"
        subtitle="Monitor sitemap status, crawl events, and indexing health"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Indexing' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => repingMutation.mutate()}
            disabled={repingMutation.isPending}
          >
            {repingMutation.isPending ? 'Pinging...' : 'Re-ping All'}
          </Button>
        }
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : !d ? (
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No indexing data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Publish threads and submit your sitemap to start tracking indexing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ---- Metric Tiles ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Total Indexed"
              value={d.indexedPages}
              icon={<CheckCircle className="h-4 w-4" />}
              trend="up"
            />
            <MetricTile
              label="Pending"
              value={d.pendingPages}
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricTile
              label="Crawl Errors"
              value={d.errorPages}
              icon={<XCircle className="h-4 w-4" />}
            />
            <MetricTile
              label="Last Sitemap Update"
              value={d.lastSitemapUpdate ? relativeTime(d.lastSitemapUpdate) : 'Never'}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          {/* ---- Index Coverage Chart ---- */}
          {d.coverageHistory && d.coverageHistory.length > 0 && (
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader>
                <CardTitle className="tracking-tight font-semibold text-foreground">Index Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={d.coverageHistory}
                  xKey="date"
                  yKey="indexed"
                  series={[
                    { key: 'indexed', label: 'Indexed', color: '#34d399' },
                    { key: 'pending', label: 'Pending', color: '#facc15' },
                    { key: 'errors', label: 'Errors', color: '#3b82f6' },
                  ]}
                  height={280}
                />
              </CardContent>
            </Card>
          )}

          {/* ---- Recent Crawl Events Table ---- */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader>
              <CardTitle className="tracking-tight font-semibold text-foreground">Recent Crawl Events</CardTitle>
            </CardHeader>
            <CardContent>
              {d.recentCrawls.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No crawl events recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">URL</th>
                        <th className="pb-2 pr-4">Code</th>
                        <th className="pb-2 pr-4">Response</th>
                        <th className="pb-2">Crawled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {d.recentCrawls.map((event) => {
                        const cfg = crawlStatusConfig[event.status] ?? crawlStatusConfig.pending;
                        const Icon = cfg.icon;
                        return (
                          <tr key={event.id} className="hover:bg-white/[0.04] transition-all duration-200">
                            <td className="py-2.5 pr-4">
                              <Icon
                                className={`h-4 w-4 ${
                                  event.status === 'success'
                                    ? 'text-emerald-400'
                                    : event.status === 'error'
                                      ? 'text-primary'
                                      : event.status === 'redirect'
                                        ? 'text-amber-400'
                                        : 'text-muted-foreground'
                                }`}
                              />
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-foreground truncate max-w-xs">
                              {event.url}
                            </td>
                            <td className="py-2.5 pr-4">
                              <Badge variant={cfg.color}>{event.statusCode}</Badge>
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{event.responseTime}ms</td>
                            <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                              {new Date(event.crawledAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ---- Sitemap Status Card ---- */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="tracking-tight font-semibold text-foreground">Sitemap Status</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </CardHeader>
              <CardContent>
                {d.sitemaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No sitemaps submitted.</p>
                ) : (
                  <div className="space-y-3">
                    {d.sitemaps.map((sm, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                      >
                        <p className="text-sm font-mono text-foreground truncate">{sm.url}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Submitted:{' '}
                            <span className="text-muted-foreground">
                              {new Date(sm.lastSubmitted).toLocaleDateString()}
                            </span>
                          </span>
                          <span>
                            Pages:{' '}
                            <span className="text-muted-foreground">{sm.pagesSubmitted}</span>
                          </span>
                          <span>
                            Indexed:{' '}
                            <span className="text-emerald-400 font-medium">{sm.pagesIndexed}</span>
                          </span>
                          {sm.errors > 0 && (
                            <span>
                              Errors:{' '}
                              <span className="text-primary font-medium">{sm.errors}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---- Re-ping Schedule ---- */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader>
                <div>
                  <CardTitle className="tracking-tight font-semibold text-foreground">Re-ping Schedule</CardTitle>
                  {nextPingEntry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Next scheduled:{' '}
                      <span className="text-foreground">
                        {new Date(nextPingEntry.nextPing).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {d.pingSchedule.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No scheduled pings.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {d.pingSchedule.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate font-mono">{entry.url}</p>
                          <p className="text-xs text-muted-foreground">
                            Next: {new Date(entry.nextPing).toLocaleString()} | {entry.frequency}
                          </p>
                        </div>
                        <Badge variant={entry.status === 'active' ? 'success' : 'muted'}>
                          {entry.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
