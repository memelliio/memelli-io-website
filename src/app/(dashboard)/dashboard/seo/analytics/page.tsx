'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  FileText,
  Link2,
} from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Skeleton,
  EmptyState,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

interface AnalyticsData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalQuestions: number;
  totalBacklinks: number;
  averagePosition: number | null;
}

export default function ForumAnalyticsPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['seo-analytics'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the overview object)
      const res = await api.get<AnalyticsData>('/api/seo/analytics/overview');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const d = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader
        title="Forum Analytics"
        subtitle="Traffic, conversions, and question-to-traffic pipeline"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Analytics' },
        ]}
        className="mb-8"
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !d ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No analytics data"
          description="Publish articles to start collecting analytics."
        />
      ) : (
        <div className="space-y-6">
          {/* Metric tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricTile
              label="Total Articles"
              value={d.totalArticles}
              icon={<FileText className="h-4 w-4" />}
            />
            <MetricTile
              label="Published"
              value={d.publishedArticles}
              icon={<TrendingUp className="h-4 w-4" />}
              trend="up"
            />
            <MetricTile
              label="Drafts"
              value={d.draftArticles}
              icon={<FileText className="h-4 w-4" />}
            />
            <MetricTile
              label="Total Questions"
              value={d.totalQuestions}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <MetricTile
              label="Total Backlinks"
              value={d.totalBacklinks}
              icon={<Link2 className="h-4 w-4" />}
            />
            <MetricTile
              label="Avg. Position"
              value={d.averagePosition != null ? String(d.averagePosition) : '--'}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
