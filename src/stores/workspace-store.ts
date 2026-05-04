// Workspace Store — UniScreen State Management
// Manages workspaces, tabs, active states, and workspace memory

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────

export type TabType =
  | "client_profile"
  | "credit_report"
  | "pipeline"
  | "report"
  | "email_thread"
  | "task_board"
  | "deployment_log"
  | "lesson_module"
  | "analytics_dashboard"
  | "workflow_builder"
  | "contacts"
  | "deals"
  | "stores"
  | "products"
  | "orders"
  | "notifications"
  | "settings"
  | "agents"
  | "ai"
  | "commerce"
  | "crm"
  | "coaching"
  | "seo"
  | "credit"
  | "funding"
  | "activities"
  | "campaign-analytics"
  | "omniflow-builder"
  | "omniflow-dashboard"
  | "omniflow-execution"
  | "custom";

export type SurfaceType = "primary" | "secondary" | "floating" | "overlay";

export interface SurfacePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  icon?: string;
  entityId?: string;
  entityType?: string;
  route?: string;
  pinned?: boolean;
  alertBadge?: number;
  state?: Record<string, unknown>;
  /** Tracks how the tab was opened — "mua" means opened by Melli/AI */
  source?: "user" | "mua";
  /** Surface type determines how the tab renders in the layout */
  surfaceType?: SurfaceType;
  /** Position and size for floating surfaces */
  position?: SurfacePosition;
  createdAt: string;
}

export type LayoutMode = "single" | "split" | "grid" | "focus";

export interface SplitConfig {
  direction: "horizontal" | "vertical";
  sizes: number[];
}

export interface DockItem {
  id: string;
  tabId: string;
  title: string;
  type: string;
  icon?: string;
}

export interface SurfaceHistoryEntry {
  tabId: string;
  title: string;
  type: string;
  openedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  tabs: Tab[];
  activeTabId: string | null;
  /** Secondary active tab for split/grid modes */
  secondaryTabIds: string[];
  layoutMode: LayoutMode;
  splitConfig?: SplitConfig;
  createdAt: string;
}

export interface WorkspaceAction {
  type:
    | "open_tab"
    | "close_tab"
    | "switch_tab"
    | "pin_tab"
    | "rename_tab"
    | "update_tab"
    | "create_report_tab"
    | "open_entity_tab"
    | "open_related_tabs"
    | "focus_tab"
    | "switch_workspace"
    | "create_workspace"
    | "set_layout_mode"
    | "split_with_tab"
    | "add_to_dock"
    | "remove_from_dock";
  payload: Record<string, unknown>;
}

// ─── Constants ──────────────────────────────────────────────────────

const MAX_TABS_PER_WORKSPACE = 20;

const MAX_SURFACE_HISTORY = 20;

const DEFAULT_WORKSPACE: Workspace = {
  id: "default",
  name: "Operations",
  icon: "command",
  tabs: [],
  activeTabId: null,
  secondaryTabIds: [],
  layoutMode: "single",
  createdAt: new Date().toISOString(),
};

// ─── Store Interface ────────────────────────────────────────────────

interface WorkspaceStore {
  // ── State ─────────────────────────────────────────────────────────
  workspaces: Workspace[];
  activeWorkspaceId: string;
  dockItems: DockItem[];
  surfaceHistory: SurfaceHistoryEntry[];

  // ── Workspace Actions ─────────────────────────────────────────────
  createWorkspace: (name: string, icon?: string) => string;
  deleteWorkspace: (workspaceId: string) => void;
  switchWorkspace: (workspaceId: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;

  // ── Tab Actions ───────────────────────────────────────────────────
  openTab: (tab: Omit<Tab, "id" | "createdAt">) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  renameTab: (tabId: string, title: string) => void;
  updateTabState: (tabId: string, state: Record<string, unknown>) => void;
  updateTabBadge: (tabId: string, badge: number | undefined) => void;
  moveTab: (tabId: string, newIndex: number) => void;

  // ── Layout Actions ────────────────────────────────────────────────
  setLayoutMode: (mode: LayoutMode) => void;
  setSplitConfig: (config: SplitConfig) => void;
  splitWithTab: (
    existingTabId: string,
    newTabId: string,
    direction: "horizontal" | "vertical",
  ) => void;

  // ── Dock Actions ──────────────────────────────────────────────────
  addToDock: (tabId: string) => void;
  removeFromDock: (tabId: string) => void;

  // ── Convenience ───────────────────────────────────────────────────
  getActiveWorkspace: () => Workspace;
  getActiveTab: () => Tab | null;
  getSecondaryTabs: () => Tab[];
  findTabByRoute: (route: string) => Tab | null;
  findTabByEntity: (entityType: string, entityId: string) => Tab | null;
  openOrFocusTab: (tab: Omit<Tab, "id" | "createdAt">) => string;
  duplicateTab: (tabId: string) => string;

  // ── MUA Integration ───────────────────────────────────────────────
  executeWorkspaceAction: (action: WorkspaceAction) => void;
}

// ─── Helper ─────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Store ──────────────────────────────────────────────────────────

export const useWorkspaceTabStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // ── State ───────────────────────────────────────────────────────
      workspaces: [{ ...DEFAULT_WORKSPACE }],
      activeWorkspaceId: "default",
      dockItems: [],
      surfaceHistory: [],

