'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bot,
  Users,
  AlertTriangle,
  Activity,
  Zap,
  Crown,
  Clock,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  PageHeader,
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  id: string;
  name: string;
  role: { name: string; department: string } | string;
  department?: string;
  status: string;
  lastActiveAt: string | null;
}

interface AgentsListResponse {
  data: Agent[];
  meta: { total: number; page: number; perPage: number };
}

interface AgentStatsResponse {
  counts: {
    total: number;
    active: number;
    idle: number;
    busy: number;
    error: number;
    disabled: number;
  };
  departments: { department: string; total: number; active: number }[];
  today: {
    tasksCompleted: number;
    tasksFailed: number;
    totalTokens: number;
    totalCostCents: number;
  };
}

interface AgentPoolsResponse {
  totalPools: number;
  totalAgents: number;
  activeAgents: number;
  dispatchedAgents: number;
  idleAgents: number;
  errorAgents: number;
  maxCapacity: number;
  utilizationPct: number;
  totalDispatches: number;
  totalReturns: number;
  expansionsTriggered: number;
  unhandledEvents: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEPARTMENTS = [
  'Executive',
  'Operations',
  'Finance',
  'Sales',
  'Marketing',
  'Support',
  'Compliance',
  'Security',
  'Engineering',
  'Frontline',
  'Forum SEO',
  'Knowledge',
] as const;

const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; accent: string }> = {
  executive:   { bg: 'bg-red-50',     border: 'border-red-500/10',     text: 'text-red-400',     dot: 'bg-red-500',     accent: 'border-l-red-500' },
  operations:  { bg: 'bg-cyan-950/30',    border: 'border-cyan-500/10',    text: 'text-cyan-400',    dot: 'bg-cyan-500',    accent: 'border-l-cyan-500' },
  finance:     { bg: 'bg-green-950/30',   border: 'border-green-500/10',   text: 'text-green-400',   dot: 'bg-green-500',   accent: 'border-l-green-500' },
  sales:       { bg: 'bg-emerald-50', border: 'border-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500', accent: 'border-l-emerald-500' },
  marketing:   { bg: 'bg-blue-50',    border: 'border-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-500',    accent: 'border-l-blue-500' },
  support:     { bg: 'bg-amber-50',   border: 'border-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500',   accent: 'border-l-amber-500' },
  compliance:  { bg: 'bg-rose-950/30',    border: 'border-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-500',    accent: 'border-l-rose-500' },
  security:    { bg: 'bg-violet-950/30',  border: 'border-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-500',  accent: 'border-l-violet-500' },
  engineering: { bg: 'bg-orange-950/30',  border: 'border-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-500',  accent: 'border-l-orange-500' },
  frontline:   { bg: 'bg-teal-950/30',    border: 'border-teal-500/10',    text: 'text-teal-400',    dot: 'bg-teal-500',    accent: 'border-l-teal-500' },
  'forum seo': { bg: 'bg-indigo-950/30',  border: 'border-indigo-500/10',  text: 'text-indigo-400',  dot: 'bg-indigo-500',  accent: 'border-l-indigo-500' },
  knowledge:   { bg: 'bg-pink-950/30',    border: 'border-pink-500/10',    text: 'text-pink-400',    dot: 'bg-pink-500',    accent: 'border-l-pink-500' },
};

