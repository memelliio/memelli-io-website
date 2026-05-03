"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  BookmarkCheck,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  FileBarChart,
  Filter,
  GitCompare,
  Layers,
  LayoutGrid,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Star,
  Zap,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

// ─── Types ──────────────────────────────────────────────────────────────

type InsightsTab = "reports" | "saved-views" | "recent" | "pinned";

type ReportStatus = "draft" | "generating" | "ready" | "failed" | "archived";
type ReportMode = "snapshot" | "live";
type ReportType = "summary" | "detailed" | "comparison" | "trend" | "forecast";

interface Report {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  moduleKey: string;
  reportType: ReportType;
  status: ReportStatus;
  mode: ReportMode;
  isPinned: boolean;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ViewType = "table" | "kanban" | "calendar" | "chart" | "list";

interface SavedView {
  id: string;
  tenantId: string;
  title: string;
  moduleKey: string;
  viewType: ViewType;
  isDefault: boolean;
  isPinned: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const TAB_ITEMS: Array<{ key: InsightsTab; label: string; icon: typeof FileBarChart }> = [
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "saved-views", label: "Saved Views", icon: BookmarkCheck },
  { key: "recent", label: "Recent", icon: Clock },
  { key: "pinned", label: "Pinned", icon: Pin },
];

const MODULE_KEYS = [
  "all",
  "commerce",
  "crm",
  "coaching",
  "seo",
  "leads",
  "communications",
  "credit",
  "approval",
  "partners",
] as const;

const REPORT_TYPES: Array<{ key: string; label: string; value: ReportType | null }> = [
  { key: "all", label: "All Types", value: null },
  { key: "summary", label: "Summary", value: "summary" },
  { key: "detailed", label: "Detailed", value: "detailed" },
  { key: "comparison", label: "Comparison", value: "comparison" },
  { key: "trend", label: "Trend", value: "trend" },
  { key: "forecast", label: "Forecast", value: "forecast" },
];

const STATUS_OPTIONS: Array<{ key: string; label: string; value: ReportStatus | null }> = [
  { key: "all", label: "All Status", value: null },
  { key: "ready", label: "Ready", value: "ready" },
  { key: "generating", label: "Generating", value: "generating" },
  { key: "draft", label: "Draft", value: "draft" },
  { key: "failed", label: "Failed", value: "failed" },
  { key: "archived", label: "Archived", value: "archived" },
];

const STATUS_COLORS: Record<ReportStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-zinc-700/40", text: "text-zinc-400", dot: "bg-zinc-400" },
  generating: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  ready: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  archived: { bg: "bg-zinc-800/60", text: "text-zinc-500", dot: "bg-zinc-500" },
};

const MODE_COLORS: Record<ReportMode, { bg: string; text: string }> = {
  snapshot: { bg: "bg-blue-500/10", text: "text-blue-400" },
  live: { bg: "bg-red-500/10", text: "text-red-400" },
};

const MODULE_COLORS: Record<string, string> = {
  commerce: "text-emerald-400 bg-emerald-500/10",
  crm: "text-blue-400 bg-blue-500/10",
  coaching: "text-amber-400 bg-amber-500/10",
  seo: "text-teal-400 bg-teal-500/10",
  leads: "text-rose-400 bg-rose-500/10",
  communications: "text-indigo-400 bg-indigo-500/10",
  credit: "text-orange-400 bg-orange-500/10",
  approval: "text-green-400 bg-green-500/10",
  partners: "text-violet-400 bg-violet-500/10",
};

const VIEW_TYPE_ICONS: Record<ViewType, typeof LayoutGrid> = {
  table: Layers,
  kanban: LayoutGrid,
  calendar: Calendar,
  chart: BarChart3,
  list: Layers,
};

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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── API Functions ──────────────────────────────────────────────────────

