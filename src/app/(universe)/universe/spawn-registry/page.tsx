'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Cpu,
  Shield,
  Brain,
  Globe,
  Zap,
  Database,
  Layers,
  Eye,
  MessageSquare,
  Rocket,
  Wrench,
  Users,
  BarChart3,
  Lock,
  Clock,
  Link2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plug,
  Network,
  Workflow,
  Box,
  Cog,
} from 'lucide-react';

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
  implementationStatus: number; // 0-100
  lastActivity: string;
  stage: number;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Spawn Data — All 25 Spawns                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

const SPAWNS: Spawn[] = [
  {
    id: 'core-doctrine',
    name: 'Core Doctrine Engine',
    shortName: 'Doctrine',
    status: 'active',
    category: 'infrastructure',
    description: 'Melli as CPU controller, 2 Claudes (internal/external), 6-level hierarchy, 5 memory layers, 10 managers, autonomy resolution order.',
    capabilities: ['Hierarchy enforcement', 'Memory layer management', 'Autonomy resolution', 'Manager coordination'],
    connectors: [
      { target: 'wire-points', type: 'command' },
      { target: 'queue-system', type: 'data' },
      { target: 'system-identity', type: 'dependency' },
    ],
    implementationStatus: 95,
    lastActivity: '2 min ago',
    stage: 1,
  },
  {
    id: 'wire-points',
    name: 'Wire Points Router',
    shortName: 'Wire Points',
    status: 'active',
    category: 'infrastructure',
    description: '2 wire points (Melli + Internal Claude), External Claude escalation, P1-P4 priority levels, 3 routing paths, 9-step closed loop.',
    capabilities: ['Priority routing', 'Escalation channels', 'Confidence gates', 'Communication rules'],
    connectors: [
      { target: 'core-doctrine', type: 'dependency' },
      { target: 'queue-system', type: 'command' },
      { target: 'escalation-system', type: 'event' },
    ],
    implementationStatus: 90,
    lastActivity: '1 min ago',
    stage: 3,
  },
  {
    id: 'queue-system',
    name: 'Central Queue System',
    shortName: 'Queues',
    status: 'active',
    category: 'infrastructure',
    description: 'Central intake + 22 department queues, 15 lifecycle states, 8 origin classes, dispatch authority, routing rules.',
    capabilities: ['Task intake', 'Department routing', 'Lifecycle tracking', 'Retry classification'],
    connectors: [
      { target: 'worker-pools', type: 'command' },
      { target: 'task-grid', type: 'data' },
      { target: 'wire-points', type: 'event' },
    ],
    implementationStatus: 88,
    lastActivity: '30 sec ago',
    stage: 4,
  },
  {
    id: 'worker-pools',
    name: 'Worker Pool Manager',
    shortName: 'Workers',
    status: 'active',
    category: 'operations',
    description: '11 instance states, 5 capacity classes, 7 staffing modes, 3 reset types, pool/reservation/backfill structures.',
    capabilities: ['Pool management', 'Capacity scaling', 'Backfill logic', 'Staffing modes'],
    connectors: [
      { target: 'queue-system', type: 'dependency' },
      { target: 'agent-factory', type: 'command' },
      { target: 'energy-model', type: 'data' },
    ],
    implementationStatus: 85,
    lastActivity: '45 sec ago',
    stage: 5,
  },
  {
    id: 'decomposition',
    name: 'Task Decomposition Engine',
    shortName: 'Decompose',
    status: 'active',
    category: 'intelligence',
    description: '14 decomposition objects, 7 decompose conditions, 6 skip conditions, 6 fanout types, authority levels.',
    capabilities: ['Task splitting', 'Fanout planning', 'Authority checking', 'Branch specification'],
    connectors: [
      { target: 'queue-system', type: 'data' },
      { target: 'task-grid', type: 'command' },
      { target: 'worker-pools', type: 'event' },
    ],
    implementationStatus: 82,
    lastActivity: '3 min ago',
    stage: 6,
  },
  {
    id: 'memory-system',
    name: 'Memory System',
    shortName: 'Memory',
    status: 'active',
    category: 'intelligence',
    description: '6 memory tiers, retrieval hierarchy, write permissions per role, promotion path, compression triggers, knowledge gap detection.',
    capabilities: ['Tiered storage', 'Knowledge retrieval', 'Gap detection', 'Memory promotion'],
    connectors: [
      { target: 'core-doctrine', type: 'dependency' },
      { target: 'growth-engine', type: 'data' },
      { target: 'archive-engine', type: 'event' },
    ],
    implementationStatus: 78,
    lastActivity: '5 min ago',
    stage: 7,
  },
  {
    id: 'patrol-grid',
    name: 'Patrol Grid',
    shortName: 'Patrol',
    status: 'active',
    category: 'operations',
    description: '8 patrol layers, 4 severity levels, 7 response actions, 6-step patrol cycle, incident mode, false positive controls.',
    capabilities: ['System patrol', 'Incident detection', 'Severity classification', 'Response actions'],
    connectors: [
      { target: 'sensor-grid', type: 'data' },
      { target: 'resilience', type: 'command' },
      { target: 'escalation-system', type: 'event' },
    ],
    implementationStatus: 80,
    lastActivity: '15 sec ago',
    stage: 8,
  },
  {
    id: 'escalation-system',
    name: 'Escalation System',
    shortName: 'Escalation',
    status: 'active',
    category: 'operations',
    description: '4 confidence levels, 5 escalation levels (Worker to Manager to Melli to Owner to External Claude), loop protection.',
    capabilities: ['Confidence gating', 'Priority classification', 'Loop protection', 'Escalation flow'],
    connectors: [
      { target: 'wire-points', type: 'command' },
      { target: 'owner-command', type: 'event' },
      { target: 'patrol-grid', type: 'data' },
    ],
    implementationStatus: 85,
    lastActivity: '2 min ago',
    stage: 9,
  },
  {
    id: 'deployops',
    name: 'DeployOps Grid',
    shortName: 'DeployOps',
    status: 'active',
    category: 'infrastructure',
    description: '8-step deployment workflow, 6 build checks, 5 health validations, rollback triggers, 6 self-repair actions.',
    capabilities: ['Build pipeline', 'Health validation', 'Rollback', 'Self-repair'],
    connectors: [
      { target: 'self-deployment', type: 'command' },
      { target: 'resilience', type: 'event' },
      { target: 'patrol-grid', type: 'data' },
    ],
    implementationStatus: 75,
    lastActivity: '10 min ago',
    stage: 10,
  },
  {
    id: 'security-grid',
    name: 'Security Grid',
    shortName: 'Security',
    status: 'active',
    category: 'infrastructure',
    description: '6 security domains, 4-step security flow, auth methods, fraud detection, threat response, incident workflow.',
    capabilities: ['Access verification', 'Threat detection', 'Fraud detection', 'Incident response'],
    connectors: [
      { target: 'compliance', type: 'data' },
      { target: 'escalation-system', type: 'event' },
      { target: 'identity-access', type: 'dependency' },
    ],
    implementationStatus: 72,
    lastActivity: '1 min ago',
    stage: 41,
  },
  {
    id: 'customer-lifecycle',
    name: 'Customer Lifecycle Engine',
    shortName: 'Lifecycle',
    status: 'active',
    category: 'business',
    description: '5 entry points, 5 case types, intake workflow, funding stages, case ownership, escalation paths.',
    capabilities: ['Case management', 'Intake workflow', 'Stage tracking', 'Pattern learning'],
    connectors: [
      { target: 'revenue-engine', type: 'data' },
      { target: 'communication-fabric', type: 'command' },
      { target: 'crm-engine', type: 'event' },
    ],
    implementationStatus: 70,
    lastActivity: '8 min ago',
    stage: 13,
  },
  {
    id: 'growth-engine',
    name: 'Growth Engine',
    shortName: 'Growth',
    status: 'active',
    category: 'intelligence',
    description: 'Autonomous knowledge capture, pattern detection, playbook promotion, automation candidates, self-improvement loop.',
    capabilities: ['Pattern detection', 'Playbook creation', 'Self-improvement', 'Knowledge gap analysis'],
    connectors: [
      { target: 'memory-system', type: 'data' },
      { target: 'market-intelligence', type: 'event' },
      { target: 'sensor-grid', type: 'data' },
    ],
    implementationStatus: 65,
    lastActivity: '12 min ago',
    stage: 15,
  },
  {
    id: 'sensor-grid',
    name: 'Sensor Grid',
    shortName: 'Sensors',
    status: 'active',
    category: 'operations',
    description: '6 sensor categories (system/user/infrastructure/market/security/communication), signal priority, anomaly detection.',
    capabilities: ['Signal collection', 'Anomaly detection', 'Priority routing', 'Pattern learning'],
    connectors: [
      { target: 'patrol-grid', type: 'data' },
      { target: 'escalation-system', type: 'event' },
      { target: 'growth-engine', type: 'data' },
    ],
    implementationStatus: 68,
    lastActivity: '5 sec ago',
    stage: 37,
  },
  {
    id: 'task-grid',
    name: 'Global Task Grid',
    shortName: 'Task Grid',
    status: 'active',
    category: 'operations',
    description: '7 lifecycle states, 7 task types, 4 priority levels, 11 department queues, batch submission, load balancing.',
    capabilities: ['Task distribution', 'Load balancing', 'Dependency tracking', 'Retry escalation'],
    connectors: [
      { target: 'queue-system', type: 'dependency' },
      { target: 'worker-pools', type: 'command' },
      { target: 'decomposition', type: 'data' },
    ],
    implementationStatus: 80,
    lastActivity: '20 sec ago',
    stage: 36,
  },
  {
    id: 'agent-factory',
    name: 'Agent Factory',
    shortName: 'Factory',
    status: 'active',
    category: 'operations',
    description: '13 agent pools, 6-step creation pipeline, role templates, batch spawn, auto-scale from queue depths.',
    capabilities: ['Agent spawning', 'Pool management', 'Auto-scaling', 'Performance tracking'],
    connectors: [
      { target: 'worker-pools', type: 'command' },
      { target: 'energy-model', type: 'data' },
      { target: 'task-grid', type: 'event' },
    ],
    implementationStatus: 75,
    lastActivity: '3 min ago',
    stage: 35,
  },
  {
    id: 'communication-fabric',
    name: 'Communication Fabric',
    shortName: 'Comms',
    status: 'active',
    category: 'communication',
    description: '7 channels (voice/sms/email/live_chat/ai_chat/dashboard/social), conversation threads, cross-channel sync.',
    capabilities: ['Omnichannel routing', 'Thread management', 'Template rendering', 'Sequence automation'],
    connectors: [
      { target: 'customer-lifecycle', type: 'data' },
      { target: 'market-intelligence', type: 'event' },
      { target: 'jessica-voice', type: 'command' },
    ],
    implementationStatus: 60,
    lastActivity: '6 min ago',
    stage: 29,
  },
  {
    id: 'revenue-engine',
    name: 'Revenue Engine',
    shortName: 'Revenue',
    status: 'active',
    category: 'business',
    description: '10 revenue sources, 6-stage opportunity pipeline, 4 service pipelines, cross-sell rules, LTV tracking.',
    capabilities: ['Pipeline management', 'Attribution', 'Revenue forecasting', 'Conversion tracking'],
    connectors: [
      { target: 'customer-lifecycle', type: 'data' },
      { target: 'affiliate-engine', type: 'event' },
      { target: 'market-intelligence', type: 'data' },
    ],
    implementationStatus: 55,
    lastActivity: '15 min ago',
    stage: 24,
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    shortName: 'Market Intel',
    status: 'building',
    category: 'intelligence',
    description: 'Signal detection across 4 source types, keyword monitoring, 7-step lead pipeline, scoring, outreach channels.',
    capabilities: ['Signal detection', 'Lead scoring', 'Keyword monitoring', 'Outreach automation'],
    connectors: [
      { target: 'growth-engine', type: 'data' },
      { target: 'revenue-engine', type: 'event' },
      { target: 'communication-fabric', type: 'command' },
    ],
    implementationStatus: 40,
    lastActivity: '1 hr ago',
    stage: 23,
  },
  {
    id: 'compliance',
    name: 'Trust & Compliance Engine',
    shortName: 'Compliance',
    status: 'active',
    category: 'business',
    description: '5 trust principles, 6 compliance domains, consent management, risk detection, audit trails, trust metrics.',
    capabilities: ['Consent tracking', 'Audit logging', 'Risk detection', 'Legal escalation'],
    connectors: [
      { target: 'security-grid', type: 'dependency' },
      { target: 'customer-lifecycle', type: 'data' },
      { target: 'owner-command', type: 'event' },
    ],
    implementationStatus: 50,
    lastActivity: '20 min ago',
    stage: 28,
  },
  {
    id: 'energy-model',
    name: 'Energy Model',
    shortName: 'Energy',
    status: 'active',
    category: 'infrastructure',
    description: '5 resource categories, 5-phase energy lifecycle, 4 priority tiers, throttle mechanisms, per-agent budgets.',
    capabilities: ['Resource allocation', 'Throttling', 'Budget enforcement', 'Capacity forecasting'],
    connectors: [
      { target: 'worker-pools', type: 'data' },
      { target: 'agent-factory', type: 'command' },
      { target: 'resilience', type: 'event' },
    ],
    implementationStatus: 60,
    lastActivity: '1 min ago',
    stage: 40,
  },
  {
    id: 'resilience',
    name: 'Resilience Engine',
    shortName: 'Resilience',
    status: 'active',
    category: 'infrastructure',
    description: '6 failure types, health checks, 8 repair actions, 4 incident severity levels, redundancy strategies, stress tests.',
    capabilities: ['Self-healing', 'Incident tracking', 'Queue overload response', 'Stress testing'],
    connectors: [
      { target: 'patrol-grid', type: 'data' },
      { target: 'deployops', type: 'command' },
      { target: 'energy-model', type: 'event' },
    ],
    implementationStatus: 70,
    lastActivity: '4 min ago',
    stage: 25,
  },
  {
    id: 'time-engine',
    name: 'Time Engine',
    shortName: 'Time',
    status: 'active',
    category: 'operations',
    description: '6-step temporal lifecycle, 5 event types, 7 recurring intervals, temporal queue, recovery process.',
    capabilities: ['Event scheduling', 'Recurring jobs', 'Recovery processing', 'Timing accuracy'],
    connectors: [
      { target: 'queue-system', type: 'command' },
      { target: 'task-grid', type: 'event' },
      { target: 'patrol-grid', type: 'data' },
    ],
    implementationStatus: 65,
    lastActivity: '10 sec ago',
    stage: 39,
  },
  {
    id: 'self-deployment',
    name: 'Self-Deployment Grid',
    shortName: 'Self-Deploy',
    status: 'building',
    category: 'infrastructure',
    description: 'Continuous build system, 7-step deployment pipeline, 5 deployment sources, 6 infrastructure types, autonomous expansion.',
    capabilities: ['Build management', 'Pipeline execution', 'Health checks', 'Autonomous scaling'],
    connectors: [
      { target: 'deployops', type: 'dependency' },
      { target: 'expansion-protocol', type: 'command' },
      { target: 'resilience', type: 'event' },
    ],
    implementationStatus: 35,
    lastActivity: '2 hr ago',
    stage: 33,
  },
  {
    id: 'expansion-protocol',
    name: 'Expansion Protocol',
    shortName: 'Expansion',
    status: 'building',
    category: 'business',
    description: '7-step expansion sequence, 5 expansion types, 5 replication components, venture lifecycle management.',
    capabilities: ['Opportunity detection', 'Venture replication', 'Optimization', 'Retirement procedures'],
    connectors: [
      { target: 'self-deployment', type: 'dependency' },
      { target: 'revenue-engine', type: 'data' },
      { target: 'market-intelligence', type: 'event' },
    ],
    implementationStatus: 25,
    lastActivity: '3 hr ago',
    stage: 42,
  },
  {
    id: 'owner-command',
    name: 'Owner Command Layer',
    shortName: 'Owner CMD',
    status: 'active',
    category: 'communication',
    description: 'Supreme Authority layer. SMS/dashboard/voice input, confirmation gates, emergency override, preference learning.',
    capabilities: ['Command intake', 'Approval gates', 'Emergency override', 'Preference learning'],
    connectors: [
      { target: 'escalation-system', type: 'dependency' },
      { target: 'core-doctrine', type: 'command' },
      { target: 'communication-fabric', type: 'data' },
    ],
    implementationStatus: 80,
    lastActivity: '30 sec ago',
    stage: 30,
  },
  {
    id: 'jessica-voice',
    name: 'Melli Voice Interface',
    shortName: 'Melli',
    status: 'active',
    category: 'communication',
    description: 'Deepgram Aurora voice, 5 voice states, wake word activation, conversational SMS, globe animation sync.',
    capabilities: ['Voice recognition', 'Speech synthesis', 'Wake word', 'State management'],
    connectors: [
      { target: 'owner-command', type: 'event' },
      { target: 'communication-fabric', type: 'data' },
      { target: 'core-doctrine', type: 'dependency' },
    ],
    implementationStatus: 70,
    lastActivity: '1 min ago',
    stage: 12,
  },
  {
    id: 'archive-engine',
    name: 'Archive Engine',
    shortName: 'Archive',
    status: 'inactive',
    category: 'intelligence',
    description: 'Eternal memory vault, knowledge preservation, version history, compressed storage.',
    capabilities: ['Knowledge archival', 'Version history', 'Compressed storage', 'Retrieval'],
    connectors: [
      { target: 'memory-system', type: 'dependency' },
      { target: 'growth-engine', type: 'data' },
    ],
    implementationStatus: 20,
    lastActivity: '1 day ago',
    stage: 43,
  },
  {
    id: 'identity-access',
    name: 'Identity & Access Control',
    shortName: 'IAM',
    status: 'active',
    category: 'infrastructure',
    description: 'Identity types, RBAC, permission inheritance, workspace access, agent boundaries, audit logging.',
    capabilities: ['Authentication', 'Authorization', 'Permission inheritance', 'Audit logging'],
    connectors: [
      { target: 'security-grid', type: 'dependency' },
      { target: 'compliance', type: 'data' },
      { target: 'owner-command', type: 'event' },
    ],
    implementationStatus: 75,
    lastActivity: '2 min ago',
    stage: 11,
  },
  {
    id: 'crm-engine',
    name: 'CRM Engine',
    shortName: 'CRM',
    status: 'active',
    category: 'business',
    description: 'Pipelines, deals, contacts, communications, custom fields. Full customer relationship management.',
    capabilities: ['Pipeline management', 'Contact tracking', 'Deal management', 'Custom fields'],
    connectors: [
      { target: 'customer-lifecycle', type: 'data' },
      { target: 'communication-fabric', type: 'command' },
      { target: 'revenue-engine', type: 'event' },
    ],
    implementationStatus: 60,
    lastActivity: '10 min ago',
    stage: 14,
  },
  {
    id: 'affiliate-engine',
    name: 'Affiliate Network Engine',
    shortName: 'Affiliates',
    status: 'building',
    category: 'business',
    description: 'Referral tracking, commission logic, partner dashboards, attribution preservation, Infinity network.',
    capabilities: ['Referral tracking', 'Commission calculation', 'Partner portals', 'Attribution'],
    connectors: [
      { target: 'revenue-engine', type: 'data' },
      { target: 'customer-lifecycle', type: 'event' },
      { target: 'identity-access', type: 'dependency' },
    ],
    implementationStatus: 30,
    lastActivity: '5 hr ago',
    stage: 22,
  },
  {
    id: 'system-identity',
    name: 'System Identity Core',
    shortName: 'Identity',
    status: 'active',
    category: 'infrastructure',
    description: 'WHO the system is — MEMELLI_UNIVERSE. Melli as CPU governor, coherence checks, identity propagation.',
    capabilities: ['Identity enforcement', 'Coherence checking', 'Propagation', 'Autonomy boundaries'],
    connectors: [
      { target: 'core-doctrine', type: 'dependency' },
      { target: 'security-grid', type: 'data' },
      { target: 'jessica-voice', type: 'event' },
    ],
    implementationStatus: 90,
    lastActivity: '1 min ago',
    stage: 38,
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Constants                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */

const CATEGORY_CONFIG: Record<SpawnCategory, { label: string; color: string; bg: string; border: string; badge: string; glow: string }> = {
  infrastructure: {
    label: 'Infrastructure',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300',
    glow: 'shadow-blue-500/20',
  },
  intelligence: {
    label: 'Intelligence',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    badge: 'bg-primary/20 text-primary/80',
    glow: 'shadow-purple-500/20',
  },
  communication: {
    label: 'Communication',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-300',
    glow: 'shadow-green-500/20',
  },
  operations: {
    label: 'Operations',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300',
    glow: 'shadow-amber-500/20',
  },
  business: {
    label: 'Business',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
};

const STATUS_CONFIG: Record<SpawnStatus, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'text-green-400', dot: 'bg-green-400' },
  inactive: { label: 'Inactive', color: 'text-[hsl(var(--muted-foreground))]', dot: 'bg-[hsl(var(--muted-foreground))]' },
  building: { label: 'Building', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
};

const CATEGORY_ICONS: Record<SpawnCategory, typeof Cpu> = {
  infrastructure: Database,
  intelligence: Brain,
  communication: MessageSquare,
  operations: Cog,
  business: BarChart3,
};

const CONNECTOR_TYPE_COLORS: Record<string, string> = {
  data: 'text-blue-400 bg-blue-500/10',
  event: 'text-amber-400 bg-amber-500/10',
  command: 'text-red-400 bg-red-500/10',
  dependency: 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/$1',
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Components                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function StatusDot({ status }: { status: SpawnStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
    </span>
  );
}

function ProgressBar({ value, category }: { value: number; category: SpawnCategory }) {
  const barColor =
    category === 'infrastructure' ? 'bg-blue-500' :
    category === 'intelligence' ? 'bg-primary/80' :
    category === 'communication' ? 'bg-green-500' :
    category === 'operations' ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <div className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SpawnCard({ spawn, isExpanded, onToggle }: { spawn: Spawn; isExpanded: boolean; onToggle: () => void }) {
  const catCfg = CATEGORY_CONFIG[spawn.category];
  const CatIcon = CATEGORY_ICONS[spawn.category];
  const connectedNames = spawn.connectors.map(c => {
    const target = SPAWNS.find(s => s.id === c.target);
    return target?.shortName ?? c.target;
  });

  return (
    <div
      className={`group relative rounded-xl border ${catCfg.border} ${catCfg.bg} transition-all duration-200 hover:shadow-lg hover:${catCfg.glow} ${
        isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-2' : ''
      }`}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 focus:outline-none focus:ring-1 focus:ring-[#E11D2E]/50 rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 p-2 rounded-lg ${catCfg.bg} border ${catCfg.border}`}>
              <CatIcon className={`h-5 w-5 ${catCfg.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{spawn.name}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Stage {spawn.stage}</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <StatusDot status={spawn.status} />
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>
        </div>

        {/* Connected spawns */}
        <div className="mt-3 flex flex-wrap gap-1">
          {connectedNames.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[10px] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
              <Link2 className="h-2.5 w-2.5" />
              {name}
            </span>
          ))}
        </div>

        {/* Progress + last activity */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[hsl(var(--muted-foreground))]">Implementation</span>
            <span className={`font-mono ${spawn.implementationStatus >= 80 ? 'text-green-400' : spawn.implementationStatus >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {spawn.implementationStatus}%
            </span>
          </div>
          <ProgressBar value={spawn.implementationStatus} category={spawn.category} />
          <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
            <Clock className="h-2.5 w-2.5" />
            {spawn.lastActivity}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[hsl(var(--border))] pt-3 space-y-4 animate-in fade-in duration-200">
          {/* Description */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Description</h4>
            <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed">{spawn.description}</p>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {spawn.capabilities.map((cap, i) => (
                <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-medium ${catCfg.badge}`}>
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Connectors */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Connectors</h4>
            <div className="space-y-1.5">
              {spawn.connectors.map((conn, i) => {
                const target = SPAWNS.find(s => s.id === conn.target);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${CONNECTOR_TYPE_COLORS[conn.type]}`}>
                      {conn.type}
                    </span>
                    <Plug className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--foreground))]">{target?.name ?? conn.target}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Implementation status bar */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            {spawn.implementationStatus >= 80 ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
            ) : spawn.implementationStatus >= 50 ? (
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            )}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {spawn.implementationStatus >= 80
                ? 'Production ready'
                : spawn.implementationStatus >= 50
                ? 'In progress — partial coverage'
                : 'Early development'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Page                                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function SpawnRegistryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SpawnCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SpawnStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SPAWNS.filter(s => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.shortName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.capabilities.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = SPAWNS.filter(s => s.status === 'active').length;
    const building = SPAWNS.filter(s => s.status === 'building').length;
    const inactive = SPAWNS.filter(s => s.status === 'inactive').length;
    const avgImpl = Math.round(SPAWNS.reduce((sum, s) => sum + s.implementationStatus, 0) / SPAWNS.length);
    return { total: SPAWNS.length, active, building, inactive, avgImpl };
  }, []);

  const categories: Array<{ key: SpawnCategory | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'infrastructure', label: 'Infrastructure' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'communication', label: 'Communication' },
    { key: 'operations', label: 'Operations' },
    { key: 'business', label: 'Business' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E11D2E]/10 border border-[#E11D2E]/30">
                <Network className="h-5 w-5 text-[#E11D2E]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">Spawn Registry</h1>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Memelli Universe — {stats.total} Spawns</p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                {stats.active} Active
              </span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                {stats.building} Building
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] text-xs font-medium border border-[hsl(var(--border))]">
                {stats.inactive} Inactive
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E11D2E]/10 text-[#E11D2E] text-xs font-mono border border-[#E11D2E]/20">
                {stats.avgImpl}% avg
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search spawns by name, capability, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[#E11D2E]/50 focus:border-[#E11D2E]/30"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as SpawnStatus | 'all')}
            className="px-3 py-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[#E11D2E]/50 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="building">Building</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const isActive = categoryFilter === cat.key;
            const catCfg = cat.key !== 'all' ? CATEGORY_CONFIG[cat.key] : null;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? cat.key === 'all'
                      ? 'bg-[#E11D2E]/10 text-[#E11D2E] border-[#E11D2E]/30'
                      : `${catCfg!.bg} ${catCfg!.color} ${catCfg!.border}`
                    : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
                }`}
              >
                {cat.label}
                {cat.key !== 'all' && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({SPAWNS.filter(s => s.category === cat.key).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No spawns match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(spawn => (
              <SpawnCard
                key={spawn.id}
                spawn={spawn}
                isExpanded={expandedId === spawn.id}
                onToggle={() => setExpandedId(expandedId === spawn.id ? null : spawn.id)}
              />
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div className="border-t border-[hsl(var(--border))] pt-4 flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
          <span>
            Showing {filtered.length} of {stats.total} spawns
          </span>
          <span className="font-mono">
            MEMELLI UNIVERSE v1.0 — Spawn Registry
          </span>
        </div>
      </div>
    </div>
  );
}
