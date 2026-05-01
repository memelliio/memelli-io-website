'use client';

import { memo } from 'react';
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
} from 'lucide-react';

interface SystemManagerStatus {
  managerStatus: 'idle' | 'executing' | 'monitoring' | 'repairing';
  upSince: string;
  commandsProcessed: number;
  activeCommands: number;
  activeAgents: number;
  totalAgents: number;
  activePipelines: number;
  activeRepairs: number;
  health: 'healthy' | 'degraded' | 'critical';
  alerts: number;
  services: {
    name: string;
    status: 'live' | 'deploying' | 'down' | 'unknown';
  }[];
  recentActivity: {
    action: string;
    timestamp: string;
    status: 'success' | 'running' | 'failed';
  }[];
}

const STATUS_DOT: Record<SystemManagerStatus['managerStatus'], string> = {
  idle: 'bg-emerald-400',
  executing: 'bg-amber-400 animate-pulse',
  monitoring: 'bg-red-400 animate-pulse',
  repairing: 'bg-red-400 animate-pulse',
};

const STATUS_LABEL: Record<SystemManagerStatus['managerStatus'], string> = {
  idle: 'Idle',
  executing: 'Executing',
  monitoring: 'Monitoring',
  repairing: 'Repairing',
};

const SERVICE_DOT: Record<string, string> = {
  live: 'bg-emerald-400',
  deploying: 'bg-amber-400 animate-pulse',
  down: 'bg-red-500',
  unknown: 'bg-zinc-500',
};

const SERVICE_ICON: Record<string, typeof Server> = {
  API: Radio,
  Frontend: Zap,
  Workers: Cpu,
  Database: Database,
};

const ACTIVITY_ICON: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  running: { icon: Loader2, color: 'text-amber-400' },
  failed: { icon: AlertTriangle, color: 'text-red-400' },
};

const HEALTH_STYLE: Record<SystemManagerStatus['health'], { color: string; label: string }> = {
  healthy: { color: 'text-emerald-400', label: 'Healthy' },
  degraded: { color: 'text-amber-400', label: 'Degraded' },
  critical: { color: 'text-red-400', label: 'Critical' },
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  } catch {
    return ts;
  }
}

function MUASystemManager({ status }: { status: SystemManagerStatus }) {
  const healthStyle = HEALTH_STYLE[status.health];

  return (
    <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl p-3 max-w-[300px] w-full animate-[mua-fade_0.2s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-red-400" />
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wide">
            System Manager
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status.managerStatus]}`} />
          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
            {STATUS_LABEL[status.managerStatus]}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Left: Services */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
            Services
          </span>
          {status.services.map((svc) => {
            const Icon = SERVICE_ICON[svc.name] || Activity;
            return (
              <div key={svc.name} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${SERVICE_DOT[svc.status] || SERVICE_DOT.unknown}`} />
                <Icon className="h-2.5 w-2.5 text-zinc-500" />
                <span className="text-[10px] text-zinc-400 truncate">{svc.name}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Metrics */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
            Metrics
          </span>
          <div className="flex items-center gap-1.5">
            <Zap className="h-2.5 w-2.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-400">
              {status.commandsProcessed.toLocaleString()} cmds
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-2.5 w-2.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-400">
              {status.activeAgents}/{status.totalAgents} agents
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className={`h-2.5 w-2.5 ${healthStyle.color}`} />
            <span className={`text-[10px] font-medium ${healthStyle.color}`}>
              {healthStyle.label}
            </span>
          </div>
          {status.alerts > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
              <span className="text-[10px] text-red-400 font-medium">
                {status.alerts} alert{status.alerts !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compact stats bar */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mb-2">
        <div className="text-[9px] text-zinc-600">
          <span className="text-zinc-400 font-mono">{status.activeCommands}</span> active
        </div>
        <div className="text-[9px] text-zinc-600">
          <span className="text-zinc-400 font-mono">{status.activePipelines}</span> pipelines
        </div>
        <div className="text-[9px] text-zinc-600">
          <span className="text-zinc-400 font-mono">{status.activeRepairs}</span> repairs
        </div>
      </div>

      {/* Recent activity feed */}
      {status.recentActivity.length > 0 && (
        <div className="border-t border-white/[0.04] pt-2">
          <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5 block">
            Recent Activity
          </span>
          <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {status.recentActivity.slice(0, 5).map((item, i) => {
              const activityMeta = ACTIVITY_ICON[item.status] || ACTIVITY_ICON.running;
              const Icon = activityMeta.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <Icon
                    className={`h-2.5 w-2.5 shrink-0 ${activityMeta.color} ${
                      item.status === 'running' ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-zinc-400 truncate flex-1">{item.action}</span>
                  <span className="text-zinc-600 shrink-0 font-mono text-[9px]">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MUASystemManager);
