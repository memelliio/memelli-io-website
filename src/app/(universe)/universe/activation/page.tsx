'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Play,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Circle,
  Bot,
  Building2,
  ShieldAlert,
  HeartPulse,
  Cpu,
  Bug,
  Wrench,
  Brain,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  ArrowRight,
  Shield,
  Database,
  Radar,
  Rocket,
  Eye,
} from 'lucide-react';
import { LoadingGlobe } from '@/components/ui/loading-globe';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

type PhaseStatus = 'not_started' | 'running' | 'passed' | 'failed' | 'warning';
type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
type HealthStatus = 'healthy' | 'degraded' | 'critical';

interface Phase {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  details?: string;
}

interface NarrativeEvent {
  id: string;
  time: string;
  phase: string;
  action: string;
  result: 'success' | 'failure' | 'warning' | 'info';
}

interface WorkforceRow {
  role: string;
  pool: string;
  section: string;
  current: number;
  floor: number;
  deficit: number;
  health: HealthStatus;
}

interface DeptCert {
  name: string;
  icon: React.ComponentType<any>;
  status: 'certified' | 'pending' | 'failed' | 'not_checked';
  lastChecked?: string;
  score?: number;
}

interface RunHistoryEntry {
  id: string;
  startedAt: string;
  duration: string;
  status: RunStatus;
  deficitsFound: number;
  deficitsCorrected: number;
  type: string;
}

