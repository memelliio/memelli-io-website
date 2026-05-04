'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Award, BookOpen, CheckCircle2, Clock } from 'lucide-react';
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
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoachingAnalytics {
  metrics: {
    activePrograms: number;
    activeProgramsChange: number;
    enrollments: number;
    enrollmentsChange: number;
    completionRate: number;
    completionRateChange: number;
    certificates: number;
    certificatesChange: number;
  };
  enrollmentTrend: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
  completionByProgram: Array<{
    program: string;
    rate: number;
  }>;
  timePerLesson: Array<{
    lesson: string;
    minutes: number;
  }>;
  topPrograms: Array<{
    id: string;
    title: string;
    enrollments: number;
    completions: number;
    completionRate: number;
    avgTimeMinutes: number;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CoachingAnalyticsPage() {
  const api = useApi();

  const { data, isLoading } = useQuery<CoachingAnalytics>({
    queryKey: ['analytics', 'coaching'],
    queryFn: async () => {
      const res = await api.get<CoachingAnalytics>('/api/analytics?module=coaching');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const metrics = data?.metrics;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coaching Analytics"
        subtitle="Enrollment trends, completion rates, and program performance"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Coaching' },
        ]}
      />

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
            label="Active Programs"
            value={metrics?.activePrograms ?? 0}
            change={metrics?.activeProgramsChange}
            trend={trendDir(metrics?.activeProgramsChange)}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <MetricTile
            label="Enrollments"
            value={metrics?.enrollments ?? 0}
            change={metrics?.enrollmentsChange}
            trend={trendDir(metrics?.enrollmentsChange)}
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <MetricTile
            label="Completion Rate"
            value={`${metrics?.completionRate ?? 0}%`}
            change={metrics?.completionRateChange}
            trend={trendDir(metrics?.completionRateChange)}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <MetricTile
            label="Certificates"
            value={metrics?.certificates ?? 0}
            change={metrics?.certificatesChange}
            trend={trendDir(metrics?.certificatesChange)}
            icon={<Award className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ---- Enrollment Trend (Line Chart) ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Enrollment Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton variant="card" height={300} />
          ) : (
            <LineChart
              data={data?.enrollmentTrend ?? []}
              xKey="date"
              yKey="enrollments"
              series={[
                { key: 'enrollments', label: 'Enrollments', color: '#10b981' },
                { key: 'completions', label: 'Completions', color: '#10b981' },
              ]}
              height={300}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Completion Rate by Program (Bar Chart) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground tracking-tight">Completion Rate by Program</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" height={300} />
            ) : (
              <BarChart
                data={data?.completionByProgram ?? []}
                xKey="program"
                yKey="rate"
                color="#10b981"
                height={300}
              />
            )}
          </CardContent>
        </Card>

        {/* ---- Time per Lesson (Bar Chart) ---- */}
        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-foreground tracking-tight">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg. Time per Lesson
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton variant="card" height={300} />
            ) : (
              <BarChart
                data={data?.timePerLesson ?? []}
                xKey="lesson"
                yKey="minutes"
                color="#f59e0b"
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Top Programs Table ---- */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground tracking-tight">Top Programs</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton variant="table-row" count={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-left text-[11px] font-medium uppercase text-muted-foreground tracking-widest">
                      Program
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase text-muted-foreground tracking-widest">
                      Enrollments
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase text-muted-foreground tracking-widest">
                      Completions
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase text-muted-foreground tracking-widest">
                      Completion Rate
                    </th>
                    <th className="pb-3 text-right text-[11px] font-medium uppercase text-muted-foreground tracking-widest">
                      Avg. Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(data?.topPrograms ?? []).map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 text-foreground font-medium truncate max-w-[200px] tracking-tight">
                        {p.title}
                      </td>
                      <td className="py-3.5 text-right text-foreground">
                        {p.enrollments.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right text-foreground">
                        {p.completions.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right font-medium text-emerald-400">
                        {p.completionRate}%
                      </td>
                      <td className="py-3.5 text-right text-foreground">
                        {p.avgTimeMinutes}m
                      </td>
                    </tr>
                  ))}
                  {(data?.topPrograms ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No program data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function trendDir(change?: number): 'up' | 'down' | 'flat' {
  if (change === undefined || change === 0) return 'flat';
  return change > 0 ? 'up' : 'down';
}
