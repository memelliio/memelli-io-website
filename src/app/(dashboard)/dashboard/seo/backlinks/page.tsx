'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, ExternalLink, Globe, TrendingUp, CalendarPlus, BarChart3 } from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  FilterBar,
  DataTable,
  type DataTableColumn,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Backlink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  articleId: string;
  anchorText: string | null;
  domainAuthority: number | null;
  type: string;
  status: string;
  firstSeenAt: string;
  discoveredAt?: string;
}

type BacklinksResponse = Backlink[];

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const filters: FilterConfig[] = [
  { key: 'search', label: 'Search backlinks', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'lost', label: 'Lost' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BacklinksPage() {
  const api = useApi();
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  /* ---- Fetch backlinks ---- */

  const { data, isLoading } = useQuery<BacklinksResponse>({
    queryKey: ['seo-backlinks', filterValues],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterValues.search) params.set('search', filterValues.search);
      if (filterValues.status) params.set('status', filterValues.status);
      const qs = params.toString();
      // useApi auto-unwraps { success, data } -> data (the backlinks array)
      const res = await api.get<BacklinksResponse>(`/api/seo/backlinks${qs ? `?${qs}` : ''}`);
      if (res.error) throw new Error(res.error);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const backlinks = data ?? [];
  // Compute summary metrics from the array since backend does not provide meta
  const activeBacklinks = backlinks.filter((b) => b.status === 'active');
  const domains = new Set(backlinks.map((b) => { try { return new URL(b.sourceUrl).hostname; } catch { return b.sourceUrl; } }));
  const meta = {
    total: backlinks.length,
    referringDomains: domains.size,
    avgDa: backlinks.length > 0
      ? Math.round(backlinks.reduce((sum, b) => sum + (b.domainAuthority ?? 0), 0) / backlinks.length)
      : 0,
    newThisMonth: backlinks.filter((b) => {
      const dateStr = b.firstSeenAt || b.discoveredAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  /* ---- Filter handlers ---- */

  const handleFilterChange = useCallback((v: FilterValues) => {
    setFilterValues(v);
  }, []);

  const handleFilterClear = useCallback(() => {
    setFilterValues({});
  }, []);

  /* ---- Columns ---- */

  const columns: DataTableColumn<Backlink>[] = useMemo(
    () => [
      {
        header: 'Source URL',
        accessor: 'sourceUrl',
        render: (row) => (
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 group max-w-[260px]"
          >
            <span className="text-primary group-hover:text-primary/80 transition-colors text-sm truncate">
              {row.sourceUrl}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </a>
        ),
      },
      {
        header: 'Domain',
        accessor: 'sourceDomain',
        render: (row) => (
          <span className="text-sm text-foreground truncate max-w-[200px] block">
            {row.sourceDomain || '--'}
          </span>
        ),
      },
      {
        header: 'Anchor Text',
        accessor: 'anchorText',
        render: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.anchorText || '--'}
          </span>
        ),
      },
      {
        header: 'DA',
        accessor: 'domainAuthority',
        render: (row) =>
          row.domainAuthority != null ? (
            <span
              className={`font-mono px-1.5 py-0.5 rounded-lg text-xs ${
                row.domainAuthority >= 50
                  ? 'bg-green-500/10 text-green-300'
                  : row.domainAuthority >= 20
                    ? 'bg-yellow-500/10 text-yellow-300'
                    : 'bg-white/[0.04] text-muted-foreground'
              }`}
            >
              {row.domainAuthority}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={row.status === 'active' ? 'success' : 'destructive'}>
            {row.status}
          </Badge>
        ),
      },
      {
        header: 'Discovered',
        accessor: 'firstSeenAt',
        render: (row) => (
          <span className="text-muted-foreground text-sm">
            {(row.firstSeenAt || row.discoveredAt) ? new Date(row.firstSeenAt || row.discoveredAt!).toLocaleDateString() : '--'}
          </span>
        ),
      },
    ],
    [],
  );

  /* ---- Render ---- */

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader
        title="Backlinks"
        subtitle="Monitor and track links pointing to your site"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Backlinks' },
        ]}
        className="mb-8"
      />

      {/* Metric Tiles */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricTile
            label="Total Backlinks"
            value={meta.total}
            icon={<Link2 className="h-4 w-4" />}
          />
          <MetricTile
            label="Referring Domains"
            value={meta.referringDomains}
            icon={<Globe className="h-4 w-4" />}
          />
          <MetricTile
            label="Avg DA"
            value={meta.avgDa}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricTile
            label="New This Month"
            value={meta.newThisMonth}
            icon={<CalendarPlus className="h-4 w-4" />}
            trend="up"
          />
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        className="mb-5"
      />

      {/* Data Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={backlinks}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Link2 className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No backlinks found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Backlinks will appear here as they are discovered.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