interface ActivationState {
  status: RunStatus;
  percentComplete: number;
  activeAgents: number;
  departmentsTouched: number;
  criticalDeficits: number;
  healingActions: number;
  errorsDetected: number;
  selfHealStatus: 'active' | 'standby' | 'disabled';
  claudeUtilization: number;
  startedAt?: string;
  duration: string;
  environment: string;
  runType: string;
  phases: Phase[];
  narrative: NarrativeEvent[];
  workforce: WorkforceRow[];
  departments: DeptCert[];
  history: RunHistoryEntry[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Default / Mock State
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_PHASES: Phase[] = [
  { id: 'p1', name: 'Environment Validation', description: 'Verify env vars, DB, Redis connectivity', status: 'not_started' },
  { id: 'p2', name: 'Schema Integrity', description: 'Prisma schema sync check', status: 'not_started' },
  { id: 'p3', name: 'Agent Pool Bootstrap', description: 'Spin up all agent pools to floor capacity', status: 'not_started' },
  { id: 'p4', name: 'Queue Health', description: 'Verify all 9 BullMQ queues operational', status: 'not_started' },
  { id: 'p5', name: 'Workforce Census', description: 'Count agents per role, identify deficits', status: 'not_started' },
  { id: 'p6', name: 'Self-Heal Verification', description: 'Test auto-repair pathways', status: 'not_started' },
  { id: 'p7', name: 'Patrol Grid Activation', description: 'Activate patrol sweeps across all domains', status: 'not_started' },
  { id: 'p8', name: 'Security Perimeter', description: 'Validate auth, tenant isolation, API keys', status: 'not_started' },
  { id: 'p9', name: 'Integration Gateway', description: 'Test external API connections', status: 'not_started' },
  { id: 'p10', name: 'Final Certification', description: 'All-green confirmation + report generation', status: 'not_started' },
];

const DEFAULT_DEPARTMENTS: DeptCert[] = [
  { name: 'Deploy', icon: Rocket, status: 'not_checked' },
  { name: 'Patrol', icon: Radar, status: 'not_checked' },
  { name: 'Repair', icon: Wrench, status: 'not_checked' },
  { name: 'Security', icon: Shield, status: 'not_checked' },
  { name: 'Memory', icon: Database, status: 'not_checked' },
  { name: 'Internal Claude', icon: Brain, status: 'not_checked' },
];

const MOCK_WORKFORCE: WorkforceRow[] = [
  { role: 'Deploy Agent', pool: 'deploy-pool', section: 'Deploy', current: 8, floor: 10, deficit: 2, health: 'degraded' },
  { role: 'Patrol Sentinel', pool: 'patrol-pool', section: 'Patrol', current: 15, floor: 15, deficit: 0, health: 'healthy' },
  { role: 'Repair Agent', pool: 'repair-pool', section: 'Repair', current: 12, floor: 10, deficit: 0, health: 'healthy' },
  { role: 'Security Guard', pool: 'security-pool', section: 'Security', current: 5, floor: 8, deficit: 3, health: 'critical' },
  { role: 'Memory Clerk', pool: 'memory-pool', section: 'Memory', current: 6, floor: 6, deficit: 0, health: 'healthy' },
  { role: 'Claude Lane Worker', pool: 'claude-pool', section: 'Internal Claude', current: 3, floor: 4, deficit: 1, health: 'degraded' },
  { role: 'Content Generator', pool: 'content-pool', section: 'Deploy', current: 10, floor: 10, deficit: 0, health: 'healthy' },
  { role: 'CRM Agent', pool: 'crm-pool', section: 'Patrol', current: 7, floor: 8, deficit: 1, health: 'degraded' },
  { role: 'Commerce Agent', pool: 'commerce-pool', section: 'Deploy', current: 4, floor: 5, deficit: 1, health: 'degraded' },
  { role: 'Analytics Agent', pool: 'analytics-pool', section: 'Patrol', current: 6, floor: 6, deficit: 0, health: 'healthy' },
];

const MOCK_NARRATIVE: NarrativeEvent[] = [
  { id: 'n1', time: '14:32:01', phase: 'Environment Validation', action: 'Checked DATABASE_URL connectivity', result: 'success' },
  { id: 'n2', time: '14:32:02', phase: 'Environment Validation', action: 'Checked Redis connection', result: 'success' },
  { id: 'n3', time: '14:32:03', phase: 'Environment Validation', action: 'Verified API_URL reachable', result: 'success' },
  { id: 'n4', time: '14:32:05', phase: 'Schema Integrity', action: 'Prisma schema diff — 0 drift', result: 'success' },
  { id: 'n5', time: '14:32:08', phase: 'Agent Pool Bootstrap', action: 'deploy-pool: 8/10 agents online', result: 'warning' },
  { id: 'n6', time: '14:32:09', phase: 'Agent Pool Bootstrap', action: 'security-pool: 5/8 agents — deficit detected', result: 'failure' },
];

const MOCK_HISTORY: RunHistoryEntry[] = [
  { id: 'h1', startedAt: '2026-03-15 13:00', duration: '4m 32s', status: 'completed', deficitsFound: 3, deficitsCorrected: 3, type: 'Full Activation' },
  { id: 'h2', startedAt: '2026-03-14 09:15', duration: '2m 11s', status: 'completed', deficitsFound: 1, deficitsCorrected: 1, type: 'Quick Check' },
  { id: 'h3', startedAt: '2026-03-13 18:45', duration: '5m 03s', status: 'failed', deficitsFound: 7, deficitsCorrected: 4, type: 'Full Activation' },
];

function buildDefaultState(): ActivationState {
  return {
    status: 'idle',
    percentComplete: 0,
    activeAgents: 0,
    departmentsTouched: 0,
    criticalDeficits: 0,
    healingActions: 0,
    errorsDetected: 0,
    selfHealStatus: 'standby',
    claudeUtilization: 0,
    duration: '0s',
    environment: 'production',
    runType: 'full',
    phases: DEFAULT_PHASES,
    narrative: [],
    workforce: MOCK_WORKFORCE,
    departments: DEFAULT_DEPARTMENTS,
    history: MOCK_HISTORY,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function statusColor(s: PhaseStatus | RunStatus | HealthStatus | string) {
  switch (s) {
    case 'passed':
    case 'completed':
    case 'healthy':
    case 'certified':
    case 'success':
      return 'text-emerald-400';
    case 'running':
    case 'active':
      return 'text-sky-400';
    case 'warning':
    case 'degraded':
    case 'pending':
      return 'text-amber-400';
    case 'failed':
    case 'critical':
    case 'failure':
      return 'text-red-400';
    default:
      return 'text-[hsl(var(--muted-foreground))]';
  }
}

function statusBg(s: string) {
  switch (s) {
    case 'passed':
    case 'completed':
    case 'healthy':
    case 'certified':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'running':
    case 'active':
      return 'bg-sky-500/10 border-sky-500/20';
    case 'warning':
    case 'degraded':
    case 'pending':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'failed':
    case 'critical':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-[hsl(var(--muted))] border-[hsl(var(--border))]';
  }
}

function rowBg(health: HealthStatus) {
  switch (health) {
    case 'healthy':
      return 'bg-emerald-500/[0.03]';
    case 'degraded':
      return 'bg-amber-500/[0.05]';
    case 'critical':
      return 'bg-red-500/[0.05]';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'passed':
    case 'completed':
    case 'certified':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-sky-400 animate-spin" />;
    case 'failed':
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning':
    case 'degraded':
    case 'pending':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    default:
      return <Circle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════════════════ */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  accent?: string;
}) {
  const color = accent || 'text-[hsl(var(--muted-foreground))]';
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${color === 'text-[hsl(var(--muted-foreground))]' ? 'text-[hsl(var(--foreground))]' : color}`}>
        {value}
      </span>
    </Card>
  );
}

/* ─── Phase Stepper ─── */
function PhaseStepper({ phases }: { phases: Phase[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#E11D2E]" />
        Live Phase Tracker
      </h3>
      <div className="space-y-1">
        {phases.map((phase, idx) => {
          const isLast = idx === phases.length - 1;
          const isExp = expanded === phase.id;
          return (
            <div key={phase.id}>
              <button
                onClick={() => setExpanded(isExp ? null : phase.id)}
                className="w-full flex items-start gap-3 py-2 px-2 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors text-left"
              >
                {/* Stepper line + icon */}
                <div className="flex flex-col items-center mt-0.5">
                  <StatusIcon status={phase.status} />
                  {!isLast && <div className="w-px h-6 bg-[hsl(var(--muted))] mt-1" />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{phase.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wide ${statusBg(phase.status)} ${statusColor(phase.status)}`}
                    >
                      {phase.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">{phase.description}</p>
                </div>
                <div className="mt-1">
                  {isExp ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
              </button>
              {isExp && phase.details && (
                <div className="ml-10 mb-2 p-3 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[12px] text-[hsl(var(--muted-foreground))]">
                  {phase.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Narrative Feed ─── */
function NarrativeFeed({ events }: { events: NarrativeEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <Card className="p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4 text-[#E11D2E]" />
        Run Narrative
      </h3>
      <div ref={feedRef} className="flex-1 overflow-y-auto max-h-[400px] space-y-1 pr-1">
        {events.length === 0 ? (
          <p className="text-[12px] text-[hsl(var(--muted-foreground))] italic">No events yet. Start a run to see activity.</p>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono shrink-0 mt-0.5 w-16">{ev.time}</span>
              <StatusIcon status={ev.result} />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] mr-2">[{ev.phase}]</span>
                <span className="text-[12px] text-[hsl(var(--foreground))]">{ev.action}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/* ─── Workforce Grid ─── */
function WorkforceGrid({ rows }: { rows: WorkforceRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#E11D2E]" />
          Workforce Coverage
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-t border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">
              <th className="text-left px-5 py-2 font-medium">Role</th>
              <th className="text-left px-3 py-2 font-medium">Pool</th>
              <th className="text-left px-3 py-2 font-medium">Section</th>
              <th className="text-center px-3 py-2 font-medium">Current</th>
              <th className="text-center px-3 py-2 font-medium">Floor</th>
              <th className="text-center px-3 py-2 font-medium">Deficit</th>
              <th className="text-center px-3 py-2 font-medium">Health</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.role + row.pool} className={`border-b border-[hsl(var(--border))] ${rowBg(row.health)} transition-colors`}>
                <td className="px-5 py-2.5 font-medium text-[hsl(var(--foreground))]">{row.role}</td>
                <td className="px-3 py-2.5 text-[hsl(var(--muted-foreground))] font-mono">{row.pool}</td>
                <td className="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{row.section}</td>
                <td className="px-3 py-2.5 text-center text-[hsl(var(--foreground))] font-semibold">{row.current}</td>
                <td className="px-3 py-2.5 text-center text-[hsl(var(--muted-foreground))]">{row.floor}</td>
                <td className={`px-3 py-2.5 text-center font-semibold ${row.deficit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {row.deficit > 0 ? `-${row.deficit}` : '0'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBg(row.health)} ${statusColor(row.health)}`}>
                    <StatusIcon status={row.health} />
                    {row.health}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── Department Cards ─── */
function DepartmentCerts({ departments }: { departments: DeptCert[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#E11D2E]" />
        Department Certification
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {departments.map((dept) => {
          const Icon = dept.icon;
          return (
            <Card key={dept.name} className={`p-4 text-center border ${statusBg(dept.status)}`}>
              <div className="flex justify-center mb-2">
                <div className={`p-2 rounded-xl ${dept.status === 'certified' ? 'bg-emerald-500/10' : dept.status === 'failed' ? 'bg-red-500/10' : 'bg-[hsl(var(--muted))]'}`}>
                  <Icon className={`h-5 w-5 ${statusColor(dept.status)}`} />
                </div>
              </div>
              <p className="text-[12px] font-semibold text-[hsl(var(--foreground))]">{dept.name}</p>
              <p className={`text-[10px] uppercase tracking-wider font-medium mt-1 ${statusColor(dept.status)}`}>
                {dept.status.replace('_', ' ')}
              </p>
              {dept.score !== undefined && (
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{dept.score}%</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Run History Table ─── */
function RunHistory({ entries }: { entries: RunHistoryEntry[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#E11D2E]" />
          Run History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-t border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">
              <th className="text-left px-5 py-2 font-medium">Started</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-center px-3 py-2 font-medium">Duration</th>
              <th className="text-center px-3 py-2 font-medium">Status</th>
              <th className="text-center px-3 py-2 font-medium">Found</th>
              <th className="text-center px-3 py-2 font-medium">Corrected</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors">
                <td className="px-5 py-2.5 text-[hsl(var(--muted-foreground))] font-mono">{e.startedAt}</td>
                <td className="px-3 py-2.5 text-[hsl(var(--foreground))]">{e.type}</td>
                <td className="px-3 py-2.5 text-center text-[hsl(var(--muted-foreground))]">{e.duration}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBg(e.status)} ${statusColor(e.status)}`}>
                    <StatusIcon status={e.status} />
                    {e.status}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-center font-semibold ${e.deficitsFound > 0 ? 'text-amber-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                  {e.deficitsFound}
                </td>
                <td className={`px-3 py-2.5 text-center font-semibold ${e.deficitsCorrected >= e.deficitsFound ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {e.deficitsCorrected}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── Start Run Modal ─── */
function StartRunModal({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (type: string, env: string, opts: { autoHeal: boolean; skipPassed: boolean }) => void;
}) {
  const [runType, setRunType] = useState('full');
  const [env, setEnv] = useState('production');
  const [autoHeal, setAutoHeal] = useState(true);
  const [skipPassed, setSkipPassed] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-0 border-[#E11D2E]/20">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#E11D2E]" />
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Start Activation Run</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Run Type */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2 block">
              Run Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'full', label: 'Full Activation' },
                { id: 'quick', label: 'Quick Check' },
                { id: 'repair', label: 'Repair Only' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRunType(t.id)}
                  className={`py-2 px-3 rounded-xl text-[12px] font-medium border transition-all ${
                    runType === t.id
                      ? 'bg-[#E11D2E]/10 border-[#E11D2E]/30 text-[#E11D2E]'
                      : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium mb-2 block">
              Environment
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['production', 'development'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEnv(e)}
                  className={`py-2 px-3 rounded-xl text-[12px] font-medium border transition-all capitalize ${
                    env === e
                      ? 'bg-[#E11D2E]/10 border-[#E11D2E]/30 text-[#E11D2E]'
                      : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium block">Options</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoHeal}
                onChange={(e) => setAutoHeal(e.target.checked)}
                className="h-4 w-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[#E11D2E] focus:ring-[#E11D2E]/30"
              />
              <span className="text-[13px] text-[hsl(var(--foreground))]">Auto-heal deficits</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={skipPassed}
                onChange={(e) => setSkipPassed(e.target.checked)}
                className="h-4 w-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[#E11D2E] focus:ring-[#E11D2E]/30"
              />
              <span className="text-[13px] text-[hsl(var(--foreground))]">Skip previously passed phases</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[hsl(var(--border))]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onStart(runType, env, { autoHeal, skipPassed })}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-[#E11D2E] text-[hsl(var(--foreground))] hover:bg-[#C91828] transition-colors flex items-center gap-2"
          >
            <Play className="h-3.5 w-3.5" />
            Start Run
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ActivationCommandCenter() {
  const [state, setState] = useState<ActivationState>(buildDefaultState);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch current state ── */
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/activation/current');
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // API may not exist yet — use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  /* ── Polling during live run ── */
  useEffect(() => {
    if (state.status === 'running') {
      pollRef.current = setInterval(fetchState, 3000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state.status, fetchState]);

  /* ── Start run ── */
  const handleStartRun = async (type: string, env: string, opts: { autoHeal: boolean; skipPassed: boolean }) => {
    setModalOpen(false);
    try {
      const res = await fetch('/api/admin/activation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, environment: env, ...opts }),
      });
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({ ...prev, ...data, status: 'running' }));
      } else {
        // Simulate a running state for demo
        setState((prev) => ({
          ...prev,
          status: 'running',
          runType: type,
          environment: env,
          percentComplete: 0,
          activeAgents: 42,
          departmentsTouched: 0,
          criticalDeficits: 0,
          healingActions: 0,
          errorsDetected: 0,
          selfHealStatus: 'active',
          claudeUtilization: 34,
          startedAt: new Date().toISOString(),
          duration: '0s',
          phases: DEFAULT_PHASES.map((p, i) => (i === 0 ? { ...p, status: 'running' as PhaseStatus } : p)),
          narrative: MOCK_NARRATIVE,
          workforce: MOCK_WORKFORCE,
          departments: DEFAULT_DEPARTMENTS.map((d) => ({ ...d, status: 'pending' as const })),
        }));
      }
    } catch {
      // Simulate for demo
      setState((prev) => ({
        ...prev,
        status: 'running',
        runType: type,
        environment: env,
        activeAgents: 42,
        selfHealStatus: 'active',
        claudeUtilization: 34,
        narrative: MOCK_NARRATIVE,
        phases: DEFAULT_PHASES.map((p, i) => (i === 0 ? { ...p, status: 'running' as PhaseStatus } : p)),
      }));
    }
  };

  /* ── Stop run ── */
  const handleStopRun = async () => {
    try {
      await fetch('/api/admin/activation/stop', { method: 'POST' });
    } catch {
      // continue
    }
    setState((prev) => ({ ...prev, status: 'stopped' }));
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingGlobe size="lg" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading Activation Command Center...</p>
      </div>
    );
  }

  const isRunning = state.status === 'running';
  const envLabel = state.environment === 'production' ? 'PROD' : 'DEV';

  return (
    <div className="space-y-6 pb-8">
      {/* ═══════════════ Top Header Strip ═══════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[#E11D2E]/10 border border-[#E11D2E]/20">
            <Zap className="h-6 w-6 text-[#E11D2E]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))] tracking-tight">Activation Command Center</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-medium">
                {envLabel}
              </span>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${statusBg(state.status)} ${statusColor(state.status)}`}>
                <StatusIcon status={state.status} />
                {state.status}
              </span>
              {isRunning && (
                <>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {state.percentComplete}% complete
                  </span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {state.duration}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={handleStopRun}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-2"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Run
            </button>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-[#E11D2E] text-[hsl(var(--foreground))] hover:bg-[#C91828] transition-colors flex items-center gap-2 shadow-lg shadow-red-500/10"
            >
              <Play className="h-3.5 w-3.5" />
              Start Run
            </button>
          )}
          <button
            onClick={fetchState}
            className="p-2 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            title="Refresh"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════ Global Metrics ═══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricCard label="Complete" value={`${state.percentComplete}%`} icon={CheckCircle2} accent="text-emerald-400" />
        <MetricCard label="Active Agents" value={state.activeAgents} icon={Bot} accent="text-sky-400" />
        <MetricCard label="Depts Touched" value={state.departmentsTouched} icon={Building2} />
        <MetricCard label="Critical Deficits" value={state.criticalDeficits} icon={ShieldAlert} accent={state.criticalDeficits > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <MetricCard label="Heal Actions" value={state.healingActions} icon={HeartPulse} accent="text-emerald-400" />
        <MetricCard label="Errors" value={state.errorsDetected} icon={Bug} accent={state.errorsDetected > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <MetricCard label="Self-Heal" value={state.selfHealStatus} icon={Wrench} accent={statusColor(state.selfHealStatus)} />
        <MetricCard label="Claude Util." value={`${state.claudeUtilization}%`} icon={Cpu} accent="text-sky-400" />
      </div>

      {/* ═══════════════ Phase Tracker + Narrative ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PhaseStepper phases={state.phases} />
        <NarrativeFeed events={state.narrative} />
      </div>

      {/* ═══════════════ Workforce Coverage ═══════════════ */}
      <WorkforceGrid rows={state.workforce} />

      {/* ═══════════════ Department Certification ═══════════════ */}
      <DepartmentCerts departments={state.departments} />

      {/* ═══════════════ Run History ═══════════════ */}
      <RunHistory entries={state.history} />

      {/* ═══════════════ Start Run Modal ═══════════════ */}
      <StartRunModal open={modalOpen} onClose={() => setModalOpen(false)} onStart={handleStartRun} />
    </div>
  );
}
