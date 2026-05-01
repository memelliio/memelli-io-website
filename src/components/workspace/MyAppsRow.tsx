'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, PinOff, GripVertical } from 'lucide-react';
import { usePinnedModules } from '../../hooks/usePinnedModules';
import {
  Users, BarChart3, Bot, CheckSquare, ShoppingBag, GraduationCap,
  Search, Workflow, Zap, Phone, FileText, CreditCard, Tv2,
  BarChart2, Video, Activity, MessageSquare, CheckCircle,
  Handshake, Contact,
  type LucideIcon,
} from 'lucide-react';

// ─── Icon registry ────────────────────────────────────────────────────────────
// Add entries here whenever a new iconName is introduced in usePinnedModules.
const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  BarChart3,
  Bot,
  CheckSquare,
  ShoppingBag,
  GraduationCap,
  Search,
  Workflow,
  Zap,
  Phone,
  FileText,
  CreditCard,
  Tv2,
  BarChart2,
  Video,
  Activity,
  MessageSquare,
  CheckCircle,
  Handshake,
  Contact,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MyAppsRow() {
  const { pinned, allModules, togglePin, reorder, isPinned } = usePinnedModules();
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const router = useRouter();

  const openModule = useCallback(
    (route: string, id: string) => {
      if (editMode) return;
      const fn = (window as unknown as Record<string, unknown>).__memelliOpenModule;
      if (typeof fn === 'function') {
        (fn as (id: string, route: string) => void)(id, route);
      } else {
        // Workspace not ready — queue the module and stay on homepage
        const q: string[] = (window as any).__memelliPendingQueue ?? [];
        q.push(id);
        (window as any).__memelliPendingQueue = q;
      }
    },
    [editMode],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragging(index);
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragging !== null && dragging !== targetIndex) {
        reorder(dragging, targetIndex);
      }
      setDragging(null);
    },
    [dragging, reorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  if (pinned.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Row header */}
      <div className="flex items-center justify-between px-[4%] mb-3">
        <h2 className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">
          My Apps
        </h2>
        <button
          onClick={() => setEditMode(e => !e)}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
            editMode
              ? 'border-red-500/50 text-red-400 bg-red-500/10'
              : 'border-zinc-700/60 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {editMode ? 'Done' : 'Customize'}
        </button>
      </div>

      {/* Scrollable card row */}
      <div
        className="flex gap-3 overflow-x-auto px-[4%] pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {pinned.map((mod, index) => {
          const Icon: LucideIcon = ICON_MAP[mod.iconName] ?? Users;
          const isDraggingThis = dragging === index;

          return (
            <div
              key={mod.id}
              draggable={editMode}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => openModule(mod.route, mod.id)}
              role={editMode ? 'listitem' : 'button'}
              tabIndex={editMode ? -1 : 0}
              onKeyDown={(e) => {
                if (!editMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  openModule(mod.route, mod.id);
                }
              }}
              aria-label={`Open ${mod.title}`}
              className={[
                'relative flex-shrink-0 w-44 h-32 rounded-2xl overflow-hidden group transition-all duration-200',
                editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                isDraggingThis
                  ? 'opacity-50 scale-95'
                  : 'hover:scale-105 hover:z-10',
              ].join(' ')}
              style={{
                background: `linear-gradient(135deg, ${mod.color} 0%, hsl(var(--muted)) 100%)`,
              }}
            >
              {/* Accent top line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: mod.accent }}
              />

              {/* Hover ring — uses a CSS custom property so it works without
                  arbitrary Tailwind values that need safelisting */}
              <div
                className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 transition-all duration-200"
                style={
                  { '--tw-ring-color': `${mod.accent}60` } as React.CSSProperties
                }
              />

              {/* Module icon */}
              <div className="absolute top-4 left-4">
                <Icon className="h-7 w-7" style={{ color: mod.accent }} />
              </div>

              {/* Module title */}
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                  {mod.title}
                </p>
              </div>

              {/* Edit mode — drag handle */}
              {editMode && (
                <div className="absolute top-2 left-2 text-zinc-500 pointer-events-none">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              {/* Edit mode — unpin button */}
              {editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(mod.id);
                  }}
                  aria-label={`Unpin ${mod.title}`}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <PinOff className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          );
        })}

        {/* Edit mode — "Pin more" placeholder card */}
        {editMode && (
          <div
            className="flex-shrink-0 w-44 h-32 rounded-2xl border-2 border-dashed border-zinc-700/60
                        flex items-center justify-center cursor-pointer
                        hover:border-red-500/40 transition-colors"
            role="button"
            tabIndex={0}
            aria-label="Pin more apps"
          >
            <div className="text-center">
              <Pin className="w-5 h-5 text-zinc-600 mx-auto mb-1" />
              <p className="text-xs text-zinc-600">Pin more</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit mode — full module picker (shown below the row) */}
      {editMode && (
        <div className="mt-4 px-[4%]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
            All modules — click to pin / unpin
          </p>
          <div className="flex flex-wrap gap-2">
            {allModules.map((mod) => {
              const Icon: LucideIcon = ICON_MAP[mod.iconName] ?? Users;
              const pinned = isPinned(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => togglePin(mod.id)}
                  aria-pressed={pinned}
                  aria-label={`${pinned ? 'Unpin' : 'Pin'} ${mod.title}`}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    pinned
                      ? 'border-transparent text-white'
                      : 'border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600',
                  ].join(' ')}
                  style={
                    pinned
                      ? { backgroundColor: `${mod.accent}22`, borderColor: `${mod.accent}60`, color: mod.accent }
                      : undefined
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mod.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
