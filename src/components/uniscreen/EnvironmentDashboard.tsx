"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Database,
  HardDrive,
  Loader2,
  Monitor,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  Shield,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EnvName = "DEVELOPMENT" | "STAGING" | "PRODUCTION";
type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";
type DeployStatus = "PENDING" | "BUILDING" | "DEPLOYING" | "DEPLOYED" | "FAILED" | "ROLLED_BACK";
type BackupStatus = "pending" | "in_progress" | "completed" | "failed";

interface ServiceInfo {
  name: string;
  url: string;
  status: ServiceStatus;
  version: string;
}

interface EnvironmentConfig {
  environment: EnvName;
  services: ServiceInfo[];
  databaseUrl: string;
  redisUrl: string;
  lastDeployment?: DeploymentRecord;
  healthStatus: ServiceStatus;
}

interface DeploymentRecord {
  deploymentId: string;
  environment: EnvName;
  service: string;
  version: string;
  status: DeployStatus;
  gitCommit?: string;
  gitBranch?: string;
  startedAt: string;
  completedAt?: string;
  deployedBy: string;
  changelog?: string;
  error?: string;
}

interface BackupRecord {
  backupId: string;
  timestamp: string;
  type: "full" | "incremental";
  size: string;
  status: BackupStatus;
  restoredAt?: string;
}

interface ServiceHealthResult {
  service: string;
  environment: EnvName;
  status: ServiceStatus;
  responseTimeMs: number;
  version?: string;
  uptime?: number;
  lastCheckedAt: string;
  error?: string;
}

