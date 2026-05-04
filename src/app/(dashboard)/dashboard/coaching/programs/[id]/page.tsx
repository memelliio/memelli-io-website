'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Pencil,
  Check,
  X,
  Layers,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Modal,
  Input,
  Textarea,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface Program {
  id: string;
  name: string;
  description?: string;
  status: string;
  template?: string;
  price?: number;
  modules: Module[];
  _count?: { enrollments: number };
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'muted' | 'destructive'> = {
  PUBLISHED: 'success',
  ACTIVE: 'success',
  DRAFT: 'muted',
  ARCHIVED: 'destructive',
};

const contentTypeColor: Record<string, string> = {
  VIDEO: 'text-blue-400',
  TEXT: 'text-muted-foreground',
  QUIZ: 'text-amber-400',
  ASSIGNMENT: 'text-primary',
  DOCUMENT: 'text-emerald-400',
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  // Inline editing state
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [descVal, setDescVal] = useState('');

  // Module expand/collapse state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Add Module modal
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  // Add Lesson modal
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [addLessonModuleId, setAddLessonModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('TEXT');

  /* ---- Queries & Mutations ---- */

  const { data: program, isLoading } = useQuery({
    queryKey: ['coaching', 'program', id],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/programs/${id}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as Program;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await api.patch<any>(`/api/coaching/programs/${id}`, body);
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', id] });
      setEditingName(false);
      setEditingDesc(false);
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async (body: { title: string; description?: string }) => {
      const res = await api.post<any>(`/api/coaching/programs/${id}/modules`, body);
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', id] });
      setShowAddModule(false);
      setNewModuleTitle('');
      setNewModuleDesc('');
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async (body: { moduleId: string; title: string; contentType: string }) => {
      const { contentType, ...rest } = body;
      const res = await api.post<any>(
        '/api/coaching/lessons',
        { ...rest, type: contentType },
      );
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', id] });
      setShowAddLesson(false);
      setAddLessonModuleId(null);
      setNewLessonTitle('');
      setNewLessonType('TEXT');
    },
  });

  /* ---- Helpers ---- */

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function openAddLesson(moduleId: string) {
    setAddLessonModuleId(moduleId);
    setNewLessonTitle('');
    setNewLessonType('TEXT');
    setShowAddLesson(true);
  }

  /* ---- Loading State ---- */

  if (isLoading || !program) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton variant="line" className="h-8 w-64" />
        <Skeleton variant="line" className="h-4 w-96" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat-card" />
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const totalLessons = program.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const sortedModules = [...program.modules].sort((a, b) => a.order - b.order);

  /* ---- Render ---- */

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title={program.name}
        subtitle={program.description || 'No description'}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'Programs', href: '/dashboard/coaching/programs' },
          { label: program.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[program.status] ?? 'muted'} className="capitalize">
              {program.status.toLowerCase()}
            </Badge>
            {program.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ status: 'PUBLISHED' })}
                disabled={updateMutation.isPending}
              >
                Publish
              </Button>
            )}
            {program.status === 'PUBLISHED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMutation.mutate({ status: 'DRAFT' })}
                disabled={updateMutation.isPending}
              >
                Unpublish
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                setNameVal(program.name);
                setDescVal(program.description ?? '');
                setEditingName(true);
                setEditingDesc(true);
              }}
            >
              Edit
            </Button>
          </div>
        }
      />

      {/* Inline Edit Panel */}
      {(editingName || editingDesc) && (
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/40">Program Name</label>
              <Input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder="Program name"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/40">Description</label>
              <Textarea
                value={descVal}
                onChange={(e) => setDescVal(e.target.value)}
                placeholder="Program description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                leftIcon={<Check className="h-3.5 w-3.5" />}
                onClick={() =>
                  updateMutation.mutate({ name: nameVal, description: descVal })
                }
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setEditingName(false);
                  setEditingDesc(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">Modules</p>
          <p className="mt-1 text-2xl tracking-tight font-semibold text-foreground">{program.modules.length}</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">Lessons</p>
          <p className="mt-1 text-2xl tracking-tight font-semibold text-foreground">{totalLessons}</p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">Enrollments</p>
          <p className="mt-1 text-2xl tracking-tight font-semibold text-foreground">
            {program._count?.enrollments ?? 0}
          </p>
        </div>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
          <p className="text-xs text-muted-foreground leading-relaxed">Price</p>
          <p className="mt-1 text-2xl tracking-tight font-semibold text-primary">
            {program.price ? `$${program.price}` : 'Free'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/coaching/programs/${id}/builder`}>
          <Button size="sm" variant="secondary" leftIcon={<Layers className="h-3.5 w-3.5" />}>
            Visual Builder
          </Button>
        </Link>
        <Link href={`/dashboard/coaching/enrollments?programId=${id}`}>
          <Button size="sm" variant="outline" leftIcon={<Users className="h-3.5 w-3.5" />}>
            View Enrollments
          </Button>
        </Link>
      </div>

      {/* Module / Lesson Tree */}
      <div className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <div className="flex flex-row items-center justify-between px-5 py-4">
          <h3 className="text-sm tracking-tight font-semibold text-foreground">Curriculum</h3>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowAddModule(true)}
          >
            Add Module
          </Button>
        </div>
        <div>
          {sortedModules.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-white/30">
              No modules yet. Click &quot;Add Module&quot; above to start building your curriculum.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {sortedModules.map((mod, modIdx) => {
                const isExpanded = expandedModules.has(mod.id);
                return (
                  <div key={mod.id}>
                    {/* Module Row */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center gap-3 bg-white/[0.02] px-6 py-3 text-left transition-all duration-200 hover:bg-white/[0.04]"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-white/20" />
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                      )}
                      <span className="text-xs font-semibold uppercase text-white/30">
                        Module {modIdx + 1}
                      </span>
                      <span className="text-sm font-medium text-white/80">{mod.title}</span>
                      <span className="ml-auto flex items-center gap-3">
                        <Badge variant="muted" className="text-[10px]">
                          {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                        </Badge>
                      </span>
                    </button>

                    {/* Expanded Lessons */}
                    {isExpanded && (
                      <div className="ml-10 border-l-2 border-primary/20">
                        {mod.lessons.length === 0 ? (
                          <p className="px-6 py-3 text-xs text-white/20">
                            No lessons in this module yet.
                          </p>
                        ) : (
                          mod.lessons
                            .sort((a, b) => a.order - b.order)
                            .map((lesson) => (
                              <Link
                                key={lesson.id}
                                href={`/dashboard/coaching/programs/${id}/lessons/${lesson.id}`}
                                className="flex items-center gap-3 px-6 py-2.5 transition-all duration-200 hover:bg-white/[0.04]"
                              >
                                <BookOpen
                                  className={`h-3.5 w-3.5 ${contentTypeColor[lesson.contentType] ?? 'text-white/30'}`}
                                />
                                <span className="text-sm text-white/60">{lesson.title}</span>
                                <span className="ml-auto text-xs capitalize text-white/20">
                                  {lesson.contentType.toLowerCase()}
                                </span>
                              </Link>
                            ))
                        )}

                        {/* Add Lesson button inside expanded module */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddLesson(mod.id);
                          }}
                          className="flex w-full items-center gap-2 px-6 py-2 text-xs text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                          Add Lesson
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      <Modal
        isOpen={showAddModule}
        onClose={() => setShowAddModule(false)}
        title="Add Module"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/40">Module Title</label>
            <Input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Getting Started"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/40">
              Description (optional)
            </label>
            <Textarea
              value={newModuleDesc}
              onChange={(e) => setNewModuleDesc(e.target.value)}
              placeholder="Brief description of this module"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAddModule(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                addModuleMutation.mutate({
                  title: newModuleTitle,
                  description: newModuleDesc || undefined,
                })
              }
              disabled={!newModuleTitle.trim() || addModuleMutation.isPending}
            >
              {addModuleMutation.isPending ? 'Adding...' : 'Add Module'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={showAddLesson}
        onClose={() => setShowAddLesson(false)}
        title="Add Lesson"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/40">Lesson Title</label>
            <Input
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="e.g. Introduction to Credit Repair"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/40">Content Type</label>
            <select
              value={newLessonType}
              onChange={(e) => setNewLessonType(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/70 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
            >
              <option value="TEXT">Text</option>
              <option value="VIDEO">Video</option>
              <option value="QUIZ">Quiz</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="DOCUMENT">Document</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAddLesson(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!addLessonModuleId) return;
                addLessonMutation.mutate({
                  moduleId: addLessonModuleId,
                  title: newLessonTitle,
                  contentType: newLessonType,
                });
              }}
              disabled={!newLessonTitle.trim() || addLessonMutation.isPending}
            >
              {addLessonMutation.isPending ? 'Adding...' : 'Add Lesson'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
