"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Pin,
  Clock,
  GitCompareArrows,
  ChevronUp,
  ChevronDown,
  X,
  Monitor,
  SplitSquareHorizontal,
  Move,
  Layers,
  CreditCard,
  Users,
  ShoppingCart,
  BarChart3,
  Bell,
  Settings,
  Bot,
  Sparkles,
  BookOpen,
  Search,
  Briefcase,
  FileText,
  Mail,
  ClipboardList,
  Workflow,
  DollarSign,
  Target,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  useWorkspaceStore,
  type DockItem,
  type SurfaceHistoryEntry,
  type Tab,
} from "@/stores/workspace-store";

// ─── Tab Type Icons ─────────────────────────────────────────────────

const TAB_TYPE_ICONS: Record<string, LucideIcon> = {
  client_profile: Users,
  credit_report: CreditCard,
  pipeline: Target,
  report: FileText,
  email_thread: Mail,
  task_board: ClipboardList,
  deployment_log: Monitor,
  lesson_module: BookOpen,
  analytics_dashboard: BarChart3,
  workflow_builder: Workflow,
  contacts: Users,
  deals: Briefcase,
  stores: ShoppingCart,
  products: ShoppingCart,
  orders: ShoppingCart,
  notifications: Bell,
  settings: Settings,
  agents: Bot,
  ai: Sparkles,
  commerce: ShoppingCart,
  crm: Users,
  coaching: BookOpen,
  seo: Search,
  credit: CreditCard,
  funding: DollarSign,
  activities: Activity,
  custom: Monitor,
};

const SURFACE_TYPE_ICONS: Record<string, LucideIcon> = {
  primary: Monitor,
  secondary: SplitSquareHorizontal,
  floating: Move,
  overlay: Layers,
};

// ─── Props ──────────────────────────────────────────────────────────

type DockPosition = "bottom" | "left" | "right";

interface SurfaceDockProps {
  /** Dock position */
  position?: DockPosition;
  /** Whether the dock is collapsed */
  collapsed?: boolean;
  /** Toggle collapse callback */
  onToggleCollapse?: () => void;
  /** Callback when a surface is opened from the dock */
  onOpenSurface?: (tabId: string) => void;
  /** Number of active comparisons (split/grid surfaces) */
  activeComparisons?: number;
}

// ─── Component ──────────────────────────────────────────────────────

