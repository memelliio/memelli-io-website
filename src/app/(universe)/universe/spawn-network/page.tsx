'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

type SpawnStatus = 'active' | 'inactive' | 'building';
type SpawnCategory = 'infrastructure' | 'intelligence' | 'communication' | 'operations' | 'business';

interface SpawnConnector {
  target: string;
  type: 'data' | 'event' | 'command' | 'dependency';
}

interface Spawn {
  id: string;
  name: string;
  shortName: string;
  status: SpawnStatus;
  category: SpawnCategory;
  description: string;
  capabilities: string[];
  connectors: SpawnConnector[];
  implementationStatus: number;
  lastActivity: string;
  stage: number;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Spawn Data — All 25 Spawns                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

const SPAWNS: Spawn[] = [
  {
    id: 'core-doctrine', name: 'Core Doctrine Engine', shortName: 'Doctrine', status: 'active', category: 'infrastructure',
    description: 'Melli as CPU controller, 2 Claudes (internal/external), 6-level hierarchy, 5 memory layers, 10 managers, autonomy resolution order.',
    capabilities: ['Hierarchy enforcement', 'Memory layer management', 'Autonomy resolution', 'Manager coordination'],
    connectors: [{ target: 'wire-points', type: 'command' }, { target: 'queue-system', type: 'data' }, { target: 'system-identity', type: 'dependency' }],
    implementationStatus: 95, lastActivity: '2 min ago', stage: 1,
  },
  {
    id: 'wire-points', name: 'Wire Points Router', shortName: 'Wire Points', status: 'active', category: 'infrastructure',
    description: '2 wire points (Melli + Internal Claude), External Claude escalation, P1-P4 priority levels, 3 routing paths, 9-step closed loop.',
    capabilities: ['Priority routing', 'Escalation channels', 'Confidence gates', 'Communication rules'],
    connectors: [{ target: 'core-doctrine', type: 'dependency' }, { target: 'queue-system', type: 'command' }, { target: 'escalation-system', type: 'event' }],
    implementationStatus: 90, lastActivity: '1 min ago', stage: 3,
  },
  {
    id: 'queue-system', name: 'Central Queue System', shortName: 'Queues', status: 'active', category: 'infrastructure',
    description: 'Central intake + 22 department queues, 15 lifecycle states, 8 origin classes, dispatch authority, routing rules.',
    capabilities: ['Task intake', 'Department routing', 'Lifecycle tracking', 'Retry classification'],
    connectors: [{ target: 'worker-pools', type: 'command' }, { target: 'task-grid', type: 'data' }, { target: 'wire-points', type: 'event' }],
    implementationStatus: 88, lastActivity: '30 sec ago', stage: 4,
  },
  {
    id: 'worker-pools', name: 'Worker Pool Manager', shortName: 'Workers', status: 'active', category: 'operations',
    description: '11 instance states, 5 capacity classes, 7 staffing modes, 3 reset types, pool/reservation/backfill structures.',
    capabilities: ['Pool management', 'Capacity scaling', 'Backfill logic', 'Staffing modes'],
    connectors: [{ target: 'queue-system', type: 'dependency' }, { target: 'agent-factory', type: 'command' }, { target: 'energy-model', type: 'data' }],
    implementationStatus: 85, lastActivity: '45 sec ago', stage: 5,
  },
  {
    id: 'decomposition', name: 'Task Decomposition Engine', shortName: 'Decompose', status: 'active', category: 'intelligence',
    description: '14 decomposition objects, 7 decompose conditions, 6 skip conditions, 6 fanout types, authority levels.',
    capabilities: ['Task splitting', 'Fanout planning', 'Authority checking', 'Branch specification'],
    connectors: [{ target: 'queue-system', type: 'data' }, { target: 'task-grid', type: 'command' }, { target: 'worker-pools', type: 'event' }],
    implementationStatus: 82, lastActivity: '3 min ago', stage: 6,
  },
  {
    id: 'memory-system', name: 'Memory System', shortName: 'Memory', status: 'active', category: 'intelligence',
    description: '6 memory tiers, retrieval hierarchy, write permissions per role, promotion path, compression triggers, knowledge gap detection.',
    capabilities: ['Tiered storage', 'Knowledge retrieval', 'Gap detection', 'Memory promotion'],
    connectors: [{ target: 'core-doctrine', type: 'dependency' }, { target: 'growth-engine', type: 'data' }, { target: 'archive-engine', type: 'event' }],
    implementationStatus: 78, lastActivity: '5 min ago', stage: 7,
  },
  {
    id: 'patrol-grid', name: 'Patrol Grid', shortName: 'Patrol', status: 'active', category: 'operations',
    description: '8 patrol layers, 4 severity levels, 7 response actions, 6-step patrol cycle, incident mode, false positive controls.',
    capabilities: ['System patrol', 'Incident detection', 'Severity classification', 'Response actions'],
    connectors: [{ target: 'sensor-grid', type: 'data' }, { target: 'resilience', type: 'command' }, { target: 'escalation-system', type: 'event' }],
    implementationStatus: 80, lastActivity: '15 sec ago', stage: 8,
  },
  {
    id: 'escalation-system', name: 'Escalation System', shortName: 'Escalation', status: 'active', category: 'operations',
    description: '4 confidence levels, 5 escalation levels (Worker to Manager to Melli to Owner to External Claude), loop protection.',
    capabilities: ['Confidence gating', 'Priority classification', 'Loop protection', 'Escalation flow'],
    connectors: [{ target: 'wire-points', type: 'command' }, { target: 'owner-command', type: 'event' }, { target: 'patrol-grid', type: 'data' }],
    implementationStatus: 85, lastActivity: '2 min ago', stage: 9,
  },
  {
    id: 'deployops', name: 'DeployOps Grid', shortName: 'DeployOps', status: 'active', category: 'infrastructure',
    description: '8-step deployment workflow, 6 build checks, 5 health validations, rollback triggers, 6 self-repair actions.',
    capabilities: ['Build pipeline', 'Health validation', 'Rollback', 'Self-repair'],
    connectors: [{ target: 'self-deployment', type: 'command' }, { target: 'resilience', type: 'event' }, { target: 'patrol-grid', type: 'data' }],
    implementationStatus: 75, lastActivity: '10 min ago', stage: 10,
  },
  {
    id: 'security-grid', name: 'Security Grid', shortName: 'Security', status: 'active', category: 'infrastructure',
    description: '6 security domains, 4-step security flow, auth methods, fraud detection, threat response, incident workflow.',
    capabilities: ['Access verification', 'Threat detection', 'Fraud detection', 'Incident response'],
    connectors: [{ target: 'compliance', type: 'data' }, { target: 'escalation-system', type: 'event' }, { target: 'identity-access', type: 'dependency' }],
    implementationStatus: 72, lastActivity: '1 min ago', stage: 41,
  },
  {
    id: 'customer-lifecycle', name: 'Customer Lifecycle Engine', shortName: 'Lifecycle', status: 'active', category: 'business',
    description: '5 entry points, 5 case types, intake workflow, funding stages, case ownership, escalation paths.',
    capabilities: ['Case management', 'Intake workflow', 'Stage tracking', 'Pattern learning'],
    connectors: [{ target: 'revenue-engine', type: 'data' }, { target: 'communication-fabric', type: 'command' }, { target: 'crm-engine', type: 'event' }],
    implementationStatus: 70, lastActivity: '8 min ago', stage: 13,
  },
  {
    id: 'growth-engine', name: 'Growth Engine', shortName: 'Growth', status: 'active', category: 'intelligence',
    description: 'Autonomous knowledge capture, pattern detection, playbook promotion, automation candidates, self-improvement loop.',
    capabilities: ['Pattern detection', 'Playbook creation', 'Self-improvement', 'Knowledge gap analysis'],
    connectors: [{ target: 'memory-system', type: 'data' }, { target: 'market-intelligence', type: 'event' }, { target: 'sensor-grid', type: 'data' }],
    implementationStatus: 65, lastActivity: '12 min ago', stage: 15,
  },
  {
    id: 'sensor-grid', name: 'Sensor Grid', shortName: 'Sensors', status: 'active', category: 'operations',
    description: '6 sensor categories (system/user/infrastructure/market/security/communication), signal priority, anomaly detection.',
    capabilities: ['Signal collection', 'Anomaly detection', 'Priority routing', 'Pattern learning'],
    connectors: [{ target: 'patrol-grid', type: 'data' }, { target: 'escalation-system', type: 'event' }, { target: 'growth-engine', type: 'data' }],
    implementationStatus: 68, lastActivity: '5 sec ago', stage: 37,
  },
  {
    id: 'task-grid', name: 'Global Task Grid', shortName: 'Task Grid', status: 'active', category: 'operations',
    description: '7 lifecycle states, 7 task types, 4 priority levels, 11 department queues, batch submission, load balancing.',
    capabilities: ['Task distribution', 'Load balancing', 'Dependency tracking', 'Retry escalation'],
    connectors: [{ target: 'queue-system', type: 'dependency' }, { target: 'worker-pools', type: 'command' }, { target: 'decomposition', type: 'data' }],
    implementationStatus: 80, lastActivity: '20 sec ago', stage: 36,
  },
  {
    id: 'agent-factory', name: 'Agent Factory', shortName: 'Factory', status: 'active', category: 'operations',
    description: '13 agent pools, 6-step creation pipeline, role templates, batch spawn, auto-scale from queue depths.',
    capabilities: ['Agent spawning', 'Pool management', 'Auto-scaling', 'Performance tracking'],
    connectors: [{ target: 'worker-pools', type: 'command' }, { target: 'energy-model', type: 'data' }, { target: 'task-grid', type: 'event' }],
    implementationStatus: 75, lastActivity: '3 min ago', stage: 35,
  },
  {
    id: 'communication-fabric', name: 'Communication Fabric', shortName: 'Comms', status: 'active', category: 'communication',
    description: '7 channels (voice/sms/email/live_chat/ai_chat/dashboard/social), conversation threads, cross-channel sync.',
    capabilities: ['Omnichannel routing', 'Thread management', 'Template rendering', 'Sequence automation'],
    connectors: [{ target: 'customer-lifecycle', type: 'data' }, { target: 'market-intelligence', type: 'event' }, { target: 'jessica-voice', type: 'command' }],
    implementationStatus: 60, lastActivity: '6 min ago', stage: 29,
  },
  {
    id: 'revenue-engine', name: 'Revenue Engine', shortName: 'Revenue', status: 'active', category: 'business',
    description: '10 revenue sources, 6-stage opportunity pipeline, 4 service pipelines, cross-sell rules, LTV tracking.',
    capabilities: ['Pipeline management', 'Attribution', 'Revenue forecasting', 'Conversion tracking'],
    connectors: [{ target: 'customer-lifecycle', type: 'data' }, { target: 'affiliate-engine', type: 'event' }, { target: 'market-intelligence', type: 'data' }],
    implementationStatus: 55, lastActivity: '15 min ago', stage: 24,
  },
  {
    id: 'market-intelligence', name: 'Market Intelligence', shortName: 'Market Intel', status: 'building', category: 'intelligence',
    description: 'Signal detection across 4 source types, keyword monitoring, 7-step lead pipeline, scoring, outreach channels.',
    capabilities: ['Signal detection', 'Lead scoring', 'Keyword monitoring', 'Outreach automation'],
    connectors: [{ target: 'growth-engine', type: 'data' }, { target: 'revenue-engine', type: 'event' }, { target: 'communication-fabric', type: 'command' }],
    implementationStatus: 40, lastActivity: '1 hr ago', stage: 23,
  },
  {
    id: 'compliance', name: 'Trust & Compliance Engine', shortName: 'Compliance', status: 'active', category: 'business',
    description: '5 trust principles, 6 compliance domains, consent management, risk detection, audit trails, trust metrics.',
    capabilities: ['Consent tracking', 'Audit logging', 'Risk detection', 'Legal escalation'],
    connectors: [{ target: 'security-grid', type: 'dependency' }, { target: 'customer-lifecycle', type: 'data' }, { target: 'owner-command', type: 'event' }],
    implementationStatus: 50, lastActivity: '20 min ago', stage: 28,
  },
  {
    id: 'energy-model', name: 'Energy Model', shortName: 'Energy', status: 'active', category: 'infrastructure',
    description: '5 resource categories, 5-phase energy lifecycle, 4 priority tiers, throttle mechanisms, per-agent budgets.',
    capabilities: ['Resource allocation', 'Throttling', 'Budget enforcement', 'Capacity forecasting'],
    connectors: [{ target: 'worker-pools', type: 'data' }, { target: 'agent-factory', type: 'command' }, { target: 'resilience', type: 'event' }],
    implementationStatus: 60, lastActivity: '1 min ago', stage: 40,
  },
  {
    id: 'resilience', name: 'Resilience Engine', shortName: 'Resilience', status: 'active', category: 'infrastructure',
    description: '6 failure types, health checks, 8 repair actions, 4 incident severity levels, redundancy strategies, stress tests.',
    capabilities: ['Self-healing', 'Incident tracking', 'Queue overload response', 'Stress testing'],
    connectors: [{ target: 'patrol-grid', type: 'data' }, { target: 'deployops', type: 'command' }, { target: 'energy-model', type: 'event' }],
    implementationStatus: 70, lastActivity: '4 min ago', stage: 25,
  },
  {
    id: 'time-engine', name: 'Time Engine', shortName: 'Time', status: 'active', category: 'operations',
    description: '6-step temporal lifecycle, 5 event types, 7 recurring intervals, temporal queue, recovery process.',
    capabilities: ['Event scheduling', 'Recurring jobs', 'Recovery processing', 'Timing accuracy'],
    connectors: [{ target: 'queue-system', type: 'command' }, { target: 'task-grid', type: 'event' }, { target: 'patrol-grid', type: 'data' }],
    implementationStatus: 65, lastActivity: '10 sec ago', stage: 39,
  },
  {
    id: 'self-deployment', name: 'Self-Deployment Grid', shortName: 'Self-Deploy', status: 'building', category: 'infrastructure',
    description: 'Continuous build system, 7-step deployment pipeline, 5 deployment sources, 6 infrastructure types, autonomous expansion.',
    capabilities: ['Build management', 'Pipeline execution', 'Health checks', 'Autonomous scaling'],
    connectors: [{ target: 'deployops', type: 'dependency' }, { target: 'expansion-protocol', type: 'command' }, { target: 'resilience', type: 'event' }],
    implementationStatus: 35, lastActivity: '2 hr ago', stage: 33,
  },
  {
    id: 'expansion-protocol', name: 'Expansion Protocol', shortName: 'Expansion', status: 'building', category: 'business',
    description: '7-step expansion sequence, 5 expansion types, 5 replication components, venture lifecycle management.',
    capabilities: ['Opportunity detection', 'Venture replication', 'Optimization', 'Retirement procedures'],
    connectors: [{ target: 'self-deployment', type: 'dependency' }, { target: 'revenue-engine', type: 'data' }, { target: 'market-intelligence', type: 'event' }],
    implementationStatus: 25, lastActivity: '3 hr ago', stage: 42,
  },
  {
    id: 'owner-command', name: 'Owner Command Layer', shortName: 'Owner CMD', status: 'active', category: 'communication',
    description: 'Supreme Authority layer. SMS/dashboard/voice input, confirmation gates, emergency override, preference learning.',
    capabilities: ['Command intake', 'Approval gates', 'Emergency override', 'Preference learning'],
    connectors: [{ target: 'escalation-system', type: 'dependency' }, { target: 'core-doctrine', type: 'command' }, { target: 'communication-fabric', type: 'data' }],
    implementationStatus: 80, lastActivity: '30 sec ago', stage: 30,
  },
  {
    id: 'jessica-voice', name: 'Melli Voice Interface', shortName: 'Melli', status: 'active', category: 'communication',
    description: 'Deepgram Aurora voice, 5 voice states, wake word activation, conversational SMS, globe animation sync.',
    capabilities: ['Voice recognition', 'Speech synthesis', 'Wake word', 'State management'],
    connectors: [{ target: 'owner-command', type: 'event' }, { target: 'communication-fabric', type: 'data' }, { target: 'core-doctrine', type: 'dependency' }],
    implementationStatus: 70, lastActivity: '1 min ago', stage: 12,
  },
  {
    id: 'archive-engine', name: 'Archive Engine', shortName: 'Archive', status: 'inactive', category: 'intelligence',
    description: 'Eternal memory vault, knowledge preservation, version history, compressed storage.',
    capabilities: ['Knowledge archival', 'Version history', 'Compressed storage', 'Retrieval'],
    connectors: [{ target: 'memory-system', type: 'dependency' }, { target: 'growth-engine', type: 'data' }],
    implementationStatus: 20, lastActivity: '1 day ago', stage: 43,
  },
  {
    id: 'identity-access', name: 'Identity & Access Control', shortName: 'IAM', status: 'active', category: 'infrastructure',
    description: 'Identity types, RBAC, permission inheritance, workspace access, agent boundaries, audit logging.',
    capabilities: ['Authentication', 'Authorization', 'Permission inheritance', 'Audit logging'],
    connectors: [{ target: 'security-grid', type: 'dependency' }, { target: 'compliance', type: 'data' }, { target: 'owner-command', type: 'event' }],
    implementationStatus: 75, lastActivity: '2 min ago', stage: 11,
  },
  {
    id: 'crm-engine', name: 'CRM Engine', shortName: 'CRM', status: 'active', category: 'business',
    description: 'Pipelines, deals, contacts, communications, custom fields. Full customer relationship management.',
    capabilities: ['Pipeline management', 'Contact tracking', 'Deal management', 'Custom fields'],
    connectors: [{ target: 'customer-lifecycle', type: 'data' }, { target: 'communication-fabric', type: 'command' }, { target: 'revenue-engine', type: 'event' }],
    implementationStatus: 60, lastActivity: '10 min ago', stage: 14,
  },
  {
    id: 'affiliate-engine', name: 'Affiliate Network Engine', shortName: 'Affiliates', status: 'building', category: 'business',
    description: 'Referral tracking, commission logic, partner dashboards, attribution preservation, Infinity network.',
    capabilities: ['Referral tracking', 'Commission calculation', 'Partner portals', 'Attribution'],
    connectors: [{ target: 'revenue-engine', type: 'data' }, { target: 'customer-lifecycle', type: 'event' }, { target: 'identity-access', type: 'dependency' }],
    implementationStatus: 30, lastActivity: '5 hr ago', stage: 22,
  },
  {
    id: 'system-identity', name: 'System Identity Core', shortName: 'Identity', status: 'active', category: 'infrastructure',
    description: 'WHO the system is — MEMELLI_UNIVERSE. Melli as CPU governor, coherence checks, identity propagation.',
    capabilities: ['Identity enforcement', 'Coherence checking', 'Propagation', 'Autonomy boundaries'],
    connectors: [{ target: 'core-doctrine', type: 'dependency' }, { target: 'security-grid', type: 'data' }, { target: 'jessica-voice', type: 'event' }],
    implementationStatus: 90, lastActivity: '1 min ago', stage: 38,
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Color Config                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

const CATEGORY_COLORS: Record<SpawnCategory, { fill: string; stroke: string; glow: string; text: string; hex: string }> = {
  infrastructure: { fill: '#3b82f6', stroke: '#60a5fa', glow: '#3b82f620', text: 'text-blue-400', hex: '#3b82f6' },
  intelligence:   { fill: '#3b82f6', stroke: '#c084fc', glow: '#3b82f620', text: 'text-primary', hex: '#3b82f6' },
  communication:  { fill: '#22c55e', stroke: '#4ade80', glow: '#22c55e20', text: 'text-green-400', hex: '#22c55e' },
  operations:     { fill: '#f59e0b', stroke: '#fbbf24', glow: '#f59e0b20', text: 'text-amber-400', hex: '#f59e0b' },
  business:       { fill: '#10b981', stroke: '#34d399', glow: '#10b98120', text: 'text-emerald-400', hex: '#10b981' },
};

const STATUS_COLORS: Record<SpawnStatus, string> = {
  active: '#22c55e',
  building: '#eab308',
  inactive: '#71717a',
};

const CONNECTOR_COLORS: Record<string, string> = {
  data: '#3b82f6',
  event: '#f59e0b',
  command: '#ef4444',
  dependency: '#71717a',
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Layout Engine — concentric rings                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

interface NodePosition {
  x: number;
  y: number;
  spawn: Spawn;
}

function computeLayout(width: number, height: number): { center: { x: number; y: number }; nodes: NodePosition[] } {
  const cx = width / 2;
  const cy = height / 2;

  // Sort spawns: core-doctrine center, then by category rings
  const categoryOrder: SpawnCategory[] = ['infrastructure', 'intelligence', 'communication', 'operations', 'business'];
  const grouped: Record<SpawnCategory, Spawn[]> = {
    infrastructure: [], intelligence: [], communication: [], operations: [], business: [],
  };

  const orchestrator = SPAWNS.find(s => s.id === 'core-doctrine')!;
  for (const s of SPAWNS) {
    if (s.id !== 'core-doctrine') {
      grouped[s.category].push(s);
    }
  }

  // Ring 1: infrastructure (closest to center)
  // Ring 2: intelligence + operations
  // Ring 3: communication + business
  const ring1 = grouped.infrastructure;
  const ring2 = [...grouped.intelligence, ...grouped.operations];
  const ring3 = [...grouped.communication, ...grouped.business];

  const minDim = Math.min(width, height);
  const r1 = minDim * 0.18;
  const r2 = minDim * 0.32;
  const r3 = minDim * 0.44;

  const nodes: NodePosition[] = [];

  // Center node
  nodes.push({ x: cx, y: cy, spawn: orchestrator });

  // Place ring nodes
  const placeRing = (spawns: Spawn[], radius: number, offsetAngle: number) => {
    const count = spawns.length;
    if (count === 0) return;
    const step = (Math.PI * 2) / count;
    spawns.forEach((s, i) => {
      const angle = offsetAngle + step * i;
      nodes.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        spawn: s,
      });
    });
  };

  placeRing(ring1, r1, -Math.PI / 2);
  placeRing(ring2, r2, -Math.PI / 3);
  placeRing(ring3, r3, -Math.PI / 4);

  return { center: { x: cx, y: cy }, nodes };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SVG Components                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function PulsingEdge({
  x1, y1, x2, y2, color, speed, id,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; speed: number; id: string;
}) {
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  return (
    <g>
      {/* Base line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} strokeOpacity={0.15} />
      {/* Animated pulse */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={1.5} strokeOpacity={0.6}
        strokeDasharray={`${length * 0.15} ${length * 0.85}`}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={length}
          to={0}
          dur={`${speed}s`}
          repeatCount="indefinite"
        />
      </line>
    </g>
  );
}

function GlowNode({
  x, y, spawn, isSelected, isHovered, onSelect, onHover, onLeave, nodeRadius,
}: {
  x: number; y: number; spawn: Spawn; isSelected: boolean; isHovered: boolean;
  onSelect: () => void; onHover: () => void; onLeave: () => void; nodeRadius: number;
}) {
  const colors = CATEGORY_COLORS[spawn.category];
  const statusColor = STATUS_COLORS[spawn.status];
  const isActive = spawn.status === 'active';
  const isCenter = spawn.id === 'core-doctrine';
  const r = isCenter ? nodeRadius * 1.6 : nodeRadius;

  return (
    <g
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow */}
      {isActive && (
        <circle cx={x} cy={y} r={r + 8} fill="none" stroke={colors.stroke} strokeWidth={1} strokeOpacity={0.15}>
          <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#E11D2E" strokeWidth={2} strokeOpacity={0.8}>
          <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={x} cy={y} r={r}
        fill={isCenter ? '#18181b' : '#09090b'}
        stroke={isHovered || isSelected ? colors.stroke : colors.fill}
        strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
        strokeOpacity={isHovered || isSelected ? 1 : 0.7}
      />

      {/* Inner fill gradient */}
      <circle
        cx={x} cy={y} r={r - 2}
        fill={colors.fill}
        fillOpacity={isCenter ? 0.25 : 0.12}
      />

      {/* Status indicator dot */}
      <circle cx={x + r * 0.6} cy={y - r * 0.6} r={3} fill={statusColor}>
        {spawn.status === 'building' && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Implementation arc */}
      {(() => {
        const arcR = r - 1;
        const pct = spawn.implementationStatus / 100;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + pct * Math.PI * 2;
        const largeArc = pct > 0.5 ? 1 : 0;
        const sx = x + arcR * Math.cos(startAngle);
        const sy = y + arcR * Math.sin(startAngle);
        const ex = x + arcR * Math.cos(endAngle);
        const ey = y + arcR * Math.sin(endAngle);
        return (
          <path
            d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} 1 ${ex} ${ey}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
        );
      })()}

      {/* Label */}
      <text
        x={x}
        y={y + r + 14}
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize={isCenter ? 12 : 10}
        fontWeight={isCenter ? 700 : 500}
        fontFamily="system-ui, sans-serif"
      >
        {spawn.shortName}
      </text>

      {/* Center label */}
      {isCenter && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fill={colors.stroke}
          fontSize={11}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          CORE
        </text>
      )}

      {/* Percentage inside */}
      {!isCenter && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fill="#d4d4d8"
          fontSize={9}
          fontWeight={600}
          fontFamily="monospace"
        >
          {spawn.implementationStatus}%
        </text>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Detail Panel                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function DetailPanel({ spawn, onClose }: { spawn: Spawn; onClose: () => void }) {
  const colors = CATEGORY_COLORS[spawn.category];
  const statusColor = STATUS_COLORS[spawn.status];
  const statusLabel = spawn.status === 'active' ? 'Active' : spawn.status === 'building' ? 'Building' : 'Inactive';

  return (
    <div className="absolute top-4 right-4 w-80 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-2xl z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.fill }} />
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{spawn.name}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors">
          <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Status + Stage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-xs font-medium" style={{ color: statusColor }}>{statusLabel}</span>
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">Stage {spawn.stage}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{spawn.description}</p>

        {/* Implementation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold">Implementation</span>
            <span className="text-xs font-mono" style={{ color: spawn.implementationStatus >= 80 ? '#22c55e' : spawn.implementationStatus >= 50 ? '#eab308' : '#ef4444' }}>
              {spawn.implementationStatus}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${spawn.implementationStatus}%`, backgroundColor: colors.fill }}
            />
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold block mb-2">Capabilities</span>
          <div className="flex flex-wrap gap-1.5">
            {spawn.capabilities.map((cap, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium border" style={{ color: colors.stroke, borderColor: colors.fill + '40', backgroundColor: colors.fill + '15' }}>
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Connectors */}
        <div>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold block mb-2">Connections</span>
          <div className="space-y-1.5">
            {spawn.connectors.map((conn, i) => {
              const target = SPAWNS.find(s => s.id === conn.target);
              const connColor = CONNECTOR_COLORS[conn.type];
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase" style={{ color: connColor, backgroundColor: connColor + '15' }}>
                    {conn.type}
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">{'->'}</span>
                  <span className="text-[hsl(var(--foreground))]">{target?.shortName ?? conn.target}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]">
          <Clock className="h-3 w-3" />
          Last activity: {spawn.lastActivity}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function SpawnNetworkPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation tick for background particles
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const layout = useMemo(() => computeLayout(dimensions.width, dimensions.height), [dimensions]);
  const nodeRadius = Math.max(16, Math.min(24, dimensions.width / 60));

  // Build edge list
  const edges = useMemo(() => {
    const nodeMap = new Map(layout.nodes.map(n => [n.spawn.id, n]));
    const edgeList: Array<{
      from: NodePosition; to: NodePosition; type: string; key: string;
    }> = [];
    const seen = new Set<string>();

    for (const node of layout.nodes) {
      for (const conn of node.spawn.connectors) {
        const target = nodeMap.get(conn.target);
        if (!target) continue;
        const key = [node.spawn.id, conn.target].sort().join('-') + '-' + conn.type;
        if (seen.has(key)) continue;
        seen.add(key);
        edgeList.push({ from: node, to: target, type: conn.type, key });
      }
    }
    return edgeList;
  }, [layout]);

  // Highlighted edges for selected/hovered node
  const highlightedSpawns = useMemo(() => {
    const focus = selectedId ?? hoveredId;
    if (!focus) return new Set<string>();
    const spawn = SPAWNS.find(s => s.id === focus);
    if (!spawn) return new Set<string>();
    const ids = new Set<string>([focus]);
    spawn.connectors.forEach(c => ids.add(c.target));
    SPAWNS.forEach(s => {
      if (s.connectors.some(c => c.target === focus)) ids.add(s.id);
    });
    return ids;
  }, [selectedId, hoveredId]);

  const focusId = selectedId ?? hoveredId;
  const selectedSpawn = selectedId ? SPAWNS.find(s => s.id === selectedId) ?? null : null;

  const stats = useMemo(() => ({
    active: SPAWNS.filter(s => s.status === 'active').length,
    building: SPAWNS.filter(s => s.status === 'building').length,
    inactive: SPAWNS.filter(s => s.status === 'inactive').length,
    connections: edges.length,
  }), [edges]);

  return (
    <div className="h-screen w-full bg-[#050507] text-[hsl(var(--foreground))] relative overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#E11D2E] animate-pulse" />
          <h1 className="text-sm font-bold tracking-wide text-[hsl(var(--foreground))]">SPAWN NETWORK</h1>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono ml-2">{SPAWNS.length} NODES / {stats.connections} EDGES</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-green-500" /> {stats.active} active
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> {stats.building} building
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--muted))]" /> {stats.inactive} offline
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg p-3">
        <span className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1">Categories</span>
        {(Object.entries(CATEGORY_COLORS) as [SpawnCategory, typeof CATEGORY_COLORS[SpawnCategory]][]).map(([cat, c]) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">{cat}</span>
          </div>
        ))}
        <div className="border-t border-[hsl(var(--border))] mt-1 pt-1.5">
          <span className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-1 block">Edge Types</span>
          {(Object.entries(CONNECTOR_COLORS)).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
          onClick={(e) => {
            if ((e.target as SVGElement).tagName === 'svg') setSelectedId(null);
          }}
        >
          <defs>
            {/* Radial gradient for background */}
            <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E11D2E" stopOpacity="0.03" />
              <stop offset="50%" stopColor="#E11D2E" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#050507" stopOpacity="0" />
            </radialGradient>

            {/* Ring guides */}
            <radialGradient id="ring-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <rect width={dimensions.width} height={dimensions.height} fill="url(#bg-glow)" />

          {/* Concentric ring guides */}
          {[0.18, 0.32, 0.44].map((ratio, i) => {
            const r = Math.min(dimensions.width, dimensions.height) * ratio;
            return (
              <circle
                key={i}
                cx={layout.center.x}
                cy={layout.center.y}
                r={r}
                fill="none"
                stroke="#ffffff"
                strokeWidth={0.5}
                strokeOpacity={0.04}
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Background grid dots */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={`dot-${i}`}
              cx={((i * 137.5) % dimensions.width)}
              cy={((i * 89.3 + 50) % dimensions.height)}
              r={0.8}
              fill="#ffffff"
              fillOpacity={0.03}
            />
          ))}

          {/* Edges */}
          {edges.map(edge => {
            const color = CONNECTOR_COLORS[edge.type] ?? '#71717a';
            const isFocused = focusId && (
              highlightedSpawns.has(edge.from.spawn.id) && highlightedSpawns.has(edge.to.spawn.id)
            );
            const dimmed = focusId && !isFocused;

            return (
              <g key={edge.key} opacity={dimmed ? 0.08 : 1}>
                <PulsingEdge
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  color={color}
                  speed={edge.type === 'command' ? 2 : edge.type === 'event' ? 2.5 : edge.type === 'data' ? 3.5 : 5}
                  id={edge.key}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {layout.nodes.map(node => {
            const dimmed = focusId && !highlightedSpawns.has(node.spawn.id);
            return (
              <g key={node.spawn.id} opacity={dimmed ? 0.2 : 1} style={{ transition: 'opacity 0.3s ease' }}>
                <GlowNode
                  x={node.x}
                  y={node.y}
                  spawn={node.spawn}
                  isSelected={selectedId === node.spawn.id}
                  isHovered={hoveredId === node.spawn.id}
                  onSelect={() => setSelectedId(selectedId === node.spawn.id ? null : node.spawn.id)}
                  onHover={() => setHoveredId(node.spawn.id)}
                  onLeave={() => setHoveredId(null)}
                  nodeRadius={nodeRadius}
                />
              </g>
            );
          })}
        </svg>

        {/* Detail panel */}
        {selectedSpawn && (
          <DetailPanel spawn={selectedSpawn} onClose={() => setSelectedId(null)} />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[10px] text-[hsl(var(--muted-foreground))] font-mono z-20">
        <span>MEMELLI UNIVERSE -- SPAWN NETWORK TOPOLOGY</span>
        <span>Click any node to inspect. Edges pulse with activity type.</span>
      </div>
    </div>
  );
}
