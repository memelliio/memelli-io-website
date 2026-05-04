"use client";

import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useWorkspaceTabStore } from "@/stores/workspace-store";
import { useAuth } from "@/contexts/auth";

// ─── Context Snapshot Type ──────────────────────────────────────────────

export interface ContextSnapshot {
  // User context
  userId: string | null;
  userRole: string | null;

  // Workspace context
  activeWorkspace: string;
  activeWorkspaceId: string;
  activeTab: { id: string; type: string; title: string; route?: string } | null;
  openTabCount: number;
  openTabTypes: string[];

  // Entity context
  entityId: string | null;
  entityType: string | null;

  // Navigation context
  currentRoute: string;
  previousRoute: string | null;

  // Recent actions (last 10)
  recentActions: Array<{ action: string; timestamp: string; detail?: string }>;

  // System context (populated from real API data)
  systemAlerts: number;
  activeAgents: number;
  queueDepth: number;
  recentEvents: number;

  // Session context
  sessionStarted: string;
  actionCount: number;
}

// ─── Context Engine ─────────────────────────────────────────────────────

interface ContextEngineValue {
  getSnapshot: () => ContextSnapshot;
  recordAction: (action: string, detail?: string) => void;
  getContextForPrompt: () => string; // Compact string for LLM injection
}

const DEFAULT_SNAPSHOT: ContextSnapshot = {
  userId: null, userRole: null,
  activeWorkspace: "Operations", activeWorkspaceId: "default",
  activeTab: null, openTabCount: 0, openTabTypes: [],
  entityId: null, entityType: null,
  currentRoute: "/dashboard", previousRoute: null,
  recentActions: [], systemAlerts: 0, activeAgents: 0,
  queueDepth: 0, recentEvents: 0,
  sessionStarted: new Date().toISOString(), actionCount: 0,
};

const ContextEngineContext = createContext<ContextEngineValue>({
  getSnapshot: () => DEFAULT_SNAPSHOT,
  recordAction: () => {},
  getContextForPrompt: () => "",
});

export function useContextEngine() {
  return useContext(ContextEngineContext);
}

export function ContextEngineProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const previousRouteRef = useRef<string | null>(null);
  const recentActionsRef = useRef<Array<{ action: string; timestamp: string; detail?: string }>>([]);
  const actionCountRef = useRef(0);
  const sessionStartRef = useRef(new Date().toISOString());

  // Real-time system context from API
  const [systemContext, setSystemContext] = useState({
    systemAlerts: 0,
    activeAgents: 0,
    queueDepth: 0,
    recentEvents: 0,
  });

  // Fetch system context after a short delay (non-critical for first paint),
  // then refresh every 30 seconds.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchSystemContext = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiUrl}/api/context/system`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          if (json?.data) {
            setSystemContext({
              systemAlerts: json.data.systemAlerts ?? 0,
              activeAgents: json.data.activeAgents ?? 0,
              queueDepth: json.data.queueDepth ?? 0,
              recentEvents: json.data.recentEvents ?? 0,
            });
          }
        }
      } catch {
        // Non-fatal — system context is best-effort
      }
    };

    // Defer initial fetch so it doesn't compete with critical page data
    const delayTimer = setTimeout(() => {
      if (!cancelled) {
        fetchSystemContext();
        interval = setInterval(fetchSystemContext, 30_000);
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      if (interval) clearInterval(interval);
    };
  }, []);

  const recordAction = useCallback((action: string, detail?: string) => {
    recentActionsRef.current = [
      { action, timestamp: new Date().toISOString(), detail },
      ...recentActionsRef.current.slice(0, 9), // keep last 10
    ];
    actionCountRef.current++;
  }, []);

  // Track route changes as actions
  useEffect(() => {
    if (previousRouteRef.current && previousRouteRef.current !== pathname) {
      recordAction("navigate", pathname);
    }
    previousRouteRef.current = pathname;
  }, [pathname, recordAction]);

  const getSnapshot = useCallback((): ContextSnapshot => {
    const store = useWorkspaceTabStore.getState();
    const workspace = store.getActiveWorkspace();
    const activeTab = store.getActiveTab();

    return {
      userId: (user as any)?.sub ?? null,
      userRole: (user as any)?.role ?? null,
      activeWorkspace: workspace?.name ?? "Operations",
      activeWorkspaceId: store.activeWorkspaceId,
      activeTab: activeTab ? {
        id: activeTab.id,
        type: activeTab.type,
        title: activeTab.title,
        route: activeTab.route,
      } : null,
      openTabCount: workspace?.tabs?.length ?? 0,
      openTabTypes: (workspace?.tabs ?? []).map(t => t.type),
      entityId: activeTab?.entityId ?? null,
      entityType: activeTab?.entityType ?? null,
      currentRoute: pathname,
      previousRoute: previousRouteRef.current,
      recentActions: recentActionsRef.current,
      systemAlerts: systemContext.systemAlerts,
      activeAgents: systemContext.activeAgents,
      queueDepth: systemContext.queueDepth,
      recentEvents: systemContext.recentEvents,
      sessionStarted: sessionStartRef.current,
      actionCount: actionCountRef.current,
    };
  }, [pathname, user, systemContext]);

  const getContextForPrompt = useCallback((): string => {
    const snap = getSnapshot();
    const parts: string[] = [];
    parts.push(`Workspace: ${snap.activeWorkspace}`);
    if (snap.activeTab) {
      parts.push(`Active tab: "${snap.activeTab.title}" (${snap.activeTab.type})`);
    }
    if (snap.entityId) {
      parts.push(`Viewing: ${snap.entityType} ${snap.entityId}`);
    }
    parts.push(`Open tabs: ${snap.openTabCount}`);
    if (snap.recentActions.length > 0) {
      const recent = snap.recentActions.slice(0, 3).map(a => a.action).join(", ");
      parts.push(`Recent: ${recent}`);
    }
    return parts.join(". ");
  }, [getSnapshot]);

  return (
    <ContextEngineContext.Provider value={{ getSnapshot, recordAction, getContextForPrompt }}>
      {children}
    </ContextEngineContext.Provider>
  );
}
