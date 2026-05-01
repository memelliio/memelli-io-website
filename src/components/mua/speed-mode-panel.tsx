'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  Gauge,
  Zap,
  Flame,
  Bug,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type SpeedModeName = 'CRUISE' | 'HUSTLE' | 'BLITZ' | 'SWARM';

interface SpeedModeConfig {
  name: SpeedModeName;
  maxAgents: number;
  maxLanes: number;
  maxConcurrent: number;
  estimatedDailyCost: string;
  color: string;
  emoji: string;
  description: string;
}

interface SpeedModeData {
  currentMode: SpeedModeName;
  currentConfig: SpeedModeConfig;
  allModes: Record<SpeedModeName, SpeedModeConfig>;
}

/* ================================================================== */
/*  Mode Visual Config                                                 */
/* ================================================================== */

const MODE_ICONS: Record<SpeedModeName, LucideIcon> = {
  CRUISE: Gauge,
  HUSTLE: Zap,
  BLITZ: Flame,
  SWARM: Bug,
};

const MODE_COLORS: Record<SpeedModeName, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
  btnBg: string;
  btnBorder: string;
  btnText: string;
  btnActive: string;
}> = {
  CRUISE: {
    bg: 'bg-emerald-500/[0.06]',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10',
    btnBg: 'bg-emerald-500/[0.06]',
    btnBorder: 'border-emerald-500/20',
    btnText: 'text-emerald-400',
    btnActive: 'bg-emerald-500/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10',
  },
  HUSTLE: {
    bg: 'bg-yellow-500/[0.06]',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    glow: 'shadow-yellow-500/10',
    btnBg: 'bg-yellow-500/[0.06]',
    btnBorder: 'border-yellow-500/20',
    btnText: 'text-yellow-400',
    btnActive: 'bg-yellow-500/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10',
  },
  BLITZ: {
    bg: 'bg-orange-500/[0.06]',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/10',
    btnBg: 'bg-orange-500/[0.06]',
    btnBorder: 'border-orange-500/20',
    btnText: 'text-orange-400',
    btnActive: 'bg-orange-500/20 border-orange-500/40 shadow-lg shadow-orange-500/10',
  },
  SWARM: {
    bg: 'bg-red-500/[0.06]',
    border: 'border-red-500/20',
    text: 'text-red-400',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/10',
    btnBg: 'bg-red-500/[0.06]',
    btnBorder: 'border-red-500/20',
    btnText: 'text-red-400',
    btnActive: 'bg-red-500/20 border-red-500/40 shadow-lg shadow-red-500/10',
  },
};

const MODE_ORDER: SpeedModeName[] = ['CRUISE', 'HUSTLE', 'BLITZ', 'SWARM'];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function SpeedModePanel() {
  const api = useApi();
  const [data, setData] = useState<SpeedModeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<SpeedModeName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMode = useCallback(async () => {
    const res = await api.get<SpeedModeData>('/api/admin/speed-mode');
    if (res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error ?? 'Failed to load speed mode');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchMode();
    const interval = setInterval(fetchMode, 15000);
    return () => clearInterval(interval);
  }, [fetchMode]);

  const switchMode = async (mode: SpeedModeName) => {
    if (switching || data?.currentMode === mode) return;
    setSwitching(mode);
    const res = await api.post<{ mode: SpeedModeName; config: SpeedModeConfig }>(
      '/api/admin/speed-mode',
      { mode }
    );
    if (res.data && data) {
      setData({
        ...data,
        currentMode: res.data.mode,
        currentConfig: res.data.config,
      });
    }
    setSwitching(null);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading speed mode...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl p-6">
        <p className="text-sm text-red-400">{error ?? 'Speed mode unavailable'}</p>
      </div>
    );
  }

  const current = data.currentMode;
  const config = data.currentConfig;
  const colors = MODE_COLORS[current];
  const CurrentIcon = MODE_ICONS[current];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-xl p-6 transition-all duration-300 ${colors.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} border ${colors.border}`}>
            <CurrentIcon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Speed Mode</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${colors.dot} animate-pulse`} />
              <span className={`text-xs font-medium ${colors.text}`}>{current}</span>
            </div>
          </div>
        </div>
        <div className={`text-xs font-mono ${colors.text} px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border}`}>
          {config.estimatedDailyCost}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Max Agents" value={config.maxAgents === 999 ? '200+' : String(config.maxAgents)} color={colors.text} />
        <StatCard label="Lanes" value={config.maxLanes === 99 ? 'ALL' : String(config.maxLanes)} color={colors.text} />
        <StatCard label="Concurrent" value={config.maxConcurrent === 999 ? 'No limit' : String(config.maxConcurrent)} color={colors.text} />
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{config.description}</p>

      {/* Mode Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {MODE_ORDER.map((mode) => {
          const modeColors = MODE_COLORS[mode];
          const ModeIcon = MODE_ICONS[mode];
          const isActive = current === mode;
          const isSwitching = switching === mode;

          return (
            <button
              key={mode}
              onClick={() => switchMode(mode)}
              disabled={!!switching}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? `${modeColors.btnActive} ${modeColors.btnText}`
                  : `border-white/[0.04] bg-zinc-900/40 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 hover:border-white/[0.08]`
              } ${switching && !isSwitching ? 'opacity-50' : ''}`}
            >
              {isSwitching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ModeIcon className={`h-4 w-4 ${isActive ? modeColors.btnText : ''}`} />
              )}
              <span>{mode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-zinc-900/40 px-3 py-2.5 text-center">
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">{label}</div>
    </div>
  );
}
