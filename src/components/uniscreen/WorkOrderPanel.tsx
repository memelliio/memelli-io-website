"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  RotateCcw,
  XCircle,
  XOctagon,
  Layers,
  Target,
  Server,
  Calendar,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

interface SubTaskData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedPool: string;
  layer: string;
  retryCount: number;
  maxRetries: number;
  output?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface WorkOrderData {
  id: string;
  goalSummary: string;
  taskType: string;
  status: string;
  priority: string;
  assignedPool?: string;
  requestSource: string;
  subTaskCount: number;
  completedCount: number;
  failedCount: number;
  resultSummary?: string;
  resultData?: any;
  errorSummary?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  subTasks: SubTaskData[];
}

interface WorkOrderPanelProps {
  workOrderId: string;
  initialData?: WorkOrderData;
}

// ─── Status Helpers ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  IN_PROGRESS: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  DISPATCHED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  dispatched: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  QUEUED: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  queued: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  FAILED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  ESCALATED: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  escalated: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  CANCELLED: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  cancelled: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" }
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  normal: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
};

const ACTIVE_STATUSES = new Set([
  "DISPATCHED",
  "IN_PROGRESS",
  "QUEUED",
  "dispatched",
  "in_progress",
  "queued",
  "PENDING",
  "pending",
]);

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" };
}

