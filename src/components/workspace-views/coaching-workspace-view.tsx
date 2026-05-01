'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoachingAnalytics {
  totalPrograms: number;
  programsTrend: number;
  activeEnrollments: number;
  enrollmentsTrend: number;
  completionRate: number;
  completionTrend: number;
  certificatesIssued: number;
  certificatesTrend: number;
  completionByMonth: { month: string; rate: number }[];
  popularPrograms: { name: string; enrollments: number; completionRate: number }[];
  recentEnrollments: RecentEnrollment[];
}

interface RecentEnrollment {
  id: string;
  contactName: string;
  contactEmail: string;
  programName: string;
  status: string;
  enrolledAt: string;
  progressPct: number;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CoachingWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function trendDirection(val: number): 'up' | 'down' | 'flat' {
  if (val > 0) return 'up';
  if (val < 0) return 'down';
  return 'flat';
}

const statusVariant: Record<string, 'success' | 'muted' | 'destructive'> = {
  ACTIVE: 'success',
  COMPLETED: 'success',
  IN_PROGRESS: 'muted',
  ENROLLED: 'muted',
  DROPPED: 'destructive',
  PAUSED: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CoachingWorkspaceView({ compact = false }: CoachingWorkspaceViewProps) {
  const api = useApi();

  const { data: programsRaw } = useQuery({
    queryKey: ['coaching', 'programs'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/programs');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as any[];
    },
  });

  const { data: enrollmentsRaw, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['coaching', 'enrollments', 'all-dashboard'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/enrollments');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as any[];
    },
  });

  const { data: certsRaw } = useQuery({
    queryKey: ['coaching', 'certificates'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/certificates');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as any[];
    },
  });

  const programs = programsRaw ?? [];
  const enrollments = enrollmentsRaw ?? [];
  const certs = certsRaw ?? [];

  const analytics: CoachingAnalytics | null = useMemo(() => {
    if (!programsRaw || !enrollmentsRaw) return null;
    const totalPrograms = programs.length;
    const activeEnrollments = enrollments.filter((e: any) => e.status === 'ACTIVE').length;
    const completedEnrollments = enrollments.filter((e: any) => e.status === 'COMPLETED');
    const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0;
    const certificatesIssued = certs.length;

    const progMap: Record<string, { name: string; enrollments: number; completed: number }> = {};
    enrollments.forEach((e: any) => {
      const pid = e.program?.id ?? 'unknown';
      const pname = e.program?.name ?? 'Unknown';
      if (!progMap[pid]) progMap[pid] = { name: pname, enrollments: 0, completed: 0 };
      progMap[pid].enrollments++;
      if (e.status === 'COMPLETED') progMap[pid].completed++;
    });
    const popularPrograms = Object.values(progMap)
      .map((p) => ({ name: p.name, enrollments: p.enrollments, completionRate: p.enrollments > 0 ? Math.round((p.completed / p.enrollments) * 100) : 0 }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 6);

    const recentEnrollments: RecentEnrollment[] = [...enrollments]
      .sort((a: any, b: any) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
      .slice(0, 8)
      .map((e: any) => {
        const c = e.contact;
        const contactName = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Unknown' : 'Unknown';
        return {
          id: e.id,
          contactName,
          contactEmail: c?.email ?? '',
          programName: e.program?.name ?? 'Unknown',
          status: e.status,
          enrolledAt: e.enrolledAt,
          progressPct: e.progressPct ?? 0,
        };
      });

    return {
      totalPrograms,
      programsTrend: 0,
      activeEnrollments,
      enrollmentsTrend: 0,
      completionRate,
      completionTrend: 0,
      certificatesIssued,
      certificatesTrend: 0,
      completionByMonth: [],
      popularPrograms,
      recentEnrollments,
    };
  }, [programsRaw, enrollmentsRaw, certsRaw, programs, enrollments, certs]);

  if (loadingEnrollments || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton variant="card" height={300} />
          <Skeleton variant="card" height={300} />
        </div>
      </div>
    );
  }

  const completionByMonth = analytics.completionByMonth ?? [];
  const popularPrograms = analytics.popularPrograms ?? [];
  const recentEnrollments = analytics.recentEnrollments ?? [];

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Programs"
          value={analytics.totalPrograms}
          change={analytics.programsTrend}
          trend={trendDirection(analytics.programsTrend)}
          icon={<GraduationCap className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Active Enrollments"
          value={analytics.activeEnrollments}
          change={analytics.enrollmentsTrend}
          trend={trendDirection(analytics.enrollmentsTrend)}
          icon={<Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Completion Rate"
          value={`${analytics.completionRate}%`}
          change={analytics.completionTrend}
          trend={trendDirection(analytics.completionTrend)}
          icon={<TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
        <MetricTile
          label="Certificates Issued"
          value={analytics.certificatesIssued}
          change={analytics.certificatesTrend}
          trend={trendDirection(analytics.certificatesTrend)}
          icon={<Award className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Completion rate bar chart */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Completion Rate by Month</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {completionByMonth.length > 0 ? (
              <BarChart data={completionByMonth} xKey="month" yKey="rate" color="#E11D2E" height={220} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                No completion data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular programs */}
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Popular Programs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {popularPrograms.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No programs yet</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {popularPrograms.slice(0, 6).map((program) => (
                  <div key={program.name} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.04]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{program.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{program.enrollments} enrolled</p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <span className="text-sm font-semibold tabular-nums text-red-400">{program.completionRate}%</span>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">completion</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Enrollments */}
      {!compact && (
        <Card className="bg-[hsl(var(--card))] backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentEnrollments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No enrollments yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-xs text-[hsl(var(--muted-foreground))]">
                      <th className="px-5 py-2.5 font-medium">Contact</th>
                      <th className="px-5 py-2.5 font-medium">Program</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 font-medium text-right">Progress</th>
                      <th className="px-5 py-2.5 font-medium text-right">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {recentEnrollments.slice(0, 8).map((enrollment) => (
                      <tr key={enrollment.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="whitespace-nowrap px-5 py-3">
                          <p className="font-medium text-[hsl(var(--foreground))]">{enrollment.contactName || 'Unknown'}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{enrollment.contactEmail}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-[hsl(var(--muted-foreground))]">{enrollment.programName}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <Badge variant={statusVariant[enrollment.status] ?? 'muted'} className="capitalize">
                            {enrollment.status?.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-[hsl(var(--muted-foreground))]">
                          {enrollment.progressPct ?? 0}%
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                            <Clock className="h-3 w-3" />
                            {relativeTime(enrollment.enrolledAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
