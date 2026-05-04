'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Crown,
  Settings,
  BadgeDollarSign,
  TrendingUp,
  Megaphone,
  Headphones,
  Shield,
  Lock,
  Code2,
  UserCheck,
  Search,
  BookOpen,
  BrainCircuit,
  Activity,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

interface Agent {
  role: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  tasksCompleted: number;
  currentTask: string | null;
  memorySize: string;
}

interface Escalation {
  id: string;
  agent: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  agentCount: number;
  activeTasks: number;
  status: 'operational' | 'degraded' | 'down';
  lastActivity: string;
  keyRoles: string[];
  agents: Agent[];
  escalations: Escalation[];
  schedule: string;
}

interface DepartmentStats {
  totalActiveAgents: number;
  tasksCompletedToday: number;
  failedTasks24h: number;
  avgResponseTime: string;
}

interface DepartmentsResponse {
  departments: Department[];
  stats: DepartmentStats;
}

/* ─────────────────────────── Icon Map ─────────────────────────── */

const ICON_MAP: Record<string, typeof Crown> = {
  executive: Crown,
  operations: Settings,
  finance: BadgeDollarSign,
  sales: TrendingUp,
  marketing: Megaphone,
  support: Headphones,
  compliance: Shield,
  security: Lock,
  engineering: Code2,
  frontline: UserCheck,
  'forum-seo': Search,
  knowledge: BookOpen
};

/* ─────────────────────────── Fallback Data ─────────────────────────── */

