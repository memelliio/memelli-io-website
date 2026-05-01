"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  Gauge,
  Globe,
  Layers,
  Link2,
  Lock,
  Monitor,
  Network,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/admin/interconnections${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include"
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HealthStatus = "healthy" | "degraded" | "failed" | "offline";

interface ConnectionHealth {
  from: string;
  to: string;
  status: "healthy" | "degraded" | "failed";
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

interface SystemMetrics {
  uptime: number;
  requestsPerMin: number;
  errorRate: number;
  avgLatencyMs: number;
}

interface SystemHealth {
  system: string;
  zone: string;
  status: HealthStatus;
  connections: ConnectionHealth[];
  metrics: SystemMetrics;
}

interface ZoneInfo {
  status: HealthStatus;
  systemCount: number;
}

interface FullMap {
  systems: SystemHealth[];
  zones: Record<string, ZoneInfo>;
  connections: ConnectionHealth[];
  timestamp: string;
}

interface ForbiddenPatternResult {
  total: number;
  violations: number;
  clean: boolean;
  patterns: Array<{ name: string; description: string; detected: boolean }>;
  timestamp: string;
}

interface InterconnectionMetrics {
  totalSystems: number;
  healthySystems: number;
  degradedSystems: number;
  failedSystems: number;
  offlineSystems: number;
  totalConnections: number;
  healthyConnections: number;
  avgHandoffLatencyMs: number;
  eventBusThroughput: number;
  commandSuccessRate: number;
  timestamp: string;
}

interface MetricsResponse {
  current: InterconnectionMetrics;
  history: InterconnectionMetrics[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZONE_ORDER = [
  "EXPERIENCE",
  "ORCHESTRATION",
  "EXECUTION",
  "TRUTH",
  "SIGNAL",
  "GOVERNANCE",
] as const;

const ZONE_LABELS: Record<string, string> = {
  EXPERIENCE: "Experience",
  ORCHESTRATION: "Orchestration",
  EXECUTION: "Execution",
  TRUTH: "Truth",
  SIGNAL: "Signal",
  GOVERNANCE: "Governance"
};

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  EXPERIENCE: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
  ORCHESTRATION: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  EXECUTION: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
  TRUTH: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
  SIGNAL: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", badge: "bg-cyan-500/20 text-cyan-300" },
  GOVERNANCE: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300" }
};

const SYSTEM_LABELS: Record<string, string> = {
  UNISCREEN: "UniScreen",
  WORKSPACES: "Workspaces",
  INSIGHTS: "Insights",
  MUA: "MUA",
  COMMAND_LAYER: "Command Layer",
  OMNIFLOW: "OmniFlow",
  AGENT_INTELLIGENCE: "Agent Intelligence",
  TASK_GRID: "Task Grid",
  AI_MEMORY: "AI Memory",
  DECISION_INTELLIGENCE: "Decision Intelligence",
  DATA_FABRIC: "Data Fabric",
  EVENT_BUS: "Event Bus",
  NOTIFICATIONS: "Notifications",
  IDENTITY_ACCESS: "Identity & Access",
  INTEGRATION_GATEWAY: "Integration Gateway",
  OBSERVABILITY: "Observability",
  DEPLOYMENT_CONTROL: "Deployment Control",
  SECURITY: "Security"
};

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  UNISCREEN: <Monitor className="w-4 h-4" />,
  WORKSPACES: <Layers className="w-4 h-4" />,
  INSIGHTS: <Eye className="w-4 h-4" />,
  MUA: <Sparkles className="w-4 h-4" />,
  COMMAND_LAYER: <Cpu className="w-4 h-4" />,
  OMNIFLOW: <Network className="w-4 h-4" />,
  AGENT_INTELLIGENCE: <Zap className="w-4 h-4" />,
  TASK_GRID: <Server className="w-4 h-4" />,
  AI_MEMORY: <Database className="w-4 h-4" />,
  DECISION_INTELLIGENCE: <Gauge className="w-4 h-4" />,
  DATA_FABRIC: <Database className="w-4 h-4" />,
  EVENT_BUS: <Activity className="w-4 h-4" />,
  NOTIFICATIONS: <Globe className="w-4 h-4" />,
  IDENTITY_ACCESS: <Lock className="w-4 h-4" />,
  INTEGRATION_GATEWAY: <Link2 className="w-4 h-4" />,
  OBSERVABILITY: <Eye className="w-4 h-4" />,
  DEPLOYMENT_CONTROL: <Server className="w-4 h-4" />,
  SECURITY: <Shield className="w-4 h-4" />
};

const RUNTIME_FLOW = [
  "MUA",
  "COMMAND_LAYER",
  "IDENTITY_ACCESS",
  "OMNIFLOW",
  "TASK_GRID",
  "AGENT_INTELLIGENCE",
  "DATA_FABRIC",
  "EVENT_BUS",
  "NOTIFICATIONS",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: HealthStatus | string): string {
  switch (status) {
    case "healthy": return "text-emerald-400";
    case "degraded": return "text-amber-400";
    case "failed": return "text-red-400";
    case "offline": return "text-zinc-500";
    default: return "text-zinc-500";
  }
}

function statusDot(status: HealthStatus | string): string {
  switch (status) {
    case "healthy": return "bg-emerald-400";
    case "degraded": return "bg-amber-400";
    case "failed": return "bg-red-400";
    case "offline": return "bg-zinc-500";
    default: return "bg-zinc-500";
  }
}

function StatusIcon({ status }: { status: HealthStatus | string }) {
  switch (status) {
    case "healthy": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case "degraded": return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
    case "offline": return <XCircle className="w-4 h-4 text-zinc-500" />;
    default: return <XCircle className="w-4 h-4 text-zinc-500" />;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ZoneSummaryBar({ zones }: { zones: Record<string, ZoneInfo> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {ZONE_ORDER.map((zone) => {
        const info = zones[zone];
        if (!info) return null;
        const colors = ZONE_COLORS[zone];
        return (
          <div
            key={zone}
            className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                {ZONE_LABELS[zone]}
              </span>
              <StatusIcon status={info.status} />
            </div>
            <div className="text-xs text-zinc-400">
              {info.systemCount} system{info.systemCount !== 1 ? "s" : ""}
            </div>
            <div className={`text-xs mt-1 capitalize ${statusColor(info.status)}`}>
              {info.status}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SystemCard({
  system,
  selected,
  onClick
}: {
  system: SystemHealth;
  selected: boolean;
  onClick: () => void;
}) {
  const colors = ZONE_COLORS[system.zone] || ZONE_COLORS.GOVERNANCE;
  const healthyConns = system.connections.filter((c) => c.status === "healthy").length;
  const totalConns = system.connections.length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-all ${
        selected
          ? `ring-2 ring-white/20 ${colors.bg} ${colors.border}`
          : `bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600`
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={colors.text}>{SYSTEM_ICONS[system.system]}</span>
        <span className="text-sm font-medium text-zinc-200 truncate">
          {SYSTEM_LABELS[system.system] || system.system}
        </span>
        <span className={`ml-auto w-2 h-2 rounded-full ${statusDot(system.status)}`} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
        <span className={colors.badge + " px-1.5 py-0.5 rounded text-[10px] font-medium"}>
          {ZONE_LABELS[system.zone]}
        </span>
        <span>
          {healthyConns}/{totalConns} links
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
        {system.metrics.errorRate > 0 && (
          <span className="text-red-400">{system.metrics.errorRate.toFixed(1)}% err</span>
        )}
        {system.metrics.avgLatencyMs > 0 && (
          <span>{system.metrics.avgLatencyMs}ms</span>
        )}
      </div>
    </button>
  );
}

function ConnectionDetailPanel({ system }: { system: SystemHealth }) {
  const colors = ZONE_COLORS[system.zone] || ZONE_COLORS.GOVERNANCE;

  return (
    <div className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={colors.text}>{SYSTEM_ICONS[system.system]}</span>
        <h3 className="text-sm font-semibold text-zinc-200">
          {SYSTEM_LABELS[system.system] || system.system}
        </h3>
        <StatusIcon status={system.status} />
        <span className={`text-xs capitalize ${statusColor(system.status)}`}>
          {system.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-[10px] text-zinc-500 uppercase">Uptime</div>
          <div className="text-sm text-zinc-200 font-mono">
            {Math.floor(system.metrics.uptime / 3600)}h {Math.floor((system.metrics.uptime % 3600) / 60)}m
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-[10px] text-zinc-500 uppercase">Req/min</div>
          <div className="text-sm text-zinc-200 font-mono">{system.metrics.requestsPerMin}</div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-[10px] text-zinc-500 uppercase">Error Rate</div>
          <div className={`text-sm font-mono ${system.metrics.errorRate > 5 ? "text-red-400" : "text-zinc-200"}`}>
            {system.metrics.errorRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-[10px] text-zinc-500 uppercase">Avg Latency</div>
          <div className={`text-sm font-mono ${system.metrics.avgLatencyMs > 200 ? "text-amber-400" : "text-zinc-200"}`}>
            {system.metrics.avgLatencyMs}ms
          </div>
        </div>
      </div>

      {/* Connections */}
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
        Connections ({system.connections.length})
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {system.connections.map((conn) => (
          <div
            key={`${conn.from}-${conn.to}`}
            className="flex items-center gap-2 py-1.5 px-2 rounded bg-zinc-800/30"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(conn.status)}`} />
            <ArrowRight className="w-3 h-3 text-zinc-600" />
            <span className="text-xs text-zinc-300">
              {SYSTEM_LABELS[conn.to] || conn.to}
            </span>
            <span className={`ml-auto text-[10px] capitalize ${statusColor(conn.status)}`}>
              {conn.status}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono w-12 text-right">
              {conn.latencyMs}ms
            </span>
            {conn.error && (
              <span className="text-[10px] text-red-400 truncate max-w-[120px]" title={conn.error}>
                {conn.error}
              </span>
            )}
          </div>
        ))}
        {system.connections.length === 0 && (
          <div className="text-xs text-zinc-500 py-2">No connections defined</div>
        )}
      </div>
    </div>
  );
}

function ForbiddenPatternsPanel({
  patterns,
  loading
}: {
  patterns: ForbiddenPatternResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-700/50 p-4 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <LoadingGlobe size="sm" />
          Checking for violations...
        </div>
      </div>
    );
  }

  if (!patterns) return null;

  const violations = patterns.patterns.filter((p) => p.detected);

  return (
    <div
      className={`rounded-lg border p-4 ${
        violations.length > 0
          ? "border-red-500/30 bg-red-500/5"
          : "border-emerald-500/30 bg-emerald-500/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className={`w-4 h-4 ${violations.length > 0 ? "text-red-400" : "text-emerald-400"}`} />
        <span className="text-sm font-semibold text-zinc-200">
          Forbidden Patterns
        </span>
        {violations.length > 0 ? (
          <span className="ml-auto text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
            {violations.length} violation{violations.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
            Clean
          </span>
        )}
      </div>
      <div className="space-y-2">
        {patterns.patterns.map((p) => (
          <div
            key={p.name}
            className={`flex items-start gap-2 py-1.5 px-2 rounded text-xs ${
              p.detected ? "bg-red-500/10" : "bg-zinc-800/30"
            }`}
          >
            {p.detected ? (
              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            )}
            <div>
              <div className={`font-medium ${p.detected ? "text-red-300" : "text-zinc-300"}`}>
                {p.name.replace(/_/g, " ")}
              </div>
              <div className="text-zinc-500 mt-0.5">{p.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrossSystemMetrics({
  metrics,
  loading
}: {
  metrics: MetricsResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-700/50 p-4 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <LoadingGlobe size="sm" />
          Loading metrics...
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const m = metrics.current;

  return (
    <div className="rounded-lg border border-zinc-700/50 p-4 bg-zinc-900/50">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-zinc-200">Cross-System Metrics</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-[10px] text-zinc-500 uppercase">Handoff Latency</div>
          <div className={`text-lg font-mono font-semibold ${m.avgHandoffLatencyMs > 200 ? "text-amber-400" : "text-zinc-200"}`}>
            {m.avgHandoffLatencyMs}
            <span className="text-xs text-zinc-500 ml-1">ms</span>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-[10px] text-zinc-500 uppercase">Event Bus Throughput</div>
          <div className="text-lg font-mono font-semibold text-zinc-200">
            {m.eventBusThroughput.toLocaleString()}
            <span className="text-xs text-zinc-500 ml-1">events</span>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-[10px] text-zinc-500 uppercase">Command Success</div>
          <div className={`text-lg font-mono font-semibold ${m.commandSuccessRate < 90 ? "text-red-400" : "text-emerald-400"}`}>
            {m.commandSuccessRate}
            <span className="text-xs text-zinc-500 ml-1">%</span>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-[10px] text-zinc-500 uppercase">Healthy Connections</div>
          <div className="text-lg font-mono font-semibold text-zinc-200">
            {m.healthyConnections}
            <span className="text-xs text-zinc-500 ml-1">/ {m.totalConnections}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuntimeFlowVisualization({ systems }: { systems: SystemHealth[] }) {
  const systemMap = new Map(systems.map((s) => [s.system, s]));

  return (
    <div className="rounded-lg border border-zinc-700/50 p-4 bg-zinc-900/50">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-zinc-200">Canonical Runtime Flow</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {RUNTIME_FLOW.map((sysKey, idx) => {
          const sys = systemMap.get(sysKey);
          const status = sys?.status || "offline";
          const colors = ZONE_COLORS[sys?.zone || "GOVERNANCE"];
          return (
            <div key={sysKey} className="flex items-center shrink-0">
              <div
                className={`rounded-md border px-3 py-2 ${colors.bg} ${colors.border} min-w-[100px]`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
                  <span className="text-[10px] font-medium text-zinc-300">
                    {SYSTEM_LABELS[sysKey] || sysKey}
                  </span>
                </div>
                <div className={`text-[10px] capitalize ${statusColor(status)}`}>{status}</div>
              </div>
              {idx < RUNTIME_FLOW.length - 1 && (
                <ChevronRight className="w-4 h-4 text-zinc-600 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-zinc-600 mt-2">
        User request traverses: MUA &rarr; Command &rarr; Identity &rarr; OmniFlow &rarr; TaskGrid &rarr; Agents &rarr; DataFabric &rarr; EventBus &rarr; Notifications
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function InterconnectionMap() {
  const [fullMap, setFullMap] = useState<FullMap | null>(null);
  const [patterns, setPatterns] = useState<ForbiddenPatternResult | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [mapData, patternData, metricData] = await Promise.all([
        apiFetch<FullMap>("/health"),
        apiFetch<ForbiddenPatternResult>("/forbidden-patterns"),
        apiFetch<MetricsResponse>("/metrics"),
      ]);
      setFullMap(mapData);
      setPatterns(patternData);
      setMetrics(metricData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interconnection data");
    } finally {
      setLoading(false);
      setPatternsLoading(false);
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    intervalRef.current = setInterval(() => void fetchAll(), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const selectedSystemData = fullMap?.systems.find((s) => s.system === selectedSystem) || null;

  // Group systems by zone
  const systemsByZone = new Map<string, SystemHealth[]>();
  if (fullMap) {
    for (const zone of ZONE_ORDER) {
      systemsByZone.set(zone, fullMap.systems.filter((s) => s.zone === zone));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <LoadingGlobe size="sm" />
        Loading interconnection map...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-sm text-red-400 mb-2">{error}</div>
          <button
            onClick={() => { setLoading(true); void fetchAll(); }}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!fullMap) return null;

  const totalHealthy = fullMap.systems.filter((s) => s.status === "healthy").length;
  const totalSystems = fullMap.systems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Interconnection Health Map
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {totalHealthy}/{totalSystems} systems healthy &middot; {fullMap.connections.length} connections &middot; Last updated {new Date(fullMap.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); void fetchAll(); }}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 px-3 py-1.5 rounded-md border border-zinc-700/50"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Zone Summary Bar */}
      <ZoneSummaryBar zones={fullMap.zones} />

      {/* Runtime Flow */}
      <RuntimeFlowVisualization systems={fullMap.systems} />

      {/* Main Grid: Systems by Zone + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Systems Grid — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {ZONE_ORDER.map((zone) => {
            const zoneSystems = systemsByZone.get(zone) || [];
            if (zoneSystems.length === 0) return null;
            const colors = ZONE_COLORS[zone];
            return (
              <div key={zone}>
                <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colors.text}`}>
                  {ZONE_LABELS[zone]} Zone
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zoneSystems.map((sys) => (
                    <SystemCard
                      key={sys.system}
                      system={sys}
                      selected={selectedSystem === sys.system}
                      onClick={() =>
                        setSelectedSystem(selectedSystem === sys.system ? null : sys.system)
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel — 1 column */}
        <div className="space-y-4">
          {selectedSystemData ? (
            <ConnectionDetailPanel system={selectedSystemData} />
          ) : (
            <div className="rounded-lg border border-zinc-700/50 p-6 bg-zinc-900/50 text-center">
              <Network className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <div className="text-xs text-zinc-500">
                Select a system to view its connections and metrics
              </div>
            </div>
          )}

          {/* Forbidden Patterns */}
          <ForbiddenPatternsPanel patterns={patterns} loading={patternsLoading} />
        </div>
      </div>

      {/* Cross-System Metrics */}
      <CrossSystemMetrics metrics={metrics} loading={metricsLoading} />
    </div>
  );
}
