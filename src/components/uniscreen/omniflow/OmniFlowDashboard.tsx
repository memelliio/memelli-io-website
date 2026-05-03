"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Filter,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Workflow,
  XCircle,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ─── Types ──────────────────────────────────────────────────────────────

type WorkflowStatus = "active" | "paused" | "draft" | "failed" | "archived";
type TriggerType = "manual" | "schedule" | "webhook" | "event" | "condition";

interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  category?: string;
  lastExecutionAt?: string;
  lastExecutionStatus?: string;
  totalExecutions: number;
  successRate: number;
  activeExecutions: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  completedToday: number;
  failedToday: number;
  runningExecutions: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

const TAB_FILTERS: Array<{ key: string; label: string; status: WorkflowStatus | "all" | "packs" }> = [
  { key: "active", label: "Active", status: "active" },
  { key: "completed", label: "Completed", status: "archived" },
  { key: "failed", label: "Failed", status: "failed" },
  { key: "all", label: "All", status: "all" },
  { key: "packs", label: "Packs", status: "packs" },
];

const STATUS_STYLES: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  paused: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500" },
  failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  archived: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" }
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: "Manual",
  schedule: "Scheduled",
  webhook: "Webhook",
  event: "Event",
  condition: "Condition"
};

const CATEGORY_OPTIONS = [
  "all",
  "automation",
  "crm",
  "commerce",
  "marketing",
  "onboarding",
  "support",
  "reporting",
];

// ─── Helpers ────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// ─── API Functions ──────────────────────────────────────────────────────

