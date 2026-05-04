'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus, Eye, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  FilterBar,
  DataTable,
  type DataTableColumn,
} from '@memelli/ui';
import type { FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

interface Thread {
  id: string;
  title: string;
  category?: { id: string; name: string; slug: string } | null;
  categoryName?: string;
  status: string;
  viewCount?: number;
  views?: number;
  replyCount?: number;
  replies?: number;
  rankingPosition?: number | null;
  _count?: { posts: number; rankingSnapshots: number };
  createdAt: string;
}

interface ThreadsResponse {
  threads: Thread[];
  total: number;
}

const PAGE_SIZE = 25;

const filters: FilterConfig[] = [
  { key: 'search', label: 'Search threads', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'indexed', label: 'Indexed' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'general', label: 'General' },
      { value: 'faq', label: 'FAQ' },
      { value: 'how-to', label: 'How-To' },
      { value: 'discussion', label: 'Discussion' },
    ],
  },
];

const statusColor: Record<string, 'success' | 'warning' | 'muted' | 'primary' | 'info'> = {
  published: 'success',
  indexed: 'info',
  draft: 'muted',
};

export default function ThreadsPage() {
  const api = useApi();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { data, isLoading } = useQuery<ThreadsResponse>({
    queryKey: ['forum-threads', { page, ...filterValues }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
      });
      if (filterValues.search) params.set('search', filterValues.search);
      if (filterValues.status) params.set('status', filterValues.status);
      if (filterValues.category) params.set('clusterId', filterValues.category);
      // useApi auto-unwraps { success, data, meta } -> { data: [...], meta: { total } }
      const res = await api.get<any>(`/api/seo/threads?${params}`);
      if (res.error) throw new Error(res.error);
      const d = res.data ?? {};
      // When meta is present, useApi returns { data: [...], meta: {...} }
      const items = d.data ?? (Array.isArray(d) ? d : []);
      const total = d.meta?.total ?? items.length;
      return { threads: items, total };
    },
  });

  const threads = data?.threads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = useCallback((v: FilterValues) => {
    setFilterValues(v);
    setPage(1);
  }, []);

  const handleFilterClear = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleRowClick = useCallback(
    (thread: Thread) => {
      router.push(`/dashboard/seo/threads/${thread.id}`);
    },
    [router],
  );

  const columns: DataTableColumn<Thread>[] = useMemo(
    () => [
      {
        header: 'Title',
        accessor: 'title',
        render: (row) => (
          <button
            onClick={() => handleRowClick(row)}
            className="text-left group"
          >
            <span className="font-medium text-foreground group-hover:text-red-400 transition-colors duration-150">
              {row.title}
            </span>
          </button>
        ),
      },
      {
        header: 'Category',
        accessor: 'category' as any,
        render: (row) => (
          <Badge variant="default">{typeof row.category === 'object' ? row.category?.name : row.category ?? '—'}</Badge>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => {
          const st = row.status?.toLowerCase();
          return (
            <Badge variant={(statusColor[st] ?? 'muted') as any}>
              {st}
            </Badge>
          );
        },
      },
      {
        header: 'Views',
        accessor: 'viewCount' as any,
        render: (row) => (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {(row.viewCount ?? row.views ?? 0).toLocaleString()}
          </div>
        ),
      },
      {
        header: 'Replies',
        accessor: 'replyCount' as any,
        render: (row) => (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {(row.replyCount ?? row.replies ?? row._count?.posts ?? 0).toLocaleString()}
          </div>
        ),
      },
      {
        header: 'Ranking',
        accessor: 'rankingPosition' as any,
        render: (row) =>
          row.rankingPosition ? (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-foreground font-medium">#{row.rankingPosition}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">--</span>
          ),
      },
      {
        header: 'Created',
        accessor: 'createdAt',
        render: (row) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [handleRowClick],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <PageHeader
        title="Forum Threads"
        subtitle={`${total} thread${total !== 1 ? 's' : ''}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Threads' },
        ]}
        actions={
          <Link href="/dashboard/seo/threads/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New Thread
            </Button>
          </Link>
        }
        className="mb-6"
      />

      <FilterBar
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        className="mb-5"
      />

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={threads}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No threads found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first forum thread to start building SEO authority.
              </p>
              <Link href="/dashboard/seo/threads/new">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  className="mt-4"
                >
                  Create Thread
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
