'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Video, FileText, Pencil, Clock, BookOpen } from 'lucide-react';
import { Badge } from '@memelli/ui';
import { useApi } from '../../../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';

interface Lesson {
  id: string;
  title: string;
  content?: string;
  contentType: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  quizzes?: { id: string; title: string }[];
  module?: { id: string; title: string; programId: string };
}

const contentTypeColor: Record<string, string> = {
  VIDEO: 'text-blue-400',
  TEXT: 'text-white/60',
  QUIZ: 'text-amber-400',
  ASSIGNMENT: 'text-primary',
  DOCUMENT: 'text-emerald-400',
};

export default function LessonDetailPage() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const api = useApi();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['coaching', 'lesson', lessonId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/lessons/${lessonId}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as Lesson;
    },
  });

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href={`/dashboard/coaching/programs/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl tracking-tight font-semibold text-foreground">{lesson.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="muted" className="capitalize">
                {lesson.contentType.toLowerCase()}
              </Badge>
              {lesson.duration && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Clock className="h-3 w-3" /> {lesson.duration} min
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/coaching/programs/${id}/lessons/${lessonId}/edit`}>
          <Button size="sm" variant="secondary">
            <Pencil className="h-3.5 w-3.5" /> Edit Lesson
          </Button>
        </Link>
      </div>

      {/* Video Embed */}
      {lesson.contentType === 'VIDEO' && (
        <div className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          {lesson.videoUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-background">
              <iframe
                src={lesson.videoUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-background">
              <div className="text-center">
                <Video className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-2 text-sm text-white/30">No video uploaded yet</p>
                <Link href={`/dashboard/coaching/programs/${id}/lessons/${lessonId}/edit`}>
                  <Button size="sm" variant="secondary" className="mt-3">
                    Add Video
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <div className="px-5 py-4">
          <h3 className="text-sm tracking-tight font-semibold text-foreground">Lesson Content</h3>
        </div>
        <div className="px-5 pb-5">
          {lesson.content ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {lesson.content}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-2 text-sm text-white/30">No content yet</p>
              <Link href={`/dashboard/coaching/programs/${id}/lessons/${lessonId}/edit`}>
                <Button size="sm" variant="secondary" className="mt-3">
                  Add Content
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quizzes */}
      {lesson.quizzes && lesson.quizzes.length > 0 && (
        <div className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <div className="px-5 py-4">
            <h3 className="text-sm tracking-tight font-semibold text-foreground">Quizzes</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {lesson.quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-white/70">{quiz.title}</span>
                <div className="flex gap-2">
                  <Link href={`/dashboard/coaching/programs/${id}/quizzes/${quiz.id}/edit`}>
                    <Button size="sm" variant="ghost">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/coaching/programs/${id}/quizzes/${quiz.id}/take`}>
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
