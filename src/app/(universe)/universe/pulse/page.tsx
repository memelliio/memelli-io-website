'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type LayerStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface PulseLayer {
  id: string;
  label: string;
  status: LayerStatus;
  latency?: number;
  detail?: string;
}

interface HealthResponse {
  overall: 'operational' | 'degraded' | 'outage';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    metrics: Record<string, string | number>;
    lastCheck: string;
  }>;
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    completed24h: number;
    failed24h: number;
  }>;
  workers: Array<{
    name: string;
    status: string;
    uptime: string;
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const POLL_INTERVAL = 5000;

const STATUS_COLORS: Record<LayerStatus, { ring: string; glow: string; text: string }> = {
  healthy: { ring: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
  degraded: { ring: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: '#fcd34d' },
  down: { ring: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' },
  unknown: { ring: '#6b7280', glow: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function mapServiceStatus(status: string): LayerStatus {
  if (status === 'operational') return 'healthy';
  if (status === 'degraded') return 'degraded';
  if (status === 'down') return 'down';
  return 'unknown';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function deriveLayers(data: HealthResponse): PulseLayer[] {
  const apiService = data.services.find((s) => s.name === 'API Server');
  const redisService = data.services.find((s) => s.name === 'Redis');
  const dbService = data.services.find((s) => s.name === 'PostgreSQL');

  const totalQueued = data.queues.reduce((sum, q) => sum + q.waiting + q.active, 0);
  const totalFailed = data.queues.reduce((sum, q) => sum + q.failed24h, 0);
  const queueStatus: LayerStatus =
    totalFailed > 100 ? 'down' : totalFailed > 20 ? 'degraded' : 'healthy';

  const workersRunning = data.workers.filter((w) => w.status === 'running').length;
  const workerStatus: LayerStatus =
    workersRunning === 0 ? 'down' : workersRunning < data.workers.length * 0.5 ? 'degraded' : 'healthy';

  return [
    {
      id: 'api',
      label: 'API',
      status: apiService ? mapServiceStatus(apiService.status) : 'unknown',
      latency: apiService?.metrics?.['Latency'] ? parseInt(String(apiService.metrics['Latency'])) : undefined,
      detail: apiService?.metrics?.['Uptime'] ? String(apiService.metrics['Uptime']) : undefined,
    },
    {
      id: 'redis',
      label: 'Redis',
      status: redisService ? mapServiceStatus(redisService.status) : 'unknown',
      latency: redisService?.metrics?.['Latency'] ? parseInt(String(redisService.metrics['Latency'])) : undefined,
    },
    {
      id: 'database',
      label: 'Database',
      status: dbService ? mapServiceStatus(dbService.status) : 'unknown',
      latency: dbService?.metrics?.['Latency'] ? parseInt(String(dbService.metrics['Latency'])) : undefined,
    },
    {
      id: 'queues',
      label: 'Queues',
      status: queueStatus,
      detail: `${totalQueued} queued / ${totalFailed} failed`,
    },
    {
      id: 'workers',
      label: 'Workers',
      status: workerStatus,
      detail: `${workersRunning}/${data.workers.length} running`,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sonar Ring Component                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SonarRing({
  layer,
  index,
  total,
  beat,
}: {
  layer: PulseLayer;
  index: number;
  total: number;
  beat: number;
}) {
  const colors = STATUS_COLORS[layer.status];
  const maxRadius = 44;
  const minRadius = 12;
  const step = (maxRadius - minRadius) / (total - 1 || 1);
  const baseRadius = minRadius + step * index;

  // Pulse animation: each ring pulses outward with staggered timing
  const pulseDelay = index * 0.15;
  const pulseScale = 1 + Math.sin((beat - pulseDelay) * Math.PI * 2) * 0.02;
  const pulseOpacity = 0.6 + Math.sin((beat - pulseDelay) * Math.PI * 2) * 0.4;

  return (
    <g>
      {/* Glow ring */}
      <circle
        cx="50"
        cy="50"
        r={baseRadius * pulseScale}
        fill="none"
        stroke={colors.glow}
        strokeWidth={layer.status === 'down' ? 3 : 1.5}
        opacity={pulseOpacity * 0.4}
      />
      {/* Main ring */}
      <circle
        cx="50"
        cy="50"
        r={baseRadius}
        fill="none"
        stroke={colors.ring}
        strokeWidth={layer.status === 'down' ? 1.8 : 0.8}
        opacity={pulseOpacity}
        strokeDasharray={layer.status === 'degraded' ? '3 2' : undefined}
      />
      {/* Label */}
      <text
        x={50 + baseRadius + 1.5}
        y={50 - 1}
        fill={colors.text}
        fontSize="2.4"
        fontFamily="monospace"
        opacity={0.9}
      >
        {layer.label}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Expanding Pulse Wave                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PulseWave({ color, delay }: { color: string; delay: number }) {
  return (
    <circle
      cx="50"
      cy="50"
      r="5"
      fill="none"
      stroke={color}
      strokeWidth="0.3"
      opacity="0"
    >
      <animate
        attributeName="r"
        from="5"
        to="48"
        dur="3s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        from="0.5"
        to="0"
        dur="3s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Pulse Page                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PulsePage() {
  const api = useApi();
  const [layers, setLayers] = useState<PulseLayer[]>([]);
  const [overall, setOverall] = useState<'operational' | 'degraded' | 'outage'>('operational');
  const [uptimeStart] = useState(() => Date.now());
  const [uptime, setUptime] = useState('0s');
  const [lastPoll, setLastPoll] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [beat, setBeat] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  // Poll health endpoint
  const fetchHealth = useCallback(async () => {
    const res = await api.get<HealthResponse>('/api/admin/health');
    if (res.data) {
      setLayers(deriveLayers(res.data));
      setOverall(res.data.overall);
      setLastPoll(new Date().toLocaleTimeString());
      setError(null);
    } else {
      setError(res.error ?? 'Failed to reach API');
      setLayers((prev) =>
        prev.length > 0
          ? prev.map((l) => ({ ...l, status: 'unknown' as LayerStatus }))
          : [
              { id: 'api', label: 'API', status: 'down' },
              { id: 'redis', label: 'Redis', status: 'unknown' },
              { id: 'database', label: 'Database', status: 'unknown' },
              { id: 'queues', label: 'Queues', status: 'unknown' },
              { id: 'workers', label: 'Workers', status: 'unknown' },
            ]
      );
      setOverall('outage');
    }
  }, [api]);

  // Initial fetch + polling
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime((Date.now() - uptimeStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [uptimeStart]);

  // Animation loop
  useEffect(() => {
    startTimeRef.current = Date.now();
    let running = true;
    function tick() {
      if (!running) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setBeat(elapsed / 1.5); // one full cycle every 1.5s
      animRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const overallColor =
    overall === 'operational'
      ? STATUS_COLORS.healthy
      : overall === 'degraded'
      ? STATUS_COLORS.degraded
      : STATUS_COLORS.down;

  const healthyCount = layers.filter((l) => l.status === 'healthy').length;
  const degradedCount = layers.filter((l) => l.status === 'degraded').length;
  const downCount = layers.filter((l) => l.status === 'down').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[hsl(var(--foreground))] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <div className="absolute top-6 left-8 z-10">
        <h1 className="text-lg font-mono tracking-widest text-[hsl(var(--muted-foreground))] uppercase">System Pulse</h1>
        <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] mt-1">
          {lastPoll ? `Last check: ${lastPoll}` : 'Connecting...'}
          {error && <span className="text-red-400 ml-3">{error}</span>}
        </p>
      </div>

      {/* Status legend */}
      <div className="absolute top-6 right-8 z-10 flex gap-5">
        {healthyCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-emerald-400/70">{healthyCount} healthy</span>
          </div>
        )}
        {degradedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-mono text-amber-400/70">{degradedCount} degraded</span>
          </div>
        )}
        {downCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-mono text-red-400/70">{downCount} down</span>
          </div>
        )}
      </div>

      {/* Sonar visualization */}
      <div className="relative w-[min(90vw,700px)] aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Expanding pulse waves */}
          <PulseWave color={overallColor.ring} delay={0} />
          <PulseWave color={overallColor.ring} delay={1} />
          <PulseWave color={overallColor.ring} delay={2} />

          {/* System layer rings */}
          {layers.map((layer, i) => (
            <SonarRing
              key={layer.id}
              layer={layer}
              index={i}
              total={layers.length}
              beat={beat}
            />
          ))}

          {/* Center core */}
          <circle cx="50" cy="50" r="7" fill={overallColor.ring} opacity={0.08} />
          <circle
            cx="50"
            cy="50"
            r="5"
            fill={overallColor.ring}
            opacity={0.15 + Math.sin(beat * Math.PI * 2) * 0.1}
          />
          <circle
            cx="50"
            cy="50"
            r="3"
            fill={overallColor.ring}
            opacity={0.4 + Math.sin(beat * Math.PI * 2) * 0.3}
          />
          <circle cx="50" cy="50" r="1.2" fill={overallColor.ring} opacity={0.9} />

          {/* Center uptime text */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="1.8"
            fontFamily="monospace"
            opacity="0"
          >
            {/* Hidden in SVG center — shown below */}
          </text>
        </svg>

        {/* Uptime overlay in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-mono font-bold tracking-wider" style={{ color: overallColor.text }}>
            {uptime}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mt-1">
            session uptime
          </span>
        </div>
      </div>

      {/* Layer detail cards */}
      <div className="flex flex-wrap justify-center gap-3 mt-6 px-8 max-w-3xl">
        {layers.map((layer) => {
          const colors = STATUS_COLORS[layer.status];
          return (
            <div
              key={layer.id}
              className="border rounded-lg px-4 py-2.5 min-w-[120px] text-center"
              style={{
                borderColor: `${colors.ring}33`,
                background: `${colors.ring}08`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: colors.ring }}
                />
                <span className="text-xs font-mono font-semibold" style={{ color: colors.text }}>
                  {layer.label}
                </span>
              </div>
              {layer.latency != null && (
                <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{layer.latency}ms</p>
              )}
              {layer.detail && (
                <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{layer.detail}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer pulse indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: overallColor.ring }}
        />
        <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
          polling every {POLL_INTERVAL / 1000}s
        </span>
      </div>
    </div>
  );
}
