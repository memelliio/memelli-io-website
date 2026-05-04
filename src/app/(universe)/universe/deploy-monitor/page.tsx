'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Code2,
  GitBranch,
  Globe,
  Hammer,
  Layers,
  RefreshCw,
  Rocket,
  Server,
  Shield,
  Terminal,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type PipelineStage = 'code' | 'validate' | 'build' | 'deploy' | 'verify';
type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
type DeployState = 'idle' | 'building' | 'deploying' | 'live' | 'failed';
type Platform = 'railway' | 'vercel'; // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md (type kept for consumers)

interface PipelineStep {
  id: PipelineStage;
  label: string;
  icon: typeof Code2;
  status: StageStatus;
  durationMs?: number;
}

interface DeployRecord {
  id: string;
  platform: Platform;
  service: string;
  status: 'success' | 'failed' | 'deploying' | 'cancelled';
  commit: string;
  message: string;
  timestamp: string;
  durationSec: number | null;
}

interface PlatformStatus {
  platform: Platform;
  label: string;
  state: DeployState;
  services: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: string;
    lastDeploy: string;
  }[];
}

interface TsCheckerResult {
  running: boolean;
  lastRunAt: string | null;
  errorCount: number;
  warningCount: number;
  lastPassed: boolean;
  lastDurationMs: number;
  recentErrors: string[];
}

interface AutoPatcherEntry {
  id: string;
  type: 'fix' | 'patch' | 'heal';
  target: string;
  description: string;
  status: 'applied' | 'pending' | 'failed';
  timestamp: string;
}

interface MonitorData {
  overallState: DeployState;
  pipeline: PipelineStep[];
  platforms: PlatformStatus[];
  recentDeploys: DeployRecord[];
  tsChecker: TsCheckerResult;
  autoPatcher: AutoPatcherEntry[];
  lastPolled: string;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const POLL_INTERVAL = 10_000;

const PIPELINE_TEMPLATE: PipelineStep[] = [
  { id: 'code', label: 'Code', icon: Code2, status: 'pending' },
  { id: 'validate', label: 'Validate', icon: Shield, status: 'pending' },
  { id: 'build', label: 'Build', icon: Hammer, status: 'pending' },
  { id: 'deploy', label: 'Deploy', icon: Rocket, status: 'pending' },
  { id: 'verify', label: 'Verify', icon: CheckCircle, status: 'pending' },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return iso;
  }
}

function stateColor(state: DeployState): string {
  switch (state) {
    case 'live': return 'text-emerald-400';
    case 'building': return 'text-blue-400';
    case 'deploying': return 'text-amber-400';
    case 'failed': return 'text-red-400';
    default: return 'text-[hsl(var(--muted-foreground))]';
  }
}

function stageStatusColor(s: StageStatus): string {
  switch (s) {
    case 'passed': return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
    case 'running': return 'border-blue-500/40 bg-blue-500/10 text-blue-400';
    case 'failed': return 'border-red-500/40 bg-red-500/10 text-red-400';
    case 'skipped': return 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
    default: return 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
  }
}

function connectorColor(from: StageStatus, to: StageStatus): string {
  if (from === 'passed' && (to === 'passed' || to === 'running')) return 'bg-emerald-500/60';
  if (from === 'passed' && to === 'pending') return 'bg-emerald-500/30';
  if (from === 'failed') return 'bg-red-500/40';
  return 'bg-[hsl(var(--muted))]';
}

function deployStatusBadge(status: DeployRecord['status']): string {
  switch (status) {
    case 'success': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'failed': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'deploying': return 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse';
    case 'cancelled': return 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
  }
}

function patchStatusColor(status: AutoPatcherEntry['status']): string {
  switch (status) {
    case 'applied': return 'text-emerald-400';
    case 'pending': return 'text-amber-400';
    case 'failed': return 'text-red-400';
  }
}

/* ================================================================== */
/*  Data Fetcher                                                       */
/* ================================================================== */