async function fetchReports(params?: {
  moduleKey?: string;
  reportType?: string;
  status?: string;
  limit?: number;
}): Promise<Report[]> {
  const searchParams = new URLSearchParams();
  if (params?.moduleKey && params.moduleKey !== "all")
    searchParams.set("moduleKey", params.moduleKey);
  if (params?.reportType) searchParams.set("reportType", params.reportType);
  if (params?.status) searchParams.set("status", params.status);
  searchParams.set("limit", String(params?.limit ?? 20));

  try {
    const res = await fetch(
      `${API_URL}/api/admin/reports?${searchParams}`,
      { headers: getAuthHeaders(), credentials: "include" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json.reports || [];
  } catch {
    return [];
  }
}

async function fetchSavedViews(params?: {
  moduleKey?: string;
  limit?: number;
}): Promise<SavedView[]> {
  const searchParams = new URLSearchParams();
  if (params?.moduleKey && params.moduleKey !== "all")
    searchParams.set("moduleKey", params.moduleKey);
  searchParams.set("limit", String(params?.limit ?? 20));

  try {
    const res = await fetch(
      `${API_URL}/api/admin/reports/views?${searchParams}`,
      { headers: getAuthHeaders(), credentials: "include" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json.views || [];
  } catch {
    return [];
  }
}

// ─── Filter Dropdown ────────────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: string; label: string; value: string | null }>;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
          value
            ? "border-red-500/30 bg-red-500/10 text-red-400"
            : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
        }`}
      >
        {activeLabel}
        <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl shadow-black/30">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-xs transition-colors ${
                option.value === value
                  ? "bg-red-500/10 text-red-400"
                  : "text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Report Card ────────────────────────────────────────────────────────

function ReportCard({
  report,
  onOpen,
  onPin,
}: {
  report: Report;
  onOpen: (report: Report) => void;
  onPin: (report: Report) => void;
}) {
  const statusStyle = STATUS_COLORS[report.status];
  const modeStyle = MODE_COLORS[report.mode];
  const moduleColor = MODULE_COLORS[report.moduleKey] ?? "text-zinc-400 bg-zinc-700/40";

  return (
    <button
      onClick={() => onOpen(report)}
      className="group relative flex w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Pin icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin(report);
        }}
        className={`absolute right-3 top-3 rounded-md p-1 transition-all duration-150 ${
          report.isPinned
            ? "text-red-400 hover:text-red-300"
            : "text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300"
        }`}
        title={report.isPinned ? "Unpin" : "Pin"}
      >
        {report.isPinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
      </button>

      {/* Title */}
      <h3 className="pr-8 text-sm font-semibold text-zinc-200 transition-colors duration-150 group-hover:text-white">
        {report.title}
      </h3>

      {/* Badges row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {/* Module badge */}
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${moduleColor}`}>
          {report.moduleKey}
        </span>

        {/* Report type badge */}
        <span className="rounded-md bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          {report.reportType}
        </span>

        {/* Status badge */}
        <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} ${report.status === "generating" ? "animate-pulse" : ""}`} />
          {report.status}
        </span>

        {/* Mode badge */}
        <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${modeStyle.bg} ${modeStyle.text}`}>
          {report.mode === "live" ? <Zap className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
          {report.mode === "live" ? "Live" : "Snapshot"}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
        <Clock className="h-3 w-3" />
        {report.generatedAt ? (
          <span>Generated {timeAgo(report.generatedAt)}</span>
        ) : (
          <span>Created {timeAgo(report.createdAt)}</span>
        )}
      </div>
    </button>
  );
}

// ─── Saved View Card ────────────────────────────────────────────────────

