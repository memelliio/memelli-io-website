"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Pause,
  Play,
  Power,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  XCircle,
  Zap
} from "lucide-react";
import { API_URL } from "@/lib/config";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("memelli_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/admin/observability${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(opts?.headers || {})
    },
    credentials: "include"
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemHealthSnapshot {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  redisMemory: number;
  dbPoolUsage: number;
  uptimeSeconds: number;
}

interface WorkflowMetrics {
  active: number;
  completed: number;
  failed: number;
  avgExecutionTimeMs: number;
}

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  completionRate: number;
  failureRate: number;
  avgTaskTimeMs: number;
}

interface TaskMetrics {
  queueSizes: Record<string, number>;
  tasksPerMin: number;
  avgExecutionTimeMs: Record<string, number>;
}

interface EventMetrics {
  eventsPerSec: number;
  processingLatencyMs: number;
  eventBacklog: number;
}

interface Alert {
  alertId: string;
  severity: "info" | "warning" | "error" | "critical";
  source: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

interface OperationalSummary {
  health: SystemHealthSnapshot;
  workflows: WorkflowMetrics;
  agents: AgentMetrics;
  tasks: TaskMetrics;
  events: EventMetrics;
  alerts: Alert[];
  status: "healthy" | "degraded" | "critical";
  timestamp: string;
}

interface SystemStatus {
  status: "healthy" | "degraded" | "critical";
  checks: Record<string, { ok: boolean; message: string }>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = "overview" | "workflows" | "agents" | "tasks" | "events" | "alerts" | "control";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Gauge className="w-4 h-4" /> },
  { id: "workflows", label: "Workflows", icon: <Layers className="w-4 h-4" /> },
  { id: "agents", label: "Agents", icon: <Cpu className="w-4 h-4" /> },
  { id: "tasks", label: "Tasks", icon: <Zap className="w-4 h-4" /> },
  { id: "events", label: "Events", icon: <Activity className="w-4 h-4" /> },
  { id: "alerts", label: "Alerts", icon: <Bell className="w-4 h-4" /> },
  { id: "control", label: "Control", icon: <Shield className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: "healthy" | "degraded" | "critical"): string {
  switch (status) {
    case "healthy": return "text-green-400";
    case "degraded": return "text-yellow-400";
    case "critical": return "text-red-400";
  }
}

function statusBg(status: "healthy" | "degraded" | "critical"): string {
  switch (status) {
    case "healthy": return "bg-green-500/20 border-green-500/30";
    case "degraded": return "bg-yellow-500/20 border-yellow-500/30";
    case "critical": return "bg-red-500/20 border-red-500/30";
  }
}

function severityBadge(severity: Alert["severity"]): string {
  switch (severity) {
    case "info": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "warning": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "error": return "bg-red-500/20 text-red-300 border-red-500/30";
    case "critical": return "bg-red-600/30 text-red-200 border-red-500/50";
  }
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(2)}GB`;
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  icon,
  color = "text-white"
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-zinc-800 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-semibold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ value, max = 100, color = "bg-blue-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SystemObservability() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [summary, setSummary] = useState<OperationalSummary | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, statusData] = await Promise.all([
        apiFetch<OperationalSummary>("/summary"),
        apiFetch<SystemStatus>("/control/status"),
      ]);
      setSummary(summaryData);
      setSystemStatus(statusData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load observability data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // ── Control actions ───────────────────────────────────────────────

  const executeAction = useCallback(
    async (path: string, actionLabel: string) => {
      setActionLoading(actionLabel);
      try {
        await apiFetch(path, { method: "POST" });
        await fetchData();
      } catch {
        // Silently handle — fetchData will show current state
      } finally {
        setActionLoading(null);
      }
    },
    [fetchData],
  );

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      setActionLoading(`ack-${alertId}`);
      try {
        await apiFetch(`/alerts/${alertId}/acknowledge`, { method: "POST" });
        await fetchData();
      } catch {
        // best-effort
      } finally {
        setActionLoading(null);
      }
    },
    [fetchData],
  );

  // ── Loading / error states ────────────────────────────────────────

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingGlobe size="md" />
        <span className="ml-2 text-zinc-400">Loading observability data...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <XCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const { health, workflows, agents, tasks, events, alerts, status } = summary;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* System health header */}
      <div className={`rounded-lg border p-4 flex items-center justify-between ${statusBg(status)}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === "healthy" ? "bg-green-400" : status === "degraded" ? "bg-yellow-400" : "bg-red-400"} animate-pulse`} />
          <div>
            <h2 className={`text-lg font-semibold ${statusColor(status)}`}>
              System {status.charAt(0).toUpperCase() + status.slice(1)}
            </h2>
            <p className="text-xs text-zinc-400">
              CPU {health.cpuUsage.toFixed(1)}% | Memory {health.memoryUsage.toFixed(1)}% | {health.activeConnections} connections | Uptime {formatUptime(health.uptimeSeconds)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-2 py-0.5">
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={fetchData} className="p-1.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "alerts" && alerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="Active Workflows"
                value={workflows.active}
                sub={`${workflows.completed} completed, ${workflows.failed} failed`}
                icon={<Layers className="w-4 h-4" />}
                color="text-blue-400"
              />
              <MetricCard
                label="Running Agents"
                value={agents.activeAgents}
                sub={`${agents.totalAgents} total, ${agents.completionRate}% completion`}
                icon={<Cpu className="w-4 h-4" />}
                color="text-red-400"
              />
              <MetricCard
                label="Queue Pressure"
                value={Object.values(tasks.queueSizes).reduce((a, b) => a + b, 0)}
                sub={`${tasks.tasksPerMin} tasks/min`}
                icon={<Zap className="w-4 h-4" />}
                color="text-amber-400"
              />
              <MetricCard
                label="Events/sec"
                value={events.eventsPerSec}
                sub={`${formatMs(events.processingLatencyMs)} latency, ${events.eventBacklog} backlog`}
                icon={<Activity className="w-4 h-4" />}
                color="text-green-400"
              />
            </div>

            {/* Health gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>CPU</span>
                  <span>{health.cpuUsage.toFixed(1)}%</span>
                </div>
                <ProgressBar value={health.cpuUsage} color={health.cpuUsage > 80 ? "bg-red-500" : health.cpuUsage > 50 ? "bg-yellow-500" : "bg-green-500"} />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Memory</span>
                  <span>{health.memoryUsage.toFixed(1)}%</span>
                </div>
                <ProgressBar value={health.memoryUsage} color={health.memoryUsage > 80 ? "bg-red-500" : health.memoryUsage > 50 ? "bg-yellow-500" : "bg-green-500"} />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>DB Pool</span>
                  <span>{health.dbPoolUsage}%</span>
                </div>
                <ProgressBar value={health.dbPoolUsage} color={health.dbPoolUsage > 80 ? "bg-red-500" : health.dbPoolUsage > 50 ? "bg-yellow-500" : "bg-blue-500"} />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Redis</span>
                  <span>{formatBytes(health.redisMemory)}</span>
                </div>
                <ProgressBar value={Math.min(100, health.redisMemory / 1073741824 * 100)} color="bg-red-500" />
              </div>
            </div>

            {/* System checks */}
            {systemStatus && (
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">System Checks</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {Object.entries(systemStatus.checks).map(([name, check]) => (
                    <div key={name} className="flex items-center gap-2 text-sm">
                      {check.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span className={check.ok ? "text-zinc-300" : "text-red-300"}>{check.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Workflows Tab ────────────────────────────────────────── */}
        {activeTab === "workflows" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Active"
                value={workflows.active}
                icon={<Play className="w-4 h-4" />}
                color="text-blue-400"
              />
              <MetricCard
                label="Completed"
                value={workflows.completed}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="text-green-400"
              />
              <MetricCard
                label="Failed"
                value={workflows.failed}
                icon={<XCircle className="w-4 h-4" />}
                color="text-red-400"
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Execution Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-400">Avg Execution Time</p>
                  <p className="text-lg font-semibold text-white">{formatMs(workflows.avgExecutionTimeMs)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Success Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {workflows.completed + workflows.failed > 0
                      ? `${Math.round((workflows.completed / (workflows.completed + workflows.failed)) * 100)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Execution time chart placeholder */}
            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Execution Time Trend</h3>
              <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
                <Activity className="w-5 h-5 mr-2" />
                Time-series chart — data collecting
              </div>
            </div>
          </div>
        )}

        {/* ── Agents Tab ───────────────────────────────────────────── */}
        {activeTab === "agents" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="Total Agents"
                value={agents.totalAgents}
                icon={<Server className="w-4 h-4" />}
                color="text-zinc-300"
              />
              <MetricCard
                label="Active"
                value={agents.activeAgents}
                icon={<Cpu className="w-4 h-4" />}
                color="text-green-400"
              />
              <MetricCard
                label="Completion Rate"
                value={`${agents.completionRate}%`}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="text-blue-400"
              />
              <MetricCard
                label="Failure Rate"
                value={`${agents.failureRate}%`}
                icon={<AlertTriangle className="w-4 h-4" />}
                color={agents.failureRate > 10 ? "text-red-400" : "text-yellow-400"}
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Agent Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-400">Avg Task Time</p>
                  <p className="text-lg font-semibold text-white">{formatMs(agents.avgTaskTimeMs)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Utilization</p>
                  <p className="text-lg font-semibold text-white">
                    {agents.totalAgents > 0 ? `${Math.round((agents.activeAgents / agents.totalAgents) * 100)}%` : "0%"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Active / Total</span>
                  <span>{agents.activeAgents} / {agents.totalAgents}</span>
                </div>
                <ProgressBar
                  value={agents.activeAgents}
                  max={Math.max(1, agents.totalAgents)}
                  color="bg-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Tasks Tab ────────────────────────────────────────────── */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Total Queue Depth"
                value={Object.values(tasks.queueSizes).reduce((a, b) => a + b, 0)}
                sub={`Across ${Object.keys(tasks.queueSizes).length} queues`}
                icon={<Layers className="w-4 h-4" />}
                color="text-amber-400"
              />
              <MetricCard
                label="Throughput"
                value={`${tasks.tasksPerMin}/min`}
                sub="Tasks processed per minute"
                icon={<Zap className="w-4 h-4" />}
                color="text-blue-400"
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Queue Sizes</h3>
              <div className="space-y-2">
                {Object.entries(tasks.queueSizes).map(([name, size]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-48 truncate font-mono">{name}</span>
                    <div className="flex-1">
                      <ProgressBar value={size} max={Math.max(50, ...Object.values(tasks.queueSizes))} color={size > 50 ? "bg-red-500" : size > 20 ? "bg-yellow-500" : "bg-blue-500"} />
                    </div>
                    <span className="text-xs text-zinc-300 w-12 text-right">{size}</span>
                  </div>
                ))}
                {Object.keys(tasks.queueSizes).length === 0 && (
                  <p className="text-sm text-zinc-500">No queue data available</p>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Avg Execution Time per Queue</h3>
              <div className="space-y-2">
                {Object.entries(tasks.avgExecutionTimeMs).map(([name, timeMs]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-mono truncate">{name}</span>
                    <span className="text-xs text-zinc-300">{formatMs(timeMs)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Events Tab ───────────────────────────────────────────── */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Events/sec"
                value={events.eventsPerSec}
                icon={<Activity className="w-4 h-4" />}
                color="text-green-400"
              />
              <MetricCard
                label="Latency"
                value={formatMs(events.processingLatencyMs)}
                icon={<Clock className="w-4 h-4" />}
                color={events.processingLatencyMs > 500 ? "text-red-400" : events.processingLatencyMs > 200 ? "text-yellow-400" : "text-blue-400"}
              />
              <MetricCard
                label="Backlog"
                value={events.eventBacklog}
                icon={<HardDrive className="w-4 h-4" />}
                color={events.eventBacklog > 50 ? "text-red-400" : "text-zinc-300"}
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Event Processing Health</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Processing Latency</span>
                    <span>{events.processingLatencyMs}ms / 500ms threshold</span>
                  </div>
                  <ProgressBar
                    value={events.processingLatencyMs}
                    max={500}
                    color={events.processingLatencyMs > 500 ? "bg-red-500" : events.processingLatencyMs > 300 ? "bg-yellow-500" : "bg-green-500"}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Event Backlog</span>
                    <span>{events.eventBacklog} pending</span>
                  </div>
                  <ProgressBar
                    value={events.eventBacklog}
                    max={100}
                    color={events.eventBacklog > 80 ? "bg-red-500" : events.eventBacklog > 40 ? "bg-yellow-500" : "bg-blue-500"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Alerts Tab ───────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-zinc-300 font-medium">No Active Alerts</p>
                <p className="text-xs text-zinc-500 mt-1">All systems operating within thresholds</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={`rounded-lg border p-4 ${severityBadge(alert.severity).replace("text-", "").includes("red") ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900/60 border-zinc-700/50"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === "critical" ? "text-red-400" :
                        alert.severity === "error" ? "text-red-300" :
                        alert.severity === "warning" ? "text-yellow-400" :
                        "text-blue-400"
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${severityBadge(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-500">{alert.source}</span>
                        </div>
                        <p className="text-sm text-zinc-200 mt-1">{alert.message}</p>
                        {alert.currentValue != null && alert.threshold != null && (
                          <p className="text-xs text-zinc-400 mt-1">
                            Current: {alert.currentValue} | Threshold: {alert.threshold}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.alertId)}
                      disabled={actionLoading === `ack-${alert.alertId}`}
                      className="px-3 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {actionLoading === `ack-${alert.alertId}` ? (
                        <LoadingGlobe size="sm" />
                      ) : (
                        "Acknowledge"
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Control Tab ──────────────────────────────────────────── */}
        {activeTab === "control" && (
          <div className="space-y-4">
            {/* System actions */}
            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">System Actions</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  onClick={() => executeAction("/control/gc", "gc")}
                  disabled={actionLoading === "gc"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/50 text-sm text-zinc-300 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "gc" ? <LoadingGlobe size="sm" /> : <Trash2 className="w-4 h-4" />}
                  Force GC
                </button>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/50 text-sm text-zinc-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh All
                </button>
              </div>
            </div>

            {/* Queue management */}
            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Queue Management</h3>
              <div className="space-y-2">
                {Object.entries(tasks.queueSizes).map(([name, size]) => (
                  <div key={name} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                    <div>
                      <span className="text-sm text-zinc-300 font-mono">{name}</span>
                      <span className="text-xs text-zinc-500 ml-2">({size} tasks)</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => executeAction(`/control/drain-queue/${encodeURIComponent(name)}`, `drain-${name}`)}
                        disabled={actionLoading === `drain-${name}`}
                        className="p-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors disabled:opacity-50"
                        title="Drain queue"
                      >
                        {actionLoading === `drain-${name}` ? <LoadingGlobe size="sm" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => executeAction(`/control/clear-queue/${encodeURIComponent(name)}`, `clear-${name}`)}
                        disabled={actionLoading === `clear-${name}`}
                        className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
                        title="Clear queue"
                      >
                        {actionLoading === `clear-${name}` ? <LoadingGlobe size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(tasks.queueSizes).length === 0 && (
                  <p className="text-sm text-zinc-500">No queues to manage</p>
                )}
              </div>
            </div>

            {/* Audit trail */}
            <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Recent Control Actions</h3>
              <p className="text-xs text-zinc-500">Control action audit trail available at /observability/audit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
