'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Video
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  Toggle,
  Skeleton
} from '@memelli/ui';
import { useApi } from '../../../../../../../../../hooks/useApi';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lesson {
  id: string;
  title: string;
  content?: string;
  contentType: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  moduleId?: string;
}

interface ModuleLessons {
  id: string;
  title: string;
  lessons: { id: string; title: string; order: number }[];
}

interface Program {
  id: string;
  title: string;
  modules?: ModuleLessons[];
}

/* ------------------------------------------------------------------ */
/*  Simple markdown-ish renderer (bold, italic, headings, links, code) */
/* ------------------------------------------------------------------ */

function renderMarkdown(src: string): string {
  let html = src
    // escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-white/90 mt-5 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white/90 mt-6 mb-2">$1</h1>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-white/90"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/[0.06] px-1 py-0.5 text-xs text-primary font-mono">$1</code>')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline hover:text-primary/80">$1</a>')
    // unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-white/60">$1</li>')
    // ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-white/60">$1</li>')
    // line breaks (double newline = paragraph break)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LessonEditorPage() {
  const { id: programId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  /* ---- local state ---- */
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [preview, setPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ---- fetch lesson ---- */
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['coaching', 'lesson', lessonId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/lessons/${lessonId}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as Lesson;
    }
  });

  /* ---- fetch program (for prev/next nav) ---- */
  const { data: program } = useQuery({
    queryKey: ['coaching', 'program', programId],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/programs/${programId}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as Program;
    }
  });

  /* ---- populate form when lesson loads ---- */
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setContent(lesson.content ?? '');
      setVideoUrl(lesson.videoUrl ?? '');
    }
  }, [lesson]);

  /* ---- prev / next lesson IDs ---- */
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!program?.modules) return { prevLesson: null, nextLesson: null };

    // flatten all lessons across modules in order
    const allLessons: { id: string; title: string }[] = [];
    for (const mod of program.modules) {
      if (mod.lessons) {
        const sorted = [...mod.lessons].sort((a, b) => a.order - b.order);
        allLessons.push(...sorted);
      }
    }

    const idx = allLessons.findIndex((l) => l.id === lessonId);
    return {
      prevLesson: idx > 0 ? allLessons[idx - 1] : null,
      nextLesson: idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null
    };
  }, [program, lessonId]);

  /* ---- save mutation ---- */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { title, content };
      if (videoUrl) body.videoUrl = videoUrl;
      const res = await api.patch<any>(`/api/coaching/lessons/${lessonId}`, body);
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', programId] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  });

  /* ---- loading skeleton ---- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton variant="line" className="h-8 w-64" />
        <Skeleton variant="line" className="h-4 w-40" />
        <Skeleton variant="card" className="h-12" />
        <Skeleton variant="card" className="h-64" />
        <Skeleton variant="card" className="h-12" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/40">
        <p>Lesson not found.</p>
        <Link href={`/dashboard/coaching/programs/${programId}`}>
          <Button variant="secondary" size="sm" className="mt-4">
            Back to Program
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* ---- Page Header ---- */}
      <PageHeader
        title="Edit Lesson"
        subtitle={lesson.title}
        breadcrumb={[
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'Programs', href: '/dashboard/coaching/programs' },
          { label: program?.title ?? 'Program', href: `/dashboard/coaching/programs/${programId}` },
          { label: lesson.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Toggle
              checked={preview}
              onChange={setPreview}
              label={preview ? 'Preview' : 'Edit'}
              labelPosition="left"
              size="sm"
            />
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <LoadingGlobe size="sm" />
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {saveSuccess ? 'Saved!' : 'Save'}
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* ---- Error banner ---- */}
      {saveMutation.isError && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary/80 backdrop-blur-xl transition-all duration-200">
          Failed to save: {saveMutation.error?.message ?? 'Unknown error'}
        </div>
      )}

      {/* ---- Title + Video URL inputs ---- */}
      <div className="space-y-4 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
        <Input
          label="Lesson Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter lesson title..."
        />
        <Input
          label="Video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/embed/... or Vimeo URL"
          hint="Paste an embed-friendly video URL (YouTube, Vimeo, Loom, etc.)"
        />
        {videoUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/[0.04]">
            <div className="flex items-center gap-2 border-b border-white/[0.04] bg-white/[0.02] px-3 py-2">
              <Video className="h-4 w-4 text-white/30" />
              <span className="text-xs text-white/30">Video Preview</span>
            </div>
            <div className="aspect-video w-full bg-background">
              <iframe
                src={videoUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      {/* ---- Content Editor / Preview ---- */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {preview ? 'Content Preview' : 'Content (Markdown)'}
          </span>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground"
          >
            {preview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Back to Editor
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[300px] bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            {content ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              <p className="text-sm italic text-white/20">No content to preview</p>
            )}
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            resize="vertical"
            size="md"
            placeholder="Write your lesson content here... Markdown is supported (headings, bold, italic, lists, links, inline code)."
            className="font-mono"
          />
        )}
      </div>

      {/* ---- Navigation: Back / Prev / Next ---- */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
        <Link href={`/dashboard/coaching/programs/${programId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Program
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {prevLesson ? (
            <Link href={`/dashboard/coaching/programs/${programId}/lessons/${prevLesson.id}/edit`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}

          {nextLesson ? (
            <Link href={`/dashboard/coaching/programs/${programId}/lessons/${nextLesson.id}/edit`}>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
