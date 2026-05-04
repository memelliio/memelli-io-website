'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  MessageCircle,
  BookOpen,
  Video,
  FileText,
} from 'lucide-react';
import { Badge } from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { ProgressBar } from '../../../../../../components/ui/progress-bar';

interface Lesson {
  id: string;
  title: string;
  content?: string;
  contentType: string;
  videoUrl?: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface EnrollmentDetail {
  id: string;
  status: string;
  progressPct: number;
  totalLessons: number;
  completedLessons: number;
  progress: { lessonId: string; completedAt: string }[];
  program: {
    id: string;
    name: string;
    modules: Module[];
  };
  certificate?: { id: string } | null;
}

export default function StudentLessonFlowPage() {
  const { programId } = useParams<{ programId: string }>();
  const api = useApi();
  const queryClient = useQueryClient();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const { data: enrollmentData, isLoading } = useQuery({
    queryKey: ['coaching', 'enrollments', 'program', programId],
    queryFn: async () => {
      // Get enrollments for this program, take first
      const res = await api.get<any>(`/api/coaching/enrollments?programId=${programId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      if (list.length === 0) return null;
      // Get full detail
      const detailRes = await api.get<any>(`/api/coaching/enrollments/${list[0].id}`);
      if (detailRes.error) throw new Error(detailRes.error);
      return (detailRes.data?.data ?? detailRes.data) as EnrollmentDetail;
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!enrollmentData) return;
      const res = await api.post<any>('/api/coaching/progress/complete', {
        enrollmentId: enrollmentData.id,
        lessonId,
      });
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'enrollments', 'program', programId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!enrollmentData) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <BookOpen className="h-12 w-12 text-white/20" />
        <p className="mt-4 text-sm text-white/30">You are not enrolled in this program.</p>
        <Link href="/dashboard/coaching/student">
          <Button variant="secondary" className="mt-3">
            Back to My Learning
          </Button>
        </Link>
      </div>
    );
  }

  const allLessons: (Lesson & { moduleName: string })[] = [];
  enrollmentData.program.modules.forEach((mod) => {
    mod.lessons.forEach((lesson) => {
      allLessons.push({ ...lesson, moduleName: mod.title });
    });
  });

  const completedIds = new Set(enrollmentData.progress.map((p) => p.lessonId));

  // Default to first uncompleted lesson
  const currentLessonId = activeLessonId ?? allLessons.find((l) => !completedIds.has(l.id))?.id ?? allLessons[0]?.id;
  const currentIdx = allLessons.findIndex((l) => l.id === currentLessonId);
  const currentLesson = allLessons[currentIdx];
  const isCompleted = completedIds.has(currentLessonId);

  return (
    <div className="flex h-full">
      {/* Sidebar - Lesson List */}
      <div className="hidden w-72 shrink-0 overflow-y-auto border-r border-white/[0.04] bg-card backdrop-blur-xl lg:block">
        <div className="p-4">
          <Link href="/dashboard/coaching/student" className="text-xs text-muted-foreground leading-relaxed transition-all duration-200 hover:text-white/60">
            <ArrowLeft className="inline h-3 w-3" /> Back to My Learning
          </Link>
          <h2 className="mt-3 text-sm font-semibold tracking-tight text-foreground">{enrollmentData.program.name}</h2>
          <div className="mt-2">
            <ProgressBar value={enrollmentData.progressPct} color="green" size="sm" showLabel />
          </div>
        </div>

        <div className="px-2 pb-4">
          {enrollmentData.program.modules.map((mod) => (
            <div key={mod.id} className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-white/30">{mod.title}</p>
              {mod.lessons.map((lesson) => {
                const done = completedIds.has(lesson.id);
                const active = lesson.id === currentLessonId;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-all duration-200 ${
                      active
                        ? 'bg-primary/10 text-primary/80'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" />
                    )}
                    <span className="truncate">{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentLesson ? (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed">{currentLesson.moduleName}</p>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{currentLesson.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="muted" className="capitalize">
                  {currentLesson.contentType.toLowerCase()}
                </Badge>
                {isCompleted && <Badge variant="success">Completed</Badge>}
              </div>
            </div>

            {/* Video */}
            {currentLesson.contentType === 'VIDEO' && currentLesson.videoUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-background">
                <iframe
                  src={currentLesson.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Content */}
            {currentLesson.content && (
              <div className="rounded-2xl border border-white/[0.04] bg-card p-6 backdrop-blur-xl">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {currentLesson.content}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentIdx > 0) setActiveLessonId(allLessons[currentIdx - 1].id);
                }}
                disabled={currentIdx === 0}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </Button>

              <div className="flex gap-2">
                {!isCompleted && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary rounded-xl"
                    onClick={() => completeLessonMutation.mutate(currentLessonId)}
                    disabled={completeLessonMutation.isPending}
                  >
                    {completeLessonMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                      </>
                    )}
                  </Button>
                )}

                <Link href={`/dashboard/coaching/student/${programId}/chat`}>
                  <Button size="sm" variant="secondary">
                    <MessageCircle className="h-3.5 w-3.5" /> AI Coach
                  </Button>
                </Link>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  if (currentIdx < allLessons.length - 1) setActiveLessonId(allLessons[currentIdx + 1].id);
                }}
                disabled={currentIdx >= allLessons.length - 1}
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-sm text-muted-foreground leading-relaxed">No lessons available in this program.</p>
          </div>
        )}
      </div>
    </div>
  );
}
