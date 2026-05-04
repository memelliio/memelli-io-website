'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, ImageIcon } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  Badge,
  Button,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  comparePrice?: number;
  sku?: string;
  inventory: number;
  status: string;
  imageUrls: string[];
  storeId: string;
  store?: { id: string; name: string };
  variants: { id: string; name: string; price: number; inventory: number }[];
  _count?: { orderItems: number };
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Status badge variant map                                           */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'default',
  OUT_OF_STOCK: 'error',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  const api = useApi();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    storeId: '',
  });

  /* Fetch stores for filter dropdown */
  useEffect(() => {
    (async () => {
      const res = await api.get<Store[]>('/api/commerce/stores?perPage=100');
      // useApi auto-unwraps { success, data } — res.data is already the stores array
      if (res.data) {
        const raw = res.data as any;
        const list: Store[] = Array.isArray(raw) ? raw : (raw.data ?? []);
        setStores(list);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Fetch products */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('perPage', '100');
    if (filters.status) params.set('status', filters.status);
    if (filters.storeId) params.set('storeId', filters.storeId);

    const res = await api.get<{ data: Product[]; meta: { total: number } }>(
      `/api/commerce/products?${params.toString()}`
    );
    if (res.data) {
      setProducts(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* Store options derived from fetched stores */
  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores]
  );

  /* Filter config */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'storeId',
      label: 'Store',
      type: 'select',
      options: storeOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ARCHIVED', label: 'Archived' },
        { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
      ],
    },
  ];

  /* Columns */
  const columns: DataTableColumn<Product>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrls?.[0] ? (
            <img
              src={row.imageUrls[0]}
              alt={row.name}
              className="h-10 w-10 rounded-xl object-cover border border-white/[0.06]"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground tracking-tight">{row.name}</p>
            {row.sku && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{row.sku}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: 'basePrice',
      render: (row) => (
        <div>
          <span className="font-semibold text-emerald-400 tracking-tight">
            ${row.basePrice.toFixed(2)}
          </span>
          {row.comparePrice && row.comparePrice > row.basePrice && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              ${row.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      accessor: 'inventory',
      render: (row) => (
        <span
          className={
            row.inventory <= 0
              ? 'text-primary font-medium'
              : row.inventory <= 10
                ? 'text-yellow-400'
                : 'text-foreground'
          }
        >
          {row.inventory}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'default'} className="capitalize">
          {row.status.toLowerCase().replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Store',
      accessor: 'store',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.store?.name ?? '\u2014'}</span>
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
  ];

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Products"
        subtitle={`${total} product${total !== 1 ? 's' : ''} across all stores`}
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Products' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/dashboard/commerce/products/new')}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200"
          >
            Create Product
          </Button>
        }
      />

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ status: '', storeId: '' })}
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/dashboard/commerce/products/${row.id}`)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl text-muted-foreground leading-relaxed">
            <Package className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">
              {filters.status || filters.storeId
                ? 'No products match your filters'
                : 'No products yet'}
            </p>
            {!filters.status && !filters.storeId && (
              <button
                onClick={() => router.push('/dashboard/commerce/products/new')}
                className="mt-3 text-sm text-primary hover:text-primary/80 transition-all duration-200"
              >
                Create your first product
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}
