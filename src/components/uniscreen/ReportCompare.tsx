"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  FileText,
  Link2,
  Link2Off,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { VisualRenderer } from "./visual-engine/VisualRenderer";
import type { VisualLayout } from "./visual-engine/component-registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportSummaryMetric {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

interface CompareReport {
  id: string;
  title: string;
  reportType: string;
  moduleKey: string;
  mode: "SNAPSHOT" | "LIVE";
  status: "PENDING" | "GENERATING" | "GENERATED" | "FAILED" | "ARCHIVED";
  version: number;
  generatedAt?: string;
  snapshotDate?: string;
  summaryBlock?: ReportSummaryMetric[];
  visualConfig?: VisualLayout;
  createdAt: string;
}

interface MetricDelta {
  label: string;
  valueA: string | number;
  valueB: string | number;
  deltaPercent: number | null;
  direction: "up" | "down" | "neutral";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReportCompareProps {
  reportIdA: string;
  reportIdB: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  GENERATING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  GENERATED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
  ARCHIVED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toNumber(v: string | number): number {
  if (typeof v === "number") return v;
  const parsed = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

function computeDeltas(
  metricsA: ReportSummaryMetric[] | undefined,
  metricsB: ReportSummaryMetric[] | undefined,
): MetricDelta[] {
  if (!metricsA || !metricsB) return [];

  const mapB = new Map<string, ReportSummaryMetric>();
  for (const m of metricsB) mapB.set(m.label, m);

  return metricsA.map((a) => {
    const b = mapB.get(a.label);
    if (!b) {
      return {
        label: a.label,
        valueA: a.value,
        valueB: "--",
        deltaPercent: null,
        direction: "neutral" as const,
      };
    }

    const numA = toNumber(a.value);
    const numB = toNumber(b.value);
    let deltaPercent: number | null = null;
    let direction: "up" | "down" | "neutral" = "neutral";

    if (numA !== 0) {
      deltaPercent = ((numB - numA) / Math.abs(numA)) * 100;
      deltaPercent = Math.round(deltaPercent * 10) / 10;
      direction = deltaPercent > 0 ? "up" : deltaPercent < 0 ? "down" : "neutral";
    }

    return {
      label: a.label,
      valueA: a.value,
      valueB: b.value,
      deltaPercent,
      direction,
    };
  });
}

function computeChangeSummary(deltas: MetricDelta[]): string[] {
  const significant = deltas.filter(
    (d) => d.deltaPercent !== null && Math.abs(d.deltaPercent) >= 5,
  );
  if (significant.length === 0) return ["No significant changes detected."];

  return significant.map((d) => {
    const arrow = d.direction === "up" ? "increased" : "decreased";
    return `${d.label} ${arrow} by ${Math.abs(d.deltaPercent!)}% (${d.valueA} -> ${d.valueB})`;
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CompareSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex gap-4">
        <div className="h-8 w-48 rounded-lg bg-zinc-800" />
        <div className="h-8 w-48 rounded-lg bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 rounded-xl bg-zinc-800" />
        <div className="h-64 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportCompare({
  reportIdA,
  reportIdB,
}: ReportCompareProps) {
  const [reportA, setReportA] = useState<CompareReport | null>(null);
  const [reportB, setReportB] = useState<CompareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<"left" | "right" | null>(null);

  // ── Fetch reports ────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`${API_URL}/api/admin/reports/${reportIdA}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/admin/reports/${reportIdB}`, {
          credentials: "include",
        }),
      ]);

      if (!resA.ok)
        throw new Error(`Failed to load Report A (${resA.status})`);
      if (!resB.ok)
        throw new Error(`Failed to load Report B (${resB.status})`);

      const dataA = await resA.json();
      const dataB = await resB.json();

