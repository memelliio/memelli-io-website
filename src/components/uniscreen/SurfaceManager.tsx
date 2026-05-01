"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  Columns2,
  Grid2x2,
  Maximize,
  Square,
} from "lucide-react";
import {
  useWorkspaceStore,
  type Tab,
  type LayoutMode,
  type SurfacePosition,
} from "@/stores/workspace-store";
import { SurfaceHeader } from "./SurfaceHeader";

// ─── Types ──────────────────────────────────────────────────────────

interface SurfaceState {
  tabId: string;
  zIndex: number;
  isExpanded: boolean;
  position: SurfacePosition;
}

interface SurfaceManagerProps {
  /** Render function for tab content */
  renderContent: (tab: Tab) => ReactNode;
  /** Callback when "explain with MUA" is triggered from any surface */
  onExplainWithMua?: (tab: Tab) => void;
  /** Callback when share is triggered */
  onShare?: (tab: Tab) => void;
  /** Callback when refresh is triggered */
  onRefresh?: (tab: Tab) => void;
}

// ─── Layout Configs ─────────────────────────────────────────────────

const LAYOUT_ICONS: Record<LayoutMode, React.ComponentType<{ className?: string }>> = {
  single: Square,
  split: Columns2,
  grid: Grid2x2,
  focus: Maximize,
};

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  single: "Single",
  split: "Split",
  grid: "Grid",
  focus: "Focus",
};

// ─── Snap Thresholds ────────────────────────────────────────────────

const SNAP_THRESHOLD = 20; // px
const MIN_SURFACE_SIZE = 200; // px

// ─── Component ──────────────────────────────────────────────────────

