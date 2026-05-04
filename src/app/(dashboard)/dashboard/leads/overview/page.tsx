'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  BarChart,
  PieChart,
  LineChart,
  Skeleton,
  EmptyState,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@memelli/ui';
import { BarChart3 } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

interface OverviewData {
  scoreDistribution: { label: string; value: number }[];
  sourceBreakdown: { label: string; value: number }[];
  trend: { label: string; value: number; qualified: number; rejected: number }[];
}

export default function LeadsOverviewPage() {
  const api = useApi();

  const { data: overview, isLoading } = useQuery<OverviewData>({
    queryKey: ['leads-overview'],
    queryFn: async () => {
      const res = await api.get<OverviewData>('/api/leads/analytics/overview');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Lead Overview"
        subtitle="Score distribution, source breakdown, and trends"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Overview' },
        ]}
        className="mb-8"
      />

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : !overview ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No overview data"
          description="Lead data will populate here once signals are captured."
        />
      ) : (
        <Tabs defaultTab="all">
          <TabList>
            <Tab id="all">All Charts</Tab>
            <Tab id="scores">Score Distribution</Tab>
            <Tab id="sources">Sources</Tab>
            <Tab id="trends">Trends</Tab>
          </TabList>

          <TabPanels>
            {/* All Charts */}
            <TabPanel id="all">
              <div className="space-y-6 mt-6">
                {/* Score Distribution */}
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Score Distribution</h3>
                  <BarChart xKey="label" yKey="value" data={overview.scoreDistribution} height={300} color="#3b82f6" />
                </div>

                {/* Source Breakdown + Trend side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Source Breakdown</h3>
                    <PieChart xKey="label" yKey="value" data={overview.sourceBreakdown} height={280} donut />
                  </div>
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Lead Trend</h3>
                    <LineChart xKey="label" yKey="value"
                      data={overview.trend}
                      height={280}
                      series={[
                        { key: 'value', color: '#3b82f6', label: 'Total' },
                        { key: 'qualified', color: '#10b981', label: 'Qualified' },
                        { key: 'rejected', color: '#3b82f6', label: 'Rejected' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Score Distribution Only */}
            <TabPanel id="scores">
              <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Score Distribution</h3>
                <BarChart xKey="label" yKey="value" data={overview.scoreDistribution} height={400} color="#3b82f6" />
              </div>
            </TabPanel>

            {/* Sources Only */}
            <TabPanel id="sources">
              <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Source Breakdown</h3>
                <PieChart xKey="label" yKey="value" data={overview.sourceBreakdown} height={380} donut />
              </div>
            </TabPanel>

            {/* Trends Only */}
            <TabPanel id="trends">
              <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Lead Trend Over Time</h3>
                <LineChart xKey="label" yKey="value"
                  data={overview.trend}
                  height={400}
                  series={[
                    { key: 'value', color: '#3b82f6', label: 'Total' },
                    { key: 'qualified', color: '#10b981', label: 'Qualified' },
                    { key: 'rejected', color: '#3b82f6', label: 'Rejected' },
                  ]}
                />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </div>
  );
}
