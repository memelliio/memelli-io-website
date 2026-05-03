"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  FastForward,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  XCircle,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeType: string;
  label: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  error?: string;
  retryCount?: number;
}

interface ExecutionData {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  triggeredBy: string;
  triggerPayload?: Record<string, unknown> | string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  steps: ExecutionStep[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<StepStatus, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; line: string }> = {
  pending: { icon: Clock, color: "text-zinc-500", bg: "bg-zinc-800", line: "bg-zinc-700" },
  running: { icon: RefreshCw, color: "text-red-400", bg: "bg-red-500/10", line: "bg-red-500" },
  completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", line: "bg-emerald-500" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", line: "bg-red-500" },
  skipped: { icon: SkipForward, color: "text-zinc-400", bg: "bg-zinc-800", line: "bg-zinc-600" }
};

const EXECUTION_STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  running: { color: "text-red-400", bg: "bg-red-500/10" },
  completed: { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { color: "text-red-400", bg: "bg-red-500/10" },
  cancelled: { color: "text-zinc-400", bg: "bg-zinc-500/10" }
};

// ─── Helpers ────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// ─── Step Card ──────────────────────────────────────────────────────────

function StepCard({
  step,
  isLast,
  onRetry,
  onSkip
}: {
  step: ExecutionStep;
  isLast: boolean;
  onRetry: (stepId: string) => void;
  onSkip: (stepId: string) => void;
}) {
  const [expanded, setExpanded] = useState(step.status === "failed");
  const style = STATUS_STYLES[step.status];
  const StepIcon = style.icon;

  return (
    <div className="relative flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
          <StepIcon
            className={`h-4 w-4 ${style.color} ${step.status === "running" ? "animate-spin" : ""}`}
          />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 ${style.line} min-h-[24px] transition-colors duration-300`} />
        )}
      </div>

      {/* Step content */}
      <div className="min-w-0 flex-1 pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-500" />
          )}
          <span className="flex-1 truncate text-sm font-medium text-zinc-200">
            {step.label}
          </span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {step.nodeType}
          </span>
          {step.durationMs !== undefined && (
            <span className="text-[11px] text-zinc-500">
              {formatDuration(step.durationMs)}
            </span>
          )}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
              {step.startedAt && (
                <span>
                  <Clock className="mr-1 inline h-3 w-3" />
                  Started: {formatTimestamp(step.startedAt)}
                </span>
              )}
              {step.completedAt && (
                <span>
                  <Check className="mr-1 inline h-3 w-3" />
                  Completed: {formatTimestamp(step.completedAt)}
                </span>
              )}
              {step.retryCount !== undefined && step.retryCount > 0 && (
                <span>
                  <RotateCcw className="mr-1 inline h-3 w-3" />
                  Retries: {step.retryCount}
                </span>
              )}
            </div>

            {/* Input preview */}
            {step.input && (
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <ArrowRight className="h-3 w-3" />
                  Input
                </label>
                <pre className="max-h-24 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-400">
                  {typeof step.input === "string"
                    ? step.input
                    : JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}

            {/* Output preview */}
            {step.output && (
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <Code className="h-3 w-3" />
                  Output
                </label>
                <pre className="max-h-24 overflow-auto rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-400">
                  {typeof step.output === "string"
                    ? step.output
                    : JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}

            {/* Error */}
            {step.error && (
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  Error
                </label>
                <div className="rounded-md border border-red-900/40 bg-red-950/30 p-2 text-xs text-red-400">
                  {step.error}
                </div>
              </div>
            )}

            {/* Failed step actions */}
            {step.status === "failed" && (
              <div className="flex items-center gap-2 border-t border-zinc-800 pt-2">
                <button
                  onClick={() => onRetry(step.id)}
                  className="flex items-center gap-1 rounded-md bg-red-600/20 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  onClick={() => onSkip(step.id)}
                  className="flex items-center gap-1 rounded-md bg-zinc-700/40 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
                >
                  <FastForward className="h-3 w-3" />
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────

interface ExecutionMonitorProps {
  executionId: string;
}

// ─── Main Component ─────────────────────────────────────────────────────

export function ExecutionMonitor({ executionId }: ExecutionMonitorProps) {
  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadExecution = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/omniflow/executions/${executionId}`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = await res.json();
      setExecution(json.data || json.execution || json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load execution");
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    loadExecution();
    // Auto-refresh while running
    intervalRef.current = setInterval(() => {
      if (execution?.status === "running") {
        loadExecution();
      }
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadExecution]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop auto-refresh when execution completes
  useEffect(() => {
    if (execution && execution.status !== "running" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [execution?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(
    async (stepId: string) => {
      await fetch(
        `${API_URL}/api/admin/omniflow/executions/${executionId}/steps/${stepId}/retry`,
        { method: "POST", headers: getAuthHeaders() },
      );
      loadExecution();
    },
    [executionId, loadExecution],
  );

  const handleSkip = useCallback(
    async (stepId: string) => {
      await fetch(
        `${API_URL}/api/admin/omniflow/executions/${executionId}/steps/${stepId}/skip`,
        { method: "POST", headers: getAuthHeaders() },
      );
      loadExecution();
    },
    [executionId, loadExecution],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-zinc-900">
        <XCircle className="mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm text-zinc-400">{error || "Execution not found"}</p>
        <button
          onClick={loadExecution}
          className="mt-3 flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-zinc-800"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  const completedSteps = execution.steps.filter((s) => s.status === "completed").length;
  const totalSteps = execution.steps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const statusStyle = EXECUTION_STATUS_STYLES[execution.status] || EXECUTION_STATUS_STYLES.running;

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-zinc-200">
              {execution.workflowName}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.color}`}
            >
              {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
            </span>
          </div>
          <button
            onClick={loadExecution}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              {completedSteps} / {totalSteps} steps completed
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                execution.status === "failed"
                  ? "bg-red-500"
                  : execution.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Execution metadata */}
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Started: {formatTimestamp(execution.startedAt)}
          </span>
          {execution.totalDurationMs !== undefined && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              Duration: {formatDuration(execution.totalDurationMs)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Triggered by: {execution.triggeredBy}
          </span>
        </div>

        {/* Trigger payload */}
        {execution.triggerPayload && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-medium text-zinc-500 hover:text-zinc-400">
              Trigger Payload
            </summary>
            <pre className="mt-1 max-h-20 overflow-auto rounded-md bg-zinc-950 p-2 text-[10px] text-zinc-400">
              {JSON.stringify(execution.triggerPayload, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {execution.steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">No steps recorded yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {execution.steps.map((step, idx) => (
              <StepCard
                key={step.id}
                step={step}
                isLast={idx === execution.steps.length - 1}
                onRetry={handleRetry}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
        <span className="text-[10px] text-zinc-600">
          Execution ID: {execution.id.slice(0, 12)}...
        </span>
        {execution.status === "running" && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <LoadingGlobe size="sm" />
            Auto-refreshing every 2s
          </span>
        )}
      </div>
    </div>
  );
}
