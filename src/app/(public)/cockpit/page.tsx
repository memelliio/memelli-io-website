'use client';

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';

const SystemGlobe = lazy(() => import('@/components/system-globe'));

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface AgentPoolMetrics {
  totalPools: number;
  totalAgents: number;
  activeAgents: number;
  dispatchedAgents: number;
  idleAgents: number;
  errorAgents: number;
  maxCapacity: number;
  utilizationPct: number;
  totalEvents: number;
  eventsHandled: number;
  eventsFailed: number;
  totalDispatches: number;
  totalReturns: number;
  expansionsTriggered: number;
  unhandledEvents: number;
  poolBreakdown: Array<{
    domain: string;
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    dispatchedAgents: number;
    errorAgents: number;
    status: string;
  }>;
}

interface CommandCenterData {
  agentPools: AgentPoolMetrics;
  executionEngine: { running: boolean; tasksProcessed?: number; tasksActive?: number } | null;
  healthEngine: { healthy: boolean; lastRunAt: string | null; results: unknown } | null;
  environment: {
    nodeEnv: string;
    uptimeSeconds: number;
    memory: { rss: string; heapUsed: string; heapTotal: string; external: string };
    pid: number;
    nodeVersion: string;
  };
}

interface HealthDashboardData {
  timestamp: string;
  database: { latencyMs: number; status: 'up' | 'down'; error?: string };
  redis: { latencyMs: number; status: 'up' | 'down'; error?: string };
  api: { latencyMs: number; uptimeSeconds: number };
  memory: { rss: number; heapUsed: number; heapTotal: number; external: number };
  queues: Record<string, { waiting: number; active: number; delayed: number; failed: number }>;
  agents: {
    totalRegistered: number;
    byStatus: Record<string, number>;
    poolSummary: Array<{ domain: string; total: number; active: number; idle: number; status: string }>;
  };
  alerts: Array<{ id: string; severity: string; category: string; message: string; detectedAt: string; resolved: boolean }>;
  overallStatus: 'healthy' | 'degraded' | 'critical';
}

interface LiveFeedEvent {
  id: string;
  domain: string;
  type: string;
  severity: string;
  message: string;
  handled: boolean;
  assignedAgentId: string | null;
  resolution: string | null;
  timestamp: string;
  resolvedAt: string | null;
}

interface LiveFeedData {
  events: LiveFeedEvent[];
  totalEvents: number;
  poolCount: number;
}

interface HeartbeatData {
  status: string;
  uptimeSeconds?: number;
  timestamp?: string;
}

interface VolumeData {
  level?: number;
  volume?: number;
}

interface SpawnGridData {
  cells: Array<unknown>;
  coveragePct: number;
}

interface SpawnMetricsData {
  spawnRate: number;
  totalPoints: number;
  coveragePct: number;
}

interface CockpitPayload {
  pools: AgentPoolMetrics | null;
  command: CommandCenterData | null;
  health: HealthDashboardData | null;
  feed: LiveFeedData | null;
  heartbeat: HeartbeatData | null;
  volume: VolumeData | null;
  spawnGrid: SpawnGridData | null;
  spawnMetrics: SpawnMetricsData | null;
}

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const POLL_MS = 10_000;
const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

/* ================================================================== */
/*  API HELPER                                                         */
/* ================================================================== */

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

/* ================================================================== */
/*  EKG PATH                                                           */
/* ================================================================== */