function SavedViewCard({
  view,
  onOpen,
  onPin,
}: {
  view: SavedView;
  onOpen: (view: SavedView) => void;
  onPin: (view: SavedView) => void;
}) {
  const moduleColor = MODULE_COLORS[view.moduleKey] ?? "text-zinc-400 bg-zinc-700/40";
  const ViewIcon = VIEW_TYPE_ICONS[view.viewType] ?? Layers;

  return (
    <button
      onClick={() => onOpen(view)}
      className="group relative flex w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Pin + Default icons */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {view.isDefault && (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(view);
          }}
          className={`rounded-md p-1 transition-all duration-150 ${
            view.isPinned
              ? "text-red-400 hover:text-red-300"
              : "text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300"
          }`}
          title={view.isPinned ? "Unpin" : "Pin"}
        >
          {view.isPinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Icon + Title */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
          <ViewIcon className="h-4 w-4 text-zinc-400" />
        </div>
        <h3 className="pr-10 text-sm font-semibold text-zinc-200 transition-colors duration-150 group-hover:text-white">
          {view.title}
        </h3>
      </div>

      {/* Badges row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${moduleColor}`}>
          {view.moduleKey}
        </span>
        <span className="rounded-md bg-zinc-700/40 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          {view.viewType}
        </span>
        {view.isDefault && (
          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            Default
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
        <Clock className="h-3 w-3" />
        <span>Updated {timeAgo(view.updatedAt)}</span>
      </div>
    </button>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: {
  icon: typeof FileBarChart;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
        <Icon className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-zinc-500">{description}</p>
    </div>
  );
}

// ─── Loading Grid ───────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
        >
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 flex gap-1.5">
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-14 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Reports Tab Content ────────────────────────────────────────────────

function ReportsTabContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const data = await fetchReports({
      moduleKey: moduleFilter ?? undefined,
      reportType: typeFilter ?? undefined,
      status: statusFilter ?? undefined,
      limit: 20,
    });
    setReports(data);
    setLoading(false);
  }, [moduleFilter, typeFilter, statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleOpenReport = useCallback(
    (report: Report) => {
      openOrFocusTab({
        type: "report",
        title: report.title,
        icon: "file-bar-chart",
        entityId: report.id,
        entityType: "report",
        route: `/dashboard/insights/reports/${report.id}`,
      });
    },
    [openOrFocusTab],
  );

  const handlePinReport = useCallback((report: Report) => {
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, isPinned: !r.isPinned } : r)),
    );
    // Fire and forget pin API call
    fetch(`${API_URL}/api/admin/reports/${report.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    }).catch(() => {});
  }, []);

  const handleNewReport = useCallback(() => {
    openOrFocusTab({
      type: "custom",
      title: "New Report",
      icon: "plus",
      route: "/dashboard/insights/reports/new",
    });
  }, [openOrFocusTab]);

  const filteredReports = searchQuery
    ? reports.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : reports;

  const moduleOptions = MODULE_KEYS.map((k) => ({
    key: k,
    label: k === "all" ? "All Modules" : k.charAt(0).toUpperCase() + k.slice(1),
    value: k === "all" ? null : k,
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/60 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        <FilterDropdown
          label="Module"
          options={moduleOptions}
          value={moduleFilter}
          onChange={setModuleFilter}
        />
        <FilterDropdown
          label="Type"
          options={REPORT_TYPES.map((t) => ({ key: t.key, label: t.label, value: t.value }))}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS.map((s) => ({ key: s.key, label: s.label, value: s.value }))}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <button
          onClick={loadReports}
          className="rounded-md border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handleNewReport}
          className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          New Report
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingGrid />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No reports found"
          description="Create your first report to start tracking insights across your modules."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onOpen={handleOpenReport}
              onPin={handlePinReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Saved Views Tab Content ────────────────────────────────────────────

function SavedViewsTabContent() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  const loadViews = useCallback(async () => {
    setLoading(true);
    const data = await fetchSavedViews({
      moduleKey: moduleFilter ?? undefined,
      limit: 20,
    });
    setViews(data);
    setLoading(false);
  }, [moduleFilter]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const handleOpenView = useCallback(
    (view: SavedView) => {
      openOrFocusTab({
        type: "custom",
        title: view.title,
        icon: "eye",
        entityId: view.id,
        entityType: "saved_view",
        route: `/dashboard/insights/views/${view.id}`,
      });
    },
    [openOrFocusTab],
  );

  const handlePinView = useCallback((view: SavedView) => {
    setViews((prev) =>
      prev.map((v) => (v.id === view.id ? { ...v, isPinned: !v.isPinned } : v)),
    );
    fetch(`${API_URL}/api/admin/reports/views/${view.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    }).catch(() => {});
  }, []);

  const filteredViews = searchQuery
    ? views.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : views;

  const moduleOptions = MODULE_KEYS.map((k) => ({
    key: k,
    label: k === "all" ? "All Modules" : k.charAt(0).toUpperCase() + k.slice(1),
    value: k === "all" ? null : k,
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search views..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/60 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        <FilterDropdown
          label="Module"
          options={moduleOptions}
          value={moduleFilter}
          onChange={setModuleFilter}
        />

        <button
          onClick={loadViews}
          className="rounded-md border border-zinc-700 bg-zinc-800/60 p-1.5 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingGrid />
      ) : filteredViews.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No saved views"
          description="Save custom views from any module to quickly access your preferred layouts."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredViews.map((view) => (
            <SavedViewCard
              key={view.id}
              view={view}
              onOpen={handleOpenView}
              onPin={handlePinView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recent Tab Content ─────────────────────────────────────────────────

function RecentTabContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [reportsData, viewsData] = await Promise.all([
        fetchReports({ limit: 10 }),
        fetchSavedViews({ limit: 10 }),
      ]);
      setReports(reportsData);
      setViews(viewsData);
      setLoading(false);
    }
    load();
  }, []);

  // Combine and sort by most recent
  const combined = [
    ...reports.map((r) => ({
      id: r.id,
      type: "report" as const,
      title: r.title,
      moduleKey: r.moduleKey,
      badge: r.reportType,
      date: r.generatedAt ?? r.updatedAt,
      item: r,
    })),
    ...views.map((v) => ({
      id: v.id,
      type: "view" as const,
      title: v.title,
      moduleKey: v.moduleKey,
      badge: v.viewType,
      date: v.updatedAt,
      item: v,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpen = useCallback(
    (entry: (typeof combined)[0]) => {
      if (entry.type === "report") {
        openOrFocusTab({
          type: "report",
          title: entry.title,
          icon: "file-bar-chart",
          entityId: entry.id,
          entityType: "report",
          route: `/dashboard/insights/reports/${entry.id}`,
        });
      } else {
        openOrFocusTab({
          type: "custom",
          title: entry.title,
          icon: "eye",
          entityId: entry.id,
          entityType: "saved_view",
          route: `/dashboard/insights/views/${entry.id}`,
        });
      }
    },
    [openOrFocusTab],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
      </div>
    );
  }

  if (combined.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No recent activity"
        description="Reports and views you open will appear here for quick access."
      />
    );
  }

  return (
    <div className="space-y-1">
      {combined.map((entry) => {
        const moduleColor =
          MODULE_COLORS[entry.moduleKey] ?? "text-zinc-400 bg-zinc-700/40";
        const TypeIcon = entry.type === "report" ? FileBarChart : Eye;

        return (
          <button
            key={`${entry.type}-${entry.id}`}
            onClick={() => handleOpen(entry)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-zinc-800/60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <TypeIcon className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{entry.title}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${moduleColor}`}>
                  {entry.moduleKey}
                </span>
                <span className="rounded bg-zinc-700/40 px-1 py-0.5 text-[9px] font-medium text-zinc-500">
                  {entry.badge}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-zinc-500">{timeAgo(entry.date)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pinned Tab Content ─────────────────────────────────────────────────

function PinnedTabContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [reportsData, viewsData] = await Promise.all([
        fetchReports({ limit: 50 }),
        fetchSavedViews({ limit: 50 }),
      ]);
      // Client-side filter for pinned items
      setReports(reportsData.filter((r) => r.isPinned));
      setViews(viewsData.filter((v) => v.isPinned));
      setLoading(false);
    }
    load();
  }, []);

  const handleOpenReport = useCallback(
    (report: Report) => {
      openOrFocusTab({
        type: "report",
        title: report.title,
        icon: "file-bar-chart",
        entityId: report.id,
        entityType: "report",
        route: `/dashboard/insights/reports/${report.id}`,
      });
    },
    [openOrFocusTab],
  );

  const handleOpenView = useCallback(
    (view: SavedView) => {
      openOrFocusTab({
        type: "custom",
        title: view.title,
        icon: "eye",
        entityId: view.id,
        entityType: "saved_view",
        route: `/dashboard/insights/views/${view.id}`,
      });
    },
    [openOrFocusTab],
  );

  const handleUnpinReport = useCallback((report: Report) => {
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    fetch(`${API_URL}/api/admin/reports/${report.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    }).catch(() => {});
  }, []);

  const handleUnpinView = useCallback((view: SavedView) => {
    setViews((prev) => prev.filter((v) => v.id !== view.id));
    fetch(`${API_URL}/api/admin/reports/views/${view.id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    }).catch(() => {});
  }, []);

  if (loading) {
    return <LoadingGrid />;
  }

  if (reports.length === 0 && views.length === 0) {
    return (
      <EmptyState
        icon={Pin}
        title="No pinned items"
        description="Pin reports and views for quick access. They will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Reports */}
      {reports.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileBarChart className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pinned Reports
            </h3>
            <span className="text-[10px] text-zinc-600">{reports.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onOpen={handleOpenReport}
                onPin={handleUnpinReport}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pinned Views */}
      {views.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pinned Views
            </h3>
            <span className="text-[10px] text-zinc-600">{views.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((view) => (
              <SavedViewCard
                key={view.id}
                view={view}
                onOpen={handleOpenView}
                onPin={handleUnpinView}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function InsightsCenter() {
  const [activeTab, setActiveTab] = useState<InsightsTab>("reports");

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600/20 to-indigo-600/20 border border-red-500/20">
            <BarChart3 className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Insights Center</h2>
            <p className="text-[10px] text-zinc-500">Reports, views, and comparisons</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-zinc-800/50 px-4">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "text-red-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "reports" && <ReportsTabContent />}
        {activeTab === "saved-views" && <SavedViewsTabContent />}
        {activeTab === "recent" && <RecentTabContent />}
        {activeTab === "pinned" && <PinnedTabContent />}
      </div>
    </div>
  );
}
