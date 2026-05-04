'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Activity,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Zap,
  Shield,
  Clock,
  Layers,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SpawnCategory = 'infrastructure' | 'intelligence' | 'communication' | 'operations' | 'business';
type SpawnStatus = 'active' | 'inactive' | 'building';

interface SpawnNode {
  id: string;
  name: string;
  shortName: string;
  status: SpawnStatus;
  category: SpawnCategory;
  stage: number;
  connections: string[];
}

interface ClaudeAgent {
  id: string;
  name: string;
  code: string;
  color: string;
  glowColor: string;
  orbitRadius: number;
  orbitSpeed: number;
  currentTask: string;
  rpm: number;
  tokensUsed: number;
}

interface LaneConfig {
  id: number;
  tier: number;
  rpm: number;
  radius: number;
  color: string;
  glowColor: string;
}

interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'spawn' | 'command' | 'heal' | 'deploy' | 'alert' | 'task';
  message: string;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  fromId: string;
  toId: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_COLORS: Record<SpawnCategory, { dot: string; glow: string; label: string }> = {
  infrastructure: { dot: '#3B82F6', glow: 'rgba(59,130,246,0.5)', label: 'Infrastructure' },
  intelligence:   { dot: '#A855F7', glow: 'rgba(239,68,68,0.5)', label: 'Intelligence' },
  communication:  { dot: '#22C55E', glow: 'rgba(34,197,94,0.5)',  label: 'Communication' },
  operations:     { dot: '#F59E0B', glow: 'rgba(245,158,11,0.5)', label: 'Operations' },
  business:       { dot: '#10B981', glow: 'rgba(16,185,129,0.5)', label: 'Business' },
};

const LANES: LaneConfig[] = [
  { id: 1, tier: 1, rpm: 50,   radius: 130, color: '#3B82F6', glowColor: 'rgba(59,130,246,0.4)' },
  { id: 2, tier: 4, rpm: 4000, radius: 100, color: '#EF4444', glowColor: 'rgba(239,68,68,0.5)' },
  { id: 3, tier: 1, rpm: 50,   radius: 160, color: '#60A5FA', glowColor: 'rgba(96,165,250,0.4)' },
  { id: 4, tier: 2, rpm: 1000, radius: 115, color: '#F59E0B', glowColor: 'rgba(245,158,11,0.4)' },
  { id: 5, tier: 2, rpm: 1000, radius: 145, color: '#FBBF24', glowColor: 'rgba(251,191,36,0.4)' },
];

const CLAUDE_AGENTS: ClaudeAgent[] = [
  { id: 'prime', name: 'Prime', code: 'CU', color: '#FFD700', glowColor: 'rgba(255,215,0,0.6)', orbitRadius: 210, orbitSpeed: 0.3, currentTask: 'Orchestrating system governance', rpm: 4000, tokensUsed: 1240000 },
  { id: 'forge', name: 'Forge', code: 'EU-1', color: '#FF8C00', glowColor: 'rgba(255,140,0,0.6)', orbitRadius: 260, orbitSpeed: 0.5, currentTask: 'Building deployment pipeline', rpm: 1000, tokensUsed: 890000 },
  { id: 'canvas', name: 'Canvas', code: 'EU-2', color: '#00CED1', glowColor: 'rgba(0,206,209,0.6)', orbitRadius: 260, orbitSpeed: 0.45, currentTask: 'Rendering visual components', rpm: 1000, tokensUsed: 670000 },
  { id: 'shield', name: 'Shield', code: 'VU', color: '#32CD32', glowColor: 'rgba(50,205,50,0.6)', orbitRadius: 310, orbitSpeed: 0.2, currentTask: 'Monitoring system integrity', rpm: 50, tokensUsed: 340000 },
];

