'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Loader2,
  CheckSquare,
  ChevronDown,
  Zap,
  Play,
  Trash2,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  assignee?: { name: string };
}

type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';
type TriggerType = 'cron' | 'webhook' | 'manual' | 'event';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowExecution {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: string;
  completedAt?: string;
}

type TabId = 'tasks' | 'workflows';
type TaskFilterStatus = 'ALL' | TaskStatus;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function extractArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if ('data' in r && Array.isArray(r.data)) return r.data as T[];
    if ('data' in r && r.data && typeof r.data === 'object') {
      const inner = r.data as Record<string, unknown>;
      if ('data' in inner && Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function fmtRelative(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Design tokens                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#fbbf24',
  LOW: '#6b7280',
};

const STATUS_STYLE: Record<TaskStatus, { color: string; label: string }> = {
  DONE: { color: '#22c55e', label: 'Done' },
  IN_PROGRESS: { color: '#38bdf8', label: 'In Progress' },
  BLOCKED: { color: '#ef4444', label: 'Blocked' },
  PENDING: { color: '#71717a', label: 'Pending' },
};

const WORKFLOW_STATUS_STYLE: Record<WorkflowStatus, { color: string; label: string; pulse: boolean }> = {
  ACTIVE: { color: '#22c55e', label: 'Active', pulse: true },
  PAUSED: { color: '#fbbf24', label: 'Paused', pulse: false },
  DRAFT: { color: '#71717a', label: 'Draft', pulse: false },
};

const EXECUTION_STATUS_STYLE: Record<WorkflowExecution['status'], { color: string; label: string }> = {
  RUNNING: { color: '#38bdf8', label: 'Running' },
  SUCCESS: { color: '#22c55e', label: 'Success' },
  FAILED: { color: '#ef4444', label: 'Failed' },
};

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const color = PRIORITY_COLOR[priority];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}
    >
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const { color, label } = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0"
      style={{ color, background: `${color}15`, border: `1px solid ${color}2e` }}
    >
      {label}
    </span>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.04]">
      <div className="w-4 h-4 rounded bg-white/[0.05] animate-pulse shrink-0" />
      <div className="h-3 rounded bg-white/[0.05] flex-1 animate-pulse" />
      <div className="h-4 w-14 rounded bg-white/[0.04] animate-pulse" />
      <div className="h-4 w-16 rounded bg-white/[0.04] animate-pulse" />
      <div className="h-3 w-10 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function WorkflowRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-3 border-b border-white/[0.04]">
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3 rounded bg-white/[0.05] animate-pulse w-3/4" />
        <div className="h-2.5 rounded bg-white/[0.04] animate-pulse w-1/3" />
      </div>
      <div className="h-3 w-14 rounded bg-white/[0.05] animate-pulse" />
      <div className="h-3 w-10 rounded bg-white/[0.05] animate-pulse" />
      <div className="h-6 w-6 rounded bg-white/[0.05] animate-pulse" />
      <div className="h-6 w-6 rounded bg-white/[0.05] animate-pulse" />
      <div className="h-6 w-6 rounded bg-white/[0.05] animate-pulse" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tasks Tab                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TasksTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const api = useApi();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilterStatus>('ALL');

  /* Quick-add state */
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Patching in-flight ids */
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = filter !== 'ALL' ? `?status=${filter}&limit=20` : '?limit=20';
    const res = await api.get<Task[]>(`/api/tasks${params}`);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const arr = extractArray<Task>(res.data);
    setTasks(arr);
    const pending = arr.filter((t) => t.status === 'PENDING').length;
    onCountChange(pending);
  }, [api, filter, onCountChange]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const title = newTitle.trim();
      if (!title) return;
      setAddError(null);
      setAddLoading(true);
      const res = await api.post<Task>('/api/tasks', { title, priority: newPriority });
      setAddLoading(false);
      if (res.error) {
        setAddError(res.error);
        return;
      }
      setNewTitle('');
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
      fetchTasks();
      inputRef.current?.focus();
    },
    [api, newTitle, newPriority, fetchTasks]
  );

  const handleMarkDone = useCallback(
    async (task: Task) => {
      if (task.status === 'DONE' || patchingId === task.id) return;
      setPatchingId(task.id);
      /* Optimistic update */
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'DONE' as TaskStatus } : t))
      );
      const res = await api.patch(`/api/tasks/${task.id}`, { status: 'DONE' });
      setPatchingId(null);
      if (res.error) {
        /* Rollback */
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
        );
      } else {
        /* Remove from filtered view after short delay so user sees the green check */
        if (filter !== 'ALL' && filter !== 'DONE') {
          setTimeout(() => {
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
          }, 600);
        }
      }
    },
    [api, filter, patchingId]
  );

  const FILTERS: { label: string; value: TaskFilterStatus }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Done', value: 'DONE' },
    { label: 'Blocked', value: 'BLOCKED' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Quick add */}
      <div className="rounded-xl p-3" style={CARD_STYLE}>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); setAddError(null); }}
            placeholder="New task title..."
            className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
            style={INPUT_STYLE}
          />
          <div className="relative shrink-0">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="appearance-none rounded-lg pl-2.5 pr-6 py-1.5 text-xs font-medium outline-none cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: PRIORITY_COLOR[newPriority],
              }}
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <ChevronDown
              size={10}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={addLoading || !newTitle.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black transition-all disabled:opacity-50 shrink-0"
            style={{ background: '#fbbf24' }}
          >
            {addLoading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            Add
          </button>
        </form>
        {addError && <p className="text-[10px] text-red-400 font-mono mt-1.5">{addError}</p>}
        {addSuccess && <p className="text-[10px] text-emerald-400 font-mono mt-1.5">Task added.</p>}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={
              filter === value
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#71717a', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
        <div className="px-3 pb-1 pt-3">
          {loading ? (
            <div className="pb-2">
              {Array.from({ length: 5 }).map((_, i) => <TaskRowSkeleton key={i} />)}
            </div>
          ) : error ? (
            <p className="text-[11px] text-red-400 font-mono py-6 text-center">{error}</p>
          ) : tasks.length === 0 ? (
            <p className="text-[11px] text-zinc-600 py-6 text-center font-mono">No tasks found.</p>
          ) : (
            <div className="pb-1">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isPending={patchingId === task.id}
                  onDone={() => handleMarkDone(task)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  isPending,
  onDone,
}: {
  task: Task;
  isPending: boolean;
  onDone: () => void;
}) {
  const isDone = task.status === 'DONE';
  const overdue = !isDone && isOverdue(task.dueDate);
  const dueFmt = fmtDate(task.dueDate);

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors rounded group">
      {/* Checkbox */}
      <button
        onClick={onDone}
        disabled={isPending || isDone}
        className="shrink-0 flex items-center justify-center transition-opacity disabled:opacity-60"
        aria-label="Mark as done"
      >
        {isPending ? (
          <Loader2 size={15} className="animate-spin text-zinc-500" />
        ) : isDone ? (
          <CheckSquare size={15} style={{ color: '#22c55e' }} />
        ) : (
          <div className="w-4 h-4 rounded border border-zinc-700 group-hover:border-zinc-500 transition-colors" />
        )}
      </button>

      {/* Title */}
      <span
        className={`flex-1 min-w-0 text-[12px] truncate transition-colors ${
          isDone ? 'line-through text-zinc-600' : 'text-zinc-200'
        }`}
      >
        {task.title}
      </span>

      {/* Priority */}
      <PriorityBadge priority={task.priority} />

      {/* Status */}
      <StatusBadge status={task.status} />

      {/* Due date */}
      {dueFmt && (
        <span
          className={`text-[10px] font-mono shrink-0 ${overdue ? 'text-red-400' : 'text-zinc-600'}`}
        >
          {dueFmt}
        </span>
      )}

      {/* Assignee */}
      {task.assignee?.name && (
        <span className="text-[10px] text-zinc-500 truncate max-w-[5rem] shrink-0 hidden sm:block">
          {task.assignee.name}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Workflows Tab                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WorkflowsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const api = useApi();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Per-workflow expanded executions */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Record<string, WorkflowExecution[]>>({});
  const [executionsLoading, setExecutionsLoading] = useState<Record<string, boolean>>({});

  /* In-flight action IDs */
  const [triggering, setTriggering] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  /* New workflow form */
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState<TriggerType>('manual');
  const [formStatus, setFormStatus] = useState<WorkflowStatus>('DRAFT');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<Workflow[]>('/api/workflows');
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const arr = extractArray<Workflow>(res.data);
    setWorkflows(arr);
    onCountChange(arr.filter((w) => w.status === 'ACTIVE').length);
  }, [api, onCountChange]);

  useEffect(() => {
    fetchWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExecutions = useCallback(
    async (id: string) => {
      if (executions[id]) return;
      setExecutionsLoading((prev) => ({ ...prev, [id]: true }));
      const res = await api.get<WorkflowExecution[]>(`/api/workflows/${id}/executions`);
      setExecutionsLoading((prev) => ({ ...prev, [id]: false }));
      if (!res.error) {
        setExecutions((prev) => ({ ...prev, [id]: extractArray<WorkflowExecution>(res.data) }));
      }
    },
    [api, executions]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      if (expandedId === id) {
        setExpandedId(null);
      } else {
        setExpandedId(id);
        loadExecutions(id);
      }
    },
    [expandedId, loadExecutions]
  );

  const handleTrigger = useCallback(
    async (id: string) => {
      if (triggering) return;
      setTriggering(id);
      await api.post(`/api/workflows/${id}/trigger`, {});
      setTriggering(null);
      /* Reload executions for this workflow */
      setExecutions((prev) => { const n = { ...prev }; delete n[id]; return n; });
      if (expandedId === id) loadExecutions(id);
    },
    [api, triggering, expandedId, loadExecutions]
  );

  const handleToggleStatus = useCallback(
    async (wf: Workflow) => {
      if (patching) return;
      const nextStatus: WorkflowStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      setPatching(wf.id);
      /* Optimistic */
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: nextStatus } : w))
      );
      const res = await api.patch(`/api/workflows/${wf.id}`, { status: nextStatus });
      setPatching(null);
      if (res.error) {
        /* Rollback */
        setWorkflows((prev) =>
          prev.map((w) => (w.id === wf.id ? { ...w, status: wf.status } : w))
        );
      }
    },
    [api, patching]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (deleting) return;
      setDeleting(id);
      const res = await api.del(`/api/workflows/${id}`);
      setDeleting(null);
      if (!res.error) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    },
    [api, deleting, expandedId]
  );

  const handleCreateWorkflow = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim()) return;
      setFormError(null);
      setFormLoading(true);
      const res = await api.post<Workflow>('/api/workflows', {
        name: formName.trim(),
        trigger: formTrigger,
        status: formStatus,
      });
      setFormLoading(false);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      setFormName('');
      setFormTrigger('manual');
      setFormStatus('DRAFT');
      setShowForm(false);
      fetchWorkflows();
    },
    [api, formName, formTrigger, formStatus, fetchWorkflows]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Workflow list */}
      <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <h3 className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Workflows</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-black transition-all"
            style={{ background: '#38bdf8' }}
          >
            {showForm ? <X size={10} /> : <Plus size={10} />}
            {showForm ? 'Cancel' : 'New'}
          </button>
        </div>

        {/* New workflow form */}
        {showForm && (
          <div
            className="mx-3 mb-3 rounded-lg p-3"
            style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}
          >
            <form onSubmit={handleCreateWorkflow} className="flex flex-col gap-2">
              <input
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setFormError(null); }}
                placeholder="Workflow name..."
                className="w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-sky-500/50 transition-all"
                style={INPUT_STYLE}
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value as TriggerType)}
                    className="appearance-none w-full rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <option value="cron">Cron</option>
                    <option value="webhook">Webhook</option>
                    <option value="manual">Manual</option>
                    <option value="event">Event</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
                </div>
                <div className="relative flex-1">
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WorkflowStatus)}
                    className="appearance-none w-full rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
                </div>
                <button
                  type="submit"
                  disabled={formLoading || !formName.trim()}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black transition-all disabled:opacity-50 shrink-0 flex items-center gap-1"
                  style={{ background: '#38bdf8' }}
                >
                  {formLoading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Create
                </button>
              </div>
              {formError && <p className="text-[10px] text-red-400 font-mono">{formError}</p>}
            </form>
          </div>
        )}

        <div className="px-3 pb-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <WorkflowRowSkeleton key={i} />)
          ) : error ? (
            <p className="text-[11px] text-red-400 font-mono py-6 text-center">{error}</p>
          ) : workflows.length === 0 ? (
            <p className="text-[11px] text-zinc-600 py-6 text-center font-mono">
              No workflows found.
            </p>
          ) : (
            workflows.map((wf) => (
              <WorkflowRow
                key={wf.id}
                workflow={wf}
                isExpanded={expandedId === wf.id}
                executions={executions[wf.id] ?? null}
                executionsLoading={!!executionsLoading[wf.id]}
                isTriggering={triggering === wf.id}
                isPatching={patching === wf.id}
                isDeleting={deleting === wf.id}
                onExpand={() => handleToggleExpand(wf.id)}
                onTrigger={() => handleTrigger(wf.id)}
                onToggleStatus={() => handleToggleStatus(wf)}
                onDelete={() => handleDelete(wf.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const normalized = trigger.toLowerCase();
  const color =
    normalized === 'cron'
      ? '#a78bfa'
      : normalized === 'webhook'
      ? '#34d399'
      : normalized === 'event'
      ? '#f472b6'
      : '#71717a';
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0"
      style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}
    >
      <Zap size={8} />
      {trigger}
    </span>
  );
}

function WorkflowRow({
  workflow,
  isExpanded,
  executions,
  executionsLoading,
  isTriggering,
  isPatching,
  isDeleting,
  onExpand,
  onTrigger,
  onToggleStatus,
  onDelete,
}: {
  workflow: Workflow;
  isExpanded: boolean;
  executions: WorkflowExecution[] | null;
  executionsLoading: boolean;
  isTriggering: boolean;
  isPatching: boolean;
  isDeleting: boolean;
  onExpand: () => void;
  onTrigger: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const { color, label, pulse } = WORKFLOW_STATUS_STYLE[workflow.status];

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2.5 py-3 hover:bg-white/[0.015] transition-colors rounded group">
        {/* Expand chevron */}
        <button
          onClick={onExpand}
          className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
          aria-label="Toggle execution history"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Status dot + name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`}
              style={{ background: color }}
            />
            <p className="text-[12px] text-zinc-200 truncate leading-none">{workflow.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <TriggerBadge trigger={workflow.trigger} />
            <span className="text-[10px] text-zinc-600 font-mono">{fmtRelative(workflow.updatedAt)}</span>
          </div>
        </div>

        {/* Status label */}
        <span className="text-[10px] font-mono shrink-0" style={{ color }}>
          {label}
        </span>

        {/* Run now */}
        <button
          onClick={onTrigger}
          disabled={isTriggering}
          title="Run now"
          className="shrink-0 p-1 rounded transition-colors hover:bg-white/[0.06] text-zinc-500 hover:text-sky-400 disabled:opacity-50"
        >
          {isTriggering ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        </button>

        {/* Enable / Pause toggle */}
        <button
          onClick={onToggleStatus}
          disabled={isPatching}
          title={workflow.status === 'ACTIVE' ? 'Pause workflow' : 'Activate workflow'}
          className="shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold transition-all disabled:opacity-50"
          style={
            workflow.status === 'ACTIVE'
              ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }
              : { background: 'rgba(113,113,122,0.12)', color: '#71717a', border: '1px solid rgba(113,113,122,0.2)' }
          }
        >
          {isPatching ? <Loader2 size={10} className="animate-spin" /> : workflow.status === 'ACTIVE' ? 'Pause' : 'Activate'}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete workflow"
          className="shrink-0 p-1 rounded transition-colors hover:bg-white/[0.06] text-zinc-700 hover:text-red-400 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>

      {/* Execution history */}
      {isExpanded && (
        <div
          className="mx-2 mb-2 rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider px-3 py-1.5 border-b border-white/[0.04]">
            Execution History
          </p>
          {executionsLoading ? (
            <div className="flex items-center gap-2 px-3 py-3">
              <Loader2 size={12} className="animate-spin text-zinc-600" />
              <span className="text-[11px] text-zinc-600">Loading...</span>
            </div>
          ) : !executions || executions.length === 0 ? (
            <p className="text-[11px] text-zinc-600 px-3 py-3 font-mono">No executions yet.</p>
          ) : (
            executions.slice(0, 8).map((ex) => {
              const { color: exColor, label: exLabel } = EXECUTION_STATUS_STYLE[ex.status];
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 border-b border-white/[0.03] last:border-0"
                >
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0"
                    style={{ color: exColor, background: `${exColor}15`, border: `1px solid ${exColor}2e` }}
                  >
                    {exLabel}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono flex-1 truncate">
                    {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
                  </span>
                  {ex.completedAt && ex.startedAt && (
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                      {Math.round((new Date(ex.completedAt).getTime() - new Date(ex.startedAt).getTime()) / 1000)}s
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Export                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function TasksPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [taskCount, setTaskCount] = useState<number>(0);
  const [workflowCount, setWorkflowCount] = useState<number>(0);

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-zinc-100 text-base font-semibold tracking-tight">Tasks & Workflows</h2>

        {/* Pill tab switcher */}
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Tasks pill */}
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all"
            style={
              activeTab === 'tasks'
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }
                : { color: '#71717a', border: '1px solid transparent' }
            }
          >
            Tasks
            {taskCount > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{ background: activeTab === 'tasks' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)', color: activeTab === 'tasks' ? '#fbbf24' : '#71717a' }}
              >
                {taskCount > 99 ? '99+' : taskCount}
              </span>
            )}
          </button>

          {/* Workflows pill */}
          <button
            onClick={() => setActiveTab('workflows')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all"
            style={
              activeTab === 'workflows'
                ? { background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }
                : { color: '#71717a', border: '1px solid transparent' }
            }
          >
            Workflows
            {workflowCount > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{ background: activeTab === 'workflows' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)', color: activeTab === 'workflows' ? '#38bdf8' : '#71717a' }}
              >
                {workflowCount > 99 ? '99+' : workflowCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content — both rendered to preserve state, hidden via display */}
      <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
        <TasksTab onCountChange={setTaskCount} />
      </div>
      <div style={{ display: activeTab === 'workflows' ? 'block' : 'none' }}>
        <WorkflowsTab onCountChange={setWorkflowCount} />
      </div>
    </div>
  );
}
