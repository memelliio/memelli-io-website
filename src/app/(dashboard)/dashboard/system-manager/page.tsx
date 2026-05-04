'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Radio,
  Shield,
  Activity,
  Cpu,
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Rocket,
  RefreshCw,
  Terminal,
  BarChart3,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number | null;
  lastCheck: string | null;
  icon: React.ReactNode;
}

interface ActiveCommand {
  id: string;
  command: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
}

interface CommandHistoryEntry {
  id: string;
  command: string;
  status: 'completed' | 'failed';
  executedAt: string;
}

interface AgentPool {
  name: string;
  total: number;
  active: number;
  idle: number;
}

interface Pipeline {
  id: string;
  name: string;
  phase: string;
  progress: number;
  status: 'active' | 'queued' | 'completed' | 'failed';
}

interface Deployment {
  id: string;
  service: string;
  status: 'deploying' | 'deployed' | 'failed' | 'queued';
  version: string;
  timestamp: string;
}

interface HealthAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  source: string;
  timestamp: string;
}

interface SystemMetrics {
  commandsPerHour: number;
  avgResponseTime: number;
  uptimePercent: number;
  errorRate: number;
}

interface SystemStatus {
  uptime: number;
  overallStatus: 'operational' | 'degraded' | 'outage';
  services: ServiceHealth[];
  activeCommands: ActiveCommand[];
  commandHistory: CommandHistoryEntry[];
  agentPools: AgentPool[];
  pipelines: Pipeline[];
  deployments: Deployment[];
  alerts: HealthAlert[];
  logs: LogEntry[];
  metrics: SystemMetrics;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function statusDot(status: string) {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-400',
    operational: 'bg-emerald-400',
    deployed: 'bg-emerald-400',
    completed: 'bg-emerald-400',
    active: 'bg-red-400',
    running: 'bg-red-400',
    deploying: 'bg-red-400',
    degraded: 'bg-amber-400',
    warning: 'bg-amber-400',
    queued: 'bg-muted',
    down: 'bg-red-400',
    outage: 'bg-red-400',
    failed: 'bg-red-400',
    critical: 'bg-red-400',
    info: 'bg-red-400',
    unknown: 'bg-muted',
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {['healthy', 'operational', 'active', 'running', 'deploying'].includes(status) && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${colors[status] ?? 'bg-muted'}`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[status] ?? 'bg-muted'}`} />
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function timeAgo(iso: string | null): string {
  if (!iso) return '--';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function logLevelColor(level: string): string {
  switch (level) {
    case 'error': return 'text-red-400';
    case 'warn': return 'text-amber-400';
    case 'info': return 'text-red-400';
    case 'debug': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
}

/* ------------------------------------------------------------------ */
/*  Card wrapper                                                       */
/* ------------------------------------------------------------------ */

function Card({ children, className = '', wide = false }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div
      className={`bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 transition-all duration-200 ${wide ? 'col-span-full' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-red-400">{icon}</span>
      <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{title}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallback data                                                      */
/* ------------------------------------------------------------------ */

function fallbackStatus(): SystemStatus {
  return {
    uptime: 0,
    overallStatus: 'unknown' as 'operational',
    services: [
      { name: 'API', status: 'unknown', latency: null, lastCheck: null, icon: <Server size={18} /> },
      { name: 'Frontend', status: 'unknown', latency: null, lastCheck: null, icon: <Radio size={18} /> },
      { name: 'Workers', status: 'unknown', latency: null, lastCheck: null, icon: <Cpu size={18} /> },
      { name: 'Database', status: 'unknown', latency: null, lastCheck: null, icon: <Database size={18} /> },
    ],
    activeCommands: [],
    commandHistory: [],
    agentPools: [],
    pipelines: [],
    deployments: [],
    alerts: [],
    logs: [],
    metrics: { commandsPerHour: 0, avgResponseTime: 0, uptimePercent: 0, errorRate: 0 },
  };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function SystemManagerPage() {
  const [status, setStatus] = useState<SystemStatus>(fallbackStatus());
  const [loading, setLoading] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [sendingCommand, setSendingCommand] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [uptimeTick, setUptimeTick] = useState(0);

  /* Fetch status ------------------------------------------------------- */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/system-manager/status`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...fallbackStatus(),
          ...data,
          services: (data.services ?? fallbackStatus().services).map((s: ServiceHealth, i: number) => ({
            ...s,
            icon: [<Server key="s" size={18} />, <Radio key="r" size={18} />, <Cpu key="c" size={18} />, <Database key="d" size={18} />][i] ?? <Activity size={18} />,
          })),
        }));
      }
    } catch {
      /* keep existing status on error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  /* Uptime ticker ------------------------------------------------------ */
  useEffect(() => {
    const t = setInterval(() => setUptimeTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* Send command ------------------------------------------------------- */
  const sendCommand = async () => {
    if (!commandInput.trim() || sendingCommand) return;
    setSendingCommand(true);
    try {
      await fetch(`${API_URL}/api/admin/system-manager/command`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ command: commandInput.trim() }),
      });
      setCommandInput('');
      await fetchStatus();
    } catch {
      /* ignore */
    } finally {
      setSendingCommand(false);
    }
  };

  /* Acknowledge alert -------------------------------------------------- */
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`${API_URL}/api/admin/system-manager/command`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ command: `acknowledge-alert ${alertId}` }),
      });
      setStatus((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
      }));
    } catch {
      /* ignore */
    }
  };

  const filteredLogs = logFilter === 'all' ? status.logs : status.logs.filter((l) => l.level === logFilter);
  const displayUptime = status.uptime + uptimeTick;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-card p-8">
      {/* Header -------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-white/[0.04] flex items-center justify-center backdrop-blur-xl">
            <Shield size={24} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Manager</h1>
            <p className="text-muted-foreground leading-relaxed mt-1">
              Uptime {formatUptime(displayUptime)} &middot;{' '}
              <span className="inline-flex items-center gap-2">
                {statusDot(status.overallStatus)}
                <span className="capitalize">{status.overallStatus}</span>
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-5 py-2.5 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading overlay ------------------------------------------------ */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-red-400" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* ============================================================ */}
          {/* 1. Service Health Grid (2x2)                                  */}
          {/* ============================================================ */}
          {status.services.map((svc) => (
            <Card key={svc.name}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-muted-foreground">{svc.icon}</span>
                  <span className="text-sm font-medium">{svc.name}</span>
                </div>
                {statusDot(svc.status)}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {svc.latency !== null ? `${svc.latency}ms` : '--'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">latency</p>
                </div>
                <p className="text-muted-foreground text-xs">{timeAgo(svc.lastCheck)}</p>
              </div>
            </Card>
          ))}

          {/* ============================================================ */}
          {/* 2. Command Center (wide)                                      */}
          {/* ============================================================ */}
          <Card wide>
            <CardTitle icon={<Terminal size={16} />} title="Command Center" />
            <div className="flex gap-4 mb-6">
              <input
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
                placeholder="Issue supervisor command..."
                className="flex-1 bg-card border border-white/[0.04] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
              />
              <button
                onClick={sendCommand}
                disabled={sendingCommand || !commandInput.trim()}
                className="bg-red-600 hover:bg-red-500 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center gap-2"
              >
                {sendingCommand ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Execute
              </button>
            </div>

            {/* Active commands */}
            {status.activeCommands.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Active Commands</p>
                <div className="space-y-3">
                  {status.activeCommands.map((cmd) => (
                    <div key={cmd.id} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Loader2 size={16} className="animate-spin text-red-400" />
                        <span className="text-muted-foreground flex-1 font-mono">{cmd.command}</span>
                        <span className="text-muted-foreground text-sm">{cmd.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-200" style={{ width: `${cmd.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Command history */}
            {status.commandHistory.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Command History</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {status.commandHistory.slice(0, 10).map((cmd) => (
                    <div key={cmd.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200">
                      {cmd.status === 'completed' ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={14} className="text-red-400" />
                      )}
                      <span className="text-muted-foreground flex-1 font-mono text-sm">{cmd.command}</span>
                      <span className="text-muted-foreground text-xs">{timeAgo(cmd.executedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status.activeCommands.length === 0 && status.commandHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No commands issued yet</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 3. Agent Pools Overview                                       */}
          {/* ============================================================ */}
          <Card className="md:col-span-2">
            <CardTitle icon={<Cpu size={16} />} title="Agent Pools" />
            {status.agentPools.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{status.agentPools.reduce((s, p) => s + p.total, 0)}</p>
                    <p className="text-muted-foreground text-sm mt-1">Total</p>
                  </div>
                  <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-red-400">{status.agentPools.reduce((s, p) => s + p.active, 0)}</p>
                    <p className="text-muted-foreground text-sm mt-1">Active</p>
                  </div>
                  <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-muted-foreground">{status.agentPools.reduce((s, p) => s + p.idle, 0)}</p>
                    <p className="text-muted-foreground text-sm mt-1">Idle</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {status.agentPools.map((pool) => {
                    const pct = pool.total > 0 ? (pool.active / pool.total) * 100 : 0;
                    return (
                      <div key={pool.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground">{pool.name}</span>
                          <span className="text-muted-foreground font-mono text-sm">{pool.active}/{pool.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full transition-all duration-200" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pool data available</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 4. Execution Pipelines                                        */}
          {/* ============================================================ */}
          <Card className="md:col-span-2">
            <CardTitle icon={<Activity size={16} />} title="Execution Pipelines" />
            {status.pipelines.length > 0 ? (
              <div className="space-y-4">
                {status.pipelines.map((pl) => (
                  <div key={pl.id} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {statusDot(pl.status)}
                        <span className="text-foreground font-medium">{pl.name}</span>
                      </div>
                      <span className="text-muted-foreground text-sm capitalize">{pl.phase}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-200" style={{ width: `${pl.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active pipelines</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 5. Deployment Status                                          */}
          {/* ============================================================ */}
          <Card className="md:col-span-2">
            <CardTitle icon={<Rocket size={16} />} title="Deployments" />
            {status.deployments.length > 0 ? (
              <div className="space-y-3">
                {status.deployments.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-4 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                    {statusDot(dep.status)}
                    <span className="text-foreground flex-1 font-medium">{dep.service}</span>
                    <span className="text-muted-foreground font-mono text-sm">{dep.version}</span>
                    <span className="text-muted-foreground text-sm">{timeAgo(dep.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent deployments</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 6. Health Alerts                                               */}
          {/* ============================================================ */}
          <Card className="md:col-span-2">
            <CardTitle icon={<AlertTriangle size={16} />} title="Health Alerts" />
            {status.alerts.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {status.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 rounded-2xl p-5 transition-all duration-200 ${
                      alert.acknowledged ? 'bg-card opacity-50' : 'bg-card backdrop-blur-xl border border-white/[0.04]'
                    }`}
                  >
                    {statusDot(alert.level)}
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">{alert.message}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {alert.source} &middot; {timeAgo(alert.timestamp)}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-muted-foreground hover:text-foreground transition-all duration-200"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-8">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 7. System Logs                                                 */}
          {/* ============================================================ */}
          <Card wide>
            <div className="flex items-center justify-between mb-6">
              <CardTitle icon={<Terminal size={16} />} title="System Logs" />
              <div className="flex gap-2">
                {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setLogFilter(level)}
                    className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                      logFilter === level
                        ? 'bg-red-500/[0.08] text-red-300 border border-white/[0.04]'
                        : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            {filteredLogs.length > 0 ? (
              <div className="bg-card backdrop-blur-2xl border border-white/[0.06] rounded-xl p-4 max-h-72 overflow-y-auto">
                <div className="space-y-1 font-mono text-sm">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 py-2 px-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200">
                      <span className="text-muted-foreground w-20 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`w-16 text-[11px] uppercase tracking-wider font-medium ${logLevelColor(log.level)}`}>{log.level}</span>
                      <span className="text-muted-foreground w-24 truncate text-xs">{log.source}</span>
                      <span className="text-muted-foreground flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No logs to display</p>
              </div>
            )}
          </Card>

          {/* ============================================================ */}
          {/* 8. Metrics Dashboard                                          */}
          {/* ============================================================ */}
          <Card wide>
            <CardTitle icon={<BarChart3 size={16} />} title="System Metrics" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{status.metrics.commandsPerHour}</p>
                <p className="text-muted-foreground text-sm mt-1">Commands / hr</p>
              </div>
              <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{status.metrics.avgResponseTime}<span className="text-muted-foreground text-sm ml-1">ms</span></p>
                <p className="text-muted-foreground text-sm mt-1">Avg Response</p>
              </div>
              <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                <p className="text-2xl font-semibold tracking-tight text-emerald-400">{status.metrics.uptimePercent}<span className="text-muted-foreground text-sm ml-1">%</span></p>
                <p className="text-muted-foreground text-sm mt-1">Uptime</p>
              </div>
              <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                <p className={`text-2xl font-semibold tracking-tight ${status.metrics.errorRate > 5 ? 'text-red-400' : 'text-foreground'}`}>
                  {status.metrics.errorRate}<span className="text-muted-foreground text-sm ml-1">%</span>
                </p>
                <p className="text-muted-foreground text-sm mt-1">Error Rate</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}