const SPAWNS: SpawnNode[] = [
  { id: 'core-doctrine', name: 'Core Doctrine Engine', shortName: 'Doctrine', status: 'active', category: 'infrastructure', stage: 1, connections: ['wire-points', 'queue-system', 'system-identity'] },
  { id: 'wire-points', name: 'Wire Points Router', shortName: 'Wire Pts', status: 'active', category: 'infrastructure', stage: 3, connections: ['core-doctrine', 'queue-system', 'escalation-system'] },
  { id: 'queue-system', name: 'Central Queue System', shortName: 'Queues', status: 'active', category: 'infrastructure', stage: 4, connections: ['worker-pools', 'task-grid', 'wire-points'] },
  { id: 'worker-pools', name: 'Worker Pool Manager', shortName: 'Workers', status: 'active', category: 'operations', stage: 5, connections: ['queue-system', 'agent-factory', 'energy-model'] },
  { id: 'decomposition', name: 'Task Decomposition', shortName: 'Decompose', status: 'active', category: 'intelligence', stage: 6, connections: ['queue-system', 'task-grid', 'worker-pools'] },
  { id: 'memory-system', name: 'Memory System', shortName: 'Memory', status: 'active', category: 'intelligence', stage: 7, connections: ['core-doctrine', 'growth-engine', 'archive-engine'] },
  { id: 'patrol-grid', name: 'Patrol Grid', shortName: 'Patrol', status: 'active', category: 'operations', stage: 8, connections: ['sensor-grid', 'resilience', 'escalation-system'] },
  { id: 'escalation-system', name: 'Escalation System', shortName: 'Escalation', status: 'active', category: 'operations', stage: 9, connections: ['wire-points', 'owner-command', 'patrol-grid'] },
  { id: 'deployops', name: 'DeployOps Grid', shortName: 'DeployOps', status: 'active', category: 'infrastructure', stage: 10, connections: ['self-deployment', 'resilience', 'patrol-grid'] },
  { id: 'security-grid', name: 'Security Grid', shortName: 'Security', status: 'active', category: 'infrastructure', stage: 41, connections: ['compliance', 'escalation-system', 'identity-access'] },
  { id: 'customer-lifecycle', name: 'Customer Lifecycle', shortName: 'Lifecycle', status: 'active', category: 'business', stage: 13, connections: ['revenue-engine', 'communication-fabric', 'crm-engine'] },
  { id: 'growth-engine', name: 'Growth Engine', shortName: 'Growth', status: 'active', category: 'intelligence', stage: 15, connections: ['memory-system', 'market-intelligence', 'sensor-grid'] },
  { id: 'sensor-grid', name: 'Sensor Grid', shortName: 'Sensors', status: 'active', category: 'operations', stage: 37, connections: ['patrol-grid', 'escalation-system', 'growth-engine'] },
  { id: 'task-grid', name: 'Global Task Grid', shortName: 'Task Grid', status: 'active', category: 'operations', stage: 36, connections: ['queue-system', 'worker-pools', 'decomposition'] },
  { id: 'agent-factory', name: 'Agent Factory', shortName: 'Factory', status: 'active', category: 'operations', stage: 35, connections: ['worker-pools', 'energy-model', 'task-grid'] },
  { id: 'communication-fabric', name: 'Communication Fabric', shortName: 'Comms', status: 'active', category: 'communication', stage: 29, connections: ['customer-lifecycle', 'market-intelligence', 'jessica-voice'] },
  { id: 'revenue-engine', name: 'Revenue Engine', shortName: 'Revenue', status: 'active', category: 'business', stage: 24, connections: ['customer-lifecycle', 'affiliate-engine', 'market-intelligence'] },
  { id: 'market-intelligence', name: 'Market Intelligence', shortName: 'Mkt Intel', status: 'building', category: 'intelligence', stage: 23, connections: ['growth-engine', 'revenue-engine', 'communication-fabric'] },
  { id: 'compliance', name: 'Trust & Compliance', shortName: 'Compliance', status: 'active', category: 'business', stage: 28, connections: ['security-grid', 'customer-lifecycle', 'owner-command'] },
  { id: 'energy-model', name: 'Energy Model', shortName: 'Energy', status: 'active', category: 'infrastructure', stage: 40, connections: ['worker-pools', 'agent-factory', 'resilience'] },
  { id: 'resilience', name: 'Resilience Engine', shortName: 'Resilience', status: 'active', category: 'infrastructure', stage: 25, connections: ['patrol-grid', 'deployops', 'energy-model'] },
  { id: 'time-engine', name: 'Time Engine', shortName: 'Time', status: 'active', category: 'operations', stage: 39, connections: ['queue-system', 'task-grid', 'patrol-grid'] },
  { id: 'self-deployment', name: 'Self-Deployment Grid', shortName: 'Self-Deploy', status: 'building', category: 'infrastructure', stage: 33, connections: ['deployops', 'expansion-protocol', 'resilience'] },
  { id: 'expansion-protocol', name: 'Expansion Protocol', shortName: 'Expansion', status: 'building', category: 'business', stage: 42, connections: ['self-deployment', 'revenue-engine', 'market-intelligence'] },
  { id: 'owner-command', name: 'Owner Command Layer', shortName: 'Owner CMD', status: 'active', category: 'communication', stage: 30, connections: ['escalation-system', 'core-doctrine', 'communication-fabric'] },
];

// Additional virtual nodes referenced in connections but not main spawns
const VIRTUAL_NODES = ['system-identity', 'jessica-voice', 'archive-engine', 'affiliate-engine', 'crm-engine', 'identity-access'];

