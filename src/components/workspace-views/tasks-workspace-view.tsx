'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckSquare,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  Badge,
  Skeleton,
  type BadgeVariant,
} from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt?: string | null;
  userId?: string | null;
  contactId?: string | null;
  createdAt: string;
  contact?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

interface AiTask {
  id: string;
  inputText: string;
  responseText: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TasksWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Maps                                                               */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'error',
};

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(d?: string | null): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function contactName(contact: Task['contact']): string {
  if (!contact) return '\u2014';
  return (
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email ||
    '\u2014'
  );
}

function aiStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
    case 'FAILED': return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    default: return <Clock className="h-3.5 w-3.5 text-amber-400" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TasksWorkspaceView({ compact = false }: TasksWorkspaceViewProps) {
  const api = useApi();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks-workspace', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', perPage: compact ? '10' : '25' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ success: boolean; data: Task[] }>(`/api/tasks?${params}`);
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (raw && 'data' in raw && Array.isArray(raw.data)) return raw.data;
      return [];
    },
  });

  const { data: aiTasks } = useQuery({
    queryKey: ['ai-tasks-workspace'],
    queryFn: async () => {
      const res = await api.get<{ data: AiTask[]; meta: any }>('/api/ai/tasks?perPage=10');
      if (res.data && 'data' in res.data) return res.data.data;
      if (Array.isArray(res.data)) return res.data;
      return [];
    },
    refetchInterval: 15000,
  });

  const tasks: Task[] = data ?? [];
  const aiItems: AiTask[] = Array.isArray(aiTasks) ? aiTasks : [];

  // Summary counts
  const pending = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const urgent = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[hsl(var(--muted))] border border-white/[0.04]" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="line" width="100%" height={48} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.04] bg-[hsl(var(--muted))] p-3 text-center">
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">{pending}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Pending</p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-[hsl(var(--muted))] p-3 text-center">
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">{inProgress}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">In Progress</p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-[hsl(var(--muted))] p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{done}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Done</p>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-[hsl(var(--muted))] p-3 text-center">
          <p className="text-lg font-bold text-red-400">{urgent}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Urgent</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['', 'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
              statusFilter === s
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[hsl(var(--muted))] border-white/[0.04] text-[hsl(var(--muted-foreground))] hover:bg-white/[0.04]'
            }`}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="rounded-2xl border border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
            <CheckSquare className="h-7 w-7 mb-2 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors duration-150">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={STATUS_VARIANT[task.status] ?? 'default'} className="capitalize">
                      {task.status.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'default'} className="capitalize">
                      {task.priority.toLowerCase()}
                    </Badge>
                    {task.contact && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{contactName(task.contact)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(task.dueAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Tasks */}
      {aiItems.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-3">
            <Sparkles className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">AI-Dispatched Tasks</h3>
            <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{aiItems.length} recent</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {aiItems.slice(0, compact ? 5 : 10).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors">
                {aiStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[hsl(var(--foreground))] truncate">{task.inputText}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {task.completedAt && ' completed'}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : task.status === 'FAILED'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
