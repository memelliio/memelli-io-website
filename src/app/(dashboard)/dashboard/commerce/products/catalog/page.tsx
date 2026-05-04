'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  ImageIcon,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Archive,
  Tag,
  ArrowUpDown,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { PageHeader, Badge, Button } from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

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
  category?: string;
  variants: { id: string; name: string; price: number; inventory: number }[];
  _count?: { orderItems: number };
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'default',
  OUT_OF_STOCK: 'error',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ARCHIVED: 'bg-muted text-muted-foreground border-border',
  OUT_OF_STOCK: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const CATEGORIES = [
  'All Categories',
  'Digital',
  'Physical',
  'Service',
  'Subscription',
  'Course',
  'Template',
  'Membership',
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'stock-asc', label: 'Stock: Low to High' },
  { value: 'stock-desc', label: 'Stock: High to Low' },
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

function stockLabel(n: number): { text: string; cls: string } {
  if (n <= 0) return { text: 'Out of stock', cls: 'text-red-400' };
  if (n <= 5) return { text: `${n} left`, cls: 'text-amber-400' };
  if (n <= 20) return { text: `${n} in stock`, cls: 'text-foreground' };
  return { text: `${n} in stock`, cls: 'text-muted-foreground' };
}

/* ------------------------------------------------------------------ */
/*  Dropdown Component                                                 */
/* ------------------------------------------------------------------ */

