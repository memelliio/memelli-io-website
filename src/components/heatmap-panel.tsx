'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import SystemHeatmap, { type HeatmapSnapshot } from './system-heatmap';

/* ======================================================================== */
/*  Types                                                                    */
/* ======================================================================== */

interface HeatmapPanelProps {
  onCellClick?: (subsystem: string) => void;
  autoRotate?: boolean;
  className?: string;
}

/* ======================================================================== */
/*  Health Score Badge                                                       */
/* ======================================================================== */

function HealthBadge({ score }: { score: number }) {
  let bg: string;
  let text: string;
  let label: string;

  if (score >= 90) {
    bg = '#065f46';
    text = '#6ee7b7';
    label = 'OPTIMAL';
  } else if (score >= 70) {
    bg = '#164e63';
    text = '#67e8f9';
    label = 'HEALTHY';
  } else if (score >= 50) {
    bg = '#78350f';
    text = '#fde68a';
    label = 'STRESSED';
  } else if (score >= 25) {
    bg = '#7c2d12';
    text = '#fdba74';
    label = 'DEGRADED';
  } else {
    bg = '#7f1d1d';
    text = '#fca5a5';
    label = 'CRITICAL';
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
      style={{ background: bg, color: text }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          background: text,
          boxShadow: `0 0 4px ${text}`,
          animation: score < 50 ? 'pulse 1s infinite' : undefined,
        }}
      />
      {label} {score}
    </span>
  );
}

/* ======================================================================== */
/*  Status Dot                                                               */
/* ======================================================================== */

function StatusDot({ isLive }: { isLive: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: isLive ? '#22c55e' : '#ef4444',
        boxShadow: isLive ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
        animation: isLive ? 'pulse 2s infinite' : undefined,
      }}
    />
  );
}

/* ======================================================================== */
/*  Main Panel                                                               */
/* ======================================================================== */

export default function HeatmapPanel({
  onCellClick,
  autoRotate = true,
  className = '',
}: HeatmapPanelProps) {
  const api = useApi();

  const fetchLiveData = useCallback(async (): Promise<HeatmapSnapshot | null> => {
    const res = await api.get<HeatmapSnapshot>('/api/admin/analytics/live');
    if (res.error || !res.data) return null;
    return res.data;
  }, [api]);

  const {
    data,
    isError,
    isFetching,
  } = useQuery<HeatmapSnapshot | null>({
    queryKey: ['system-heatmap-live'],
    queryFn: fetchLiveData,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    retry: 2,
    staleTime: 4000,
  });

  const isLive = !!data && !isError;
  const healthScore = data?.healthScore ?? 0;

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-800 bg-[#020617] ${className}`}>
      {/* Header Bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2"
        style={{ background: 'rgba(2, 6, 23, 0.95)' }}
      >
        <div className="flex items-center gap-3">
          <StatusDot isLive={isLive} />
          <h2
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: '#94a3b8', letterSpacing: '0.15em' }}
          >
            SYSTEM HEATMAP
          </h2>
          {isFetching && (
            <span className="text-[10px] uppercase tracking-wider text-slate-600">
              syncing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {data?.bpm && (
            <span className="font-mono text-xs text-slate-500">
              {data.bpm} BPM
            </span>
          )}
          {isLive && <HealthBadge score={healthScore} />}
        </div>
      </div>

      {/* Heatmap or Offline */}
      <div className="relative flex-1">
        {isLive ? (
          <SystemHeatmap
            data={data}
            onCellClick={onCellClick}
            autoRotate={autoRotate}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            {/* Offline state */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="2" y1="2" x2="22" y2="22" />
                <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
                <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
                <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
                <path d="M5 12.86a10 10 0 0 1 5.17-2.89" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>
            <div className="text-center">
              <p
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: '#ef4444', letterSpacing: '0.2em' }}
              >
                HEATMAP OFFLINE
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {isError
                  ? 'Failed to connect to analytics endpoint'
                  : 'Waiting for live data feed...'}
              </p>
            </div>
            {/* Show empty heatmap in background for visual continuity */}
            <div className="absolute inset-0 opacity-20" style={{ top: 48 }}>
              <SystemHeatmap
                data={null}
                onCellClick={onCellClick}
                autoRotate={autoRotate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Inline keyframe for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
