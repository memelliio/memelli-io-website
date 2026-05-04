'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  File,
  BookOpen,
  Lock,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  content_type?: string;
  duration?: number;
  duration_minutes?: number;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Program {
  id: string;
  name: string;
  description?: string;
  status: string;
  price?: number;
  modules?: Module[];
}

const lessonTypeIcon: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-4 w-4 text-primary" />,
  TEXT: <FileText className="h-4 w-4 text-white/30" />,
  QUIZ: <HelpCircle className="h-4 w-4 text-amber-400" />,
  PDF: <File className="h-4 w-4 text-primary/80" />,
};

export default function ProgramPreviewPage() {
  const params = useParams();
  const programId = params.programId as string;
  const api = useApi();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: program, isLoading, error } = useQuery({
    queryKey: ['coaching', 'program', programId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/programs/${programId}`);
      if (res.error) throw new Error(res.error);
      const prog: Program = (res.data?.data ?? res.data) as Program;
      // Expand first module by default
      if (prog.modules?.[0]) {
        setExpandedModules(new Set([prog.modules[0].id]));
      }
      return prog;
    },
  });

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const modules = (program?.modules ?? []).slice().sort((a, b) => a.order - b.order);
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalDuration = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((la, l) => la + (l.duration ?? l.duration_minutes ?? 0), 0),
    0,
  );

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (error) return <p className="text-sm text-primary/80">{(error as Error).message}</p>;
  if (!program) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Preview banner */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 backdrop-blur-xl">
        <p className="text-sm font-medium text-amber-300">
          Preview Mode -- this is how students will see the program
        </p>
        <Link
          href={`/dashboard/coaching/programs/${programId}/builder`}
          className="text-xs text-amber-400 underline hover:text-amber-200"
        >
          Back to Builder
        </Link>
      </div>

      {/* Program header */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <div className="bg-gradient-to-br from-purple-900/30 to-transparent px-8 py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">{program.name}</h1>
              {program.description && (
                <p className="text-base text-muted-foreground leading-relaxed">{program.description}</p>
              )}
              <div className="mt-4 flex items-center gap-5 text-sm text-white/40">
                <span>{modules.length} modules</span>
                <span>{totalLessons} lessons</span>
                {totalDuration > 0 && <span>{totalDuration} min total</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              {program.price != null && program.price > 0 ? (
                <div className="text-3xl font-bold text-white/90">${program.price}</div>
              ) : (
                <div className="text-lg font-semibold text-primary">Free</div>
              )}
            </div>
          </div>
        </div>

        {/* Enroll button (disabled in preview) */}
        <div className="flex items-center justify-between border-t border-white/[0.04] bg-card px-8 py-5">
          <p className="flex items-center gap-1.5 text-xs italic text-muted-foreground leading-relaxed">
            <Lock className="h-3.5 w-3.5" />
            Enroll button is disabled in preview mode
          </p>
          <button
            disabled
            className="cursor-not-allowed rounded-2xl bg-primary/30 px-6 py-2.5 text-sm font-medium text-white/30"
            title="This is a preview"
          >
            Enroll Now
          </button>
        </div>
      </div>

      {/* Course content */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Course Content</h2>
        <div className="space-y-3">
          {modules.map((mod, modIdx) => {
            const expanded = expandedModules.has(mod.id);
            const sortedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);

            return (
              <div
                key={mod.id}
                className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl transition-all duration-200"
              >
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-all duration-200 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                    )}
                    <div>
                      <span className="font-medium text-white/90">
                        Module {modIdx + 1}: {mod.title}
                      </span>
                      <span className="ml-2 text-sm text-white/30">
                        {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                        {mod.lessons.reduce((a, l) => a + (l.duration ?? l.duration_minutes ?? 0), 0) > 0 && (
                          <> · {mod.lessons.reduce((a, l) => a + (l.duration ?? l.duration_minutes ?? 0), 0)}m</>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar (0% in preview) */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-0 rounded-full bg-gradient-to-r from-purple-500 to-purple-400" />
                    </div>
                    <span className="text-xs text-white/30">0%</span>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-white/[0.04]">
                    {sortedLessons.length === 0 && (
                      <p className="px-5 py-4 text-sm text-white/30">No lessons in this module.</p>
                    )}
                    {sortedLessons.map((lesson, lessonIdx) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 border-b border-white/[0.03] px-5 py-3.5 last:border-0"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-white/20">
                          {lessonIdx + 1}
                        </span>
                        {lessonTypeIcon[lesson.contentType ?? lesson.content_type ?? ''] ?? (
                          <BookOpen className="h-4 w-4 text-white/30" />
                        )}
                        <span className="flex-1 text-sm text-white/60">{lesson.title}</span>
                        {(lesson.duration ?? lesson.duration_minutes) != null && (
                          <span className="text-xs text-white/30">{lesson.duration ?? lesson.duration_minutes}m</span>
                        )}
                        <div className="h-4 w-4 shrink-0 rounded-full border border-white/[0.1]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {modules.length === 0 && (
            <div className="py-10 text-center text-sm text-white/30">
              No modules have been added to this program yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom enroll CTA */}
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-card p-6 backdrop-blur-xl">
        <div>
          <p className="font-semibold tracking-tight text-foreground">Ready to start?</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
            Enroll to get full access to all {totalLessons} lessons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs italic text-white/20">Preview only</p>
          <button
            disabled
            className="cursor-not-allowed rounded-2xl bg-primary/30 px-6 py-2.5 text-sm font-medium text-white/30"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
