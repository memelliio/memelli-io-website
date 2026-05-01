"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  History,
  Loader2,
  Search,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

// ─── Types ──────────────────────────────────────────────────────────────

type ExecutionStatus = "running" | "completed" | "failed" | "cancelled";

interface HistoryEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  stepsTotal: number;
  stepsCompleted: number;
  stepsFailed: number;
}

interface HistoryFilters {
  workflowId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<ExecutionStatus, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  running: { icon: Loader2, color: "text-red-400", bg: "bg-red-500/10" },
  completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  cancelled: { icon: AlertTriangle, color: "text-zinc-400", bg: "bg-zinc-500/10" },
};

const PAGE_SIZE = 20;

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
  });
}

// ─── API ────────────────────────────────────────────────────────────────

async function fetchHistory(
  filters: HistoryFilters,
  page: number,
): Promise<{ entries: HistoryEntry[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  if (filters.workflowId) params.set("workflowId", filters.workflowId);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search);

  const res = await fetch(`${API_URL}/api/admin/omniflow/executions?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    return {
      entries: [],
      pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 },
    };
  }

  const json = await res.json();
  return {
    entries: json.data || json.executions || [],
    pagination: json.pagination || {
      page,
      pageSize: PAGE_SIZE,
      total: json.total || 0,
      totalPages: json.totalPages || 0,
    },
  };
}

// ─── Props ──────────────────────────────────────────────────────────────

interface WorkflowHistoryProps {
  workflowId?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────

export function WorkflowHistory({ workflowId }: WorkflowHistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({
    workflowId: workflowId || "",
    status: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const openTab = useWorkspaceTabStore((s) => s.openTab);

  const loadData = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const result = await fetchHistory(filters, page);
        setEntries(result.entries);
        setPagination(result.pagination);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleOpenExecution = useCallback(
    (executionId: string, workflowName: string) => {
      openTab({
        type: "omniflow-execution",
        title: `Execution: ${workflowName}`,
        icon: "zap",
        entityId: executionId,
        entityType: "execution",
        source: "user",
      });
    },
    [openTab],
  );

  const updateFilter = useCallback(
    (patch: Partial<HistoryFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-200">
            Execution History
          </h2>
          {pagination.total > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {pagination.total} total
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            showFilters
              ? "bg-red-500/20 text-red-400"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
        >
          <Filter className="h-3 w-3" />
          Filters
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="border-b border-zinc-800/50 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter({ search: e.target.value })}
                  placeholder="Workflow name..."
                  className="w-48 rounded-lg border border-zinc-700 bg-zinc-800/80 py-1.5 pl-7 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </label>
              <div className="flex gap-1">
                {STATUS_FILTERS.map((sf) => (
                  <button
                    key={sf.key}
                    onClick={() => updateFilter({ status: sf.key })}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      filters.status === sf.key
                        ? "bg-red-500/20 text-red-400"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <Calendar className="mr-1 inline h-3 w-3" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter({ dateFrom: e.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-200 outline-none transition-colors focus:border-red-500/50"
                />
                <span className="text-xs text-zinc-600">to</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter({ dateTo: e.target.value })}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-200 outline-none transition-colors focus:border-red-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-3 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">No executions found</p>
            <p className="mt-1 text-xs text-zinc-600">
              Adjust your filters or run a workflow to see results here.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Workflow
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Started
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Duration
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Steps
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Trigger
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const style = STATUS_STYLES[entry.status] || STATUS_STYLES.running;
                const StatusIcon = style.icon;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => handleOpenExecution(entry.id, entry.workflowName)}
                    className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span className="text-sm font-medium text-zinc-200">
                          {entry.workflowName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.color}`}
                      >
                        <StatusIcon
                          className={`h-3 w-3 ${entry.status === "running" ? "animate-spin" : ""}`}
                        />
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">
                        {formatTimestamp(entry.startedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400">
                        {entry.durationMs !== undefined
                          ? formatDuration(entry.durationMs)
                          : entry.status === "running"
                            ? "In progress..."
                            : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">{entry.stepsCompleted}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-400">{entry.stepsTotal}</span>
                        {entry.stepsFailed > 0 && (
                          <span className="ml-1 text-red-400">
                            ({entry.stepsFailed} failed)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        {entry.triggeredBy}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          <span className="text-[11px] text-zinc-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => loadData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => loadData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
