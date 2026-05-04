// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, TrendingUp, Users, Award, BookOpen } from 'lucide-react';
import { MetricTile } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { ProgressBar } from '../../../../../components/ui/progress-bar';

interface Program {
  id: string;
  name: string;
  status: string;
  _count?: { modules: number; enrollments: number };
}

interface Enrollment {
  id: string;
  status: string;
  progressPct?: number;
  enrolledAt: string;
  completedAt?: string;
  program?: { id: string; name: string };
}

export default function CoachingAnalyticsPage() {
  const api = useApi();

  const { data: programs } = useQuery({
    queryKey: ['coaching', 'programs'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/programs');
      return (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])) as Program[];
    },
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['coaching', 'enrollments', 'all'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/enrollments');
      return (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])) as Enrollment[];
    },
  });

  const { data: certificates } = useQuery({
    queryKey: ['coaching', 'certificates'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/certificates');
      return (Array.isArray(res.data) ? res.data : (res.data?.data ?? [])) as any[];
    },
  });

  const programList = programs ?? [];
  const enrollmentList = enrollments ?? [];
  const certList = certificates ?? [];

  const completedEnrollments = useMemo(
    () => enrollmentList.filter((e) => e.status === 'COMPLETED'),
    [enrollmentList],
  );
  const completionRate = useMemo(
    () => (enrollmentList.length > 0 ? Math.round((completedEnrollments.length / enrollmentList.length) * 100) : 0),
    [enrollmentList.length, completedEnrollments.length],
  );
  const avgProgress = useMemo(
    () =>
      enrollmentList.length > 0
        ? Math.round(enrollmentList.reduce((sum, e) => sum + (e.progressPct ?? 0), 0) / enrollmentList.length)
        : 0,
    [enrollmentList],
  );

  const avgDaysToComplete = useMemo(() => {
    const completed = enrollmentList.filter((e) => e.completedAt && e.enrolledAt);
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((sum, e) => {
      const days = (new Date(e.completedAt!).getTime() - new Date(e.enrolledAt).getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    return Math.round(totalDays / completed.length);
  }, [enrollmentList]);

  const programStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; avgProgress: number }> = {};
    enrollmentList.forEach((e) => {
      const pid = e.program?.id ?? 'unknown';
      const name = e.program?.name ?? 'Unknown';
      if (!map[pid]) map[pid] = { name, total: 0, completed: 0, avgProgress: 0 };
      map[pid].total++;
      if (e.status === 'COMPLETED') map[pid].completed++;
      map[pid].avgProgress += e.progressPct ?? 0;
    });
    return Object.values(map)
      .map((s) => ({ ...s, avgProgress: s.total > 0 ? Math.round(s.avgProgress / s.total) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [enrollmentList]);

  const enrollmentsByWeek = useMemo(() => {
    const weeks: Record<string, number> = {};
    const now = Date.now();
    enrollmentList.forEach((e) => {
      const daysAgo = Math.floor((now - new Date(e.enrolledAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 28) {
        const week = `Week ${Math.floor(daysAgo / 7) + 1}`;
        weeks[week] = (weeks[week] ?? 0) + 1;
      }
    });
    return ['Week 4', 'Week 3', 'Week 2', 'Week 1'].map((w) => ({
      label: w,
      value: weeks[w] ?? 0,
    }));
  }, [enrollmentList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const maxWeekly = Math.max(...enrollmentsByWeek.map((w) => w.value), 1);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl tracking-tight font-semibold text-foreground">Coaching Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Engagement, completion, and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={completionRate >= 50 ? 'up' : completionRate > 0 ? 'down' : 'flat'}
        />
        <MetricTile
          label="Avg Progress"
          value={`${avgProgress}%`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricTile
          label="Avg Days to Complete"
          value={avgDaysToComplete}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricTile
          label="Certificates"
          value={certList.length}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[15px] tracking-tight font-semibold text-foreground">Enrollments (Last 4 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {enrollmentsByWeek.map((week) => (
                <div key={week.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground leading-relaxed">{week.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{week.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                      style={{ width: `${Math.max(4, (week.value / maxWeekly) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[15px] tracking-tight font-semibold text-foreground">Program Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {programStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground leading-relaxed">No data yet</p>
            ) : (
              <div className="space-y-4">
                {programStats.map((stat) => (
                  <div key={stat.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{stat.name}</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {stat.completed}/{stat.total} completed
                      </span>
                    </div>
                    <ProgressBar
                      value={stat.avgProgress}
                      color={stat.avgProgress >= 75 ? 'green' : stat.avgProgress >= 40 ? 'yellow' : 'purple'}
                      size="sm"
                      showLabel
                      label="Avg Progress"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]">
          <BookOpen className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2.5 text-2xl tracking-tight font-semibold text-foreground">{programList.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Programs</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]">
          <Users className="mx-auto h-5 w-5 text-blue-400" />
          <p className="mt-2.5 text-2xl tracking-tight font-semibold text-foreground">{enrollmentList.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Total Enrollments</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]">
          <TrendingUp className="mx-auto h-5 w-5 text-amber-400" />
          <p className="mt-2.5 text-2xl tracking-tight font-semibold text-foreground">{completedEnrollments.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Completions</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 text-center transition-all duration-200 hover:bg-white/[0.04]">
          <Award className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2.5 text-2xl tracking-tight font-semibold text-foreground">{certList.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Certificates</p>
        </div>
      </div>
    </div>
  );
}
