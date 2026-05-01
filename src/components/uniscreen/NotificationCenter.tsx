"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Filter,
  Info,
  Layers,
  MessageSquare,
  Pin,
  ShieldAlert,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";

// ─── Types ──────────────────────────────────────────────────────────────

type AttentionLevel = "low" | "medium" | "high" | "critical";

type NotificationCategory =
  | "informational"
  | "task_update"
  | "client_activity"
  | "pipeline_update"
  | "work_order_status"
  | "system_warning"
  | "critical_alert";

interface AttentionNotification {
  id: string;
  tenantId: string;
  userId?: string;
  category: NotificationCategory;
  attention: AttentionLevel;
  title: string;
  message: string;
  source: string;
  sourceId?: string;
  groupKey?: string;
  read: boolean;
  pinned: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

interface GroupedNotification {
  groupKey: string;
  category: NotificationCategory;
  count: number;
  latest: AttentionNotification;
  items: AttentionNotification[];
}

interface AttentionSummary {
  unread: number;
  byAttention: Record<AttentionLevel, number>;
  byCategory: Record<string, number>;
  critical: AttentionNotification[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const CATEGORY_FILTERS: Array<{
  key: string;
  label: string;
  value: NotificationCategory | null;
}> = [
  { key: "all", label: "All", value: null },
  { key: "tasks", label: "Tasks", value: "task_update" },
  { key: "clients", label: "Clients", value: "client_activity" },
  { key: "pipeline", label: "Pipeline", value: "pipeline_update" },
  { key: "work_orders", label: "Work Orders", value: "work_order_status" },
  { key: "system", label: "System", value: "system_warning" },
  { key: "critical", label: "Critical", value: "critical_alert" },
];

const ATTENTION_FILTERS: Array<{
  key: string;
  label: string;
  value: AttentionLevel | null;
}> = [
  { key: "all", label: "All Levels", value: null },
  { key: "critical", label: "Critical", value: "critical" },
  { key: "high", label: "High", value: "high" },
  { key: "medium", label: "Medium", value: "medium" },
  { key: "low", label: "Low", value: "low" },
];

const ATTENTION_COLORS: Record<AttentionLevel, string> = {
  low: "border-l-zinc-500",
  medium: "border-l-blue-500",
  high: "border-l-amber-500",
  critical: "border-l-red-500",
};

const ATTENTION_DOT_COLORS: Record<AttentionLevel, string> = {
  low: "bg-zinc-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

// ─── Helpers ────────────────────────────────────────────────────────────

function getCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case "informational":
      return Info;
    case "task_update":
      return Wrench;
    case "client_activity":
      return Users;
    case "pipeline_update":
      return TrendingUp;
    case "work_order_status":
      return Layers;
    case "system_warning":
      return AlertTriangle;
    case "critical_alert":
      return ShieldAlert;
    default:
      return Bell;
  }
}

function getCategoryLabel(category: NotificationCategory): string {
  switch (category) {
    case "informational":
      return "Info";
    case "task_update":
      return "Task";
    case "client_activity":
      return "Client";
    case "pipeline_update":
      return "Pipeline";
    case "work_order_status":
      return "Work Order";
    case "system_warning":
      return "System";
    case "critical_alert":
      return "Critical";
    default:
      return "Notification";
  }
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

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── API Functions ──────────────────────────────────────────────────────

async function fetchGrouped(
  category?: NotificationCategory | null,
  limit = 200,
): Promise<GroupedNotification[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("limit", String(limit));

  const res = await fetch(
    `${API_URL}/api/admin/notifications-v2/grouped?${params}`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

async function fetchSummary(): Promise<AttentionSummary | null> {
  const res = await fetch(`${API_URL}/api/admin/notifications-v2/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

async function apiMarkRead(ids: string[]): Promise<void> {
  await fetch(`${API_URL}/api/admin/notifications-v2/mark-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ ids }),
  });
}

async function apiMarkAllRead(category?: string): Promise<void> {
  await fetch(`${API_URL}/api/admin/notifications-v2/mark-all-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ category }),
  });
}

async function apiPinNotification(id: string): Promise<void> {
  await fetch(`${API_URL}/api/admin/notifications-v2/${id}/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
}

async function apiArchiveNotification(id: string): Promise<void> {
  await fetch(`${API_URL}/api/admin/notifications-v2/${id}/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
}

// ─── Notification Card ──────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkRead,
  onPin,
  onArchive,
}: {
  notification: AttentionNotification;
  onMarkRead: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const Icon = getCategoryIcon(notification.category);
  const borderColor = ATTENTION_COLORS[notification.attention];
  const isUnread = !notification.read;

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-lg border-l-[3px] px-3 py-3 transition-all duration-200 ${borderColor} ${
        isUnread
          ? "bg-zinc-800/80 hover:bg-zinc-800"
          : "bg-zinc-900/50 hover:bg-zinc-800/40"
      }`}
    >
      {/* Category icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUnread ? "bg-zinc-700/80" : "bg-zinc-800/60"
        }`}
      >
        <Icon className="h-4 w-4 text-zinc-300" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isUnread ? "text-zinc-100" : "text-zinc-400"
            }`}
          >
            {notification.title}
          </span>
          {notification.pinned && (
            <Pin className="h-3 w-3 text-red-400" />
          )}
          {isUnread && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          )}
        </div>

        <p
          className={`mt-0.5 text-xs leading-relaxed ${
            isUnread ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {notification.message}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          {/* Source badge */}
          <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {notification.source}
          </span>

          {/* Attention dot */}
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              ATTENTION_DOT_COLORS[notification.attention]
            }`}
          />

          {/* Time */}
          <span className="text-[10px] text-zinc-600">
            {timeAgo(notification.createdAt)}
          </span>

          {/* Action button */}
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="ml-auto flex items-center gap-1 rounded bg-zinc-700/40 px-2 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-zinc-700"
            >
              {notification.actionLabel || "View"}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {isUnread && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onPin(notification.id)}
          className={`rounded p-1 transition-colors hover:bg-zinc-700 ${
            notification.pinned
              ? "text-red-400 hover:text-red-300"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          title={notification.pinned ? "Unpin" : "Pin"}
        >
          <Pin className="h-3 w-3" />
        </button>
        <button
          onClick={() => onArchive(notification.id)}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
          title="Archive"
        >
          <Archive className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Grouped Notification Section ───────────────────────────────────────

function GroupedSection({
  group,
  onMarkRead,
  onPin,
  onArchive,
}: {
  group: GroupedNotification;
  onMarkRead: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSingle = group.count === 1;

  if (isSingle) {
    return (
      <NotificationCard
        notification={group.items[0]}
        onMarkRead={onMarkRead}
        onPin={onPin}
        onArchive={onArchive}
      />
    );
  }

  const label = getCategoryLabel(group.category);
  const Icon = getCategoryIcon(group.category);
  const unreadCount = group.items.filter((n) => !n.read).length;

  return (
    <div className="overflow-hidden rounded-lg">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 bg-zinc-800/60 px-3 py-2 text-left transition-colors hover:bg-zinc-800"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-300">
          {group.count} {label.toLowerCase()} updates
        </span>
        {unreadCount > 0 && (
          <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
            {unreadCount}
          </span>
        )}
        <span className="text-[10px] text-zinc-600">
          {timeAgo(group.latest.createdAt)}
        </span>
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="space-y-1 border-l border-zinc-700/50 pl-1 pt-1">
          {group.items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
              onPin={onPin}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
      </div>
      <h3 className="text-sm font-medium text-zinc-300">All clear</h3>
      <p className="mt-1 text-xs text-zinc-500">
        No notifications to display. You are up to date.
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function NotificationCenter() {
  const [groups, setGroups] = useState<GroupedNotification[]>([]);
  const [summary, setSummary] = useState<AttentionSummary | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    NotificationCategory | null
  >(null);
  const [activeAttention, setActiveAttention] =
    useState<AttentionLevel | null>(null);
  const [showAttentionFilter, setShowAttentionFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updateTabBadge = useWorkspaceTabStore((s) => s.updateTabBadge);

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      const [groupsData, summaryData] = await Promise.all([
        fetchGrouped(activeCategory),
        fetchSummary(),
      ]);

      // Filter by attention level client-side if set
      let filtered = groupsData;
      if (activeAttention) {
        filtered = groupsData
          .map((g) => ({
            ...g,
            items: g.items.filter((n) => n.attention === activeAttention),
            count: g.items.filter((n) => n.attention === activeAttention)
              .length,
            latest:
              g.items.filter((n) => n.attention === activeAttention)[0] ||
              g.latest,
          }))
          .filter((g) => g.count > 0);
      }

      setGroups(filtered);
      setSummary(summaryData);
    } catch {
      // Silent fail — retry on next interval
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeAttention]);

  useEffect(() => {
    setLoading(true);
    loadData();

    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(loadData, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  // Optimistic mark read
  const handleMarkRead = useCallback(
    async (id: string) => {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
          latest:
            g.latest.id === id ? { ...g.latest, read: true } : g.latest,
        })),
      );
      setSummary((prev) =>
        prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev,
      );
      await apiMarkRead([id]);
    },
    [],
  );

  // Mark all read
  const handleMarkAllRead = useCallback(async () => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((n) => ({ ...n, read: true })),
        latest: { ...g.latest, read: true },
      })),
    );
    setSummary((prev) => (prev ? { ...prev, unread: 0 } : prev));
    await apiMarkAllRead(activeCategory || undefined);
  }, [activeCategory]);

