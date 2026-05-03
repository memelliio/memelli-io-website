'use client';

/**
 * WorkspaceTabBar — Horizontal scrollable tab bar for workspace modules.
 *
 * Features:
 * - Each tab: icon + label + close button
 * - Active tab highlighted with red underline
 * - Drag to reorder tabs within the bar
 * - "+" button to open module picker
 * - Overflow: scroll with arrow buttons
 * - Pinned tabs show pin indicator
 * - Max 10 tabs enforced
 */

import { useCallback, useRef, useState } from 'react';
import {
  X,
  Plus,
  Pin,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  ShoppingBag,
  GraduationCap,
  Search,
  CreditCard,
  FileText,
  Bot,
  Shield,
  BarChart3,
  Settings,
  Bell,
  Activity,
  Target,
  Handshake,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  Globe,
  Server,
  type LucideIcon,
} from 'lucide-react';
import type { Tab } from '@/stores/workspace-store';

// ── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, ShoppingBag, GraduationCap, Search, CreditCard,
  FileText, Bot, Shield, BarChart3, Settings, Bell, Activity, Target,
  Handshake, MessageSquare, CheckSquare, TrendingUp, Globe, Server,
  Rocket: CreditCard, Building2: Globe, LineChart: TrendingUp,
  Workflow: Activity, Briefcase: ShoppingBag, Terminal: Bot,
};

function getTabIcon(iconName?: string): LucideIcon {
  if (!iconName) return LayoutDashboard;
  return ICON_MAP[iconName] ?? LayoutDashboard;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface WorkspaceTabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTab: (tabId: string, newIndex: number) => void;
  onPinTab: (tabId: string) => void;
  onUnpinTab: (tabId: string) => void;
  onOpenPicker?: () => void;
}

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onReorderTab,
  onPinTab,
  onUnpinTab,
  onOpenPicker,
}: WorkspaceTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className="shrink-0 flex items-center border-b border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl">
      {/* Scroll left */}
      {tabs.length > 5 && (
        <button
          onClick={scrollLeft}
          className="shrink-0 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Tab list */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-end overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab, index) => {
          const Icon = getTabIcon(tab.icon);
          const isActive = tab.id === activeTabId;
          const isDragOver = dragOverIndex === index;
          const isDragging = draggingTabId === tab.id;

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => {
                setDraggingTabId(tab.id);
                e.dataTransfer.setData('application/workspace-tab', tab.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggingTabId(null);
                setDragOverIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes('application/workspace-tab')) {
                  setDragOverIndex(index);
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                const tabId = e.dataTransfer.getData('application/workspace-tab');
                if (tabId && tabId !== tab.id) {
                  onReorderTab(tabId, index);
                }
                setDragOverIndex(null);
              }}
              onClick={() => onSwitchTab(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (tab.pinned) {
                  onUnpinTab(tab.id);
                } else {
                  onPinTab(tab.id);
                }
              }}
              className={`
                group relative flex items-center gap-2 px-3 py-2 cursor-pointer
                transition-all duration-200 select-none shrink-0 max-w-[180px]
                border-r border-white/[0.02]
                ${isActive
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/[0.02]'
                }
                ${isDragging ? 'opacity-40' : ''}
                ${isDragOver ? 'border-l-2 border-l-red-500' : ''}
              `}
              title={`${tab.title}${tab.pinned ? ' (pinned)' : ''}\nRight-click to ${tab.pinned ? 'unpin' : 'pin'}`}
            >
              {/* Pin indicator */}
              {tab.pinned && (
                <Pin className="h-2.5 w-2.5 shrink-0 text-red-400/60" />
              )}

              {/* Icon */}
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-red-400' : ''}`} />

              {/* Label */}
              <span className="text-[11px] font-medium truncate">
                {tab.title}
              </span>

              {/* Alert badge */}
              {tab.alertBadge != null && tab.alertBadge > 0 && (
                <span className="shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {tab.alertBadge > 99 ? '99+' : tab.alertBadge}
                </span>
              )}

              {/* Close button (hidden for pinned tabs) */}
              {!tab.pinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] transition-all duration-150"
                >
                  <X className="h-3 w-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
                </button>
              )}

              {/* Active indicator — red underline */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-t-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll right */}
      {tabs.length > 5 && (
        <button
          onClick={scrollRight}
          className="shrink-0 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-white/[0.04] transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Add tab button */}
      {onOpenPicker && (
        <button
          onClick={onOpenPicker}
          className="shrink-0 p-1.5 mx-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200"
          title="Open module"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