function getPriorityClass(priority: string) {
  return PRIORITY_COLORS[priority?.toLowerCase()] ?? PRIORITY_COLORS.normal;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return "--";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.max(0, e - s);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remSecs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

// ─── Status Badge ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Sub-Task Row ───────────────────────────────────────────────────────

function SubTaskRow({
  subTask,
  onRetry
}: {
  subTask: SubTaskData;
  onRetry: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusLower = subTask.status.toLowerCase();
  const isCompleted = statusLower === "completed";
  const isFailed = statusLower === "failed";
  const isActive = statusLower === "in_progress" || statusLower === "dispatched";
  const hasExpandableContent = subTask.output || subTask.error || subTask.description;

  return (
    <div className="group relative">
      {/* Connector line */}
      <div className="absolute left-[15px] top-0 h-full w-px bg-zinc-800 group-last:h-6" />

      <div className="relative flex items-start gap-3 pl-2">
        {/* Status icon */}
        <div className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {isFailed && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          {isActive && (
            <LoadingGlobe size="sm" />
          )}
          {!isCompleted && !isFailed && !isActive && (
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pb-4">
          <button
            type="button"
            onClick={() => hasExpandableContent && setExpanded(!expanded)}
            className="flex w-full items-center gap-2 text-left"
            disabled={!hasExpandableContent}
          >
            {hasExpandableContent && (
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              )
            )}
            <span className={`text-sm font-medium ${isCompleted ? "text-zinc-400" : isFailed ? "text-red-300" : "text-zinc-200"}`}>
              {subTask.title}
            </span>
          </button>

          {/* Meta row */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={subTask.status} />
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[11px] text-zinc-500">
              <Layers className="h-3 w-3" />
              {subTask.layer}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[11px] text-zinc-500">
              <Server className="h-3 w-3" />
              {subTask.assignedPool}
            </span>
            {subTask.retryCount > 0 && (
              <span className="text-[11px] text-amber-400/70">
                retry {subTask.retryCount}/{subTask.maxRetries}
              </span>
            )}
            {subTask.completedAt && (
              <span className="text-[11px] text-zinc-600">
                {formatDuration(subTask.startedAt, subTask.completedAt)}
              </span>
            )}
          </div>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              {subTask.description && (
                <p className="text-xs text-zinc-400">{subTask.description}</p>
              )}
              {subTask.output && (
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">Output</span>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-zinc-950 p-2 text-xs text-zinc-300">
                    {typeof subTask.output === "string"
                      ? subTask.output
                      : JSON.stringify(subTask.output, null, 2)}
                  </pre>
                </div>
              )}
              {subTask.error && (
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-red-500">Error</span>
                  <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-red-950/30 p-2 text-xs text-red-300">
                    {subTask.error}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Retry button for failed */}
          {isFailed && subTask.retryCount < subTask.maxRetries && (
            <button
              type="button"
              onClick={() => onRetry(subTask.id)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/20"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function WorkOrderPanel({ workOrderId, initialData }: WorkOrderPanelProps) {
  const [data, setData] = useState<WorkOrderData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orchestration/${workOrderId}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch work order");
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchOrder();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchOrder]);

  // Set up / tear down polling based on status
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (data && ACTIVE_STATUSES.has(data.status)) {
      pollRef.current = setInterval(fetchOrder, 5000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.status, fetchOrder]);

  // ── Actions ──────────────────────────────────────────────────────────

  const performAction = async (action: string) => {
    setActionLoading(action);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${workOrderId}/${action}`, {
        method: "POST",
        credentials: "include"
      });
      await fetchOrder();
    } catch (err: any) {
      console.error(`Action "${action}" failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const retrySubTask = async (subTaskId: string) => {
    setActionLoading(`retry-${subTaskId}`);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${workOrderId}/subtasks/${subTaskId}/retry`, {
        method: "POST",
        credentials: "include"
      });
      await fetchOrder();
    } catch (err: any) {
      console.error(`Retry sub-task failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingGlobe size="md" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={fetchOrder}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isActive = ACTIVE_STATUSES.has(data.status);
  const hasFailed = data.failedCount > 0;
  const progressPct = data.subTaskCount > 0
    ? Math.round((data.completedCount / data.subTaskCount) * 100)
    : 0;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Header Card ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-100 leading-snug">
            {data.goalSummary}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={data.status} />
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityClass(data.priority)}`}>
              <Zap className="h-3 w-3" />
              {data.priority}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
              <Target className="h-3 w-3" />
              {data.taskType.replace(/_/g, " ")}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-zinc-500">
            {data.assignedPool && (
              <div className="flex items-center gap-1.5">
                <Server className="h-3 w-3" />
                <span className="text-zinc-400">{data.assignedPool}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{formatTimestamp(data.createdAt)}</span>
            </div>
            {data.completedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span className="text-emerald-400/80">
                  Completed in {formatDuration(data.startedAt ?? data.createdAt, data.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress Bar ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Progress</span>
            <span className="text-xs text-zinc-500">
              {data.completedCount} / {data.subTaskCount} sub-tasks
              {hasFailed && (
                <span className="ml-2 text-red-400">({data.failedCount} failed)</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-zinc-600">{progressPct}%</div>
        </div>

        {/* ── Sub-Tasks ────────────────────────────────────────────── */}
        {data.subTasks.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">
              Sub-Tasks ({data.subTasks.length})
            </h3>
            <div className="space-y-0">
              {data.subTasks.map((st) => (
                <SubTaskRow key={st.id} subTask={st} onRetry={retrySubTask} />
              ))}
            </div>
          </div>
        )}

        {/* ── Result Section ───────────────────────────────────────── */}
        {data.status.toLowerCase() === "completed" && data.resultSummary && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Check className="h-4 w-4" />
              Result
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {data.resultSummary}
            </p>
            {data.resultData && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-400">
                {typeof data.resultData === "string"
                  ? data.resultData
                  : JSON.stringify(data.resultData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* ── Error Section ────────────────────────────────────────── */}
        {data.status.toLowerCase() === "failed" && data.errorSummary && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
              <XCircle className="h-4 w-4" />
              Error
            </h3>
            <p className="text-sm text-red-300 leading-relaxed">
              {data.errorSummary}
            </p>
          </div>
        )}
      </div>

      {/* ── Action Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900/80 px-4 py-3 backdrop-blur-sm">
        {isActive && (
          <button
            type="button"
            disabled={actionLoading === "cancel"}
            onClick={() => performAction("cancel")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            {actionLoading === "cancel" ? (
              <LoadingGlobe size="sm" />
            ) : (
              <XOctagon className="h-3.5 w-3.5" />
            )}
            Cancel
          </button>
        )}

        {hasFailed && (
          <button
            type="button"
            disabled={actionLoading === "retry"}
            onClick={() => performAction("retry")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 disabled:opacity-50"
          >
            {actionLoading === "retry" ? (
              <LoadingGlobe size="sm" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Retry Failed
          </button>
        )}

        {isActive && (
          <button
            type="button"
            disabled={actionLoading === "escalate"}
            onClick={() => performAction("escalate")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
          >
            {actionLoading === "escalate" ? (
              <LoadingGlobe size="sm" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            Escalate
          </button>
        )}

        {/* Refresh indicator */}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-zinc-600">
          {isActive && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              Live
            </>
          )}
          <button
            type="button"
            onClick={fetchOrder}
            className="ml-1 rounded p-1 text-zinc-600 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-400"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
