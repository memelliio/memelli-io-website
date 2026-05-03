"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  Filter,
  MoreHorizontal,
  Pin,
  Plus,
  Save,
  Star,
  Trash2,
  X
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SavedView {
  id: string;
  title: string;
  description?: string;
  moduleKey: string;
  viewType: "table" | "kanban" | "calendar" | "chart" | "custom";
  isDefault: boolean;
  isPinned: boolean;
  owner?: string;
  updatedAt: string;
  config: {
    filters?: Record<string, unknown>[];
    sort?: Record<string, unknown>;
    grouping?: string;
    layout?: string;
    columns?: string[];
    [key: string]: unknown;
  };
}

interface SavedViewManagerProps {
  moduleKey: string;
  onApply?: (viewConfig: SavedView["config"]) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEW_TYPE_COLORS: Record<string, string> = {
  table: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  kanban: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  calendar: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  chart: "bg-red-500/20 text-red-400 border-red-500/30",
  custom: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
};

const VIEW_TYPES: Array<{ key: SavedView["viewType"]; label: string }> = [
  { key: "table", label: "Table" },
  { key: "kanban", label: "Kanban" },
  { key: "calendar", label: "Calendar" },
  { key: "chart", label: "Chart" },
  { key: "custom", label: "Custom" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavedViewManager({
  moduleKey,
  onApply
}: SavedViewManagerProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch views ──────────────────────────────────────────────────────
  const fetchViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reports/views?moduleKey=${encodeURIComponent(moduleKey)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Failed to load views (${res.status})`);
      const data = await res.json();
      setViews(data.views ?? data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [moduleKey]);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  // ── Actions ──────────────────────────────────────────────────────────
  async function performViewAction(
    viewId: string,
    action: string,
    method = "PATCH",
  ) {
    setActionLoading(viewId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reports/views/${viewId}/${action}`,
        {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        },
      );
      if (!res.ok) throw new Error(`Action failed`);
      await fetchViews();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
      setActiveMenu(null);
    }
  }

  function handleApply(view: SavedView) {
    onApply?.(view.config);
    setActiveMenu(null);
  }

  function handleSetDefault(viewId: string) {
    performViewAction(viewId, "set-default");
  }

  function handlePin(viewId: string) {
    performViewAction(viewId, "pin");
  }

  function handleDuplicate(viewId: string) {
    performViewAction(viewId, "duplicate", "POST");
  }

  function handleDelete(viewId: string) {
    performViewAction(viewId, "delete", "DELETE");
  }

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
          {error}
        </div>
        <button
          onClick={fetchViews}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Saved Views</h2>
          <p className="text-sm text-zinc-500">
            {moduleKey.replace(/_/g, " ")} module
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-500"
        >
          <Plus className="h-4 w-4" />
          Save Current View
        </button>
      </div>

      {/* Empty state */}
      {views.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <Filter className="h-8 w-8 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400">
              No saved views yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Save your current filter, sort, and layout configuration for quick
              access later.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:border-red-500/50 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" />
            Create Your First View
          </button>
        </div>
      )}

      {/* View grid */}
      {views.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {views.map((view) => (
            <div
              key={view.id}
              onClick={() => handleApply(view)}
              className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-800/60 p-4 transition-all duration-200 hover:border-red-500/30 hover:bg-zinc-800/80"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {view.isDefault && (
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  )}
                  {view.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100">
                    {view.title}
                  </h3>
                </div>

                {/* Action menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(
                        activeMenu === view.id ? null : view.id,
                      );
                    }}
                    className="rounded-md p-1 text-zinc-500 opacity-0 transition-all duration-150 hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {activeMenu === view.id && (
                    <div
                      className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-850 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MenuButton
                        icon={<Eye className="h-3.5 w-3.5" />}
                        label="Apply"
                        onClick={() => handleApply(view)}
                      />
                      <MenuButton
                        icon={<Star className="h-3.5 w-3.5" />}
                        label="Set Default"
                        onClick={() => handleSetDefault(view.id)}
                      />
                      <MenuButton
                        icon={<Pin className="h-3.5 w-3.5" />}
                        label={view.isPinned ? "Unpin" : "Pin"}
                        onClick={() => handlePin(view.id)}
                      />
                      <MenuButton
                        icon={<Copy className="h-3.5 w-3.5" />}
                        label="Duplicate"
                        onClick={() => handleDuplicate(view.id)}
                      />
                      <div className="my-1 border-t border-zinc-700" />
                      <MenuButton
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Delete"
                        onClick={() => handleDelete(view.id)}
                        destructive
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {view.description && (
                <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
                  {view.description}
                </p>
              )}

              {/* Bottom row */}
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                    VIEW_TYPE_COLORS[view.viewType] ?? VIEW_TYPE_COLORS.custom
                  }`}
                >
                  {view.viewType}
                </span>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {view.owner && <span>{view.owner}</span>}
                  <span>{formatDate(view.updatedAt)}</span>
                </div>
              </div>

              {/* Loading overlay */}
              {actionLoading === view.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-900/60">
                  <LoadingGlobe size="sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateViewModal
          moduleKey={moduleKey}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchViews();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu button
// ---------------------------------------------------------------------------

function MenuButton({
  icon,
  label,
  onClick,
  destructive = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
        destructive
          ? "text-red-400 hover:bg-red-500/10"
          : "text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Create View Modal
// ---------------------------------------------------------------------------

function CreateViewModal({
  moduleKey,
  onClose,
  onCreated
}: {
  moduleKey: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [viewType, setViewType] = useState<SavedView["viewType"]>("table");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/views`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          moduleKey,
          viewType,
          config: {}
        })
      });
      if (!res.ok) throw new Error(`Failed to create view (${res.status})`);
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h3 className="text-base font-bold text-zinc-100">
            Save Current View
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My custom view..."
              autoFocus
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              View Type
            </label>
            <div className="flex flex-wrap gap-2">
              {VIEW_TYPES.map((vt) => (
                <button
                  key={vt.key}
                  onClick={() => setViewType(vt.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    viewType === vt.key
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save View"}
          </button>
        </div>
      </div>
    </div>
  );
}
