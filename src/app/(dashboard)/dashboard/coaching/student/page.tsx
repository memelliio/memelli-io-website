'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Award,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Clock,
  Trophy,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ProgressBar,
  Badge,
  Button,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ---------- Types ---------- */

interface LessonProgress {
  id: string;
  lessonId: string;
  completedAt: string | null;
  lesson?: { id: string; title: string; order: number };
}

interface Enrollment {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  completedAt?: string;
  progressPct?: number;
  programId: string;
  program: {
    id: string;
    name: string;
    description?: string;
    lessonCount?: number;
  };
  certificate?: { id: string; issuedAt: string } | null;
  progress?: LessonProgress[];
  _count?: { progress: number };
}

/* ---------- Helpers ---------- */

function statusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'default' as const;
    case 'PAUSED':
      return 'warning' as const;
    case 'COMPLETED':
      return 'success' as const;
    case 'CANCELLED':
      return 'error' as const;
    default:
      return 'default' as const;
  }
}

function lessonsCompleted(enrollment: Enrollment): number {
  return enrollment._count?.progress ?? enrollment.progress?.filter((p) => p.completedAt)?.length ?? 0;
}

function totalLessons(enrollment: Enrollment): number {
  return enrollment.program?.lessonCount ?? enrollment.progress?.length ?? 0;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ---------- Skeleton Loader ---------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <Skeleton variant="line" width="220px" height="28px" />
        <Skeleton variant="line" width="320px" height="16px" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton variant="stat-card" />
        <Skeleton variant="stat-card" />
        <Skeleton variant="stat-card" />
      </div>

      {/* Program cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function StudentDashboard() {
  const api = useApi();

  const { data: enrollmentsData, isLoading } = useQuery({
    queryKey: ['coaching', 'enrollments', 'mine'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/enrollments?mine=true');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Enrollment[];
    },
  });

  const enrollments = enrollmentsData ?? [];
  const active = enrollments.filter((e) => e.status === 'ACTIVE' || e.status === 'PAUSED');
  const completed = enrollments.filter((e) => e.status === 'COMPLETED');

  // Recent lesson activity: collect all completed lessons across enrollments, sort by date
  const recentActivity = enrollments
    .flatMap((e) =>
      (e.progress ?? [])
        .filter((p) => p.completedAt)
        .map((p) => ({
          ...p,
          programName: e.program?.name ?? 'Unknown Program',
          programId: e.programId,
        })),
    )
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 8);

  // Certificates
  const certificates = enrollments.filter((e) => e.certificate);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <PageHeader
        title="My Learning"
        subtitle="Track your coaching programs, progress, and achievements"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'My Learning' },
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{active.length}</p>
            <p className="text-xs text-muted-foreground">Active Programs</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{certificates.length}</p>
            <p className="text-xs text-muted-foreground">Certificates Earned</p>
          </div>
        </div>
      </div>

      {/* Active Programs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">In Progress</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-card py-14 text-center backdrop-blur-xl">
            <GraduationCap className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              You have no programs in progress.
            </p>
            <Link href="/dashboard/coaching" className="mt-4 inline-block">
              <Button size="sm" variant="outline">
                Browse Programs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((enrollment) => {
              const done = lessonsCompleted(enrollment);
              const total = totalLessons(enrollment);

              return (
                <div
                  key={enrollment.id}
                  className="flex flex-col rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {enrollment.program?.name ?? 'Unknown Program'}
                    </h3>
                    <Badge variant={statusVariant(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  {enrollment.program?.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {enrollment.program.description}
                    </p>
                  )}
                  <div className="mb-4">
                    <ProgressBar
                      value={enrollment.progressPct ?? 0}
                      color="green"
                      size="lg"
                      showPercentage
                      label="Progress"
                    />
                    {total > 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        {done} of {total} lessons completed
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/coaching/student/${enrollment.programId}`}
                    className="mt-auto"
                  >
                    <Button className="w-full gap-2 bg-primary hover:bg-primary rounded-xl" size="sm">
                      <BookOpen className="h-3.5 w-3.5" />
                      Continue Learning
                      <ArrowRight className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Achievements & Certificates */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
          Achievements &amp; Certificates
        </h2>
        {completed.length === 0 && certificates.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-card py-14 text-center backdrop-blur-xl">
            <Award className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Complete a program to earn your first certificate.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex flex-col rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {enrollment.program?.name ?? 'Unknown'}
                  </h3>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="space-y-3">
                  <ProgressBar value={100} color="green" size="sm" />

                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>
                      {enrollment.completedAt
                        ? `Completed ${formatDate(enrollment.completedAt)}`
                        : 'Completed'}
                    </span>
                    {enrollment.certificate && (
                      <span className="flex items-center gap-1 font-medium text-primary">
                        <Award className="h-3 w-3" /> Certified
                      </span>
                    )}
                  </div>

                  {enrollment.certificate && (
                    <div className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-center">
                      <p className="text-xs font-medium text-primary/80">
                        Certificate issued {formatDate(enrollment.certificate.issuedAt)}
                      </p>
                    </div>
                  )}

                  <Link href={`/dashboard/coaching/student/${enrollment.programId}`}>
                    <Button className="w-full" size="sm" variant="outline">
                      Review Program
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Lesson Activity */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-card py-14 text-center backdrop-blur-xl">
            <Clock className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              No lesson activity yet. Start a program to see your progress here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {activity.lesson?.title ?? `Lesson ${activity.lessonId.slice(0, 6)}`}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{activity.programName}</p>
                </div>
                <span className="shrink-0 text-xs text-white/30">
                  {formatDate(activity.completedAt!)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
