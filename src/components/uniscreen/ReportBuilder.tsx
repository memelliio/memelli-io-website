"use client";

import { useCallback, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Layers,
  LayoutGrid,
  Pin,
  PinOff,
  Plus,
  Save,
  Settings,
  Sliders,
  Trash2,
  X,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { useWorkspaceTabStore } from "@/stores/workspace-store";
import { VisualRenderer } from "./visual-engine/VisualRenderer";
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  COMPONENT_REGISTRY,
  LAYOUT_REGISTRY
} from "./visual-engine/component-registry";
import type {
  LayoutType,
  VisualComponentType,
  VisualLayout
} from "./visual-engine/component-registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface BuilderConfig {
  moduleKey: string;
  reportType: string;
  entityFilter: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  filters: FilterRow[];
  groupBy: string;
  metrics: string[];
  layoutType: LayoutType;
  visualBlocks: VisualComponentType[];
  title: string;
  description: string;
  mode: "SNAPSHOT" | "LIVE";
  isPinned: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODULES = [
  { key: "commerce", label: "Commerce", icon: "shopping-bag" },
  { key: "crm", label: "CRM", icon: "users" },
  { key: "coaching", label: "Coaching", icon: "graduation-cap" },
  { key: "seo", label: "SEO Traffic", icon: "globe" },
  { key: "analytics", label: "Analytics", icon: "bar-chart" },
  { key: "agents", label: "Agents", icon: "cpu" },
  { key: "credit", label: "Credit", icon: "credit-card" },
  { key: "funding", label: "Funding", icon: "dollar-sign" },
];

const REPORT_TYPES = [
  {
    key: "performance_summary",
    label: "Performance Summary",
    description: "Key metrics and KPI overview"
  },
  {
    key: "trend_analysis",
    label: "Trend Analysis",
    description: "Historical data patterns over time"
  },
  {
    key: "pipeline_health",
    label: "Pipeline Health",
    description: "Pipeline conversion and bottleneck analysis"
  },
  {
    key: "revenue_breakdown",
    label: "Revenue Breakdown",
    description: "Revenue by source, product, and segment"
  },
  {
    key: "agent_activity",
    label: "Agent Activity",
    description: "Agent performance and task completion"
  },
  {
    key: "engagement_report",
    label: "Engagement Report",
    description: "User engagement and activity metrics"
  },
  {
    key: "compliance_audit",
    label: "Compliance Audit",
    description: "Regulatory and compliance status check"
  },
  {
    key: "custom",
    label: "Custom Report",
    description: "Build a fully custom report from scratch"
  },
];

const OPERATORS = ["equals", "not_equals", "contains", "gt", "lt", "between"];

const METRIC_OPTIONS = [
  "total_revenue",
  "total_orders",
  "conversion_rate",
  "avg_deal_value",
  "active_contacts",
  "new_leads",
  "pipeline_velocity",
  "churn_rate",
  "agent_tasks_completed",
  "avg_response_time",
  "satisfaction_score",
  "sessions",
  "page_views",
  "bounce_rate",
];

const GROUP_OPTIONS = [
  "none",
  "day",
  "week",
  "month",
  "quarter",
  "year",
  "module",
  "status",
  "assignee",
  "source",
];

