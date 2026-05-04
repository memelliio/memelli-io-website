'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Zap,
  Globe,
  MessageSquare,
  Search as SearchIcon,
  PenLine,
  Archive,
  CheckCheck,
} from 'lucide-react';
import {
  PageHeader,
  DataTable,
  Badge,
  StatusBadge,
  Skeleton,
  EmptyState,
  Button,
  FilterBar,
  type FilterValues,
  type DataTableColumn,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';
import { WorkspaceLayout } from '../../../../../components/layout/WorkspaceLayout';
import { SignalDetailPanel } from './signal-detail-panel';

/* -- Types --------------------------------------------------------- */

type SignalSource = 'reddit' | 'craigslist' | 'google' | 'manual';
type SignalStatus = 'new' | 'reviewed' | 'converted' | 'archived';

interface Signal {
  id: string;
  source: SignalSource;
  content: string;
  score: number;
  status: SignalStatus;
  capturedAt: string;
  enrichmentData?: Record<string, unknown>;
  rawData?: string;
}

interface SignalsResponse {
  success: boolean;
  data: Signal[];
  meta: { total: number; page: number; perPage: number };
}

/* -- Constants ----------------------------------------------------- */

const PAGE_SIZE = 25;

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  reddit: <MessageSquare className="h-4 w-4 text-orange-400" />,
  craigslist: <Globe className="h-4 w-4 text-red-400" />,
  google: <SearchIcon className="h-4 w-4 text-blue-400" />,
  manual: <PenLine className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_VARIANT: Record<SignalStatus, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reviewed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function truncate(text: string, max = 80): string {
  if (!text) return '\u2014';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/* -- Filter config ------------------------------------------------- */

const filterConfigs = [
  {
    key: 'source',
    label: 'Source',
    type: 'select' as const,
    options: [
      { value: 'reddit', label: 'Reddit' },
      { value: 'craigslist', label: 'Craigslist' },
      { value: 'google', label: 'Google' },
      { value: 'manual', label: 'Manual' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'new', label: 'New' },
      { value: 'reviewed', label: 'Reviewed' },
      { value: 'converted', label: 'Converted' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  { key: 'search', label: 'Search', type: 'text' as const },
];

/* -- Table columns ------------------------------------------------- */

const columns: DataTableColumn<Signal>[] = [
  {
    header: '',
    accessor: '_select',
    className: 'w-10',
    render: () => null, // placeholder -- checkbox injected via wrapper
  },
  {
    header: 'Source',
    accessor: 'source',
    className: 'w-32',
    render: (row) => (
      <div className="flex items-center gap-2">
        {SOURCE_ICONS[row.source] ?? <Globe className="h-4 w-4 text-muted-foreground" />}
        <span className="text-xs text-foreground capitalize">{row.source}</span>
      </div>
    ),
  },
  {
    header: 'Content Preview',
    accessor: 'content',
    render: (row) => (
      <span className="text-sm text-foreground tracking-tight">{truncate(row.content)}</span>
    ),
  },
  {
    header: 'Score',
    accessor: 'score',
    className: 'w-20 text-right',
    render: (row) => (
      <span className={`font-semibold tabular-nums ${scoreColor(row.score)}`}>
        {row.score}
      </span>
    ),
  },
  {
    header: 'Status',
    accessor: 'status',
    className: 'w-28',
    render: (row) => (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize backdrop-blur-xl ${STATUS_VARIANT[row.status] ?? STATUS_VARIANT.new}`}
      >
        {row.status}
      </span>
    ),
  },
  {
    header: 'Captured At',
    accessor: 'capturedAt',
    className: 'w-36',
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.capturedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    ),
  },
];

/* -- Page component ------------------------------------------------ */

export default function SignalsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { openRecord } = useWorkspacePanel();

  const [filters, setFilters] = useState<FilterValues>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* -- Fetch signals -- */
  const { data, isLoading } = useQuery<SignalsResponse>({
    queryKey: ['lead-signals', { filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.source) params.set('source', filters.source);
      if (filters.status) params.set('status', filters.status);
      params.set('perPage', String(PAGE_SIZE));
      const res = await api.get<SignalsResponse>(`/api/leads/signals?${params}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const signals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  /* -- Bulk actions -- */
  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'reviewed' | 'archived' }) => {
      const res = await api.post('/api/leads/signals/bulk', { ids, status: action });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === 'reviewed'
          ? `${vars.ids.length} signal(s) marked reviewed`
          : `${vars.ids.length} signal(s) archived`,
      );
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['lead-signals'] });
    },
    onError: () => {
      toast.error('Bulk action failed');
    },
  });

  const handleBulk = useCallback(
    (action: 'reviewed' | 'archived') => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      bulkMutation.mutate({ ids, action });
    },
    [selected, bulkMutation],
  );

  /* -- Selection helpers -- */
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === signals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(signals.map((s) => s.id)));
    }
  }, [selected.size, signals]);

  /* -- Row click -> open slide panel -- */
  const handleRowClick = useCallback(
    (signal: Signal) => {
      openRecord(signal.id, 'signal', signal, 'lg');
    },
    [openRecord],
  );

  /* -- Columns with checkbox -- */
  const columnsWithCheckbox = useMemo<DataTableColumn<Signal>[]>(
    () => [
      {
        header: '',
        accessor: '_select',
        className: 'w-10',
        render: (row) => (
          <input
            type="checkbox"
            checked={selected.has(row.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(row.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.03] text-red-500 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
          />
        ),
      },
      ...columns.filter((c) => c.accessor !== '_select'),
    ],
    [selected, toggleSelect],
  );

  return (
    <WorkspaceLayout
      panelContent={<SignalDetailPanel />}
      panelWidth="lg"
      panelTitle="Signal Details"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* -- Header -- */}
        <PageHeader
          title="Signals"
          subtitle={`${total} signal${total !== 1 ? 's' : ''} detected`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Leads', href: '/dashboard/leads' },
            { label: 'Signals' },
          ]}
          className="mb-8"
        />

        {/* -- Filters -- */}
        <div className="mb-6">
          <FilterBar
            filters={filterConfigs}
            values={filters}
            onChange={(vals) => setFilters(vals)}
            onClear={() => setFilters({})}
          />
        </div>

        {/* -- Bulk action bar -- */}
        {selected.size > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl px-5 py-3">
            <span className="text-sm text-red-300 font-medium tracking-tight">
              {selected.size} selected
            </span>
            <div className="h-4 w-px bg-red-500/20" />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={() => handleBulk('reviewed')}
              isLoading={bulkMutation.isPending}
            >
              Mark Reviewed
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Archive className="h-3.5 w-3.5" />}
              onClick={() => handleBulk('archived')}
              isLoading={bulkMutation.isPending}
            >
              Archive
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* -- Data table -- */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-lg shadow-black/10">
          <DataTable<Signal>
            columns={columnsWithCheckbox}
            data={signals}
            isLoading={isLoading}
            pageSize={PAGE_SIZE}
            rowKey={(row) => row.id}
            onRowClick={handleRowClick}
            emptyState={
              <EmptyState
                icon={<Zap className="h-6 w-6" />}
                title="No signals found"
                description={
                  Object.keys(filters).length > 0
                    ? 'Try adjusting your filters.'
                    : 'Signals will appear here as they are detected.'
                }
                className="border-0 bg-transparent"
              />
            }
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
