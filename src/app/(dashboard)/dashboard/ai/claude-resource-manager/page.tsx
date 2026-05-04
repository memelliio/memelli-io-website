'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Code,
  Globe,
  Hash,
  Layers,
  Monitor,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Terminal,
  Timer,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

/* ────────────────────────────── Types ────────────────────────────── */

interface Lane {
  id: string;
  name: string;
  accountLabel: string;
  status: 'available' | 'busy' | 'cooling_down' | 'waiting_reset' | 'paused' | 'error' | 'unknown';
  connectionMode: 'browser' | 'desktop' | 'code' | 'api';
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  estimatedResetAt: string | null;
  jobsCompletedToday: number;
  priorityRank: number;
  manuallyPaused: boolean;
}

interface Task {
  id: string;
  taskType: string;
  priority: number;
  status: 'queued' | 'assigned' | 'running' | 'completed' | 'failed' | 'waiting_lane' | 'cancelled';
  assignedLaneId: string | null;
  assignedLaneName: string | null;
  createdAt: string;
}

interface Run {
  id: string;
  taskId: string;
  laneId: string;
  laneName: string;
  status: 'completed' | 'failed' | 'running';
  durationMs: number | null;
  cooldownTriggered: boolean;
  startedAt: string;
  completedAt: string | null;
  promptSummary: string | null;
  resultSummary: string | null;
}

interface DashboardMetrics {
  availableLanes: number;
  exhaustedLanes: number;
  nextResetAt: string | null;
  queuedTasks: number;
  completedToday: number;
  avgRunTimeMs: number;
  successRate: number;
}

interface LaneSettings {
  defaultCooldownMinutes: number;
  retryIntervalSeconds: number;
  autoswitch: boolean;
  autoResume: boolean;
  maxConcurrencyPerLane: number;
  notifyOnAllExhausted: boolean;
}

/* ────────────────────────────── Helpers ────────────────────────────── */

const API_BASE = '/api/admin/claude-lanes';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function countdown(dateStr: string | null): string {
  if (!dateStr) return '--';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins > 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}m ${secs}s`;
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '--';
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  return `${secs}s`;
}

/* ────────────────────────────── Status helpers ────────────────────────────── */

const laneStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string; pulse?: boolean }> = {
  available:     { label: 'Available',     bg: 'bg-emerald-500/10',  text: 'text-emerald-400',  dot: 'bg-emerald-400' },
  busy:          { label: 'Busy',          bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  cooling_down:  { label: 'Cooling Down',  bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  waiting_reset: { label: 'Waiting Reset', bg: 'bg-primary/10',    text: 'text-primary',    dot: 'bg-primary/70' },
  paused:        { label: 'Paused',        bg: 'bg-card',      text: 'text-muted-foreground',   dot: 'bg-muted' },
  error:         { label: 'Error',         bg: 'bg-primary/10',    text: 'text-primary',    dot: 'bg-primary/70', pulse: true },
  unknown:       { label: 'Unknown',       bg: 'bg-muted',   text: 'text-muted-foreground',   dot: 'bg-muted' },
};

const taskStatusConfig: Record<string, { label: string; bg: string; text: string; pulse?: boolean }> = {
  queued:       { label: 'Queued',       bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  assigned:     { label: 'Assigned',     bg: 'bg-primary/10', text: 'text-primary' },
  running:      { label: 'Running',      bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: true },
  completed:    { label: 'Completed',    bg: 'bg-emerald-500/10',  text: 'text-emerald-400' },
  failed:       { label: 'Failed',       bg: 'bg-primary/10',    text: 'text-primary' },
  waiting_lane: { label: 'Waiting Lane', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  cancelled:    { label: 'Cancelled',    bg: 'bg-card',      text: 'text-muted-foreground' },
};

const connectionIcons: Record<string, React.ComponentType<any>> = {
  browser: Globe,
  desktop: Monitor,
  code:    Code,
  api:     Terminal,
};

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; bg: string; text: string; pulse?: boolean }> }) {
  const c = config[status] ?? { label: status, bg: 'bg-card', text: 'text-muted-foreground' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${c.pulse ? 'animate-pulse' : ''}`}>
      {c.label}
    </span>
  );
}

function LaneStatusBadge({ status }: { status: string }) {
  const c = laneStatusConfig[status] ?? laneStatusConfig.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

/* ────────────────────────────── Stat Card ────────────────────────────── */

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<any> }) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <div className="rounded-xl p-1.5 bg-card">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

/* ────────────────────────────── Main Component ────────────────────────────── */

