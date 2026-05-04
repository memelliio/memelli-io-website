'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  DataTable,
  type DataTableColumn,
  PageHeader,
  Button,
  Badge,
  type BadgeVariant,
  Skeleton,
} from '@memelli/ui';
import { Card, CardContent } from '../../../../../components/ui/card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Segment {
  id: string;
  name: string;
  filters: any;
  contactCount?: number;
  status?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, BadgeVariant> = {
  active: 'success',
  ACTIVE: 'success',
  draft: 'muted',
  DRAFT: 'muted',
  archived: 'error',
  ARCHIVED: 'error',
};

function filterSummary(filters: any): string {
  if (!filters) return 'All contacts';
  if (Array.isArray(filters)) {
    return filters.length === 0
      ? 'All contacts'
      : filters
          .map((f: any) => `${f.field ?? f.key}: ${f.value}`)
          .join(', ');
  }
  const parts: string[] = [];
  if (filters.tags?.length) parts.push(`Tags: ${filters.tags.join(', ')}`);
  if (filters.type) parts.push(`Type: ${filters.type}`);
  if (filters.source) parts.push(`Source: ${filters.source}`);
  if (filters.hasDeals != null)
    parts.push(`Has Deals: ${filters.hasDeals ? 'Yes' : 'No'}`);
  return parts.length > 0 ? parts.join(' | ') : 'All contacts';
}

function deriveStatus(seg: Segment): string {
  if (seg.status) return seg.status;
  const f = seg.filters;
  const hasFilters =
    f && (Array.isArray(f) ? f.length > 0 : Object.keys(f).length > 0);
  return hasFilters ? 'active' : 'draft';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SegmentsPage() {
  const api = useApi();
  const router = useRouter();

  /* -- Fetch segments ------------------------------------------------ */
  const {
    data: segments = [],
    isLoading,
    error,
  } = useQuery<Segment[]>({
    queryKey: ['crm', 'segments'],
    queryFn: async () => {
      const res = await api.get<any>('/api/crm/segments');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return raw?.data ?? raw?.items ?? [];
    },
  });

  /* -- Column definitions -------------------------------------------- */
  const columns: DataTableColumn<Segment>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <span className="font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      header: 'Contacts',
      accessor: 'contactCount',
      render: (row) => (
        <span className="font-medium text-primary tabular-nums">
          {row.contactCount ?? '\u2014'}
        </span>
      ),
    },
    {
      header: 'Filter Rules',
      accessor: 'filters',
      render: (row) => (
        <span className="text-muted-foreground text-xs max-w-xs truncate block">
          {filterSummary(row.filters)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const s = deriveStatus(row);
        return (
          <Badge variant={statusVariant[s] ?? 'default'}>
            {s.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  /* -- Render -------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="bg-card min-h-screen">
        <div className="space-y-8 p-8">
          <Skeleton variant="line" className="h-8 w-48" />
          <Skeleton variant="line" className="h-4 w-64" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="table-row" className="rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen">
      <div className="space-y-8 p-8">
        {/* Header */}
        <PageHeader
          title="Segments"
          subtitle={`${segments.length} segment${segments.length !== 1 ? 's' : ''} \u2014 group contacts for targeted outreach`}
          breadcrumb={[
            { label: 'CRM', href: '/dashboard/crm' },
            { label: 'Segments' },
          ]}
          actions={
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/crm/segments/new')}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Segment
            </Button>
          }
        />

        {/* Error banner */}
        {error && (
          <div className="rounded-2xl border border-primary/20 bg-primary/80/5 backdrop-blur-xl px-6 py-4 text-sm text-primary/80">
            {error instanceof Error ? error.message : 'Failed to load segments'}
          </div>
        )}

        {/* Table */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <DataTable
            columns={columns}
            data={segments}
            isLoading={false}
            rowKey={(row) => row.id}
            onRowClick={(row) =>
              router.push(`/dashboard/crm/segments/${row.id}`)
            }
            emptyState={
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Filter className="h-8 w-8 mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm">No segments yet</p>
                <button
                  onClick={() =>
                    router.push('/dashboard/crm/segments/new')
                  }
                  className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  Create your first segment
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}