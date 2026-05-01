"use client";

import type { VisualComponentType } from "./component-registry";

// ---------------------------------------------------------------------------
// MetricCard — single metric with title, value, change indicator
// ---------------------------------------------------------------------------
export function MetricCard({
  data,
}: {
  data: {
    title: string;
    value: string | number;
    change?: number;
    unit?: string;
  };
}) {
  const isPositive = (data.change ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-700">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {data.title}
      </p>
      <p className="mt-2 text-3xl font-bold text-zinc-100">
        {data.value}
        {data.unit && (
          <span className="ml-1 text-base font-normal text-zinc-500">
            {data.unit}
          </span>
        )}
      </p>
      {data.change !== undefined && (
        <p
          className={`mt-1 text-sm font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "\u25B2" : "\u25BC"} {Math.abs(data.change)}%
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparisonGrid — side by side comparison table
// ---------------------------------------------------------------------------
export function ComparisonGrid({
  data,
}: {
  data: {
    items: Array<{ label: string; values: (string | number)[] }>;
    headers: string[];
  };
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              &nbsp;
            </th>
            {data.headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr
              key={item.label}
              className={idx % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60"}
            >
              <td className="px-4 py-3 font-medium text-zinc-300">
                {item.label}
              </td>
              {item.values.map((v, vi) => (
                <td key={vi} className="px-4 py-3 text-zinc-400">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusPanel — system status with colored indicators
// ---------------------------------------------------------------------------
export function StatusPanel({
  data,
}: {
  data: {
    items: Array<{
      label: string;
      status: "healthy" | "warning" | "critical" | "unknown";
      value?: string;
    }>;
  };
}) {
  const dotColor: Record<string, string> = {
    healthy: "bg-emerald-400",
    warning: "bg-amber-400",
    critical: "bg-red-400",
    unknown: "bg-zinc-500",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <ul className="space-y-3">
        {data.items.map((item) => (
          <li key={item.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor[item.status]}`}
              />
              {item.label}
            </span>
            {item.value && (
              <span className="text-xs text-zinc-500">{item.value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertBanner — colored alert with icon and message
// ---------------------------------------------------------------------------
export function AlertBanner({
  data,
}: {
  data: {
    level: "info" | "warning" | "critical";
    message: string;
    action?: string;
  };
}) {
  const styles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    info: {
      bg: "bg-sky-950/40",
      border: "border-sky-800",
      text: "text-sky-300",
      icon: "\u2139",
    },
    warning: {
      bg: "bg-amber-950/40",
      border: "border-amber-800",
      text: "text-amber-300",
      icon: "\u26A0",
    },
    critical: {
      bg: "bg-red-950/40",
      border: "border-red-800",
      text: "text-red-300",
      icon: "\u26D4",
    },
  };

  const s = styles[data.level];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border ${s.border} ${s.bg} p-4 transition-all duration-150`}
    >
      <span className="mt-0.5 text-lg">{s.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${s.text}`}>{data.message}</p>
        {data.action && (
          <p className="mt-1 text-xs text-zinc-400">{data.action}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTable — tabular data with striped rows
// ---------------------------------------------------------------------------
export function DataTable({
  data,
}: {
  data: { headers: string[]; rows: (string | number)[][] };
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {data.headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60"}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChecklistPanel — checkbox list
// ---------------------------------------------------------------------------
export function ChecklistPanel({
  data,
}: {
  data: { items: Array<{ text: string; checked: boolean }> };
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <ul className="space-y-2">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                item.checked
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-zinc-700 bg-zinc-800"
              }`}
            >
              {item.checked && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span
              className={
                item.checked
                  ? "text-zinc-500 line-through"
                  : "text-zinc-300"
              }
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressTracker — horizontal progress bar with stage markers
// ---------------------------------------------------------------------------
export function ProgressTracker({
  data,
}: {
  data: {
    stages: Array<{ name: string; completed: boolean; active?: boolean }>;
    percentComplete: number;
  };
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, data.percentComplete))}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-zinc-500">
        {data.percentComplete}%
      </p>

      {/* Stage markers */}
      <div className="mt-4 flex flex-wrap gap-3">
        {data.stages.map((stage) => (
          <span
            key={stage.name}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              stage.completed
                ? "bg-emerald-950/50 text-emerald-400"
                : stage.active
                  ? "bg-violet-950/50 text-violet-400"
                  : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {stage.completed ? "\u2713" : stage.active ? "\u25CF" : "\u25CB"}{" "}
            {stage.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportHeader — large title section with metadata
// ---------------------------------------------------------------------------
export function ReportHeader({
  data,
}: {
  data: {
    title: string;
    subtitle?: string;
    date?: string;
    generatedBy?: string;
  };
}) {
  return (
    <div className="border-b border-zinc-800 pb-5">
      <h2 className="text-2xl font-bold text-zinc-100">{data.title}</h2>
      {data.subtitle && (
        <p className="mt-1 text-sm text-zinc-400">{data.subtitle}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        {data.date && <span>Date: {data.date}</span>}
        {data.generatedBy && <span>Generated by: {data.generatedBy}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimelineView — vertical timeline of events
// ---------------------------------------------------------------------------
export function TimelineView({
  data,
}: {
  data: {
    events: Array<{
      time: string;
      title: string;
      description?: string;
      type?: string;
    }>;
  };
}) {
  const typeColor: Record<string, string> = {
    success: "bg-emerald-400",
    error: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-sky-400",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="relative space-y-6">
        {/* Vertical connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />

        {data.events.map((event, i) => (
          <div key={i} className="relative flex gap-4 pl-6">
            {/* Dot */}
            <span
              className={`absolute left-0 top-1.5 h-[14px] w-[14px] rounded-full border-2 border-zinc-900 ${
                typeColor[event.type ?? "info"] ?? "bg-zinc-500"
              }`}
            />
            <div className="flex-1">
              <p className="text-xs text-zinc-500">{event.time}</p>
              <p className="text-sm font-medium text-zinc-200">
                {event.title}
              </p>
              {event.description && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KanbanBoard — columns with cards, drag-ready styling
// ---------------------------------------------------------------------------
export function KanbanBoard({
  data,
}: {
  data: {
    columns: Array<{
      id: string;
      title: string;
      cards: Array<{
        id: string;
        title: string;
        subtitle?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        assignee?: string;
      }>;
    }>;
  };
}) {
  const priorityStyles: Record<string, string> = {
    low: "border-l-zinc-600",
    medium: "border-l-sky-500",
    high: "border-l-amber-500",
    urgent: "border-l-red-500",
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex gap-4" style={{ minWidth: `${data.columns.length * 280}px` }}>
        {data.columns.map((column) => (
          <div
            key={column.id}
            className="flex w-[260px] shrink-0 flex-col rounded-lg bg-zinc-800/50"
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-zinc-700/50 px-3 py-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {column.title}
              </h4>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {column.cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 p-2">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  className={`cursor-pointer rounded-lg border border-zinc-700/50 border-l-2 bg-zinc-900 p-3 shadow-sm transition-all duration-150 hover:border-zinc-600 hover:shadow-md ${
                    priorityStyles[card.priority ?? "low"] ?? "border-l-zinc-600"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-200">{card.title}</p>
                  {card.subtitle && (
                    <p className="mt-1 text-xs text-zinc-500">{card.subtitle}</p>
                  )}
                  {(card.assignee || card.priority) && (
                    <div className="mt-2 flex items-center justify-between">
                      {card.assignee && (
                        <span className="rounded-full bg-violet-950/50 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                          {card.assignee}
                        </span>
                      )}
                      {card.priority && card.priority !== "low" && (
                        <span
                          className={`text-[10px] font-semibold uppercase ${
                            card.priority === "urgent"
                              ? "text-red-400"
                              : card.priority === "high"
                                ? "text-amber-400"
                                : "text-sky-400"
                          }`}
                        >
                          {card.priority}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {column.cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-700/50 p-4 text-center text-xs text-zinc-600">
                  No items
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkflowDiagram — step nodes connected by lines
// ---------------------------------------------------------------------------
export function WorkflowDiagram({
  data,
}: {
  data: {
    steps: Array<{
      id: string;
      label: string;
      status: "active" | "completed" | "pending";
      description?: string;
    }>;
  };
}) {
  const statusStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    completed: {
      bg: "bg-emerald-950/30",
      border: "border-emerald-700",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    active: {
      bg: "bg-violet-950/30",
      border: "border-violet-600",
      text: "text-violet-300",
      dot: "bg-violet-400",
    },
    pending: {
      bg: "bg-zinc-800/50",
      border: "border-zinc-700",
      text: "text-zinc-500",
      dot: "bg-zinc-600",
    },
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="relative flex flex-col gap-1">
        {data.steps.map((step, idx) => {
          const s = statusStyles[step.status];
          const isLast = idx === data.steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-4 w-4 rounded-full border-2 ${s.border} ${s.dot} transition-all duration-200`}
                />
                {!isLast && (
                  <div className="h-10 w-px bg-zinc-700" />
                )}
              </div>

              {/* Step card */}
              <div
                className={`mb-2 flex-1 rounded-lg border ${s.border} ${s.bg} p-3 transition-all duration-200`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${s.text}`}>{step.label}</span>
                  {step.status === "completed" && (
                    <span className="text-xs text-emerald-500">{"\u2713"}</span>
                  )}
                  {step.status === "active" && (
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                  )}
                </div>
                {step.description && (
                  <p className="mt-1 text-xs text-zinc-500">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EntitySummary — entity header with key fields, status, action buttons
// ---------------------------------------------------------------------------
export function EntitySummary({
  data,
}: {
  data: {
    name: string;
    entityType: string;
    status?: string;
    fields: Array<{ label: string; value: string | number }>;
    actions?: string[];
  };
}) {
  const statusColor: Record<string, string> = {
    active: "bg-emerald-950/50 text-emerald-400 border-emerald-800",
    inactive: "bg-zinc-800 text-zinc-500 border-zinc-700",
    pending: "bg-amber-950/50 text-amber-400 border-amber-800",
    closed: "bg-red-950/50 text-red-400 border-red-800",
    won: "bg-emerald-950/50 text-emerald-400 border-emerald-800",
    lost: "bg-red-950/50 text-red-400 border-red-800",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            {data.entityType}
          </p>
          <h3 className="mt-1 text-lg font-bold text-zinc-100">{data.name}</h3>
        </div>
        {data.status && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              statusColor[data.status.toLowerCase()] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            {data.status}
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {data.fields.map((field) => (
          <div key={field.label}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              {field.label}
            </p>
            <p className="mt-0.5 text-sm text-zinc-300">{field.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {data.actions && data.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
          {data.actions.map((action) => (
            <button
              key={action}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-150 hover:border-violet-600 hover:text-violet-300"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiagnosticPanel — system area, error list, severity, recommendations
// ---------------------------------------------------------------------------
export function DiagnosticPanel({
  data,
}: {
  data: {
    systemArea: string;
    overallStatus: "healthy" | "warning" | "critical";
    errors?: Array<{ message: string; severity: string; code?: string }>;
    recommendations?: string[];
    metrics?: Record<string, string | number>;
  };
}) {
  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    healthy: { color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-800", label: "HEALTHY" },
    warning: { color: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-800", label: "WARNING" },
    critical: { color: "text-red-400", bg: "bg-red-950/30", border: "border-red-800", label: "CRITICAL" },
  };

  const severityColor: Record<string, string> = {
    low: "bg-zinc-700 text-zinc-300",
    medium: "bg-amber-900/50 text-amber-400",
    high: "bg-red-900/50 text-red-400",
    critical: "bg-red-800/70 text-red-300",
  };

  const sc = statusConfig[data.overallStatus];

  return (
    <div className={`rounded-xl border ${sc.border} ${sc.bg} p-5 transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            System Diagnostic
          </p>
          <h3 className="mt-1 text-lg font-bold text-zinc-100">{data.systemArea}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${sc.color} ${sc.border}`}>
          {sc.label}
        </span>
      </div>

      {/* Metrics */}
      {data.metrics && Object.keys(data.metrics).length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Object.entries(data.metrics).map(([key, val]) => (
            <div key={key} className="rounded-lg bg-zinc-900/60 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{key}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-200">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Errors</p>
          <div className="space-y-2">
            {data.errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-zinc-900/60 p-2.5"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    severityColor[err.severity] ?? "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {err.severity}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-zinc-300">{err.message}</p>
                  {err.code && (
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{err.code}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recommended Actions
          </p>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="mt-0.5 text-violet-400">{"\u25B8"}</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkOrderBoard — mini work order cards in status columns
// ---------------------------------------------------------------------------
export function WorkOrderBoard({
  data,
}: {
  data: {
    columns: Array<{
      id: string;
      title: string;
      orders: Array<{
        id: string;
        title: string;
        priority: "low" | "medium" | "high" | "urgent";
        assignee?: string;
        dueDate?: string;
      }>;
    }>;
  };
}) {
  const priorityDot: Record<string, string> = {
    low: "bg-zinc-500",
    medium: "bg-sky-400",
    high: "bg-amber-400",
    urgent: "bg-red-400",
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex gap-3" style={{ minWidth: `${data.columns.length * 260}px` }}>
        {data.columns.map((column) => (
          <div key={column.id} className="w-[240px] shrink-0">
            {/* Column header */}
            <div className="mb-2 flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {column.title}
              </h4>
              <span className="text-[10px] text-zinc-600">{column.orders.length}</span>
            </div>

            {/* Orders */}
            <div className="space-y-2">
              {column.orders.map((order) => (
                <div
                  key={order.id}
                  className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 transition-all duration-150 hover:border-zinc-700 hover:shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityDot[order.priority]}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-200">{order.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {order.assignee && (
                          <span className="text-[10px] text-zinc-500">{order.assignee}</span>
                        )}
                        {order.dueDate && (
                          <span className="text-[10px] text-zinc-600">{order.dueDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {column.orders.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-800 p-3 text-center text-[10px] text-zinc-600">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationFeed — scrollable notification list
// ---------------------------------------------------------------------------
export function NotificationFeed({
  data,
}: {
  data: {
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      read: boolean;
      level?: "info" | "warning" | "critical";
      source?: string;
    }>;
  };
}) {
  const levelDot: Record<string, string> = {
    info: "bg-sky-400",
    warning: "bg-amber-400",
    critical: "bg-red-400",
  };

  return (
    <div className="max-h-[400px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900">
      {data.notifications.length === 0 && (
        <div className="p-6 text-center text-xs text-zinc-600">No notifications</div>
      )}
      {data.notifications.map((notif, idx) => (
        <div
          key={notif.id}
          className={`flex items-start gap-3 border-b border-zinc-800/50 p-4 transition-all duration-150 hover:bg-zinc-800/30 ${
            !notif.read ? "bg-zinc-800/20" : ""
          } ${idx === data.notifications.length - 1 ? "border-b-0" : ""}`}
        >
          {/* Attention indicator */}
          <div className="mt-1.5 flex shrink-0 flex-col items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                levelDot[notif.level ?? "info"] ?? "bg-sky-400"
              }`}
            />
            {!notif.read && (
              <span className="h-1 w-1 rounded-full bg-violet-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium ${notif.read ? "text-zinc-400" : "text-zinc-200"}`}>
                {notif.title}
              </p>
              <span className="shrink-0 text-[10px] text-zinc-600">{notif.time}</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{notif.message}</p>
            {notif.source && (
              <span className="mt-1.5 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {notif.source}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskPanel — task list with checkboxes, priority, assignee
// ---------------------------------------------------------------------------
export function TaskPanel({
  data,
}: {
  data: {
    tasks: Array<{
      id: string;
      title: string;
      completed: boolean;
      priority?: "low" | "medium" | "high" | "urgent";
      assignee?: string;
      dueDate?: string;
    }>;
  };
}) {
  const priorityLabel: Record<string, { text: string; color: string }> = {
    low: { text: "LOW", color: "text-zinc-500" },
    medium: { text: "MED", color: "text-sky-400" },
    high: { text: "HIGH", color: "text-amber-400" },
    urgent: { text: "URG", color: "text-red-400" },
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <ul className="space-y-2">
        {data.tasks.map((task) => {
          const pr = priorityLabel[task.priority ?? "low"];
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-all duration-150 hover:bg-zinc-800/50"
            >
              {/* Checkbox */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  task.completed
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-zinc-700 bg-zinc-800"
                }`}
              >
                {task.completed && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              {/* Content */}
              <div className="flex flex-1 items-center justify-between">
                <span
                  className={`text-sm ${
                    task.completed ? "text-zinc-500 line-through" : "text-zinc-300"
                  }`}
                >
                  {task.title}
                </span>

                <div className="flex items-center gap-2">
                  {task.assignee && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                      {task.assignee}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[10px] text-zinc-600">{task.dueDate}</span>
                  )}
                  {pr && (
                    <span className={`text-[10px] font-bold ${pr.color}`}>{pr.text}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VisualComponentRenderer — dispatcher that maps type to component
// ---------------------------------------------------------------------------
const componentMap: Record<
  VisualComponentType,
  React.ComponentType<{ data: any }>
> = {
  metric_card: MetricCard,
  comparison_grid: ComparisonGrid,
  status_panel: StatusPanel,
  alert_banner: AlertBanner,
  data_table: DataTable,
  checklist_panel: ChecklistPanel,
  progress_tracker: ProgressTracker,
  report_header: ReportHeader,
  timeline_view: TimelineView,
  kanban_board: KanbanBoard,
  workflow_diagram: WorkflowDiagram,
  entity_summary: EntitySummary,
  diagnostic_panel: DiagnosticPanel,
  work_order_board: WorkOrderBoard,
  notification_feed: NotificationFeed,
  task_panel: TaskPanel,
  // Chart types — mapped to MetricCard as visual placeholder until chart lib is integrated
  bar_chart: MetricCard,
  line_chart: MetricCard,
  chart_line: MetricCard,
  chart_pie: MetricCard,
  // Lesson types — mapped to existing components with compatible data shapes
  lesson_card: ChecklistPanel,
  lesson_module: ChecklistPanel,
  document_preview: ReportHeader,
};

export function VisualComponentRenderer({
  type,
  data,
  title,
}: {
  type: VisualComponentType;
  data: Record<string, any>;
  title?: string;
}) {
  const Component = componentMap[type];

  if (!Component) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
        Unknown component: {type}
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">{title}</h3>
      )}
      <Component data={data} />
    </div>
  );
}
