"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CircleDot,
  Clock,
  Cpu,
  Heart,
  Pause,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  Shield,
  Skull,
  Zap,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HealthState = "healthy" | "warning" | "degraded" | "critical";
type AgentStatus =
  | "idle"
  | "active"
  | "running"
  | "waiting"
  | "queued"
  | "paused"
  | "degraded"
  | "failed"
  | "restarting"
  | "terminated";

type AgentGroup =
  | "OS_CORE"
  | "REPORTS"
  | "VIEWS"
  | "COMPARISONS"
  | "SCRAPING"
  | "WORKFLOWS"
  | "COMMUNICATIONS"
  | "FINANCE"
  | "FUNDING"
  | "CREDIT"
  | "AIRBNB"
  | "AFFILIATES"
  | "MONITORING"
  | "SEARCH"
  | "NOTIFICATIONS";

interface AgentEntry {
  id: string;
  agentKey: string;
  agentType: "core" | "domain" | "swarm";
  agentClass: string;
  group: AgentGroup;
  moduleKey: string;
  status: AgentStatus;
  priority: number;
  capabilities: string[];
  healthState: HealthState;
  lastHeartbeatAt: string | null;
}

interface RegistrySummary {
  totalAgents: number;
  byType: Record<string, number>;
  byStatus: Record<AgentStatus, number>;
  byGroup: Partial<Record<AgentGroup, number>>;
  byHealth: Record<HealthState, number>;
}

interface HealthSummary {
  totalAgents: number;
  healthy: number;
  warning: number;
  degraded: number;
  critical: number;
  agentsRestarted: number;
  alertsEmitted: number;
  lastCheckAt: string;
}

interface SpawnHistoryEntry {
  id: string;
  action: "spawn" | "terminate";
  agentKey: string;
  agentClass: string;
  group: AgentGroup;
  trigger: string;
  reason: string;
  timestamp: string;
}

interface PoolMetrics {
  totalPools: number;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  errorAgents: number;
  queuedTasks: number;
  utilizationPct: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_GROUPS: AgentGroup[] = [
  "OS_CORE",
  "REPORTS",
  "VIEWS",
  "COMPARISONS",
  "SCRAPING",
  "WORKFLOWS",
  "COMMUNICATIONS",
  "FINANCE",
  "FUNDING",
  "CREDIT",
  "AIRBNB",
  "AFFILIATES",
  "MONITORING",
  "SEARCH",
  "NOTIFICATIONS",
];

const GROUP_LABELS: Record<AgentGroup, string> = {
  OS_CORE: "OS Core",
  REPORTS: "Reports",
  VIEWS: "Views",
  COMPARISONS: "Comparisons",
  SCRAPING: "Scraping",
  WORKFLOWS: "Workflows",
  COMMUNICATIONS: "Comms",
  FINANCE: "Finance",
  FUNDING: "Funding",
  CREDIT: "Credit",
  AIRBNB: "Airbnb",
  AFFILIATES: "Affiliates",
  MONITORING: "Monitoring",
  SEARCH: "Search",
  NOTIFICATIONS: "Notifications",
};

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "bg-zinc-500",
  active: "bg-green-500",
  running: "bg-blue-500",
  waiting: "bg-yellow-500",
  queued: "bg-cyan-500",
  paused: "bg-orange-400",
  degraded: "bg-amber-500",
  failed: "bg-red-500",
  restarting: "bg-red-500",
  terminated: "bg-zinc-700",
};

const HEALTH_COLORS: Record<HealthState, string> = {
  healthy: "text-green-400",
  warning: "text-yellow-400",
  degraded: "text-amber-400",
  critical: "text-red-400",
};

const HEALTH_BG: Record<HealthState, string> = {
  healthy: "bg-green-500/10 border-green-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/20",
  degraded: "bg-amber-500/10 border-amber-500/20",
  critical: "bg-red-500/10 border-red-500/20",
};