function generateEkgPath(width: number, height: number, activity: number): string {
  const mid = height / 2;
  const segments = 200;
  const step = width / segments;
  let d = `M 0 ${mid}`;
  for (let i = 1; i <= segments; i++) {
    const x = i * step;
    const beatPhase = (i % 25) / 25;
    let y = mid;
    if (beatPhase > 0.3 && beatPhase < 0.35) {
      y = mid - 4 * activity;
    } else if (beatPhase > 0.38 && beatPhase < 0.42) {
      y = mid + 8 * activity;
    } else if (beatPhase > 0.42 && beatPhase < 0.48) {
      y = mid - (20 + activity * 15);
    } else if (beatPhase > 0.48 && beatPhase < 0.52) {
      y = mid + 6 * activity;
    } else if (beatPhase > 0.55 && beatPhase < 0.62) {
      y = mid - 5 * activity;
    } else {
      y = mid + (Math.random() - 0.5) * 0.5;
    }
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/* ================================================================== */
/*  CLOCK                                                              */
/* ================================================================== */

function ClockDisplay() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{time}</span>;
}

/* ================================================================== */
/*  UPTIME FORMATTER                                                   */
/* ================================================================== */

function formatUptime(seconds?: number): string {
  if (!seconds) return '0s';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ================================================================== */
/*  4-LANE RAIL SYSTEM                                                 */
/* ================================================================== */

interface RailLane {
  id: number;
  name: string;
  label: string;
  color: string;
  sources: string[];
  direction: 'inward' | 'outward' | 'horizontal' | 'vertical';
}

const RAIL_LANES: RailLane[] = [
  { id: 1, name: 'INBOUND', label: 'LANE 1 INBOUND', color: '#22c55e', sources: ['Twilio', 'Webhooks', 'Lead Ingestion', 'User Requests'], direction: 'inward' },
  { id: 2, name: 'OUTBOUND', label: 'LANE 2 OUTBOUND', color: '#3b82f6', sources: ['SMS Replies', 'Email Sends', 'API Responses', 'Deploys'], direction: 'outward' },
  { id: 3, name: 'KNOWLEDGE', label: 'LANE 3 KNOWLEDGE', color: '#eab308', sources: ['Doctrine', 'Memory Files', 'Worker Knowledge', 'AI Learning'], direction: 'horizontal' },
  { id: 4, name: 'ACTION', label: 'LANE 4 ACTION', color: '#ffffff', sources: ['BullMQ Jobs', 'Agent Dispatches', 'Task Execution'], direction: 'vertical' },
];

interface RailParticle {
  lane: number;
  t: number;
  speed: number;
  size: number;
  opacity: number;
}

function useRailCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const particlesRef = useRef<RailParticle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: RailParticle[] = [];
    for (let lane = 0; lane < 4; lane++) {
      const count = lane === 2 ? 10 : 16;
      for (let i = 0; i < count; i++) {
        particles.push({
          lane, t: Math.random(),
          speed: lane === 2 ? 0.0008 + Math.random() * 0.0012 : 0.0015 + Math.random() * 0.0025,
          size: 1.2 + Math.random() * 1.8, opacity: 0.35 + Math.random() * 0.65,
        });
      }
    }
    particlesRef.current = particles;

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const cx = () => W() / 2;
    const cy = () => H() / 2;

    function lane1Path(t: number): [number, number] {
      const angle = -Math.PI * 0.75;
      const r = Math.max(W(), H()) * 0.52 * (1 - t);
      return [cx() + Math.cos(angle) * r, cy() + Math.sin(angle) * r];
    }
    function lane2Path(t: number): [number, number] {
      const angle = Math.PI * 0.25;
      const r = Math.max(W(), H()) * 0.52 * t;
      return [cx() + Math.cos(angle) * r, cy() + Math.sin(angle) * r];
    }
    function lane3Path(t: number): [number, number] {
      return [-20 + (W() + 40) * t, cy() + Math.sin(t * Math.PI * 3) * 25];
    }
    function lane4Path(t: number): [number, number] {
      return [cx() + Math.sin(t * Math.PI * 2.5) * 35, -20 + (H() + 40) * t];
    }

    const pathFns = [lane1Path, lane2Path, lane3Path, lane4Path];
    const colors = RAIL_LANES.map((l) => l.color);

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      for (let lane = 0; lane < 4; lane++) {
        ctx!.beginPath();
        ctx!.strokeStyle = colors[lane];
        ctx!.globalAlpha = 0.06;
        ctx!.lineWidth = 1;
        for (let s = 0; s <= 100; s++) {
          const [px, py] = pathFns[lane](s / 100);
          if (s === 0) ctx!.moveTo(px, py); else ctx!.lineTo(px, py);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      for (const p of particlesRef.current) {
        p.t += p.speed;
        if (p.t > 1) p.t -= 1;
        const [px, py] = pathFns[p.lane](p.t);

        ctx!.beginPath();
        ctx!.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = colors[p.lane];
        ctx!.globalAlpha = p.opacity * 0.12;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(px, py, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = colors[p.lane];
        ctx!.globalAlpha = p.opacity;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [canvasRef]);
}

const RAIL_NODES = [
  { label: 'Twilio', x: '10%', y: '15%', color: '#22c55e' },
  { label: 'Webhooks', x: '20%', y: '8%', color: '#22c55e' },
  { label: 'Leads', x: '7%', y: '35%', color: '#22c55e' },
  { label: 'SMS', x: '83%', y: '68%', color: '#3b82f6' },
  { label: 'Email', x: '88%', y: '55%', color: '#3b82f6' },
  { label: 'API Out', x: '80%', y: '82%', color: '#3b82f6' },
  { label: 'Doctrine', x: '5%', y: '52%', color: '#eab308' },
  { label: 'Memory', x: '92%', y: '48%', color: '#eab308' },
  { label: 'BullMQ', x: '50%', y: '6%', color: '#ffffff' },
  { label: 'Workers', x: '46%', y: '92%', color: '#ffffff' },
  { label: 'Agents', x: '56%', y: '92%', color: '#ffffff' },
];

function RailLaneVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useRailCanvas(canvasRef);

  return (
    <div className="relative w-full h-[360px] bg-[hsl(var(--background))]/80 border border-zinc-800/50 rounded-xl overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[250px] w-[250px] rounded-full bg-white/[0.012] blur-[80px]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />

      {/* Central brain */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="absolute -inset-5 rounded-full border border-border animate-[ping_3s_ease-in-out_infinite]" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 border border-white/20 shadow-[0_0_24px_rgba(255,255,255,0.06)]">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
            <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Peripheral nodes */}
      {RAIL_NODES.map((node) => (
        <div key={node.label} className="absolute z-10" style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}>
          <div className="flex h-5 w-5 items-center justify-center rounded-full border"
            style={{ borderColor: node.color + '40', backgroundColor: node.color + '10', boxShadow: `0 0 6px ${node.color}20` }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: node.color }} />
          </div>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-semibold tracking-wider uppercase"
            style={{ color: node.color + 'bb' }}>{node.label}</span>
        </div>
      ))}

      {/* Lane legend */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        {RAIL_LANES.map((lane) => (
          <div key={lane.id} className="flex items-center gap-1.5">
            <div className="h-1 w-3 rounded-full" style={{ backgroundColor: lane.color, opacity: 0.8 }} />
            <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: lane.color + 'aa' }}>{lane.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RailLaneStatusBar() {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-card px-4 py-3">
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground block mb-2">RAIL LANES</span>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5">
        {RAIL_LANES.map((lane) => (
          <div key={lane.id} className="flex items-center gap-1.5 font-mono text-[9px]">
            <span style={{ color: lane.color }} className="font-bold tracking-wider whitespace-nowrap">{lane.label}</span>
            <div className="flex-1 min-w-[20px] h-1.5 rounded-sm bg-gray-800 overflow-hidden">
              <div className="h-full rounded-sm" style={{ backgroundColor: lane.color, width: '100%', animation: 'laneGlow 2s ease-in-out infinite' }} />
            </div>
            <span className="font-bold tracking-widest text-emerald-400 whitespace-nowrap">OPEN</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CSS                                                                */
/* ================================================================== */

const tvCSS = `
  .tv-scanlines {
    pointer-events: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
  }
  .tv-scanlines::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%);
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes ekg-sweep {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
  @keyframes laneGlow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

/* ================================================================== */
/*  METRIC CARD                                                        */
/* ================================================================== */

function MetricCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-card px-4 py-3">
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground block">{label}</span>
      <span className={`text-[18px] font-bold tabular-nums ${color} block mt-0.5`}>{value}</span>
      {sub && <span className="text-[9px] font-mono text-muted-foreground block">{sub}</span>}
    </div>
  );
}

/* ================================================================== */
/*  TV COCKPIT PAGE                                                    */
/* ================================================================== */

export default function TVCockpitPage() {
  // State
  const [connected, setConnected] = useState(false);
  const [pools, setPools] = useState<AgentPoolMetrics | null>(null);
  const [command, setCommand] = useState<CommandCenterData | null>(null);
  const [health, setHealth] = useState<HealthDashboardData | null>(null);
  const [feed, setFeed] = useState<LiveFeedData | null>(null);
  const [volume, setVolume] = useState<VolumeData | null>(null);
  const [lastPing, setLastPing] = useState(0);
  const [ekgPath, setEkgPath] = useState('');
  const [booted, setBooted] = useState(false);

  // Boot
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Fetch
  const fetchAll = useCallback(async () => {
    const start = Date.now();
    let payload = await apiFetch<CockpitPayload>('/api/public/cockpit');
    if (!payload) {
      const status = await apiFetch<Record<string, unknown>>('/api/public/status');
      if (status) {
        const agents = status.agents as { total: number; active: number; idle: number } | undefined;
        payload = {
          pools: agents
            ? ({ totalAgents: agents.total, activeAgents: agents.active, idleAgents: agents.idle, totalPools: 52, totalEvents: 0, eventsHandled: 0, totalDispatches: 0, totalReturns: 0 } as unknown as AgentPoolMetrics)
            : null,
          command: null, health: null, feed: null,
          heartbeat: { status: 'ok', uptimeSeconds: status.uptime as number } as HeartbeatData,
          volume: null, spawnGrid: null, spawnMetrics: null,
        };
      }
    }
    const elapsed = Date.now() - start;
    setConnected(!!payload);
    if (payload) {
      if (payload.pools) setPools(payload.pools);
      if (payload.command) setCommand(payload.command);
      if (payload.health) setHealth(payload.health);
      if (payload.feed) setFeed(payload.feed);
      if (payload.volume) setVolume(payload.volume);
    }
    setLastPing(elapsed);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Derived
  const agentCount = pools?.totalAgents ?? 0;
  const activeAgents = (pools?.activeAgents ?? 0) + (pools?.dispatchedAgents ?? 0);
  const idleAgents = pools?.idleAgents ?? 0;
  const tasksProcessing = command?.executionEngine?.tasksActive ?? 0;
  const totalErrors = health?.alerts?.filter((a) => !a.resolved).length ?? 0;
  const completionRate = pools && pools.totalEvents > 0 ? Math.round((pools.eventsHandled / pools.totalEvents) * 100) : 0;
  const activityLevel = tasksProcessing > 10 ? 3 : tasksProcessing > 3 ? 2 : tasksProcessing > 0 ? 1 : 0;
  const systemStatus: 'healthy' | 'degraded' | 'critical' =
    !connected ? 'critical' : health?.overallStatus ?? (totalErrors > 5 ? 'critical' : totalErrors > 0 ? 'degraded' : 'healthy');

  const statusColor = systemStatus === 'healthy' ? 'emerald' : systemStatus === 'degraded' ? 'amber' : 'red';
  const orbColorMap = {
    emerald: { bg: 'bg-emerald-500', glow: '#10b981', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500', glow: '#f59e0b', text: 'text-amber-400' },
    red: { bg: 'bg-red-500', glow: '#ef4444', text: 'text-red-400' },
  };
  const orb = orbColorMap[statusColor];

  const uptimeSeconds = command?.environment?.uptimeSeconds ?? health?.api?.uptimeSeconds ?? 0;
  const volumeLevel = volume?.level ?? volume?.volume ?? 50;
  const feedEvents = feed?.events?.slice(0, 6) ?? [];
  const dbStatus = health?.database?.status ?? 'unknown';
  const redisStatus = health?.redis?.status ?? 'unknown';
  const dbLatency = health?.database?.latencyMs ?? 0;
  const redisLatency = health?.redis?.latencyMs ?? 0;
  const memRss = health?.memory?.rss ? Math.round(health.memory.rss / 1024 / 1024) : 0;
  const heapUsed = health?.memory?.heapUsed ? Math.round(health.memory.heapUsed / 1024 / 1024) : 0;

  // EKG
  const ekgActivity = connected ? 0.5 + activityLevel * 0.5 : 0.1;
  useEffect(() => {
    setEkgPath(generateEkgPath(1200, 60, ekgActivity));
  }, [ekgActivity, lastPing]);

  // Globe props
  const globeProps = {
    gridCoverage: completionRate,
    contactPoints: (pools?.poolBreakdown ?? []).flatMap((pool) => {
      const pts: Array<{ lat: number; lon: number; status: string }> = [];
      for (let i = 0; i < Math.min(pool.totalAgents, 20); i++) {
        const hash = (pool.domain.charCodeAt(0) * 31 + i * 7) % 1000;
        pts.push({
          lat: ((hash % 180) - 90),
          lon: ((hash * 7 % 360) - 180),
          status: i < pool.activeAgents ? 'active' : i < pool.activeAgents + pool.idleAgents ? 'idle' : 'error',
        });
      }
      return pts;
    }),
    laneCount: pools?.totalPools ?? 0,
    pulseHealth: !connected ? 'dead' : systemStatus === 'healthy' ? 'healthy' : systemStatus === 'degraded' ? 'stressed' : 'failing',
    bpm: connected ? 60 + activityLevel * 20 : 40,
    awakeningStatus: !connected ? 'dormant' : activityLevel === 0 ? 'stirring' : activityLevel < 2 ? 'awake' : 'transcendent',
    size: 380,
  };

  // Time ago
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  }

  if (!booted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
        <span className="animate-pulse font-mono text-[13px] text-muted-foreground">INITIALIZING COCKPIT...</span>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tvCSS }} />
      <div className="tv-scanlines" />

      <div className="min-h-screen w-full bg-[hsl(var(--background))] text-foreground p-4 lg:p-6 animate-fade-in">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${orb.bg}`} style={{ boxShadow: `0 0 12px ${orb.glow}`, animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span className="font-mono text-[18px] lg:text-[22px] font-bold tracking-[0.2em] text-white">
                MEMELLI OS
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              CEO COCKPIT
            </span>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${orb.text}`}>
              {systemStatus === 'healthy' ? 'ALL SYSTEMS NOMINAL' : systemStatus === 'degraded' ? 'ELEVATED LOAD' : 'OFFLINE'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              PING {lastPing}ms
            </span>
            <ClockDisplay />
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* LEFT: Globe + Agent Stats */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center" style={{ width: 380, height: 380 }}>
                  <span className="text-[11px] font-mono text-muted-foreground animate-pulse">Loading globe...</span>
                </div>
              }>
                <SystemGlobe {...globeProps} />
              </Suspense>
            </div>

            {/* Agent summary */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className={`text-[28px] font-bold tabular-nums ${orb.text}`}>{agentCount}</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">TOTAL AGENTS</span>
              </div>
              <div className="h-8 w-px bg-muted" />
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-bold tabular-nums text-emerald-400">{activeAgents}</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">ACTIVE</span>
              </div>
              <div className="h-8 w-px bg-muted" />
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-bold tabular-nums text-muted-foreground">{idleAgents}</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">IDLE</span>
              </div>
            </div>

            {/* EKG */}
            <div className="w-full max-w-[420px] rounded-xl border border-zinc-800/50 bg-card px-3 py-2 overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">HEARTBEAT</span>
                <span className={`text-[10px] font-mono tabular-nums ${orb.text}`}>{connected ? 60 + activityLevel * 20 : 0} BPM</span>
              </div>
              <svg viewBox="0 0 1200 60" className="w-full h-[40px]" preserveAspectRatio="none">
                <path d={ekgPath} fill="none" stroke={orb.glow} strokeWidth="2" opacity="0.7" />
                <path d={ekgPath} fill="none" stroke={orb.glow} strokeWidth="4" opacity="0.15" />
              </svg>
            </div>
          </div>

          {/* RIGHT: Stats + Feed */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="UPTIME" value={formatUptime(uptimeSeconds)} color={orb.text} />
              <MetricCard label="POOLS" value={String(pools?.totalPools ?? 0)} color="text-cyan-400" />
              <MetricCard label="TASKS ACTIVE" value={String(tasksProcessing)} color="text-violet-400" />
              <MetricCard label="ERRORS" value={String(totalErrors)} color={totalErrors > 0 ? 'text-red-400' : 'text-emerald-400'} />
            </div>

            {/* Row 2: Infrastructure */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="DATABASE"
                value={dbStatus === 'up' ? 'ONLINE' : 'DOWN'}
                color={dbStatus === 'up' ? 'text-emerald-400' : 'text-red-400'}
                sub={dbLatency > 0 ? `${dbLatency}ms` : undefined}
              />
              <MetricCard
                label="REDIS"
                value={redisStatus === 'up' ? 'ONLINE' : 'DOWN'}
                color={redisStatus === 'up' ? 'text-emerald-400' : 'text-red-400'}
                sub={redisLatency > 0 ? `${redisLatency}ms` : undefined}
              />
              <MetricCard
                label="MEMORY"
                value={`${memRss}MB`}
                color="text-muted-foreground"
                sub={heapUsed > 0 ? `heap ${heapUsed}MB` : undefined}
              />
              <MetricCard
                label="VOLUME"
                value={`${volumeLevel}%`}
                color="text-amber-400"
              />
            </div>

            {/* Row 3: Live Feed */}
            <div className="rounded-xl border border-zinc-800/50 bg-card p-4 flex-1 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">LIVE FEED</span>
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{feed?.totalEvents ?? 0} total events</span>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {feedEvents.length === 0 ? (
                  <p className="text-[11px] font-mono text-muted-foreground text-center py-4">No recent events</p>
                ) : (
                  feedEvents.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-3 rounded-lg bg-card px-3 py-2">
                      <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                        evt.severity === 'critical' ? 'bg-red-500' :
                        evt.severity === 'high' ? 'bg-amber-500' :
                        evt.severity === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">{evt.domain}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(evt.timestamp)} ago</span>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">{evt.message}</p>
                      </div>
                      {evt.handled && (
                        <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-600 mt-1">RESOLVED</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Row 4: Pool Breakdown */}
            <div className="rounded-xl border border-zinc-800/50 bg-card p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-3 block">AGENT POOLS</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(pools?.poolBreakdown ?? []).slice(0, 6).map((pool) => (
                  <div key={pool.domain} className="rounded-lg bg-card px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase truncate">{pool.domain}</span>
                      <span className={`text-[9px] font-mono uppercase ${pool.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {pool.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{pool.totalAgents}</span>
                      <span className="text-[8px] font-mono text-muted-foreground">agents</span>
                      <span className="text-[8px] font-mono text-emerald-600">{pool.activeAgents} active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4-LANE RAIL VISUALIZATION */}
        <div className="mt-4 lg:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2 block">4-LANE RAIL SYSTEM</span>
            <RailLaneVisualization />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-3">
            <RailLaneStatusBar />
            <div className="rounded-xl border border-zinc-800/50 bg-card px-4 py-3 flex-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground block mb-2">LANE SOURCES</span>
              <div className="space-y-2">
                {RAIL_LANES.map((lane) => (
                  <div key={lane.id}>
                    <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: lane.color + '99' }}>{lane.name}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {lane.sources.map((src) => (
                        <span key={src} className="rounded-sm px-1.5 py-0.5 text-[7px] font-medium border"
                          style={{ borderColor: lane.color + '25', color: lane.color + 'cc', backgroundColor: lane.color + '08' }}>{src}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/30 pt-3">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
            TV MODE - AUTO-REFRESH {POLL_MS / 1000}s
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
            MEMELLI UNIVERSE OS v2.0
          </span>
        </div>
      </div>
    </>
  );
}