  // Optimistic pin
  const handlePin = useCallback(async (id: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((n) =>
          n.id === id ? { ...n, pinned: !n.pinned } : n,
        ),
        latest:
          g.latest.id === id
            ? { ...g.latest, pinned: !g.latest.pinned }
            : g.latest,
      })),
    );
    await apiPinNotification(id);
  }, []);

  // Optimistic archive
  const handleArchive = useCallback(async (id: string) => {
    setGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          items: g.items.filter((n) => n.id !== id),
          count: g.items.filter((n) => n.id !== id).length,
          latest:
            g.latest.id === id
              ? g.items.find((n) => n.id !== id) || g.latest
              : g.latest,
        }))
        .filter((g) => g.count > 0),
    );
    await apiArchiveNotification(id);
  }, []);

  const unreadCount = summary?.unread || 0;

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-200">
            Notification Center
          </h2>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[11px] font-bold text-red-400">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Attention level filter toggle */}
          <button
            onClick={() => setShowAttentionFilter(!showAttentionFilter)}
            className={`rounded-md p-1.5 transition-colors ${
              showAttentionFilter || activeAttention
                ? "bg-red-500/20 text-red-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            title="Filter by attention level"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800/50 px-4 py-2">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive =
            filter.value === activeCategory ||
            (filter.value === null && activeCategory === null);
          const categoryCount =
            filter.value && summary?.byCategory
              ? summary.byCategory[filter.value] || 0
              : null;

          return (
            <button
              key={filter.key}
              onClick={() => setActiveCategory(filter.value)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-red-500/20 text-red-400"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {filter.label}
              {categoryCount !== null && categoryCount > 0 && (
                <span
                  className={`ml-0.5 text-[10px] ${
                    isActive ? "text-red-400/70" : "text-zinc-600"
                  }`}
                >
                  {categoryCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Attention Level Filter ─────────────────────────────────────── */}
      {showAttentionFilter && (
        <div className="flex gap-1 border-b border-zinc-800/50 px-4 py-2">
          {ATTENTION_FILTERS.map((filter) => {
            const isActive =
              filter.value === activeAttention ||
              (filter.value === null && activeAttention === null);
            const levelCount =
              filter.value && summary?.byAttention
                ? summary.byAttention[filter.value] || 0
                : null;

            return (
              <button
                key={filter.key}
                onClick={() => setActiveAttention(filter.value)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-red-500/20 text-red-400"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                {filter.value && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      ATTENTION_DOT_COLORS[filter.value] || ""
                    }`}
                  />
                )}
                {filter.label}
                {levelCount !== null && levelCount > 0 && (
                  <span
                    className={`text-[10px] ${
                      isActive ? "text-red-400/70" : "text-zinc-600"
                    }`}
                  >
                    {levelCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Critical Banner ────────────────────────────────────────────── */}
      {summary &&
        summary.critical.length > 0 &&
        activeCategory !== "critical_alert" && (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-xs font-medium text-red-300">
              {summary.critical.length} critical{" "}
              {summary.critical.length === 1 ? "alert" : "alerts"} requiring
              attention
            </span>
            <button
              onClick={() => setActiveCategory("critical_alert")}
              className="ml-auto text-[10px] font-medium text-red-400 transition-colors hover:text-red-300"
            >
              View
            </button>
          </div>
        )}

      {/* ── Notification List ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1.5">
            {/* Pinned notifications first */}
            {groups
              .flatMap((g) => g.items)
              .filter((n) => n.pinned)
              .map((n) => (
                <NotificationCard
                  key={`pinned-${n.id}`}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onPin={handlePin}
                  onArchive={handleArchive}
                />
              ))}

            {/* Grouped sections */}
            {groups.map((group) => {
              // Filter out pinned items (already shown above)
              const unpinnedItems = group.items.filter((n) => !n.pinned);
              if (unpinnedItems.length === 0) return null;

              const adjustedGroup = {
                ...group,
                items: unpinnedItems,
                count: unpinnedItems.length,
                latest: unpinnedItems[0] || group.latest,
              };

              return (
                <GroupedSection
                  key={group.groupKey}
                  group={adjustedGroup}
                  onMarkRead={handleMarkRead}
                  onPin={handlePin}
                  onArchive={handleArchive}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer Status ──────────────────────────────────────────────── */}
      {summary && !loading && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            {(["critical", "high", "medium", "low"] as AttentionLevel[]).map(
              (level) => {
                const count = summary.byAttention[level] || 0;
                if (count === 0) return null;
                return (
                  <div
                    key={level}
                    className="flex items-center gap-1 text-[10px] text-zinc-500"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ATTENTION_DOT_COLORS[level]}`}
                    />
                    {count} {level}
                  </div>
                );
              },
            )}
          </div>
          <span className="text-[10px] text-zinc-600">
            Auto-refreshing every 10s
          </span>
        </div>
      )}
    </div>
  );
}