const STEP_LABELS = [
  "Source & Type",
  "Configuration",
  "Visual Layout",
  "Preview & Save",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSampleLayout(
  config: BuilderConfig,
): VisualLayout {
  const components = config.visualBlocks.map((type) => {
    const def = COMPONENT_REGISTRY.get(type);
    const sampleData: Record<string, unknown> = {};
    if (def) {
      for (const field of def.dataShape) {
        if (field.type === "string") sampleData[field.name] = `Sample ${field.name}`;
        if (field.type === "number") sampleData[field.name] = 42;
        if (field.type === "array") sampleData[field.name] = [];
        if (field.type === "boolean") sampleData[field.name] = true;
        if (field.type === "object") sampleData[field.name] = {};
      }
    }
    return {
      type,
      title: def?.displayName ?? type,
      data: sampleData as Record<string, any>
    };
  });

  return {
    type: config.layoutType,
    title: config.title || "Untitled Report",
    components
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReportBuilderProps {
  moduleKey?: string;
  entityId?: string;
  onSave?: (reportId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportBuilder({
  moduleKey,
  entityId,
  onSave
}: ReportBuilderProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const openTab = useWorkspaceTabStore((s) => s.openTab);

  const [config, setConfig] = useState<BuilderConfig>({
    moduleKey: moduleKey ?? "",
    reportType: "",
    entityFilter: entityId ?? "",
    dateRangeStart: "",
    dateRangeEnd: "",
    filters: [],
    groupBy: "none",
    metrics: [],
    layoutType: "report",
    visualBlocks: [],
    title: "",
    description: "",
    mode: "SNAPSHOT",
    isPinned: false
  });

  const update = useCallback(
    (patch: Partial<BuilderConfig>) =>
      setConfig((prev) => ({ ...prev, ...patch })),
    [],
  );

  // ── Filter management ────────────────────────────────────────────────
  function addFilter() {
    update({
      filters: [
        ...config.filters,
        { id: generateId(), field: "", operator: "equals", value: "" },
      ]
    });
  }

  function removeFilter(id: string) {
    update({ filters: config.filters.filter((f) => f.id !== id) });
  }

  function updateFilter(id: string, patch: Partial<FilterRow>) {
    update({
      filters: config.filters.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      )
    });
  }

  // ── Metric toggle ────────────────────────────────────────────────────
  function toggleMetric(metric: string) {
    update({
      metrics: config.metrics.includes(metric)
        ? config.metrics.filter((m) => m !== metric)
        : [...config.metrics, metric]
    });
  }

  // ── Visual block toggle ──────────────────────────────────────────────
  function toggleVisualBlock(type: VisualComponentType) {
    update({
      visualBlocks: config.visualBlocks.includes(type)
        ? config.visualBlocks.filter((b) => b !== type)
        : [...config.visualBlocks, type]
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      // Create report
      const createRes = await fetch(`${API_URL}/api/admin/reports`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.title || "Untitled Report",
          description: config.description,
          reportType: config.reportType,
          moduleKey: config.moduleKey,
          mode: config.mode,
          isPinned: config.isPinned,
          config: {
            entityFilter: config.entityFilter,
            dateRange: {
              start: config.dateRangeStart,
              end: config.dateRangeEnd
            },
            filters: config.filters.map(({ field, operator, value }) => ({
              field,
              operator,
              value
            })),
            groupBy: config.groupBy,
            metrics: config.metrics,
            layoutType: config.layoutType,
            visualBlocks: config.visualBlocks
          }
        })
      });

      if (!createRes.ok)
        throw new Error(`Failed to create report (${createRes.status})`);
      const created = await createRes.json();
      const reportId = created.report?.id ?? created.id;

      // Generate
      await fetch(`${API_URL}/api/admin/reports/${reportId}/generate`, {
        method: "POST",
        credentials: "include"
      });

      // Open in tab
      openTab({
        type: "report",
        title: config.title || "Untitled Report",
        icon: "file-text",
        entityId: reportId,
        entityType: "report",
        source: "user"
      });

      onSave?.(reportId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Step validation ──────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 0) return !!config.moduleKey && !!config.reportType;
    if (step === 1) return true;
    if (step === 2) return config.visualBlocks.length > 0;
    return !!config.title;
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <div className="flex items-center gap-3">
          {STEP_LABELS.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button
                onClick={() => idx <= step && setStep(idx)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                  idx < step
                    ? "bg-red-600 text-white"
                    : idx === step
                      ? "border-2 border-red-500 bg-red-500/20 text-red-400"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-500"
                }`}
              >
                {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
              </button>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  idx === step ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`h-px w-8 transition-colors duration-200 ${
                    idx < step ? "bg-red-600" : "bg-zinc-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 0 && (
          <StepSourceType
            config={config}
            update={update}
          />
        )}
        {step === 1 && (
          <StepConfiguration
            config={config}
            update={update}
            addFilter={addFilter}
            removeFilter={removeFilter}
            updateFilter={updateFilter}
            toggleMetric={toggleMetric}
          />
        )}
        {step === 2 && (
          <StepVisualLayout
            config={config}
            update={update}
            toggleVisualBlock={toggleVisualBlock}
          />
        )}
        {step === 3 && (
          <StepPreviewSave
            config={config}
            update={update}
            saving={saving}
            saveError={saveError}
            onSave={handleSave}
          />
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={!canAdvance()}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !config.title}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save & Generate"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Source & Type
// ---------------------------------------------------------------------------

function StepSourceType({
  config,
  update
}: {
  config: BuilderConfig;
  update: (patch: Partial<BuilderConfig>) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Module selector */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Layers className="mr-1.5 inline h-4 w-4" />
          Module
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODULES.map((mod) => (
            <button
              key={mod.key}
              onClick={() => update({ moduleKey: mod.key })}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                config.moduleKey === mod.key
                  ? "border-red-500 bg-red-500/10 text-red-300"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800"
              }`}
            >
              <p className="text-sm font-semibold">{mod.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Report type */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Settings className="mr-1.5 inline h-4 w-4" />
          Report Type
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.key}
              onClick={() => update({ reportType: rt.key })}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                config.reportType === rt.key
                  ? "border-red-500 bg-red-500/10"
                  : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  config.reportType === rt.key
                    ? "text-red-300"
                    : "text-zinc-300"
                }`}
              >
                {rt.label}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{rt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Entity filter */}
      <div className="space-y-2">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Entity Filter (optional)
        </label>
        <input
          type="text"
          value={config.entityFilter}
          onChange={(e) => update({ entityFilter: e.target.value })}
          placeholder="Filter to specific entity ID..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Configuration
// ---------------------------------------------------------------------------

function StepConfiguration({
  config,
  update,
  addFilter,
  removeFilter,
  updateFilter,
  toggleMetric
}: {
  config: BuilderConfig;
  update: (patch: Partial<BuilderConfig>) => void;
  addFilter: () => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, patch: Partial<FilterRow>) => void;
  toggleMetric: (metric: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Date range */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Date Range
        </label>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={config.dateRangeStart}
            onChange={(e) => update({ dateRangeStart: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors duration-150 focus:border-red-500/50"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={config.dateRangeEnd}
            onChange={(e) => update({ dateRangeEnd: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors duration-150 focus:border-red-500/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Sliders className="mr-1.5 inline h-4 w-4" />
            Filters
          </label>
          <button
            onClick={addFilter}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-red-500/50 hover:bg-zinc-700"
          >
            <Plus className="h-3 w-3" />
            Add Filter
          </button>
        </div>
        {config.filters.length === 0 && (
          <p className="text-sm text-zinc-500">
            No filters added. Click "Add Filter" to narrow your report data.
          </p>
        )}
        <div className="space-y-2">
          {config.filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/40 p-3"
            >
              <input
                type="text"
                value={filter.field}
                onChange={(e) =>
                  updateFilter(filter.id, { field: e.target.value })
                }
                placeholder="Field name"
                className="w-36 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-red-500/50"
              />
              <div className="relative">
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(filter.id, { operator: e.target.value })
                  }
                  className="appearance-none rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pl-3 pr-8 text-sm text-zinc-200 outline-none focus:border-red-500/50"
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
              </div>
              <input
                type="text"
                value={filter.value}
                onChange={(e) =>
                  updateFilter(filter.id, { value: e.target.value })
                }
                placeholder="Value"
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-red-500/50"
              />
              <button
                onClick={() => removeFilter(filter.id)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors duration-150 hover:bg-zinc-700 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grouping */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Group By
        </label>
        <div className="relative w-48">
          <select
            value={config.groupBy}
            onChange={(e) => update({ groupBy: e.target.value })}
            className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800/80 py-2.5 pl-4 pr-10 text-sm text-zinc-200 outline-none transition-colors duration-150 focus:border-red-500/50"
          >
            {GROUP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "none" ? "No grouping" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Metrics
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {METRIC_OPTIONS.map((metric) => {
            const selected = config.metrics.includes(metric);
            return (
              <button
                key={metric}
                onClick={() => toggleMetric(metric)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all duration-150 ${
                  selected
                    ? "border-red-500 bg-red-500/10 text-red-300"
                    : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors duration-150 ${
                    selected
                      ? "border-red-500 bg-red-600"
                      : "border-zinc-600 bg-zinc-800"
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
                {metric.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Visual Layout
// ---------------------------------------------------------------------------

function StepVisualLayout({
  config,
  update,
  toggleVisualBlock
}: {
  config: BuilderConfig;
  update: (patch: Partial<BuilderConfig>) => void;
  toggleVisualBlock: (type: VisualComponentType) => void;
}) {
  const layouts = Array.from(LAYOUT_REGISTRY.entries());
  const components = Array.from(COMPONENT_REGISTRY.entries());

  return (
    <div className="space-y-8">
      {/* Layout type */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <LayoutGrid className="mr-1.5 inline h-4 w-4" />
          Layout
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {layouts.map(([key, def]) => (
            <button
              key={key}
              onClick={() => update({ layoutType: key as LayoutType })}
              className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                config.layoutType === key
                  ? "border-red-500 bg-red-500/10"
                  : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  config.layoutType === key
                    ? "text-red-300"
                    : "text-zinc-300"
                }`}
              >
                {def.displayName}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Max {def.maxComponents} components
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Visual blocks */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Visual Components
        </label>
        <p className="text-xs text-zinc-500">
          Select the visual blocks to include in your report. Order matters.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {components.map(([key, def]) => {
            const selected = config.visualBlocks.includes(
              key as VisualComponentType,
            );
            return (
              <button
                key={key}
                onClick={() => toggleVisualBlock(key as VisualComponentType)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  selected
                    ? "border-red-500 bg-red-500/10"
                    : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                    selected
                      ? "border-red-500 bg-red-600"
                      : "border-zinc-600 bg-zinc-800"
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      selected ? "text-red-300" : "text-zinc-300"
                    }`}
                  >
                    {def.displayName}
                  </p>
                  <p className="text-xs text-zinc-500">{def.category}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected blocks summary */}
      {config.visualBlocks.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Selected ({config.visualBlocks.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {config.visualBlocks.map((type) => {
              const def = COMPONENT_REGISTRY.get(type);
              return (
                <span
                  key={type}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300"
                >
                  {def?.displayName ?? type}
                  <button
                    onClick={() => toggleVisualBlock(type)}
                    className="rounded-full p-0.5 transition-colors duration-150 hover:bg-red-500/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Preview & Save
// ---------------------------------------------------------------------------

function StepPreviewSave({
  config,
  update,
  saving,
  saveError,
  onSave
}: {
  config: BuilderConfig;
  update: (patch: Partial<BuilderConfig>) => void;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
}) {
  const sampleLayout = buildSampleLayout(config);

  return (
    <div className="space-y-8">
      {/* Title & description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Report Title
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Enter report title..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-lg font-semibold text-zinc-100 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Description
          </label>
          <textarea
            value={config.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Brief description of this report..."
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors duration-150 focus:border-red-500/50"
          />
        </div>
      </div>

      {/* Mode & pin */}
      <div className="flex items-center gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Mode
          </label>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            <button
              onClick={() => update({ mode: "SNAPSHOT" })}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                config.mode === "SNAPSHOT"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Snapshot
            </button>
            <button
              onClick={() => update({ mode: "LIVE" })}
              className={`flex items-center gap-1.5 border-l border-zinc-700 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                config.mode === "LIVE"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Live
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Pin to Dashboard
          </label>
          <button
            onClick={() => update({ isPinned: !config.isPinned })}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 ${
              config.isPinned
                ? "border-red-500 bg-red-500/10 text-red-400"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {config.isPinned ? (
              <Pin className="h-4 w-4" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
            {config.isPinned ? "Pinned" : "Not Pinned"}
          </button>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      {/* Preview */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Eye className="mr-1.5 inline h-4 w-4" />
          Preview
        </label>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          {config.visualBlocks.length > 0 ? (
            <VisualRenderer layout={sampleLayout} />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
              No visual blocks selected. Go back to add components.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
