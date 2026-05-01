"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Target,
  XCircle,
  XOctagon,
  Zap
} from "lucide-react";
import { useWorkspaceTabStore } from "@/stores/workspace-store";
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
  output?: unknown;
  error?: string;
  dependsOn?: string[];
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
  assignedPools?: string[];
  requestSource: string;
  subTaskCount: number;
  completedCount: number;
  failedCount: number;
  retryCount?: number;
  escalated?: boolean;
  resultSummary?: string;
  resultData?: unknown;
  errorSummary?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  subTasks?: SubTaskData[];
}

interface StatsData {
  totalActive: number;
  completedToday: number;
  failedCount: number;
  avgCompletionTime: string;
  utilization: number;
}

type TabView = "active" | "failures" | "completed" | "all";

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
  WAITING_DEPENDENCY: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  waiting_dependency: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  FAILED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  ESCALATED: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  escalated: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  CANCELLED: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  cancelled: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  DRAFT: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" }
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  normal: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20"
};

const ACTIVE_STATUSES = new Set([
  "DISPATCHED", "IN_PROGRESS", "QUEUED", "WAITING_DEPENDENCY", "PENDING",
  "dispatched", "in_progress", "queued", "waiting_dependency", "pending",
]);

const FAILURE_STATUSES = new Set([
  "FAILED", "ESCALATED", "failed", "escalated",
]);

const COMPLETED_STATUSES = new Set([
  "COMPLETED", "completed",
]);

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" };
}

function getPriorityClass(priority: string) {
  return PRIORITY_BADGE[priority?.toLowerCase()] ?? PRIORITY_BADGE.normal;
}