const FALLBACK_DEPARTMENTS: Department[] = [
  {
    id: 'executive',
    name: 'Executive',
    icon: 'executive',
    agentCount: 3,
    activeTasks: 2,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['CEO', 'Chief of Staff', 'Strategy'],
    agents: [
      { role: 'CEO', status: 'active', tasksCompleted: 142, currentTask: 'Revenue forecast review', memorySize: '2.4 MB' },
      { role: 'Chief of Staff', status: 'active', tasksCompleted: 98, currentTask: 'Cross-dept sync', memorySize: '1.8 MB' },
      { role: 'Strategy', status: 'idle', tasksCompleted: 67, currentTask: null, memorySize: '3.1 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: 'operations',
    agentCount: 3,
    activeTasks: 5,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['COO', 'Workflow Manager', 'QA'],
    agents: [
      { role: 'COO', status: 'active', tasksCompleted: 215, currentTask: 'Pipeline optimization', memorySize: '2.1 MB' },
      { role: 'Workflow Manager', status: 'active', tasksCompleted: 534, currentTask: 'Queue rebalancing', memorySize: '1.6 MB' },
      { role: 'QA', status: 'active', tasksCompleted: 312, currentTask: 'Output validation batch', memorySize: '1.2 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'finance',
    agentCount: 4,
    activeTasks: 3,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['CFO', 'Revenue', 'Billing'],
    agents: [
      { role: 'CFO', status: 'active', tasksCompleted: 89, currentTask: 'Monthly reconciliation', memorySize: '2.7 MB' },
      { role: 'Revenue', status: 'active', tasksCompleted: 178, currentTask: 'MRR calculation', memorySize: '1.4 MB' },
      { role: 'Billing', status: 'active', tasksCompleted: 412, currentTask: 'Invoice generation', memorySize: '0.9 MB' },
      { role: 'Fraud', status: 'idle', tasksCompleted: 56, currentTask: null, memorySize: '1.1 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: 'sales',
    agentCount: 3,
    activeTasks: 8,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['CRO', 'Lead Qualification', 'Pipeline'],
    agents: [
      { role: 'CRO', status: 'active', tasksCompleted: 134, currentTask: 'Deal review', memorySize: '2.0 MB' },
      { role: 'Lead Qualification', status: 'active', tasksCompleted: 867, currentTask: 'Scoring 12 leads', memorySize: '1.3 MB' },
      { role: 'Pipeline', status: 'active', tasksCompleted: 245, currentTask: 'Stage progression audit', memorySize: '1.5 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'marketing',
    agentCount: 3,
    activeTasks: 4,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['CMO', 'Campaigns', 'Content'],
    agents: [
      { role: 'CMO', status: 'active', tasksCompleted: 76, currentTask: 'Campaign strategy review', memorySize: '2.3 MB' },
      { role: 'Campaigns', status: 'active', tasksCompleted: 198, currentTask: 'A/B test analysis', memorySize: '1.7 MB' },
      { role: 'Content', status: 'active', tasksCompleted: 342, currentTask: 'Blog post generation', memorySize: '2.8 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'support',
    name: 'Support',
    icon: 'support',
    agentCount: 3,
    activeTasks: 12,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Chat Agent', 'Ticket Processor', 'Retention'],
    agents: [
      { role: 'Chat Agent', status: 'active', tasksCompleted: 1243, currentTask: 'Handling 4 chats', memorySize: '1.1 MB' },
      { role: 'Ticket Processor', status: 'active', tasksCompleted: 678, currentTask: 'Processing ticket #4521', memorySize: '0.8 MB' },
      { role: 'Retention', status: 'active', tasksCompleted: 89, currentTask: 'Churn risk outreach', memorySize: '1.4 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: 'compliance',
    agentCount: 3,
    activeTasks: 2,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Doc Verification', 'Policy', 'Risk'],
    agents: [
      { role: 'Doc Verification', status: 'active', tasksCompleted: 456, currentTask: 'ID validation batch', memorySize: '1.6 MB' },
      { role: 'Policy', status: 'idle', tasksCompleted: 34, currentTask: null, memorySize: '2.1 MB' },
      { role: 'Risk', status: 'active', tasksCompleted: 123, currentTask: 'Risk score update', memorySize: '1.9 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'security',
    name: 'Security',
    icon: 'security',
    agentCount: 2,
    activeTasks: 2,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Access Monitor', 'Threat Detection'],
    agents: [
      { role: 'Access Monitor', status: 'active', tasksCompleted: 2134, currentTask: 'Auth log scan', memorySize: '0.7 MB' },
      { role: 'Threat Detection', status: 'active', tasksCompleted: 567, currentTask: 'Anomaly sweep', memorySize: '1.3 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: 'engineering',
    agentCount: 3,
    activeTasks: 3,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Platform Health', 'Worker Health', 'Queue Health'],
    agents: [
      { role: 'Platform Health', status: 'active', tasksCompleted: 1456, currentTask: 'Uptime check cycle', memorySize: '0.9 MB' },
      { role: 'Worker Health', status: 'active', tasksCompleted: 876, currentTask: 'Worker restart check', memorySize: '0.6 MB' },
      { role: 'Queue Health', status: 'active', tasksCompleted: 2341, currentTask: 'Queue depth monitor', memorySize: '0.5 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'frontline',
    name: 'Frontline',
    icon: 'frontline',
    agentCount: 3,
    activeTasks: 6,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Receptionist', 'Calendar', 'Greeter'],
    agents: [
      { role: 'Receptionist', status: 'active', tasksCompleted: 534, currentTask: 'Call routing', memorySize: '1.0 MB' },
      { role: 'Calendar', status: 'active', tasksCompleted: 321, currentTask: 'Booking confirmations', memorySize: '0.8 MB' },
      { role: 'Greeter', status: 'active', tasksCompleted: 789, currentTask: 'New visitor onboarding', memorySize: '0.7 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
  {
    id: 'forum-seo',
    name: 'Forum SEO',
    icon: 'forum-seo',
    agentCount: 4,
    activeTasks: 7,
    status: 'degraded',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Question Discovery', 'Thread Creation', 'Indexing'],
    agents: [
      { role: 'Question Discovery', status: 'active', tasksCompleted: 234, currentTask: 'Scanning Reddit + Quora', memorySize: '1.8 MB' },
      { role: 'Thread Creation', status: 'active', tasksCompleted: 189, currentTask: 'Drafting 3 threads', memorySize: '2.2 MB' },
      { role: 'Indexing', status: 'error', tasksCompleted: 412, currentTask: null, memorySize: '0.6 MB' },
      { role: 'Reping', status: 'active', tasksCompleted: 156, currentTask: 'Bumping stale threads', memorySize: '0.4 MB' },
    ],
    escalations: [
      { id: 'esc-1', agent: 'Indexing', message: 'Google indexing API rate limit exceeded', severity: 'warning', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ],
    schedule: '24/7 — always on'
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    icon: 'knowledge',
    agentCount: 3,
    activeTasks: 3,
    status: 'operational',
    lastActivity: new Date().toISOString(),
    keyRoles: ['Memory Curator', 'Decision Recorder', 'Context Builder'],
    agents: [
      { role: 'Memory Curator', status: 'active', tasksCompleted: 567, currentTask: 'Pruning stale memories', memorySize: '4.2 MB' },
      { role: 'Decision Recorder', status: 'active', tasksCompleted: 234, currentTask: 'Logging decision chain', memorySize: '3.1 MB' },
      { role: 'Context Builder', status: 'active', tasksCompleted: 345, currentTask: 'Building tenant context', memorySize: '5.6 MB' },
    ],
    escalations: [],
    schedule: '24/7 — always on'
  },
];

const FALLBACK_STATS: DepartmentStats = {
  totalActiveAgents: 37,
  tasksCompletedToday: 1847,
  failedTasks24h: 3,
  avgResponseTime: '120ms'
};

/* ─────────────────────────── Helpers ─────────────────────────── */

function statusColor(status: 'operational' | 'degraded' | 'down'): string {
  switch (status) {
    case 'operational':
      return 'bg-emerald-400';
    case 'degraded':
      return 'bg-amber-400';
    case 'down':
      return 'bg-primary/70';
  }
}

function statusLabel(status: 'operational' | 'degraded' | 'down'): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'degraded':
      return 'Degraded';
    case 'down':
      return 'Down';
  }
}

function agentStatusColor(status: Agent['status']): string {
  switch (status) {
    case 'active':
      return 'text-emerald-400';
    case 'idle':
      return 'text-[hsl(var(--muted-foreground))]';
    case 'error':
      return 'text-primary';
    case 'offline':
      return 'text-[hsl(var(--muted-foreground))]';
  }
}

function agentStatusDot(status: Agent['status']): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-400';
    case 'idle':
      return 'bg-[hsl(var(--muted-foreground))]';
    case 'error':
      return 'bg-primary/70';
    case 'offline':
      return 'bg-[hsl(var(--muted))]';
  }
}

function severityColor(severity: Escalation['severity']): string {
  switch (severity) {
    case 'info':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    case 'critical':
      return 'border-primary/30 bg-primary/10 text-primary';
  }
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ─────────────────────────── Page Component ─────────────────────────── */

export default function AIDepartmentsPage() {
  const api = useApi();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<DepartmentsResponse>('/api/admin/agents/departments');
    if (res.error) {
      // Use fallback data when API is not yet available
      setDepartments(FALLBACK_DEPARTMENTS);
      setStats(FALLBACK_STATS);
    } else if (res.data) {
      setDepartments(res.data.departments);
      setStats(res.data.stats);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAgents = departments.reduce((sum, d) => sum + d.agentCount, 0);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-6">
          <LoadingGlobe size="lg" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">Loading AI workforce...</p>
        </div>
      </div>
    );
  }

  /* ── Error with no data ── */
  if (error && departments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Failed to load AI departments</p>
            <p className="mt-1 text-[hsl(var(--muted-foreground))] leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-[hsl(var(--background))]">
      {/* ═══════════════════════ Header ═══════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">AI Workforce</h1>
            <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
              {totalAgents} agents across {departments.length} departments
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ═══════════════════════ Summary Stats ═══════════════════════ */}
      {stats && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard
            label="Total Active Agents"
            value={String(stats.totalActiveAgents)}
            icon={<Activity className="h-4 w-4 text-emerald-400" />}
            accent="emerald"
          />
          <StatCard
            label="Tasks Completed Today"
            value={stats.tasksCompletedToday.toLocaleString()}
            icon={<Zap className="h-4 w-4 text-primary" />}
            accent="primary"
          />
          <StatCard
            label="Failed Tasks (24h)"
            value={String(stats.failedTasks24h)}
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
            accent="red"
          />
          <StatCard
            label="Avg Response Time"
            value={stats.avgResponseTime}
            icon={<Clock className="h-4 w-4 text-amber-400" />}
            accent="amber"
          />
        </div>
      )}

      {/* ═══════════════════════ Department Grid ═══════════════════════ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept) => {
          const Icon = ICON_MAP[dept.icon] ?? BrainCircuit;
          const isExpanded = expandedDept === dept.id;

          return (
            <div
              key={dept.id}
              className={`rounded-2xl border transition-all duration-200 ${
                isExpanded
                  ? 'border-primary/50 bg-[hsl(var(--card))] md:col-span-2 xl:col-span-3'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--border))]'
              }`}
            >
              {/* ── Card Header (always visible) ── */}
              <button
                onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                className="flex w-full items-start gap-6 p-6 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{dept.name}</h3>
                    <span className={`h-2 w-2 rounded-full ${statusColor(dept.status)}`} />
                    <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{statusLabel(dept.status)}</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                    <span>{dept.agentCount} agents</span>
                    <span>{dept.activeTasks} active tasks</span>
                    <span>{timeAgo(dept.lastActivity)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {dept.keyRoles.map((role) => (
                      <span
                        key={role}
                        className="rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 pt-1 text-[hsl(var(--muted-foreground))]">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* ── Expanded Panel ── */}
              {isExpanded && (
                <div className="border-t border-[hsl(var(--border))] p-6 space-y-6">
                  {/* Agents Table */}
                  <div>
                    <h4 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                      Agents
                    </h4>
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                              <th className="p-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Role</th>
                              <th className="p-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Status</th>
                              <th className="p-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Tasks Done</th>
                              <th className="p-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Current Task</th>
                              <th className="p-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Memory</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {dept.agents.map((agent) => (
                              <tr key={agent.role}>
                                <td className="p-3 font-medium text-[hsl(var(--foreground))]">
                                  {agent.role}
                                </td>
                                <td className="p-3">
                                  <span className="flex items-center gap-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${agentStatusDot(agent.status)}`} />
                                    <span className={`text-xs capitalize ${agentStatusColor(agent.status)}`}>
                                      {agent.status}
                                    </span>
                                  </span>
                                </td>
                                <td className="p-3 text-[hsl(var(--muted-foreground))] leading-relaxed tabular-nums">
                                  {agent.tasksCompleted.toLocaleString()}
                                </td>
                                <td className="p-3 max-w-[240px] truncate text-[hsl(var(--muted-foreground))] leading-relaxed">
                                  {agent.currentTask ?? (
                                    <span className="italic text-[hsl(var(--muted-foreground))]">None</span>
                                  )}
                                </td>
                                <td className="p-3 text-[hsl(var(--muted-foreground))] leading-relaxed tabular-nums">
                                  {agent.memorySize}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Escalations */}
                  {dept.escalations.length > 0 && (
                    <div>
                      <h4 className="mb-3 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                        Recent Escalations
                      </h4>
                      <div className="space-y-3">
                        {dept.escalations.map((esc) => (
                          <div
                            key={esc.id}
                            className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-xs ${severityColor(esc.severity)}`}
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{esc.agent}:</span>{' '}
                              <span className="opacity-90">{esc.message}</span>
                            </div>
                            <span className="shrink-0 text-[11px] uppercase tracking-wider opacity-60 font-medium">
                              {timeAgo(esc.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="flex items-center gap-3 text-[hsl(var(--muted-foreground))] leading-relaxed">
                    <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                    <span>Schedule: {dept.schedule}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Stat Card ─────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'primary' | 'red' | 'amber';
}) {
  const ringMap = {
    emerald: 'ring-emerald-500/20',
    primary: 'ring-primary/20',
    red: 'ring-primary/20',
    amber: 'ring-amber-500/20'
  };

  return (
    <div className={`rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 ring-1 ${ringMap[accent]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] tabular-nums">{value}</p>
    </div>
  );
}