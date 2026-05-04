'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Terminal,
  Activity,
  Cpu,
  Database,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  Send,
  Layers,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PoolMetrics {
  domain: string;
  agents: { id: string; layer: string; status: string }[];
  events: any[];
  metrics: { totalEvents: number; handledEvents: number; avgResolutionMs: number };
}

interface LiveEvent {
  id: string;
  domain: string;
  type: string;
  severity: string;
  message: string;
  handled: boolean;
  assignedAgentId: string | null;
  resolution: string | null;
  timestamp: string;
  resolvedAt: string | null;
}

interface SystemStatus {
  agentPools: any;
  executionEngine: any;
  healthEngine: any;
  environment: {
    nodeEnv: string;
    uptimeSeconds: number;
    memory: { rss: string; heapUsed: string; heapTotal: string; external: string };
    pid: number;
    nodeVersion: string;
  };
}

interface DeployDashboard {
  productionReachable: boolean;
  healthStatus: number | null;
  routeChecks: { route: string; status: number | null; reachable: boolean }[];
  summary?: { healthScore: number; verdict: string };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-400';
    case 'warning': return 'text-amber-400';
    default: return 'text-blue-400';
  }
}

function severityBg(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border-red-500/30';
    case 'warning': return 'bg-amber-500/10 border-amber-500/30';
    default: return 'bg-blue-500/10 border-blue-500/30';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({ label, value, icon: Icon, color = 'text-[hsl(var(--foreground))]' }: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
      <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-2">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function PoolRow({ pool }: { pool: PoolMetrics }) {
  const [expanded, setExpanded] = useState(false);
  const total = pool.agents.length;
  const busy = pool.agents.filter((a) => a.status === 'busy').length;
  const idle = total - busy;
  const queuedEvents = pool.events.filter((e) => !e.handled).length;

  return (
    <div className="border-b border-[hsl(var(--border))] last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
        )}
        <span className="text-sm font-medium text-[hsl(var(--foreground))] flex-1">{pool.domain}</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{total} agents</span>
        <span className="text-xs text-emerald-400">{idle} idle</span>
        <span className="text-xs text-amber-400">{busy} busy</span>
        {queuedEvents > 0 && (
          <span className="text-xs text-red-400">{queuedEvents} queued</span>
        )}
      </button>
      {expanded && (
        <div className="px-8 pb-3 grid grid-cols-4 gap-2">
          {pool.agents.slice(0, 20).map((agent) => (
            <div
              key={agent.id}
              className={`rounded-md px-2 py-1 text-[10px] border ${
                agent.status === 'busy'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              <div className="truncate">{agent.layer}</div>
              <div className="text-[hsl(var(--muted-foreground))]">{agent.status}</div>
            </div>
          ))}
          {pool.agents.length > 20 && (
            <div className="rounded-md px-2 py-1 text-[10px] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] flex items-center justify-center">
              +{pool.agents.length - 20} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function UniverseTerminalPage() {
  const api = useApi();
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<
    { input: string; output: string; timestamp: Date }[]
  >([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'loading'>('loading');

  // ── Data queries ──────────────────────────────────────────────────────

  const { data: systemStatus, refetch: refetchSystem, isError: systemError } = useQuery({
    queryKey: ['terminal-system-status'],
    queryFn: async () => {
      const res = await api.get<SystemStatus>('/api/admin/command-center');
      if (res.error) throw new Error(res.error);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      return res.data;
    },
    refetchInterval: 5000,
    retry: 2,
  });

  const { data: poolsData, isError: poolsError } = useQuery({
    queryKey: ['terminal-pools'],
    queryFn: async () => {
      const res = await api.get<PoolMetrics[]>('/api/admin/agent-pools');
      if (res.error) throw new Error(res.error);
      if (Array.isArray(res.data)) return res.data;
      if (res.data && 'data' in (res.data as any)) return (res.data as any).data;
      return [];
    },
    refetchInterval: 5000,
    retry: 2,
  });

  const { data: liveFeed, refetch: refetchFeed, isError: feedError } = useQuery({
    queryKey: ['terminal-live-feed'],
    queryFn: async () => {
      const res = await api.get<{ events: LiveEvent[] }>('/api/admin/command-center/live-feed');
      if (res.error) throw new Error(res.error);
      setLastUpdate(new Date());
      return res.data?.events ?? [];
    },
    refetchInterval: 5000,
    retry: 2,
  });

  const { data: deployStatus } = useQuery({
    queryKey: ['terminal-deploy'],
    queryFn: async () => {
      const res = await api.get<DeployDashboard>('/api/admin/deployment/dashboard');
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 30000,
    retry: 2,
  });

  const { data: validationData, refetch: refetchValidation } = useQuery({
    queryKey: ['terminal-validation'],
    queryFn: async () => {
      const res = await api.get<any>('/api/admin/deployment/validate/summary');
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 10000,
    retry: 2,
  });

  const { data: blockersData } = useQuery({
    queryKey: ['terminal-blockers'],
    queryFn: async () => {
      const res = await api.get<any>('/api/admin/deployment/validate/blockers');
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    refetchInterval: 10000,
    retry: 2,
  });

  // ── Connection health tracking ─────────────────────────────────────────
  useEffect(() => {
    if (systemError || poolsError || feedError) {
      setConnectionStatus('error');
    } else if (systemStatus || poolsData || liveFeed) {
      setConnectionStatus('connected');
    }
  }, [systemError, poolsError, feedError, systemStatus, poolsData, liveFeed]);

  const pools: PoolMetrics[] = Array.isArray(poolsData) ? poolsData : [];
  const events: LiveEvent[] = Array.isArray(liveFeed) ? liveFeed : [];

  // ── Aggregate metrics ─────────────────────────────────────────────────

  const totalAgents = pools.reduce((acc, p) => acc + p.agents.length, 0);
  const activeAgents = pools.reduce(
    (acc, p) => acc + p.agents.filter((a) => a.status === 'busy').length,
    0
  );
  const utilization = totalAgents > 0 ? ((activeAgents / totalAgents) * 100).toFixed(1) : '0';

  // ── Command dispatch ──────────────────────────────────────────────────

  const dispatchCommand = useCallback(
    async (input: string) => {
      if (!input.trim()) return;
      setIsDispatching(true);

      const timestamp = new Date();
      let output = '';

      try {
        // Parse simple command format: "domain: task" or just dispatch to auto-resolve
        const colonIdx = input.indexOf(':');
        let domain = 'self-healing';
        let task = input;

        if (colonIdx > 0 && colonIdx < 30) {
          domain = input.slice(0, colonIdx).trim().toLowerCase();
          task = input.slice(colonIdx + 1).trim();
        }

        const res = await api.post<any>('/api/admin/command-center/dispatch-task', {
          domain,
          layer: 'sentinel',
          task,
          eventType: 'terminal-command',
          severity: 'info',
        });

        if (res.error) {
          output = `ERROR: ${res.error}`;
        } else {
          const data = res.data;
          output = `DISPATCHED to ${domain} pool\n` +
            `Event: ${data?.event?.id ?? 'created'}\n` +
            `Agent: ${data?.agent ? `${data.agent.id} (${data.agent.layer})` : 'queued'}\n` +
            `Status: ${data?.message ?? 'OK'}`;
        }
      } catch (err: any) {
        output = `ERROR: ${err.message}`;
      }

      setCommandHistory((prev) => [...prev, { input, output, timestamp }]);
      setCommandInput('');
      setIsDispatching(false);

      // Refresh data
      refetchSystem();
      refetchFeed();
      refetchValidation();
    },
    [api, refetchSystem, refetchFeed, refetchValidation]
  );

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchCommand(commandInput);
  };

  // Auto-scroll command output
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [commandHistory]);

  /* ═════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-red-600/20 border border-blue-500/20">
              <Terminal className="h-5 w-5 text-blue-400" />
            </div>
            Universe Terminal
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Full system command center — monitor, dispatch, and control
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`relative flex h-2 w-2 ${connectionStatus === 'connected' ? '' : ''}`}>
              {connectionStatus === 'connected' && (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </>
              )}
              {connectionStatus === 'error' && (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              )}
              {connectionStatus === 'loading' && (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
            <span className={`${
              connectionStatus === 'connected' ? 'text-emerald-400' :
              connectionStatus === 'error' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {connectionStatus === 'connected' ? 'LIVE' : connectionStatus === 'error' ? 'DISCONNECTED' : 'CONNECTING'}
            </span>
            {lastUpdate && (
              <span className="text-[hsl(var(--muted-foreground))] ml-1">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          <button
            onClick={async () => {
              await api.post('/api/admin/deployment/validate/run', { feature: 'manual-validation' });
              refetchValidation();
            }}
            className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-300 hover:bg-red-500/20 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Run Validation
          </button>
          <button
            onClick={() => { refetchSystem(); refetchFeed(); refetchValidation(); }}
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Top stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Agents" value={totalAgents.toLocaleString()} icon={Cpu} color="text-blue-400" />
        <StatCard label="Active" value={activeAgents} icon={Zap} color="text-amber-400" />
        <StatCard label="Utilization" value={`${utilization}%`} icon={Activity} color="text-emerald-400" />
        <StatCard label="Pools" value={pools.length} icon={Layers} />
        <StatCard
          label="Uptime"
          value={systemStatus?.environment ? formatUptime(systemStatus.environment.uptimeSeconds) : '--'}
          icon={Clock}
        />
        <StatCard
          label="Memory"
          value={systemStatus?.environment?.memory?.heapUsed ?? '--'}
          icon={Server}
        />
      </div>

      {/* ── Validation Enforcement Status ─────────────────────────── */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
          <Shield className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Deployment Validation</h2>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            validationData?.readiness === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' :
            validationData?.readiness === 'READY_FOR_DEPLOY' ? 'bg-blue-500/20 text-blue-400' :
            validationData?.readiness === 'VALIDATION_FAILED' ? 'bg-red-500/20 text-red-400' :
            validationData?.readiness === 'VALIDATING' ? 'bg-amber-500/20 text-amber-400' :
            'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
          }`}>
            {validationData?.readiness || 'NOT_RUN'}
          </span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            {(['schema_truth', 'generated_types', 'type_contracts', 'strict_compile', 'clean_build', 'endpoint_contracts', 'deploy_health'] as const).map((stage) => {
              const status = validationData?.stages?.[stage] || 'not_run';
              const labels: Record<string, string> = {
                schema_truth: 'Schema',
                generated_types: 'Gen Types',
                type_contracts: 'Contracts',
                strict_compile: 'Compile',
                clean_build: 'Build',
                endpoint_contracts: 'Endpoints',
                deploy_health: 'Health',
              };
              return (
                <div
                  key={stage}
                  className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                    status === 'pass' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                    status === 'fail' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                    status === 'running' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                    'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  <div>{labels[stage]}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{status.toUpperCase()}</div>
                </div>
              );
            })}
          </div>

          {/* Blockers panel */}
          {blockersData?.blockers && blockersData.blockers.length > 0 && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">
                  {blockersData.blockers.length} Deployment Blocker{blockersData.blockers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {blockersData.blockers.map((blocker: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[hsl(var(--foreground))]">{blocker.message}</span>
                      {blocker.file && (
                        <span className="text-[hsl(var(--muted-foreground))] ml-1">({blocker.file})</span>
                      )}
                      <span className={`ml-1.5 rounded px-1 py-0.5 text-[9px] ${
                        blocker.autoFixable
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                      }`}>
                        {blocker.fixType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blockersData?.blockers?.length === 0 && validationData?.readiness === 'READY_FOR_DEPLOY' && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">All validation gates passed. Deploy allowed.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid (3 columns) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Column 1: Command Console + Pool Monitor ────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Command Console */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
              <Terminal className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Command Console</h2>
            </div>
            <div
              ref={scrollRef}
              className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-2"
            >
              {commandHistory.length === 0 && (
                <div className="text-[hsl(var(--muted-foreground))] italic">
                  Type &quot;domain: task&quot; to dispatch. e.g. &quot;seo-content: Write 5 blog posts about AI&quot;
                </div>
              )}
              {commandHistory.map((cmd, i) => (
                <div key={i}>
                  <div className="text-emerald-400">
                    <span className="text-[hsl(var(--muted-foreground))]">[{cmd.timestamp.toLocaleTimeString()}]</span>{' '}
                    $ {cmd.input}
                  </div>
                  <div className="text-[hsl(var(--muted-foreground))] whitespace-pre-wrap pl-2 mt-0.5">{cmd.output}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleCommandSubmit} className="flex border-t border-[hsl(var(--border))]">
              <span className="flex items-center pl-3 text-emerald-400 text-sm font-mono">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="domain: task description..."
                disabled={isDispatching}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none font-mono disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!commandInput.trim() || isDispatching}
                className="px-3 text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Deployment Status */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
              <Server className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Deployment</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Production</span>
                {deployStatus?.productionReachable ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> Reachable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="h-3 w-3" /> Unreachable
                  </span>
                )}
              </div>
              {deployStatus?.summary && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Health Score</span>
                    <span className={`text-xs font-medium ${
                      deployStatus.summary.verdict === 'healthy'
                        ? 'text-emerald-400'
                        : deployStatus.summary.verdict === 'degraded'
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}>
                      {deployStatus.summary.healthScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Verdict</span>
                    <span className="text-xs text-[hsl(var(--foreground))] capitalize">{deployStatus.summary.verdict}</span>
                  </div>
                </>
              )}
              {systemStatus?.environment && (
                <>
                  <div className="border-t border-[hsl(var(--border))] pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Node</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{systemStatus.environment.nodeVersion}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">PID</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{systemStatus.environment.pid}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">ENV</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{systemStatus.environment.nodeEnv}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Database Health */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
              <Database className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Database</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Connection</span>
                {connectionStatus === 'connected' ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Wifi className="h-3 w-3" /> Connected
                  </span>
                ) : connectionStatus === 'error' ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <Wifi className="h-3 w-3" /> Error
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Wifi className="h-3 w-3" /> Checking...
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Host</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">shinkansen.proxy.rlwy.net</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">API Status</span>
                <span className={`text-xs ${systemStatus ? 'text-emerald-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                  {systemStatus ? 'Responding' : 'Waiting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Column 2: Pool Monitor ──────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
              <Layers className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Agent Pools</h2>
              <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{pools.length} pools</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pools.length === 0 ? (
                <div className="p-4 text-sm text-[hsl(var(--muted-foreground))] text-center">
                  {poolsError ? 'Failed to load pools — retrying...' : 'Loading pools...'}
                </div>
              ) : (
                pools.map((pool) => <PoolRow key={pool.domain} pool={pool} />)
              )}
            </div>
          </div>
        </div>

        {/* ── Column 3: Live Event Feed ──────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
              <Activity className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Live Events</h2>
              <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{events.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {events.length === 0 ? (
                <div className="p-4 text-sm text-[hsl(var(--muted-foreground))] text-center">No recent events</div>
              ) : (
                events.slice(0, 50).map((event) => (
                  <div
                    key={event.id}
                    className={`px-4 py-2.5 ${event.handled ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {event.handled ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : event.severity === 'critical' ? (
                        <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                      ) : (
                        <Clock className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${severityColor(event.severity)}`}>
                        {event.domain}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate pl-5">
                      {event.message}
                    </p>
                    {event.resolution && (
                      <p className="text-[10px] text-emerald-400/70 mt-0.5 truncate pl-5">
                        {event.resolution}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Health Engine Status ──────────────────────────────────────── */}
      {systemStatus?.healthEngine && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4 py-3">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Self-Healing Engine</h2>
            <span className={`ml-auto text-xs font-medium ${
              (systemStatus.healthEngine as any).healthy ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(systemStatus.healthEngine as any).healthy ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>
          <div className="p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Last check: {(systemStatus.healthEngine as any).lastRunAt
                ? new Date((systemStatus.healthEngine as any).lastRunAt).toLocaleString()
                : 'Never'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
