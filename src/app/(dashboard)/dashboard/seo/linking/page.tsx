'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Link2,
  AlertTriangle,
  Lightbulb,
  Unlink,
  ArrowRight,
  Sparkles,
  FileWarning,
} from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  MetricTile,
  DataTable,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  EmptyState,
} from '@memelli/ui';
import type { DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InternalLink {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceSlug: string;
  targetId: string;
  targetTitle: string;
  targetSlug: string;
  anchorText: string;
  type: 'auto' | 'manual' | 'ai';
  status: 'active' | 'broken';
  createdAt: string;
}

interface OrphanThread {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  views: number;
}

interface LinkSuggestion {
  id: string;
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
  suggestedAnchor: string;
  relevanceScore: number;
  reason: string;
}

interface InternalLinksData {
  totalLinks: number;
  orphanPages: number;
  avgLinksPerPage: number;
  brokenLinks: number;
  links: InternalLink[];
  orphanThreads: OrphanThread[];
  suggestions: LinkSuggestion[];
}

type InternalLinksResponse = InternalLinksData;

/* ------------------------------------------------------------------ */
/*  Link type badge colors                                             */
/* ------------------------------------------------------------------ */

const TYPE_STYLES: Record<string, string> = {
  auto: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  manual: 'bg-primary/10 text-primary border-primary/20',
  ai: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

/* ------------------------------------------------------------------ */
/*  DataTable column defs                                              */
/* ------------------------------------------------------------------ */

const linkColumns: DataTableColumn<InternalLink>[] = [
  {
    header: 'Source',
    accessor: 'sourceTitle',
    render: (row) => (
      <Link
        href={`/dashboard/seo/threads/${row.sourceId}`}
        className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200"
      >
        {row.sourceTitle}
      </Link>
    ),
  },
  {
    header: '',
    accessor: 'id',
    className: 'w-8 text-center',
    render: () => (
      <ArrowRight className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
    ),
  },
  {
    header: 'Target',
    accessor: 'targetTitle',
    render: (row) => (
      <Link
        href={`/dashboard/seo/threads/${row.targetId}`}
        className="text-sm text-primary hover:text-primary/80 transition-all duration-200"
      >
        {row.targetTitle}
      </Link>
    ),
  },
  {
    header: 'Anchor Text',
    accessor: 'anchorText',
    className: 'max-w-[200px]',
    render: (row) => (
      <span className="text-sm text-muted-foreground truncate block">{row.anchorText}</span>
    ),
  },
  {
    header: 'Type',
    accessor: 'type',
    className: 'w-24',
    render: (row) => (
      <Badge variant="default" className={`border text-xs ${TYPE_STYLES[row.type] ?? ''}`}>
        {row.type}
      </Badge>
    ),
  },
  {
    header: 'Status',
    accessor: 'status',
    className: 'w-24',
    render: (row) => (
      <Badge
        variant="default"
        className={`border text-xs ${
          row.status === 'broken'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}
      >
        {row.status}
      </Badge>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function InternalLinkingPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<InternalLinksResponse>({
    queryKey: ['seo-internal-links'],
    queryFn: async () => {
      const res = await api.get<InternalLinksResponse>('/api/seo/internal-links');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const d = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        title="Internal Linking"
        subtitle="Link map, orphan pages, and AI-powered linking suggestions"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Internal Linking' },
        ]}
        className="mb-6"
      />

      {/* ---- Loading skeleton ---- */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      ) : !d ? (
        <EmptyState
          icon={<Link2 className="h-6 w-6" />}
          title="No linking data"
          description="Create and publish threads to build your internal link structure."
        />
      ) : (
        <div className="space-y-6">
          {/* ---- Metric Tiles ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Total Links"
              value={d.totalLinks}
              icon={<Link2 className="h-4 w-4" />}
            />
            <MetricTile
              label="Orphan Pages"
              value={d.orphanPages}
              icon={<FileWarning className="h-4 w-4" />}
              trend={d.orphanPages > 0 ? 'down' : 'flat'}
            />
            <MetricTile
              label="Avg Links Per Page"
              value={d.avgLinksPerPage.toFixed(1)}
              icon={<Link2 className="h-4 w-4" />}
            />
            <MetricTile
              label="Broken Links"
              value={d.brokenLinks}
              icon={<Unlink className="h-4 w-4" />}
              trend={d.brokenLinks > 0 ? 'down' : 'flat'}
            />
          </div>

          {/* ---- Link Map (DataTable) ---- */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground tracking-tight font-semibold">
                <Link2 className="h-4 w-4 text-primary" />
                Link Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable<InternalLink>
                columns={linkColumns}
                data={d.links}
                isLoading={false}
                pageSize={25}
                rowKey={(row) => row.id}
                emptyState={
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No internal links yet. Publish threads and add links to build your link map.
                  </div>
                }
              />
            </CardContent>
          </Card>

          {/* ---- Orphan Threads + Suggestions side by side ---- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Orphan Threads */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground tracking-tight font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Orphan Threads
                  {d.orphanThreads.length > 0 && (
                    <Badge
                      variant="default"
                      className="ml-auto border border-amber-500/20 bg-amber-500/10 text-xs text-amber-400"
                    >
                      {d.orphanThreads.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d.orphanThreads.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No orphan threads. All threads have at least one inbound link.
                  </p>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {d.orphanThreads.map((t) => (
                      <Link
                        key={t.id}
                        href={`/dashboard/seo/threads/${t.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {t.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant="default"
                                className="border border-white/[0.06] bg-white/[0.04] text-xs text-muted-foreground"
                              >
                                {t.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">0 inbound links</span>
                            </div>
                          </div>
                          <span className="ml-3 shrink-0 text-xs tabular-nums text-muted-foreground">
                            {t.views.toLocaleString()} views
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Linking Suggestions */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground tracking-tight font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Linking Suggestions
                  {d.suggestions.length > 0 && (
                    <Badge
                      variant="default"
                      className="ml-auto border border-primary/20 bg-primary/10 text-xs text-primary"
                    >
                      {d.suggestions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d.suggestions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No suggestions at this time. Publish more threads to generate AI linking recommendations.
                  </p>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {d.suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-all duration-200 hover:bg-white/[0.04]"
                      >
                        {/* Source -> Target */}
                        <div className="mb-1.5 flex items-center gap-2 text-xs">
                          <span className="truncate text-foreground">{s.sourceTitle}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate text-primary">{s.targetTitle}</span>
                        </div>

                        {/* Anchor + Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Anchor: &ldquo;{s.suggestedAnchor}&rdquo;
                          </span>
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              s.relevanceScore >= 80
                                ? 'text-emerald-400'
                                : s.relevanceScore >= 50
                                  ? 'text-amber-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {s.relevanceScore}% match
                          </span>
                        </div>

                        {/* AI Reason */}
                        {s.reason && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            <Lightbulb className="mr-1 inline-block h-3 w-3 text-amber-500" />
                            {s.reason}
                          </p>
                        )}
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
