'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, BookOpen, Users, Clock, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: { id: string; title: string; contentType: string }[];
}

interface ProgramDetail {
  id: string;
  name: string;
  description?: string;
  price?: number;
  status: string;
  metaJson?: { slug?: string; coverImageUrl?: string; isPublic?: boolean };
  modules: Module[];
  _count?: { enrollments: number };
}

export default function PublicProgramDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: program, isLoading } = useQuery({
    queryKey: ['public', 'program', id],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/coaching/programs/public/${id}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.data ?? null) as ProgramDetail | null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-28 bg-[hsl(var(--background))]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-[hsl(var(--background))]">
        <GraduationCap className="h-14 w-14 text-zinc-800" />
        <p className="mt-5 text-muted-foreground font-light">Program not found</p>
        <Link href="/programs" className="mt-3 text-red-400 hover:text-red-300 transition-colors duration-200">
          Browse all programs
        </Link>
      </div>
    );
  }

  const totalLessons = program.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

  return (
    <div className="bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-red-600/[0.04] blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <Link href="/programs" className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors duration-200">
            &larr; All Programs
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-3">
            {/* Left: Info */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-white/90">
                {program.name}
              </h1>
              {program.description && (
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground font-light">
                  {program.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-red-400" />
                  {program.modules.length} modules
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-red-400" />
                  {program._count?.enrollments ?? 0} enrolled
                </span>
              </div>
            </div>

            {/* Right: CTA Card */}
            <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-7">
              <p className="text-3xl font-semibold text-red-400">
                {program.price && program.price > 0 ? `$${program.price}` : 'Free'}
              </p>
              <Link
                href="/register"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500"
              >
                Enroll Now <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                  AI coaching included
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                  Certificate on completion
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                  Self-paced learning
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-white/90">Curriculum</h2>
          <div className="space-y-4">
            {program.modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-sm font-bold text-red-400">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground">{mod.lessons.length} lessons</p>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.02]">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-6 py-3.5 pl-20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{lesson.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground capitalize">
                        {lesson.contentType.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-white/90">What Students Say</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Sarah M.', text: 'This program completely changed my understanding of credit. Highly recommend!' },
              { name: 'James T.', text: 'The AI coach was incredibly helpful whenever I had questions. Worth every penny.' },
              { name: 'Lisa R.', text: 'Self-paced learning with real accountability. Best investment I have made.' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-red-400 text-red-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-3 text-sm font-medium text-white/90">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white/90">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground font-light">
            Join {program._count?.enrollments ?? 0}+ students already enrolled.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-10 py-4 text-base font-medium text-white shadow-lg shadow-red-500/10 transition-all duration-200 hover:bg-red-500"
          >
            Enroll Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
