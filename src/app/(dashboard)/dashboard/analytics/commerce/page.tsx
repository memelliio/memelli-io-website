'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, TrendingUp, Store } from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  PieChart,
  BarChart,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types — matches /api/admin/commerce/stats response                  */
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

interface MonthlyRevenuePoint {
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

interface RevenueByPackage {
  packageType: string;
  revenue: number;
}

interface CommerceStatsData {
  revenue: RevenueStats;
  monthlyRevenue: MonthlyRevenuePoint[];
  recentOrders: RecentOrder[];
  topStores: TopStore[];
  subscriptions: SubscriptionOverview;
  packageSales: unknown[];
  revenueByPackage: RevenueByPackage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function trend(change: number): 'up' | 'down' | 'flat' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'flat';
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400',
  processing: 'text-sky-400',
  refunded:   'text-red-400',
  pending:    'text-amber-400',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CommerceAnalyticsPage() {
  const api = useApi();

  const { data, isLoading, isError } = useQuery<CommerceStatsData>({
    queryKey: ['analytics', 'commerce-stats'],
    queryFn: async () => {
      const res = await api.get<CommerceStatsData>('/api/admin/commerce/stats');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const rev = data?.revenue;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Commerce Analytics"
        subtitle="Revenue, orders, and product performance"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Commerce' },
        ]}
      />

      {isError && (
        <p className="text-sm text-red-400">Failed to load commerce data. Please try again.</p>
      )}

      {/* ---- Metric Tiles ---- */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <MetricTile
            label="Revenue (MTD)"
            value={fmt(rev?.totalRevenue ?? 0)}
            change={rev?.revenueChange}
            trend={trend(rev?.revenueChange ?? 0)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricTile
            label="Orders Today"
            value={(rev?.ordersToday ?? 0).toLocaleString()}
            change={rev?.ordersChange}
            trend={trend(rev?.ordersChange ?? 0)}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MetricTile
            label="AOV"
            value={fmt(rev?.averageOrderValue ?? 0)}
            change={rev?.aovChange}
            trend={trend(rev?.aovChange ?? 0)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricTile
            label="Active Stores"
            value={(rev?.activeStores ?? 0).toLocaleString()}
            change={rev?.storesChange}
            trend={trend(rev?.storesChange ?? 0)}
            icon={<Store className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ---- Monthly Revenue (Line Chart) ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton variant="card" className="h-[300px]" />
          ) : !data?.monthlyRevenue?.length ? (
            <p className="text-sm text-muted-foreground">No revenue data available.</p>
          ) : (
            <LineChart
              data={data.monthlyRevenue}
              xKey="month"
              yKey="revenue"
              color="#3b82f6"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Revenue by Package Type (Pie Chart) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Revenue by Product Type</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" className="h-[300px]" />
            ) : !data?.revenueByPackage?.length ? (
              <p className="text-sm text-muted-foreground">No product type data available.</p>
            ) : (
              <PieChart
                data={data.revenueByPackage}
                xKey="packageType"
                yKey="revenue"
                donut
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* ---- Top Stores (Bar Chart) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Top Stores by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" className="h-[300px]" />
            ) : !data?.topStores?.length ? (
              <p className="text-sm text-muted-foreground">No store data available.</p>
            ) : (
              <BarChart
                data={data.topStores}
                xKey="name"
                yKey="totalRevenue"
                color="#3b82f6"
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Subscription MRR Snapshot ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Subscription MRR</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {isLoading ? (
              <Skeleton variant="card" className="h-[120px]" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">MRR</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    {fmt(data?.subscriptions?.mrr ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Churn Rate</span>
                  <span className="text-foreground tabular-nums">
                    {(data?.subscriptions?.churnRate ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New This Month</span>
                  <span className="text-sky-400 tabular-nums">
                    +{data?.subscriptions?.newThisMonth ?? 0}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  {data?.subscriptions?.byTier?.map((t) => (
                    <div key={t.tier} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t.tier}</span>
                      <span className="text-foreground tabular-nums">{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ---- Recent Orders Table (spans 2 cols) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="table-row" />
                ))}
              </div>
            ) : !data?.recentOrders?.length ? (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Order</th>
                      <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Customer</th>
                      <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total</th>
                      <th className="pb-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-mono text-muted-foreground text-xs">{order.id}</td>
                        <td className="py-3 text-foreground">{order.customer}</td>
                        <td className="py-3 text-right font-semibold text-emerald-400 tabular-nums">
                          {fmt(order.total)}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? 'text-muted-foreground'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground text-xs tabular-nums">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
