'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RotateCcw } from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  DataTable,
  FilterBar,
  Skeleton,
  ConfirmDialog,
  EmptyState,
  type DataTableColumn,
  type FilterConfig,
  type FilterValues,
  type BadgeVariant,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Payment {
  id: string;
  orderNumber?: string;
  orderId?: string;
  customerName?: string;
  contactName?: string;
  amount: number;
  currency?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'PAID' | string;
  provider?: string;
  method?: string;
  createdAt: string;
}

interface PaymentsResponse {
  success?: boolean;
  data: Payment[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  COMPLETED: 'success',
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  REFUNDED: 'muted',
};

const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'FAILED', label: 'Failed' },
];

const FILTER_CONFIG: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS,
  },
  {
    key: 'dateFrom',
    label: 'From',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: 'To',
    type: 'date',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PaymentsPage() {
  const { get, patch } = useApi();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterValues>({});
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refunding, setRefunding] = useState(false);

  /* ---- Data fetch ------------------------------------------------ */

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['commerce-payments'],
    queryFn: async () => {
      const res = await get<PaymentsResponse>('/api/commerce/payments');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      return (raw as any)?.data ?? (raw as any) ?? [];
    },
  });

  /* ---- Filtering ------------------------------------------------- */

  const filtered = useMemo(() => {
    return (payments as Payment[]).filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (new Date(p.createdAt) < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(p.createdAt) > to) return false;
      }
      return true;
    });
  }, [payments, filters]);

  /* ---- Refund handler -------------------------------------------- */

  const handleRefund = useCallback(async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await patch(`/api/commerce/payments/${refundTarget.id}/status`, { status: 'REFUNDED' });
      queryClient.invalidateQueries({ queryKey: ['commerce-payments'] });
    } finally {
      setRefunding(false);
      setRefundTarget(null);
    }
  }, [refundTarget, patch, queryClient]);

  /* ---- Table columns --------------------------------------------- */

  const columns: DataTableColumn<Payment>[] = useMemo(
    () => [
      {
        header: 'Payment ID',
        accessor: 'id',
        render: (row) => (
          <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}...</span>
        ),
      },
      {
        header: 'Order #',
        accessor: 'orderNumber',
        render: (row) => (
          <span className="font-mono text-xs text-foreground tracking-tight">
            {row.orderNumber ?? row.orderId?.slice(0, 8) ?? '\u2014'}
          </span>
        ),
      },
      {
        header: 'Customer',
        accessor: 'customerName',
        render: (row) => (
          <span className="text-sm text-foreground tracking-tight">
            {row.customerName ?? row.contactName ?? '\u2014'}
          </span>
        ),
      },
      {
        header: 'Amount',
        accessor: 'amount',
        render: (row) => (
          <span className="font-semibold text-emerald-400 tracking-tight">{formatCurrency(row.amount ?? 0)}</span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={STATUS_VARIANT[row.status] ?? 'default'}>
            {row.status}
          </Badge>
        ),
      },
      {
        header: 'Method',
        accessor: 'method',
        render: (row) => (
          <span className="text-xs capitalize text-muted-foreground">
            {row.method ?? row.provider ?? '\u2014'}
          </span>
        ),
      },
      {
        header: 'Date',
        accessor: 'createdAt',
        render: (row) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
        ),
      },
      {
        header: '',
        accessor: '__actions',
        render: (row) =>
          (row.status === 'COMPLETED' || row.status === 'PAID') ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setRefundTarget(row);
              }}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Refund
            </Button>
          ) : null,
      },
    ],
    [],
  );

  /* ---- Render ---------------------------------------------------- */

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
      <PageHeader
        title="Payments"
        subtitle="Track all payment transactions across stores"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Payments' },
        ]}
      />

      {/* Filters */}
      <FilterBar
        filters={FILTER_CONFIG}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      {/* Table */}
      {isLoading ? (
        <Skeleton variant="table-row" count={8} />
      ) : (
        <DataTable<Payment>
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
          emptyState={
            <EmptyState
              icon={<CreditCard className="h-10 w-10 text-muted-foreground" />}
              title="No payments found"
              description="Payments will appear here once orders are placed."
            />
          }
        />
      )}

      {/* Refund confirmation dialog */}
      <ConfirmDialog
        open={!!refundTarget}
        onCancel={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="Refund payment"
        description={
          refundTarget
            ? `Are you sure you want to refund ${formatCurrency(refundTarget.amount)} for payment ${refundTarget.id.slice(0, 8)}...?`
            : ''
        }
        confirmLabel="Refund"
        variant="danger"
        loading={refunding}
      />
    </div>
  );
}