      setReportA(dataA.report ?? dataA);
      setReportB(dataB.report ?? dataB);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [reportIdA, reportIdB]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Sync scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!syncScroll) return;

    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    function onScrollLeft() {
      if (scrollingRef.current === "right") return;
      scrollingRef.current = "left";
      if (rightRef.current && leftRef.current) {
        rightRef.current.scrollTop = leftRef.current.scrollTop;
      }
      requestAnimationFrame(() => {
        scrollingRef.current = null;
      });
    }

    function onScrollRight() {
      if (scrollingRef.current === "left") return;
      scrollingRef.current = "right";
      if (leftRef.current && rightRef.current) {
        leftRef.current.scrollTop = rightRef.current.scrollTop;
      }
      requestAnimationFrame(() => {
        scrollingRef.current = null;
      });
    }

    left.addEventListener("scroll", onScrollLeft, { passive: true });
    right.addEventListener("scroll", onScrollRight, { passive: true });

    return () => {
      left.removeEventListener("scroll", onScrollLeft);
      right.removeEventListener("scroll", onScrollRight);
    };
  }, [syncScroll, reportA, reportB]);

  // ── Render states ────────────────────────────────────────────────────
  if (loading) return <CompareSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
          {error}
        </div>
        <button
          onClick={fetchReports}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!reportA || !reportB) return null;

  const deltas = computeDeltas(reportA.summaryBlock, reportB.summaryBlock);
  const changeSummary = computeChangeSummary(deltas);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-zinc-200">
              {reportA.title}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[reportA.status] ?? ""
              }`}
            >
              {reportA.status}
            </span>
          </div>
          <span className="text-xs font-bold text-zinc-500">VS</span>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-400" />
            <span className="text-sm font-semibold text-zinc-200">
              {reportB.title}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[reportB.status] ?? ""
              }`}
            >
              {reportB.status}
            </span>
          </div>
        </div>

        {/* Sync scroll toggle */}
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
            syncScroll
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {syncScroll ? (
            <Link2 className="h-4 w-4" />
          ) : (
            <Link2Off className="h-4 w-4" />
          )}
          {syncScroll ? "Synced" : "Unsynced"}
        </button>
      </div>

      {/* ── Comparison metrics ──────────────────────────────────────── */}
      {deltas.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Metric Comparison
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {deltas.map((delta, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-800 bg-zinc-800/60 p-3 transition-all duration-200 hover:border-zinc-700"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {delta.label}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-blue-400">A</p>
                      <p className="text-sm font-bold text-zinc-200">
                        {delta.valueA}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-red-400">B</p>
                      <p className="text-sm font-bold text-zinc-200">
                        {delta.valueB}
                      </p>
                    </div>
                  </div>
                  {delta.deltaPercent !== null && (
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        delta.direction === "up"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : delta.direction === "down"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {delta.direction === "up" && (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {delta.direction === "down" && (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {delta.direction === "neutral" && (
                        <Minus className="h-3 w-3" />
                      )}
                      {delta.deltaPercent > 0 ? "+" : ""}
                      {delta.deltaPercent}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── What Changed summary ────────────────────────────────────── */}
      {changeSummary.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            What Changed
          </h3>
          <ul className="space-y-1">
            {changeSummary.map((line, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Split view ──────────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-1 divide-x divide-zinc-800 overflow-hidden md:grid-cols-2">
        {/* Report A */}
        <div ref={leftRef} className="overflow-y-auto">
          <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-xs font-bold text-blue-400">
                  A
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {reportA.title}
                </span>
                <span className="text-xs text-zinc-500">v{reportA.version}</span>
              </div>
              {reportA.generatedAt && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(reportA.generatedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 md:p-6">
            {reportA.summaryBlock && reportA.summaryBlock.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {reportA.summaryBlock.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-800 bg-zinc-800/60 p-3"
                  >
                    <p className="text-xs text-zinc-500">{m.label}</p>
                    <p className="mt-1 text-lg font-bold text-zinc-200">
                      {m.value}
                      {m.unit && (
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          {m.unit}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {reportA.visualConfig && (
              <VisualRenderer layout={reportA.visualConfig} />
            )}
            {!reportA.visualConfig &&
              (!reportA.summaryBlock ||
                reportA.summaryBlock.length === 0) && (
                <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
                  No visual data available for this report.
                </div>
              )}
          </div>
        </div>

        {/* Report B */}
        <div ref={rightRef} className="overflow-y-auto">
          <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-xs font-bold text-red-400">
                  B
                </span>
                <span className="text-sm font-semibold text-zinc-200">
                  {reportB.title}
                </span>
                <span className="text-xs text-zinc-500">v{reportB.version}</span>
              </div>
              {reportB.generatedAt && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {formatDate(reportB.generatedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 md:p-6">
            {reportB.summaryBlock && reportB.summaryBlock.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {reportB.summaryBlock.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-800 bg-zinc-800/60 p-3"
                  >
                    <p className="text-xs text-zinc-500">{m.label}</p>
                    <p className="mt-1 text-lg font-bold text-zinc-200">
                      {m.value}
                      {m.unit && (
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          {m.unit}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {reportB.visualConfig && (
              <VisualRenderer layout={reportB.visualConfig} />
            )}
            {!reportB.visualConfig &&
              (!reportB.summaryBlock ||
                reportB.summaryBlock.length === 0) && (
                <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
                  No visual data available for this report.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