export function SurfaceManager({
  renderContent,
  onExplainWithMua,
  onShare,
  onRefresh,
}: SurfaceManagerProps) {
  const workspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const activeTab = useWorkspaceStore((s) => s.getActiveTab());
  const secondaryTabs = useWorkspaceStore((s) => s.getSecondaryTabs());
  const setLayoutMode = useWorkspaceStore((s) => s.setLayoutMode);
  const setSplitConfig = useWorkspaceStore((s) => s.setSplitConfig);

  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedSurfaceId, setExpandedSurfaceId] = useState<string | null>(
    null,
  );
  const [focusedSurfaceId, setFocusedSurfaceId] = useState<string | null>(
    null,
  );

  // ── Floating surface states ──────────────────────────────────────
  const [floatingSurfaces, setFloatingSurfaces] = useState<
    Map<string, SurfaceState>
  >(new Map());
  const [topZIndex, setTopZIndex] = useState(100);

  // ── Drag state ───────────────────────────────────────────────────
  const dragRef = useRef<{
    tabId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  // ── Resize state ─────────────────────────────────────────────────
  const resizeRef = useRef<{
    direction: "horizontal" | "vertical";
    startPos: number;
    startSizes: number[];
  } | null>(null);

  const layoutMode = workspace?.layoutMode ?? "single";
  const splitConfig = workspace?.splitConfig ?? {
    direction: "horizontal" as const,
    sizes: [50, 50],
  };

  // ── Collect all renderable surfaces ──────────────────────────────

  const allTabs: Tab[] = [];
  if (activeTab) allTabs.push(activeTab);
  allTabs.push(...secondaryTabs);

  // Also collect floating/overlay tabs
  const floatingTabs = (workspace?.tabs ?? []).filter(
    (t) =>
      (t.surfaceType === "floating" || t.surfaceType === "overlay") &&
      !allTabs.some((at) => at.id === t.id),
  );

  // ── Initialize floating surface positions ────────────────────────

  useEffect(() => {
    floatingTabs.forEach((ft) => {
      if (!floatingSurfaces.has(ft.id)) {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);
        setFloatingSurfaces((prev) => {
          const next = new Map(prev);
          next.set(ft.id, {
            tabId: ft.id,
            zIndex: newZ,
            isExpanded: false,
            position: ft.position ?? {
              x: 100 + prev.size * 30,
              y: 80 + prev.size * 30,
              width: 480,
              height: 360,
            },
          });
          return next;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floatingTabs.map((t) => t.id).join(",")]);

  // ── Bring floating surface to front ──────────────────────────────

  const bringToFront = useCallback(
    (tabId: string) => {
      const newZ = topZIndex + 1;
      setTopZIndex(newZ);
      setFloatingSurfaces((prev) => {
        const next = new Map(prev);
        const existing = next.get(tabId);
        if (existing) {
          next.set(tabId, { ...existing, zIndex: newZ });
        }
        return next;
      });
      setFocusedSurfaceId(tabId);
    },
    [topZIndex],
  );

  // ── Drag handlers ────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (tabId: string, e: React.MouseEvent | React.TouchEvent) => {
      const surface = floatingSurfaces.get(tabId);
      if (!surface) return;

      bringToFront(tabId);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragRef.current = {
        tabId,
        startX: clientX,
        startY: clientY,
        startLeft: surface.position.x,
        startTop: surface.position.y,
      };

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        if (!dragRef.current) return;
        const cx = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
        const cy = "touches" in ev ? ev.touches[0].clientY : ev.clientY;

        const dx = cx - dragRef.current.startX;
        const dy = cy - dragRef.current.startY;

        let newX = dragRef.current.startLeft + dx;
        let newY = dragRef.current.startTop + dy;

        // Snap to edges
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          if (Math.abs(newX) < SNAP_THRESHOLD) newX = 0;
          if (Math.abs(newY) < SNAP_THRESHOLD) newY = 0;
          const s = floatingSurfaces.get(dragRef.current.tabId);
          if (s) {
            if (
              Math.abs(newX + s.position.width - rect.width) < SNAP_THRESHOLD
            ) {
              newX = rect.width - s.position.width;
            }
            if (
              Math.abs(newY + s.position.height - rect.height) < SNAP_THRESHOLD
            ) {
              newY = rect.height - s.position.height;
            }
          }
        }

        setFloatingSurfaces((prev) => {
          const next = new Map(prev);
          const existing = next.get(dragRef.current!.tabId);
          if (existing) {
            next.set(dragRef.current!.tabId, {
              ...existing,
              position: { ...existing.position, x: newX, y: newY },
            });
          }
          return next;
        });
      };

      const handleEnd = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove);
      document.addEventListener("touchend", handleEnd);
    },
    [floatingSurfaces, bringToFront],
  );

  // ── Resize handler for split surfaces ────────────────────────────

  const handleResizeStart = useCallback(
    (direction: "horizontal" | "vertical", e: React.MouseEvent) => {
      e.preventDefault();
      const startPos =
        direction === "horizontal" ? e.clientX : e.clientY;

      resizeRef.current = {
        direction,
        startPos,
        startSizes: [...splitConfig.sizes],
      };

      const handleMove = (ev: MouseEvent) => {
        if (!resizeRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentPos =
          resizeRef.current.direction === "horizontal"
            ? ev.clientX
            : ev.clientY;
        const totalSize =
          resizeRef.current.direction === "horizontal"
            ? rect.width
            : rect.height;

        const delta = currentPos - resizeRef.current.startPos;
        const deltaPercent = (delta / totalSize) * 100;

        const newFirst = Math.max(
          (MIN_SURFACE_SIZE / totalSize) * 100,
          Math.min(
            100 - (MIN_SURFACE_SIZE / totalSize) * 100,
            resizeRef.current.startSizes[0] + deltaPercent,
          ),
        );
        const newSecond = 100 - newFirst;

        setSplitConfig({
          direction: resizeRef.current.direction,
          sizes: [newFirst, newSecond],
        });
      };

      const handleEnd = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
    },
    [splitConfig, setSplitConfig],
  );

  // ── Toggle expand ────────────────────────────────────────────────

  const toggleExpand = useCallback(
    (tabId: string) => {
      if (expandedSurfaceId === tabId) {
        setExpandedSurfaceId(null);
      } else {
        setExpandedSurfaceId(tabId);
      }
    },
    [expandedSurfaceId],
  );

  // ── Render a single surface panel ────────────────────────────────

  const renderSurface = (
    tab: Tab,
    options: {
      isFocused?: boolean;
      isFloating?: boolean;
      style?: React.CSSProperties;
      onMouseDown?: () => void;
    } = {},
  ) => {
    const isExpanded = expandedSurfaceId === tab.id;

    return (
      <div
        key={tab.id}
        className={`flex flex-col overflow-hidden ${
          options.isFloating
            ? "absolute rounded-lg border border-zinc-700 shadow-2xl shadow-black/50 bg-zinc-950"
            : "bg-zinc-950"
        } ${isExpanded ? "fixed inset-0 z-[9999]" : ""}`}
        style={isExpanded ? undefined : options.style}
        onMouseDown={options.onMouseDown}
      >
        <SurfaceHeader
          tab={tab}
          isExpanded={isExpanded}
          isFocused={options.isFocused ?? focusedSurfaceId === tab.id}
          onDragStart={
            options.isFloating
              ? (e) => handleDragStart(tab.id, e)
              : undefined
          }
          onToggleExpand={() => toggleExpand(tab.id)}
          onExplainWithMua={onExplainWithMua}
          onShare={onShare}
          onRefresh={onRefresh}
        />
        <div className="flex-1 overflow-auto">{renderContent(tab)}</div>
      </div>
    );
  };

  // ── Layout Rendering ─────────────────────────────────────────────

  const renderLayout = () => {
    if (!activeTab) {
      return (
        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
          No active surface. Open a tab to get started.
        </div>
      );
    }

    switch (layoutMode) {
      case "single":
        return (
          <div className="h-full">
            {renderSurface(activeTab, { isFocused: true })}
          </div>
        );

      case "split": {
        const secondaryTab = secondaryTabs[0];
        const isHorizontal = splitConfig.direction === "horizontal";

        return (
          <div
            className={`h-full flex ${isHorizontal ? "flex-row" : "flex-col"}`}
          >
            {/* Primary */}
            <div
              style={{
                [isHorizontal ? "width" : "height"]:
                  `${splitConfig.sizes[0]}%`,
              }}
              className="overflow-hidden flex flex-col"
            >
              {renderSurface(activeTab, {
                isFocused: focusedSurfaceId === activeTab.id,
                onMouseDown: () => setFocusedSurfaceId(activeTab.id),
              })}
            </div>

            {/* Resize Handle */}
            <div
              className={`flex-shrink-0 ${
                isHorizontal
                  ? "w-1 cursor-col-resize hover:bg-blue-500/30"
                  : "h-1 cursor-row-resize hover:bg-blue-500/30"
              } bg-zinc-800 transition-colors duration-150 active:bg-blue-500/50`}
              onMouseDown={(e) =>
                handleResizeStart(splitConfig.direction, e)
              }
            />

            {/* Secondary */}
            {secondaryTab && (
              <div
                style={{
                  [isHorizontal ? "width" : "height"]:
                    `${splitConfig.sizes[1]}%`,
                }}
                className="overflow-hidden flex flex-col"
              >
                {renderSurface(secondaryTab, {
                  isFocused: focusedSurfaceId === secondaryTab.id,
                  onMouseDown: () => setFocusedSurfaceId(secondaryTab.id),
                })}
              </div>
            )}
          </div>
        );
      }

      case "grid": {
        // Up to 4 surfaces in a 2x2 grid
        const gridTabs = [activeTab, ...secondaryTabs].slice(0, 4);
        return (
          <div className="h-full grid grid-cols-2 grid-rows-2 gap-px bg-zinc-800">
            {gridTabs.map((tab) => (
              <div
                key={tab.id}
                className="overflow-hidden flex flex-col"
                onMouseDown={() => setFocusedSurfaceId(tab.id)}
              >
                {renderSurface(tab, {
                  isFocused: focusedSurfaceId === tab.id,
                })}
              </div>
            ))}
            {/* Fill empty grid cells */}
            {Array.from({ length: Math.max(0, 4 - gridTabs.length) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center bg-zinc-950 text-zinc-700 text-xs"
                >
                  Empty surface
                </div>
              ),
            )}
          </div>
        );
      }

      case "focus":
        return (
          <div className="h-full">
            {renderSurface(activeTab, { isFocused: true })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative h-full flex flex-col">
      {/* ── Layout Mode Selector ──────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 mr-2 font-medium">
          Layout
        </span>
        {(Object.keys(LAYOUT_ICONS) as LayoutMode[]).map((mode) => {
          const Icon = LAYOUT_ICONS[mode];
          const isActive = layoutMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              title={LAYOUT_LABELS[mode]}
              className={`flex items-center justify-center h-6 w-6 rounded transition-all duration-150 ${
                isActive
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      {/* ── Main Layout Area ──────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">{renderLayout()}</div>

      {/* ── Floating / Overlay Surfaces ───────────────────────────── */}
      {floatingTabs.map((ft) => {
        const surface = floatingSurfaces.get(ft.id);
        if (!surface) return null;

        const isOverlay = ft.surfaceType === "overlay";

        return (
          <div key={ft.id}>
            {/* Overlay backdrop */}
            {isOverlay && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[90]" />
            )}
            {renderSurface(ft, {
              isFloating: true,
              isFocused: focusedSurfaceId === ft.id,
              style: {
                left: surface.position.x,
                top: surface.position.y,
                width: surface.position.width,
                height: surface.position.height,
                zIndex: isOverlay ? 200 : surface.zIndex,
              },
              onMouseDown: () => bringToFront(ft.id),
            })}
          </div>
        );
      })}
    </div>
  );
}