const REFRESH_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentControlCenter() {
  const api = useApi();

  const [summary, setSummary] = useState<RegistrySummary | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [spawnHistory, setSpawnHistory] = useState<SpawnHistoryEntry[]>([]);
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AgentGroup | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Data Fetching ───────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, healthRes, agentsRes, historyRes, poolRes] =
        await Promise.allSettled([
          api.get<{ data: RegistrySummary }>(
            "/api/admin/agent-orchestration/registry/summary",
          ),
          api.get<{ data: HealthSummary }>(
            "/api/admin/agent-orchestration/health/summary",
          ),
          api.get<{ data: { agents: AgentEntry[] } }>(
            "/api/admin/agent-orchestration/registry/agents",
          ),
          api.get<{ data: { entries: SpawnHistoryEntry[] } }>(
            "/api/admin/agent-orchestration/spawn/history",
          ),
          api.get<{ data: PoolMetrics }>("/api/admin/agent-pools/metrics"),
        ]);

      if (summaryRes.status === "fulfilled" && summaryRes.value.data) {
        setSummary(
          (summaryRes.value.data as any).data ?? summaryRes.value.data,
        );
      }
      if (healthRes.status === "fulfilled" && healthRes.value.data) {
        setHealthSummary(
          (healthRes.value.data as any).data ?? healthRes.value.data,
        );
      }
      if (agentsRes.status === "fulfilled" && agentsRes.value.data) {
        const d = (agentsRes.value.data as any).data ?? agentsRes.value.data;
        setAgents(d.agents ?? []);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.data) {
        const d = (historyRes.value.data as any).data ?? historyRes.value.data;
        setSpawnHistory((d.entries ?? []).slice(0, 20));
      }
      if (poolRes.status === "fulfilled" && poolRes.value.data) {
        setPoolMetrics(
          (poolRes.value.data as any).data ?? poolRes.value.data,
        );
      }
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Agent Actions ───────────────────────────────────────────────────────

  const agentAction = async (
    agentKey: string,
    action: "start" | "pause" | "resume" | "restart" | "terminate",
  ) => {
    setActionLoading(agentKey);
    try {
      await api.post("/api/admin/agent-orchestration/registry/action", {
        agentKey,
        action,
      });
      await fetchData();
    } catch {
      // best-effort
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered Agents ─────────────────────────────────────────────────────

  const filteredAgents =
    selectedGroup === "ALL"
      ? agents
      : agents.filter((a) => a.group === selectedGroup);

  // ── Stats ───────────────────────────────────────────────────────────────

  const totalAgents = summary?.totalAgents ?? 0;
  const activeAgents = (summary?.byStatus?.active ?? 0) + (summary?.byStatus?.running ?? 0);
  const idleAgents = summary?.byStatus?.idle ?? 0;
  const failedAgents = summary?.byStatus?.failed ?? 0;
  const queuePressure = poolMetrics?.queuedTasks ?? 0;

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading Agent Control Center...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          label="Total Agents"
          value={totalAgents}
          icon={<Bot className="h-4 w-4 text-zinc-400" />}
        />
        <StatCard
          label="Active"
          value={activeAgents}
          icon={<Zap className="h-4 w-4 text-green-400" />}
          accent="text-green-400"
        />
        <StatCard
          label="Idle"
          value={idleAgents}
          icon={<CircleDot className="h-4 w-4 text-zinc-400" />}
        />
        <StatCard
          label="Failed"
          value={failedAgents}
          icon={<Skull className="h-4 w-4 text-red-400" />}
          accent={failedAgents > 0 ? "text-red-400" : undefined}
        />
        <StatCard
          label="Queue Pressure"
          value={queuePressure}
          icon={<Activity className="h-4 w-4 text-yellow-400" />}
          accent={queuePressure > 10 ? "text-yellow-400" : undefined}
        />
      </div>

      {/* ── Health Panel ──────────────────────────────────────────────── */}
      {healthSummary && (
        <div className="grid grid-cols-4 gap-3">
          {(["healthy", "warning", "degraded", "critical"] as HealthState[]).map(
            (state) => (
              <div
                key={state}
                className={`rounded-lg border px-3 py-2 ${HEALTH_BG[state]}`}
              >
                <div className="flex items-center gap-2">
                  <Heart className={`h-3.5 w-3.5 ${HEALTH_COLORS[state]}`} />
                  <span className={`text-xs font-medium capitalize ${HEALTH_COLORS[state]}`}>
                    {state}
                  </span>
                </div>
                <div className={`text-lg font-bold mt-1 ${HEALTH_COLORS[state]}`}>
                  {healthSummary[state]}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* ── Group Tabs ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <GroupTab
          label="All"
          active={selectedGroup === "ALL"}
          count={totalAgents}
          onClick={() => setSelectedGroup("ALL")}
        />
        {ALL_GROUPS.map((group) => {
          const count = summary?.byGroup?.[group] ?? 0;
          if (count === 0 && selectedGroup !== group) return null;
          return (
            <GroupTab
              key={group}
              label={GROUP_LABELS[group]}
              active={selectedGroup === group}
              count={count}
              onClick={() => setSelectedGroup(group)}
            />
          );
        })}
      </div>

      {/* ── Agent Grid ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
            {selectedGroup !== "ALL" ? ` in ${GROUP_LABELS[selectedGroup]}` : ""}
          </span>
          <button
            onClick={fetchData}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-zinc-600">
            No agents registered in this group
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
            {filteredAgents.slice(0, 100).map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                isActionLoading={actionLoading === agent.agentKey}
                onAction={(action) => agentAction(agent.agentKey, action)}
              />
            ))}
            {filteredAgents.length > 100 && (
              <div className="px-3 py-2 text-center text-xs text-zinc-600">
                Showing 100 of {filteredAgents.length} agents
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Queue Pressure Visualization ──────────────────────────────── */}
      {poolMetrics && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">
              Pool Utilization
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                {poolMetrics.activeAgents} active / {poolMetrics.totalAgents} total
              </span>
              <span>{poolMetrics.utilizationPct}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  poolMetrics.utilizationPct > 80
                    ? "bg-red-500"
                    : poolMetrics.utilizationPct > 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(poolMetrics.utilizationPct, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500 mt-2">
              <div>
                <span className="text-zinc-600">Pools:</span>{" "}
                {poolMetrics.totalPools}
              </div>
              <div>
                <span className="text-zinc-600">Idle:</span>{" "}
                {poolMetrics.idleAgents}
              </div>
              <div>
                <span className="text-zinc-600">Errors:</span>{" "}
                <span className={poolMetrics.errorAgents > 0 ? "text-red-400" : ""}>
                  {poolMetrics.errorAgents}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Spawn Activity Feed ───────────────────────────────────────── */}
      {spawnHistory.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-xs font-medium text-zinc-400">
              Recent Spawn Activity
            </span>
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-[200px] overflow-y-auto">
            {spawnHistory.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-1.5 flex items-center gap-2 text-xs"
              >
                {entry.action === "spawn" ? (
                  <Play className="h-3 w-3 text-green-400 shrink-0" />
                ) : (
                  <Power className="h-3 w-3 text-red-400 shrink-0" />
                )}
                <span
                  className={
                    entry.action === "spawn" ? "text-green-400" : "text-red-400"
                  }
                >
                  {entry.action === "spawn" ? "Spawned" : "Terminated"}
                </span>
                <span className="text-zinc-400 truncate">{entry.agentClass}</span>
                <span className="text-zinc-600 shrink-0">
                  {GROUP_LABELS[entry.group] ?? entry.group}
                </span>
                <span className="text-zinc-700 ml-auto shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold ${accent ?? "text-zinc-200"}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function GroupTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-700 text-white"
          : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {label}
      <span className="ml-1 text-zinc-600">{count}</span>
    </button>
  );
}

function AgentRow({
  agent,
  isActionLoading,
  onAction,
}: {
  agent: AgentEntry;
  isActionLoading: boolean;
  onAction: (action: "start" | "pause" | "resume" | "restart" | "terminate") => void;
}) {
  return (
    <div className="px-3 py-1.5 flex items-center gap-3 hover:bg-zinc-900/50 transition-colors">
      {/* Status dot */}
      <div
        className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[agent.status]}`}
        title={agent.status}
      />

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-300 font-mono truncate">
            {agent.agentKey}
          </span>
          <span className="text-[10px] text-zinc-600 shrink-0">{agent.agentType}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-zinc-600">{agent.agentClass}</span>
          {agent.capabilities.length > 0 && (
            <span className="text-[10px] text-zinc-700 truncate">
              {agent.capabilities.slice(0, 3).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Health state */}
      <div className={`shrink-0 ${HEALTH_COLORS[agent.healthState]}`}>
        {agent.healthState === "healthy" ? (
          <Shield className="h-3.5 w-3.5" />
        ) : agent.healthState === "critical" ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <Heart className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Status label */}
      <span
        className={`text-[10px] font-medium shrink-0 capitalize ${
          agent.status === "failed"
            ? "text-red-400"
            : agent.status === "active" || agent.status === "running"
              ? "text-green-400"
              : "text-zinc-500"
        }`}
      >
        {agent.status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isActionLoading ? (
          <RefreshCw className="h-3 w-3 text-zinc-600 animate-spin" />
        ) : (
          <>
            {(agent.status === "idle" || agent.status === "paused") && (
              <ActionBtn
                icon={<Play className="h-3 w-3" />}
                title="Start"
                onClick={() => onAction("start")}
              />
            )}
            {(agent.status === "active" || agent.status === "running") && (
              <ActionBtn
                icon={<Pause className="h-3 w-3" />}
                title="Pause"
                onClick={() => onAction("pause")}
              />
            )}
            {agent.status === "paused" && (
              <ActionBtn
                icon={<Play className="h-3 w-3" />}
                title="Resume"
                onClick={() => onAction("resume")}
              />
            )}
            {(agent.status === "failed" || agent.status === "degraded") && (
              <ActionBtn
                icon={<RotateCcw className="h-3 w-3" />}
                title="Restart"
                onClick={() => onAction("restart")}
              />
            )}
            {agent.status !== "terminated" && (
              <ActionBtn
                icon={<Power className="h-3 w-3" />}
                title="Terminate"
                onClick={() => onAction("terminate")}
                danger
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors ${
        danger
          ? "text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
          : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {icon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
