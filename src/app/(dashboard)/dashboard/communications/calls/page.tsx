'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneCall,
  Mic,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  DataTable,
  type DataTableColumn,
  FilterBar,
  type FilterValues,
  SlidePanel,
} from '@memelli/ui';
import Link from 'next/link';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';
import { CallDetailPanel } from './call-detail-panel';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface CallRecord {
  id: string;
  direction: 'inbound' | 'outbound';
  contactName: string;
  phoneNumber: string;
  duration: number;
  status: 'completed' | 'missed' | 'voicemail' | 'busy' | 'in-progress';
  createdAt: string;
  recordingUrl?: string | null;
  transcript?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  disposition?: string | null;
  notes?: string | null;
}

interface CallsResponse {
  data: CallRecord[];
  meta: { total: number; page: number; perPage: number };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 25;

const directionIcons: Record<string, typeof PhoneIncoming> = {
  inbound: PhoneIncoming,
  outbound: PhoneOutgoing,
};

const statusBadge: Record<
  string,
  { variant: 'primary' | 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }
> = {
  completed: { variant: 'success', label: 'Completed' },
  missed: { variant: 'error', label: 'Missed' },
  voicemail: { variant: 'warning', label: 'Voicemail' },
  busy: { variant: 'default', label: 'Busy' },
  'in-progress': { variant: 'info', label: 'In Progress' },
};

const filterConfigs = [
  {
    key: 'direction',
    label: 'Direction',
    type: 'select' as const,
    options: [
      { value: 'inbound', label: 'Inbound' },
      { value: 'outbound', label: 'Outbound' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'completed', label: 'Completed' },
      { value: 'missed', label: 'Missed' },
      { value: 'voicemail', label: 'Voicemail' },
      { value: 'busy', label: 'Busy' },
      { value: 'in-progress', label: 'In Progress' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function CallsPage() {
  const api = useApi();
  const { openRecord, closeRecord, isOpen, selectedRecord } = useWorkspacePanel();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({});

  /* ---- data fetch ---- */
  const { data, isLoading } = useQuery<CallsResponse>({
    queryKey: ['calls', { page, filters }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PAGE_SIZE),
        ...(filters.direction ? { direction: filters.direction } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      });
      const res = await api.get<CallsResponse>(`/api/comms/calls?${params}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const calls = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* ---- handlers ---- */
  const handleRowClick = useCallback(
    (call: CallRecord) => {
      openRecord(call.id, 'call', call, 'lg');
    },
    [openRecord],
  );

  /* ---- panel title ---- */
  const panelTitle = selectedRecord?.type === 'call'
    ? (selectedRecord.data?.contactName ?? 'Call Detail')
    : 'Call Detail';

  /* ---- columns ---- */
  const columns: DataTableColumn<CallRecord>[] = useMemo(
    () => [
      {
        header: 'Contact',
        accessor: 'contactName',
        render: (row) => {
          const DirIcon =
            row.status === 'missed'
              ? PhoneMissed
              : directionIcons[row.direction] ?? Phone;
          return (
            <button
              onClick={() => handleRowClick(row)}
              className="flex items-center gap-3 text-left group"
            >
              <DirIcon
                className={`h-4 w-4 shrink-0 ${
                  row.status === 'missed'
                    ? 'text-primary'
                    : row.direction === 'inbound'
                      ? 'text-blue-400'
                      : 'text-emerald-400'
                }`}
              />
              <div className="min-w-0">
                <span className="font-medium tracking-tight font-semibold text-foreground group-hover:text-primary transition-all duration-200 truncate block">
                  {row.contactName}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed font-mono">
                  {row.phoneNumber}
                </span>
              </div>
            </button>
          );
        },
      },
      {
        header: 'Direction',
        accessor: 'direction',
        render: (row) => (
          <Badge variant={row.direction === 'inbound' ? 'info' : 'primary'}>
            {row.direction === 'inbound' ? 'Inbound' : 'Outbound'}
          </Badge>
        ),
      },
      {
        header: 'Duration',
        accessor: 'duration',
        render: (row) => (
          <span className="text-muted-foreground leading-relaxed tabular-nums">
            {row.status === 'missed' ? '\u2014' : formatDuration(row.duration)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => {
          const cfg = statusBadge[row.status] ?? statusBadge.completed;
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        header: 'Recording',
        accessor: 'recordingUrl',
        render: (row) => (
          <span className="flex items-center gap-1.5">
            {row.recordingUrl ? (
              <>
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400">Available</span>
              </>
            ) : (
              <span className="text-xs text-white/20">\u2014</span>
            )}
          </span>
        ),
      },
      {
        header: 'Timestamp',
        accessor: 'createdAt',
        render: (row) => (
          <span className="text-muted-foreground leading-relaxed text-sm">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ),
      },
    ],
    [handleRowClick],
  );

  /* ---- render ---- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader
        title="Call Log"
        subtitle={`${total} total call${total !== 1 ? 's' : ''}`}
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Calls' },
        ]}
        actions={
          <Link href="/dashboard/communications/calls/dialer">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
            >
              Make Call
            </Button>
          </Link>
        }
        className="mb-6"
      />

      {/* Filters */}
      <div className="mb-5">
        <FilterBar
          filters={filterConfigs}
          values={filters}
          onChange={(vals) => {
            setFilters(vals);
            setPage(1);
          }}
          onClear={() => {
            setFilters({});
            setPage(1);
          }}
        />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-card backdrop-blur-xl border border-white/[0.04] overflow-hidden">
        <DataTable
          columns={columns}
          data={calls}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          rowKey={(row) => row.id}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground leading-relaxed">
              <Phone className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {Object.keys(filters).length > 0
                  ? 'No calls match your filters'
                  : 'No calls yet'}
              </p>
              <p className="text-xs text-white/20 mt-1">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters.'
                  : 'Call history will appear here.'}
              </p>
            </div>
          }
        />
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
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

      {/* Call Detail Slide Panel */}
      <SlidePanel
        open={isOpen && selectedRecord?.type === 'call'}
        onClose={closeRecord}
        title={panelTitle}
        width="lg"
      >
        <CallDetailPanel />
      </SlidePanel>
    </div>
  );
}