const EVENT_TYPES: LiveEvent['type'][] = ['spawn', 'command', 'heal', 'deploy', 'alert', 'task'];
const EVENT_MESSAGES: Record<LiveEvent['type'], string[]> = {
  spawn:   ['Agent pool expanded +3 workers', 'New patrol agent spawned in security grid', 'Factory produced 5 sensor agents', 'Worker pool scaled to 120 agents'],
  command: ['Owner command received: system check', 'Dispatch task to deployment lane', 'Queue routing updated for priority P1', 'Agent reassigned to commerce pool'],
  heal:    ['Self-healed queue backpressure on Lane 2', 'Resilience engine repaired stale connection', 'Memory tier promoted from L3 to L2', 'Patrol corrected agent heartbeat drift'],
  deploy:  ['Build 7bb8139 deployed to production', 'Health check passed on all endpoints', 'Railway service updated successfully', 'Frontend bundle optimized -12% size'],
  alert:   ['Lane 2 approaching RPM threshold', 'Sensor grid detected traffic anomaly', 'Token budget at 78% for current cycle', 'Queue depth exceeded soft limit'],
  task:    ['Content generation completed in 3.2s', 'CRM pipeline stage advanced', 'SEO article indexed via IndexNow', 'Coaching enrollment processed'],
};

