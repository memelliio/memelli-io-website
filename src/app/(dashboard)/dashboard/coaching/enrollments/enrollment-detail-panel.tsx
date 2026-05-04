'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, Award, BookOpen } from 'lucide-react';
import { Badge } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { ProgressBar } from '../../../../../components/ui/progress-bar';
import { Button } from '../../../../../components/ui/button';

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  progressPct?: number;
  program?: { id: string; name: string };
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
}

interface EnrollmentDetail extends Enrollment {
  totalLessons: number;
  completedLessons: number;
  progress: { lessonId: string; completedAt: string }[];
  certificate?: { id: string; issuedAt: string } | null;
  program: {
    id: string;
    name: string;
    modules: {
      id: string;
      title: string;
      lessons: { id: string; title: string; contentType: string }[];
    }[];
  };
}

export function EnrollmentDetailPanel({ enrollment }: { enrollment: Enrollment }) {
  const api = useApi();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['coaching', 'enrollment', enrollment.id],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/enrollments/${enrollment.id}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as EnrollmentDetail;
    },
  });

  const contactName = enrollment.contact
    ? [enrollment.contact.firstName, enrollment.contact.lastName].filter(Boolean).join(' ') ||
      enrollment.contact.email ||
      'Unknown'
    : 'Unknown';

  if (isLoading || !detail) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const completedIds = new Set(detail.progress.map((p) => p.lessonId));

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">{contactName}</h2>
        <p className="text-sm text-zinc-400">{detail.program?.name ?? 'Unknown Program'}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Progress</span>
          <span className="text-sm font-medium text-zinc-200">
            {detail.completedLessons} / {detail.totalLessons} lessons
          </span>
        </div>
        <ProgressBar value={detail.progressPct ?? enrollment.progressPct ?? 0} color="green" size="md" showLabel />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Status</p>
          <Badge
            variant={
              detail.status === 'COMPLETED' ? 'success' : detail.status === 'DROPPED' ? 'destructive' : 'muted'
            }
            className="mt-1 capitalize"
          >
            {detail.status?.toLowerCase() ?? 'active'}
          </Badge>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Enrolled</p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {new Date(detail.enrolledAt).toLocaleDateString()}
          </p>
        </div>
        {detail.completedAt && (
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Completed</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              {new Date(detail.completedAt).toLocaleDateString()}
            </p>
          </div>
        )}
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Certificate</p>
          {detail.certificate ? (
            <div className="mt-1 flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Issued</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">Not issued</p>
          )}
        </div>
      </div>

      {/* Lesson Completion */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-300">Lesson Progress</h3>
        <div className="space-y-1">
          {detail.program?.modules?.map((mod) => (
            <div key={mod.id}>
              <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase">{mod.title}</p>
              {mod.lessons.map((lesson) => {
                const done = completedIds.has(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-2 py-1 pl-3"
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-zinc-600" />
                    )}
                    <span className={`text-sm ${done ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {lesson.title}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/dashboard/coaching/programs/${detail.program?.id}`} className="flex-1">
          <Button className="w-full" size="sm" variant="secondary">
            <BookOpen className="h-3.5 w-3.5" /> View Program
          </Button>
        </Link>
      </div>
    </div>
  );
}
