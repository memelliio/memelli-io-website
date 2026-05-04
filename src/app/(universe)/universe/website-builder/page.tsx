'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  ShoppingBag,
  Code,
  Palette,
  Link2,
  Lock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SiteStatus = 'Draft' | 'Building' | 'Live' | 'Failed';

interface RecentSite {
  id: string;
  name: string;
  tenant: string;
  industry: string;
  domain: string;
  status: SiteStatus;
  pagesCount: number;
  forumEnabled: boolean;
  createdAt: string;
}

interface QueueItem {
  id: string;
  siteName: string;
  tenant: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface IndustryEntry {
  name: string;
  count: number;
}

interface TemplateEntry {
  name: string;
  sitesUsing: number;
  rating: number;
}

interface DomainEntry {
  domain: string;
  siteName: string;
  connected: boolean;
  dnsPending: boolean;
  sslStatus: 'active' | 'pending' | 'expired' | 'none';
}

interface WebsiteBuilderStats {
  totalSites: number;
  sitesLive: number;
  sitesBuilding: number;
  forumEnabled: number;
  storeEnabled: number;
  recentSites: RecentSite[];
  queue: QueueItem[];
  industries: IndustryEntry[];
  templates: TemplateEntry[];
  domains: DomainEntry[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusConfig: Record<SiteStatus, { bg: string; text: string; dot: string }> = {
  Draft: { bg: 'bg-[hsl(var(--muted))]/$1', text: 'text-[hsl(var(--muted-foreground))]', dot: 'bg-[hsl(var(--muted-foreground))]' },
  Building: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  Live: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

const queueStatusConfig: Record<QueueItem['status'], { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pending', bg: 'bg-[hsl(var(--muted))]/$1', text: 'text-[hsl(var(--muted-foreground))]', dot: 'bg-[hsl(var(--muted-foreground))]' },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

const sslConfig: Record<DomainEntry['sslStatus'], { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-400' },
  pending: { label: 'Pending', color: 'text-yellow-400' },
  expired: { label: 'Expired', color: 'text-red-400' },
  none: { label: 'None', color: 'text-[hsl(var(--muted-foreground))]' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</span>
        <span className="text-[hsl(var(--muted-foreground))]">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] tabular-nums">{value}</p>
    </div>
  );
}

function SiteStatusBadge({ status }: { status: SiteStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function QueueStatusBadge({ status }: { status: QueueItem['status'] }) {
  const cfg = queueStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function IndustryBar({ name, count, maxCount }: { name: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[hsl(var(--foreground))]">{name}</span>
        <span className="text-[hsl(var(--muted-foreground))] tabular-nums">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UniverseWebsiteBuilderPage() {
  const api = useApi();

  const { data, isLoading, error, refetch } = useQuery<WebsiteBuilderStats>({
    queryKey: ['admin-website-builder-stats'],
    queryFn: async () => {
      const res = await api.get<WebsiteBuilderStats>('/api/admin/seo/websites/stats');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const maxIndustryCount = useMemo(() => {
    if (!data?.industries?.length) return 0;
    return Math.max(...data.industries.map((i) => i.count));
  }, [data?.industries]);

  const queueCounts = useMemo(() => {
    const q = data?.queue ?? [];
    return {
      pending: q.filter((i) => i.status === 'pending').length,
      inProgress: q.filter((i) => i.status === 'in_progress').length,
      completed: q.filter((i) => i.status === 'completed').length,
      failed: q.filter((i) => i.status === 'failed').length,
    };
  }, [data?.queue]);

  const domainCounts = useMemo(() => {
    const d = data?.domains ?? [];
    return {
      connected: d.filter((x) => x.connected).length,
      dnsPending: d.filter((x) => x.dnsPending).length,
      sslActive: d.filter((x) => x.sslStatus === 'active').length,
    };
  }, [data?.domains]);

  /* ---------------------------------------------------------------- */
  /*  Loading State                                                    */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="h-10 w-64 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
          <div className="h-48 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error State                                                      */
  /* ---------------------------------------------------------------- */

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Failed to load website builder data</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium px-4 py-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const recentSites = data?.recentSites ?? [];
  const queue = data?.queue ?? [];
  const industries = data?.industries ?? [];
  const templates = data?.templates ?? [];
  const domains = data?.domains ?? [];

  /* ---------------------------------------------------------------- */
  /*  Main Render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* -------------------------------------------------------------- */}
      {/*  Header                                                        */}
      {/* -------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Website Builder</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          All website builder activity across the Memelli Universe
        </p>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Stats Row                                                     */}
      {/* -------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Sites Created"
          value={data?.totalSites ?? 0}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatCard
          label="Sites Live"
          value={data?.sitesLive ?? 0}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label="Sites Building"
          value={data?.sitesBuilding ?? 0}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <StatCard
          label="Forum-Enabled Sites"
          value={data?.forumEnabled ?? 0}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatCard
          label="Store-Enabled Sites"
          value={data?.storeEnabled ?? 0}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Recent Sites Table                                            */}
      {/* -------------------------------------------------------------- */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Recent Sites
          </h2>
        </div>
        {recentSites.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No sites created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left">
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Site Name</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Tenant</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Industry</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Domain</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">Pages</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">Forum</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {recentSites.map((site) => (
                  <tr key={site.id} className="hover:bg-[hsl(var(--muted))] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[hsl(var(--foreground))] truncate block max-w-[200px]">
                        {site.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] truncate max-w-[140px]">{site.tenant}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{site.industry}</td>
                    <td className="px-4 py-3 text-[hsl(var(--foreground))] truncate max-w-[180px]">{site.domain}</td>
                    <td className="px-4 py-3">
                      <SiteStatusBadge status={site.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-[hsl(var(--muted-foreground))] tabular-nums">{site.pagesCount}</td>
                    <td className="px-4 py-3 text-center">
                      {site.forumEnabled ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{formatDate(site.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Site Generation Queue                                         */}
      {/* -------------------------------------------------------------- */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Code className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Site Generation Queue
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              Pending: <span className="text-[hsl(var(--foreground))] font-medium tabular-nums">{queueCounts.pending}</span>
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              In Progress: <span className="text-yellow-400 font-medium tabular-nums">{queueCounts.inProgress}</span>
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              Completed: <span className="text-emerald-400 font-medium tabular-nums">{queueCounts.completed}</span>
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              Failed: <span className="text-red-400 font-medium tabular-nums">{queueCounts.failed}</span>
            </span>
          </div>
        </div>
        {queue.length === 0 ? (
          <div className="p-8 text-center">
            <Code className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No items in the generation queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {queue.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-[hsl(var(--muted))] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <QueueStatusBadge status={item.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{item.siteName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{item.tenant}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {item.error && (
                    <span className="text-xs text-red-400 max-w-[200px] truncate" title={item.error}>
                      {item.error}
                    </span>
                  )}
                  <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {item.completedAt ? formatDate(item.completedAt) : item.startedAt ? formatDate(item.startedAt) : '--'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Two-column: Industry Distribution + Template Usage            */}
      {/* -------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Industry Distribution */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Palette className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Industry Distribution
            </h2>
          </div>
          {industries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No industry data available.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {industries.map((ind) => (
                <IndustryBar key={ind.name} name={ind.name} count={ind.count} maxCount={maxIndustryCount} />
              ))}
            </div>
          )}
        </div>

        {/* Template Usage */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Template Usage
            </h2>
          </div>
          {templates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No template data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-left">
                    <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Template</th>
                    <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">Sites Using</th>
                    <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {templates.map((tpl) => (
                    <tr key={tpl.name} className="hover:bg-[hsl(var(--muted))] transition-colors">
                      <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{tpl.name}</td>
                      <td className="px-4 py-3 text-center text-[hsl(var(--muted-foreground))] tabular-nums">{tpl.sitesUsing}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-yellow-400 tabular-nums">{tpl.rating.toFixed(1)}</span>
                        <span className="text-[hsl(var(--muted-foreground))] ml-0.5">/5</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Domain Status                                                 */}
      {/* -------------------------------------------------------------- */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Domain Status
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              Connected: <span className="text-emerald-400 font-medium tabular-nums">{domainCounts.connected}</span>
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              DNS Pending: <span className="text-yellow-400 font-medium tabular-nums">{domainCounts.dnsPending}</span>
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              SSL Active: <span className="text-blue-400 font-medium tabular-nums">{domainCounts.sslActive}</span>
            </span>
          </div>
        </div>
        {domains.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No domains configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left">
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Domain</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Site</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">Connected</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">DNS</th>
                  <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-center">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      SSL
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {domains.map((d) => (
                  <tr key={d.domain} className="hover:bg-[hsl(var(--muted))] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[hsl(var(--foreground))] font-medium">{d.domain}</span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{d.siteName}</td>
                    <td className="px-4 py-3 text-center">
                      {d.connected ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))] text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.dnsPending ? (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Pending
                        </span>
                      ) : d.connected ? (
                        <span className="text-xs text-emerald-400">Resolved</span>
                      ) : (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${sslConfig[d.sslStatus].color}`}>
                        {sslConfig[d.sslStatus].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
