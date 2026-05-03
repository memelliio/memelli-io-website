"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  RefreshCw,
  Pin,
  PinOff,
  Copy,
  Archive,
  GitBranch,
  ArrowLeftRight,
  Clock,
  Zap,
  Camera,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";
import { VisualRenderer } from "./visual-engine/VisualRenderer";
import type { VisualLayout } from "./visual-engine/component-registry";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportSummaryMetric {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

interface SourceEntity {
  id: string;
  type: string;
  label: string;
}

interface ReportVersion {
  version: number;
  createdAt: string;
  snapshotDate?: string;
}

interface Report {
  id: string;
  title: string;
  description?: string;
  reportType: string;
  moduleKey: string;
  mode: "SNAPSHOT" | "LIVE";
  status: "PENDING" | "GENERATING" | "GENERATED" | "FAILED" | "ARCHIVED";
  version: number;
  generatedAt?: string;
  snapshotDate?: string;
  isPinned: boolean;
  summaryBlock?: ReportSummaryMetric[];
  visualConfig?: VisualLayout;
  sourceEntities?: SourceEntity[];
  versions?: ReportVersion[];
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReportSurfaceProps {
  reportId: string;
  initialData?: Report;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  GENERATING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  GENERATED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  ARCHIVED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
};

const MODE_COLORS: Record<string, string> = {
  SNAPSHOT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LIVE: "bg-red-500/20 text-red-400 border-red-500/30"
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 ${colorClass}`}
    >
      {label}
    </span>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-8 w-72 rounded-lg bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-zinc-800" />
          <div className="h-5 w-20 rounded-full bg-zinc-800" />
          <div className="h-5 w-20 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-zinc-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-800" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-zinc-800" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportSurface({ reportId, initialData }: ReportSurfaceProps) {
  const [report, setReport] = useState<Report | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openTab = useWorkspaceTabStore((s) => s.openTab);

  // ── Fetch report ─────────────────────────────────────────────────────
  const fetchReport = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
        const data = await res.json();
        setReport(data.report ?? data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (!silent) setError(msg);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [reportId],
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Live polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (
      report?.mode === "LIVE" &&
      report?.status === "GENERATED" &&
      !pollRef.current
    ) {
      pollRef.current = setInterval(() => fetchReport(true), 30000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [report?.mode, report?.status, fetchReport]);

  // ── Actions ──────────────────────────────────────────────────────────
  async function performAction(
    action: string,
    method = "POST",
    body?: Record<string, unknown>,
  ) {
    setActionLoading(action);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reports/${reportId}/${action}`,
        {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined
        },
      );
      if (!res.ok) throw new Error(`Action ${action} failed`);
      await fetchReport();
    } catch {
      // Silently handle — report will refresh
    } finally {
      setActionLoading(null);
    }
  }

  function handleRegenerate() {
    performAction("generate");
  }

  function handlePin() {
    performAction("pin", "PATCH");
  }

  function handleUnpin() {
    performAction("unpin", "PATCH");
  }

  function handleDuplicate() {
    performAction("duplicate");
  }

  function handleArchive() {
    performAction("archive", "PATCH");
  }

  function handleCreateVersion() {
    performAction("version");
  }

  function handleCompare() {
    if (!report) return;
    openTab({
      type: "report",
      title: `Compare: ${report.title}`,
      icon: "arrow-left-right",
      route: `/dashboard/reports/compare?a=${reportId}`,
      state: { reportIdA: reportId },
      source: "user"
    });
  }

  function handleOpenEntity(entity: SourceEntity) {
    openTab({
      type: "custom",
      title: entity.label,
      icon: "external-link",
      entityId: entity.id,
      entityType: entity.type,
      source: "user"
    });
  }

  // ── Render states ────────────────────────────────────────────────────
  if (loading) return <ReportSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
          {error}
        </div>
        <button
          onClick={() => fetchReport()}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-red-400" />
              <h1 className="text-2xl font-bold text-zinc-100">
                {report.title}
              </h1>
            </div>
            {report.description && (
              <p className="text-sm text-zinc-400">{report.description}</p>
            )}
          </div>

          {/* Version indicator */}
          <div className="relative">
            <button
              onClick={() => setVersionDropdownOpen(!versionDropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:border-red-500/50 hover:bg-zinc-800"
            >
              <GitBranch className="h-3.5 w-3.5" />
              v{report.version}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {versionDropdownOpen && report.versions && (
              <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-850 shadow-xl">
                <div className="border-b border-zinc-700 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Version History
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {report.versions.map((v) => (
                    <button
                      key={v.version}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors duration-150 hover:bg-zinc-800 ${
                        v.version === report.version
                          ? "text-red-400"
                          : "text-zinc-300"
                      }`}
                    >
                      <span>v{v.version}</span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(v.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            label={report.reportType.replace(/_/g, " ")}
            colorClass="bg-zinc-700/50 text-zinc-300 border-zinc-600"
          />
          <Badge
            label={report.moduleKey.replace(/_/g, " ")}
            colorClass="bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
          />
          <Badge
            label={report.mode}
            colorClass={MODE_COLORS[report.mode] ?? ""}
          />
          {report.mode === "LIVE" && (
            <Zap className="h-3.5 w-3.5 text-red-400" />
          )}
          {report.mode === "SNAPSHOT" && (
            <Camera className="h-3.5 w-3.5 text-amber-400" />
          )}
          <Badge
            label={report.status}
            colorClass={STATUS_COLORS[report.status] ?? ""}
          />
          {report.generatedAt && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              Generated {formatDate(report.generatedAt)}
            </span>
          )}
          {report.snapshotDate && (
            <span className="text-xs text-zinc-500">
              Snapshot: {formatDate(report.snapshotDate)}
            </span>
          )}
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {report.mode === "LIVE" && (
          <ActionButton
            icon={<RefreshCw className="h-4 w-4" />}
            label="Regenerate"
            onClick={handleRegenerate}
            loading={actionLoading === "generate"}
          />
        )}
        {report.isPinned ? (
          <ActionButton
            icon={<PinOff className="h-4 w-4" />}
            label="Unpin"
            onClick={handleUnpin}
            loading={actionLoading === "unpin"}
          />
        ) : (
          <ActionButton
            icon={<Pin className="h-4 w-4" />}
            label="Pin"
            onClick={handlePin}
            loading={actionLoading === "pin"}
          />
        )}
        <ActionButton
          icon={<Copy className="h-4 w-4" />}
          label="Duplicate"
          onClick={handleDuplicate}
          loading={actionLoading === "duplicate"}
        />
        <ActionButton
          icon={<Archive className="h-4 w-4" />}
          label="Archive"
          onClick={handleArchive}
          loading={actionLoading === "archive"}
        />
        <ActionButton
          icon={<GitBranch className="h-4 w-4" />}
          label="Create Version"
          onClick={handleCreateVersion}
          loading={actionLoading === "version"}
        />
        <ActionButton
          icon={<ArrowLeftRight className="h-4 w-4" />}
          label="Compare"
          onClick={handleCompare}
        />
      </div>

      {/* ── Summary block ───────────────────────────────────────────── */}
      {report.summaryBlock && report.summaryBlock.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {report.summaryBlock.map((metric, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-zinc-800 bg-zinc-800/60 p-4 transition-all duration-200 hover:border-red-500/30 hover:bg-zinc-800/80"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {metric.label}
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-zinc-100">
                  {metric.value}
                  {metric.unit && (
                    <span className="ml-1 text-sm font-normal text-zinc-500">
                      {metric.unit}
                    </span>
                  )}
                </span>
                {metric.change !== undefined && metric.change !== null && (
                  <span
                    className={`mb-0.5 text-sm font-medium ${
                      metric.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {metric.change >= 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Visual blocks ───────────────────────────────────────────── */}
      {report.visualConfig && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <VisualRenderer layout={report.visualConfig} />
        </div>
      )}

      {/* ── Source entities ──────────────────────────────────────────── */}
      {report.sourceEntities && report.sourceEntities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Source Entities
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.sourceEntities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => handleOpenEntity(entity)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300 transition-all duration-150 hover:border-red-500/40 hover:bg-zinc-800"
              >
                <ExternalLink className="h-3 w-3 text-zinc-500" />
                <span className="text-xs text-zinc-500">{entity.type}:</span>
                {entity.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionButton
// ---------------------------------------------------------------------------

function ActionButton({
  icon,
  label,
  onClick,
  loading = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-red-500/50 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <LoadingGlobe size="sm" /> : icon}
      {label}
    </button>
  );
}
