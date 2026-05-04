'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import {
  PageHeader,
  Badge,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

interface ThreadRanking {
  id: string;
  title: string;
  keyword: string;
  position: number;
  previousPosition: number | null;
  weeklyClicks: number;
  weeklyImpressions: number;
  ctr: number;
  articleId?: string;
}

interface RankingsData {
  totalRecords: number;
  avgPosition: number | null;
  totalImpressions: number;
  totalClicks: number;
  ctr: number | null;
  rows: ThreadRanking[];
}

function PositionChange({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return <Badge variant="muted">New</Badge>;
  const diff = previous - current;
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
        <TrendingUp className="h-3 w-3" /> +{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
        <TrendingDown className="h-3 w-3" /> {diff}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" /> 0
    </span>
  );
}

export default function RankingsPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<RankingsData>({
    queryKey: ['seo-rankings'],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the RankingsData object)
      const res = await api.get<RankingsData>('/api/seo/rankings/summary');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const d = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <PageHeader
        title="Rankings"
        subtitle="Thread rankings, traffic, and performance trends"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SEO', href: '/dashboard/seo' },
          { label: 'Rankings' },
        ]}
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : !d || d.totalRecords === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No ranking data"
          description="Publish and index threads to start tracking rankings."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
              <p className="text-3xl font-semibold tracking-tight text-white">{d.avgPosition != null ? d.avgPosition.toFixed(1) : '--'}</p>
              <p className="text-xs text-muted-foreground mt-1.5">Avg. Position</p>
            </div>
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
              <p className="text-3xl font-semibold tracking-tight text-emerald-400">{d.totalRecords}</p>
              <p className="text-xs text-muted-foreground mt-1.5">Total Records</p>
            </div>
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
              <p className="text-3xl font-semibold tracking-tight text-primary">{d.totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1.5">Total Impressions</p>
            </div>
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
              <p className="text-3xl font-semibold tracking-tight text-white">{d.ctr != null ? `${d.ctr}%` : '--'}</p>
              <p className="text-xs text-muted-foreground mt-1.5">CTR</p>
            </div>
          </div>

          {/* Rankings table */}
          <Card className="bg-white/[0.03] border-white/[0.04] rounded-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="tracking-tight">Article Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead className="w-36">Keyword</TableHead>
                    <TableHead className="w-24 text-right">Position</TableHead>
                    <TableHead className="w-24 text-center">Change</TableHead>
                    <TableHead className="w-24 text-right">Clicks</TableHead>
                    <TableHead className="w-28 text-right">Impressions</TableHead>
                    <TableHead className="w-20 text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-white/[0.02] transition-colors duration-100">
                      <TableCell>
                        <a
                          href={`/dashboard/seo/articles/${r.articleId ?? r.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-150"
                        >
                          {r.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.keyword}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-semibold tabular-nums ${r.position <= 3 ? 'text-emerald-400' : r.position <= 10 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                          #{r.position}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <PositionChange current={r.position} previous={r.previousPosition} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">{(r.weeklyClicks ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{(r.weeklyImpressions ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{(r.ctr ?? 0).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
