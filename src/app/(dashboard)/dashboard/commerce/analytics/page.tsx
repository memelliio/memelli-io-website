'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  ArrowDown,
  Filter,
} from 'lucide-react';
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
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    returnRate: number;
    paidOrderCount: number;
    conversionRate: number;
  };
  revenueOverTime: { date: string; revenue: number; orders: number }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    unitsSold: number;
    orderCount: number;
  }[];
  ordersByStatus: { status: string; count: number }[];
  conversionFunnel: { stage: string; count: number; rate: number }[];
}

const DATE_RANGES = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CommerceAnalyticsPage() {
  const api = useApi();
  const [dateRange, setDateRange] = useState('30');

  const { data, isLoading, error } = useQuery({
    queryKey: ['commerce', 'analytics', dateRange],
    queryFn: async () => {
      const res = await api.get<any>(`/api/commerce/analytics?days=${dateRange}`);
      return (res.data?.data ?? res.data ?? res) as AnalyticsData;
    },
  });

  const overview = data?.overview;
  const revenueOverTime = data?.revenueOverTime ?? [];
  const topProducts = data?.topProducts ?? [];
  const ordersByStatus = data?.ordersByStatus ?? [];
  const conversionFunnel = data?.conversionFunnel ?? [];

  /* ---- revenue chart data formatted for LineChart ---- */
  const revenueChartData = useMemo(
    () =>
      revenueOverTime.map((p) => ({
        date: new Date(p.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        Revenue: p.revenue,
        Orders: p.orders,
      })),
    [revenueOverTime],
  );

  /* ---- funnel percentages ---- */
  const funnelMax = conversionFunnel.length > 0 ? conversionFunnel[0].count : 1;

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen bg-card">
      {/* Header */}
      <PageHeader
        title="Commerce Analytics"
        subtitle="Revenue, orders, and product performance"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Analytics' },
        ]}
        actions={
          <div className="flex items-center gap-1 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  dateRange === r.value
                    ? 'bg-primary text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 text-sm text-primary/80 backdrop-blur-xl">
          {(error as Error).message ?? 'Failed to load analytics'}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="stat-card" />
            ))}
          </div>
          <Skeleton variant="card" className="h-80" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton variant="card" className="h-96" />
            <Skeleton variant="card" className="h-96" />
          </div>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/*  Metric Tiles                                                 */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Revenue"
              value={`$${fmt(overview?.totalRevenue ?? 0)}`}
              icon={<DollarSign className="h-4 w-4" />}
              className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
            />
            <MetricTile
              label="Orders"
              value={overview?.orderCount ?? 0}
              icon={<ShoppingCart className="h-4 w-4" />}
              className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
            />
            <MetricTile
              label="Avg Order Value"
              value={`$${fmt(overview?.avgOrderValue ?? 0)}`}
              icon={<TrendingUp className="h-4 w-4" />}
              className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
            />
            <MetricTile
              label="Return Rate"
              value={`${(overview?.returnRate ?? 0).toFixed(1)}%`}
              icon={<RotateCcw className="h-4 w-4" />}
              className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
            />
          </div>

          {/* ============================================================ */}
          {/*  Revenue Over Time                                            */}
          {/* ============================================================ */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <LineChart
                  data={revenueChartData}
                  xKey="date"
                  yKey="Revenue"
                  color="#3b82f6"
                  height={320}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground leading-relaxed text-sm">
                  No revenue data for this period
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ========================================================== */}
            {/*  Top Products by Revenue                                    */}
            {/* ========================================================== */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-left">
                          <th className="pb-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Product</th>
                          <th className="pb-3 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Revenue</th>
                          <th className="pb-3 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Units</th>
                          <th className="pb-3 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {topProducts.slice(0, 10).map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.04] transition-all duration-200">
                            <td className="py-3 text-muted-foreground leading-relaxed truncate max-w-[200px]">
                              {p.name}
                            </td>
                            <td className="py-3 text-right font-semibold text-primary">
                              ${fmt(p.revenue)}
                            </td>
                            <td className="py-3 text-right text-muted-foreground leading-relaxed">
                              {p.unitsSold.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-muted-foreground leading-relaxed">
                              {p.orderCount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground leading-relaxed text-sm">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ========================================================== */}
            {/*  Orders by Status                                           */}
            {/* ========================================================== */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersByStatus.length > 0 ? (
                  <div className="flex flex-col items-center gap-6">
                    <PieChart
                      data={ordersByStatus}
                      xKey="status"
                      yKey="count"
                      donut
                      height={260}
                      colors={['#10b981', '#3b82f6', '#f59e0b', '#10b981', '#f59e0b', '#6b7280']}
                    />
                    <div className="flex flex-wrap gap-3 justify-center">
                      {ordersByStatus.map((s, i) => {
                        const colors = ['bg-emerald-400', 'bg-primary/70', 'bg-amber-400', 'bg-primary/80', 'bg-indigo-400', 'bg-muted'];
                        return (
                          <div key={s.status} className="flex items-center gap-2 text-xs">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                            <span className="text-muted-foreground leading-relaxed">{s.status}: {s.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground leading-relaxed text-sm">
                    No order data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/*  Conversion Funnel                                            */}
          {/* ============================================================ */}
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {conversionFunnel.length > 0 ? (
                <div className="space-y-6">
                  {conversionFunnel.map((step, i) => {
                    const pct = funnelMax > 0 ? (step.count / funnelMax) * 100 : 0;
                    return (
                      <div key={step.stage}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground leading-relaxed">{step.stage}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {step.count.toLocaleString()}
                            </span>
                            {i > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ArrowDown className="h-3 w-3" />
                                {step.rate.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-200"
                            style={{
                              width: `${Math.max(pct, 1)}%`,
                              backgroundColor: `rgba(168, 85, 247, ${1 - i * 0.15})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground leading-relaxed text-sm">
                  No funnel data available
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}