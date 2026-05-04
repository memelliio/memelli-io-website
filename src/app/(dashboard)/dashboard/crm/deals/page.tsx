'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, GitMerge } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  DataTable,
  type DataTableColumn,
  PageHeader,
  Button,
  FilterBar,
  type FilterConfig,
  type FilterValues,
  Badge,
  type BadgeVariant,
  Skeleton,
} from '@memelli/ui';
import { Card, CardContent } from '../../../../../components/ui/card';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Deal {
  id: string;
  title: string;
  value?: number;
  status: string;
  stageName?: string;
  stage?: { name: string };
  pipelineName?: string;
  pipeline?: { name: string };
  contactName?: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  daysInStage?: number;
  stageEnteredAt?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, BadgeVariant> = {
  OPEN: 'primary',
  WON: 'success',
  LOST: 'error',
};

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

function getStageName(d: Deal): string {
  return d.stageName ?? d.stage?.name ?? '';
}

function getPipelineName(d: Deal): string {
  return d.pipelineName ?? d.pipeline?.name ?? '';
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function calcDaysInStage(d: Deal): number {
  if (d.daysInStage != null) return d.daysInStage;
  if (d.stageEnteredAt) {
    return Math.floor(
      (Date.now() - new Date(d.stageEnteredAt).getTime()) / 86_400_000,
    );
  }
  return Math.floor(
    (Date.now() - new Date(d.createdAt).getTime()) / 86_400_000,
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DealsPage() {
  const api = useApi();
  const router = useRouter();
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  /* -- Fetch deals -------------------------------------------------- */
  const {
    data: deals = [],
    isLoading,
    error,
  } = useQuery<Deal[]>({
    queryKey: ['crm', 'deals'],
    queryFn: async () => {
      const res = await api.get<any>('/api/crm/deals');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return raw?.data ?? raw?.items ?? [];
    },
  });

  /* -- Derive unique pipeline & stage names for filters ------------- */
  const pipelineOptions = useMemo(
    () =>
      [...new Set(deals.map(getPipelineName).filter(Boolean))].map((n) => ({
        value: n,
        label: n,
      })),
    [deals],
  );

  const stageOptions = useMemo(
    () =>
      [...new Set(deals.map(getStageName).filter(Boolean))].map((n) => ({
        value: n,
        label: n,
      })),
    [deals],
  );

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'pipeline',
        label: 'Pipeline',
        type: 'select' as const,
        options: pipelineOptions,
      },
      {
        key: 'stage',
        label: 'Stage',
        type: 'select' as const,
        options: stageOptions,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'OPEN', label: 'Open' },
          { value: 'WON', label: 'Won' },
          { value: 'LOST', label: 'Lost' },
        ],
      },
    ],
    [pipelineOptions, stageOptions],
  );

  /* -- Apply filters ------------------------------------------------ */
  const filtered = useMemo(() => {
    let list = deals;
    if (filterValues.pipeline)
      list = list.filter((d) => getPipelineName(d) === filterValues.pipeline);
    if (filterValues.stage)
      list = list.filter((d) => getStageName(d) === filterValues.stage);
    if (filterValues.status)
      list = list.filter((d) => d.status === filterValues.status);
    return list;
  }, [deals, filterValues]);

  /* -- Column definitions ------------------------------------------- */
  const columns: DataTableColumn<Deal>[] = [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => (
        <span className="font-medium text-foreground">{row.title}</span>
      ),
    },
    {
      header: 'Contact',
      accessor: 'contact',
      render: (row) => (
        <span className="text-muted-foreground">{getContactName(row) || '\u2014'}</span>
      ),
    },
    {
      header: 'Value',
      accessor: 'value',
      render: (row) => (
        <span className="font-semibold text-primary tabular-nums">
          {row.value != null ? fmtCurrency(row.value) : '\u2014'}
        </span>
      ),
    },
    {
      header: 'Stage',
      accessor: 'stage',
      render: (row) => (
        <span className="text-muted-foreground">{getStageName(row) || '\u2014'}</span>
      ),
    },
    {
      header: 'Pipeline',
      accessor: 'pipeline',
      render: (row) => (
        <span className="text-muted-foreground">
          {getPipelineName(row) || '\u2014'}
        </span>
      ),
    },
    {
      header: 'Days in Stage',
      accessor: 'daysInStage',
      render: (row) => (
        <span className="text-muted-foreground tabular-nums">
          {calcDaysInStage(row)}d
        </span>
      ),
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
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'default'}>
          {row.status.toLowerCase()}
        </Badge>
      ),
    },
  ];

  /* -- Render ------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="space-y-6 p-8 bg-card min-h-screen">
        <Skeleton variant="line" className="h-8 w-48 bg-card rounded-xl" />
        <Skeleton variant="line" className="h-4 w-64 bg-card rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="table-row" className="bg-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="Deals"
        subtitle={`${filtered.length} deal${filtered.length !== 1 ? 's' : ''} across all pipelines`}
        breadcrumb={[
          { label: 'CRM', href: '/dashboard/crm' },
          { label: 'Deals' },
        ]}
        actions={
          <Button 
            size="sm" 
            onClick={() => router.push('/dashboard/crm/deals/new')}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Deal
          </Button>
        }
        className="text-2xl font-semibold tracking-tight text-foreground"
      />

      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-primary/20 bg-primary/80/5 backdrop-blur-xl px-6 py-3 text-sm text-primary/80">
          {error instanceof Error ? error.message : 'Failed to load deals'}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
        <FilterBar
          filters={filterConfigs}
          values={filterValues}
          onChange={setFilterValues}
          onClear={() => setFilterValues({})}
        />
      </div>

      {/* Table */}
      <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={false}
            rowKey={(row) => row.id}
            onRowClick={(row) =>
              router.push(`/dashboard/crm/deals/${row.id}`)
            }
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <GitMerge className="h-8 w-8 mb-3 text-muted-foreground" />
                <p className="text-sm">No deals found</p>
              </div>
            }
            className="text-muted-foreground leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}