function buildMonitorData(
  deployStatus: any,
  healthData: any,
  tsStatus: any,
  batchStatus: any,
): MonitorData {
  // --- Derive pipeline from batch deploy or deploy status ---
  let pipeline = PIPELINE_TEMPLATE.map((s) => ({ ...s }));
  let overallState: DeployState = 'idle';

  if (batchStatus?.active) {
    overallState = 'deploying';
    const stages = batchStatus.active.stages || [];
    const stageMap: Record<string, StageStatus> = {};
    for (const s of stages) {
      const mapped = s.id?.replace('ts_check', 'validate')
        .replace('commit_push', 'code')
        .replace('railway_deploy', 'deploy')
        // .replace('vercel_deploy', 'deploy')  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
        .replace('health_verify', 'verify')
        .replace('web_build', 'build') || s.id;
      if (s.status === 'running') stageMap[mapped] = 'running';
      else if (s.status === 'passed' || s.status === 'complete') stageMap[mapped] = 'passed';
      else if (s.status === 'failed') stageMap[mapped] = 'failed';
      else if (s.status === 'skipped') stageMap[mapped] = 'skipped';
    }
    pipeline = pipeline.map((p) => ({
      ...p,
      status: stageMap[p.id] || p.status,
    }));
    if (stages.every((s: any) => s.status === 'passed' || s.status === 'complete')) {
      overallState = 'live';
    } else if (stages.some((s: any) => s.status === 'failed')) {
      overallState = 'failed';
    }
  } else if (deployStatus?.status) {
    const ds = deployStatus.status;
    if (ds.deploying) overallState = 'deploying';
    else if (ds.lastDeploySuccess === false) overallState = 'failed';
    else overallState = 'live';
  }

  // --- Platforms ---
  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md (was: also tracked Vercel services)
  const railwayServices: PlatformStatus['services'] = [];

  if (healthData?.services) {
    for (const svc of healthData.services) {
      const entry = {
        name: svc.name,
        status: svc.status as 'operational' | 'degraded' | 'down',
        uptime: svc.metrics?.uptime || '--',
        lastDeploy: svc.lastCheck || new Date().toISOString(),
      };
      railwayServices.push(entry);
    }
  }

  // Ensure at least one entry per platform
  if (railwayServices.length === 0) {
    railwayServices.push(
      { name: 'API', status: 'operational', uptime: '--', lastDeploy: new Date().toISOString() },
      { name: 'Workers', status: 'operational', uptime: '--', lastDeploy: new Date().toISOString() },
      { name: 'Postgres', status: 'operational', uptime: '--', lastDeploy: new Date().toISOString() },
      { name: 'Redis', status: 'operational', uptime: '--', lastDeploy: new Date().toISOString() },
      { name: 'Frontend', status: 'operational', uptime: '--', lastDeploy: new Date().toISOString() },
    );
  }

  const railwayState: DeployState = railwayServices.some((s) => s.status === 'down')
    ? 'failed'
    : railwayServices.some((s) => s.status === 'degraded')
      ? 'building'
      : 'live';

  const platforms: PlatformStatus[] = [
    { platform: 'railway', label: 'Railway', state: railwayState, services: railwayServices },
  ];

  // --- Recent deploys from deploy log ---
  const recentDeploys: DeployRecord[] = [];
  if (deployStatus?.recentLog) {
    for (const entry of deployStatus.recentLog.slice(0, 12)) {
      recentDeploys.push({
        id: entry.id || `${Date.now()}-${Math.random()}`,
        platform: 'railway', // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md (was: vercel/railway split)
        service: entry.service || entry.target || 'API',
        status: entry.status === 'success' || entry.success ? 'success'
          : entry.status === 'failed' || entry.error ? 'failed'
            : entry.status === 'deploying' ? 'deploying'
              : 'cancelled',
        commit: entry.commit || entry.commitHash || '--',
        message: entry.message || entry.description || '',
        timestamp: entry.timestamp || entry.time || new Date().toISOString(),
        durationSec: entry.durationSec || entry.duration || null,
      });
    }
  }

  // --- TypeScript Checker ---
  const tsChecker: TsCheckerResult = {
    running: tsStatus?.running ?? false,
    lastRunAt: tsStatus?.lastRunAt ?? tsStatus?.timestamp ?? null,
    errorCount: tsStatus?.errorCount ?? tsStatus?.totalErrors ?? 0,
    warningCount: tsStatus?.warningCount ?? 0,
    lastPassed: tsStatus?.lastPassed ?? tsStatus?.buildCheck?.lastPassed ?? true,
    lastDurationMs: tsStatus?.lastDurationMs ?? tsStatus?.buildCheck?.lastDurationMs ?? 0,
    recentErrors: tsStatus?.recentErrors ?? [],
  };

  // --- Auto Patcher (from deploy log repair entries) ---
  const autoPatcher: AutoPatcherEntry[] = [];
  if (deployStatus?.recentLog) {
    for (const entry of deployStatus.recentLog) {
      if (entry.type === 'repair' || entry.type === 'patch' || entry.type === 'heal' || entry.autoPatch) {
        autoPatcher.push({
          id: entry.id || `patch-${Date.now()}-${Math.random()}`,
          type: entry.type === 'heal' ? 'heal' : entry.type === 'patch' ? 'patch' : 'fix',
          target: entry.target || entry.file || entry.service || '--',
          description: entry.message || entry.description || 'Auto-repair applied',
          status: entry.success || entry.status === 'applied' ? 'applied' : entry.status === 'pending' ? 'pending' : 'failed',
          timestamp: entry.timestamp || new Date().toISOString(),
        });
      }
    }
  }

  return {
    overallState,
    pipeline,
    platforms,
    recentDeploys,
    tsChecker,
    autoPatcher,
    lastPolled: new Date().toISOString(),
  };
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function DeployMonitorPage() {
  const api = useApi();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [deployRes, healthRes, tsRes, batchRes] = await Promise.allSettled([
        api.get<any>('/api/admin/deploy/status'),
        api.get<any>('/api/admin/health-dashboard'),
        api.get<any>('/api/admin/ts-checker/status'),
        api.get<any>('/api/admin/batch-deploy/status'),
      ]);

      const deployData = deployRes.status === 'fulfilled' ? deployRes.value.data : null;
      const healthData = healthRes.status === 'fulfilled' ? healthRes.value.data : null;
      const tsData = tsRes.status === 'fulfilled' ? tsRes.value.data : null;
      const batchData = batchRes.status === 'fulfilled' ? batchRes.value.data : null;

      const monitor = buildMonitorData(deployData, healthData, tsData, batchData);
      setData(monitor);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch monitor data');
    } finally {
      setLoading(false);
      setPollCount((c) => c + 1);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Loading / Error states                                           */
  /* ---------------------------------------------------------------- */

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--card))]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Connecting to deploy systems...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--card))]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="mt-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const d = data!;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ====== Header ====== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/20">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deploy Monitor</h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                Real-time deployment pipeline &middot; polling every 10s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5">
              <div className={`h-2 w-2 rounded-full ${
                d.overallState === 'live' ? 'bg-emerald-400 animate-pulse' :
                d.overallState === 'building' || d.overallState === 'deploying' ? 'bg-blue-400 animate-pulse' :
                d.overallState === 'failed' ? 'bg-red-400' : 'bg-[hsl(var(--muted-foreground))]'
              }`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${stateColor(d.overallState)}`}>
                {d.overallState}
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
              Poll #{pollCount}
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* ====== 1. Build Pipeline ====== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            Build Pipeline
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
            <div className="flex items-center justify-between">
              {d.pipeline.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  {/* Stage Node */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${stageStatusColor(step.status)}`}>
                      <step.icon className="h-6 w-6" />
                      {step.status === 'running' && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-ping" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{step.label}</p>
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${
                        step.status === 'passed' ? 'text-emerald-400' :
                        step.status === 'running' ? 'text-blue-400' :
                        step.status === 'failed' ? 'text-red-400' :
                        'text-[hsl(var(--muted-foreground))]'
                      }`}>
                        {step.status}
                      </p>
                      {step.durationMs != null && (
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{(step.durationMs / 1000).toFixed(1)}s</p>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  {idx < d.pipeline.length - 1 && (
                    <div className="flex-1 flex items-center px-2 -mt-6">
                      <div className="relative h-1 w-full rounded-full overflow-hidden bg-[hsl(var(--muted))]">
                        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${connectorColor(step.status, d.pipeline[idx + 1].status)}`}
                          style={{
                            width: step.status === 'passed' ? '100%' :
                              step.status === 'running' ? '50%' : '0%'
                          }}
                        />
                        {step.status === 'running' && (
                          <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent animate-flow" />
                        )}
                        {step.status === 'passed' && d.pipeline[idx + 1].status === 'running' && (
                          <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent animate-flow" />
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0 -ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        // {/* ====== 2. Platform Status — Railway + Vercel Side by Side ====== */}  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            Platform Status
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {d.platforms.map((plat) => (
              <div
                key={plat.platform}
                className={`rounded-2xl border p-5 transition-all duration-200 ${
                  plat.state === 'live'
                    ? 'border-emerald-500/10 bg-emerald-500/[0.02]'
                    : plat.state === 'failed'
                      ? 'border-red-500/10 bg-red-500/[0.02]'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {plat.platform === 'railway' ? (
                      <Server className="h-5 w-5 text-primary" />
                    ) : (
                      <Globe className="h-5 w-5 text-blue-400" />
                    )}
                    <h3 className="text-sm font-bold tracking-tight">{plat.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      plat.state === 'live' ? 'bg-emerald-400 animate-pulse' :
                      plat.state === 'failed' ? 'bg-red-400' :
                      'bg-amber-400 animate-pulse'
                    }`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${stateColor(plat.state)}`}>
                      {plat.state}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {plat.services.map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          svc.status === 'operational' ? 'bg-emerald-400' :
                          svc.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                        <span className="text-xs font-medium text-[hsl(var(--foreground))]">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{svc.uptime}</span>
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${
                          svc.status === 'operational' ? 'text-emerald-400' :
                          svc.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {svc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== 3. TypeScript Checker + Auto-Patcher ====== */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          {/* TS Checker */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold tracking-tight">TypeScript Checker</h3>
              </div>
              {d.tsChecker.running ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider animate-pulse">
                  Running
                </span>
              ) : d.tsChecker.lastPassed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle className="h-3 w-3" />
                  Passing
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                  <XCircle className="h-3 w-3" />
                  Failing
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-center">
                <p className={`text-lg font-bold ${d.tsChecker.errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {d.tsChecker.errorCount}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Errors</p>
              </div>
              <div className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-center">
                <p className={`text-lg font-bold ${d.tsChecker.warningCount > 0 ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                  {d.tsChecker.warningCount}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Warnings</p>
              </div>
              <div className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-[hsl(var(--foreground))] font-mono">
                  {d.tsChecker.lastDurationMs > 0 ? `${(d.tsChecker.lastDurationMs / 1000).toFixed(1)}s` : '--'}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Duration</p>
              </div>
            </div>
            {d.tsChecker.recentErrors.length > 0 && (
              <div className="rounded-xl bg-[hsl(var(--card))] border border-red-500/10 p-3 max-h-[140px] overflow-y-auto">
                {d.tsChecker.recentErrors.slice(0, 6).map((err, i) => (
                  <p key={i} className="text-[11px] font-mono text-red-400/80 leading-relaxed truncate">
                    {err}
                  </p>
                ))}
              </div>
            )}
            {d.tsChecker.lastRunAt && (
              <p className="mt-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                Last run: {relativeTime(d.tsChecker.lastRunAt)}
              </p>
            )}
          </div>

          {/* Auto-Patcher Activity */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight">Auto-Patcher Activity</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                {d.autoPatcher.length} patches
              </span>
            </div>
            {d.autoPatcher.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[hsl(var(--muted-foreground))]">
                <Shield className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">No recent auto-patches</p>
                <p className="text-[10px] mt-1">System is clean</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {d.autoPatcher.map((patch) => (
                  <div
                    key={patch.id}
                    className="flex items-start gap-3 rounded-xl bg-[hsl(var(--muted))] px-3 py-2.5 hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <div className={`mt-0.5 ${patchStatusColor(patch.status)}`}>
                      {patch.status === 'applied' ? <CheckCircle className="h-3.5 w-3.5" /> :
                       patch.status === 'failed' ? <XCircle className="h-3.5 w-3.5" /> :
                       <Clock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">{patch.target}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          patch.type === 'fix' ? 'bg-blue-500/15 text-blue-400' :
                          patch.type === 'patch' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {patch.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">{patch.description}</p>
                    </div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap shrink-0">
                      {relativeTime(patch.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ====== 4. Recent Deploys ====== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Recent Deploys
          </h2>
          {d.recentDeploys.length === 0 ? (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-8 text-center">
              <Rocket className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No recent deployments recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Platform</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Service</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Commit</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Time</th>
                    <th className="px-4 py-3 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentDeploys.map((dep) => (
                    <tr
                      key={dep.id}
                      className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          dep.platform === 'railway' ? 'text-primary' : 'text-blue-400'
                        }`}>
                          {dep.platform === 'railway' ? <Server className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                          // {dep.platform === 'railway' ? 'Railway' : 'Vercel'}  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[hsl(var(--foreground))]">{dep.service}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${deployStatusBadge(dep.status)}`}>
                          {dep.status === 'success' && <CheckCircle className="h-3 w-3" />}
                          {dep.status === 'failed' && <XCircle className="h-3 w-3" />}
                          {dep.status === 'deploying' && <div className="h-3 w-3 rounded-full border border-blue-400/50 border-t-blue-400 animate-spin" />}
                          {dep.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                          <GitBranch className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                          {dep.commit.slice(0, 7)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] max-w-[200px] truncate">{dep.message}</td>
                      <td className="px-4 py-3 text-right text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(dep.timestamp)}</td>
                      <td className="px-4 py-3 text-right text-xs text-[hsl(var(--muted-foreground))] font-mono">
                        {dep.durationSec != null ? `${dep.durationSec}s` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ====== Footer ====== */}
        <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
          <span>Last polled: {formatTime(d.lastPolled)}</span>
          <span>Auto-refresh: {POLL_INTERVAL / 1000}s</span>
        </div>

      </div>

      {/* ====== Animation keyframes ====== */}
      <style jsx>{`
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-flow {
          animation: flow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
