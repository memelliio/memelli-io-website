'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { Activity, CheckCircle2, Zap, Shield, Rocket, AlertTriangle } from 'lucide-react';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface AgentPhase {
  id: string;
  label: string;
  icon: 'build' | 'check' | 'deploy' | 'alert';
  totalAgents: number;
  completedAgents: number;
  activeAgents: number;
  status: 'waiting' | 'active' | 'complete';
  tasks: string[];
}

export interface AgentProgressData {
  totalAgents: number;
  completedAgents: number;
  activeAgents: number;
  phases: AgentPhase[];
  startedAt: string;
  serviceNotice?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Animated Counter                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevRef.current = end;
  }, [value]);

  return <span className={className}>{display}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Phase Icon                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PhaseIcon({ type, active }: { type: AgentPhase['icon']; active: boolean }) {
  const cls = `h-3.5 w-3.5 ${active ? 'text-red-400' : 'text-zinc-600'}`;
  switch (type) {
    case 'build':  return <Zap className={cls} />;
    case 'check':  return <Shield className={cls} />;
    case 'deploy': return <Rocket className={cls} />;
    case 'alert':  return <AlertTriangle className={cls} />;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Progress Bar                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MUAAgentProgress({ data }: { data: AgentProgressData | null }) {
  if (!data || data.totalAgents === 0) return null;

  const allDone = data.completedAgents >= data.totalAgents;
  const elapsed = Math.round((Date.now() - new Date(data.startedAt).getTime()) / 1000);
  const elapsedStr = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div className="border-t border-white/[0.04] px-5 py-3 animate-[mua-fade_0.3s_ease-out]">
      {/* ── Header: Total agent count ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {allDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <LoadingGlobe size="sm" />
          )}
          <span className="text-[11px] font-semibold text-zinc-300">
            <AnimatedCount value={data.completedAgents} className="text-red-400 font-mono" />
            <span className="text-zinc-600 mx-0.5">/</span>
            <AnimatedCount value={data.totalAgents} className="text-zinc-400 font-mono" />
            <span className="text-zinc-500 ml-1.5">agents {allDone ? 'complete' : 'working'}</span>
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">{elapsedStr}</span>
      </div>

      {/* ── Overall progress bar ──────────────────────────────────────── */}
      <ProgressBar completed={data.completedAgents} total={data.totalAgents} />

      {/* ── Phases ────────────────────────────────────────────────────── */}
      <div className="mt-2.5 space-y-1.5">
        {data.phases.map((phase) => {
          const isActive = phase.status === 'active';
          const isDone = phase.status === 'complete';
          const phasePct = phase.totalAgents > 0
            ? Math.round((phase.completedAgents / phase.totalAgents) * 100)
            : 0;

          return (
            <div
              key={phase.id}
              className={`rounded-lg px-2.5 py-1.5 transition-all duration-300 ${
                isActive
                  ? 'bg-red-500/5 border border-red-500/20'
                  : isDone
                  ? 'bg-emerald-500/5 border border-emerald-500/10'
                  : 'bg-zinc-900/30 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PhaseIcon type={phase.icon} active={isActive} />
                  <span className={`text-[10px] font-medium ${
                    isActive ? 'text-zinc-200' : isDone ? 'text-emerald-400' : 'text-zinc-600'
                  }`}>
                    {phase.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isActive && phase.activeAgents > 0 && (
                    <span className="text-[9px] font-mono text-red-400 animate-pulse">
                      {phase.activeAgents} active
                    </span>
                  )}
                  <span className={`text-[9px] font-mono ${
                    isDone ? 'text-emerald-400' : 'text-zinc-600'
                  }`}>
                    {phase.completedAgents}/{phase.totalAgents}
                  </span>
                  {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                </div>
              </div>

              {/* Phase progress bar */}
              {(isActive || isDone) && (
                <div className="mt-1 h-0.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isDone ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              )}

              {/* Active task descriptions */}
              {isActive && phase.tasks.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {phase.tasks.slice(0, 3).map((task, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                      <Activity className="h-2 w-2 text-red-400/60 animate-pulse shrink-0" />
                      <span className="truncate">{task}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Service Notice ────────────────────────────────────────────── */}
      {data.serviceNotice && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 px-2.5 py-1.5">
          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
          <span className="text-[9px] text-amber-400/80">{data.serviceNotice}</span>
        </div>
      )}
    </div>
  );
}

export default memo(MUAAgentProgress);
