'use client';

import { useState } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { useAuth } from '../../../../contexts/auth';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Rocket,
  Globe,
  Server,
  Cpu,
  GitCommit,
  Clock,
  RefreshCw,
  Trash2,
  Database,
  ArrowUpCircle,
  Terminal,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Zap,
  Play,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_FRONTEND_STATUS = {
  lastDeploy: 'success' as const,
  commitHash: 'a3f8c12',
  timestamp: '2026-03-12T09:42:00Z',
  domain: 'memelli.com'
};

const MOCK_API_STATUS = {
  health: 'healthy' as const,
  lastRestart: '2026-03-11T22:15:00Z',
  uptime: '11h 27m',
  service: 'memelli-production'
};

const MOCK_WORKERS_STATUS = {
  activeWorkers: 6,
  totalWorkers: 6,
  queueDepth: 23,
  service: 'memelli-workers'
};

interface Deployment {
  id: string;
  service: string;
  status: 'success' | 'failed' | 'deploying' | 'cancelled';
  commit: string;
  author: string;
  time: string;
  duration: string;
}

const MOCK_DEPLOYMENTS: Deployment[] = [
  { id: '1', service: 'Frontend', status: 'success', commit: 'a3f8c12', author: 'thebooth', time: '2026-03-12T09:42:00Z', duration: '47s' },
  { id: '2', service: 'API', status: 'success', commit: 'a3f8c12', author: 'thebooth', time: '2026-03-12T09:38:00Z', duration: '1m 12s' },
  { id: '3', service: 'Workers', status: 'deploying', commit: 'b7e1d04', author: 'claude', time: '2026-03-12T09:35:00Z', duration: '\u2014' },
  { id: '4', service: 'Frontend', status: 'failed', commit: 'c9a2f87', author: 'thebooth', time: '2026-03-12T08:15:00Z', duration: '23s' },
  { id: '5', service: 'API', status: 'success', commit: 'e41bc5a', author: 'thebooth', time: '2026-03-11T22:10:00Z', duration: '1m 05s' },
  { id: '6', service: 'Workers', status: 'success', commit: 'e41bc5a', author: 'claude', time: '2026-03-11T22:08:00Z', duration: '58s' },
  { id: '7', service: 'Frontend', status: 'cancelled', commit: 'f12de89', author: 'thebooth', time: '2026-03-11T19:30:00Z', duration: '11s' },
  { id: '8', service: 'API', status: 'success', commit: 'd83fa10', author: 'thebooth', time: '2026-03-11T17:45:00Z', duration: '1m 20s' },
];

const MOCK_ENV_COUNTS: { service: string; count: number }[] = [
  // { service: 'Frontend (Vercel)', count: 14 },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
  { service: 'API (Railway)', count: 27 },
  { service: 'Workers (Railway)', count: 19 },
];

