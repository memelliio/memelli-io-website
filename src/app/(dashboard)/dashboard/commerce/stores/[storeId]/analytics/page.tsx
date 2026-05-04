'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DollarSign, ShoppingCart, TrendingUp, Percent } from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  BarChart,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  orders: number;
}

interface StoreAnalyticsData {
  totalRevenue: number;
  ordersCount: number;
  conversionRate: number;
  avgOrderValue: number;
  revenueOverTime: RevenuePoint[];
  topProducts: TopProduct[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function StoreAnalyticsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const api = useApi();

  const { data, isLoading, isError, error } = useQuery<StoreAnalyticsData>({
    queryKey: ['commerce', 'stores', storeId, 'analytics'],
    queryFn: async () => {
      const res = await api.get<StoreAnalyticsData>(
        `/api/commerce/stores/${storeId}/analytics`,
      );
      if (res.error) throw new Error(res.error);
      return res.data as StoreAnalyticsData;
    },
    enabled: !!storeId,
  });

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 min-h-screen">
        <PageHeader
          title="Analytics"
          subtitle="Store performance overview"
          breadcrumb={[
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Stores', href: '/dashboard/commerce/stores' },
            { label: 'Analytics' },
          ]}
        />

        {/* Metric skeleton row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>

        {/* Chart skeletons */}
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  /* ---- Error state ---- */
  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6 min-h-screen">
        <PageHeader
          title="Analytics"
          subtitle="Store performance overview"
          breadcrumb={[
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Stores', href: '/dashboard/commerce/stores' },
            { label: 'Analytics' },
          ]}
        />
        <div className="rounded-2xl border border-primary/[0.12] bg-primary/[0.06] backdrop-blur-xl p-4 text-sm text-primary">
          {error instanceof Error ? error.message : 'Failed to load analytics'}
        </div>
      </div>
    );
  }

  const analytics = data;

  /* ---- Metric tiles ---- */
  const metrics = [
    {
      label: 'Revenue',
      value: fmt(analytics?.totalRevenue ?? 0),
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'up' as const,
    },
    {
      label: 'Orders',
      value: (analytics?.ordersCount ?? 0).toLocaleString(),
      icon: <ShoppingCart className="h-4 w-4" />,
      trend: 'up' as const,
    },
    {
      label: 'Conversion Rate',
      value: `${(analytics?.conversionRate ?? 0).toFixed(1)}%`,
      icon: <Percent className="h-4 w-4" />,
      trend: 'flat' as const,
    },
    {
      label: 'Avg Order Value',
      value: fmt(analytics?.avgOrderValue ?? 0),
      icon: <TrendingUp className="h-4 w-4" />,
      trend: 'up' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      <PageHeader
        title="Analytics"
        subtitle="Store performance overview"
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Stores', href: '/dashboard/commerce/stores' },
          { label: 'Store', href: `/dashboard/commerce/stores/${storeId}` },
          { label: 'Analytics' },
        ]}
      />

      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricTile
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            trend={m.trend}
          />
        ))}
      </div>

      {/* Revenue over time */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.revenueOverTime && analytics.revenueOverTime.length > 0 ? (
            <LineChart
              data={analytics.revenueOverTime}
              xKey="date"
              yKey="revenue"
              color="#10b981"
              height={320}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-card backdrop-blur-xl border border-white/[0.04] text-sm text-muted-foreground leading-relaxed">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <BarChart
              data={analytics.topProducts}
              xKey="name"
              yKey="revenue"
              color="#10b981"
              height={320}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-card backdrop-blur-xl border border-white/[0.04] text-sm text-muted-foreground leading-relaxed">
              No product data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
