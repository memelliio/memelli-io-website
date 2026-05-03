"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  ChevronRight,
  Info,
  Bell,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useUIStore } from "@/stores/ui";

// --- Types ---

type AlertPriority = "CRITICAL" | "HIGH" | "NORMAL";

interface AlertItem {
  id: string;
  priority: AlertPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  dismissed: boolean;
}

// --- Constants ---

const PRIORITY_ORDER: Record<AlertPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
};

const PRIORITY_STYLES: Record<
  AlertPriority,
  { dot: string; text: string; accent: string }
> = {
  CRITICAL: {
    dot: "bg-red-500",
    text: "text-red-300",
    accent: "text-red-400 hover:text-red-300",
  },
  HIGH: {
    dot: "bg-orange-500",
    text: "text-orange-300",
    accent: "text-orange-400 hover:text-orange-300",
  },
  NORMAL: {
    dot: "bg-yellow-500",
    text: "text-yellow-300",
    accent: "text-yellow-400 hover:text-yellow-300",
  },
};

const AUTO_DISMISS_MS = 30_000;
const POLL_INTERVAL_MS = 10_000;

// --- Helpers ---

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function getPriorityIcon(priority: AlertPriority) {
  switch (priority) {
    case "CRITICAL":
      return ShieldAlert;
    case "HIGH":
      return AlertTriangle;
    case "NORMAL":
      return Info;
    default:
      return AlertTriangle;
  }
}

async function fetchAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/admin/notifications-v2/alerts`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).filter((a: AlertItem) => !a.dismissed);
  } catch {
    return [];
  }
}

async function dismissAlert(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/admin/notifications-v2/${id}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
  } catch {
    // Silent fail
  }
}

// --- Main Component ---

export function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const toggleNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const autoDismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAlerts = useCallback(async () => {
    const data = await fetchAlerts();
    setAlerts(data);
    // Reset dismissed state when new alerts arrive
    if (data.length > 0) {
      setDismissed(false);
    }
  }, []);

  // Schedule auto-dismiss for non-critical alerts
  useEffect(() => {
    for (const alert of alerts) {
      if (
        alert.priority !== "CRITICAL" &&
        !autoDismissTimers.current.has(alert.id)
      ) {
        const timer = setTimeout(() => {
          handleDismissOne(alert.id);
          autoDismissTimers.current.delete(alert.id);
        }, AUTO_DISMISS_MS);
        autoDismissTimers.current.set(alert.id, timer);
      }
    }

    return () => {
      for (const [id, timer] of autoDismissTimers.current) {
        if (!alerts.find((a) => a.id === id)) {
          clearTimeout(timer);
          autoDismissTimers.current.delete(id);
        }
      }
    };
  }, [alerts]);

  useEffect(() => {
    loadAlerts();
    intervalRef.current = setInterval(loadAlerts, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const timer of autoDismissTimers.current.values()) {
        clearTimeout(timer);
      }
    };
  }, [loadAlerts]);

  const handleDismissOne = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    const timer = autoDismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      autoDismissTimers.current.delete(id);
    }

    dismissAlert(id);
  }, []);

  const handleDismissVisible = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    toggleNotificationPanel();
  }, [toggleNotificationPanel]);

  if (alerts.length === 0 || dismissed) return null;

  // Sort by priority and show only the top one
  const sorted = [...alerts].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3),
  );
  const topAlert = sorted[0];
  const remainingCount = sorted.length - 1;

  const style = PRIORITY_STYLES[topAlert.priority] || PRIORITY_STYLES.NORMAL;
  const Icon = getPriorityIcon(topAlert.priority);

  return (
    <div
      className="fixed left-0 right-0 top-0 z-40 pointer-events-none"
      style={{ paddingLeft: "var(--sidebar-width, 0px)" }}
    >
      <div
        className="pointer-events-auto flex items-center gap-2 px-4 py-1.5 bg-zinc-900/90 backdrop-blur-md border-b border-white/[0.06]"
        role="alert"
      >
        {/* Priority dot */}
        <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />

        {/* Icon */}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${style.text}`} />

        {/* Content - single line */}
        <span className={`text-xs font-medium truncate ${style.text}`}>
          {topAlert.title}
        </span>
        <span className="text-xs text-zinc-500 truncate hidden sm:inline">
          {topAlert.message}
        </span>

        {/* Action link */}
        {topAlert.actionUrl && (
          <a
            href={topAlert.actionUrl}
            className={`shrink-0 flex items-center gap-0.5 text-[11px] font-medium transition-colors ${style.accent}`}
          >
            {topAlert.actionLabel || "View"}
            <ChevronRight className="h-3 w-3" />
          </a>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* "+N more" badge */}
        {remainingCount > 0 && (
          <button
            onClick={handleOpenNotifications}
            className="shrink-0 flex items-center gap-1 rounded-full bg-zinc-800/80 border border-white/[0.06] px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80 transition-colors"
          >
            <Bell className="h-3 w-3" />
            +{remainingCount} more
          </button>
        )}

        {/* Dismiss X */}
        <button
          onClick={handleDismissVisible}
          className="shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