const MOCK_BUILD_LOGS = [
  '[09:42:01] Cloning repository...',
  '[09:42:03] Detected Next.js project',
  '[09:42:03] Installing dependencies with pnpm...',
  '[09:42:18] Packages installed (1,247 packages)',
  '[09:42:19] Running build command: next build',
  '[09:42:20] Creating an optimized production build...',
  '[09:42:31] Compiled successfully',
  '[09:42:32] Collecting page data...',
  '[09:42:35] Generating static pages (47/47)',
  '[09:42:36] Finalizing page optimization...',
  '[09:42:38] Route (app)          Size     First Load JS',
  '[09:42:38] / (universe)         4.2 kB   89.1 kB',
  '[09:42:38] /dashboard           3.8 kB   87.2 kB',
  '[09:42:38] /deploy              5.1 kB   91.4 kB',
  '[09:42:39] Build output ready',
  '[09:42:40] Deploying to production...',
  '[09:42:44] Deployment complete \u2014 memelli.com',
  '[09:42:44] Status: READY',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function statusBadgeClasses(status: Deployment['status']): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'failed':
      return 'bg-primary/80/15 text-primary border border-primary/30';
    case 'deploying':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse';
    case 'cancelled':
      return 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DeployPage() {
  const api = useApi();
  const { user } = useAuth();

  const [deployingStates, setDeployingStates] = useState<Record<string, boolean>>({});
  const [envExpanded, setEnvExpanded] = useState(false);
  const [streamingLogs, setStreamingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'frontend' | 'api' | 'workers'>('all');

  const simulateAction = (key: string) => {
    setDeployingStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setDeployingStates((prev) => ({ ...prev, [key]: false }));
    }, 2500);
  };

  const filteredDeployments =
    activeTab === 'all'
      ? MOCK_DEPLOYMENTS
      : MOCK_DEPLOYMENTS.filter((d) => d.service.toLowerCase() === activeTab);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* ====== Header ====== */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/80/15 border border-primary/20">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deploy Center</h1>
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">Push updates to production</p>
            </div>
          </div>
        </div>

        {/* ====== 1. Deployment Status Cards ====== */}
        <section className="mb-8">
          <div className="grid gap-4 lg:grid-cols-3">
            // {/* Frontend (Vercel) */}  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 hover:border-[hsl(var(--border))] transition-all duration-200 border-l-2 border-l-blue-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">Frontend</h3>
                    // <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Vercel</p>  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Live
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Last Deploy</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Commit</span>
                  <span className="font-mono text-xs text-[hsl(var(--foreground))]">{MOCK_FRONTEND_STATUS.commitHash}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Deployed At</span>
                  <span className="text-xs text-[hsl(var(--foreground))]">{formatTime(MOCK_FRONTEND_STATUS.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* API (Railway) */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 hover:border-[hsl(var(--border))] transition-all duration-200 border-l-2 border-l-emerald-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">API</h3>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Railway</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Healthy
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Health</span>
                  <span className="text-xs font-medium text-emerald-400 capitalize">{MOCK_API_STATUS.health}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Last Restart</span>
                  <span className="text-xs text-[hsl(var(--foreground))]">{formatTime(MOCK_API_STATUS.lastRestart)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Uptime</span>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{MOCK_API_STATUS.uptime}</span>
                </div>
              </div>
            </div>

            {/* Workers (Railway) */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 hover:border-[hsl(var(--border))] transition-all duration-200 border-l-2 border-l-red-500/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">Workers</h3>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Railway</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/80/15 border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  {MOCK_WORKERS_STATUS.activeWorkers}/{MOCK_WORKERS_STATUS.totalWorkers}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Active Workers</span>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                    {MOCK_WORKERS_STATUS.activeWorkers} of {MOCK_WORKERS_STATUS.totalWorkers}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Queue Depth</span>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{MOCK_WORKERS_STATUS.queueDepth} jobs</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Status</span>
                  <span className="text-xs font-medium text-emerald-400">All Running</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 2. Quick Deploy Actions ====== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Deploy Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              // { key: 'deploy-frontend', icon: Globe, label: 'Deploy Frontend', sub: 'Trigger Vercel redeploy' },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
              { key: 'restart-api', icon: Server, label: 'Restart API', sub: 'Restart Railway API service' },
              { key: 'restart-workers', icon: Cpu, label: 'Restart Workers', sub: 'Restart worker services' },
              { key: 'clear-cache', icon: Trash2, label: 'Clear Cache', sub: 'Flush Redis cache' },
              { key: 'run-migrations', icon: Database, label: 'Run Migrations', sub: 'Trigger prisma db push' },
              { key: 'sync-registry', icon: ArrowUpCircle, label: 'Sync Registry', sub: 'Sync project registry' },
            ].map((action) => (
              <button
                key={action.key}
                onClick={() => simulateAction(action.key)}
                disabled={deployingStates[action.key]}
                className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-4 text-left hover:bg-[hsl(var(--muted))] hover:border-primary/20 transition-all duration-200 disabled:opacity-50 group"
              >
                {deployingStates[action.key] ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <action.icon className="h-5 w-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                )}
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{action.label}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ====== 3. Recent Deployments ====== */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Deployments
            </h2>
            <div className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-0.5">
              {(['all', 'frontend', 'api', 'workers'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 capitalize ${
                    activeTab === tab
                      ? 'bg-primary/20 text-primary'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Commit</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Time</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeployments.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{dep.service}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClasses(dep.status)}`}
                      >
                        {dep.status === 'success' && <CheckCircle className="h-3 w-3" />}
                        {dep.status === 'failed' && <XCircle className="h-3 w-3" />}
                        {dep.status === 'deploying' && <LoadingGlobe size="sm" />}
                        {dep.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                        <GitCommit className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                        {dep.commit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{dep.author}</td>
                    <td className="px-4 py-3 text-right text-xs text-[hsl(var(--muted-foreground))]">{formatTime(dep.time)}</td>
                    <td className="px-4 py-3 text-right text-sm text-[hsl(var(--muted-foreground))]">{dep.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ====== 4. Environment Variables (Collapsible) ====== */}
        <section className="mb-8">
          <button
            onClick={() => setEnvExpanded(!envExpanded)}
            className="mb-4 flex w-full items-center gap-2 text-lg font-semibold tracking-tight hover:text-primary transition-colors text-left"
          >
            {envExpanded ? (
              <ChevronDown className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5 text-primary" />
            )}
            <Settings className="h-5 w-5 text-primary" />
            Environment Variables
          </button>

          {envExpanded && (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] divide-y divide-white/[0.03]">
              {MOCK_ENV_COUNTS.map((env) => (
                <div
                  key={env.service}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[hsl(var(--muted))] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
                      <EyeOff className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{env.service}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {env.count} variables &middot; All values masked
                      </p>
                    </div>
                  </div>
                  <button className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-primary/20 hover:text-primary transition-all duration-200">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ====== 5. Build Logs ====== */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Build Logs
            </h2>
            <button
              onClick={() => setStreamingLogs(!streamingLogs)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                streamingLogs
                  ? 'border-primary/30 bg-primary/80/15 text-primary'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-white/[0.1]'
              }`}
            >
              {streamingLogs ? (
                <>
                  <LoadingGlobe size="sm" />
                  Streaming...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Stream Logs
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-primary/80/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span className="ml-2 text-[11px] text-[hsl(var(--muted-foreground))] font-mono">build -- memelli-frontend</span>
            </div>
            <div className="h-[320px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed scrollbar-thin">
              {MOCK_BUILD_LOGS.map((line, idx) => (
                <div
                  key={idx}
                  className={`${
                    line.includes('successfully') || line.includes('READY') || line.includes('complete')
                      ? 'text-emerald-400'
                      : line.includes('Error') || line.includes('FAIL')
                        ? 'text-primary'
                        : 'text-green-400/80'
                  }`}
                >
                  {line}
                </div>
              ))}
              {streamingLogs && (
                <div className="mt-1 text-primary animate-pulse">
                  [09:42:45] Watching for changes...
                </div>
              )}
              <div className="mt-1 text-[hsl(var(--muted-foreground))]">$&nbsp;<span className="inline-block w-2 h-4 bg-green-400/60 animate-pulse" /></div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
