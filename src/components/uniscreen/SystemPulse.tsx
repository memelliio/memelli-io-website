"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, AlertTriangle, Cpu, Radio } from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface PulseData {
  activeAgents: number;
  totalPools: number;
  queuedTasks: number;
  recentCompletions: number;
  systemAlerts: number;
  utilizationPct: number;
}

interface AgentHealthResponse {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  totalPools: number;
  utilizationPct: number;
  queuedTasks: number;
}

export function SystemPulse() {
  const api = useApi();
  const [pulse, setPulse] = useState<PulseData>({
    activeAgents: 0,
    totalPools: 0,
    queuedTasks: 0,
    recentCompletions: 0,
    systemAlerts: 0,
    utilizationPct: 0,
  });
  const [isAlive, setIsAlive] = useState(true);

  // Poll agent health every 10 seconds
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get<AgentHealthResponse>("/api/ai/agent-health");
        if (cancelled) return;
        // Treat API-level errors (res.error) the same as network failures
        if (res.error || !res.data) {
          setIsAlive(false);
          return;
        }
        const d = res.data;
        setPulse((prev) => ({
          ...prev,
          activeAgents: d.activeAgents ?? 0,
          totalPools: d.totalPools ?? 0,
          queuedTasks: d.queuedTasks ?? 0,
          utilizationPct: d.utilizationPct ?? 0,
        }));
        setIsAlive(true);
      } catch {
        if (!cancelled) setIsAlive(false);
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [api]);

  return (
    <div className="flex items-center gap-4 h-7 px-3 bg-zinc-950 border-t border-zinc-800/50 text-[11px] text-zinc-500 select-none">
      {/* Pulse dot */}
      <div className="flex items-center gap-1.5">
        <div
          className={`h-1.5 w-1.5 rounded-full ${
            isAlive
              ? pulse.activeAgents > 0
                ? "bg-green-500 animate-pulse"
                : "bg-green-500/50"
              : "bg-red-500"
          }`}
        />
        <span className={isAlive ? "text-zinc-400" : "text-red-400"}>
          {isAlive ? "System Active" : "Offline"}
        </span>
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      {/* Active agents */}
      <div className="flex items-center gap-1" title="Active agents">
        <Cpu className="h-3 w-3" />
        <span>{pulse.activeAgents} agents</span>
      </div>

      {/* Pools */}
      <div className="flex items-center gap-1" title="Agent pools">
        <Radio className="h-3 w-3" />
        <span>{pulse.totalPools} pools</span>
      </div>

      {/* Utilization */}
      <div className="flex items-center gap-1" title="Utilization">
        <Activity className="h-3 w-3" />
        <span>{pulse.utilizationPct}%</span>
      </div>

      {/* Queued tasks */}
      {pulse.queuedTasks > 0 && (
        <div
          className="flex items-center gap-1 text-yellow-400"
          title="Queued tasks"
        >
          <Zap className="h-3 w-3" />
          <span>{pulse.queuedTasks} queued</span>
        </div>
      )}

      {/* Alerts */}
      {pulse.systemAlerts > 0 && (
        <div
          className="flex items-center gap-1 text-red-400"
          title="System alerts"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{pulse.systemAlerts} alerts</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Utilization bar */}
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pulse.utilizationPct > 80
                ? "bg-red-500"
                : pulse.utilizationPct > 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(100, pulse.utilizationPct)}%` }}
          />
        </div>
        <span className="text-zinc-600">{pulse.utilizationPct}%</span>
      </div>
    </div>
  );
}