function Dropdown({
  trigger,
  children,
  align = 'left',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[180px] rounded-xl border border-white/[0.06] bg-card py-1 shadow-xl shadow-black/40 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductCatalogPage() {
  const api = useApi();
  const router = useRouter();

  /* State */
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);

  /* Fetch stores */
  useEffect(() => {
    (async () => {
      const res = await api.get<Store[]>('/api/commerce/stores?perPage=100');
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
    params.set('perPage', '200');
    if (statusFilter) params.set('status', statusFilter);

    const res = await api.get<{ data: Product[]; meta: { total: number } }>(
      `/api/commerce/products?${params.toString()}`
    );
    if (res.data) {
      setProducts(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* Focus price input when editing */
  useEffect(() => {
    if (editingPrice && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [editingPrice]);

  /* Filtered + sorted products */
  const filtered = useMemo(() => {
    let items = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== 'All Categories') {
      items = items.filter(
        (p) =>
          p.type?.toLowerCase() === category.toLowerCase() ||
          p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Status
    if (statusFilter) {
      items = items.filter((p) => p.status === statusFilter);
    }

    // Sort
    const [field, dir] = sortBy.split('-');
    items.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'price':
          cmp = a.basePrice - b.basePrice;
          break;
        case 'stock':
          cmp = a.inventory - b.inventory;
          break;
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return dir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [products, search, category, statusFilter, sortBy]);

  /* Selection helpers */
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  /* Quick edit price */
  function startEditPrice(id: string, currentPrice: number) {
    setEditingPrice(id);
    setEditPriceValue(currentPrice.toFixed(2));
  }

  async function savePrice(id: string) {
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setEditingPrice(null);
      return;
    }
    try {
      await api.patch(`/api/commerce/products/${id}`, { basePrice: newPrice });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, basePrice: newPrice } : p))
      );
    } catch {
      // silent fail — keep original
    }
    setEditingPrice(null);
  }

  /* Bulk actions */
  async function bulkAction(action: 'archive' | 'delete' | 'activate') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    try {
      if (action === 'delete') {
        await Promise.all(ids.map((id) => api.del(`/api/commerce/products/${id}`)));
        setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
      } else {
        const status = action === 'archive' ? 'ARCHIVED' : 'ACTIVE';
        await Promise.all(
          ids.map((id) => api.patch(`/api/commerce/products/${id}`, { status }))
        );
        setProducts((prev) =>
          prev.map((p) => (selected.has(p.id) ? { ...p, status } : p))
        );
      }
      setSelected(new Set());
    } catch {
      // silent
    }
  }

  /* Status counts */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [products]);

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Product Catalog"
        subtitle={`${total} product${total !== 1 ? 's' : ''} across all stores`}
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Products', href: '/dashboard/commerce/products' },
          { label: 'Catalog' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/dashboard/commerce/products/create')}
            className="rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
          >
            Add Product
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search + Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-8 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-red-500/40 focus:bg-white/[0.05]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <Dropdown
            trigger={
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-foreground transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{category}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            }
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.05] ${
                  category === cat ? 'text-red-400' : 'text-foreground'
                }`}
              >
                {category === cat && <Check className="h-3.5 w-3.5" />}
                <span className={category === cat ? '' : 'ml-5'}>{cat}</span>
              </button>
            ))}
          </Dropdown>

          {/* Status filter */}
          <Dropdown
            trigger={
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-foreground transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]">
                <span>{statusFilter || 'All Status'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            }
          >
            <button
              onClick={() => setStatusFilter('')}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.05] ${
                !statusFilter ? 'text-red-400' : 'text-foreground'
              }`}
            >
              {!statusFilter && <Check className="h-3.5 w-3.5" />}
              <span className={!statusFilter ? '' : 'ml-5'}>All Status</span>
              <span className="ml-auto text-xs text-muted-foreground">{products.length}</span>
            </button>
            {['ACTIVE', 'DRAFT', 'ARCHIVED', 'OUT_OF_STOCK'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.05] ${
                  statusFilter === s ? 'text-red-400' : 'text-foreground'
                }`}
              >
                {statusFilter === s && <Check className="h-3.5 w-3.5" />}
                <span className={statusFilter === s ? '' : 'ml-5'}>
                  {s.toLowerCase().replace(/_/g, ' ')}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {statusCounts[s] ?? 0}
                </span>
              </button>
            ))}
          </Dropdown>
        </div>

        {/* Right: Sort + View toggle */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <Dropdown
            trigger={
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-foreground transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </span>
              </button>
            }
            align="right"
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.05] ${
                  sortBy === opt.value ? 'text-red-400' : 'text-foreground'
                }`}
              >
                {sortBy === opt.value && <Check className="h-3.5 w-3.5" />}
                <span className={sortBy === opt.value ? '' : 'ml-5'}>{opt.label}</span>
              </button>
            ))}
          </Dropdown>

          {/* View toggle */}
          <div className="flex h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center rounded-md px-2.5 transition-all duration-150 ${
                viewMode === 'grid'
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center rounded-md px-2.5 transition-all duration-150 ${
                viewMode === 'list'
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5">
          <button
            onClick={toggleAll}
            className="flex h-5 w-5 items-center justify-center rounded border border-red-500/40 bg-red-500/10 transition-colors"
          >
            {allSelected ? (
              <Check className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <div className="h-2 w-2 rounded-sm bg-red-400" />
            )}
          </button>
          <span className="text-sm text-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => bulkAction('activate')}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
            >
              <Check className="h-3.5 w-3.5" />
              Activate
            </button>
            <button
              onClick={() => bulkAction('archive')}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/10"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
            <button
              onClick={() => bulkAction('delete')}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
            >
              <div className="mb-3 h-40 rounded-lg bg-white/[0.04]" />
              <div className="mb-2 h-4 w-3/4 rounded bg-white/[0.04]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02] py-20 text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm font-medium text-muted-foreground">
            {search || category !== 'All Categories' || statusFilter
              ? 'No products match your filters'
              : 'No products yet'}
          </p>
          {!search && category === 'All Categories' && !statusFilter && (
            <button
              onClick={() => router.push('/dashboard/commerce/products/create')}
              className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              Create your first product
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => {
            const stock = stockLabel(product.inventory);
            const isSelected = selected.has(product.id);
            const isEditing = editingPrice === product.id;

            return (
              <div
                key={product.id}
                className={`group relative flex flex-col rounded-xl border transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03] ${
                  isSelected
                    ? 'border-red-500/30 bg-red-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(product.id);
                  }}
                  className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all duration-150 ${
                    isSelected
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-white/[0.1] bg-background text-transparent opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Check className="h-3 w-3" />
                </button>

                {/* Image */}
                <div
                  className="relative cursor-pointer overflow-hidden rounded-t-xl"
                  onClick={() =>
                    router.push(`/dashboard/commerce/products/${product.id}`)
                  }
                >
                  {product.imageUrls?.[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-white/[0.02]">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute right-2 top-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        STATUS_COLORS[product.status] ?? STATUS_COLORS.ARCHIVED
                      }`}
                    >
                      {product.status.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3
                    className="cursor-pointer text-sm font-semibold text-foreground tracking-tight line-clamp-1 hover:text-white transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/commerce/products/${product.id}`)
                    }
                  >
                    {product.name}
                  </h3>

                  {product.sku && (
                    <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                      {product.sku}
                    </p>
                  )}

                  {/* Price row */}
                  <div className="mt-3 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <input
                          ref={priceInputRef}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          onBlur={() => savePrice(product.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') savePrice(product.id);
                            if (e.key === 'Escape') setEditingPrice(null);
                          }}
                          className="h-7 w-20 rounded border border-red-500/30 bg-background px-1.5 text-sm text-foreground outline-none focus:border-red-500/60"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-foreground tracking-tight">
                          {formatPrice(product.basePrice)}
                        </span>
                        {product.comparePrice &&
                          product.comparePrice > product.basePrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.comparePrice)}
                            </span>
                          )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditPrice(product.id, product.basePrice);
                          }}
                          className="ml-0.5 rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          title="Quick edit price"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs font-medium ${stock.cls}`}>
                      {stock.text}
                    </span>
                    {product.store?.name && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {product.store.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {!loading && filtered.length > 0 && viewMode === 'list' && (
        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          {/* List header */}
          <div className="flex items-center gap-4 border-b border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <button
              onClick={toggleAll}
              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                allSelected
                  ? 'border-red-500 bg-red-600'
                  : 'border-white/[0.1] bg-transparent'
              }`}
            >
              {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
            </button>
            <span className="w-12" />
            <span className="flex-1 min-w-[150px]">Product</span>
            <span className="w-28 text-right">Price</span>
            <span className="w-24 text-right">Stock</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-28">Store</span>
            <span className="w-8" />
          </div>

          {/* List rows */}
          {filtered.map((product) => {
            const stock = stockLabel(product.inventory);
            const isSelected = selected.has(product.id);
            const isEditing = editingPrice === product.id;

            return (
              <div
                key={product.id}
                className={`group flex items-center gap-4 border-b border-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.02] ${
                  isSelected ? 'bg-red-500/[0.03]' : ''
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(product.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'border-red-500 bg-red-600'
                      : 'border-white/[0.1] bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </button>

                {/* Image */}
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.06]">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div
                  className="flex-1 min-w-[150px] cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/commerce/products/${product.id}`)
                  }
                >
                  <p className="text-sm font-medium text-foreground tracking-tight line-clamp-1 hover:text-white transition-colors">
                    {product.name}
                  </p>
                  {product.sku && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {product.sku}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="w-28 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <input
                        ref={priceInputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onBlur={() => savePrice(product.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePrice(product.id);
                          if (e.key === 'Escape') setEditingPrice(null);
                        }}
                        className="h-7 w-20 rounded border border-red-500/30 bg-background px-1.5 text-sm text-foreground outline-none focus:border-red-500/60 text-right"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(product.basePrice)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditPrice(product.id, product.basePrice);
                        }}
                        className="rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="w-24 text-right">
                  <span className={`text-sm ${stock.cls}`}>{stock.text}</span>
                </div>

                {/* Status */}
                <div className="w-24 text-center">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      STATUS_COLORS[product.status] ?? STATUS_COLORS.ARCHIVED
                    }`}
                  >
                    {product.status.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Store */}
                <div className="w-28">
                  <span className="text-xs text-muted-foreground truncate block">
                    {product.store?.name ?? '\u2014'}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-8">
                  <Dropdown
                    trigger={
                      <button className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    }
                    align="right"
                  >
                    <button
                      onClick={() =>
                        router.push(`/dashboard/commerce/products/${product.id}`)
                      }
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-white/[0.05]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        startEditPrice(product.id, product.basePrice)
                      }
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-white/[0.05]"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      Quick Edit Price
                    </button>
                    <button
                      onClick={async () => {
                        await api.patch(`/api/commerce/products/${product.id}`, {
                          status: 'ARCHIVED',
                        });
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === product.id ? { ...p, status: 'ARCHIVED' } : p
                          )
                        );
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-amber-400 hover:bg-white/[0.05]"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                    <button
                      onClick={async () => {
                        await api.del(`/api/commerce/products/${product.id}`);
                        setProducts((prev) =>
                          prev.filter((p) => p.id !== product.id)
                        );
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-white/[0.05]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </Dropdown>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {filtered.length} of {total} products
        </div>
      )}
    </div>
  );
}