function getStatusIcon(status: string) {
  const lower = status.toLowerCase();
  if (lower === "completed") return <Check className="h-3.5 w-3.5 text-emerald-400" />;
  if (lower === "failed") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (lower === "escalated") return <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />;
  if (lower === "in_progress" || lower === "dispatched") return <LoadingGlobe size="sm" />;
  if (lower === "waiting_dependency") return <Clock className="h-3.5 w-3.5 text-amber-400" />;
  return <Clock className="h-3.5 w-3.5 text-zinc-500" />;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

// ─── Tab Configuration ──────────────────────────────────────────────────

const TABS: { id: TabView; label: string; icon: React.ReactNode }[] = [
  { id: "active", label: "Active", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "failures", label: "Failures", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { id: "completed", label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { id: "all", label: "All", icon: <Layers className="h-3.5 w-3.5" /> },
];

// ─── StatusBadge ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── PriorityBadge ──────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getPriorityClass(priority)}`}>
      <Zap className="h-2.5 w-2.5" />
      {priority}
    </span>
  );
}

// ─── PoolBadges ─────────────────────────────────────────────────────────

function PoolBadges({ pools }: { pools: string[] }) {
  if (pools.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {pools.map((pool) => (
        <span
          key={pool}
          className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
        >
          <Server className="h-2.5 w-2.5" />
          {pool}
        </span>
      ))}
    </div>
  );
}

// ─── SubTaskRow ─────────────────────────────────────────────────────────

function SubTaskRow({
  subTask,
  allSubTasks,
  onRetry
}: {
  subTask: SubTaskData;
  allSubTasks: SubTaskData[];
  onRetry: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusLower = subTask.status.toLowerCase();
  const isCompleted = statusLower === "completed";
  const isFailed = statusLower === "failed";
  const isActive = statusLower === "in_progress" || statusLower === "dispatched";
  const isWaiting = statusLower === "waiting_dependency" || statusLower === "queued";
  const hasExpandableContent = subTask.output || subTask.error || subTask.description;

  const dependencyTitles = useMemo(() => {
    if (!subTask.dependsOn || subTask.dependsOn.length === 0) return [];
    return subTask.dependsOn
      .map((depId) => {
        const dep = allSubTasks.find((st) => st.id === depId);
        return dep?.title ?? depId;
      });
  }, [subTask.dependsOn, allSubTasks]);

  return (
    <div className="group relative">
      <div className="absolute left-[15px] top-0 h-full w-px bg-zinc-800 group-last:h-6" />

      <div className="relative flex items-start gap-3 pl-2">
        <div className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {isFailed && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          {isActive && <LoadingGlobe size="sm" />}
          {isWaiting && <Clock className="h-3.5 w-3.5 text-amber-400" />}
          {!isCompleted && !isFailed && !isActive && !isWaiting && (
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </div>

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

          {isWaiting && dependencyTitles.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400/70">
              <Clock className="h-3 w-3 shrink-0" />
              waiting on: {dependencyTitles.join(", ")}
            </div>
          )}

          {expanded && (
            <div className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-all duration-200">
              {subTask.description && (
                <p className="text-xs text-zinc-400">{subTask.description}</p>
              )}
              {subTask.output != null && (
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

// ─── WorkOrderCard ──────────────────────────────────────────────────────

function WorkOrderCard({
  order,
  isExpanded,
  onToggle,
  onRetryOrder,
  onEscalateOrder,
  onCancelOrder,
  onRetrySubTask,
  detail,
  detailLoading,
  actionLoading
}: {
  order: WorkOrderData;
  isExpanded: boolean;
  onToggle: () => void;
  onRetryOrder: (id: string) => void;
  onEscalateOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onRetrySubTask: (orderId: string, subTaskId: string) => void;
  detail: WorkOrderData | null;
  detailLoading: boolean;
  actionLoading: string | null;
}) {
  const colors = getStatusColor(order.status);
  const isActive = ACTIVE_STATUSES.has(order.status);
  const isFailed = FAILURE_STATUSES.has(order.status);
  const progressPct = order.subTaskCount > 0
    ? Math.round((order.completedCount / order.subTaskCount) * 100)
    : 0;
  const pools = order.assignedPools ?? (order.assignedPool ? [order.assignedPool] : []);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isExpanded
          ? "border-red-500/30 bg-zinc-800/60 shadow-lg shadow-red-500/5"
          : "border-zinc-800 bg-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/60"
      }`}
    >
      {/* Card Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        {/* Status Icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-900/80">
          {getStatusIcon(order.status)}
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-zinc-200 leading-snug">
              {order.goalSummary}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              {order.retryCount != null && order.retryCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <RotateCcw className="h-2.5 w-2.5" />
                  {order.retryCount}
                </span>
              )}
              {order.escalated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  Escalated
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
            </div>
          </div>

          {/* Badges Row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
            <PoolBadges pools={pools} />
          </div>

          {/* Progress + Timestamps Row */}
          <div className="mt-2 flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">
                {order.completedCount}/{order.subTaskCount}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFailed ? "bg-red-500" : progressPct === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Failed indicator */}
            {order.failedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {order.failedCount} failed
              </span>
            )}

            {/* Timestamps */}
            <span className="ml-auto text-[11px] text-zinc-600">
              {formatRelativeTime(order.createdAt)}
            </span>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <span className="text-[11px] text-zinc-700">
                upd {formatRelativeTime(order.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-zinc-700/50 px-4 pb-4 pt-3">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingGlobe size="sm" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Error Summary */}
              {detail.errorSummary && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Error Summary
                  </div>
                  <p className="mt-1 text-xs text-red-300 leading-relaxed">
                    {detail.errorSummary}
                  </p>
                </div>
              )}

              {/* Result Summary */}
              {detail.resultSummary && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Result
                  </div>
                  <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                    {detail.resultSummary}
                  </p>
                  {detail.resultData != null && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-400">
                      {typeof detail.resultData === "string"
                        ? detail.resultData
                        : JSON.stringify(detail.resultData, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  <span className="text-zinc-400">{detail.taskType.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Created {formatTimestamp(detail.createdAt)}</span>
                </div>
                {detail.startedAt && (
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    <span>Started {formatTimestamp(detail.startedAt)}</span>
                  </div>
                )}
                {detail.completedAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/70" />
                    <span className="text-emerald-400/80">
                      Completed in {formatDuration(detail.startedAt ?? detail.createdAt, detail.completedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-Task Tree */}
              {detail.subTasks && detail.subTasks.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-zinc-400">
                    Sub-Tasks ({detail.subTasks.length})
                  </h4>
                  <div className="space-y-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    {detail.subTasks.map((st) => (
                      <SubTaskRow
                        key={st.id}
                        subTask={st}
                        allSubTasks={detail.subTasks!}
                        onRetry={(subId) => onRetrySubTask(order.id, subId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {isActive && (
                  <button
                    type="button"
                    disabled={actionLoading === `cancel-${order.id}`}
                    onClick={(e) => { e.stopPropagation(); onCancelOrder(order.id); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    {actionLoading === `cancel-${order.id}` ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <XOctagon className="h-3.5 w-3.5" />
                    )}
                    Cancel
                  </button>
                )}

                {(isFailed || order.failedCount > 0) && (
                  <button
                    type="button"
                    disabled={actionLoading === `retry-${order.id}`}
                    onClick={(e) => { e.stopPropagation(); onRetryOrder(order.id); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 disabled:opacity-50"
                  >
                    {actionLoading === `retry-${order.id}` ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Retry Failed
                  </button>
                )}

                {(isActive || isFailed) && (
                  <button
                    type="button"
                    disabled={actionLoading === `escalate-${order.id}`}
                    onClick={(e) => { e.stopPropagation(); onEscalateOrder(order.id); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
                  >
                    {actionLoading === `escalate-${order.id}` ? (
                      <LoadingGlobe size="sm" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                    Escalate
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading === `report-${order.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open as a report tab in workspace
                    const ws = useWorkspaceTabStore.getState();
                    ws.openOrFocusTab({
                      type: "report",
                      title: `Report: ${order.goalSummary.length > 30 ? order.goalSummary.slice(0, 27) + "..." : order.goalSummary}`,
                      icon: "file-text",
                      entityId: order.id,
                      entityType: "work_order_report",
                      state: { workOrderId: order.id, reportData: detail },
                      source: "user"
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Generate Report
                </button>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-zinc-600">
              Failed to load work order details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StatsBar ───────────────────────────────────────────────────────────

function StatsBar({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  const items = [
    {
      label: "Active",
      value: stats?.totalActive ?? 0,
      color: "text-blue-400",
      icon: <Activity className="h-3.5 w-3.5 text-blue-400" />
    },
    {
      label: "Completed Today",
      value: stats?.completedToday ?? 0,
      color: "text-emerald-400",
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    },
    {
      label: "Failed",
      value: stats?.failedCount ?? 0,
      color: stats?.failedCount ? "text-red-400" : "text-zinc-400",
      icon: <XCircle className="h-3.5 w-3.5 text-red-400" />
    },
    {
      label: "Avg Time",
      value: stats?.avgCompletionTime ?? "--",
      color: "text-zinc-300",
      icon: <Clock className="h-3.5 w-3.5 text-zinc-400" />
    },
    {
      label: "Utilization",
      value: stats?.utilization != null ? `${stats.utilization}%` : "--",
      color: "text-red-400",
      icon: <BarChart3 className="h-3.5 w-3.5 text-red-400" />
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5 rounded-lg bg-zinc-800/50 px-3 py-2">
          {item.icon}
          <div className="min-w-0">
            {loading ? (
              <div className="h-4 w-8 animate-pulse rounded bg-zinc-700" />
            ) : (
              <span className={`text-sm font-semibold ${item.color}`}>
                {item.value}
              </span>
            )}
            <p className="truncate text-[10px] text-zinc-600">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function WorkOrderCommandCenter() {
  const [activeView, setActiveView] = useState<TabView>("active");
  const [orders, setOrders] = useState<WorkOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, WorkOrderData>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [poolFilter, setPoolFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch Helpers ─────────────────────────────────────────────────────

  const getStatusParams = useCallback((view: TabView): string => {
    switch (view) {
      case "active":
        return "status=IN_PROGRESS,DISPATCHED,QUEUED,WAITING_DEPENDENCY";
      case "failures":
        return "status=FAILED,ESCALATED";
      case "completed":
        return "status=COMPLETED&limit=20";
      case "all":
        return "limit=50";
      default:
        return "";
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const params = getStatusParams(activeView);
      const res = await fetch(`${API_URL}/api/admin/orchestration?${params}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: WorkOrderData[] = json.data ?? json.orders ?? json ?? [];
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch work orders";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeView, getStatusParams]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orchestration/stats`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStats(json.data ?? json);
    } catch {
      // Stats are non-critical, fail silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (orderId: string) => {
    if (orderDetails[orderId]) return;
    setDetailLoading(orderId);
    try {
      const res = await fetch(`${API_URL}/api/admin/orchestration/${orderId}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const detail = json.data ?? json;
      setOrderDetails((prev) => ({ ...prev, [orderId]: detail }));
    } catch {
      // Detail fetch failed
    } finally {
      setDetailLoading(null);
    }
  }, [orderDetails]);

  // ── Actions ───────────────────────────────────────────────────────────

  const retryOrder = useCallback(async (orderId: string) => {
    setActionLoading(`retry-${orderId}`);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${orderId}/retry`, {
        method: "POST",
        credentials: "include"
      });
      // Refresh detail and list
      setOrderDetails((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      await fetchOrders();
      if (expandedOrderId === orderId) {
        await fetchDetail(orderId);
      }
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchOrders, fetchDetail, expandedOrderId]);

  const escalateOrder = useCallback(async (orderId: string) => {
    setActionLoading(`escalate-${orderId}`);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${orderId}/escalate`, {
        method: "POST",
        credentials: "include"
      });
      setOrderDetails((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      await fetchOrders();
    } catch (err) {
      console.error("Escalate failed:", err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    setActionLoading(`cancel-${orderId}`);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${orderId}/cancel`, {
        method: "POST",
        credentials: "include"
      });
      setOrderDetails((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      await fetchOrders();
    } catch (err) {
      console.error("Cancel failed:", err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchOrders]);

  const retrySubTask = useCallback(async (orderId: string, subTaskId: string) => {
    setActionLoading(`retry-subtask-${subTaskId}`);
    try {
      await fetch(`${API_URL}/api/admin/orchestration/${orderId}/subtasks/${subTaskId}/retry`, {
        method: "POST",
        credentials: "include"
      });
      // Invalidate detail cache
      setOrderDetails((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      // Re-fetch detail
      const res = await fetch(`${API_URL}/api/admin/orchestration/${orderId}`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await res.json();
        setOrderDetails((prev) => ({ ...prev, [orderId]: json.data ?? json }));
      }
    } catch (err) {
      console.error("Sub-task retry failed:", err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────

  // Initial load + poll setup
  useEffect(() => {
    setLoading(true);
    setOrders([]);
    fetchOrders();
    fetchStats();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    const interval = activeView === "active" ? 5000 : 15000;
    pollRef.current = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, interval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeView, fetchOrders, fetchStats]);

  // Fetch detail when expanding
  useEffect(() => {
    if (expandedOrderId) {
      fetchDetail(expandedOrderId);
    }
  }, [expandedOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtering ─────────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    let result = orders;

    // "All" view filters
    if (activeView === "all") {
      if (statusFilter !== "all") {
        result = result.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
      }
      if (priorityFilter !== "all") {
        result = result.filter((o) => o.priority.toLowerCase() === priorityFilter.toLowerCase());
      }
      if (poolFilter !== "all") {
        result = result.filter((o) => {
          const pools = o.assignedPools ?? (o.assignedPool ? [o.assignedPool] : []);
          return pools.some((p) => p.toLowerCase() === poolFilter.toLowerCase());
        });
      }
    }

    // Search filter (all views)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => o.goalSummary.toLowerCase().includes(q));
    }

    return result;
  }, [orders, activeView, statusFilter, priorityFilter, poolFilter, searchQuery]);

  // Group failures by pool
  const failuresByPool = useMemo(() => {
    if (activeView !== "failures") return new Map<string, WorkOrderData[]>();
    const groups = new Map<string, WorkOrderData[]>();
    for (const order of filteredOrders) {
      const pool = order.assignedPool ?? "unassigned";
      const existing = groups.get(pool) ?? [];
      existing.push(order);
      groups.set(pool, existing);
    }
    return groups;
  }, [activeView, filteredOrders]);

  // Unique pools for filter dropdown
  const uniquePools = useMemo(() => {
    const poolSet = new Set<string>();
    for (const o of orders) {
      if (o.assignedPool) poolSet.add(o.assignedPool);
      if (o.assignedPools) o.assignedPools.forEach((p) => poolSet.add(p));
    }
    return Array.from(poolSet).sort();
  }, [orders]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-zinc-800 px-5 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
              <Layers className="h-4 w-4 text-red-400" />
            </div>
            <h1 className="text-base font-semibold text-zinc-100">
              Work Order Command Center
            </h1>
          </div>
          <button
            type="button"
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="rounded-md p-1.5 text-zinc-500 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-300"
            title="Refresh all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} loading={statsLoading} />

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveView(tab.id);
                setExpandedOrderId(null);
              }}
              className={`relative flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
                activeView === tab.id
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {/* Active indicator */}
              {activeView === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-red-500" />
              )}
              {/* Count badges */}
              {tab.id === "active" && stats && stats.totalActive > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500/20 px-1 text-[10px] font-semibold text-blue-400">
                  {stats.totalActive}
                </span>
              )}
              {tab.id === "failures" && stats && stats.failedCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-semibold text-red-400">
                  {stats.failedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters (All view) ─────────────────────────────────────────── */}
      {activeView === "all" && (
        <div className="shrink-0 flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-5 py-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by goal..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition-colors duration-150 focus:border-red-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="dispatched">Dispatched</option>
              <option value="queued">Queued</option>
              <option value="waiting_dependency">Waiting Dependency</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="escalated">Escalated</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Pool filter */}
          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition-colors duration-150 focus:border-red-500/50"
          >
            <option value="all">All Pools</option>
            {uniquePools.map((pool) => (
              <option key={pool} value={pool.toLowerCase()}>
                {pool}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition-colors duration-150 focus:border-red-500/50"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* ── Search bar for non-All views ───────────────────────────────── */}
      {activeView !== "all" && (
        <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-5 py-2">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search work orders..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
            />
          </div>
        </div>
      )}

      {/* ── Content Area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Loading */}
        {loading && (
          <div className="flex h-full items-center justify-center">
            <LoadingGlobe size="md" />
          </div>
        )}

        {/* Error */}
        {!loading && error && filteredOrders.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Layers className="h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              {searchQuery
                ? "No work orders match your search"
                : activeView === "active"
                  ? "No active work orders"
                  : activeView === "failures"
                    ? "No failed work orders"
                    : activeView === "completed"
                      ? "No completed work orders"
                      : "No work orders found"}
            </p>
            <p className="text-xs text-zinc-600">
              {activeView === "active"
                ? "Work orders will appear here when dispatched"
                : activeView === "failures"
                  ? "All systems operating normally"
                  : ""}
            </p>
          </div>
        )}

        {/* ── Failures View (grouped by pool) ──────────────────────────── */}
        {!loading && activeView === "failures" && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {Array.from(failuresByPool.entries()).map(([pool, poolOrders]) => (
              <div key={pool}>
                <div className="mb-3 flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-red-400/70" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400/70">
                    {pool}
                  </h3>
                  <span className="text-[11px] text-zinc-600">
                    ({poolOrders.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {poolOrders.map((order) => (
                    <WorkOrderCard
                      key={order.id}
                      order={order}
                      isExpanded={expandedOrderId === order.id}
                      onToggle={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )
                      }
                      onRetryOrder={retryOrder}
                      onEscalateOrder={escalateOrder}
                      onCancelOrder={cancelOrder}
                      onRetrySubTask={retrySubTask}
                      detail={orderDetails[order.id] ?? null}
                      detailLoading={detailLoading === order.id}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Active / Completed / All Views (flat grid) ───────────────── */}
        {!loading && activeView !== "failures" && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <WorkOrderCard
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                onToggle={() =>
                  setExpandedOrderId(
                    expandedOrderId === order.id ? null : order.id
                  )
                }
                onRetryOrder={retryOrder}
                onEscalateOrder={escalateOrder}
                onCancelOrder={cancelOrder}
                onRetrySubTask={retrySubTask}
                detail={orderDetails[order.id] ?? null}
                detailLoading={detailLoading === order.id}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Status Bar ──────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between border-t border-zinc-800 bg-zinc-900/80 px-5 py-2 backdrop-blur-sm">
        <span className="text-[11px] text-zinc-600">
          {filteredOrders.length} work order{filteredOrders.length !== 1 ? "s" : ""}
          {filteredOrders.length !== orders.length && ` (${orders.length} total)`}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Auto-refresh {activeView === "active" ? "5s" : "15s"}
        </span>
      </div>
    </div>
  );
}
