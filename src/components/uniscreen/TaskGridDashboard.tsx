"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  Layers,
  ListTodo,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Timer,
  XCircle,
  Zap
} from "lucide-react";
import { useApi } from "@/hooks/useApi";

import { LoadingGlobe } from '@/components/ui/loading-globe';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GridTask {
  taskId: string;
  taskType: string;
  tenantId: string;
  parameters: Record<string, any>;
  priority: number;
  status: string;
  assignedAgent?: string;
  dependsOn: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface AgentPool {
  poolId: string;
  poolName: string;
  agentType: string;
  maxConcurrent: number;
  activeCount: number;
  queuedCount: number;
  agents: string[];
}

interface QueueMetrics {
  tasksPerMinute: number;
  avgExecutionTimeMs: number;
  queueLengths: Record<string, number>;
  agentUtilization: Record<string, { active: number; max: number; utilization: number }>;
  totalQueued: number;
  totalRunning: number;
  totalCompleted: number;
  totalFailed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_LABELS: Record<number, string> = {
  0: "CRITICAL",
  1: "HIGH",
  2: "NORMAL",
  3: "BACKGROUND"
};

const PRIORITY_COLORS: Record<number, string> = {
  0: "bg-red-500/20 text-red-400 border-red-500/30",
  1: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  2: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  3: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "text-yellow-400",
  ASSIGNED: "text-blue-400",
  RUNNING: "text-emerald-400",
  COMPLETED: "text-green-400",
  FAILED: "text-red-400",
  RETRY: "text-orange-400",
  CANCELLED: "text-zinc-500"
};

const REFRESH_INTERVAL = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(startedAt?: string): string {
  if (!startedAt) return "--";
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m`;
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className={`rounded-md p-2 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-zinc-100">{value}</p>
      </div>
    </div>
  );
}

function PoolCard({ pool }: { pool: AgentPool }) {
  const utilization = pool.maxConcurrent > 0
    ? Math.round((pool.activeCount / pool.maxConcurrent) * 100)
    : 0;

  const barColor =
    utilization >= 90 ? "bg-red-500" :
    utilization >= 70 ? "bg-orange-500" :
    utilization >= 40 ? "bg-emerald-500" :
    "bg-blue-500";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">{pool.poolName}</h3>
        </div>
        <span className="text-xs text-zinc-500">{pool.agentType}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-lg font-bold text-emerald-400">{pool.activeCount}</p>
          <p className="text-[10px] text-zinc-500 uppercase">Active</p>
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-300">{pool.maxConcurrent}</p>
          <p className="text-[10px] text-zinc-500 uppercase">Max</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-400">{pool.queuedCount}</p>
          <p className="text-[10px] text-zinc-500 uppercase">Queued</p>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${utilization}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-zinc-500">{utilization}% utilization</p>
    </div>
  );
}