async function fetchWorkflows(status?: string): Promise<WorkflowSummary[]> {
  const params = new URLSearchParams();
  if (status && status !== "all" && status !== "packs") params.set("status", status);
  if (status === "packs") params.set("isPack", "true");
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows?${params}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || json.workflows || [];
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/stats`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    return { totalWorkflows: 0, activeWorkflows: 0, completedToday: 0, failedToday: 0, runningExecutions: 0 };
  }
  const json = await res.json();
  return json.data || json;
}

async function apiUpdateWorkflowStatus(id: string, status: WorkflowStatus): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status })
  });
  return res.ok;
}

async function apiExecuteWorkflow(id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${id}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() }
  });
  return res.ok;
}

async function apiDuplicateWorkflow(id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() }
  });
  return res.ok;
}

async function apiDeleteWorkflow(id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/admin/omniflow/workflows/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  return res.ok;
}

// ─── Stat Card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-bold text-zinc-100">{value}</p>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Workflow Card ──────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  onAction
}: {
  workflow: WorkflowSummary;
  onAction: (action: string, id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const style = STATUS_STYLES[workflow.status] || STATUS_STYLES.draft;

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 shrink-0 text-red-400" />
            <h3 className="truncate text-sm font-semibold text-zinc-200">
              {workflow.name}
            </h3>
          </div>
          {workflow.description && (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {workflow.description}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`ml-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style.bg} ${style.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {TRIGGER_LABELS[workflow.triggerType] || workflow.triggerType}
        </span>
        {workflow.lastExecutionAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(workflow.lastExecutionAt)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {workflow.totalExecutions} runs
        </span>
        <span
          className={`flex items-center gap-1 ${
            workflow.successRate >= 90
              ? "text-emerald-500"
              : workflow.successRate >= 70
                ? "text-amber-500"
                : "text-red-400"
          }`}
        >
          <CheckCircle2 className="h-3 w-3" />
          {workflow.successRate}% success
        </span>
        {workflow.activeExecutions > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <LoadingGlobe size="sm" />
            {workflow.activeExecutions} running
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-800/60 pt-3">
        {workflow.status === "active" ? (
          <button
            onClick={() => onAction("pause", workflow.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-amber-400"
          >
            <Pause className="h-3 w-3" />
            Pause
          </button>
        ) : workflow.status !== "archived" ? (
          <button
            onClick={() => onAction("activate", workflow.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-emerald-400"
          >
            <Play className="h-3 w-3" />
            Activate
          </button>
        ) : null}

        <button
          onClick={() => onAction("execute", workflow.id)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
        >
          <Zap className="h-3 w-3" />
          Run
        </button>

        <button
          onClick={() => onAction("edit", workflow.id)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <ArrowRight className="h-3 w-3" />
          Edit
        </button>

        {/* More menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
                <button
                  onClick={() => { onAction("duplicate", workflow.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </button>
                <button
                  onClick={() => { onAction("delete", workflow.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-zinc-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
        <Workflow className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">No workflows found</h3>
      <p className="mt-1 text-xs text-zinc-500">
        {tab === "packs"
          ? "No workflow packs available yet."
          : "Create your first workflow to get started."}
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function OmniFlowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openTab = useWorkspaceTabStore((s) => s.openTab);

  const loadData = useCallback(async () => {
    try {
      const tabFilter = TAB_FILTERS.find((t) => t.key === activeTab);
      const statusParam = tabFilter?.status || "all";
      const [workflowData, statsData] = await Promise.all([
        fetchWorkflows(statusParam),
        fetchStats(),
      ]);
      setWorkflows(workflowData);
      setStats(statsData);
    } catch {
      // Silent retry on next interval
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadData();
    intervalRef.current = setInterval(loadData, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  // Filter workflows by search and category
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      !searchQuery ||
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || wf.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAction = useCallback(
    async (action: string, id: string) => {
      switch (action) {
        case "activate":
          await apiUpdateWorkflowStatus(id, "active");
          loadData();
          break;
        case "pause":
          await apiUpdateWorkflowStatus(id, "paused");
          loadData();
          break;
        case "execute":
          await apiExecuteWorkflow(id);
          loadData();
          break;
        case "edit":
          openTab({
            type: "omniflow-builder",
            title: "Workflow Builder",
            icon: "workflow",
            entityId: id,
            entityType: "workflow",
            source: "user"
          });
          break;
        case "duplicate":
          await apiDuplicateWorkflow(id);
          loadData();
          break;
        case "delete":
          await apiDeleteWorkflow(id);
          loadData();
          break;
      }
    },
    [loadData, openTab],
  );

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold text-zinc-200">OmniFlow</h2>
          {stats && stats.runningExecutions > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[11px] font-bold text-red-400">
              {stats.runningExecutions} running
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() =>
              openTab({
                type: "omniflow-builder",
                title: "New Workflow",
                icon: "workflow",
                entityId: "new",
                entityType: "workflow",
                source: "user"
              })
            }
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New Workflow
          </button>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-800/50 p-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Total Workflows"
            value={stats.totalWorkflows}
            icon={Workflow}
            color="bg-red-500/10 text-red-400"
          />
          <StatCard
            label="Active"
            value={stats.activeWorkflows}
            icon={Play}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            label="Completed Today"
            value={stats.completedToday}
            icon={CheckCircle2}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            label="Failed Today"
            value={stats.failedToday}
            icon={XCircle}
            color="bg-red-500/10 text-red-400"
          />
          <StatCard
            label="Running"
            value={stats.runningExecutions}
            icon={Activity}
            color="bg-amber-500/10 text-amber-400"
          />
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4">
        <div className="flex gap-1 py-2">
          {TAB_FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-red-500/20 text-red-400"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-48 rounded-lg border border-zinc-700 bg-zinc-800/80 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-red-500/50"
            />
          </div>
          {/* Category filter */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter !== "all"
                  ? "bg-red-500/20 text-red-400"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              <Filter className="h-3 w-3" />
              {categoryFilter === "all" ? "Category" : categoryFilter}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showCategoryFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCategoryFilter(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setShowCategoryFilter(false);
                      }}
                      className={`flex w-full items-center px-3 py-1.5 text-xs transition-colors hover:bg-zinc-700 ${
                        categoryFilter === cat ? "text-red-400" : "text-zinc-300"
                      }`}
                    >
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Workflow Grid ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Status ──────────────────────────────────────────────── */}
      {stats && !loading && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          <span className="text-[10px] text-zinc-600">
            {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? "s" : ""} shown
          </span>
          <span className="text-[10px] text-zinc-600">
            Auto-refreshing every 10s
          </span>
        </div>
      )}
    </div>
  );
}
