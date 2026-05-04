'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Send } from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  DataTable,
  FilterBar,
  Skeleton,
  type DataTableColumn,
  type FilterConfig,
  type FilterValues,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* -- Types --------------------------------------------------------- */

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  messagesSent: number;
  replies: number;
  conversionRate: number;
  createdAt: string;
}

interface CampaignsResponse {
  success: boolean;
  data: Campaign[];
  meta: { total: number; page: number; perPage: number };
}

/* -- Constants ----------------------------------------------------- */

const PAGE_SIZE = 25;

const STATUS_VARIANT: Record<CampaignStatus, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info',
};

const STATUS_FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'completed', label: 'Completed' },
    ],
  },
];

/* -- Page ---------------------------------------------------------- */

export default function OutreachPage() {
  const api = useApi();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const statusFilter = filterValues.status as CampaignStatus | undefined;

  const { data, isLoading } = useQuery<CampaignsResponse>({
    queryKey: ['outreach-campaigns', { page, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await api.get<CampaignsResponse>(
        `/api/leads/outreach?${params}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const campaigns = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* -- Handlers ---------------------------------------------------- */

  const handleRowClick = useCallback(
    (campaign: Campaign) => {
      router.push(`/dashboard/leads/outreach/${campaign.id}`);
    },
    [router],
  );

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
  }, []);

  /* -- Columns ----------------------------------------------------- */

  const columns: DataTableColumn<Campaign>[] = useMemo(
    () => [
      {
        header: 'Campaign Name',
        accessor: 'name',
        render: (row) => (
          <span className="font-medium tracking-tight text-foreground">{row.name}</span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge
            variant={
              (STATUS_VARIANT[row.status] ?? 'default') as any
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        header: 'Messages Sent',
        accessor: 'messagesSent',
        render: (row) => (
          <span className="text-foreground tabular-nums">
            {row.messagesSent.toLocaleString()}
          </span>
        ),
      },
      {
        header: 'Replies',
        accessor: 'replies',
        render: (row) => (
          <span className="text-foreground tabular-nums">
            {row.replies.toLocaleString()}
          </span>
        ),
      },
      {
        header: 'Conversion Rate',
        accessor: 'conversionRate',
        render: (row) => (
          <span className="text-foreground tabular-nums">
            {(row.conversionRate * 100).toFixed(1)}%
          </span>
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
    [],
  );

  /* -- Render ------------------------------------------------------ */

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Outreach Campaigns"
        subtitle={`${total} campaign${total !== 1 ? 's' : ''}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Outreach' },
        ]}
        actions={
          <Link href="/dashboard/leads/outreach/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Campaign
            </Button>
          </Link>
        }
        className="mb-8"
      />

      <FilterBar
        filters={STATUS_FILTERS}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={() => handleFilterChange({})}
        className="mb-6"
      />

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-lg shadow-black/10">
        <DataTable
          columns={columns}
          data={campaigns}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Send className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium tracking-tight">
                {statusFilter
                  ? 'No campaigns match your filter'
                  : 'No campaigns yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter
                  ? 'Try adjusting your filter.'
                  : 'Create your first outreach campaign to engage leads.'}
              </p>
              {!statusFilter && (
                <Link href="/dashboard/leads/outreach/new">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="mt-4"
                  >
                    Create Campaign
                  </Button>
                </Link>
              )}
            </div>
          }
        />
      </div>

      {/* Server-side pagination controls */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-5 px-1">
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
