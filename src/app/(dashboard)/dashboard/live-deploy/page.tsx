'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Activity,
  Zap,
  HardDrive,
  Clock,
  Pause,
  Play,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  ChevronRight,
  Layers,
  Box,
  Server,
  Shield,
  Cpu,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DeployStatus = 'IDLE' | 'BUILDING' | 'DEPLOYING' | 'VERIFYING' | 'COMPLETE';

type LogCategory =
  | 'CLASSIFY'
  | 'VALIDATE'
  | 'DEPLOY'
  | 'VERIFY'
  | 'COMPLETE'
  | 'ERROR'
  | 'QUEUE'
  | 'LOCK'
  | 'METRIC';

type LaneStatus = 'idle' | 'deploying' | 'locked' | 'error';
type PacketSize = 'NANO' | 'MICRO' | 'SMALL' | 'MEDIUM';

interface LogLine {
  id: number;
  timestamp: Date;
  category: LogCategory;
  message: string;
}

interface Lane {
  id: string;
  name: string;
  status: LaneStatus;
  currentPacket?: string;
}

interface CompletedDeploy {
  id: string;
  lane: string;
  packetSize: PacketSize;
  duration: number;
  status: 'success' | 'failed';
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<LogCategory, string> = {
  CLASSIFY: 'text-cyan-400',
  VALIDATE: 'text-blue-400',
  DEPLOY: 'text-emerald-400',
  VERIFY: 'text-violet-400',
  COMPLETE: 'text-green-400',
  ERROR: 'text-red-400',
  QUEUE: 'text-amber-400',
  LOCK: 'text-yellow-400',
  METRIC: 'text-muted-foreground',
};

const CATEGORY_BG: Record<LogCategory, string> = {
  CLASSIFY: 'bg-cyan-500/10 border-cyan-500/20',
  VALIDATE: 'bg-blue-500/10 border-blue-500/20',
  DEPLOY: 'bg-emerald-500/10 border-emerald-500/20',
  VERIFY: 'bg-violet-500/10 border-violet-500/20',
  COMPLETE: 'bg-green-500/10 border-green-500/20',
  ERROR: 'bg-red-500/10 border-red-500/20',
  QUEUE: 'bg-amber-500/10 border-amber-500/20',
  LOCK: 'bg-yellow-500/10 border-yellow-500/20',
  METRIC: 'bg-muted border-border',
};

const LANE_STATUS_COLORS: Record<LaneStatus, string> = {
  idle: 'bg-muted',
  deploying: 'bg-emerald-500',
  locked: 'bg-amber-500',
  error: 'bg-red-500',
};

const INITIAL_LANES: Lane[] = [
  { id: 'l1', name: 'api-routes', status: 'idle' },
  { id: 'l2', name: 'api-services', status: 'idle' },
  { id: 'l3', name: 'api-middleware', status: 'idle' },
  { id: 'l4', name: 'web-pages', status: 'idle' },
  { id: 'l5', name: 'web-components', status: 'idle' },
  { id: 'l6', name: 'web-styles', status: 'idle' },
  { id: 'l7', name: 'worker-queues', status: 'idle' },
  { id: 'l8', name: 'worker-processors', status: 'idle' },
  { id: 'l9', name: 'db-migrations', status: 'idle' },
  { id: 'l10', name: 'auth-layer', status: 'idle' },
  { id: 'l11', name: 'event-bus', status: 'idle' },
  { id: 'l12', name: 'ai-engine', status: 'idle' },
  { id: 'l13', name: 'shared-types', status: 'idle' },
  { id: 'l14', name: 'infra-config', status: 'idle' },
];

const PACKET_IDS = [
  'pkt_a1b2c3', 'pkt_d4e5f6', 'pkt_g7h8i9', 'pkt_j0k1l2',
  'pkt_m3n4o5', 'pkt_p6q7r8', 'pkt_s9t0u1', 'pkt_v2w3x4',
  'pkt_y5z6a7', 'pkt_b8c9d0', 'pkt_e1f2g3', 'pkt_h4i5j6',
];

const MOCK_MESSAGES: Record<LogCategory, string[]> = {
  CLASSIFY: [
    'Packet {pkt} classified → {lane} ({size})',
    'Incoming change detected in {lane} scope',
    'Auto-classifying 3 file changes → {lane}',
    'Diff analysis: 12 files modified, 3 new → {lane} ({size})',
    'Scope resolved: {pkt} → {lane} pipeline',
  ],
  VALIDATE: [
    'Validating {lane} scope... PASS',
    'Type-check {lane}: 0 errors, 0 warnings',
    'Lint pass: {lane} → clean',
    'Schema validation: {lane} compatible',
    'Dependency graph verified for {lane}',
    'Import resolution: all 47 imports resolved',
  ],
  DEPLOY: [
    'Deploying packet {pkt} to Railway...',
    'Build started: {lane} → nixpacks',
    'Compiling TypeScript → {lane}...',
    'Bundle optimization: tree-shaking {lane}',
    'Uploading artifact: {pkt} (2.4 MB)',
    'Railway build #1847 triggered for {lane}',
    'Container image built: 340MB → 89MB (compressed)',
  ],
  VERIFY: [
    'Health check: GET /api/health → 200 OK (42ms)',
    'Smoke test: {lane} endpoints responding',
    'Load test: {lane} → 450 req/s, p99 < 120ms',
    'Database connectivity verified',
    'Redis connection pool: 8/10 active',
    'SSL certificate valid, 287 days remaining',
    'Route verification: 24/24 endpoints live',
  ],
  COMPLETE: [
    'Packet {pkt} deployed in {time}s',
    '{lane} deployment complete — all checks green',
    'Release v2.{ver}.0 live on production',
    'Deploy pipeline finished: 0 errors, 0 warnings',
    'Post-deploy hooks executed successfully',
  ],
  ERROR: [
    'Build failed: type error in {lane}/index.ts:47',
    'Health check failed: GET /api/health → 503',
    'Timeout: {lane} build exceeded 120s limit',
    'Container crash detected — restarting...',
  ],
  QUEUE: [
    'Packet {pkt} queued in {lane} (position 2)',
    'Queue depth: {lane} → 3 packets waiting',
    'Priority escalation: {pkt} moved to front',
    'Batch queue: 4 packets grouped for {lane}',
  ],
  LOCK: [
    'Lane {lane} locked by packet {pkt}',
    'Lock acquired: {lane} → exclusive build',
    'Lane {lane} released — available',
    'Mutex: {lane} write lock held (12s remaining)',
  ],
  METRIC: [
    'Throughput: {n} packets/hour',
    'Build cache hit rate: 87.3%',
    'Average deploy time: {time}s',
    'Active lanes: {active}/14',
    'Memory usage: 2.1GB / 4GB (52%)',
    'CPU utilization: 34% across 4 cores',
    'Network I/O: 12.4 MB/s upload',
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _lineId = 0;
function nextLineId() { return ++_lineId; }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimestamp(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function generateMessage(category: LogCategory, lanes: Lane[]): string {
  const templates = MOCK_MESSAGES[category];
  let msg = pick(templates);
  const lane = pick(lanes);
  msg = msg.replace(/\{lane\}/g, lane.name);
  msg = msg.replace(/\{pkt\}/g, pick(PACKET_IDS));
  msg = msg.replace(/\{size\}/g, pick(['NANO', 'MICRO', 'SMALL']));
  msg = msg.replace(/\{time\}/g, String(randInt(8, 95)));
  msg = msg.replace(/\{ver\}/g, String(randInt(14, 47)));
  msg = msg.replace(/\{n\}/g, String(randInt(8, 24)));
  msg = msg.replace(/\{active\}/g, String(randInt(2, 8)));
  return msg;
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (display === value) return;
    const diff = value - display;
    const step = Math.max(1, Math.floor(Math.abs(diff) / 10));
    const timer = setTimeout(() => {
      setDisplay(prev => {
        if (diff > 0) return Math.min(prev + step, value);
        return Math.max(prev - step, value);
      });
    }, 30);
    return () => clearTimeout(timer);
  }, [value, display]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric Card                                                        */
/* ------------------------------------------------------------------ */

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  pulse,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  suffix?: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 lg:p-5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <motion.span
            className="text-2xl lg:text-3xl font-bold text-white font-mono"
            animate={pulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <AnimatedCounter value={value} suffix={suffix} />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lane Pill                                                          */
/* ------------------------------------------------------------------ */

function LanePill({ lane }: { lane: Lane }) {
  const isActive = lane.status === 'deploying';
  return (
    <div
      className={`
        flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono transition-all duration-300
        ${isActive
          ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
          : lane.status === 'locked'
            ? 'border-amber-500/20 bg-amber-500/[0.04]'
            : lane.status === 'error'
              ? 'border-red-500/20 bg-red-500/[0.04]'
              : 'border-white/[0.04] bg-white/[0.01]'
        }
      `}
    >
      <span className="relative flex h-2 w-2">
        {isActive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${LANE_STATUS_COLORS[lane.status]}`} />
      </span>
      <span className={`${isActive ? 'text-emerald-300' : 'text-muted-foreground'}`}>
        {lane.name}
      </span>
      {lane.currentPacket && (
        <span className="text-[10px] text-emerald-500/70 ml-auto">{lane.currentPacket}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Log Line                                                           */
/* ------------------------------------------------------------------ */

function LogLineComponent({ line }: { line: LogLine }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 py-1 px-3 hover:bg-white/[0.02] group"
    >
      <span className="text-muted-foreground text-xs font-mono flex-shrink-0 pt-0.5 tabular-nums">
        {formatTimestamp(line.timestamp)}
      </span>
      <span
        className={`
          text-[10px] font-mono font-bold flex-shrink-0 pt-0.5 w-20 text-right
          px-1.5 py-0.5 rounded border
          ${CATEGORY_COLORS[line.category]}
          ${CATEGORY_BG[line.category]}
        `}
      >
        {line.category}
      </span>
      <span className="text-foreground text-sm font-mono leading-relaxed">{line.message}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Completed Deploy Item                                              */
/* ------------------------------------------------------------------ */

function CompletedDeployItem({ deploy }: { deploy: CompletedDeploy }) {
  const isSuccess = deploy.status === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2.5 px-3 border-b border-white/[0.04] last:border-0"
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-foreground truncate">{deploy.lane}</div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {deploy.packetSize} &middot; {deploy.duration}s
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
        {formatTimestamp(deploy.timestamp)}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: DeployStatus }) {
  const config: Record<DeployStatus, { color: string; bg: string; border: string }> = {
    IDLE: { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
    BUILDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    DEPLOYING: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    VERIFYING: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    COMPLETE: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  };
  const c = config[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${c.color} ${c.bg} ${c.border}`}>
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function LiveDeployPage() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [lanes, setLanes] = useState<Lane[]>(INITIAL_LANES);
  const [completedDeploys, setCompletedDeploys] = useState<CompletedDeploy[]>([]);
  const [status, setStatus] = useState<DeployStatus>('BUILDING');
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [filesCompiled, setFilesCompiled] = useState(0);
  const [chunksGenerated, setChunksGenerated] = useState(0);
  const [totalBuildSize, setTotalBuildSize] = useState(0);
  const [usingMock, setUsingMock] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Cycle through deploy statuses
  const statusCycle = useRef(0);

  // Auto-scroll terminal
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Elapsed timer
  useEffect(() => {
    if (status === 'IDLE' || status === 'COMPLETE' || paused) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [status, paused]);

  // Attempt real API poll
  useEffect(() => {
    let cancelled = false;
    async function pollReal() {
      try {
        const res = await fetch('/api/admin/speed-lanes/status');
        if (!res.ok) throw new Error('not available');
        if (!cancelled) setUsingMock(false);
      } catch {
        if (!cancelled) setUsingMock(true);
      }
    }
    pollReal();
    const interval = setInterval(pollReal, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Mock simulation engine
  useEffect(() => {
    if (!usingMock || paused) return;

    // Cycle deploy sequence
    const CATEGORY_SEQUENCE: LogCategory[] = [
      'CLASSIFY', 'VALIDATE', 'LOCK', 'DEPLOY', 'DEPLOY', 'VERIFY', 'COMPLETE', 'METRIC',
    ];

    const addLog = () => {
      statusCycle.current = (statusCycle.current + 1) % 40;
      const sc = statusCycle.current;

      // Update global status based on cycle
      if (sc < 5) setStatus('BUILDING');
      else if (sc < 20) setStatus('DEPLOYING');
      else if (sc < 30) setStatus('VERIFYING');
      else if (sc < 35) { setStatus('COMPLETE'); }
      else setStatus('BUILDING');

      // Pick category from sequence with some randomness
      let cat: LogCategory;
      if (Math.random() < 0.08) {
        cat = 'ERROR';
      } else if (Math.random() < 0.15) {
        cat = 'QUEUE';
      } else {
        cat = pick(CATEGORY_SEQUENCE);
      }

      const msg = generateMessage(cat, lanes);

      setLogs(prev => {
        const next = [...prev, { id: nextLineId(), timestamp: new Date(), category: cat, message: msg }];
        return next.slice(-200);
      });

      // Increment metrics
      if (['DEPLOY', 'CLASSIFY', 'VALIDATE'].includes(cat)) {
        setFilesCompiled(v => v + randInt(1, 8));
      }
      if (['DEPLOY'].includes(cat)) {
        setChunksGenerated(v => v + randInt(1, 3));
      }
      setTotalBuildSize(v => v + randInt(10, 200));

      // Update lane statuses randomly
      setLanes(prev => prev.map(lane => {
        const roll = Math.random();
        if (roll < 0.06) return { ...lane, status: 'deploying' as LaneStatus, currentPacket: pick(PACKET_IDS) };
        if (roll < 0.09) return { ...lane, status: 'locked' as LaneStatus, currentPacket: pick(PACKET_IDS) };
        if (roll < 0.1) return { ...lane, status: 'error' as LaneStatus, currentPacket: undefined };
        if (roll < 0.25 && lane.status !== 'idle') return { ...lane, status: 'idle' as LaneStatus, currentPacket: undefined };
        return lane;
      }));

      // Completed deploys
      if (cat === 'COMPLETE') {
        setCompletedDeploys(prev => [{
          id: `cd_${Date.now()}`,
          lane: pick(lanes).name,
          packetSize: pick(['NANO', 'MICRO', 'SMALL', 'MEDIUM'] as PacketSize[]),
          duration: randInt(8, 95),
          status: (Math.random() > 0.1 ? 'success' : 'failed') as 'success' | 'failed',
          timestamp: new Date(),
        }, ...prev].slice(0, 10));
      }
    };

    // Add initial burst
    if (logs.length === 0) {
      for (let i = 0; i < 8; i++) addLog();
    }

    const interval = setInterval(addLog, randInt(1200, 2800));
    return () => clearInterval(interval);
  }, [usingMock, paused, lanes, logs.length]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const togglePause = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const deployAllQueued = useCallback(() => {
    setLanes(prev => prev.map(lane =>
      lane.status === 'idle' ? { ...lane, status: 'deploying', currentPacket: pick(PACKET_IDS) } : lane
    ));
    setStatus('DEPLOYING');
    setLogs(prev => [...prev, {
      id: nextLineId(),
      timestamp: new Date(),
      category: 'DEPLOY' as LogCategory,
      message: 'All queued packets dispatched — full lane activation',
    }]);
  }, []);

  const activeLanes = lanes.filter(l => l.status === 'deploying').length;
  const buildSizeMB = (totalBuildSize / 1024).toFixed(1);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-4 lg:px-6 py-6">
        {/* ============================================================ */}
        {/*  HEADER                                                       */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-muted-foreground">Memelli OS</span>
                <span className="text-muted-foreground mx-2">/</span>
                <span className="text-white">Live Deploy</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-mono text-foreground tabular-nums">{formatTime(elapsed)}</span>
            </div>
            {usingMock && (
              <span className="px-2 py-1 rounded text-[10px] font-mono text-amber-500/60 border border-amber-500/10 bg-amber-500/[0.04]">
                DEMO
              </span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  BUILD METRICS STRIP                                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard
            icon={Layers}
            label="Files Compiled"
            value={filesCompiled}
            pulse={status === 'BUILDING'}
          />
          <MetricCard
            icon={Box}
            label="Client Chunks"
            value={chunksGenerated}
            pulse={status === 'DEPLOYING'}
          />
          <MetricCard
            icon={HardDrive}
            label="Build Size"
            value={parseFloat(buildSizeMB)}
            suffix=" MB"
          />
          <MetricCard
            icon={Zap}
            label="Active Lanes"
            value={activeLanes}
            suffix={' / 14'}
          />
        </div>

        {/* ============================================================ */}
        {/*  LANE STATUS GRID                                             */}
        {/* ============================================================ */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Lane Status Grid</span>
            <div className="flex-1" />
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-muted" />idle</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />deploying</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />locked</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />error</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {lanes.map(lane => (
              <LanePill key={lane.id} lane={lane} />
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  MAIN CONTENT: TERMINAL + SIDEBAR                             */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Terminal Output */}
          <div className="flex-1 lg:w-[65%] flex flex-col">
            <div className="rounded-xl border border-white/[0.06] bg-[#08080b] overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
              {/* Terminal header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-2">deploy-terminal — {logs.length} lines</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                    {activeLanes} active
                  </span>
                </div>
              </div>

              {/* Terminal body */}
              <div
                ref={logContainerRef}
                className="flex-1 overflow-y-auto font-mono text-sm py-2 scroll-smooth"
                style={{ maxHeight: '520px' }}
              >
                <AnimatePresence>
                  {logs.map(line => (
                    <LogLineComponent key={line.id} line={line} />
                  ))}
                </AnimatePresence>
                <div ref={logEndRef} />

                {logs.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Waiting for deployment events...
                  </div>
                )}
              </div>

              {/* Terminal footer with cursor blink */}
              <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01] flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-sm font-mono">memelli-os</span>
                <span className="text-muted-foreground text-sm font-mono">$</span>
                <motion.span
                  className="w-2 h-4 bg-emerald-500/80 inline-block"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                />
              </div>
            </div>
          </div>

          {/* Activity Timeline Sidebar */}
          <div className="lg:w-[35%]">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recent Deployments</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">{completedDeploys.length}</span>
              </div>
              <div className="max-h-[470px] overflow-y-auto">
                <AnimatePresence>
                  {completedDeploys.map(deploy => (
                    <CompletedDeployItem key={deploy.id} deploy={deploy} />
                  ))}
                </AnimatePresence>
                {completedDeploys.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-xs font-mono">
                    No completed deploys yet
                  </div>
                )}
              </div>

              {/* Lane summary */}
              <div className="border-t border-white/[0.04] px-4 py-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">System Health</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500/60" />
                    <span className="text-xs text-muted-foreground font-mono">CPU 34%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-blue-500/60" />
                    <span className="text-xs text-muted-foreground font-mono">MEM 52%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-violet-500/60" />
                    <span className="text-xs text-muted-foreground font-mono">NET 12MB/s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
                    <span className="text-xs text-muted-foreground font-mono">SSL OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  QUICK ACTIONS BAR                                            */}
        {/* ============================================================ */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={deployAllQueued}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <Send className="w-4 h-4" />
            Deploy All Queued
          </button>
          <button
            onClick={togglePause}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              paused
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Resume All' : 'Pause All Lanes'}
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground text-sm font-medium hover:bg-white/[0.06] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Log
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            <span>Polling: {usingMock ? 'MOCK' : 'LIVE'}</span>
            <span>&middot;</span>
            <span>Refresh: 3s</span>
            <span>&middot;</span>
            <span>Buffer: {logs.length}/200</span>
          </div>
        </div>
      </div>
    </div>
  );
}