export default function ClaudeResourceManagerPage() {
  const api = useApi();

  /* ── State ── */
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<LaneSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<LaneSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Modals */
  const [showSubmitTask, setShowSubmitTask] = useState(false);
  const [submitForm, setSubmitForm] = useState({ taskType: '', promptText: '', priority: 3 });
  const [submitting, setSubmitting] = useState(false);

  const [resetLane, setResetLane] = useState<Lane | null>(null);
  const [resetTime, setResetTime] = useState('');

  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  /* ── Fetchers ── */

  const fetchLanes = useCallback(async () => {
    const res = await api.get<Lane[]>(`${API_BASE}/lanes`);
    if (res.data) setLanes(res.data);
    return res;
  }, [api]);

  const fetchTasks = useCallback(async () => {
    const [queued, waiting] = await Promise.all([
      api.get<Task[]>(`${API_BASE}/tasks?status=queued&limit=20`),
      api.get<Task[]>(`${API_BASE}/tasks?status=waiting_lane&limit=20`),
    ]);
    const combined = [...(queued.data ?? []), ...(waiting.data ?? [])];
    combined.sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setTasks(combined);
  }, [api]);

  const fetchRuns = useCallback(async () => {
    const res = await api.get<Run[]>(`${API_BASE}/runs?limit=20`);
    if (res.data) setRuns(res.data);
  }, [api]);

  const fetchMetrics = useCallback(async () => {
    const res = await api.get<DashboardMetrics>(`${API_BASE}/dashboard`);
    if (res.data) setMetrics(res.data);
    return res;
  }, [api]);

  const fetchSettings = useCallback(async () => {
    const res = await api.get<LaneSettings>(`${API_BASE}/settings`);
    if (res.data) {
      setSettings(res.data);
      setSettingsDraft(res.data);
    }
  }, [api]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      await Promise.all([fetchLanes(), fetchTasks(), fetchRuns(), fetchMetrics(), fetchSettings()]);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchLanes, fetchTasks, fetchRuns, fetchMetrics, fetchSettings]);

  /* ── Init + auto-refresh ── */

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      void fetchLanes();
      void fetchMetrics();
      void fetchTasks();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Lane actions ── */

  const pauseLane = async (lane: Lane) => {
    await api.post(`${API_BASE}/lanes/${lane.id}/pause`, {});
    await fetchLanes();
  };

  const resumeLane = async (lane: Lane) => {
    await api.post(`${API_BASE}/lanes/${lane.id}/resume`, {});
    await fetchLanes();
  };

  const markExhausted = async (lane: Lane) => {
    await api.post(`${API_BASE}/lanes/${lane.id}/mark-exhausted`, {});
    await fetchLanes();
  };

  const markAvailable = async (lane: Lane) => {
    await api.post(`${API_BASE}/lanes/${lane.id}/mark-available`, {});
    await fetchLanes();
  };

  const submitResetTime = async () => {
    if (!resetLane || !resetTime) return;
    await api.post(`${API_BASE}/lanes/${resetLane.id}/set-reset-time`, { resetAt: resetTime });
    setResetLane(null);
    setResetTime('');
    await fetchLanes();
  };

  /* ── Task actions ── */

  const cancelTask = async (taskId: string) => {
    await api.post(`${API_BASE}/tasks/${taskId}/cancel`, {});
    await fetchTasks();
  };

  const retryTask = async (taskId: string) => {
    await api.post(`${API_BASE}/tasks/${taskId}/retry`, {});
    await fetchTasks();
  };

  const processQueue = async () => {
    await api.post(`${API_BASE}/queue/process`, {});
    await fetchTasks();
    await fetchLanes();
  };

  const submitTask = async () => {
    if (!submitForm.taskType || !submitForm.promptText) return;
    setSubmitting(true);
    await api.post(`${API_BASE}/tasks`, {
      taskType: submitForm.taskType,
      promptText: submitForm.promptText,
      priority: submitForm.priority,
    });
    setSubmitting(false);
    setShowSubmitTask(false);
    setSubmitForm({ taskType: '', promptText: '', priority: 3 });
    await fetchTasks();
  };

  /* ── Settings ── */

  const saveSettings = async () => {
    if (!settingsDraft) return;
    setSavingSettings(true);
    await api.patch(`${API_BASE}/settings`, settingsDraft);
    setSettings(settingsDraft);
    setSavingSettings(false);
  };

  /* ── Render ── */

  if (loading) {
    return (
      <div className="bg-card min-h-screen flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card min-h-screen flex flex-col items-center justify-center h-[60vh] gap-6">
        <AlertTriangle className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground leading-relaxed">{error}</p>
        <button onClick={() => fetchAll()} className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-2 text-sm text-foreground transition-all duration-200">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen space-y-8 p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Claude Resource Manager</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">Lane management, task queue, and execution monitoring</p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-foreground disabled:opacity-50 transition-all duration-200 inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Dashboard Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6">
          <StatCard label="Available Lanes" value={metrics.availableLanes} icon={Check} />
          <StatCard label="Exhausted" value={metrics.exhaustedLanes} icon={AlertTriangle} />
          <StatCard label="Next Reset" value={countdown(metrics.nextResetAt)} icon={Timer} />
          <StatCard label="Queued Tasks" value={metrics.queuedTasks} icon={Layers} />
          <StatCard label="Completed Today" value={metrics.completedToday} icon={Zap} />
          <StatCard label="Avg Run Time" value={formatDuration(metrics.avgRunTimeMs)} icon={Clock} />
          <StatCard label="Success Rate" value={`${(metrics.successRate * 100).toFixed(0)}%`} icon={Activity} />
        </div>
      )}

      {/* Lane Status Board */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Lane Status Board</h2>
        {lanes.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 text-center text-muted-foreground leading-relaxed">
            No lanes configured
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lanes.map((lane) => {
              const ConnIcon = connectionIcons[lane.connectionMode] ?? Circle;
              const isActive = lane.status === 'available' || lane.status === 'busy';
              return (
                <div key={lane.id} className={`bg-card backdrop-blur-xl border rounded-2xl p-6 space-y-3 transition-all duration-200 ${isActive ? 'border-primary/15 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]' : 'border-white/[0.04]'}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <ConnIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-tight text-foreground truncate">{lane.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lane.accountLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">#{lane.priorityRank}</span>
                      <LaneStatusBadge status={lane.status} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Last success</span>
                      <p className="text-foreground">{relativeTime(lane.lastSuccessAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last failure</span>
                      <p className="text-foreground">{relativeTime(lane.lastFailureAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Jobs today</span>
                      <p className="text-foreground font-mono">{lane.jobsCompletedToday}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. reset</span>
                      <p className="text-foreground">{lane.estimatedResetAt ? countdown(lane.estimatedResetAt) : '--'}</p>
                    </div>
                  </div>

                  {lane.manuallyPaused && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Pause className="h-3 w-3" />
                      Manually paused
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.04]">
                    {lane.status === 'paused' || lane.manuallyPaused ? (
                      <button
                        onClick={() => resumeLane(lane)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200"
                      >
                        <Play className="h-3 w-3" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => pauseLane(lane)}
                        className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-foreground transition-all duration-200 inline-flex items-center gap-1"
                      >
                        <Pause className="h-3 w-3" /> Pause
                      </button>
                    )}
                    <button
                      onClick={() => markExhausted(lane)}
                      className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-orange-400 transition-all duration-200 inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" /> Exhausted
                    </button>
                    <button
                      onClick={() => markAvailable(lane)}
                      className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-emerald-400 transition-all duration-200 inline-flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Available
                    </button>
                    <button
                      onClick={() => { setResetLane(lane); setResetTime(''); }}
                      className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-foreground transition-all duration-200 inline-flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" /> Set Reset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Queue + Runs side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Queue */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Task Queue</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={processQueue}
                className="bg-primary/80/[0.08] text-primary/80 hover:bg-primary/80/[0.12] rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <ArrowRight className="h-3 w-3" /> Process Queue
              </button>
              <button
                onClick={() => setShowSubmitTask(true)}
                className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <Plus className="h-3 w-3" /> Submit Task
              </button>
            </div>
          </div>

          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground leading-relaxed text-sm">No queued tasks</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left text-[11px] text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Pri</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Lane</th>
                      <th className="px-4 py-2.5">Created</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-white/[0.04]">
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-white/[0.02] hover:bg-white/[0.04] transition-all duration-200">
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{shortId(task.id)}</td>
                        <td className="px-4 py-2 text-foreground">{task.taskType}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-mono text-foreground">
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={task.status} config={taskStatusConfig} />
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{task.assignedLaneName ?? '--'}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{relativeTime(task.createdAt)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => cancelTask(task.id)}
                              className="rounded-xl p-1 text-muted-foreground hover:bg-white/[0.04] hover:text-primary transition-all duration-200"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => retryTask(task.id)}
                              className="rounded-xl p-1 text-muted-foreground hover:bg-white/[0.04] hover:text-primary transition-all duration-200"
                              title="Retry"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Recent Runs */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Recent Runs</h2>
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground leading-relaxed text-sm">No recent runs</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left text-[11px] text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">Task</th>
                      <th className="px-4 py-2.5">Lane</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Duration</th>
                      <th className="px-4 py-2.5">CD</th>
                      <th className="px-4 py-2.5">Started</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-white/[0.04]">
                    {runs.map((run) => (
                      <>
                        <tr
                          key={run.id}
                          className="border-b border-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all duration-200"
                          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                        >
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{shortId(run.taskId)}</td>
                          <td className="px-4 py-2 text-xs text-foreground">{run.laneName}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={run.status} config={taskStatusConfig} />
                          </td>
                          <td className="px-4 py-2 text-xs text-foreground font-mono">{formatDuration(run.durationMs)}</td>
                          <td className="px-4 py-2">
                            {run.cooldownTriggered ? (
                              <span className="text-orange-400 text-xs">Yes</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{relativeTime(run.startedAt)}</td>
                          <td className="px-4 py-2">
                            {expandedRun === run.id ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                        {expandedRun === run.id && (
                          <tr key={`${run.id}-detail`} className="border-b border-white/[0.02]">
                            <td colSpan={7} className="px-4 py-3 bg-card backdrop-blur-xl border-white/[0.04] rounded-2xl">
                              <div className="space-y-2 font-mono text-sm">
                                <div>
                                  <span className="text-muted-foreground font-medium">Prompt: </span>
                                  <span className="text-foreground">{run.promptSummary ?? 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground font-medium">Result: </span>
                                  <span className="text-foreground">{run.resultSummary ?? 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground font-medium">Completed: </span>
                                  <span className="text-foreground">{run.completedAt ? relativeTime(run.completedAt) : 'In progress'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Settings Panel */}
      <section className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center justify-between p-6 text-left transition-all duration-200 hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h2>
          </div>
          {settingsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {settingsOpen && settingsDraft && (
          <div className="border-t border-white/[0.04] p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Default Cooldown */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Default Cooldown (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={settingsDraft.defaultCooldownMinutes}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, defaultCooldownMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all duration-200"
                />
              </div>

              {/* Retry Interval */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Retry Interval (seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={settingsDraft.retryIntervalSeconds}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, retryIntervalSeconds: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all duration-200"
                />
              </div>

              {/* Max Concurrency */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Max Concurrency Per Lane</label>
                <input
                  type="number"
                  min={1}
                  value={settingsDraft.maxConcurrencyPerLane}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, maxConcurrencyPerLane: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all duration-200"
                />
              </div>

              {/* Autoswitch */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-card px-3 py-2.5">
                <span className="text-sm text-foreground">Autoswitch</span>
                <button
                  onClick={() => setSettingsDraft({ ...settingsDraft, autoswitch: !settingsDraft.autoswitch })}
                  className={`relative h-5 w-9 rounded-full transition-all duration-200 ${settingsDraft.autoswitch ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200 ${settingsDraft.autoswitch ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Auto-Resume */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-card px-3 py-2.5">
                <span className="text-sm text-foreground">Auto-Resume</span>
                <button
                  onClick={() => setSettingsDraft({ ...settingsDraft, autoResume: !settingsDraft.autoResume })}
                  className={`relative h-5 w-9 rounded-full transition-all duration-200 ${settingsDraft.autoResume ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200 ${settingsDraft.autoResume ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Notify on All Exhausted */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-card px-3 py-2.5">
                <span className="text-sm text-foreground">Notify All Exhausted</span>
                <button
                  onClick={() => setSettingsDraft({ ...settingsDraft, notifyOnAllExhausted: !settingsDraft.notifyOnAllExhausted })}
                  className={`relative h-5 w-9 rounded-full transition-all duration-200 ${settingsDraft.notifyOnAllExhausted ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200 ${settingsDraft.notifyOnAllExhausted ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal: Submit Task */}
      {showSubmitTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-md bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">Submit Task</h3>
              <button onClick={() => setShowSubmitTask(false)} className="rounded-xl p-1 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Task Type</label>
                <input
                  type="text"
                  value={submitForm.taskType}
                  onChange={(e) => setSubmitForm({ ...submitForm, taskType: e.target.value })}
                  placeholder="e.g. code_review, bug_fix, feature"
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Prompt</label>
                <textarea
                  rows={4}
                  value={submitForm.promptText}
                  onChange={(e) => setSubmitForm({ ...submitForm, promptText: e.target.value })}
                  placeholder="Describe the task..."
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Priority</label>
                <select
                  value={submitForm.priority}
                  onChange={(e) => setSubmitForm({ ...submitForm, priority: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                >
                  <option value={1}>1 - Critical</option>
                  <option value={2}>2 - High</option>
                  <option value={3}>3 - Normal</option>
                  <option value={4}>4 - Low</option>
                  <option value={5}>5 - Background</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitTask(false)}
                className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-2 text-sm text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitTask}
                disabled={submitting || !submitForm.taskType || !submitForm.promptText}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Set Reset Time */}
      {resetLane && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">Set Reset Time</h3>
              <button onClick={() => setResetLane(null)} className="rounded-xl p-1 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">Lane: <span className="text-foreground">{resetLane.name}</span></p>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Reset Date/Time</label>
              <input
                type="datetime-local"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none [color-scheme:dark] font-mono transition-all duration-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetLane(null)}
                className="bg-card backdrop-blur-xl hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-2 text-sm text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitResetTime}
                disabled={!resetTime}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}