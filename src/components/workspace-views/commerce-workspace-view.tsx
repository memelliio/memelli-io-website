'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { ChartDataPoint } from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsData {
  totalRevenue: number;
  orderCount: number;
  paidOrderCount: number;
  avgOrderValue: number;
  conversionRate: number;
  trends?: {
    revenueTrend: 'up' | 'down' | 'flat';
    revenueChange: number;
    ordersTrend: 'up' | 'down' | 'flat';
    ordersChange: number;
    conversionTrend: 'up' | 'down' | 'flat';
    conversionChange: number;
  };
}

interface TopProduct {
  product: { id: string; name: string; basePrice?: number; imageUrls?: string[] };
  orderCount: number;
  totalQuantitySold: number;
  totalRevenue: number;
}

interface RevenuePoint {
  day: string;
  revenue: number;
  orderCount: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
  items?: { product?: { name?: string } }[];
}

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  _count?: { products: number; orders: number };
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CommerceWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const orderStatusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive' | 'primary'> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

function unwrapData<T>(res: { data: T | null }): T | null {
  if (!res.data) return null;
  const d = res.data as any;
  return d.data ?? d;
}

function unwrapArray<T>(res: { data: T | null }): T[] {
  if (!res.data) return [];
  const d = res.data as any;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CommerceWorkspaceView({ compact = false }: CommerceWorkspaceViewProps) {
  const api = useApi();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['commerce', 'analytics'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/analytics');
      return unwrapData<AnalyticsData>(res);
    },
  });

  const { data: topProducts = [], isLoading: topProductsLoading } = useQuery({
    queryKey: ['commerce', 'top-products'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/analytics/top-products');
      return unwrapArray<TopProduct>(res);
    },
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['commerce', 'revenue-by-period'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/analytics/revenue-by-period');
      const points = unwrapArray<RevenuePoint>(res);
      return points.map((r): ChartDataPoint => ({
        label: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: r.revenue,
        orders: r.orderCount,
      }));
    },
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['commerce', 'recent-orders'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/orders?perPage=10');
      return unwrapArray<Order>(res).slice(0, 10);
    },
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['commerce', 'stores'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/stores');
      return unwrapArray<StoreItem>(res);
    },
  });

  const isLoading = analyticsLoading || ordersLoading;
  const totalProducts = stores.reduce((sum, s) => sum + (s._count?.products ?? 0), 0);

  const trends = analytics?.trends;
  const revenueTrend = trends?.revenueTrend ?? (analytics && analytics.totalRevenue > 0 ? 'up' : 'flat');
  const ordersTrend = trends?.ordersTrend ?? (analytics && analytics.orderCount > 0 ? 'up' : 'flat');
  const conversionTrend = trends?.conversionTrend ?? (
    analytics
      ? analytics.conversionRate >= 50 ? 'up' : analytics.conversionRate > 0 ? 'flat' : 'down'
      : 'flat'
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
        </div>
        <Skeleton variant="card" height={280} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Total Revenue"
          value={fmtCurrency(analytics?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={revenueTrend}
          change={trends?.revenueChange}
        />
        <MetricTile
          label="Orders"
          value={analytics?.orderCount ?? 0}
          icon={<ShoppingCart className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={ordersTrend}
          change={trends?.ordersChange}
        />
        <MetricTile
          label="Products"
          value={totalProducts}
          icon={<Package className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Conversion Rate"
          value={`${(analytics?.conversionRate ?? 0).toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
          trend={conversionTrend}
          change={trends?.conversionChange}
        />
      </div>

      {/* Revenue Chart */}
      {!compact && (
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {revenueLoading ? (
              <Skeleton variant="card" height={240} />
            ) : revenueData.length > 0 ? (
              <LineChart data={revenueData} xKey="label" yKey="value" height={240} color="#10b981" />
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders + Products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
                <ShoppingCart className="h-7 w-7 mb-2 text-[hsl(var(--muted-foreground))]" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentOrders.slice(0, compact ? 5 : 10).map((order) => {
                  const contactName = order.contact
                    ? `${order.contact.firstName ?? ''} ${order.contact.lastName ?? ''}`.trim()
                    : null;
                  return (
                    <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] tracking-tight">
                          {contactName || order.items?.[0]?.product?.name || 'Order'}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tracking-tight text-emerald-400">
                          {fmtCurrency(Number(order.total))}
                        </span>
                        <Badge variant={orderStatusVariant[order.status] ?? 'muted'} className="capitalize">
                          {order.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProductsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="line" width="100%" height={14} />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
                <Package className="h-7 w-7 mb-2 text-[hsl(var(--muted-foreground))]" />
                <p className="text-sm">No sales data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {topProducts.slice(0, 5).map((tp, i) => (
                  <div key={tp.product.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10 text-xs font-bold text-red-400 border border-red-500/20">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] tracking-tight">{tp.product.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{tp.totalQuantitySold} sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-emerald-400">
                      {fmtCurrency(tp.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