function TaskRow({
  task,
  onRetry
}: {
  task: GridTask;
  onRetry?: (taskId: string) => void;
}) {
  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
      <td className="py-2 px-3 text-sm text-zinc-300 max-w-[180px] truncate" title={task.taskType}>
        {task.taskType}
      </td>
      <td className="py-2 px-3">
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS[2]}`}
        >
          {task.priority === 0 && <Zap className="h-3 w-3" />}
          {PRIORITY_LABELS[task.priority] ?? "NORMAL"}
        </span>
      </td>
      <td className="py-2 px-3 text-sm text-zinc-400 max-w-[140px] truncate" title={task.assignedAgent}>
        {task.assignedAgent ?? "--"}
      </td>
      <td className="py-2 px-3 text-sm font-mono text-zinc-400">
        {formatDuration(task.startedAt)}
      </td>
      <td className="py-2 px-3">
        <span className={`text-xs font-medium ${STATUS_COLORS[task.status] ?? "text-zinc-400"}`}>
          {task.status === "RUNNING" && <LoadingGlobe size="sm" />}
          {task.status}
        </span>
      </td>
      <td className="py-2 px-3">
        {task.status === "FAILED" && onRetry && (
          <button
            onClick={() => onRetry(task.taskId)}
            className="inline-flex items-center gap-1 rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400 hover:bg-orange-500/30 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        )}
        {task.retryCount > 0 && (
          <span className="ml-1 text-[10px] text-zinc-500">
            ({task.retryCount}/{task.maxRetries})
          </span>
        )}
      </td>
    </tr>
  );
}

function QueuePressureBar({
  name,
  length,
  maxLength
}: {
  name: string;
  length: number;
  maxLength: number;
}) {
  const pct = maxLength > 0 ? Math.min(100, Math.round((length / maxLength) * 100)) : 0;
  const color =
    pct >= 80 ? "bg-red-500" :
    pct >= 50 ? "bg-orange-500" :
    pct >= 20 ? "bg-blue-500" :
    "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-zinc-400 truncate" title={name}>{name}</span>
      <div className="flex-1 relative h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-zinc-400">{length}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TaskGridDashboard() {
  const api = useApi();
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [pools, setPools] = useState<AgentPool[]>([]);
  const [activeTasks, setActiveTasks] = useState<GridTask[]>([]);
  const [failedTasks, setFailedTasks] = useState<GridTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const [metricsRes, poolsRes, tasksRes, failedRes] = await Promise.all([
      api.get<QueueMetrics>("/api/admin/task-grid/metrics"),
      api.get<{ pools: AgentPool[]; count: number }>("/api/admin/task-grid/pools"),
      api.get<{ tasks: GridTask[]; count: number }>("/api/admin/task-grid/tasks"),
      api.get<{ tasks: GridTask[]; count: number }>("/api/admin/task-grid/failed"),
    ]);

    if (metricsRes.data) setMetrics(metricsRes.data);
    if (poolsRes.data) setPools(poolsRes.data.pools);
    if (tasksRes.data) setActiveTasks(tasksRes.data.tasks);
    if (failedRes.data) setFailedTasks(failedRes.data.tasks);

    setLoading(false);
    setLastRefresh(new Date());
  }, [api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRetry = useCallback(async (taskId: string) => {
    await api.post(`/api/admin/task-grid/tasks/${taskId}/retry`, {});
    fetchData();
  }, [api, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingGlobe size="md" />
        <span className="ml-2 text-sm text-zinc-500">Loading Task Grid...</span>
      </div>
    );
  }

  const maxQueueLength = Math.max(
    1,
    ...Object.values(metrics?.queueLengths ?? {}).map(v => v),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Task Grid</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Tasks"
          value={(metrics?.totalCompleted ?? 0) + (metrics?.totalFailed ?? 0) + (metrics?.totalRunning ?? 0) + (metrics?.totalQueued ?? 0)}
          icon={ListTodo}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          label="Running"
          value={metrics?.totalRunning ?? 0}
          icon={Activity}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="Queued"
          value={metrics?.totalQueued ?? 0}
          icon={Clock}
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          label="Completed"
          value={metrics?.totalCompleted ?? 0}
          icon={CheckCircle2}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          label="Failed"
          value={metrics?.totalFailed ?? 0}
          icon={XCircle}
          color="bg-red-500/20 text-red-400"
        />
        <StatCard
          label="Avg Exec Time"
          value={formatMs(metrics?.avgExecutionTimeMs ?? 0)}
          icon={Timer}
          color="bg-red-500/20 text-red-400"
        />
      </div>

      {/* Throughput indicator */}
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2">
        <Gauge className="h-4 w-4 text-zinc-400" />
        <span className="text-sm text-zinc-400">Throughput:</span>
        <span className="text-sm font-semibold text-zinc-200">
          {metrics?.tasksPerMinute ?? 0} tasks/min
        </span>
      </div>

      {/* Agent Pool Cards */}
      {pools.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Agent Pools ({pools.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pools.map(pool => (
              <PoolCard key={pool.poolId} pool={pool} />
            ))}
          </div>
        </div>
      )}

      {/* Queue Pressure Visualization */}
      {metrics && Object.keys(metrics.queueLengths).length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Queue Pressure
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.queueLengths)
              .sort(([, a], [, b]) => b - a)
              .map(([name, length]) => (
                <QueuePressureBar
                  key={name}
                  name={name}
                  length={length}
                  maxLength={maxQueueLength}
                />
              ))}
          </div>
        </div>
      )}

      {/* Active Tasks Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-zinc-200">
            Active Tasks ({activeTasks.length})
          </h3>
        </div>
        {activeTasks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <PauseCircle className="h-5 w-5 text-zinc-600 mr-2" />
            <span className="text-sm text-zinc-500">No active tasks</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2 px-3 font-medium">Task Type</th>
                  <th className="py-2 px-3 font-medium">Priority</th>
                  <th className="py-2 px-3 font-medium">Agent</th>
                  <th className="py-2 px-3 font-medium">Duration</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map(task => (
                  <TaskRow key={task.taskId} task={task} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Failed Tasks Panel */}
      {failedTasks.length > 0 && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-900/50 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-medium text-red-300">
              Failed Tasks ({failedTasks.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-red-900/30 text-[10px] text-red-400/60 uppercase tracking-wider">
                  <th className="py-2 px-3 font-medium">Task Type</th>
                  <th className="py-2 px-3 font-medium">Priority</th>
                  <th className="py-2 px-3 font-medium">Agent</th>
                  <th className="py-2 px-3 font-medium">Duration</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {failedTasks.slice(0, 20).map(task => (
                  <TaskRow key={task.taskId} task={task} onRetry={handleRetry} />
                ))}
              </tbody>
            </table>
          </div>
          {failedTasks.length > 20 && (
            <div className="px-4 py-2 text-center text-xs text-red-400/50">
              Showing 20 of {failedTasks.length} failed tasks
            </div>
          )}
        </div>
      )}
    </div>
  );
}
