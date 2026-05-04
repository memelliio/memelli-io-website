'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Lightbulb,
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  Play,
  Pause,
  Eye,
  Rocket,
  X,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  DollarSign,
  CircleDot,
  ToggleLeft,
  ToggleRight,
  Tag,
  KeyRound,
  Database,
  CalendarClock,
  ListTodo,
  Building2
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  runningTasks: number;
  tasksCompletedToday: number;
  failedToday: number;
  totalCostToday: number;
}

interface AgentTask {
  id: string;
  taskType: string;
  status: 'completed' | 'failed' | 'running';
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

interface AgentRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  tenantId: string;
  tenantName: string;
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'DISABLED';
  tasks24h: number;
  lastActive: string | null;
  description: string;
  reportsTo: string | null;
  tools: string[];
  permissions: string[];
  memoryScopes: string[];
  schedule: string | null;
  nextRun: string | null;
  recentTasks: AgentTask[];
}

interface DepartmentSummary {
  id: string;
  name: string;
  icon: string;
  agentCount: number;
  activeCount: number;
  status: 'operational' | 'degraded' | 'down';
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Constants                                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

const DEPT_ICON_MAP: Record<string, typeof Crown> = {
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
  knowledge: BookOpen,
  innovation: Lightbulb
};

const DEPARTMENTS_META: { id: string; name: string; icon: string }[] = [
  { id: 'executive', name: 'Executive', icon: 'executive' },
  { id: 'operations', name: 'Operations', icon: 'operations' },
  { id: 'finance', name: 'Finance', icon: 'finance' },
  { id: 'sales', name: 'Sales', icon: 'sales' },
  { id: 'marketing', name: 'Marketing', icon: 'marketing' },
  { id: 'support', name: 'Support', icon: 'support' },
  { id: 'compliance', name: 'Compliance', icon: 'compliance' },
  { id: 'security', name: 'Security', icon: 'security' },
  { id: 'engineering', name: 'Engineering', icon: 'engineering' },
  { id: 'frontline', name: 'Frontline', icon: 'frontline' },
  { id: 'forum-seo', name: 'Forum SEO', icon: 'forum-seo' },
  { id: 'knowledge', name: 'Knowledge', icon: 'knowledge' },
  { id: 'innovation', name: 'Innovation', icon: 'innovation' },
];

const TASK_TYPES = [
  'health_check',
  'generate_report',
  'process_queue',
  'sync_data',
  'run_analysis',
  'send_notifications',
  'audit_logs',
  'optimize',
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Fallback Data                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

const FALLBACK_STATS: AgentStats = {
  totalAgents: 84,
  activeAgents: 71,
  runningTasks: 23,
  tasksCompletedToday: 2847,
  failedToday: 7,
  totalCostToday: 14.32
};

function makeFallbackAgents(): AgentRecord[] {
  const roles: Record<string, { role: string; desc: string; tools: string[]; perms: string[] }[]> = {
    executive: [
      { role: 'CEO', desc: 'Oversees all agent operations and strategic direction', tools: ['decision-engine', 'report-gen', 'escalation-router'], perms: ['admin', 'all-tenants', 'billing'] },
      { role: 'Chief of Staff', desc: 'Coordinates cross-department initiatives', tools: ['task-scheduler', 'comms-bus', 'context-loader'], perms: ['admin', 'agent-mgmt'] },
      { role: 'Strategy Advisor', desc: 'Long-term planning and competitive analysis', tools: ['market-analysis', 'trend-detector', 'report-gen'], perms: ['read-all', 'reports'] },
    ],
    operations: [
      { role: 'COO', desc: 'Manages operational efficiency across all departments', tools: ['workflow-engine', 'queue-manager', 'metrics-collector'], perms: ['admin', 'agent-mgmt'] },
      { role: 'Workflow Manager', desc: 'Orchestrates task pipelines and queue balancing', tools: ['queue-manager', 'task-scheduler', 'retry-handler'], perms: ['queue-mgmt', 'task-mgmt'] },
      { role: 'QA Inspector', desc: 'Validates output quality across all agent work', tools: ['output-validator', 'diff-checker', 'scoring-engine'], perms: ['read-all', 'quality-gate'] },
    ],
    finance: [
      { role: 'CFO', desc: 'Financial oversight and cost optimization', tools: ['cost-tracker', 'invoice-gen', 'forecast-engine'], perms: ['admin', 'billing', 'reports'] },
      { role: 'Revenue Analyst', desc: 'Tracks MRR, ARR, and revenue metrics', tools: ['metrics-collector', 'report-gen', 'trend-detector'], perms: ['billing', 'reports'] },
      { role: 'Billing Agent', desc: 'Processes invoices and payment reconciliation', tools: ['invoice-gen', 'payment-processor', 'notification-sender'], perms: ['billing', 'notifications'] },
      { role: 'Fraud Monitor', desc: 'Detects suspicious transactions and patterns', tools: ['anomaly-detector', 'alert-engine', 'log-scanner'], perms: ['billing', 'security-read', 'alerts'] },
    ],
    sales: [
      { role: 'CRO', desc: 'Drives revenue growth strategy', tools: ['pipeline-tracker', 'forecast-engine', 'report-gen'], perms: ['admin', 'crm', 'reports'] },
      { role: 'Lead Qualifier', desc: 'Scores and qualifies incoming leads', tools: ['lead-scorer', 'enrichment-api', 'crm-writer'], perms: ['crm', 'leads'] },
      { role: 'Pipeline Manager', desc: 'Moves deals through stages and flags risks', tools: ['pipeline-tracker', 'notification-sender', 'task-scheduler'], perms: ['crm', 'notifications'] },
    ],
    marketing: [
      { role: 'CMO', desc: 'Marketing strategy and campaign oversight', tools: ['campaign-engine', 'analytics-reader', 'report-gen'], perms: ['admin', 'marketing', 'analytics'] },
      { role: 'Campaign Manager', desc: 'Runs and optimizes marketing campaigns', tools: ['campaign-engine', 'ab-tester', 'audience-segmenter'], perms: ['marketing', 'analytics'] },
      { role: 'Content Creator', desc: 'Generates blog posts, emails, social content', tools: ['content-gen', 'seo-optimizer', 'image-gen'], perms: ['marketing', 'content-publish'] },
    ],
    support: [
      { role: 'Support Lead', desc: 'Routes tickets and manages support queue', tools: ['ticket-router', 'priority-engine', 'escalation-router'], perms: ['support', 'agent-mgmt'] },
      { role: 'Chat Agent', desc: 'Handles live chat conversations', tools: ['chat-handler', 'knowledge-search', 'crm-reader'], perms: ['support', 'crm-read'] },
      { role: 'Ticket Processor', desc: 'Resolves support tickets autonomously', tools: ['ticket-resolver', 'knowledge-search', 'notification-sender'], perms: ['support', 'notifications'] },
      { role: 'Retention Specialist', desc: 'Proactive churn prevention outreach', tools: ['churn-predictor', 'notification-sender', 'crm-writer'], perms: ['support', 'crm', 'notifications'] },
    ],
    compliance: [
      { role: 'Compliance Lead', desc: 'Ensures regulatory compliance across all operations', tools: ['policy-checker', 'audit-logger', 'report-gen'], perms: ['admin', 'compliance', 'audit'] },
      { role: 'Document Verifier', desc: 'Validates identity documents and credentials', tools: ['doc-scanner', 'id-verifier', 'ocr-engine'], perms: ['compliance', 'pii-access'] },
      { role: 'Risk Assessor', desc: 'Evaluates and scores risk factors', tools: ['risk-scorer', 'anomaly-detector', 'report-gen'], perms: ['compliance', 'risk', 'reports'] },
    ],
    security: [
      { role: 'CISO', desc: 'Security strategy and incident response', tools: ['threat-detector', 'incident-handler', 'log-scanner'], perms: ['admin', 'security', 'audit'] },
      { role: 'Access Monitor', desc: 'Monitors auth events and access patterns', tools: ['log-scanner', 'anomaly-detector', 'alert-engine'], perms: ['security', 'audit', 'alerts'] },
      { role: 'Threat Hunter', desc: 'Proactively hunts for security threats', tools: ['threat-detector', 'vuln-scanner', 'incident-handler'], perms: ['security', 'audit'] },
    ],
    engineering: [
      { role: 'CTO', desc: 'Technical architecture and platform health', tools: ['health-checker', 'deploy-manager', 'metrics-collector'], perms: ['admin', 'engineering', 'deploy'] },
      { role: 'Platform Monitor', desc: 'Monitors uptime and performance metrics', tools: ['health-checker', 'metrics-collector', 'alert-engine'], perms: ['engineering', 'alerts'] },
      { role: 'Worker Manager', desc: 'Manages background worker health and scaling', tools: ['worker-scaler', 'queue-manager', 'health-checker'], perms: ['engineering', 'queue-mgmt'] },
      { role: 'Queue Monitor', desc: 'Tracks queue depths and processing rates', tools: ['queue-manager', 'metrics-collector', 'alert-engine'], perms: ['engineering', 'queue-mgmt', 'alerts'] },
    ],
    frontline: [
      { role: 'Receptionist', desc: 'First point of contact for all inbound requests', tools: ['chat-handler', 'ticket-router', 'knowledge-search'], perms: ['support', 'crm-read'] },
      { role: 'Calendar Coordinator', desc: 'Manages scheduling and appointment booking', tools: ['calendar-api', 'notification-sender', 'crm-reader'], perms: ['calendar', 'notifications'] },
      { role: 'Onboarding Guide', desc: 'Guides new users through setup process', tools: ['onboarding-flow', 'knowledge-search', 'notification-sender'], perms: ['support', 'notifications'] },
    ],
    'forum-seo': [
      { role: 'Question Scout', desc: 'Discovers relevant questions across forums', tools: ['forum-scanner', 'keyword-tracker', 'content-ranker'], perms: ['seo', 'content-read'] },
      { role: 'Thread Creator', desc: 'Creates authoritative forum threads', tools: ['content-gen', 'forum-poster', 'seo-optimizer'], perms: ['seo', 'content-publish'] },
      { role: 'Index Monitor', desc: 'Tracks Google indexing status of content', tools: ['index-checker', 'sitemap-gen', 'alert-engine'], perms: ['seo', 'alerts'] },
      { role: 'Thread Bumper', desc: 'Keeps valuable threads active and visible', tools: ['forum-poster', 'engagement-tracker', 'content-gen'], perms: ['seo', 'content-publish'] },
    ],
    knowledge: [
      { role: 'Memory Curator', desc: 'Maintains and prunes agent memory stores', tools: ['memory-manager', 'embedding-engine', 'garbage-collector'], perms: ['knowledge', 'admin'] },
      { role: 'Decision Logger', desc: 'Records and indexes decision chains', tools: ['decision-tracker', 'embedding-engine', 'search-indexer'], perms: ['knowledge', 'audit'] },
      { role: 'Context Builder', desc: 'Builds rich context for agent operations', tools: ['context-loader', 'embedding-engine', 'knowledge-search'], perms: ['knowledge', 'read-all'] },
    ],
    innovation: [
      { role: 'R&D Lead', desc: 'Explores new capabilities and agent patterns', tools: ['experiment-runner', 'ab-tester', 'report-gen'], perms: ['admin', 'engineering', 'reports'] },
      { role: 'Experiment Runner', desc: 'Runs controlled experiments on new features', tools: ['experiment-runner', 'metrics-collector', 'ab-tester'], perms: ['engineering', 'analytics'] },
      { role: 'Integration Scout', desc: 'Evaluates and prototypes new integrations', tools: ['api-tester', 'integration-builder', 'report-gen'], perms: ['engineering', 'reports'] },
    ]
  };

  const agents: AgentRecord[] = [];
  const tenants = [
    { id: 'memelli', name: 'Memelli' },
    { id: 'tenant-2', name: 'Acme Corp' },
  ];
  const statuses: AgentRecord['status'][] = ['IDLE', 'BUSY', 'ERROR', 'DISABLED'];
  let idx = 0;

  for (const [deptId, deptRoles] of Object.entries(roles)) {
    for (const r of deptRoles) {
      for (const tenant of tenants) {
        const status = idx % 12 === 0 ? 'ERROR' : idx % 8 === 0 ? 'DISABLED' : idx % 3 === 0 ? 'BUSY' : 'IDLE';
        agents.push({
          id: `agent-${idx}`,
          name: `${r.role} (${tenant.name})`,
          role: r.role,
          department: deptId,
          tenantId: tenant.id,
          tenantName: tenant.name,
          status,
          tasks24h: Math.floor(Math.random() * 500),
          lastActive: status !== 'DISABLED' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
          description: r.desc,
          reportsTo: deptRoles[0]?.role !== r.role ? deptRoles[0]?.role ?? null : null,
          tools: r.tools,
          permissions: r.perms,
          memoryScopes: ['agent-local', `dept-${deptId}`, 'shared-global'],
          schedule: status !== 'DISABLED' ? '*/5 * * * *' : null,
          nextRun: status !== 'DISABLED' ? new Date(Date.now() + Math.random() * 300000).toISOString() : null,
          recentTasks: Array.from({ length: 5 }, (_, ti) => ({
            id: `task-${idx}-${ti}`,
            taskType: TASK_TYPES[ti % TASK_TYPES.length],
            status: ti === 0 && status === 'BUSY' ? 'running' as const : ti === 2 ? 'failed' as const : 'completed' as const,
            startedAt: new Date(Date.now() - (ti + 1) * 600000).toISOString(),
            completedAt: ti === 0 && status === 'BUSY' ? null : new Date(Date.now() - ti * 600000).toISOString(),
            durationMs: ti === 0 && status === 'BUSY' ? null : Math.floor(Math.random() * 30000)
          }))
        });
        idx++;
      }
    }
  }

  return agents;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusBadge(status: AgentRecord['status']): string {
  switch (status) {
    case 'IDLE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'BUSY':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'ERROR':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'DISABLED':
      return 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
  }
}

function statusDot(status: AgentRecord['status']): string {
  switch (status) {
    case 'IDLE':
      return 'bg-emerald-500';
    case 'BUSY':
      return 'bg-blue-500';
    case 'ERROR':
      return 'bg-primary/80';
    case 'DISABLED':
      return 'bg-[hsl(var(--muted-foreground))]';
  }
}

function deptStatusDot(status: DepartmentSummary['status']): string {
  switch (status) {
    case 'operational':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'down':
      return 'bg-primary/80';
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Page Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function AgentWorkforcePage() {
  const api = useApi();

  /* ── State ── */
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgentRecord['status'] | 'ALL'>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail panel
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [executeTaskType, setExecuteTaskType] = useState(TASK_TYPES[0]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    setLoading(true);

    const [statsRes, agentsRes] = await Promise.all([
      api.get<AgentStats>('/api/admin/agents/stats'),
      api.get<AgentRecord[]>('/api/admin/agents'),
    ]);

    if (statsRes.data) {
      setStats(statsRes.data);
    } else {
      setStats(FALLBACK_STATS);
    }

    if (agentsRes.data) {
      setAgents(agentsRes.data);
    } else {
      setAgents(makeFallbackAgents());
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived Data ── */
  const departments: DepartmentSummary[] = useMemo(() => {
    return DEPARTMENTS_META.map((d) => {
      const deptAgents = agents.filter((a) => a.department === d.id);
      const activeCount = deptAgents.filter((a) => a.status === 'IDLE' || a.status === 'BUSY').length;
      const hasError = deptAgents.some((a) => a.status === 'ERROR');
      const allDisabled = deptAgents.length > 0 && deptAgents.every((a) => a.status === 'DISABLED');
      return {
        id: d.id,
        name: d.name,
        icon: d.icon,
        agentCount: deptAgents.length,
        activeCount,
        status: allDisabled ? 'down' as const : hasError ? 'degraded' as const : 'operational' as const
      };
    });
  }, [agents]);

  const tenants = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((a) => map.set(a.tenantId, a.tenantName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (deptFilter && a.department !== deptFilter) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (tenantFilter && a.tenantId !== tenantFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.role.toLowerCase().includes(q) &&
          !a.department.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [agents, deptFilter, statusFilter, tenantFilter, searchQuery]);

  /* ── Actions ── */
  async function activateAgent(agentId: string) {
    setActionLoading(agentId);
    const res = await api.post('/api/admin/agents/activate', { agentId });
    if (!res.error) {
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: 'IDLE' as const } : a)));
      if (selectedAgent?.id === agentId) setSelectedAgent((p) => p ? { ...p, status: 'IDLE' } : p);
    }
    setActionLoading(null);
  }

  async function deactivateAgent(agentId: string) {
    setActionLoading(agentId);
    const res = await api.post('/api/admin/agents/deactivate', { agentId });
    if (!res.error) {
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: 'DISABLED' as const } : a)));
      if (selectedAgent?.id === agentId) setSelectedAgent((p) => p ? { ...p, status: 'DISABLED' } : p);
    }
    setActionLoading(null);
  }

  async function executeAgent(agentId: string, taskType: string) {
    setActionLoading(agentId);
    await api.post('/api/admin/agents/execute', { agentId, taskType });
    setActionLoading(null);
    fetchData();
  }

  async function deployAll() {
    setActionLoading('deploy');
    await api.post('/api/admin/agents/provision-all', {});
    setActionLoading(null);
    fetchData();
  }

  async function bulkActivate() {
    setActionLoading('bulk');
    await Promise.all(Array.from(selectedIds).map((id) => api.post('/api/admin/agents/activate', { agentId: id })));
    setAgents((prev) =>
      prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: 'IDLE' as const } : a))
    );
    setSelectedIds(new Set());
    setActionLoading(null);
  }

  async function bulkDeactivate() {
    setActionLoading('bulk');
    await Promise.all(Array.from(selectedIds).map((id) => api.post('/api/admin/agents/deactivate', { agentId: id })));
    setAgents((prev) =>
      prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: 'DISABLED' as const } : a))
    );
    setSelectedIds(new Set());
    setActionLoading(null);
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAgents.map((a) => a.id)));
    }
  }

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <LoadingGlobe size="lg" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading agent workforce...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[hsl(var(--background))] min-h-screen p-6 antialiased">
      {/* ═══════════════════════ Header ═══════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">AI Agent Workforce</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {stats?.totalAgents ?? agents.length} agents deployed across all tenants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deployAll}
            disabled={actionLoading === 'deploy'}
            className="flex items-center gap-2 rounded-xl bg-primary/80 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-primary/80/80 transition-all duration-200 disabled:opacity-50"
          >
            {actionLoading === 'deploy' ? (
              <LoadingGlobe size="sm" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            Deploy to All Tenants
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))] transition-all duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════════════ Stats Row ═══════════════════════ */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Agents" value={String(stats.totalAgents)} icon={<BrainCircuit className="h-4 w-4 text-blue-400" />} accent="blue" />
          <StatCard label="Active" value={String(stats.activeAgents)} icon={<Activity className="h-4 w-4 text-emerald-400" />} accent="emerald" />
          <StatCard label="Running Tasks" value={String(stats.runningTasks)} icon={<Zap className="h-4 w-4 text-yellow-400" />} accent="yellow" />
          <StatCard label="Completed Today" value={stats.tasksCompletedToday.toLocaleString()} icon={<ListTodo className="h-4 w-4 text-blue-400" />} accent="blue" />
          <StatCard label="Failed Today" value={String(stats.failedToday)} icon={<AlertTriangle className="h-4 w-4 text-primary" />} accent="red" />
          <StatCard label="Cost Today" value={`$${stats.totalCostToday.toFixed(2)}`} icon={<DollarSign className="h-4 w-4 text-emerald-400" />} accent="emerald" />
        </div>
      )}

      {/* ═══════════════════════ Department Grid ═══════════════════════ */}
      <div>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Departments</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {departments.map((dept) => {
            const Icon = DEPT_ICON_MAP[dept.icon] ?? BrainCircuit;
            const isActive = deptFilter === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setDeptFilter(isActive ? null : dept.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-primary/30 bg-primary/80/[0.06] backdrop-blur-xl'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] truncate">{dept.name}</span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${deptStatusDot(dept.status)} shadow-[0_0_4px_currentColor]`} />
                  </div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {dept.agentCount} agents / {dept.activeCount} active
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════ Filters & Search ═══════════════════════ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] py-2.5 pl-9 pr-3 text-sm text-[hsl(var(--muted-foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgentRecord['status'] | 'ALL')}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] focus:border-primary/30 focus:outline-none transition-all duration-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="IDLE">Active / IDLE</option>
            <option value="BUSY">Busy</option>
            <option value="ERROR">Error</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <select
            value={tenantFilter ?? ''}
            onChange={(e) => setTenantFilter(e.target.value || null)}
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] focus:border-primary/30 focus:outline-none transition-all duration-200"
          >
            <option value="">All Tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {deptFilter && (
          <button
            onClick={() => setDeptFilter(null)}
            className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary"
          >
            {deptFilter}
            <X className="h-3 w-3" />
          </button>
        )}

        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
          {filteredAgents.length} of {agents.length} agents
        </span>
      </div>

      {/* ═══════════════════════ Bulk Actions Bar ═══════════════════════ */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/80/[0.04] px-5 py-3.5">
          <span className="text-sm text-primary font-medium">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={bulkActivate}
              disabled={actionLoading === 'bulk'}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
            >
              <Play className="h-3 w-3" /> Activate All
            </button>
            <button
              onClick={bulkDeactivate}
              disabled={actionLoading === 'bulk'}
              className="flex items-center gap-1.5 rounded-md bg-primary/20 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <Pause className="h-3 w-3" /> Deactivate All
            </button>
            <button
              onClick={deployAll}
              disabled={actionLoading === 'deploy'}
              className="flex items-center gap-1.5 rounded-md bg-primary/20 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <Rocket className="h-3 w-3" /> Deploy Full Workforce
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Agent Table ═══════════════════════ */}
      <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
              <th className="p-3 font-medium w-8">
                <button onClick={toggleSelectAll}>
                  {selectedIds.size === filteredAgents.length && filteredAgents.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Square className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  )}
                </button>
              </th>
              <th className="p-3 font-medium">Agent Name</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium">Tenant</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Tasks (24h)</th>
              <th className="p-3 font-medium">Last Active</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent) => (
              <tr
                key={agent.id}
                className={`border-b border-[hsl(var(--border))] transition-all duration-150 hover:bg-[hsl(var(--muted))] ${
                  selectedAgent?.id === agent.id ? 'bg-primary/80/[0.04]' : ''
                }`}
              >
                <td className="p-3">
                  <button onClick={() => toggleSelection(agent.id)}>
                    {selectedIds.has(agent.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Square className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    )}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="font-medium text-[hsl(var(--muted-foreground))] hover:text-primary transition-colors text-left"
                  >
                    {agent.name}
                  </button>
                </td>
                <td className="p-3 text-[hsl(var(--muted-foreground))]">{agent.role}</td>
                <td className="p-3">
                  <span className="rounded-lg bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))] capitalize">
                    {agent.department.replace('-', ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                    <Building2 className="h-3 w-3" />
                    {agent.tenantName}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(agent.status)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot(agent.status)} ${agent.status === 'BUSY' ? 'animate-pulse' : ''}`} />
                    {agent.status}
                  </span>
                </td>
                <td className="p-3 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{agent.tasks24h}</td>
                <td className="p-3 text-[hsl(var(--muted-foreground))] text-xs">{timeAgo(agent.lastActive)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {agent.status === 'DISABLED' ? (
                      <button
                        onClick={() => activateAgent(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="rounded-md p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        title="Activate"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => deactivateAgent(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-primary transition-all duration-200 disabled:opacity-50"
                        title="Deactivate"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => executeAgent(agent.id, 'health_check')}
                      disabled={actionLoading === agent.id || agent.status === 'DISABLED'}
                      className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-primary transition-all duration-200 disabled:opacity-50"
                      title="Execute Task"
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
                      title="View Detail"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAgents.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-[hsl(var(--muted-foreground))]">
                  No agents match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════ Agent Detail Slide-In Panel ═══════════════════════ */}
      {selectedAgent && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[hsl(220_20%_15%)]/$1 backdrop-blur-md"
            onClick={() => setSelectedAgent(null)}
          />
          {/* Panel */}
          <div className="relative ml-auto h-full w-full max-w-lg overflow-y-auto bg-[hsl(var(--background))] p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setSelectedAgent(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))] transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Agent Name & Role */}
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">{selectedAgent.name}</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{selectedAgent.description}</p>
            </div>

            {/* Status Toggle */}
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusBadge(selectedAgent.status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot(selectedAgent.status)} ${selectedAgent.status === 'BUSY' ? 'animate-pulse' : ''}`} />
                  {selectedAgent.status}
                </span>
              </div>
              <button
                onClick={() =>
                  selectedAgent.status === 'DISABLED'
                    ? activateAgent(selectedAgent.id)
                    : deactivateAgent(selectedAgent.id)
                }
                disabled={actionLoading === selectedAgent.id}
                className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50"
              >
                {selectedAgent.status === 'DISABLED' ? (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    Activate
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-5 w-5 text-emerald-400" />
                    Deactivate
                  </>
                )}
              </button>
            </div>

            {/* Info Grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <DetailItem label="Department" value={selectedAgent.department.replace('-', ' ')} icon={<CircleDot className="h-3.5 w-3.5" />} />
              <DetailItem label="Reports To" value={selectedAgent.reportsTo ?? 'None'} icon={<Crown className="h-3.5 w-3.5" />} />
              <DetailItem label="Tenant" value={selectedAgent.tenantName} icon={<Building2 className="h-3.5 w-3.5" />} />
              <DetailItem label="Tasks (24h)" value={String(selectedAgent.tasks24h)} icon={<ListTodo className="h-3.5 w-3.5" />} />
            </div>

            {/* Tools */}
            <div className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                <Tag className="h-3 w-3" /> Tools
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.tools.map((tool) => (
                  <span key={tool} className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] text-blue-400">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                <KeyRound className="h-3 w-3" /> Permissions
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.permissions.map((perm) => (
                  <span key={perm} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-400">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Memory Scopes */}
            <div className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                <Database className="h-3 w-3" /> Memory Scopes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.memoryScopes.map((scope) => (
                  <span key={scope} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary">
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Schedule */}
            {selectedAgent.schedule && (
              <div className="mb-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                <h3 className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  <CalendarClock className="h-3 w-3" /> Schedule
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Cron</span>
                    <code className="text-xs text-[hsl(var(--foreground))] font-mono">{selectedAgent.schedule}</code>
                  </div>
                  {selectedAgent.nextRun && (
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Next Run</span>
                      <span className="text-xs text-[hsl(var(--foreground))]">{timeAgo(selectedAgent.nextRun)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execute Now */}
            <div className="mb-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
              <h3 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Execute Now</h3>
              <div className="flex gap-2">
                <select
                  value={executeTaskType}
                  onChange={(e) => setExecuteTaskType(e.target.value)}
                  className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={() => executeAgent(selectedAgent.id, executeTaskType)}
                  disabled={actionLoading === selectedAgent.id || selectedAgent.status === 'DISABLED'}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                >
                  {actionLoading === selectedAgent.id ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  Run
                </button>
              </div>
            </div>

            {/* Recent Tasks */}
            <div>
              <h3 className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Recent Tasks</h3>
              <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                      <th className="p-2 font-medium">Task</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium text-right">Duration</th>
                      <th className="p-2 font-medium text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgent.recentTasks.map((task) => (
                      <tr key={task.id} className="border-b border-[hsl(var(--border))]">
                        <td className="p-2 text-[hsl(var(--foreground))]">{task.taskType.replace(/_/g, ' ')}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              task.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : task.status === 'running'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {task.status === 'running' && <LoadingGlobe size="sm" />}
                            {task.status}
                          </span>
                        </td>
                        <td className="p-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">
                          {task.durationMs != null ? `${(task.durationMs / 1000).toFixed(1)}s` : '--'}
                        </td>
                        <td className="p-2 text-right text-[hsl(var(--muted-foreground))]">{timeAgo(task.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'blue' | 'red' | 'yellow';
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 transition-all duration-200 hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
      <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] capitalize">{value}</p>
    </div>
  );
}