const DEFAULT_DEPT_COLOR = { bg: 'bg-card', border: 'border-white/[0.04]', text: 'text-muted-foreground', dot: 'bg-muted', accent: 'border-l-zinc-500' };

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept.toLowerCase()] ?? DEFAULT_DEPT_COLOR;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeAgent(agent: Agent): { id: string; name: string; role: string; department: string; status: string; lastActiveAt: string | null } {
  const roleObj = typeof agent.role === 'object' && agent.role !== null ? agent.role : null;
  return {
    id: agent.id,
    name: agent.name,
    role: roleObj ? roleObj.name : (agent.role as string) ?? '',
    department: roleObj ? roleObj.department : (agent.department ?? ''),
    status: agent.status?.toLowerCase() ?? 'idle',
    lastActiveAt: agent.lastActiveAt,
  };
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'muted' {
  switch (status.toLowerCase()) {
    case 'active':
    case 'busy':
      return 'success';
    case 'idle':
      return 'warning';
    case 'error':
    case 'disabled':
      return 'error';
    default:
      return 'muted';
  }
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Agent card                                                         */
/* ------------------------------------------------------------------ */

function AgentCard({ agent }: { agent: ReturnType<typeof normalizeAgent> }) {
  const colors = getDeptColor(agent.department);
  return (
    <div
      className={`rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl border-l-4 ${colors.accent} p-3.5 flex items-center justify-between gap-3 transition-colors hover:bg-white/[0.04]`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.border} border backdrop-blur-sm`}>
          <Bot className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate tracking-tight">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant={statusBadgeVariant(agent.status)}>
          {agent.status}
        </Badge>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {relativeTime(agent.lastActiveAt)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Department section                                                 */
/* ------------------------------------------------------------------ */

function DepartmentSection({
  name,
  agents,
  isExpanded,
  onToggle,
}: {
  name: string;
  agents: ReturnType<typeof normalizeAgent>[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = getDeptColor(name);
  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;

  return (
    <Card className={`overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl ${colors.bg}`}>
      <CardHeader className="p-4 pb-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <CardTitle className="text-sm capitalize tracking-tight">{name}</CardTitle>
            <Badge variant="default">{agents.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {activeCount}/{agents.length} active
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No agents in this department.</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Pool health bar                                                    */
/* ------------------------------------------------------------------ */

function PoolHealthBar({ pools }: { pools: AgentPoolsResponse | null }) {
  if (!pools) return null;
  const pct = pools.utilizationPct ?? 0;
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Pool Utilization
        </span>
        <span className="text-xs text-muted-foreground">{pct}% — {pools.totalPools} pool{pools.totalPools !== 1 ? 's' : ''}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
        <span>{pools.activeAgents + pools.dispatchedAgents} active / {pools.idleAgents} idle / {pools.errorAgents} error</span>
        <span className="ml-auto">{pools.totalDispatches} dispatched total</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="stat-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function AICompanyDashboard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(() => new Set(DEPARTMENTS.map((d) => d)));
  const [spawnFeedback, setSpawnFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  // ── Agent stats (metrics tiles) — poll every 5 s ─────────────────
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<AgentStatsResponse>({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const res = await api.get<AgentStatsResponse>('/api/admin/agents/stats');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 5_000,
  });

  // ── Agent list (org chart) — poll every 5 s ───────────────────────
  const {
    data: agentsData,
    isLoading: agentsLoading,
  } = useQuery<AgentsListResponse>({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const res = await api.get<AgentsListResponse>('/api/admin/agents?perPage=200');
      if (res.error) throw new Error(res.error);
      // useApi unwraps { success, data, meta } -> { data, meta }
      return res.data!;
    },
    refetchInterval: 5_000,
  });

  // ── Pool health — poll every 5 s ──────────────────────────────────
  const { data: poolsData } = useQuery<AgentPoolsResponse>({
    queryKey: ['agent-pools'],
    queryFn: async () => {
      const res = await api.get<AgentPoolsResponse>('/api/admin/agent-pools');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    refetchInterval: 5_000,
  });

  // ── Spawn agents mutation ─────────────────────────────────────────
  const spawnMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/command-center/dispatch', {
        task: 'spawn 5 agents for the agent pool',
        priority: 'normal',
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setSpawnFeedback('success');
      queryClient.invalidateQueries({ queryKey: ['agent-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agents-list'] });
      queryClient.invalidateQueries({ queryKey: ['agent-pools'] });
      setTimeout(() => setSpawnFeedback('idle'), 3000);
    },
    onError: () => {
      setSpawnFeedback('error');
      setTimeout(() => setSpawnFeedback('idle'), 3000);
    },
  });

  // ── Derived data ──────────────────────────────────────────────────
  const rawAgents: Agent[] = agentsData?.data ?? [];
  const agents = rawAgents.map(normalizeAgent);

  // Group by department
  const agentsByDept: Record<string, ReturnType<typeof normalizeAgent>[]> = {};
  for (const dept of DEPARTMENTS) agentsByDept[dept] = [];
  for (const agent of agents) {
    const key = DEPARTMENTS.find((d) => d.toLowerCase() === agent.department.toLowerCase()) ?? (agent.department as typeof DEPARTMENTS[number]);
    if (!agentsByDept[key]) agentsByDept[key] = [];
    agentsByDept[key].push(agent);
  }

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });
  };

  // Metric values — prefer stats API, fall back to counts from list
  const totalAgents  = statsData?.counts.total    ?? agents.length;
  const activeNow    = statsData?.counts.active    ?? agents.filter((a) => a.status === 'active').length;
  const tasksToday   = statsData?.today.tasksCompleted ?? 0;
  const poolsRunning = poolsData?.totalPools ?? 0;

  const isLoading = statsLoading && agentsLoading;
  const pageError = statsError;

  // Spawn button label/icon
  const spawnLabel =
    spawnFeedback === 'success' ? 'Spawned' :
    spawnFeedback === 'error'   ? 'Failed'  :
    spawnMutation.isPending      ? 'Spawning…' : 'Spawn Agents';
  const SpawnIcon =
    spawnFeedback === 'success' ? CheckCircle2 :
    spawnMutation.isPending      ? Loader2      : Plus;

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Company"
        subtitle="Your AI workforce — departments, agents, and operations at a glance"
        actions={
          <div className="flex items-center gap-3">
            {/* Spawn Agents */}
            <button
              onClick={() => spawnMutation.mutate()}
              disabled={spawnMutation.isPending}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium backdrop-blur-xl transition-all duration-200 disabled:opacity-60
                ${spawnFeedback === 'success'
                  ? 'border-emerald-500/30 bg-emerald-50 text-emerald-300'
                  : spawnFeedback === 'error'
                  ? 'border-red-500/30 bg-red-50 text-red-300'
                  : 'border-white/[0.06] bg-white/[0.03] text-foreground hover:bg-white/[0.06]'
                }`}
            >
              <SpawnIcon className={`h-4 w-4 ${spawnMutation.isPending ? 'animate-spin' : ''}`} />
              {spawnLabel}
            </button>

            <Link
              href="/dashboard/ai-company/agents"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-sm font-medium text-foreground hover:bg-white/[0.06] transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              All Agents
            </Link>
            <Link
              href="/dashboard/ai-company/escalations"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-sm font-medium text-foreground hover:bg-white/[0.06] transition-all duration-200"
            >
              <AlertTriangle className="h-4 w-4" />
              Escalations
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : pageError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-50 backdrop-blur-xl p-6 text-center text-sm text-red-300">
          Failed to load agents: {(pageError as Error).message}
        </div>
      ) : (
        <>
          {/* Metric tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Total Agents"
              value={totalAgents}
              icon={<Bot className="h-4 w-4" />}
            />
            <MetricTile
              label="Active Now"
              value={activeNow}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricTile
              label="Pools Running"
              value={poolsRunning}
              icon={<Layers className="h-4 w-4" />}
            />
            <MetricTile
              label="Tasks Completed Today"
              value={tasksToday}
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          {/* Pool health bar */}
          <PoolHealthBar pools={poolsData ?? null} />

          {/* Org chart */}
          <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
            {/* CEO node */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-50 backdrop-blur-xl px-6 py-3.5">
                <Crown className="h-5 w-5 text-red-400" />
                <span className="text-sm font-bold text-red-300 tracking-tight">AI CEO</span>
              </div>
              <div className="h-8 w-px bg-gradient-to-b from-red-500/40 to-transparent" />
            </div>

            {/* Department sections */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {DEPARTMENTS.map((dept) => (
                <DepartmentSection
                  key={dept}
                  name={dept}
                  agents={agentsByDept[dept] ?? []}
                  isExpanded={expandedDepts.has(dept)}
                  onToggle={() => toggleDept(dept)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
