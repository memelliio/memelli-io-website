'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Store,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenueStats {
  totalRevenue: number;
  revenueChange: number;
  ordersToday: number;
  ordersChange: number;
  activeSubscriptions: number;
  subscriptionsChange: number;
  activeStores: number;
  storesChange: number;
  averageOrderValue: number;
  aovChange: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface RecentOrder {
  id: string;
  tenant: string;
  customer: string;
  total: number;
  status: 'completed' | 'processing' | 'refunded' | 'pending';
  paymentMethod: string;
  date: string;
}

interface TopStore {
  name: string;
  tenant: string;
  productsCount: number;
  totalRevenue: number;
  ordersThisMonth: number;
}

interface SubscriptionOverview {
  byTier: { tier: string; count: number }[];
  mrr: number;
  churnRate: number;
  newThisMonth: number;
}

interface PackageSale {
  id: string;
  packageName: string;
  buyer: string;
  amount: number;
  date: string;
}

interface RevenueByPackage {
  packageType: string;
  revenue: number;
}

interface CommerceStats {
  revenue: RevenueStats;
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: RecentOrder[];
  topStores: TopStore[];
  subscriptions: SubscriptionOverview;
  packageSales: PackageSale[];
  revenueByPackage: RevenueByPackage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCurrencyDecimal(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-[hsl(var(--muted-foreground))]">0%</span>;
  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </span>
  );
}

