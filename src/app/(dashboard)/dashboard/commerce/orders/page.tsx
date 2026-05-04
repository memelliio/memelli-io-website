'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string };
}

interface OrderContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  currency?: string;
  notes?: string;
  storeId: string;
  contact?: OrderContact;
  items: OrderItem[];
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

interface OrdersResponse {
  data: Order[];
  meta: { total: number };
}

/* ------------------------------------------------------------------ */
/*  Status badge variant map                                           */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive' | 'primary'> = {
  PENDING: 'warning',
  PROCESSING: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function customerName(order: Order): string {
  if (!order.contact) return '\u2014';
  const { firstName, lastName, email } = order.contact;
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ');
  return email ?? '\u2014';
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrdersPage() {
  const api = useApi();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterValues>({ status: '' });
  const [page, setPage] = useState(1);
  const perPage = 25;

  /* ---- Data fetching via useQuery ---- */
  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['commerce-orders', filters.status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(perPage));
      if (filters.status) params.set('status', filters.status);

      const res = await api.get<OrdersResponse>(`/api/commerce/orders?${params.toString()}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const orders = data?.data ?? [];
  const total = data?.meta?.total ?? orders.length;
  const totalPages = Math.ceil(total / perPage);

  /* ---- Filter config ---- */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ORDER_STATUSES,
    },
  ];

  /* ---- Table columns ---- */
  const columns: DataTableColumn<Order>[] = useMemo(
    () => [
      {
        header: 'Order #',
        accessor: 'orderNumber',
        render: (row) => (
          <span className="font-mono text-xs font-medium text-foreground tracking-tight">
            {row.orderNumber ?? row.id.slice(0, 8)}
          </span>
        ),
      },
      {
        header: 'Customer',
        accessor: 'contact',
        render: (row) => (
          <span className="text-foreground tracking-tight">{customerName(row)}</span>
        ),
      },
      {
        header: 'Total',
        accessor: 'total',
        render: (row) => (
          <span className="font-semibold text-primary tracking-tight">
            ${row.total?.toFixed(2) ?? '0.00'}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={statusVariant[row.status] ?? 'muted'} className="capitalize">
            {row.status.toLowerCase()}
          </Badge>
        ),
      },
      {
        header: 'Items',
        accessor: 'items',
        render: (row) => (
          <span className="text-muted-foreground">
            {row.items?.length ?? 0}
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

  /* ---- Row click -> detail page ---- */
  const handleRowClick = (order: Order) => {
    router.push(`/dashboard/commerce/orders/${order.id}`);
  };

  return (
    <div className="bg-card space-y-6 p-8">
      <PageHeader
        title="Orders"
        subtitle={`${total} order${total !== 1 ? 's' : ''} across all stores`}
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Orders' },
        ]}
      />

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
          data={orders}
          isLoading={false}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm leading-relaxed">
                {filters.status ? 'No orders match your filters' : 'No orders yet'}
              </p>
            </div>
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4">
          <p className="text-xs text-muted-foreground tracking-wider">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-foreground hover:border-white/[0.08] disabled:opacity-40 transition-all duration-200"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-foreground hover:border-white/[0.08] disabled:opacity-40 transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}