export function SurfaceDock({
  position = "bottom",
  collapsed: controlledCollapsed,
  onToggleCollapse,
  onOpenSurface,
  activeComparisons = 0,
}: SurfaceDockProps) {
  const dockItems = useWorkspaceStore((s) => s.dockItems);
  const surfaceHistory = useWorkspaceStore((s) => s.surfaceHistory);
  const removeFromDock = useWorkspaceStore((s) => s.removeFromDock);
  const switchTab = useWorkspaceStore((s) => s.switchTab);
  const openTab = useWorkspaceStore((s) => s.openTab);
  const workspace = useWorkspaceStore((s) => s.getActiveWorkspace());

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "pinned" | "recent" | "comparisons"
  >("pinned");
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleCollapse]);

  // ── Get notification badges for dock items ───────────────────────

  const getTabBadge = useCallback(
    (tabId: string): number | undefined => {
      const tab = workspace?.tabs.find((t) => t.id === tabId);
      return tab?.alertBadge;
    },
    [workspace],
  );

  // ── Recent surfaces (deduplicated, excluding pinned) ─────────────

  const recentSurfaces = useMemo(() => {
    const pinnedTabIds = new Set(dockItems.map((d) => d.tabId));
    const seen = new Set<string>();
    return surfaceHistory
      .filter((entry) => {
        if (pinnedTabIds.has(entry.tabId) || seen.has(entry.tabId)) return false;
        seen.add(entry.tabId);
        return true;
      })
      .slice(0, 8);
  }, [surfaceHistory, dockItems]);

  // ── Handle surface click ─────────────────────────────────────────

  const handleSurfaceClick = useCallback(
    (tabId: string) => {
      // Check if the tab still exists in the workspace
      const existingTab = workspace?.tabs.find((t) => t.id === tabId);
      if (existingTab) {
        switchTab(tabId);
        onOpenSurface?.(tabId);
      }
    },
    [workspace, switchTab, onOpenSurface],
  );

  // ── Handle restoring a recent surface ────────────────────────────

  const handleRestoreRecent = useCallback(
    (entry: SurfaceHistoryEntry) => {
      // Check if tab still exists
      const existingTab = workspace?.tabs.find((t) => t.id === entry.tabId);
      if (existingTab) {
        switchTab(entry.tabId);
        onOpenSurface?.(entry.tabId);
      } else {
        // Re-open with stored type/title
        const newId = openTab({
          type: entry.type as Tab["type"],
          title: entry.title,
        });
        onOpenSurface?.(newId);
      }
    },
    [workspace, switchTab, openTab, onOpenSurface],
  );

  // ── Handle drag from dock ────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, tabId: string) => {
      e.dataTransfer.setData("text/plain", tabId);
      e.dataTransfer.setData("application/x-surface-dock-item", tabId);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-surface-dock-item")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }, []);

  // ── Layout classes based on position ─────────────────────────────

  const isVertical = position === "left" || position === "right";
  const containerClasses = isVertical
    ? `flex flex-col h-full ${position === "left" ? "border-r" : "border-l"} border-zinc-800 bg-zinc-950`
    : "flex flex-col w-full border-t border-zinc-800 bg-zinc-950";

  // ── Collapsed state ──────────────────────────────────────────────

  if (isCollapsed) {
    return (
      <div className={containerClasses}>
        <button
          onClick={toggleCollapse}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {isVertical ? (
            <ChevronUp className="h-3 w-3 rotate-90" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
          <span className="text-[10px] uppercase tracking-wider font-medium">
            Dock
          </span>
          {dockItems.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-800 px-1 text-[10px] text-zinc-400">
              {dockItems.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          {/* Section Tabs */}
          <DockSectionTab
            label="Pinned"
            icon={Pin}
            count={dockItems.length}
            active={activeSection === "pinned"}
            onClick={() => setActiveSection("pinned")}
          />
          <DockSectionTab
            label="Recent"
            icon={Clock}
            count={recentSurfaces.length}
            active={activeSection === "recent"}
            onClick={() => setActiveSection("recent")}
          />
          {activeComparisons > 0 && (
            <DockSectionTab
              label="Compare"
              icon={GitCompareArrows}
              count={activeComparisons}
              active={activeSection === "comparisons"}
              onClick={() => setActiveSection("comparisons")}
            />
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleCollapse}
          className="flex items-center justify-center h-5 w-5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          {isVertical ? (
            <ChevronDown className="h-3 w-3 rotate-90" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div
        className={`flex gap-1 p-2 overflow-x-auto scrollbar-none ${
          isVertical ? "flex-col overflow-y-auto" : "flex-row"
        }`}
        onDragOver={handleDragOver}
      >
        {/* Pinned Surfaces */}
        {activeSection === "pinned" && (
          <>
            {dockItems.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-3 text-zinc-600 text-xs">
                Pin a surface to add it here
              </div>
            ) : (
              dockItems.map((item) => (
                <DockTile
                  key={item.id}
                  id={item.id}
                  tabId={item.tabId}
                  title={item.title}
                  type={item.type}
                  icon={item.icon}
                  badge={getTabBadge(item.tabId)}
                  isDragOver={dragOverId === item.id}
                  onDragOver={() => setDragOverId(item.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onClick={() => handleSurfaceClick(item.tabId)}
                  onRemove={() => removeFromDock(item.tabId)}
                  onDragStart={(e) => handleDragStart(e, item.tabId)}
                  isPinned
                />
              ))
            )}
          </>
        )}

        {/* Recent Surfaces */}
        {activeSection === "recent" && (
          <>
            {recentSurfaces.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-3 text-zinc-600 text-xs">
                No recent surfaces
              </div>
            ) : (
              recentSurfaces.map((entry) => (
                <DockTile
                  key={entry.tabId}
                  id={entry.tabId}
                  tabId={entry.tabId}
                  title={entry.title}
                  type={entry.type}
                  subtitle={formatRelativeTime(entry.openedAt)}
                  onClick={() => handleRestoreRecent(entry)}
                  onDragStart={(e) => handleDragStart(e, entry.tabId)}
                />
              ))
            )}
          </>
        )}

        {/* Active Comparisons */}
        {activeSection === "comparisons" && (
          <div className="flex items-center gap-2 px-4 py-3 text-zinc-400 text-xs">
            <GitCompareArrows className="h-4 w-4 text-emerald-400" />
            <span>
              {activeComparisons} active comparison
              {activeComparisons !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dock Section Tab ───────────────────────────────────────────────

interface DockSectionTabProps {
  label: string;
  icon: LucideIcon;
  count: number;
  active: boolean;
  onClick: () => void;
}

function DockSectionTab({
  label,
  icon: Icon,
  count,
  active,
  onClick,
}: DockSectionTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium transition-all duration-150 ${
        active
          ? "text-white bg-zinc-800"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold ${
            active ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Dock Tile ──────────────────────────────────────────────────────

interface DockTileProps {
  id: string;
  tabId: string;
  title: string;
  type: string;
  icon?: string;
  subtitle?: string;
  badge?: number;
  isPinned?: boolean;
  isDragOver?: boolean;
  onClick: () => void;
  onRemove?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
}

function DockTile({
  title,
  type,
  badge,
  isPinned = false,
  isDragOver = false,
  subtitle,
  onClick,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
}: DockTileProps) {
  const TypeIcon = TAB_TYPE_ICONS[type] ?? Monitor;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 transition-all duration-150 ${
        isDragOver
          ? "bg-blue-500/10 border border-blue-500/30"
          : "bg-zinc-900 hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
      }`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-zinc-800 text-zinc-400 group-hover:text-white transition-colors flex-shrink-0">
        <TypeIcon className="h-3.5 w-3.5" />
      </div>

      {/* Title and subtitle */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate max-w-[120px] transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-zinc-600">{subtitle}</span>
        )}
      </div>

      {/* Notification Badge */}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {/* Pin indicator */}
      {isPinned && (
        <Pin className="h-2.5 w-2.5 text-zinc-600 flex-shrink-0" />
      )}

      {/* Remove button (pinned items only) */}
      {isPinned && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString();
}