interface DeploymentMetrics {
  totalDeployments: number;
  successCount: number;
  failureCount: number;
  rollbackCount: number;
  successRate: number;
  avgDeployTimeMs: number;
  rollbackRate: number;
  deploymentsLast24h: number;
  deploymentsLast7d: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENV_ORDER: EnvName[] = ["PRODUCTION", "STAGING", "DEVELOPMENT"];

const ENV_COLORS: Record<EnvName, string> = {
  PRODUCTION: "border-red-500/30 bg-red-500/5",
  STAGING: "border-yellow-500/30 bg-yellow-500/5",
  DEVELOPMENT: "border-blue-500/30 bg-blue-500/5",
};

const ENV_BADGE: Record<EnvName, string> = {
  PRODUCTION: "bg-red-500/20 text-red-400",
  STAGING: "bg-yellow-500/20 text-yellow-400",
  DEVELOPMENT: "bg-blue-500/20 text-blue-400",
};

function statusColor(s: ServiceStatus): string {
  switch (s) {
    case "healthy": return "text-emerald-400";
    case "degraded": return "text-yellow-400";
    case "down": return "text-red-400";
    default: return "text-zinc-500";
  }
}

function statusDot(s: ServiceStatus): string {
  switch (s) {
    case "healthy": return "bg-emerald-400";
    case "degraded": return "bg-yellow-400";
    case "down": return "bg-red-400";
    default: return "bg-zinc-500";
  }
}

function deployStatusBadge(s: DeployStatus): { bg: string; text: string } {
  switch (s) {
    case "DEPLOYED": return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
    case "BUILDING":
    case "DEPLOYING":
    case "PENDING": return { bg: "bg-blue-500/20", text: "text-blue-400" };
    case "FAILED": return { bg: "bg-red-500/20", text: "text-red-400" };
    case "ROLLED_BACK": return { bg: "bg-orange-500/20", text: "text-orange-400" };
    default: return { bg: "bg-zinc-500/20", text: "text-zinc-400" };
  }
}

function backupStatusBadge(s: BackupStatus): { bg: string; text: string } {
  switch (s) {
    case "completed": return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
    case "in_progress": return { bg: "bg-blue-500/20", text: "text-blue-400" };
    case "pending": return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
    case "failed": return { bg: "bg-red-500/20", text: "text-red-400" };
    default: return { bg: "bg-zinc-500/20", text: "text-zinc-400" };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: typeof Activity }) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-xl font-semibold text-zinc-100">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function EnvironmentCard({
  env,
  healthResults,
  onRefresh,
}: {
  env: EnvironmentConfig;
  healthResults: ServiceHealthResult[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(env.environment === "PRODUCTION");

  return (
    <div className={`rounded-lg border ${ENV_COLORS[env.environment]} p-4`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
          <Cloud size={18} className={statusColor(env.healthStatus)} />
          <span className="font-medium text-zinc-100">{env.environment}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ENV_BADGE[env.environment]}`}>
            {env.healthStatus}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {env.lastDeployment && (
            <span>Last deploy: {timeAgo(env.lastDeployment.startedAt)}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
            className="p-1 rounded hover:bg-zinc-700/50 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Service Health Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {env.services.map((svc) => {
              const health = healthResults.find(
                (h) => h.service === svc.name && h.environment === env.environment,
              );
              return (
                <div
                  key={svc.name}
                  className="rounded border border-zinc-700/50 bg-zinc-900/50 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-200">{svc.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${statusDot(svc.status)}`} />
                  </div>
                  <div className="text-xs text-zinc-500">v{svc.version}</div>
                  {health && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <Timer size={10} />
                      <span>{formatMs(health.responseTimeMs)}</span>
                      {health.uptime != null && (
                        <span className="ml-auto">up {Math.floor(health.uptime / 3600)}h</span>
                      )}
                    </div>
                  )}
                  {health?.error && (
                    <div className="text-xs text-red-400 mt-1 truncate">{health.error}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Database + Redis */}
          <div className="flex gap-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Database size={10} />
              <span className="truncate max-w-[200px]">{env.databaseUrl}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <HardDrive size={10} />
              <span className="truncate max-w-[200px]">{env.redisUrl}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EnvironmentDashboard() {
  const api = useApi();
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [healthResults, setHealthResults] = useState<ServiceHealthResult[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const [systemConfig, setSystemConfig] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const fetchAll = useCallback(async () => {
    const [envRes, historyRes, backupRes, metricsRes, configRes] = await Promise.all([
      api.get<{ environments: EnvironmentConfig[] }>("/api/admin/deployments/environments"),
      api.get<{ deployments: DeploymentRecord[] }>("/api/admin/deployments/history"),
      api.get<{ backups: BackupRecord[] }>("/api/admin/deployments/backups"),
      api.get<DeploymentMetrics>("/api/admin/deployments/metrics"),
      api.get<Record<string, string | null>>("/api/admin/deployments/config"),
    ]);

    if (envRes.data) {
      const envs = "environments" in envRes.data ? envRes.data.environments : [];
      setEnvironments(envs);
    }
    if (historyRes.data) {
      const deps = "deployments" in historyRes.data ? historyRes.data.deployments : [];
      setDeployments(deps);
    }
    if (backupRes.data) {
      const bks = "backups" in backupRes.data ? backupRes.data.backups : [];
      setBackups(bks);
    }
    if (metricsRes.data) setMetrics(metricsRes.data);
    if (configRes.data) setSystemConfig(configRes.data);

    // Fetch health separately (can be slower)
    const healthRes = await api.get<Record<string, ServiceHealthResult[]>>("/api/admin/deployments/health");
    if (healthRes.data) {
      const all: ServiceHealthResult[] = [];
      for (const envHealthList of Object.values(healthRes.data)) {
        if (Array.isArray(envHealthList)) all.push(...envHealthList);
      }
      setHealthResults(all);
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRollback = async (deploymentId: string) => {
    setRollingBack(deploymentId);
    await api.post(`/api/admin/deployments/${deploymentId}/rollback`, {});
    await fetchAll();
    setRollingBack(null);
  };

  const handleBackup = async (type: "full" | "incremental") => {
    setBackingUp(true);
    await api.post("/api/admin/deployments/backups", { type });
    await fetchAll();
    setBackingUp(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <Loader2 className="animate-spin mr-2" size={18} />
        Loading deployment data...
      </div>
    );
  }

  const sortedEnvs = [...environments].sort(
    (a, b) => ENV_ORDER.indexOf(a.environment) - ENV_ORDER.indexOf(b.environment),
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-indigo-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Environment Control</h2>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Total Deploys"
            value={metrics.totalDeployments}
            sub={`${metrics.deploymentsLast24h} last 24h`}
            icon={TrendingUp}
          />
          <MetricCard
            label="Success Rate"
            value={`${metrics.successRate}%`}
            sub={`${metrics.successCount} succeeded`}
            icon={CheckCircle2}
          />
          <MetricCard
            label="Avg Deploy Time"
            value={formatMs(metrics.avgDeployTimeMs)}
            sub={`${metrics.deploymentsLast7d} last 7d`}
            icon={Timer}
          />
          <MetricCard
            label="Rollback Rate"
            value={`${metrics.rollbackRate}%`}
            sub={`${metrics.rollbackCount} rollbacks`}
            icon={RotateCcw}
          />
        </div>
      )}

      {/* Environment Cards */}
      <div className="space-y-3">
        {sortedEnvs.map((env) => (
          <EnvironmentCard
            key={env.environment}
            env={env}
            healthResults={healthResults}
            onRefresh={fetchAll}
          />
        ))}
      </div>

      {/* Deployment History */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">Deployment History</h3>
          <span className="text-xs text-zinc-500 ml-auto">{deployments.length} deployments</span>
        </div>

        {deployments.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No deployments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-700/50">
                  <th className="text-left py-2 pr-3 font-medium">Service</th>
                  <th className="text-left py-2 pr-3 font-medium">Version</th>
                  <th className="text-left py-2 pr-3 font-medium">Environment</th>
                  <th className="text-left py-2 pr-3 font-medium">Status</th>
                  <th className="text-left py-2 pr-3 font-medium">Deployed By</th>
                  <th className="text-left py-2 pr-3 font-medium">Time</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.slice(0, 20).map((d) => {
                  const badge = deployStatusBadge(d.status);
                  const isActive = d.status === "PENDING" || d.status === "BUILDING" || d.status === "DEPLOYING";
                  return (
                    <tr key={d.deploymentId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Server size={12} className="text-zinc-500" />
                          <span className="text-zinc-200">{d.service}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-zinc-300 font-mono">{d.version}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ENV_BADGE[d.environment]}`}>
                          {d.environment}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                          {isActive && <Loader2 size={10} className="animate-spin" />}
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-zinc-400">{d.deployedBy}</td>
                      <td className="py-2 pr-3 text-zinc-500">{timeAgo(d.startedAt)}</td>
                      <td className="py-2 text-right">
                        {d.status === "DEPLOYED" && (
                          <button
                            onClick={() => handleRollback(d.deploymentId)}
                            disabled={rollingBack === d.deploymentId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 transition-colors disabled:opacity-50"
                          >
                            {rollingBack === d.deploymentId ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <RotateCcw size={10} />
                            )}
                            Rollback
                          </button>
                        )}
                        {d.error && (
                          <span className="text-red-400 ml-2" title={d.error}>
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backup Management */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-zinc-400" />
            <h3 className="text-sm font-medium text-zinc-200">Backup Management</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBackup("incremental")}
              disabled={backingUp}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors disabled:opacity-50"
            >
              {backingUp ? <Loader2 size={12} className="animate-spin" /> : <ArrowDownToLine size={12} />}
              Incremental
            </button>
            <button
              onClick={() => handleBackup("full")}
              disabled={backingUp}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/30 transition-colors disabled:opacity-50"
            >
              {backingUp ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              Full Backup
            </button>
          </div>
        </div>

        {backups.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-3">No backups recorded.</p>
        ) : (
          <div className="space-y-1.5">
            {backups.slice(0, 10).map((b) => {
              const badge = backupStatusBadge(b.status);
              return (
                <div
                  key={b.backupId}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                      {b.status}
                    </span>
                    <span className="text-zinc-300 capitalize">{b.type}</span>
                    <span className="text-zinc-500">{b.size}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    {b.restoredAt && (
                      <span className="text-yellow-400">Restored {timeAgo(b.restoredAt)}</span>
                    )}
                    <span>{timeAgo(b.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* System Config */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowConfig(!showConfig)}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-zinc-400" />
            <h3 className="text-sm font-medium text-zinc-200">System Configuration</h3>
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              sanitized
            </span>
          </div>
          {showConfig ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
        </div>

        {showConfig && (
          <div className="mt-3 space-y-1">
            {Object.entries(systemConfig).map(([key, value]) => (
              <div key={key} className="flex items-center text-xs py-1 px-2 rounded hover:bg-zinc-800/50">
                <span className="text-zinc-400 font-mono w-64 shrink-0">{key}</span>
                <span className="text-zinc-300 font-mono truncate">
                  {value ?? <span className="text-zinc-600 italic">not set</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
