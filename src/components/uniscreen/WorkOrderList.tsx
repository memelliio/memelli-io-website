"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Layers,
  RefreshCw,
  Server,
  XCircle,
  Zap
} from "lucide-react";
import { useWorkspaceTabStore } from "@/stores/workspace-store";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

interface WorkOrderSummary {
  id: string;
  goalSummary: string;
  taskType: string;
  status: string;
  priority: string;
  assignedPool?: string;
  subTaskCount: number;
  completedCount: number;
  failedCount: number;
  createdAt: string;
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
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  normal: "text-blue-400",
  low: "text-zinc-400"
};

const ACTIVE_STATUSES = new Set([
  "DISPATCHED", "IN_PROGRESS", "QUEUED", "PENDING",
  "dispatched", "in_progress", "queued", "pending",
]);

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" };
}

function getStatusIcon(status: string) {
  const lower = status.toLowerCase();
  if (lower === "completed") return <Check className="h-3.5 w-3.5 text-emerald-400" />;
  if (lower === "failed") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (lower === "in_progress" || lower === "dispatched") return <LoadingGlobe size="sm" />;
  if (lower === "escalated") return <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />;
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

// ─── Main Component ─────────────────────────────────────────────────────

export function WorkOrderList() {
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orchestration?limit=20`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOrders(json.data ?? json.orders ?? json ?? []);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchOrders]);

  const openOrder = (order: WorkOrderSummary) => {
    openOrFocusTab({
      type: "custom",
      title: order.goalSummary.length > 40
        ? order.goalSummary.slice(0, 37) + "..."
        : order.goalSummary,
      icon: "clipboard-list",
      entityId: order.id,
      entityType: "work_order",
      route: `/dashboard/work-orders/${order.id}`,
      state: { workOrderId: order.id },
      source: "user"
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingGlobe size="md" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
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
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Layers className="h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">No work orders</p>
        <p className="text-xs text-zinc-600">
          Work orders will appear here when dispatched
        </p>
      </div>
    );
  }

  // Count active orders
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">Work Orders</h2>
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              </span>
              {activeCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="rounded-md p-1.5 text-zinc-500 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-300"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {orders.map((order) => {
          const colors = getStatusColor(order.status);
          const progressPct = order.subTaskCount > 0
            ? Math.round((order.completedCount / order.subTaskCount) * 100)
            : 0;

          return (
            <button
              key={order.id}
              type="button"
              onClick={() => openOrder(order)}
              className="group flex w-full items-start gap-3 border-b border-zinc-800/50 px-4 py-3 text-left transition-colors duration-150 hover:bg-zinc-800/40"
            >
              {/* Status icon */}
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/50 transition-colors duration-150 group-hover:border-zinc-600">
                {getStatusIcon(order.status)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200 transition-colors duration-150 group-hover:text-white">
                  {order.goalSummary}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}>
                    <span className={`h-1 w-1 rounded-full ${colors.dot}`} />
                    {order.status.replace(/_/g, " ")}
                  </span>

                  {/* Progress */}
                  <span className="text-[11px] text-zinc-500">
                    {order.completedCount}/{order.subTaskCount}
                  </span>

                  {/* Mini progress bar */}
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Priority */}
                  <span className={`flex items-center gap-0.5 text-[11px] ${PRIORITY_COLORS[order.priority?.toLowerCase()] ?? "text-zinc-500"}`}>
                    <Zap className="h-2.5 w-2.5" />
                    {order.priority}
                  </span>

                  {/* Pool */}
                  {order.assignedPool && (
                    <span className="flex items-center gap-0.5 text-[11px] text-zinc-600">
                      <Server className="h-2.5 w-2.5" />
                      {order.assignedPool}
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <span className="shrink-0 text-[11px] text-zinc-600">
                {formatRelativeTime(order.createdAt)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
        <span className="text-[11px] text-zinc-600">
          {orders.length} work order{orders.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Auto-refresh 10s
        </span>
      </div>
    </div>
  );
}
