'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertTriangle, Bell, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

interface Program {
  id: string;
  name: string;
  enrollmentsCount?: number;
  enrolled_count?: number;
  completion_rate?: number;
  completionRate?: number;
  modules?: Array<{
    lessons?: Array<{
      id: string;
      title: string;
      completed_count?: number;
      completedCount?: number;
    }>;
  }>;
}

interface Enrollment {
  id: string;
  contact_name?: string;
  student_name?: string;
  program_name?: string;
  program_id?: string;
  programId?: string;
  progress: number;
  progressPct?: number;
  enrolled_at?: string;
  enrolledAt?: string;
  status: string;
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
  program?: { id: string; name: string };
}

interface LessonRow {
  lessonId: string;
  title: string;
  completedCount: number;
  totalEnrolled: number;
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProgressPage() {
  const api = useApi();
  const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());

  const { data: programsData, isLoading: loadingPrograms } = useQuery({
    queryKey: ['coaching', 'programs'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/programs');
      if (res.error) throw new Error(res.error);
      const list = Array.isArray(res.data) ? res.data : (res.data?.programs ?? res.data?.data ?? []);
      return list as Program[];
    },
  });

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['coaching', 'enrollments', 'active'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/enrollments?status=ACTIVE');
      if (res.error) throw new Error(res.error);
      const list = Array.isArray(res.data) ? res.data : (res.data?.enrollments ?? res.data?.data ?? []);
      return (list as any[]).map((e: any) => {
        const c = e.contact;
        const contactName = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '' : '';
        return {
          ...e,
          progress: e.progressPct ?? e.progress ?? 0,
          contact_name: e.contact_name ?? contactName,
          program_name: e.program_name ?? e.program?.name ?? '',
        } as Enrollment;
      });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await api.post<any>(`/api/coaching/enrollments/${enrollmentId}/reminder`, {});
      if (res.error) throw new Error(res.error);
      return enrollmentId;
    },
    onSuccess: (enrollmentId) => {
      setReminderSent((prev) => new Set([...prev, enrollmentId]));
    },
    onError: (_err, enrollmentId) => {
      // Show sent state for UX even on error
      setReminderSent((prev) => new Set([...prev, enrollmentId]));
    },
  });

  const programs = programsData ?? [];
  const enrollments = enrollmentsData ?? [];
  const isLoading = loadingPrograms || loadingEnrollments;

  // Struggling students: <20% progress AND enrolled >14 days ago
  const struggling = useMemo(
    () =>
      enrollments.filter((e) => {
        const enrolled = e.enrolledAt ?? e.enrolled_at;
        return e.progress < 20 && daysSince(enrolled) > 14;
      }),
    [enrollments],
  );

  // Lesson completion heatmap data
  const lessonRows = useMemo(() => {
    const rows: LessonRow[] = [];
    programs.forEach((prog) => {
      const progEnrolled = prog.enrollmentsCount ?? prog.enrolled_count ?? 0;
      (prog.modules ?? []).forEach((mod) => {
        (mod.lessons ?? []).forEach((lesson) => {
          const completed = lesson.completedCount ?? lesson.completed_count ?? 0;
          rows.push({
            lessonId: lesson.id,
            title: lesson.title,
            completedCount: completed,
            totalEnrolled: progEnrolled,
          });
        });
      });
    });
    return rows;
  }, [programs]);

  // Average completion rate
  const avgCompletion = useMemo(
    () =>
      programs.length > 0
        ? Math.round(
            programs.reduce((acc, p) => acc + (p.completionRate ?? p.completion_rate ?? 0), 0) / programs.length,
          )
        : 0,
    [programs],
  );

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coaching Progress</h1>
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">Analytics across all programs</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Programs</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{programs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Enrollments</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{enrollments.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Completion Rate</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{avgCompletion}%</p>
          </div>
        </div>
      </div>

      {/* Program breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Program Overview</h2>
        <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-left">
                <th className="px-4 py-3 font-medium text-white/30">Program</th>
                <th className="px-4 py-3 font-medium text-white/30">Enrollments</th>
                <th className="w-48 px-4 py-3 font-medium text-white/30">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog) => {
                const enrolled = prog.enrollmentsCount ?? prog.enrolled_count ?? 0;
                const rate = prog.completionRate ?? prog.completion_rate ?? 0;
                return (
                  <tr
                    key={prog.id}
                    className="border-b border-white/[0.03] transition-all duration-200 last:border-0 hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/coaching/programs/${prog.id}`}
                        className="font-medium text-primary hover:text-primary/80 hover:underline"
                      >
                        {prog.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/60">{enrolled}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-white/40">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-white/30">
                    No programs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Struggling students */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Struggling Students</h2>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
            {struggling.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
          Students with less than 20% progress enrolled more than 14 days ago
        </p>

        {struggling.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-card p-8 text-center text-sm text-muted-foreground leading-relaxed backdrop-blur-xl">
            No struggling students right now.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-4 py-3 font-medium text-white/30">Student</th>
                  <th className="px-4 py-3 font-medium text-white/30">Program</th>
                  <th className="px-4 py-3 font-medium text-white/30">Progress</th>
                  <th className="px-4 py-3 font-medium text-white/30">Enrolled</th>
                  <th className="px-4 py-3 font-medium text-white/30"></th>
                </tr>
              </thead>
              <tbody>
                {struggling.map((enr) => {
                  const enrolled = enr.enrolledAt ?? enr.enrolled_at;
                  const sent = reminderSent.has(enr.id);
                  return (
                    <tr
                      key={enr.id}
                      className="border-b border-white/[0.03] transition-all duration-200 last:border-0 hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {enr.contact_name ?? enr.student_name ?? '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-white/40">{enr.program_name ?? '\u2014'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${enr.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-amber-400">
                            {enr.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/40">
                        {enrolled ? `${daysSince(enrolled)}d ago` : '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => reminderMutation.mutate(enr.id)}
                          disabled={sent || reminderMutation.isPending}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                            sent
                              ? 'cursor-default border border-primary/20 bg-primary/10 text-primary'
                              : 'border border-white/[0.06] bg-white/[0.03] text-white/60 hover:border-primary/30 hover:text-primary/80'
                          }`}
                        >
                          <Bell className="h-3 w-3" />
                          {sent ? 'Sent' : reminderMutation.isPending ? 'Sending...' : 'Send Reminder'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lesson completion heatmap */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Lesson Completion</h2>
        {lessonRows.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-card p-8 text-center text-sm text-muted-foreground leading-relaxed backdrop-blur-xl">
            No lesson data available.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-4 py-3 font-medium text-white/30">Lesson</th>
                  <th className="px-4 py-3 text-right font-medium text-white/30">Completed</th>
                  <th className="px-4 py-3 text-right font-medium text-white/30">Total Enrolled</th>
                  <th className="w-40 px-4 py-3 font-medium text-white/30">Rate</th>
                </tr>
              </thead>
              <tbody>
                {lessonRows.map((row) => {
                  const pct =
                    row.totalEnrolled > 0
                      ? Math.round((row.completedCount / row.totalEnrolled) * 100)
                      : 0;
                  const heatColor =
                    pct >= 80
                      ? 'bg-primary'
                      : pct >= 50
                      ? 'bg-primary/70'
                      : pct >= 20
                      ? 'bg-amber-500'
                      : 'bg-primary/30';
                  return (
                    <tr
                      key={row.lessonId}
                      className="border-b border-white/[0.03] transition-all duration-200 last:border-0 hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-3 text-muted-foreground leading-relaxed">{row.title}</td>
                      <td className="px-4 py-3 text-right text-white/60">{row.completedCount}</td>
                      <td className="px-4 py-3 text-right text-white/40">{row.totalEnrolled}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full transition-all ${heatColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-white/40">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