const TYPE_COLORS: Record<LiveEvent['type'], string> = {
  spawn: '#22C55E', command: '#3B82F6', heal: '#A855F7',
  deploy: '#F59E0B', alert: '#EF4444', task: '#06B6D4',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Utility                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Spawn Position Calculator — Constellation Layout                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function calculateSpawnPositions(
  spawns: SpawnNode[],
  centerX: number,
  centerY: number,
  baseRadius: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group by category for constellation clustering
  const groups: Record<SpawnCategory, SpawnNode[]> = {
    infrastructure: [], intelligence: [], communication: [], operations: [], business: [],
  };
  spawns.forEach(s => groups[s.category].push(s));

  const categoryAngles: Record<SpawnCategory, number> = {
    infrastructure: -Math.PI / 2,        // top
    intelligence: -Math.PI / 2 + (2 * Math.PI / 5),  // upper right
    operations: -Math.PI / 2 + (4 * Math.PI / 5),    // lower right
    business: -Math.PI / 2 + (6 * Math.PI / 5),      // lower left
    communication: -Math.PI / 2 + (8 * Math.PI / 5), // upper left
  };

  Object.entries(groups).forEach(([cat, nodes]) => {
    const baseAngle = categoryAngles[cat as SpawnCategory];
    const spread = Math.PI / 4; // how wide each cluster spreads
    nodes.forEach((node, i) => {
      const count = nodes.length;
      const angleOffset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread;
      const radiusJitter = baseRadius + (i % 3) * 30 - 15;
      const angle = baseAngle + angleOffset;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radiusJitter,
        y: centerY + Math.sin(angle) * radiusJitter,
      });
    });
  });

  // Place virtual nodes in gaps
  VIRTUAL_NODES.forEach((id, i) => {
    const angle = (i / VIRTUAL_NODES.length) * Math.PI * 2 + Math.PI / 6;
    positions.set(id, {
      x: centerX + Math.cos(angle) * (baseRadius + 50),
      y: centerY + Math.sin(angle) * (baseRadius + 50),
    });
  });

  return positions;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MPUDisplayPage() {
  /* ── state ─────────────────────────────────────────────────────────────── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  const [uptime, setUptime] = useState(284763); // ~3.3 days
  const [totalRpm, setTotalRpm] = useState(6100);
  const [tokensProcessed, setTokensProcessed] = useState(3_140_000);
  const [activeAgents, setActiveAgents] = useState(127);
  const [queueDepth, setQueueDepth] = useState(42);
  const [costAccum, setCostAccum] = useState(47.82);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [showPanel, setShowPanel] = useState(true);
  const [selectedSpawn, setSelectedSpawn] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [breathPhase, setBreathPhase] = useState(0);
  const [viewSize, setViewSize] = useState({ w: 1920, h: 1080 });

  // Display counters that animate toward target
  const [displayRpm, setDisplayRpm] = useState(6100);
  const [displayTokens, setDisplayTokens] = useState(3_140_000);
  const [displayAgents, setDisplayAgents] = useState(127);
  const [displayCost, setDisplayCost] = useState(47.82);

  /* ── spawn positions ───────────────────────────────────────────────────── */
  const spawnPositions = useMemo(() => {
    return calculateSpawnPositions(SPAWNS, 0, 0, 420);
  }, []);

  /* ── generate events ───────────────────────────────────────────────────── */
  const generateEvent = useCallback((): LiveEvent => {
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const msgs = EVENT_MESSAGES[type];
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      message: msgs[Math.floor(Math.random() * msgs.length)],
    };
  }, []);

  /* ── window size ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const update = () => setViewSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── uptime ticker ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(u => u + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── breath animation ──────────────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(p => (p + 0.02) % (Math.PI * 2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  /* ── simulate metric changes ───────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalRpm(r => r + Math.floor(Math.random() * 20 - 8));
      setTokensProcessed(t => t + Math.floor(Math.random() * 5000));
      setActiveAgents(a => Math.max(80, Math.min(200, a + Math.floor(Math.random() * 5 - 2))));
      setQueueDepth(q => Math.max(0, Math.min(100, q + Math.floor(Math.random() * 7 - 3))));
      setCostAccum(c => parseFloat((c + Math.random() * 0.08).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ── animate display counters ──────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayRpm(d => d + (totalRpm - d) * 0.1);
      setDisplayTokens(d => Math.round(d + (tokensProcessed - d) * 0.1));
      setDisplayAgents(d => Math.round(d + (activeAgents - d) * 0.2));
      setDisplayCost(d => parseFloat((d + (costAccum - d) * 0.1).toFixed(2)));
    }, 50);
    return () => clearInterval(interval);
  }, [totalRpm, tokensProcessed, activeAgents, costAccum]);

  /* ── event feed ────────────────────────────────────────────────────────── */
  useEffect(() => {
    // Initial events
    setEvents(Array.from({ length: 10 }, () => generateEvent()));

    const interval = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev].slice(0, 10));
    }, 3000);
    return () => clearInterval(interval);
  }, [generateEvent]);

  /* ── zoom handler ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  /* ── particle canvas ───────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles periodically
    const spawnInterval = setInterval(() => {
      const positions = calculateSpawnPositions(SPAWNS, window.innerWidth / 2, window.innerHeight / 2, 420 * zoom);
      // Pick a random connection to send a particle along
      const spawn = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
      const validConnections = spawn.connections.filter(c => positions.has(c));
      if (validConnections.length === 0) return;
      const targetId = validConnections[Math.floor(Math.random() * validConnections.length)];
      const from = positions.get(spawn.id);
      const to = positions.get(targetId);
      if (!from || !to) return;

      const colors = ['#EF4444', '#3B82F6', '#22C55E'];
      particlesRef.current.push({
        x: from.x, y: from.y,
        targetX: to.x, targetY: to.y,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.5 + Math.random() * 1.5,
        fromId: spawn.id,
        toId: targetId,
      });

      // Limit particles
      if (particlesRef.current.length > 150) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
    }, 80);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.progress += p.speed;
        if (p.progress >= 1) return false;

        const x = lerp(p.x, p.targetX, p.progress);
        const y = lerp(p.y, p.targetY, p.progress);

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(spawnInterval);
    };
  }, [zoom]);

  /* ── click handlers ────────────────────────────────────────────────────── */
  const handleSpawnClick = useCallback((id: string) => {
    setSelectedSpawn(prev => prev === id ? null : id);
    setSelectedAgent(null);
  }, []);

  const handleAgentClick = useCallback((id: string) => {
    setSelectedAgent(prev => prev === id ? null : id);
    setSelectedSpawn(null);
  }, []);

  /* ── computed values ───────────────────────────────────────────────────── */
  const breathScale = 1 + Math.sin(breathPhase) * 0.03;
  const breathOpacity = 0.4 + Math.sin(breathPhase) * 0.15;
  const throughput = Math.round(displayRpm);

  const selectedSpawnData = selectedSpawn ? SPAWNS.find(s => s.id === selectedSpawn) : null;
  const selectedAgentData = selectedAgent ? CLAUDE_AGENTS.find(a => a.id === selectedAgent) : null;

  /* ── CSS keyframes (injected once) ─────────────────────────────────────── */
  useEffect(() => {
    const styleId = 'mpu-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes mpuRotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes mpuRotateMed { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes mpuRotateFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes mpuRotateReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      @keyframes mpuPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      @keyframes mpuNodePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      @keyframes mpuGlowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
      @keyframes mpuScanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      @keyframes mpuDataFlow {
        0% { stroke-dashoffset: 20; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes mpuFadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mpuOrbit1 { from { transform: rotate(0deg) translateX(210px) rotate(0deg); } to { transform: rotate(360deg) translateX(210px) rotate(-360deg); } }
      @keyframes mpuOrbit2 { from { transform: rotate(90deg) translateX(260px) rotate(-90deg); } to { transform: rotate(450deg) translateX(260px) rotate(-450deg); } }
      @keyframes mpuOrbit3 { from { transform: rotate(180deg) translateX(260px) rotate(-180deg); } to { transform: rotate(540deg) translateX(260px) rotate(-540deg); } }
      @keyframes mpuOrbit4 { from { transform: rotate(270deg) translateX(310px) rotate(-270deg); } to { transform: rotate(630deg) translateX(310px) rotate(-630deg); } }
      @keyframes mpuRingDash {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -50; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: '#050507', fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace" }}
    >
      {/* ── particle canvas (bottom layer) ─────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* ── scanline overlay ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
        }}
      />

      {/* ── subtle grid ────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── top left title ─────────────────────────────────────────────── */}
      <div className="absolute top-6 left-6 z-30">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5" style={{ color: '#60A5FA' }} />
          <h1
            className="text-lg font-bold tracking-widest uppercase"
            style={{
              color: '#E2E8F0',
              textShadow: '0 0 20px rgba(96,165,250,0.4), 0 0 40px rgba(96,165,250,0.2)',
            }}
          >
            Memelli Processing Unit
          </h1>
        </div>
        <div className="mt-1 text-xs tracking-wider" style={{ color: '#475569' }}>
          REAL-TIME SYSTEM TOPOLOGY v3.0
        </div>
      </div>

      {/* ── top right status badge ─────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        {!showPanel && (
          <button
            onClick={() => setShowPanel(true)}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: '#1E293B', background: 'rgba(15,23,42,0.8)', color: '#94A3B8' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            borderColor: systemStatus === 'ONLINE' ? 'rgba(34,197,94,0.4)' : systemStatus === 'DEGRADED' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)',
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: systemStatus === 'ONLINE' ? '#22C55E' : systemStatus === 'DEGRADED' ? '#F59E0B' : '#EF4444',
              boxShadow: `0 0 8px ${systemStatus === 'ONLINE' ? 'rgba(34,197,94,0.6)' : systemStatus === 'DEGRADED' ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.6)'}`,
              animation: 'mpuPulse 2s ease-in-out infinite',
            }}
          />
          <span className="text-xs font-bold tracking-widest" style={{ color: systemStatus === 'ONLINE' ? '#22C55E' : systemStatus === 'DEGRADED' ? '#F59E0B' : '#EF4444' }}>
            {systemStatus}
          </span>
        </div>
      </div>

      {/* ── main visualization area ────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 10, transform: `scale(${zoom})`, transition: 'transform 0.3s ease-out' }}
      >
        {/* ── connection lines (SVG) ───────────────────────────────────── */}
        <svg
          className="absolute pointer-events-none"
          style={{ width: '100%', height: '100%', left: 0, top: 0, zIndex: 5 }}
          viewBox={`${-viewSize.w / 2} ${-viewSize.h / 2} ${viewSize.w} ${viewSize.h}`}
        >
          <defs>
            <filter id="glow-line">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {SPAWNS.map(spawn => {
            const from = spawnPositions.get(spawn.id);
            if (!from) return null;
            return spawn.connections.map(targetId => {
              const to = spawnPositions.get(targetId);
              if (!to) return null;
              const isHighlighted = selectedSpawn === spawn.id || selectedSpawn === targetId;
              return (
                <line
                  key={`${spawn.id}-${targetId}`}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={isHighlighted ? '#60A5FA' : 'rgba(100,116,139,0.15)'}
                  strokeWidth={isHighlighted ? 1.5 : 0.5}
                  strokeDasharray={isHighlighted ? '6 4' : 'none'}
                  style={isHighlighted ? { animation: 'mpuDataFlow 1s linear infinite', filter: 'url(#glow-line)' } : {}}
                />
              );
            });
          })}
        </svg>

        {/* ── spawn constellation nodes ────────────────────────────────── */}
        {SPAWNS.map(spawn => {
          const pos = spawnPositions.get(spawn.id);
          if (!pos) return null;
          const catColor = CATEGORY_COLORS[spawn.category];
          const isSelected = selectedSpawn === spawn.id;
          const isConnected = selectedSpawn ? SPAWNS.find(s => s.id === selectedSpawn)?.connections.includes(spawn.id) : false;
          const isActive = spawn.status === 'active';
          const isDim = selectedSpawn && !isSelected && !isConnected;

          return (
            <div
              key={spawn.id}
              className="absolute cursor-pointer group"
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 20 : 12,
                opacity: isDim ? 0.2 : 1,
                transition: 'opacity 0.3s ease',
              }}
              onClick={() => handleSpawnClick(spawn.id)}
              onMouseEnter={() => setHoveredNode(spawn.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 28, height: 28,
                  left: -14, top: -14,
                  background: catColor.glow,
                  filter: 'blur(8px)',
                  opacity: isActive ? 0.6 : 0.15,
                  animation: isActive ? 'mpuGlowPulse 3s ease-in-out infinite' : 'none',
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
              {/* dot */}
              <div
                className="rounded-full border"
                style={{
                  width: isSelected ? 14 : 10,
                  height: isSelected ? 14 : 10,
                  backgroundColor: isActive ? catColor.dot : '#1E293B',
                  borderColor: isActive ? catColor.dot : '#334155',
                  borderWidth: spawn.status === 'building' ? 2 : 1,
                  boxShadow: isActive ? `0 0 10px ${catColor.glow}` : 'none',
                  animation: isActive ? 'mpuNodePulse 4s ease-in-out infinite' : 'none',
                  animationDelay: `${Math.random() * 4}s`,
                  transition: 'all 0.2s ease',
                }}
              />
              {/* label */}
              <div
                className="absolute whitespace-nowrap text-center"
                style={{
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  color: isDim ? '#334155' : isActive ? '#94A3B8' : '#475569',
                  fontWeight: isSelected ? 700 : 400,
                  letterSpacing: '0.05em',
                  textShadow: isActive ? '0 0 8px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                {spawn.shortName}
              </div>

              {/* hover tooltip */}
              {hoveredNode === spawn.id && (
                <div
                  className="absolute rounded-lg border px-3 py-2 pointer-events-none"
                  style={{
                    bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(15,23,42,0.95)', borderColor: catColor.dot,
                    backdropFilter: 'blur(12px)',
                    minWidth: 180,
                    animation: 'mpuFadeIn 0.2s ease',
                    zIndex: 50,
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: catColor.dot }}>{spawn.name}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                    Stage {spawn.stage} &middot; {spawn.status.toUpperCase()}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#475569' }}>
                    {spawn.connections.length} connections
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── CPU core ─────────────────────────────────────────────────── */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 15 }}>
          {/* outer glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: 350, height: 350,
              left: -175, top: -175,
              background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)',
              transform: `scale(${breathScale})`,
              transition: 'transform 0.5s ease',
            }}
          />

          {/* lane rings (SVG) */}
          <svg
            width="400" height="400"
            viewBox="-200 -200 400 400"
            className="absolute"
            style={{ left: -200, top: -200, zIndex: 16 }}
          >
            <defs>
              <filter id="ring-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {LANES.map((lane, i) => {
              // Speed based on RPM: higher RPM = faster animation
              const duration = lane.rpm >= 4000 ? 2 : lane.rpm >= 1000 ? 6 : 20;
              const dashSize = lane.rpm >= 4000 ? '3 8' : lane.rpm >= 1000 ? '8 12' : '12 18';
              return (
                <g key={lane.id}>
                  {/* base ring */}
                  <circle
                    cx={0} cy={0} r={lane.radius}
                    fill="none"
                    stroke={lane.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.15}
                  />
                  {/* animated dash ring */}
                  <circle
                    cx={0} cy={0} r={lane.radius}
                    fill="none"
                    stroke={lane.color}
                    strokeWidth={lane.rpm >= 4000 ? 2.5 : 1.5}
                    strokeDasharray={dashSize}
                    strokeLinecap="round"
                    filter="url(#ring-glow)"
                    style={{
                      animation: `mpuRingDash ${duration}s linear infinite`,
                      transformOrigin: 'center',
                    }}
                  />
                  {/* lane label */}
                  <text
                    x={lane.radius + 8}
                    y={-4}
                    fill={lane.color}
                    fontSize={8}
                    fontFamily="monospace"
                    opacity={0.5}
                  >
                    L{lane.id}
                  </text>
                  <text
                    x={lane.radius + 8}
                    y={6}
                    fill={lane.color}
                    fontSize={7}
                    fontFamily="monospace"
                    opacity={0.35}
                  >
                    T{lane.tier} {lane.rpm}r
                  </text>
                </g>
              );
            })}

            {/* rotating tracker dots on each lane */}
            {LANES.map(lane => {
              const duration = lane.rpm >= 4000 ? 1 : lane.rpm >= 1000 ? 4 : 15;
              return (
                <circle
                  key={`tracker-${lane.id}`}
                  cx={lane.radius} cy={0}
                  r={lane.rpm >= 4000 ? 4 : 3}
                  fill={lane.color}
                  filter="url(#ring-glow)"
                  style={{
                    transformOrigin: '0 0',
                    animation: `mpuRotateSlow ${duration}s linear infinite`,
                  }}
                />
              );
            })}
          </svg>

          {/* processor core circle */}
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: 160, height: 160,
              left: -80, top: -80,
              position: 'absolute',
              background: 'radial-gradient(circle at 35% 35%, #1E293B 0%, #0F172A 60%, #050507 100%)',
              border: '2px solid rgba(96,165,250,0.3)',
              boxShadow: `
                0 0 30px rgba(96,165,250,${breathOpacity * 0.5}),
                inset 0 0 30px rgba(96,165,250,0.05),
                0 0 60px rgba(96,165,250,${breathOpacity * 0.3})
              `,
              zIndex: 17,
            }}
          >
            <div className="text-center">
              <div
                className="text-3xl font-black tracking-widest"
                style={{
                  color: '#E2E8F0',
                  textShadow: '0 0 20px rgba(96,165,250,0.5)',
                }}
              >
                MPU
              </div>
              <div className="text-xs mt-1 tabular-nums" style={{ color: '#64748B', letterSpacing: '0.1em' }}>
                {formatUptime(uptime)}
              </div>
              <div
                className="text-sm font-bold mt-1 tabular-nums"
                style={{ color: '#60A5FA', textShadow: '0 0 10px rgba(96,165,250,0.4)' }}
              >
                {formatNumber(throughput)} RPM
              </div>
            </div>
          </div>

          {/* ── orbiting Claude agents ──────────────────────────────────── */}
          {CLAUDE_AGENTS.map((agent, i) => {
            const orbitAnimations = [
              `mpuOrbit1 ${30 / agent.orbitSpeed}s linear infinite`,
              `mpuOrbit2 ${30 / agent.orbitSpeed}s linear infinite`,
              `mpuOrbit3 ${30 / agent.orbitSpeed}s linear infinite`,
              `mpuOrbit4 ${30 / agent.orbitSpeed}s linear infinite`,
            ];
            const isSelected = selectedAgent === agent.id;

            return (
              <div
                key={agent.id}
                className="absolute cursor-pointer"
                style={{
                  left: -20, top: -20,
                  width: 40, height: 40,
                  animation: orbitAnimations[i],
                  zIndex: 18,
                }}
                onClick={(e) => { e.stopPropagation(); handleAgentClick(agent.id); }}
              >
                {/* agent glow */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 44, height: 44, left: -2, top: -2,
                    background: agent.glowColor,
                    filter: 'blur(8px)',
                    opacity: isSelected ? 0.8 : 0.4,
                    animation: 'mpuGlowPulse 2s ease-in-out infinite',
                  }}
                />
                {/* agent circle */}
                <div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: 40, height: 40,
                    background: `radial-gradient(circle at 35% 35%, ${agent.color}33, #0F172A)`,
                    border: `2px solid ${agent.color}`,
                    boxShadow: `0 0 15px ${agent.glowColor}`,
                  }}
                >
                  <div className="text-center">
                    <div className="text-xs font-black" style={{ color: agent.color, fontSize: 10 }}>
                      {agent.code}
                    </div>
                  </div>
                </div>
                {/* agent name label */}
                <div
                  className="absolute whitespace-nowrap text-center"
                  style={{
                    bottom: -14, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 8, color: agent.color, fontWeight: 600,
                    letterSpacing: '0.08em',
                    textShadow: '0 0 6px rgba(0,0,0,0.9)',
                  }}
                >
                  {agent.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── selected spawn detail overlay ───────────────────────────────── */}
      {selectedSpawnData && (
        <div
          className="absolute z-40 rounded-xl border p-4"
          style={{
            left: 24, bottom: 100,
            width: 280,
            background: 'rgba(15,23,42,0.95)',
            borderColor: CATEGORY_COLORS[selectedSpawnData.category].dot,
            backdropFilter: 'blur(16px)',
            animation: 'mpuFadeIn 0.3s ease',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[selectedSpawnData.category].dot }} />
              <span className="text-xs font-bold" style={{ color: '#E2E8F0' }}>{selectedSpawnData.name}</span>
            </div>
            <button onClick={() => setSelectedSpawn(null)}><X className="w-3 h-3" style={{ color: '#475569' }} /></button>
          </div>
          <div className="text-xs" style={{ color: '#64748B' }}>Stage {selectedSpawnData.stage}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedSpawnData.connections.map(c => (
              <span key={c} className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', fontSize: 10 }}>
                {c}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: selectedSpawnData.status === 'active' ? 'rgba(34,197,94,0.15)' : selectedSpawnData.status === 'building' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                color: selectedSpawnData.status === 'active' ? '#22C55E' : selectedSpawnData.status === 'building' ? '#F59E0B' : '#64748B',
              }}
            >
              {selectedSpawnData.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* ── selected agent detail overlay ───────────────────────────────── */}
      {selectedAgentData && (
        <div
          className="absolute z-40 rounded-xl border p-4"
          style={{
            left: 24, bottom: 100,
            width: 280,
            background: 'rgba(15,23,42,0.95)',
            borderColor: selectedAgentData.color,
            backdropFilter: 'blur(16px)',
            animation: 'mpuFadeIn 0.3s ease',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedAgentData.color }} />
              <span className="text-xs font-bold" style={{ color: '#E2E8F0' }}>{selectedAgentData.name} ({selectedAgentData.code})</span>
            </div>
            <button onClick={() => setSelectedAgent(null)}><X className="w-3 h-3" style={{ color: '#475569' }} /></button>
          </div>
          <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            <Zap className="w-3 h-3 inline mr-1" style={{ color: selectedAgentData.color }} />
            {selectedAgentData.currentTask}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xs" style={{ color: '#475569' }}>RPM</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: selectedAgentData.color }}>{formatNumber(selectedAgentData.rpm)}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-xs" style={{ color: '#475569' }}>Tokens</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: selectedAgentData.color }}>{formatNumber(selectedAgentData.tokensUsed)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── bottom metrics strip ───────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30"
        style={{
          background: 'linear-gradient(to top, rgba(5,5,7,0.98) 0%, rgba(5,5,7,0.9) 70%, transparent 100%)',
          padding: '24px 32px 20px',
        }}
      >
        <div className="flex items-end justify-between max-w-screen-2xl mx-auto">
          {/* metric cards */}
          {[
            { label: 'TOTAL RPM', value: formatNumber(Math.round(displayRpm)), color: '#60A5FA', icon: Activity },
            { label: 'TOKENS', value: formatNumber(displayTokens), color: '#A855F7', icon: Layers },
            { label: 'ACTIVE AGENTS', value: displayAgents.toString(), color: '#22C55E', icon: Cpu },
            { label: 'QUEUE DEPTH', value: queueDepth.toString(), color: queueDepth > 70 ? '#EF4444' : '#F59E0B', icon: Clock },
            { label: 'COST ($)', value: `$${displayCost.toFixed(2)}`, color: '#06B6D4', icon: Zap },
            { label: 'UPTIME', value: formatUptime(uptime), color: '#64748B', icon: Shield },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3" style={{ color }} />
                <span className="text-xs tracking-widest" style={{ color: '#475569', fontSize: 9 }}>{label}</span>
              </div>
              <span
                className="text-lg font-bold tabular-nums"
                style={{
                  color,
                  textShadow: `0 0 12px ${color}44`,
                  letterSpacing: '0.05em',
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          {Object.entries(CATEGORY_COLORS).map(([cat, cfg]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
              <span className="text-xs" style={{ color: '#475569', fontSize: 9 }}>{cfg.label}</span>
            </div>
          ))}
          <div className="w-px h-3" style={{ background: '#1E293B' }} />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-xs" style={{ color: '#475569', fontSize: 9 }}>Commands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-xs" style={{ color: '#475569', fontSize: 9 }}>Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs" style={{ color: '#475569', fontSize: 9 }}>Responses</span>
          </div>
        </div>
      </div>

      {/* ── right panel — live feed ─────────────────────────────────────── */}
      {showPanel && (
        <div
          className="absolute top-16 right-0 bottom-20 z-30 flex flex-col"
          style={{
            width: 340,
            background: 'linear-gradient(to left, rgba(5,5,7,0.98) 0%, rgba(5,5,7,0.92) 90%, transparent 100%)',
            animation: 'mpuFadeIn 0.3s ease',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1E293B' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
              <span className="text-xs font-bold tracking-widest" style={{ color: '#94A3B8' }}>LIVE FEED</span>
            </div>
            <button onClick={() => setShowPanel(false)}>
              <ChevronRight className="w-4 h-4" style={{ color: '#475569' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
            {events.map((event, i) => (
              <div
                key={event.id}
                className="py-2 border-b"
                style={{
                  borderColor: 'rgba(30,41,59,0.5)',
                  animation: i === 0 ? 'mpuFadeIn 0.4s ease' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs tabular-nums" style={{ color: '#334155', fontSize: 10 }}>{event.timestamp}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-bold"
                    style={{
                      fontSize: 9,
                      backgroundColor: `${TYPE_COLORS[event.type]}15`,
                      color: TYPE_COLORS[event.type],
                      letterSpacing: '0.05em',
                    }}
                  >
                    {event.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#94A3B8', lineHeight: 1.4 }}>
                  {event.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── vignette edges ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 25,
          boxShadow: 'inset 0 0 150px 50px rgba(5,5,7,0.7)',
        }}
      />
    </div>
  );
}
