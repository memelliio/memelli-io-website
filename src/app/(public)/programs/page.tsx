'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users, BookOpen, ArrowRight } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface PublicProgram {
  id: string;
  name: string;
  description?: string;
  price?: number;
  metaJson?: { slug?: string; coverImageUrl?: string; isPublic?: boolean };
  _count?: { modules: number; enrollments: number };
}

export default function PublicProgramsPage() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['public', 'programs'],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/coaching/programs/public`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.data ?? []) as PublicProgram[];
    },
  });

  const programList = programs ?? [];

  return (
    <div className="bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-red-600/[0.04] blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/15 bg-red-500/5 px-4 py-2 text-sm text-red-300">
            <GraduationCap className="h-4 w-4" />
            Coaching Programs
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl text-white/90">
            Transform Your Future with{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-500 bg-clip-text text-transparent">
              Expert Coaching
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground font-light">
            Enroll in AI-powered coaching programs designed to help you master credit repair,
            business building, and financial strategies.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-28">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          ) : programList.length === 0 ? (
            <div className="py-28 text-center">
              <GraduationCap className="mx-auto h-14 w-14 text-zinc-800" />
              <p className="mt-5 text-muted-foreground font-light">No programs available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programList.map((program) => {
                const slug = program.metaJson?.slug ?? program.id;
                return (
                  <div
                    key={program.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl transition-all duration-250 hover:border-border hover:bg-card"
                  >
                    {/* Cover Image */}
                    {program.metaJson?.coverImageUrl ? (
                      <div className="aspect-video overflow-hidden bg-card">
                        <img
                          src={program.metaJson.coverImageUrl}
                          alt={program.name}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-red-950/20 to-zinc-900/60">
                        <GraduationCap className="h-12 w-12 text-red-500/20" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-semibold text-white/90">{program.name}</h3>
                      {program.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {program.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          {program._count?.modules ?? 0} modules
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {program._count?.enrollments ?? 0} enrolled
                        </span>
                      </div>

                      <div className="mt-auto pt-5 flex items-center justify-between">
                        <span className="text-lg font-semibold text-red-400">
                          {program.price && program.price > 0 ? `$${program.price}` : 'Free'}
                        </span>
                        <Link
                          href={`/programs/${program.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-500"
                        >
                          Learn More <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
