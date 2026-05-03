'use client';

import { useEffect, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

// API returns uppercase statuses
type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

interface Store {
  id: string;
  name: string;
  currency: string;
  status: string;
  _count: { products: number; orders: number };
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ApiOrder {
  id: string;
  status: ApiOrderStatus;
  total: number;
  subtotal: number;
  createdAt: string;
  currency: string;
  contact: { id: string; firstName: string; lastName: string; email: string } | null;
  items: OrderItem[];
}

interface ApiProduct {
  id: string;
  name: string;
  basePrice: number;
  inventory: number;
  status: string;
  _count: { orderItems: number };
}

interface TopProduct {
  product: { id: string; name: string; basePrice: number };
  orderCount: number;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface CommerceAnalytics {
  totalRevenue: number;
  orderCount: number;
  paidOrderCount: number;
  avgOrderValue: number;
  conversionRate: number;
}

interface AddProductForm {
  name: string;
  basePrice: string;
  inventory: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE' | 'SUBSCRIPTION';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtCurrency(n: number, currency = 'USD'): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Status badge — maps API uppercase statuses to display colors              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_MAP: Record<ApiOrderStatus, { color: string; label: string }> = {
  PENDING:   { color: '#f59e0b', label: 'Pending' },
  CONFIRMED: { color: '#3b82f6', label: 'Processing' },
  SHIPPED:   { color: '#8b5cf6', label: 'Shipped' },
  DELIVERED: { color: '#22c55e', label: 'Completed' },
  CANCELLED: { color: '#71717a', label: 'Cancelled' },
  REFUNDED:  { color: '#71717a', label: 'Refunded' },
};

function StatusBadge({ status }: { status: ApiOrderStatus }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: cfg.color }}
      />
      <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Shared sub-components                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={CARD}>
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-white font-bold text-lg leading-none">{value}</p>
      {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

function Spinner({ size = 6 }: { size?: number }) {
  return (
    <div
      className={`h-${size} w-${size} animate-spin rounded-full shrink-0`}
      style={{ border: '2px solid rgba(255,255,255,0.07)', borderTopColor: '#f97316' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Add Product inline form                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AddProductForm({
  storeId,
  onSuccess,
  onCancel,
}: {
  storeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddProductForm>({
    name: '',
    basePrice: '',
    inventory: '0',
    type: 'PHYSICAL',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof AddProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.basePrice) return;
    setSaving(true);
    setError(null);
    const result = await apiFetch<ApiProduct>('/api/commerce/products', {
      method: 'POST',
      body: JSON.stringify({
        storeId,
        name: form.name.trim(),
        basePrice: parseFloat(form.basePrice),
        inventory: parseInt(form.inventory, 10) || 0,
        type: form.type,
      }),
    });
    setSaving(false);
    if (!result) {
      setError('Failed to create product. Check your inputs and try again.');
      return;
    }
    onSuccess();
  }

  const inputCls =
    'w-full rounded-lg bg-transparent px-3 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-orange-500/40';
  const inputStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="Product name"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>
        <input
          className={inputCls}
          style={inputStyle}
          placeholder="Base price (USD)"
          type="number"
          min="0"
          step="0.01"
          value={form.basePrice}
          onChange={set('basePrice')}
          required
        />
        <input
          className={inputCls}
          style={inputStyle}
          placeholder="Inventory"
          type="number"
          min="0"
          value={form.inventory}
          onChange={set('inventory')}
        />
        <select
          className={inputCls + ' col-span-2'}
          style={{ ...inputStyle, background: 'rgba(255,255,255,0.03)' }}
          value={form.type}
          onChange={set('type')}
        >
          <option value="PHYSICAL">Physical</option>
          <option value="DIGITAL">Digital</option>
          <option value="SERVICE">Service</option>
          <option value="SUBSCRIPTION">Subscription</option>
        </select>
      </div>

      {error && (
        <p className="text-[10px] font-mono text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[11px] font-mono text-white transition-opacity disabled:opacity-50"
          style={{ background: '#f97316' }}
        >
          {saving && <Spinner size={3} />}
          {saving ? 'Saving...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CommercePanel() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [analytics, setAnalytics] = useState<CommerceAnalytics | null>(null);

  // Today-scoped stats derived from recent orders
  const [todayOrders, setTodayOrders] = useState<ApiOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  /* ── Data fetching ── */

  const loadStores = useCallback(async () => {
    const data = await apiFetch<Store[]>('/api/commerce/stores');
    if (!data) return;
    setStores(data);
    if (data.length > 0 && !selectedStoreId) {
      setSelectedStoreId(data[0].id);
    }
  }, [selectedStoreId]);

  const loadData = useCallback(async (storeId: string | null) => {
    const storeParam = storeId ? `storeId=${storeId}&` : '';

    const [ordersData, productsData, analyticsData, topProductsData] = await Promise.all([
      apiFetch<ApiOrder[]>(`/api/commerce/orders?${storeParam}perPage=10`),
      apiFetch<ApiProduct[]>(`/api/commerce/products?${storeParam}status=ACTIVE&perPage=8`),
      apiFetch<CommerceAnalytics>(`/api/commerce/analytics${storeId ? `?storeId=${storeId}` : ''}`),
      apiFetch<TopProduct[]>(`/api/commerce/analytics/top-products${storeId ? `?storeId=${storeId}` : ''}`),
    ]);

    if (!ordersData && !productsData && !analyticsData) {
      setError('Unable to connect to the Commerce API.');
    } else {
      setError(null);
    }

    if (ordersData) {
      setOrders(ordersData);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      setTodayOrders(ordersData.filter(o => new Date(o.createdAt) >= todayStart));
    }

    if (productsData) setProducts(productsData);
    if (analyticsData) setAnalytics(analyticsData);
    if (topProductsData) setTopProducts(topProductsData);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadStores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading || selectedStoreId !== null) {
      loadData(selectedStoreId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  useEffect(() => {
    // Initial load when stores haven't resolved yet — load after stores are set
    if (stores.length > 0 && loading) {
      loadData(selectedStoreId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores]);

  useEffect(() => {
    const id = setInterval(() => loadData(selectedStoreId), 30_000);
    return () => clearInterval(id);
  }, [selectedStoreId, loadData]);

  /* ── Derived stats ── */
  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const activeProductCount = analytics ? (stores.find(s => s.id === selectedStoreId)?._count.products ?? analytics.orderCount) : products.length;
  const maxTopRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.totalRevenue)) : 1;

  const selectedStore = stores.find(s => s.id === selectedStoreId) ?? null;

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={8} />
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Loading Commerce</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-5 overflow-y-auto p-5 text-zinc-100">

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-zinc-100 leading-none">Commerce</h1>
          <p className="text-[10px] font-mono text-zinc-600 mt-0.5 uppercase tracking-wider">
            {selectedStore ? selectedStore.name : 'Store Dashboard'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Revenue pill */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={CARD}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: '#f97316', boxShadow: '0 0 6px #f97316' }}
            />
            <span className="text-[11px] font-mono text-zinc-400">All-time</span>
            <span className="text-sm font-bold text-white">
              {fmtCurrency(analytics?.totalRevenue ?? 0)}
            </span>
          </div>

          {/* View all orders */}
          <a
            href="/dashboard/commerce/orders"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-300 transition-colors hover:text-white"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            All Orders
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Error notice ── */}
      {error && (
        <div
          className="shrink-0 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] font-mono text-zinc-400">{error}</p>
        </div>
      )}

      {/* ── Store Selector (only shown when multiple stores exist) ── */}
      {stores.length > 1 && (
        <div className="shrink-0">
          <SectionHeader>Store</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-mono transition-all"
                style={
                  selectedStoreId === store.id
                    ? { background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316' }
                    : { ...CARD, color: '#a1a1aa' }
                }
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: store.status === 'ACTIVE' ? '#22c55e' : '#71717a' }}
                />
                {store.name}
                <span className="text-zinc-600">
                  {store._count.orders} orders
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue Today"
          value={fmtCurrency(revenueToday)}
          sub={`${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''} today`}
        />
        <StatCard
          label="Orders Today"
          value={String(todayOrders.length)}
          sub="new orders"
        />
        <StatCard
          label="Active Products"
          value={String(products.length)}
          sub="in catalog"
        />
        <StatCard
          label="Avg Order Value"
          value={fmtCurrency(analytics?.avgOrderValue ?? 0)}
          sub={`${analytics?.conversionRate ?? 0}% conv. rate`}
        />
      </div>

      {/* ── Recent Orders ── */}
      <div className="shrink-0 rounded-xl p-4" style={CARD}>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Recent Orders</SectionHeader>
          <span className="text-[10px] font-mono text-zinc-600">{analytics?.orderCount ?? orders.length} total</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-[11px] font-mono text-zinc-600 py-4 text-center">No orders yet.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                    <th
                      key={h}
                      className="pb-2 text-left text-[10px] font-mono text-zinc-600 uppercase tracking-wider border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const customerName = order.contact
                    ? `${order.contact.firstName} ${order.contact.lastName}`.trim()
                    : 'Guest';
                  const shortId = order.id.slice(-6).toUpperCase();
                  return (
                    <tr
                      key={order.id}
                      className="group transition-colors hover:bg-white/[0.02]"
                      style={i < orders.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                    >
                      <td className="py-2 pr-3 font-mono text-[11px] text-zinc-400">#{shortId}</td>
                      <td className="py-2 pr-3 text-[12px] text-zinc-200 max-w-[120px] truncate">{customerName}</td>
                      <td className="py-2 pr-3 text-[12px] text-zinc-400">{order.items.length}</td>
                      <td className="py-2 pr-3 text-[12px] font-bold text-white">${order.total.toFixed(2)}</td>
                      <td className="py-2 pr-3"><StatusBadge status={order.status} /></td>
                      <td className="py-2 text-[11px] text-zinc-600">{fmtDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Products List ── */}
      <div className="shrink-0 rounded-xl p-4" style={CARD}>
        <SectionHeader>Products</SectionHeader>

        {products.length === 0 ? (
          <p className="text-[11px] font-mono text-zinc-600 py-4 text-center">No active products.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse">
              <thead>
                <tr>
                  {['Name', 'Price', 'Stock', 'Sales', 'Status'].map(h => (
                    <th
                      key={h}
                      className="pb-2 text-left text-[10px] font-mono text-zinc-600 uppercase tracking-wider border-b"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                    style={i < products.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                  >
                    <td className="py-2 pr-3 text-[12px] text-zinc-200 max-w-[160px] truncate">{p.name}</td>
                    <td className="py-2 pr-3 text-[12px] font-bold text-white">${p.basePrice.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-[12px] text-zinc-400">
                      <span style={{ color: p.inventory === 0 ? '#ef4444' : p.inventory < 5 ? '#f59e0b' : '#a1a1aa' }}>
                        {p.inventory}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[12px] text-zinc-400">{p._count.orderItems}</td>
                    <td className="py-2">
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: p.status === 'ACTIVE' ? '#22c55e' : '#71717a' }}
                      >
                        {p.status === 'ACTIVE' ? 'Active' : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Top Products by Revenue ── */}
      {topProducts.length > 0 && (
        <div className="shrink-0 rounded-xl p-4" style={CARD}>
          <SectionHeader>Top Products by Revenue</SectionHeader>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((tp, i) => {
              const pct = maxTopRevenue > 0 ? (tp.totalRevenue / maxTopRevenue) * 100 : 0;
              return (
                <div key={tp.product.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="shrink-0 text-[10px] font-mono font-bold w-4 text-right"
                        style={{ color: '#f97316' }}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate text-[12px] text-zinc-200">{tp.product.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-500">{tp.totalQuantitySold} sold</span>
                      <span className="text-[12px] font-bold text-white">{fmtCurrency(tp.totalRevenue)}</span>
                    </div>
                  </div>
                  <div
                    className="h-[2px] w-full rounded-full overflow-hidden ml-6"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f97316, #dc2626)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="shrink-0">
        <SectionHeader>Quick Actions</SectionHeader>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

          {/* Add Product — toggles inline form */}
          {showAddProduct && selectedStoreId ? (
            <div className="col-span-2 lg:col-span-3 rounded-xl p-4" style={CARD}>
              <p className="text-[11px] font-mono text-zinc-400 mb-3 uppercase tracking-wider">New Product</p>
              <AddProductForm
                storeId={selectedStoreId}
                onSuccess={() => {
                  setShowAddProduct(false);
                  loadData(selectedStoreId);
                }}
                onCancel={() => setShowAddProduct(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => {
                if (!selectedStoreId && stores.length === 0) return;
                setShowAddProduct(true);
              }}
              className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-zinc-300 transition-all hover:text-white cursor-pointer"
              style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[11px] font-mono text-center">Add Product</span>
            </button>
          )}

          {/* View All Orders */}
          {!showAddProduct && (
            <a
              href="/dashboard/commerce/orders"
              className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-zinc-300 transition-all hover:text-white"
              style={CARD}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              <span className="text-[11px] font-mono text-center">View All Orders</span>
            </a>
          )}

          {/* Run Promotion */}
          {!showAddProduct && (
            <a
              href="/dashboard/commerce/promotions/new"
              className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-zinc-300 transition-all hover:text-white"
              style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="text-[11px] font-mono text-center">Run Promotion</span>
            </a>
          )}

        </div>
      </div>

    </div>
  );
}
