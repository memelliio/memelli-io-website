'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RefreshCw, Pause, Play, X, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  Badge,
  Skeleton,
  Button,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | string;
  planName?: string;
  productName?: string;
  amount: number;
  currency?: string;
  interval: 'monthly' | 'yearly' | 'weekly' | string;
  nextBillingDate?: string;
  createdAt: string;
  canceledAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  storeName?: string;
  storeId?: string;
}

interface SubscriptionsResponse {
  data: Subscription[];
  meta: { total: number };
}

/* ------------------------------------------------------------------ */
/*  Status badge variant map                                           */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive' | 'primary'> = {
  active: 'success',
  trialing: 'primary',
  past_due: 'warning',
  canceled: 'destructive',
  // Legacy uppercase mapping
  ACTIVE: 'success',
  PAUSED: 'warning',
  CANCELLED: 'destructive',
};

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'trialing', label: 'Trialing' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatInterval(interval: string): string {
  const map: Record<string, string> = {
    monthly: 'Monthly',
    yearly: 'Yearly',
    weekly: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
    WEEKLY: 'Weekly',
  };
  return map[interval] ?? interval;
}

function cycleMRR(amount: number, interval: string): number {
  const lower = interval?.toLowerCase();
  if (lower === 'yearly') return amount / 12;
  if (lower === 'weekly') return amount * 4.33;
  return amount;
}

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function SubscriptionDetail({
  subscription,
  onClose,
  onAction,
  isActioning,
}: {
  subscription: Subscription;
  onClose: () => void;
  onAction: (id: string, action: 'pause' | 'resume' | 'cancel') => void;
  isActioning: boolean;
}) {
  const status = subscription.status?.toLowerCase();
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-background backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-white/[0.06] bg-card backdrop-blur-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Subscription Detail</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{subscription.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] p-1.5 text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Customer</p>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              {subscription.customerName ?? '\u2014'}
            </p>
            {subscription.customerEmail && (
              <p className="text-xs text-muted-foreground leading-relaxed">{subscription.customerEmail}</p>
            )}
          </div>

          {/* Plan */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              {subscription.planName ?? subscription.productName ?? '\u2014'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {formatCurrency(subscription.amount, subscription.currency)}
              </span>
              <span className="rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground text-xs px-2 py-0.5">
                {formatInterval(subscription.interval)}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
            <Badge variant={statusVariant[subscription.status] ?? 'muted'} className="capitalize">
              {subscription.status?.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>

          {/* Dates */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dates</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-muted-foreground leading-relaxed">
                  {new Date(subscription.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Billing</p>
                <p className="text-muted-foreground leading-relaxed">
                  {subscription.nextBillingDate
                    ? new Date(subscription.nextBillingDate).toLocaleDateString()
                    : '\u2014'}
                </p>
              </div>
              {subscription.canceledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Canceled</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {new Date(subscription.canceledAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {status !== 'canceled' && status !== 'cancelled' && (
            <div className="flex items-center gap-2 pt-2">
              {status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActioning}
                  onClick={() => onAction(subscription.id, 'pause')}
                  className="border-white/[0.08] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
                >
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                  Pause
                </Button>
              )}
              {(status === 'paused' || subscription.status === 'PAUSED') && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActioning}
                  onClick={() => onAction(subscription.id, 'resume')}
                  className="border-white/[0.08] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Resume
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={isActioning}
                onClick={() => onAction(subscription.id, 'cancel')}
                className="border-primary/30 text-primary hover:bg-primary/80/[0.08]"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubscriptionsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterValues>({ status: '' });
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  /* ---- Data fetching ---- */
  const { data, isLoading } = useQuery<SubscriptionsResponse>({
    queryKey: ['commerce-subscriptions', filters.status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      if (filters.status) params.set('status', filters.status);

      const res = await api.get<SubscriptionsResponse>(
        `/api/commerce/subscriptions?${params.toString()}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const subscriptions = data?.data ?? (data as unknown as Subscription[]) ?? [];
  const total = data?.meta?.total ?? subscriptions.length;
  const totalPages = Math.ceil(total / perPage);

  /* ---- Mutation for status actions ---- */
  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' | 'cancel' }) => {
      const statusMap: Record<string, string> = {
        pause: 'PAUSED',
        resume: 'ACTIVE',
        cancel: 'CANCELLED',
      };
      const res = await api.patch(`/api/commerce/subscriptions/${id}`, {
        status: statusMap[action],
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commerce-subscriptions'] });
      setSelectedSub(null);
    },
  });

  const handleAction = useCallback(
    (id: string, action: 'pause' | 'resume' | 'cancel') => {
      actionMutation.mutate({ id, action });
    },
    [actionMutation],
  );

  /* ---- Computed stats ---- */
  const activeOnly = subscriptions.filter(
    (s) => s.status?.toLowerCase() === 'active',
  );
  const mrr = activeOnly.reduce(
    (sum, s) => sum + cycleMRR(s.amount ?? 0, s.interval ?? 'monthly'),
    0,
  );

  /* ---- Filter config ---- */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: SUBSCRIPTION_STATUSES,
    },
  ];

  /* ---- Table columns ---- */
  const columns: DataTableColumn<Subscription>[] = useMemo(
    () => [
      {
        header: 'Customer',
        accessor: 'customerName',
        render: (row) => (
          <div>
            <p className="font-medium text-foreground tracking-tight">{row.customerName ?? '\u2014'}</p>
            {row.customerEmail && (
              <p className="text-xs text-muted-foreground mt-0.5">{row.customerEmail}</p>
            )}
          </div>
        ),
      },
      {
        header: 'Plan',
        accessor: 'planName',
        render: (row) => (
          <span className="text-muted-foreground leading-relaxed">
            {row.planName ?? row.productName ?? '\u2014'}
          </span>
        ),
      },
      {
        header: 'Amount',
        accessor: 'amount',
        render: (row) => (
          <span className="font-semibold text-foreground tracking-tight">
            {formatCurrency(row.amount ?? 0, row.currency)}
          </span>
        ),
      },
      {
        header: 'Interval',
        accessor: 'interval',
        render: (row) => (
          <span className="inline-block rounded-full bg-white/[0.06] border border-white/[0.08] text-muted-foreground text-xs px-2 py-0.5">
            {formatInterval(row.interval)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={statusVariant[row.status] ?? 'muted'} className="capitalize">
            {row.status?.toLowerCase().replace('_', ' ')}
          </Badge>
        ),
      },
      {
        header: 'Next Billing',
        accessor: 'nextBillingDate',
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.nextBillingDate
              ? new Date(row.nextBillingDate).toLocaleDateString()
              : '\u2014'}
          </span>
        ),
      },
      {
        header: 'Created',
        accessor: 'createdAt',
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  /* ---- Row click -> detail panel ---- */
  const handleRowClick = (sub: Subscription) => {
    setSelectedSub(sub);
  };

  return (
    <div className="space-y-6 bg-card p-8">
      <PageHeader
        title="Subscriptions"
        subtitle={`${total} subscription${total !== 1 ? 's' : ''} across all stores`}
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Subscriptions' },
        ]}
      />

      {/* MRR + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Est. Monthly Recurring Revenue',
            value: formatCurrency(mrr),
            icon: TrendingUp,
            accent: 'text-primary',
            bg: 'bg-primary/10 border border-primary/20',
          },
          {
            label: 'Active Subscriptions',
            value: activeOnly.length,
            icon: Users,
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border border-emerald-500/20',
          },
          {
            label: 'Total Subscriptions',
            value: subscriptions.length,
            icon: DollarSign,
            accent: 'text-muted-foreground',
            bg: 'bg-white/[0.04] border border-white/[0.08]',
          },
        ].map(({ label, value, icon: Icon, accent, bg }) => (
          <div key={label} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-semibold tracking-tight mt-1 ${accent}`}>{value}</p>
              </div>
              <div className={`rounded-xl ${bg} p-2.5`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        onClear={() => {
          setFilters({ status: '' });
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subscriptions}
          isLoading={false}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm leading-relaxed">
                {filters.status ? 'No subscriptions match your filters' : 'No subscriptions yet'}
              </p>
            </div>
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-3">
          <p className="text-xs text-muted-foreground tracking-wider">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-white/[0.08] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border-white/[0.08] text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedSub && (
        <SubscriptionDetail
          subscription={selectedSub}
          onClose={() => setSelectedSub(null)}
          onAction={handleAction}
          isActioning={actionMutation.isPending}
        />
      )}
    </div>
  );
}
