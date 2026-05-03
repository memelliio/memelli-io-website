"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Bot,
  ChevronRight,
  FileText,
  GitBranch,
  Layers,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { API_URL } from "@/lib/config";

// ─── Types ───────────────────────────────────────────────────────────────

type ActivityCategory =
  | "entity_change"
  | "pipeline_update"
  | "report_activity"
  | "agent_event";

interface ActivityItem {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  source: string;
  sourceId?: string;
  actionUrl?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Constants ───────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Array<{
  key: string;
  label: string;
  value: ActivityCategory | null;
}> = [
  { key: "all", label: "All", value: null },
  { key: "entity_change", label: "Entity Changes", value: "entity_change" },
  { key: "pipeline_update", label: "Pipeline", value: "pipeline_update" },
  { key: "report_activity", label: "Reports", value: "report_activity" },
  { key: "agent_event", label: "Agents", value: "agent_event" },
];

const CATEGORY_ICONS: Record<ActivityCategory, typeof Activity> = {
  entity_change: Settings,
  pipeline_update: TrendingUp,
  report_activity: FileText,
  agent_event: Bot,
};

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  entity_change: "text-blue-400 bg-blue-500/10",
  pipeline_update: "text-emerald-400 bg-emerald-500/10",
  report_activity: "text-amber-400 bg-amber-500/10",
  agent_event: "text-red-400 bg-red-500/10",
};

const AUTO_REFRESH_MS = 10_000;

// ─── Helpers ─────────────────────────────────────────────────────────────

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

async function fetchActivityFeed(
  category?: ActivityCategory | null,
  limit = 100,
): Promise<ActivityItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("limit", String(limit));

  try {
    const res = await fetch(
      `${API_URL}/api/admin/notifications-v2/activity-feed?${params}`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

// ─── Activity Card ───────────────────────────────────────────────────────

function ActivityCard({
  item,
  onOpen,
}: {
  item: ActivityItem;
  onOpen: (item: ActivityItem) => void;
}) {
  const Icon = CATEGORY_ICONS[item.category] || Activity;
  const colorClass = CATEGORY_COLORS[item.category] || "text-zinc-400 bg-zinc-500/10";

  return (
    <button
      onClick={() => onOpen(item)}
      className="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/60"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-1 h-full w-px bg-zinc-800" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
            {item.title}
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          {item.description}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {item.source}
          </span>
          <span className="text-[10px] text-zinc-600">
            {timeAgo(item.timestamp)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
        <Activity className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">No recent activity</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Workspace activity will appear here as events occur.
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export function WorkspaceActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const data = await fetchActivityFeed(activeCategory);
        setItems(data);
      } catch {
        // Silent fail — retry on next interval
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCategory],
  );

  useEffect(() => {
    setLoading(true);
    loadData();

    intervalRef.current = setInterval(() => loadData(), AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const handleOpen = useCallback((item: ActivityItem) => {
    if (item.actionUrl) {
      window.location.href = item.actionUrl;
    }
  }, []);

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-200">
            Workspace Activity
          </h2>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800/50 px-4 py-2">
        {CATEGORY_OPTIONS.map((filter) => {
          const isActive =
            filter.value === activeCategory ||
            (filter.value === null && activeCategory === null);

          return (
            <button
              key={filter.key}
              onClick={() => setActiveCategory(filter.value)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-red-500/20 text-red-400"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => (
              <ActivityCard key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          <span className="text-[10px] text-zinc-600">
            {items.length} {items.length === 1 ? "event" : "events"}
          </span>
          <span className="text-[10px] text-zinc-600">
            Auto-refreshing every 10s
          </span>
        </div>
      )}
    </div>
  );
}