function StatusBadge({ status }: { status: RecentOrder['status'] }) {
  const map: Record<RecentOrder['status'], string> = {
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    refunded: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CommerceOverviewPage() {
  const api = useApi();

  const [data, setData] = useState<CommerceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await api.get<CommerceStats>('/api/admin/commerce/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ---- derived helpers ---- */
  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');
  const cur = (v: number | undefined | null) => (v != null ? formatCurrency(v) : '\u2014');
  const curDec = (v: number | undefined | null) => (v != null ? formatCurrencyDecimal(v) : '\u2014');

  const maxMonthlyRevenue =
    data?.monthlyRevenue?.reduce((max, m) => Math.max(max, m.revenue), 0) || 1;

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-red-500" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading commerce data...</p>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center max-w-md">
          <p className="text-sm text-red-400 font-medium">Failed to load commerce data</p>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="mt-4 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-white/15 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rev = data?.revenue;
  const orders = data?.recentOrders ?? [];
  const stores = data?.topStores ?? [];
  const subs = data?.subscriptions;
  const pkgSales = data?.packageSales ?? [];
  const revByPkg = data?.revenueByPackage ?? [];
  const monthly = data?.monthlyRevenue ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* -- Header -- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Commerce</h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            All commerce activity across the Memelli Universe
          </p>
        </div>

        {/* -- Revenue Stats Row -- */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{cur(rev?.totalRevenue)}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">This month</p>
              {rev && <ChangeIndicator value={rev.revenueChange} />}
            </div>
          </div>

          {/* Orders Today */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Orders Today</span>
              <ShoppingCart className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(rev?.ordersToday)}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">vs yesterday</p>
              {rev && <ChangeIndicator value={rev.ordersChange} />}
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Active Subs</span>
              <CreditCard className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(rev?.activeSubscriptions)}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Recurring</p>
              {rev && <ChangeIndicator value={rev.subscriptionsChange} />}
            </div>
          </div>

          {/* Active Stores */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Active Stores</span>
              <Store className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(rev?.activeStores)}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">All tenants</p>
              {rev && <ChangeIndicator value={rev.storesChange} />}
            </div>
          </div>

          {/* Average Order Value */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Avg Order</span>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{curDec(rev?.averageOrderValue)}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Per order</p>
              {rev && <ChangeIndicator value={rev.aovChange} />}
            </div>
          </div>
        </div>

        {/* -- Revenue Chart -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            Monthly Revenue Trend
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
            {monthly.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No revenue data available</p>
            ) : (
              <div className="space-y-3">
                {monthly.map((m) => {
                  const pct = (m.revenue / maxMonthlyRevenue) * 100;
                  return (
                    <div key={m.month} className="flex items-center gap-4">
                      <span className="w-16 text-xs text-[hsl(var(--muted-foreground))] text-right shrink-0">
                        {m.month}
                      </span>
                      <div className="flex-1 h-7 bg-[hsl(var(--muted))] rounded-xl overflow-hidden">
                        <div
                          className="h-full rounded-xl bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="w-24 text-xs text-[hsl(var(--muted-foreground))] text-right shrink-0">
                        {formatCurrency(m.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* -- Recent Orders Table -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-red-400" />
            Recent Orders
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            {orders.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-left">
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Order ID</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Tenant</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Customer</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Total</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Status</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Payment</th>
                      <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-[hsl(var(--foreground))] font-mono text-xs">{order.id}</td>
                        <td className="px-4 py-3 text-[hsl(var(--foreground))]">{order.tenant}</td>
                        <td className="px-4 py-3 text-[hsl(var(--foreground))]">{order.customer}</td>
                        <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{formatCurrencyDecimal(order.total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{order.paymentMethod}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs">{formatDate(order.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* -- Top Stores + Subscription Overview -- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Top Stores */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Store className="h-5 w-5 text-red-400" />
              Top Stores
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
              {stores.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No store data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] text-left">
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Store</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Tenant</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium text-right">Products</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium text-right">Revenue</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium text-right">Orders/mo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((store, i) => (
                        <tr
                          key={i}
                          className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                        >
                          <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{store.name}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{store.tenant}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-right">{store.productsCount}</td>
                          <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium text-right">{formatCurrency(store.totalRevenue)}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-right">{store.ordersThisMonth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Overview */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-400" />
              Subscription Overview
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              {/* MRR / Churn / New row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-center">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">MRR</p>
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-1">{cur(subs?.mrr)}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-center">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Churn Rate</p>
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-1">
                    {subs?.churnRate != null ? `${subs.churnRate}%` : '\u2014'}
                  </p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-center">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">New This Month</p>
                  <p className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-1">{val(subs?.newThisMonth)}</p>
                </div>
              </div>

              {/* By tier */}
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3">
                Active by Plan Tier
              </p>
              {(!subs?.byTier || subs.byTier.length === 0) ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No subscription data</p>
              ) : (
                <div className="space-y-2">
                  {subs.byTier.map((tier) => {
                    const total = subs.byTier.reduce((s, t) => s + t.count, 0) || 1;
                    const pct = (tier.count / total) * 100;
                    return (
                      <div key={tier.tier} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-[hsl(var(--foreground))] shrink-0">{tier.tier}</span>
                        <div className="flex-1 h-5 bg-[hsl(var(--muted))] rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-red-600 to-red-400"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <span className="w-12 text-xs text-[hsl(var(--muted-foreground))] text-right">{tier.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -- Package Sales -- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Recent Package Purchases */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Package className="h-5 w-5 text-red-400" />
              Recent Package Purchases
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
              {pkgSales.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent package sales</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] text-left">
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Package</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Buyer</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium text-right">Amount</th>
                        <th className="px-4 py-3 text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkgSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                        >
                          <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{sale.packageName}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{sale.buyer}</td>
                          <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium text-right">{formatCurrencyDecimal(sale.amount)}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs text-right">{formatDate(sale.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Revenue by Package Type */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-400" />
              Revenue by Package Type
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
              {revByPkg.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No package revenue data</p>
              ) : (
                <div className="space-y-3">
                  {revByPkg.map((pkg) => {
                    const maxRev = revByPkg.reduce((m, p) => Math.max(m, p.revenue), 0) || 1;
                    const pct = (pkg.revenue / maxRev) * 100;
                    return (
                      <div key={pkg.packageType}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[hsl(var(--foreground))]">{pkg.packageType}</span>
                          <span className="text-sm text-[hsl(var(--foreground))] font-medium">
                            {formatCurrency(pkg.revenue)}
                          </span>
                        </div>
                        <div className="h-4 bg-[hsl(var(--muted))] rounded-xl overflow-hidden">
                          <div
                            className="h-full rounded-xl bg-gradient-to-r from-red-600 to-emerald-400"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
