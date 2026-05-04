'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApi } from '../../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../components/ui/card';
import { Button } from '../../../../../../../components/ui/button';

interface Lesson {
  id: string;
  title: string;
  contentType: string;
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
  modules: Module[];
}

const LESSON_TYPES = [
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'TEXT', label: 'Text', icon: FileText },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: ClipboardList },
  { value: 'DOCUMENT', label: 'Document', icon: BookOpen },
];

const contentTypeIcon: Record<string, typeof Video> = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  DOCUMENT: BookOpen,
};

export default function ProgramBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('TEXT');

  const { data: program, isLoading } = useQuery<Program>({
    queryKey: ['coaching', 'program', id],
    queryFn: async () => {
      const res = await api.get<any>(`/api/coaching/programs/${id}`);
      if (res.error) throw new Error(res.error);
      return (res.data?.data ?? res.data) as Program;
    },
    onSuccess: (data: Program) => {
      if (expandedModules.size === 0 && data.modules.length > 0) {
        setExpandedModules(new Set(data.modules.map((m) => m.id)));
      }
    },
  } as any);

  const addModuleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>(`/api/coaching/programs/${id}/modules`, { title: newModuleTitle });
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: (mod: any) => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', id] });
      setNewModuleTitle('');
      setAddingModule(false);
      setExpandedModules((prev) => new Set([...prev, mod.id]));
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ moduleId }: { moduleId: string }) => {
      const res = await api.post<any>('/api/coaching/lessons', {
        moduleId,
        title: newLessonTitle,
        type: newLessonType,
      });
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'program', id] });
      setNewLessonTitle('');
      setNewLessonType('TEXT');
      setAddingLessonTo(null);
    },
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (isLoading || !program) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/coaching/programs/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl tracking-tight font-semibold text-foreground">Program Builder</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{program.name}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddingModule(true)}>
          <Plus className="h-4 w-4" /> Add Module
        </Button>
      </div>

      {/* Add Module Form */}
      {addingModule && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Module title..."
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/20 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && newModuleTitle.trim() && addModuleMutation.mutate()}
              />
              <Button
                size="sm"
                onClick={() => addModuleMutation.mutate()}
                disabled={!newModuleTitle.trim() || addModuleMutation.isPending}
              >
                {addModuleMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingModule(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modules */}
      {program.modules.length === 0 && !addingModule ? (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <div className="py-12 text-center">
            <p className="text-sm text-white/30">
              No modules yet. Click "Add Module" to start building your curriculum.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {program.modules.map((mod, modIdx) => {
            const isExpanded = expandedModules.has(mod.id);
            const LessonIcon = contentTypeIcon;
            return (
              <div key={mod.id} className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-white/[0.04]"
                  onClick={() => toggleModule(mod.id)}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-white/20" />
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  )}
                  <span className="text-xs font-semibold uppercase text-white/30">
                    Module {modIdx + 1}
                  </span>
                  <span className="text-sm font-medium text-white/80">{mod.title}</span>
                  <span className="ml-auto text-xs text-white/30">{mod.lessons.length} lessons</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingLessonTo(addingLessonTo === mod.id ? null : mod.id);
                      if (!expandedModules.has(mod.id)) toggleModule(mod.id);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {isExpanded && (
                  <div>
                    {mod.lessons.length > 0 && (
                      <div className="divide-y divide-white/[0.03]">
                        {mod.lessons.map((lesson) => {
                          const Icon = contentTypeIcon[lesson.contentType] ?? BookOpen;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/dashboard/coaching/programs/${id}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 px-4 py-2.5 pl-16 transition-all duration-200 hover:bg-white/[0.04]"
                            >
                              <Icon className="h-3.5 w-3.5 text-white/30" />
                              <span className="text-sm text-white/60">{lesson.title}</span>
                              <span className="ml-auto text-xs capitalize text-white/20">
                                {lesson.contentType.toLowerCase()}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Add lesson form */}
                    {addingLessonTo === mod.id && (
                      <div className="border-t border-white/[0.04] px-4 py-3 pl-16">
                        <div className="flex items-center gap-3">
                          <input
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder="Lesson title..."
                            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder:text-white/20 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) =>
                              e.key === 'Enter' &&
                              newLessonTitle.trim() &&
                              addLessonMutation.mutate({ moduleId: mod.id })
                            }
                          />
                          <select
                            value={newLessonType}
                            onChange={(e) => setNewLessonType(e.target.value)}
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/60 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
                          >
                            {LESSON_TYPES.map((lt) => (
                              <option key={lt.value} value={lt.value}>
                                {lt.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => addLessonMutation.mutate({ moduleId: mod.id })}
                            disabled={!newLessonTitle.trim() || addLessonMutation.isPending}
                          >
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingLessonTo(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
