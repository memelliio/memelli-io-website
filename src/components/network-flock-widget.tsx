'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface LocationPing {
  id: string;
  online: boolean;
  latencyMs: number;
}

interface FlockStatus {
  flockActive: boolean;
  allOnline: boolean;
  locations: LocationPing[];
  locationsOnline: number;
  locationsTotal: number;
  agentsDeployed: number;
  nanoProtection: number;
  totalForce: number;
  revenueToday: number;
  conversationsSynced: number;
  timestamp: string;
}

/* ================================================================== */
/*  Color map                                                          */
/* ================================================================== */

const COLORS: Record<string, { dot: string; text: string; glow: string }> = {
  emerald: { dot: '#34d399', text: '#6ee7b7', glow: '0 0 8px #34d399' },
  cyan: { dot: '#22d3ee', text: '#67e8f9', glow: '0 0 8px #22d3ee' },
  amber: { dot: '#f59e0b', text: '#fcd34d', glow: '0 0 8px #f59e0b' },
  blue: { dot: '#3b82f6', text: '#93c5fd', glow: '0 0 8px #3b82f6' },
  violet: { dot: '#10b981', text: '#c4b5fd', glow: '0 0 8px #10b981' },
  red: { dot: '#ef4444', text: '#fca5a5', glow: '0 0 8px #ef4444' },
};

/* ================================================================== */
/*  Indicator Row                                                      */
/* ================================================================== */

function IndicatorRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  const c = COLORS[color] ?? COLORS.emerald;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tabular-nums" style={{ color: c.text }}>
          {value}
        </span>
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: c.dot, boxShadow: c.glow }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Blitz Dialog                                                       */
/* ================================================================== */

function BlitzDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (passcode: string) => void;
  loading: boolean;
}) {
  const [passcode, setPasscode] = useState('');

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-xl">
      <div className="bg-zinc-900 border border-red-500/40 rounded-lg p-4 w-[220px] space-y-3">
        <p className="text-xs font-bold text-red-400 uppercase tracking-wider text-center">
          911 SUPER BLITZ
        </p>
        <input
          type="password"
          placeholder="CEO Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500/60"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-xs px-2 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(passcode)}
            disabled={loading || !passcode}
            className="flex-1 text-xs px-2 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-500 disabled:opacity-40 transition-colors"
          >
            {loading ? 'FIRING...' : 'FIRE'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Network Flock Widget                                               */
/* ================================================================== */

export default function NetworkFlockWidget({ className }: { className?: string }) {
  const api = useApi();
  const [blitzOpen, setBlitzOpen] = useState(false);
  const [blitzLoading, setBlitzLoading] = useState(false);
  const [blitzResult, setBlitzResult] = useState<string | null>(null);
  const [revenueDisplay, setRevenueDisplay] = useState(0);

  const { data, isLoading, error } = useQuery<FlockStatus>({
    queryKey: ['network-flock-status'],
    queryFn: async () => {
      const res = await api.get<FlockStatus>('/api/admin/network-flock/status');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  // Animate revenue counter
  useEffect(() => {
    if (!data?.revenueToday) return;
    const target = data.revenueToday;
    if (revenueDisplay === target) return;

    const step = Math.max(1, Math.abs(target - revenueDisplay) / 20);
    const timer = setInterval(() => {
      setRevenueDisplay((prev) => {
        const next = prev + step;
        if (next >= target) {
          clearInterval(timer);
          return target;
        }
        return Math.round(next * 100) / 100;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [data?.revenueToday, revenueDisplay]);

  const handleBlitz = useCallback(
    async (passcode: string) => {
      setBlitzLoading(true);
      setBlitzResult(null);
      try {
        const res = await api.post<{ status: string }>('/api/admin/network-flock/blitz', {
          passcode,
          signature: 'MEL_CEO_2026',
        });
        if (res.error) {
          setBlitzResult(`FAILED: ${res.error}`);
        } else {
          setBlitzResult('DISPATCHED');
          setBlitzOpen(false);
        }
      } catch {
        setBlitzResult('NETWORK ERROR');
      } finally {
        setBlitzLoading(false);
      }
    },
    [api]
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

  const allOnline = data?.allOnline ?? false;
  const hasOffline = data && !data.allOnline;

  return (
    <div
      className={`relative rounded-xl border bg-zinc-950 overflow-hidden ${
        allOnline
          ? 'border-emerald-500/30 shadow-[0_0_24px_-4px_rgba(52,211,153,0.15)]'
          : hasOffline
            ? 'border-red-500/30'
            : 'border-zinc-800'
      } ${className ?? ''}`}
    >
      {/* Pulse overlay when offline */}
      {hasOffline && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(239,68,68,0.08), transparent 70%)',
            animation: 'pulse 2s infinite',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background: allOnline ? '#34d399' : hasOffline ? '#ef4444' : '#71717a',
              boxShadow: allOnline
                ? '0 0 8px #34d399'
                : hasOffline
                  ? '0 0 8px #ef4444'
                  : 'none',
              animation: hasOffline ? 'pulse 1.5s infinite' : undefined,
            }}
          />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-200">
            Network Flock
          </span>
        </div>
        <span className="text-[10px] text-zinc-600 tabular-nums">
          {data ? `${data.locationsOnline}/${data.locationsTotal}` : '--/--'}
        </span>
      </div>

      {/* Body */}
      <div className="px-1 py-1.5 space-y-0.5">
        {isLoading && !data ? (
          <div className="py-6 text-center text-xs text-zinc-600">Loading flock...</div>
        ) : error ? (
          <div className="py-6 text-center text-xs text-red-400">Flock unreachable</div>
        ) : data ? (
          <>
            <IndicatorRow
              icon="~"
              label="Flock Active"
              value={data.flockActive ? 'ONLINE' : 'OFFLINE'}
              color={data.flockActive ? 'emerald' : 'red'}
            />
            <IndicatorRow
              icon="#"
              label="Locations Online"
              value={`${data.locationsOnline} / ${data.locationsTotal}`}
              color={data.allOnline ? 'cyan' : 'red'}
            />
            <IndicatorRow
              icon="$"
              label="Revenue Today"
              value={formatCurrency(revenueDisplay)}
              color="amber"
            />
            <IndicatorRow
              icon=">"
              label="Agents Deployed"
              value={formatNumber(data.agentsDeployed)}
              color="emerald"
            />
            <IndicatorRow
              icon="@"
              label="Conversations Synced"
              value={formatNumber(data.conversationsSynced)}
              color="blue"
            />
            <IndicatorRow
              icon="%"
              label="Nano Protection"
              value={`${data.nanoProtection}%`}
              color="violet"
            />
          </>
        ) : null}
      </div>

      {/* Location pills */}
      {data && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {data.locations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
              style={{
                borderColor: loc.online ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)',
                color: loc.online ? '#6ee7b7' : '#fca5a5',
                background: loc.online ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)',
              }}
            >
              <span
                className="inline-block h-1 w-1 rounded-full"
                style={{ background: loc.online ? '#34d399' : '#ef4444' }}
              />
              {loc.id}
            </span>
          ))}
        </div>
      )}

      {/* 911 Blitz button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => {
            setBlitzResult(null);
            setBlitzOpen(true);
          }}
          className="w-full text-xs font-black uppercase tracking-wider py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors"
        >
          911 BLITZ
        </button>
        {blitzResult && (
          <p
            className={`text-[10px] text-center mt-1 font-bold ${
              blitzResult === 'DISPATCHED' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {blitzResult}
          </p>
        )}
      </div>

      {/* Blitz confirmation dialog */}
      <BlitzDialog
        open={blitzOpen}
        onClose={() => setBlitzOpen(false)}
        onConfirm={handleBlitz}
        loading={blitzLoading}
      />
    </div>
  );
}
