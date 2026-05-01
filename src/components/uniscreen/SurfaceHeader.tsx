"use client";

import { useState, useCallback } from "react";
import {
  X,
  Pin,
  PinOff,
  Copy,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
  Sparkles,
  GripVertical,
  Monitor,
  SplitSquareHorizontal,
  Move,
  Layers,
} from "lucide-react";
import {
  useWorkspaceStore,
  type Tab,
  type SurfaceType,
} from "@/stores/workspace-store";

// ─── Surface Type Metadata ──────────────────────────────────────────

const SURFACE_TYPE_CONFIG: Record<
  SurfaceType,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  primary: {
    icon: Monitor,
    label: "Primary",
    color: "text-blue-400",
  },
  secondary: {
    icon: SplitSquareHorizontal,
    label: "Secondary",
    color: "text-emerald-400",
  },
  floating: {
    icon: Move,
    label: "Floating",
    color: "text-amber-400",
  },
  overlay: {
    icon: Layers,
    label: "Overlay",
    color: "text-red-400",
  },
};

// ─── Props ──────────────────────────────────────────────────────────

interface SurfaceHeaderProps {
  /** The tab rendered in this surface */
  tab: Tab;
  /** All tabs sharing this surface (for multi-tab surfaces) */
  surfaceTabs?: Tab[];
  /** Whether the surface is currently expanded/maximized */
  isExpanded?: boolean;
  /** Whether this surface is the active/focused surface */
  isFocused?: boolean;
  /** Callback when the drag handle is grabbed */
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  /** Callback when "explain with MUA" is clicked */
  onExplainWithMua?: (tab: Tab) => void;
  /** Callback to toggle expand/collapse */
  onToggleExpand?: () => void;
  /** Callback when share is clicked */
  onShare?: (tab: Tab) => void;
  /** Callback when refresh is clicked */
  onRefresh?: (tab: Tab) => void;
}

// ─── Component ──────────────────────────────────────────────────────

export function SurfaceHeader({
  tab,
  surfaceTabs,
  isExpanded = false,
  isFocused = false,
  onDragStart,
  onExplainWithMua,
  onToggleExpand,
  onShare,
  onRefresh,
}: SurfaceHeaderProps) {
  const switchTab = useWorkspaceStore((s) => s.switchTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const pinTab = useWorkspaceStore((s) => s.pinTab);
  const unpinTab = useWorkspaceStore((s) => s.unpinTab);
  const duplicateTab = useWorkspaceStore((s) => s.duplicateTab);
  const addToDock = useWorkspaceStore((s) => s.addToDock);
  const activeTabId = useWorkspaceStore(
    (s) => s.getActiveWorkspace()?.activeTabId ?? null,
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const surfaceType = tab.surfaceType ?? "primary";
  const typeConfig = SURFACE_TYPE_CONFIG[surfaceType];
  const TypeIcon = typeConfig.icon;

  const tabs = surfaceTabs && surfaceTabs.length > 0 ? surfaceTabs : [tab];

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh?.(tab);
    setTimeout(() => setIsRefreshing(false), 800);
  }, [onRefresh, tab]);

  const handlePin = useCallback(() => {
    if (tab.pinned) {
      unpinTab(tab.id);
    } else {
      pinTab(tab.id);
      addToDock(tab.id);
    }
  }, [tab, pinTab, unpinTab, addToDock]);

  const handleDuplicate = useCallback(() => {
    duplicateTab(tab.id);
  }, [duplicateTab, tab.id]);

  const handleClose = useCallback(() => {
    closeTab(tab.id);
  }, [closeTab, tab.id]);

  const handleExplainWithMua = useCallback(() => {
    onExplainWithMua?.(tab);
  }, [onExplainWithMua, tab]);

  return (
    <div
      className={`flex items-center h-9 border-b select-none transition-colors duration-150 ${
        isFocused
          ? "border-zinc-700 bg-zinc-900"
          : "border-zinc-800 bg-zinc-950"
      }`}
    >
      {/* ── Drag Handle ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center w-7 h-full cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        title="Drag to reposition"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* ── Surface Type Indicator ───────────────────────────────── */}
      <div
        className={`flex items-center gap-1 px-1.5 ${typeConfig.color}`}
        title={`${typeConfig.label} surface`}
      >
        <TypeIcon className="h-3 w-3" />
      </div>

      {/* ── Tab Strip (multi-tab support) ────────────────────────── */}
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const isActiveInSurface = t.id === (activeTabId ?? tab.id);
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-t transition-all duration-150 flex-shrink-0 ${
                isActiveInSurface
                  ? "text-white bg-zinc-800 border-b-2 border-b-blue-500"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {t.source === "mua" && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400/70 flex-shrink-0" />
              )}
              {t.pinned && (
                <Pin className="h-2.5 w-2.5 text-zinc-500 flex-shrink-0" />
              )}
              <span className="truncate max-w-[120px]">{t.title}</span>
              {t.alertBadge != null && t.alertBadge > 0 && (
                <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {t.alertBadge > 99 ? "99+" : t.alertBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-1 flex-shrink-0">
        {/* Refresh */}
        <SurfaceControlButton
          onClick={handleRefresh}
          title="Refresh surface"
        >
          <RefreshCw
            className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </SurfaceControlButton>

        {/* Pin / Unpin */}
        <SurfaceControlButton
          onClick={handlePin}
          title={tab.pinned ? "Unpin surface" : "Pin surface"}
          active={!!tab.pinned}
        >
          {tab.pinned ? (
            <PinOff className="h-3 w-3" />
          ) : (
            <Pin className="h-3 w-3" />
          )}
        </SurfaceControlButton>

        {/* Duplicate */}
        <SurfaceControlButton
          onClick={handleDuplicate}
          title="Duplicate surface"
        >
          <Copy className="h-3 w-3" />
        </SurfaceControlButton>

        {/* Expand / Collapse */}
        <SurfaceControlButton
          onClick={onToggleExpand}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </SurfaceControlButton>

        {/* Share */}
        <SurfaceControlButton
          onClick={() => onShare?.(tab)}
          title="Share surface"
        >
          <Share2 className="h-3 w-3" />
        </SurfaceControlButton>

        {/* Explain with MUA */}
        <SurfaceControlButton
          onClick={handleExplainWithMua}
          title="Explain with MUA"
          className="text-blue-400/60 hover:text-blue-400"
        >
          <Sparkles className="h-3 w-3" />
        </SurfaceControlButton>

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        {/* Close */}
        <SurfaceControlButton
          onClick={handleClose}
          title="Close surface"
          className="hover:text-red-400"
        >
          <X className="h-3 w-3" />
        </SurfaceControlButton>
      </div>
    </div>
  );
}

// ─── Control Button ─────────────────────────────────────────────────

interface SurfaceControlButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  className?: string;
}

function SurfaceControlButton({
  children,
  onClick,
  title,
  active = false,
  className = "",
}: SurfaceControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center h-6 w-6 rounded transition-all duration-150 ${
        active
          ? "text-blue-400 bg-blue-500/10"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
      } ${className}`}
    >
      {children}
    </button>
  );
}