      // ── Workspace Actions ───────────────────────────────────────────

      createWorkspace: (name: string, icon?: string) => {
        const id = generateId();
        const workspace: Workspace = {
          id,
          name,
          icon,
          tabs: [],
          activeTabId: null,
          secondaryTabIds: [],
          layoutMode: "single",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspaceId: id,
        }));
        return id;
      },

      deleteWorkspace: (workspaceId: string) => {
        // Cannot delete the default workspace
        if (workspaceId === "default") return;

        set((state) => {
          const filtered = state.workspaces.filter(
            (w) => w.id !== workspaceId,
          );
          const newActiveId =
            state.activeWorkspaceId === workspaceId
              ? "default"
              : state.activeWorkspaceId;
          return { workspaces: filtered, activeWorkspaceId: newActiveId };
        });
      },

      switchWorkspace: (workspaceId: string) => {
        const exists = get().workspaces.some((w) => w.id === workspaceId);
        if (exists) {
          set({ activeWorkspaceId: workspaceId });
        }
      },

      renameWorkspace: (workspaceId: string, name: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, name } : w,
          ),
        }));
      },

      // ── Tab Actions ─────────────────────────────────────────────────

      openTab: (tabInput: Omit<Tab, "id" | "createdAt">) => {
        const state = get();
        const workspace = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        if (!workspace) return "";

        // If a tab with the same route already exists, focus it
        if (tabInput.route) {
          const existing = workspace.tabs.find(
            (t) => t.route === tabInput.route,
          );
          if (existing) {
            set((s) => ({
              workspaces: s.workspaces.map((w) =>
                w.id === s.activeWorkspaceId
                  ? { ...w, activeTabId: existing.id }
                  : w,
              ),
            }));
            return existing.id;
          }
        }

        // Enforce max tabs
        if (workspace.tabs.length >= MAX_TABS_PER_WORKSPACE) {
          // Close the oldest non-pinned tab
          const unpinned = workspace.tabs.filter((t) => !t.pinned);
          if (unpinned.length > 0) {
            const oldest = unpinned[0];
            get().closeTab(oldest.id);
          } else {
            // All tabs are pinned, cannot open more
            return "";
          }
        }

        const id = generateId();
        const tab: Tab = {
          ...tabInput,
          id,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === s.activeWorkspaceId
              ? { ...w, tabs: [...w.tabs, tab], activeTabId: id }
              : w,
          ),
          surfaceHistory: [
            {
              tabId: id,
              title: tab.title,
              type: tab.type,
              openedAt: tab.createdAt,
            },
            ...s.surfaceHistory,
          ].slice(0, MAX_SURFACE_HISTORY),
        }));

        return id;
      },

      closeTab: (tabId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;

            const tabIndex = w.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return w;

            const newTabs = w.tabs.filter((t) => t.id !== tabId);
            let newActiveTabId = w.activeTabId;

            // If we closed the active tab, switch to an adjacent one
            if (w.activeTabId === tabId) {
              if (newTabs.length === 0) {
                newActiveTabId = null;
              } else {
                // Prefer the tab to the right, fall back to the left
                const nextIndex = Math.min(tabIndex, newTabs.length - 1);
                newActiveTabId = newTabs[nextIndex].id;
              }
            }

            return { ...w, tabs: newTabs, activeTabId: newActiveTabId };
          }),
        }));
      },

      switchTab: (tabId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, activeTabId: tabId }
              : w,
          ),
        }));
      },

      pinTab: (tabId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  tabs: w.tabs.map((t) =>
                    t.id === tabId ? { ...t, pinned: true } : t,
                  ),
                }
              : w,
          ),
        }));
      },

      unpinTab: (tabId: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  tabs: w.tabs.map((t) =>
                    t.id === tabId ? { ...t, pinned: false } : t,
                  ),
                }
              : w,
          ),
        }));
      },

      renameTab: (tabId: string, title: string) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  tabs: w.tabs.map((t) =>
                    t.id === tabId ? { ...t, title } : t,
                  ),
                }
              : w,
          ),
        }));
      },

      updateTabState: (tabId: string, tabState: Record<string, unknown>) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  tabs: w.tabs.map((t) =>
                    t.id === tabId
                      ? { ...t, state: { ...t.state, ...tabState } }
                      : t,
                  ),
                }
              : w,
          ),
        }));
      },

      updateTabBadge: (tabId: string, badge: number | undefined) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  tabs: w.tabs.map((t) =>
                    t.id === tabId ? { ...t, alertBadge: badge } : t,
                  ),
                }
              : w,
          ),
        }));
      },

      moveTab: (tabId: string, newIndex: number) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;

            const tabs = [...w.tabs];
            const currentIndex = tabs.findIndex((t) => t.id === tabId);
            if (currentIndex === -1) return w;

            const [tab] = tabs.splice(currentIndex, 1);
            const clampedIndex = Math.max(
              0,
              Math.min(newIndex, tabs.length),
            );
            tabs.splice(clampedIndex, 0, tab);

            return { ...w, tabs };
          }),
        }));
      },

      // ── Layout Actions ───────────────────────────────────────────────

      setLayoutMode: (mode: LayoutMode) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  layoutMode: mode,
                  // Reset secondary tabs when switching to single/focus
                  secondaryTabIds:
                    mode === "single" || mode === "focus"
                      ? []
                      : w.secondaryTabIds,
                }
              : w,
          ),
        }));
      },

      setSplitConfig: (config: SplitConfig) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, splitConfig: config }
              : w,
          ),
        }));
      },

      splitWithTab: (
        existingTabId: string,
        newTabId: string,
        direction: "horizontal" | "vertical",
      ) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            // Ensure both tabs exist
            const hasExisting = w.tabs.some((t) => t.id === existingTabId);
            const hasNew = w.tabs.some((t) => t.id === newTabId);
            if (!hasExisting || !hasNew) return w;
            return {
              ...w,
              layoutMode: "split" as LayoutMode,
              activeTabId: existingTabId,
              secondaryTabIds: [newTabId],
              splitConfig: { direction, sizes: [50, 50] },
            };
          }),
        }));
      },

      // ── Dock Actions ──────────────────────────────────────────────────

      addToDock: (tabId: string) => {
        const state = get();
        // Already in dock
        if (state.dockItems.some((d) => d.tabId === tabId)) return;
        const workspace = state.getActiveWorkspace();
        const tab = workspace?.tabs.find((t) => t.id === tabId);
        if (!tab) return;
        set((s) => ({
          dockItems: [
            ...s.dockItems,
            {
              id: generateId(),
              tabId: tab.id,
              title: tab.title,
              type: tab.type,
              icon: tab.icon,
            },
          ],
        }));
      },

      removeFromDock: (tabId: string) => {
        set((s) => ({
          dockItems: s.dockItems.filter((d) => d.tabId !== tabId),
        }));
      },

      // ── Convenience ─────────────────────────────────────────────────

      getActiveWorkspace: () => {
        const state = get();
        return (
          state.workspaces.find((w) => w.id === state.activeWorkspaceId) ??
          state.workspaces[0]
        );
      },

      getActiveTab: () => {
        const workspace = get().getActiveWorkspace();
        if (!workspace?.activeTabId) return null;
        return (
          workspace.tabs.find((t) => t.id === workspace.activeTabId) ?? null
        );
      },

      findTabByRoute: (route: string) => {
        const workspace = get().getActiveWorkspace();
        return workspace?.tabs.find((t) => t.route === route) ?? null;
      },

      findTabByEntity: (entityType: string, entityId: string) => {
        const workspace = get().getActiveWorkspace();
        return (
          workspace?.tabs.find(
            (t) => t.entityType === entityType && t.entityId === entityId,
          ) ?? null
        );
      },

      getSecondaryTabs: () => {
        const workspace = get().getActiveWorkspace();
        if (!workspace) return [];
        return workspace.secondaryTabIds
          .map((id) => workspace.tabs.find((t) => t.id === id))
          .filter(Boolean) as Tab[];
      },

      duplicateTab: (tabId: string) => {
        const workspace = get().getActiveWorkspace();
        const tab = workspace?.tabs.find((t) => t.id === tabId);
        if (!tab) return "";
        return get().openTab({
          type: tab.type,
          title: `${tab.title} (copy)`,
          icon: tab.icon,
          entityId: tab.entityId,
          entityType: tab.entityType,
          route: tab.route,
          state: tab.state ? { ...tab.state } : undefined,
          source: tab.source,
          surfaceType: tab.surfaceType,
        });
      },

      openOrFocusTab: (tabInput: Omit<Tab, "id" | "createdAt">) => {
        const state = get();
        const workspace = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        if (!workspace) return "";

        // Check by entity match first
        if (tabInput.entityType && tabInput.entityId) {
          const existing = workspace.tabs.find(
            (t) =>
              t.entityType === tabInput.entityType &&
              t.entityId === tabInput.entityId,
          );
          if (existing) {
            get().switchTab(existing.id);
            return existing.id;
          }
        }

        // Check by route match
        if (tabInput.route) {
          const existing = workspace.tabs.find(
            (t) => t.route === tabInput.route,
          );
          if (existing) {
            get().switchTab(existing.id);
            return existing.id;
          }
        }

        // No existing tab found — open new
        return get().openTab(tabInput);
      },

      // ── MUA Integration ─────────────────────────────────────────────

      executeWorkspaceAction: (action: WorkspaceAction) => {
        const store = get();
        const p = action.payload;

        switch (action.type) {
          case "open_tab":
            store.openTab({
              type: (p.type as TabType) ?? "custom",
              title: (p.title as string) ?? "Untitled",
              icon: p.icon as string | undefined,
              entityId: p.entityId as string | undefined,
              entityType: p.entityType as string | undefined,
              route: p.route as string | undefined,
              pinned: p.pinned as boolean | undefined,
              source: "mua",
            });
            break;

          case "close_tab":
            if (p.tabId) store.closeTab(p.tabId as string);
            break;

          case "switch_tab":
          case "focus_tab":
            if (p.tabId) store.switchTab(p.tabId as string);
            break;

          case "pin_tab":
            if (p.tabId) store.pinTab(p.tabId as string);
            break;

          case "rename_tab":
            if (p.tabId && p.title)
              store.renameTab(p.tabId as string, p.title as string);
            break;

          case "update_tab":
            if (p.tabId && p.state)
              store.updateTabState(
                p.tabId as string,
                p.state as Record<string, unknown>,
              );
            break;

          case "create_report_tab":
            store.openTab({
              type: "report",
              title: (p.title as string) ?? "Report",
              icon: "file-text",
              route: p.route as string | undefined,
              state: p.reportData as Record<string, unknown> | undefined,
              source: "mua",
            });
            break;

          case "open_entity_tab":
            store.openOrFocusTab({
              type: (p.type as TabType) ?? "custom",
              title: (p.title as string) ?? "Entity",
              icon: p.icon as string | undefined,
              entityId: p.entityId as string,
              entityType: p.entityType as string,
              route: p.route as string | undefined,
              source: "mua",
            });
            break;

          case "open_related_tabs": {
            const tabs = (p.tabs ?? []) as Array<
              Omit<Tab, "id" | "createdAt">
            >;
            for (const tab of tabs) {
              store.openOrFocusTab(tab);
            }
            break;
          }

          case "switch_workspace":
            if (p.workspaceId)
              store.switchWorkspace(p.workspaceId as string);
            break;

          case "create_workspace":
            store.createWorkspace(
              (p.name as string) ?? "New Workspace",
              p.icon as string | undefined,
            );
            break;

          case "set_layout_mode":
            if (p.mode)
              store.setLayoutMode(p.mode as LayoutMode);
            break;

          case "split_with_tab":
            if (p.existingTabId && p.newTabId)
              store.splitWithTab(
                p.existingTabId as string,
                p.newTabId as string,
                (p.direction as "horizontal" | "vertical") ?? "horizontal",
              );
            break;

          case "add_to_dock":
            if (p.tabId) store.addToDock(p.tabId as string);
            break;

          case "remove_from_dock":
            if (p.tabId) store.removeFromDock(p.tabId as string);
            break;

          default:
            console.warn(
              `[workspace-store] Unknown action type: ${action.type}`,
            );
        }
      },
    }),
    {
      name: "memelli-workspace",
      version: 1,
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);

// Alias for convenience — components import as useWorkspaceStore
export const useWorkspaceStore = useWorkspaceTabStore;
