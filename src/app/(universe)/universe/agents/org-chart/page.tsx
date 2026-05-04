'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Crown,
  Settings,
  DollarSign,
  TrendingUp,
  Megaphone,
  Headphones,
  Shield,
  Lock,
  Code2,
  UserCheck,
  Search,
  BookOpen,
  Lightbulb,
  Bot,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  Play,
  MessageSquare,
  Zap,
  LayoutGrid,
  List,
  Users
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

interface OrgAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId: string;
  status: 'active' | 'idle' | 'error' | 'disabled';
  reportsTo: string | null;
  directReports: string[];
  tasksToday: number;
  description: string;
  tools: string[];
  permissions: string[];
  memoryScopes: string[];
  schedule: string;
}

interface OrgDepartment {
  id: string;
  name: string;
  icon: string;
  headId: string;
  agentIds: string[];
}

interface DepartmentsResponse {
  departments: OrgDepartment[];
}

interface AgentsResponse {
  agents: OrgAgent[];
}

/* ─────────────────────────── Static Org Data ─────────────────────────── */

const DEPARTMENTS: OrgDepartment[] = [
  { id: 'executive', name: 'Executive', icon: 'executive', headId: 'ceo', agentIds: ['ceo', 'chief-of-staff', 'strategy-analyst'] },
  { id: 'operations', name: 'Operations', icon: 'operations', headId: 'coo', agentIds: ['coo', 'ops-director', 'workflow-manager', 'qa-specialist'] },
  { id: 'finance', name: 'Finance', icon: 'finance', headId: 'cfo', agentIds: ['cfo', 'revenue-manager', 'billing-specialist', 'fraud-detector'] },
  { id: 'sales', name: 'Sales', icon: 'sales', headId: 'cro', agentIds: ['cro', 'sales-director', 'lead-qualifier', 'pipeline-monitor'] },
  { id: 'marketing', name: 'Marketing', icon: 'marketing', headId: 'cmo', agentIds: ['cmo', 'campaign-manager', 'content-writer'] },
  { id: 'support', name: 'Support', icon: 'support', headId: 'support-director', agentIds: ['support-director', 'chat-agent', 'ticket-processor', 'retention-specialist'] },
  { id: 'compliance', name: 'Compliance', icon: 'compliance', headId: 'compliance-director', agentIds: ['compliance-director', 'doc-verifier', 'policy-enforcer', 'risk-assessor'] },
  { id: 'security', name: 'Security', icon: 'security', headId: 'security-director', agentIds: ['security-director', 'access-monitor', 'threat-detector'] },
  { id: 'engineering', name: 'Engineering', icon: 'engineering', headId: 'platform-manager', agentIds: ['platform-manager', 'worker-health-monitor', 'queue-health-monitor'] },
  { id: 'frontline', name: 'Frontline', icon: 'frontline', headId: 'receptionist', agentIds: ['receptionist', 'calendar-manager', 'file-manager', 'greeter'] },
  {
    id: 'forum-seo', name: 'Forum SEO', icon: 'forum-seo', headId: 'forum-director',
    agentIds: [
      'forum-director', 'question-discovery', 'priority-agent', 'thread-creator', 'direct-answer',
      'discussion-expander', 'thread-linker', 'topic-cluster-manager', 'seo-structure', 'indexing-manager',
      'reping-manager', 'traffic-analyst', 'thread-refresher', 'authority-expander', 'ai-moderator',
      'community-engagement', 'conversion-assistant',
    ]
  },
  { id: 'knowledge', name: 'Knowledge', icon: 'knowledge', headId: 'memory-curator', agentIds: ['memory-curator', 'decision-recorder', 'context-builder'] },
  { id: 'innovation', name: 'Innovation', icon: 'innovation', headId: 'idea-generator', agentIds: ['idea-generator', 'market-scanner'] },
];

function makeAgent(
  id: string, name: string, role: string, deptId: string, dept: string,
  status: OrgAgent['status'], reportsTo: string | null, directReports: string[],
  tasksToday: number, description: string, tools: string[], permissions: string[],
  memoryScopes: string[], schedule: string,
): OrgAgent {
  return { id, name, role, departmentId: deptId, department: dept, status, reportsTo, directReports, tasksToday, description, tools, permissions, memoryScopes, schedule };
}

const AGENTS: OrgAgent[] = [
  // Executive
  makeAgent('ceo', 'CEO', 'Chief Executive Officer', 'executive', 'Executive', 'active', null,
    ['chief-of-staff', 'coo', 'cfo', 'cro', 'cmo', 'support-director', 'compliance-director', 'security-director', 'platform-manager', 'receptionist', 'forum-director', 'memory-curator', 'idea-generator'],
    12, 'Oversees all AI operations, sets company strategy, reviews cross-department performance.',
    ['strategy-planner', 'report-generator', 'kpi-dashboard'], ['admin', 'read-all', 'write-all'], ['global', 'executive'], '24/7'),
  makeAgent('chief-of-staff', 'Chief of Staff', 'Chief of Staff', 'executive', 'Executive', 'active', 'ceo', ['strategy-analyst'],
    8, 'Coordinates cross-department initiatives and manages CEO agenda.',
    ['calendar', 'task-router', 'meeting-scheduler'], ['admin', 'read-all'], ['executive', 'operations'], '24/7'),
  makeAgent('strategy-analyst', 'Strategy Analyst', 'Strategy Analyst', 'executive', 'Executive', 'idle', 'chief-of-staff', [],
    3, 'Analyzes market data and internal metrics to inform strategy.',
    ['data-analyzer', 'report-generator'], ['read-all'], ['executive', 'analytics'], '9am-6pm'),

  // Operations
  makeAgent('coo', 'COO', 'Chief Operating Officer', 'operations', 'Operations', 'active', 'ceo', ['ops-director'],
    15, 'Runs day-to-day operations, ensures all systems are performing.',
    ['system-monitor', 'workflow-engine', 'alert-manager'], ['admin', 'operations'], ['global', 'operations'], '24/7'),
  makeAgent('ops-director', 'Ops Director', 'Operations Director', 'operations', 'Operations', 'active', 'coo', ['workflow-manager', 'qa-specialist'],
    11, 'Manages operational workflows and team assignments.',
    ['workflow-engine', 'task-assigner'], ['operations', 'read-all'], ['operations'], '24/7'),
  makeAgent('workflow-manager', 'Workflow Manager', 'Workflow Manager', 'operations', 'Operations', 'active', 'ops-director', [],
    22, 'Orchestrates task queues, manages pipeline throughput.',
    ['queue-manager', 'load-balancer'], ['operations'], ['operations', 'queues'], '24/7'),
  makeAgent('qa-specialist', 'QA Specialist', 'Quality Assurance', 'operations', 'Operations', 'active', 'ops-director', [],
    18, 'Validates output quality across all departments.',
    ['output-validator', 'regression-tester'], ['read-all'], ['operations', 'quality'], '24/7'),

  // Finance
  makeAgent('cfo', 'CFO', 'Chief Financial Officer', 'finance', 'Finance', 'active', 'ceo', ['revenue-manager'],
    7, 'Oversees all financial operations, budgeting, and forecasting.',
    ['financial-model', 'report-generator', 'budget-tracker'], ['admin', 'finance'], ['global', 'finance'], '24/7'),
  makeAgent('revenue-manager', 'Revenue Manager', 'Revenue Manager', 'finance', 'Finance', 'active', 'cfo', ['billing-specialist', 'fraud-detector'],
    9, 'Tracks MRR, ARR, and revenue streams across products.',
    ['revenue-tracker', 'subscription-manager'], ['finance', 'read-all'], ['finance', 'revenue'], '24/7'),
  makeAgent('billing-specialist', 'Billing Specialist', 'Billing Specialist', 'finance', 'Finance', 'active', 'revenue-manager', [],
    34, 'Processes invoices, handles payment disputes, manages subscriptions.',
    ['invoice-generator', 'payment-processor'], ['finance'], ['finance', 'billing'], '24/7'),
  makeAgent('fraud-detector', 'Fraud Detector', 'Fraud Detection', 'finance', 'Finance', 'active', 'revenue-manager', [],
    5, 'Monitors transactions for suspicious patterns and flags fraud.',
    ['anomaly-detector', 'risk-scorer'], ['finance', 'security'], ['finance', 'fraud'], '24/7'),

  // Sales
  makeAgent('cro', 'CRO', 'Chief Revenue Officer', 'sales', 'Sales', 'active', 'ceo', ['sales-director'],
    6, 'Drives revenue growth strategy, manages sales pipeline.',
    ['pipeline-dashboard', 'forecast-model'], ['admin', 'sales'], ['global', 'sales'], '24/7'),
  makeAgent('sales-director', 'Sales Director', 'Sales Director', 'sales', 'Sales', 'active', 'cro', ['lead-qualifier', 'pipeline-monitor'],
    10, 'Manages sales team, sets targets, reviews deal progress.',
    ['deal-tracker', 'team-dashboard'], ['sales', 'read-all'], ['sales'], '24/7'),
  makeAgent('lead-qualifier', 'Lead Qualifier', 'Lead Qualification', 'sales', 'Sales', 'active', 'sales-director', [],
    45, 'Scores and qualifies inbound leads for sales readiness.',
    ['lead-scorer', 'enrichment-api'], ['sales', 'crm'], ['sales', 'leads'], '24/7'),
  makeAgent('pipeline-monitor', 'Pipeline Monitor', 'Pipeline Monitor', 'sales', 'Sales', 'active', 'sales-director', [],
    14, 'Monitors deal progression and flags stalled opportunities.',
    ['pipeline-tracker', 'alert-manager'], ['sales'], ['sales', 'pipeline'], '24/7'),

  // Marketing
  makeAgent('cmo', 'CMO', 'Chief Marketing Officer', 'marketing', 'Marketing', 'active', 'ceo', ['campaign-manager'],
    5, 'Sets marketing strategy, oversees brand and growth.',
    ['analytics-dashboard', 'campaign-planner'], ['admin', 'marketing'], ['global', 'marketing'], '24/7'),
  makeAgent('campaign-manager', 'Campaign Manager', 'Campaign Manager', 'marketing', 'Marketing', 'active', 'cmo', ['content-writer'],
    8, 'Plans and executes marketing campaigns across channels.',
    ['campaign-launcher', 'ab-tester', 'email-sender'], ['marketing'], ['marketing', 'campaigns'], '24/7'),
  makeAgent('content-writer', 'Content Writer', 'Content Writer', 'marketing', 'Marketing', 'active', 'campaign-manager', [],
    16, 'Creates blog posts, social content, and marketing copy.',
    ['text-generator', 'seo-optimizer'], ['marketing'], ['marketing', 'content'], '9am-9pm'),

  // Support
  makeAgent('support-director', 'Support Director', 'Support Director', 'support', 'Support', 'active', 'ceo', ['chat-agent', 'ticket-processor', 'retention-specialist'],
    7, 'Manages customer support operations and escalations.',
    ['ticket-dashboard', 'escalation-router'], ['support', 'read-all'], ['support'], '24/7'),
  makeAgent('chat-agent', 'Chat Agent', 'Live Chat Agent', 'support', 'Support', 'active', 'support-director', [],
    89, 'Handles real-time customer conversations via chat.',
    ['chat-responder', 'knowledge-search', 'handoff-trigger'], ['support', 'crm'], ['support', 'chat'], '24/7'),
  makeAgent('ticket-processor', 'Ticket Processor', 'Ticket Processor', 'support', 'Support', 'active', 'support-director', [],
    56, 'Processes, categorizes, and routes support tickets.',
    ['ticket-classifier', 'auto-responder'], ['support'], ['support', 'tickets'], '24/7'),
  makeAgent('retention-specialist', 'Retention Specialist', 'Retention Specialist', 'support', 'Support', 'active', 'support-director', [],
    12, 'Identifies at-risk customers and runs retention campaigns.',
    ['churn-predictor', 'outreach-sender'], ['support', 'crm'], ['support', 'retention'], '24/7'),

  // Compliance
  makeAgent('compliance-director', 'Compliance Director', 'Compliance Director', 'compliance', 'Compliance', 'active', 'ceo', ['doc-verifier', 'policy-enforcer', 'risk-assessor'],
    6, 'Ensures regulatory compliance across all operations.',
    ['compliance-scanner', 'audit-logger'], ['compliance', 'read-all'], ['compliance', 'global'], '24/7'),
  makeAgent('doc-verifier', 'Doc Verifier', 'Document Verifier', 'compliance', 'Compliance', 'active', 'compliance-director', [],
    42, 'Verifies identity documents and supporting paperwork.',
    ['ocr-engine', 'id-validator', 'fraud-check'], ['compliance'], ['compliance', 'documents'], '24/7'),
  makeAgent('policy-enforcer', 'Policy Enforcer', 'Policy Enforcer', 'compliance', 'Compliance', 'active', 'compliance-director', [],
    8, 'Enforces internal policies and flags violations.',
    ['policy-scanner', 'alert-manager'], ['compliance', 'read-all'], ['compliance', 'policies'], '24/7'),
  makeAgent('risk-assessor', 'Risk Assessor', 'Risk Assessor', 'compliance', 'Compliance', 'active', 'compliance-director', [],
    15, 'Assesses risk levels for clients and transactions.',
    ['risk-model', 'scoring-engine'], ['compliance', 'finance'], ['compliance', 'risk'], '24/7'),

  // Security
  makeAgent('security-director', 'Security Director', 'Security Director', 'security', 'Security', 'active', 'ceo', ['access-monitor', 'threat-detector'],
    4, 'Oversees platform security, manages incident response.',
    ['security-dashboard', 'incident-manager'], ['admin', 'security'], ['security', 'global'], '24/7'),
  makeAgent('access-monitor', 'Access Monitor', 'Access Monitor', 'security', 'Security', 'active', 'security-director', [],
    67, 'Monitors authentication events and access patterns.',
    ['auth-log-scanner', 'anomaly-detector'], ['security'], ['security', 'access'], '24/7'),
  makeAgent('threat-detector', 'Threat Detector', 'Threat Detector', 'security', 'Security', 'active', 'security-director', [],
    23, 'Scans for security threats and vulnerability patterns.',
    ['vulnerability-scanner', 'threat-intel'], ['security'], ['security', 'threats'], '24/7'),

  // Engineering
  makeAgent('platform-manager', 'Platform Manager', 'Platform Manager', 'engineering', 'Engineering', 'active', 'ceo', ['worker-health-monitor', 'queue-health-monitor'],
    19, 'Manages platform infrastructure and deployment health.',
    ['infra-monitor', 'deploy-manager', 'health-checker'], ['admin', 'engineering'], ['engineering', 'global'], '24/7'),
  makeAgent('worker-health-monitor', 'Worker Health Monitor', 'Worker Health Monitor', 'engineering', 'Engineering', 'active', 'platform-manager', [],
    156, 'Monitors background worker health and restarts failed workers.',
    ['process-monitor', 'auto-restarter'], ['engineering'], ['engineering', 'workers'], '24/7'),
  makeAgent('queue-health-monitor', 'Queue Health Monitor', 'Queue Health Monitor', 'engineering', 'Engineering', 'active', 'platform-manager', [],
    203, 'Monitors job queue depths and processing rates.',
    ['queue-monitor', 'alert-manager'], ['engineering'], ['engineering', 'queues'], '24/7'),

  // Frontline
  makeAgent('receptionist', 'Receptionist', 'Receptionist', 'frontline', 'Frontline', 'active', 'ceo', ['calendar-manager', 'file-manager', 'greeter'],
    34, 'First point of contact, routes visitors and requests.',
    ['call-router', 'visitor-tracker'], ['frontline', 'crm'], ['frontline'], '24/7'),
  makeAgent('calendar-manager', 'Calendar Manager', 'Calendar Manager', 'frontline', 'Frontline', 'active', 'receptionist', [],
    28, 'Manages appointments, bookings, and scheduling.',
    ['calendar-api', 'reminder-sender'], ['frontline'], ['frontline', 'calendar'], '24/7'),
  makeAgent('file-manager', 'File Manager', 'File Manager', 'frontline', 'Frontline', 'active', 'receptionist', [],
    17, 'Organizes, indexes, and retrieves documents and files.',
    ['file-indexer', 'search-engine'], ['frontline', 'read-all'], ['frontline', 'files'], '24/7'),
  makeAgent('greeter', 'Greeter', 'Greeter', 'frontline', 'Frontline', 'active', 'receptionist', [],
    52, 'Welcomes new visitors and provides initial onboarding.',
    ['welcome-flow', 'onboarding-guide'], ['frontline'], ['frontline', 'onboarding'], '24/7'),

  // Forum SEO
  makeAgent('forum-director', 'Forum Director', 'Forum SEO Director', 'forum-seo', 'Forum SEO', 'active', 'ceo',
    ['question-discovery', 'priority-agent', 'thread-creator', 'direct-answer', 'discussion-expander', 'thread-linker', 'topic-cluster-manager', 'seo-structure', 'indexing-manager', 'reping-manager', 'traffic-analyst', 'thread-refresher', 'authority-expander', 'ai-moderator', 'community-engagement', 'conversion-assistant'],
    11, 'Oversees all forum SEO operations and content strategy.',
    ['seo-dashboard', 'content-planner', 'analytics'], ['admin', 'forum-seo'], ['forum-seo', 'global'], '24/7'),
  makeAgent('question-discovery', 'Question Discovery', 'Question Discovery', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    38, 'Discovers trending questions across forums and search engines.',
    ['forum-scraper', 'trend-analyzer'], ['forum-seo'], ['forum-seo', 'questions'], '24/7'),
  makeAgent('priority-agent', 'Priority Agent', 'Priority Ranker', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    22, 'Ranks and prioritizes questions by SEO opportunity.',
    ['priority-scorer', 'keyword-analyzer'], ['forum-seo'], ['forum-seo', 'priority'], '24/7'),
  makeAgent('thread-creator', 'Thread Creator', 'Thread Creator', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    14, 'Creates optimized forum threads and seed content.',
    ['thread-generator', 'seo-optimizer'], ['forum-seo'], ['forum-seo', 'threads'], '24/7'),
  makeAgent('direct-answer', 'Direct Answer', 'Direct Answer Writer', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    31, 'Writes authoritative direct answers for forum questions.',
    ['answer-generator', 'fact-checker'], ['forum-seo'], ['forum-seo', 'answers'], '24/7'),
  makeAgent('discussion-expander', 'Discussion Expander', 'Discussion Expander', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    19, 'Expands discussions with follow-up questions and insights.',
    ['reply-generator', 'engagement-analyzer'], ['forum-seo'], ['forum-seo', 'discussions'], '24/7'),
  makeAgent('thread-linker', 'Thread Linker', 'Thread Linker', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    27, 'Creates internal links between related threads.',
    ['link-builder', 'relevance-matcher'], ['forum-seo'], ['forum-seo', 'linking'], '24/7'),
  makeAgent('topic-cluster-manager', 'Topic Cluster Manager', 'Topic Cluster Manager', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    9, 'Manages topic clusters and pillar content strategy.',
    ['cluster-planner', 'content-mapper'], ['forum-seo'], ['forum-seo', 'clusters'], '24/7'),
  makeAgent('seo-structure', 'SEO Structure', 'SEO Structure Optimizer', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    13, 'Optimizes page structure, headings, and schema markup.',
    ['schema-generator', 'structure-analyzer'], ['forum-seo'], ['forum-seo', 'structure'], '24/7'),
  makeAgent('indexing-manager', 'Indexing Manager', 'Indexing Manager', 'forum-seo', 'Forum SEO', 'error', 'forum-director', [],
    4, 'Manages Google indexing requests and monitors index status.',
    ['indexing-api', 'sitemap-generator'], ['forum-seo'], ['forum-seo', 'indexing'], '24/7'),
  makeAgent('reping-manager', 'Reping Manager', 'Reping Manager', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    35, 'Bumps stale threads and manages re-engagement timing.',
    ['scheduler', 'engagement-tracker'], ['forum-seo'], ['forum-seo', 'reping'], '24/7'),
  makeAgent('traffic-analyst', 'Traffic Analyst', 'Traffic Analyst', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    7, 'Analyzes traffic patterns and reports on SEO performance.',
    ['analytics-api', 'report-generator'], ['forum-seo', 'read-all'], ['forum-seo', 'analytics'], '24/7'),
  makeAgent('thread-refresher', 'Thread Refresher', 'Thread Refresher', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    21, 'Updates outdated content and refreshes old threads.',
    ['content-updater', 'freshness-checker'], ['forum-seo'], ['forum-seo', 'refresh'], '24/7'),
  makeAgent('authority-expander', 'Authority Expander', 'Authority Expander', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    11, 'Builds topical authority through comprehensive coverage.',
    ['authority-scorer', 'gap-analyzer'], ['forum-seo'], ['forum-seo', 'authority'], '24/7'),
  makeAgent('ai-moderator', 'AI Moderator', 'AI Moderator', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    46, 'Moderates forum content for quality and compliance.',
    ['content-filter', 'spam-detector'], ['forum-seo', 'compliance'], ['forum-seo', 'moderation'], '24/7'),
  makeAgent('community-engagement', 'Community Engagement', 'Community Engagement', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    29, 'Engages with community members and builds relationships.',
    ['engagement-bot', 'sentiment-analyzer'], ['forum-seo'], ['forum-seo', 'community'], '24/7'),
  makeAgent('conversion-assistant', 'Conversion Assistant', 'Conversion Assistant', 'forum-seo', 'Forum SEO', 'active', 'forum-director', [],
    16, 'Optimizes forum-to-product conversion paths.',
    ['cta-optimizer', 'funnel-tracker'], ['forum-seo', 'sales'], ['forum-seo', 'conversion'], '24/7'),

  // Knowledge
  makeAgent('memory-curator', 'Memory Curator', 'Memory Curator', 'knowledge', 'Knowledge', 'active', 'ceo', ['decision-recorder', 'context-builder'],
    14, 'Curates and organizes the company knowledge base.',
    ['memory-manager', 'indexer', 'pruner'], ['admin', 'read-all'], ['knowledge', 'global'], '24/7'),
  makeAgent('decision-recorder', 'Decision Recorder', 'Decision Recorder', 'knowledge', 'Knowledge', 'active', 'memory-curator', [],
    23, 'Records all significant decisions and their context.',
    ['decision-logger', 'context-capturer'], ['read-all'], ['knowledge', 'decisions'], '24/7'),
  makeAgent('context-builder', 'Context Builder', 'Context Builder', 'knowledge', 'Knowledge', 'active', 'memory-curator', [],
    18, 'Builds rich contextual packages for agent operations.',
    ['context-assembler', 'relevance-ranker'], ['read-all'], ['knowledge', 'context'], '24/7'),

  // Innovation
  makeAgent('idea-generator', 'Idea Generator', 'Idea Generator', 'innovation', 'Innovation', 'active', 'ceo', ['market-scanner'],
    5, 'Generates new product ideas and feature proposals.',
    ['brainstorm-engine', 'trend-analyzer'], ['read-all'], ['innovation', 'global'], '9am-6pm'),
  makeAgent('market-scanner', 'Market Scanner', 'Market Scanner', 'innovation', 'Innovation', 'active', 'idea-generator', [],
    8, 'Scans market trends, competitors, and emerging opportunities.',
    ['web-scraper', 'competitor-tracker'], ['read-all'], ['innovation', 'market'], '24/7'),
];

/* ─────────────────────────── Icon Map ─────────────────────────── */

type IconComponent = typeof Crown;

const ICON_MAP: Record<string, IconComponent> = {
  executive: Crown,
  operations: Settings,
  finance: DollarSign,
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

/* ─────────────────────────── Helpers ─────────────────────────── */

function statusDotClass(status: OrgAgent['status']): string {
  switch (status) {
    case 'active': return 'bg-emerald-400';
    case 'idle': return 'bg-[hsl(var(--muted-foreground))]';
    case 'error': return 'bg-red-400';
    case 'disabled': return 'bg-[hsl(var(--muted))]';
  }
}

function statusLabel(status: OrgAgent['status']): string {
  switch (status) {
    case 'active': return 'Active';
    case 'idle': return 'Idle';
    case 'error': return 'Error';
    case 'disabled': return 'Disabled';
  }
}

function agentMap(agents: OrgAgent[]): Map<string, OrgAgent> {
  const m = new Map<string, OrgAgent>();
  for (const a of agents) m.set(a.id, a);
  return m;
}

/* ─────────────────────────── Page Component ─────────────────────────── */

export default function OrgChartPage() {
  const api = useApi();
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [agents, setAgents] = useState<OrgAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<OrgAgent | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [deptRes, agentRes] = await Promise.all([
      api.get<DepartmentsResponse>('/api/admin/agents/departments'),
      api.get<AgentsResponse>('/api/admin/agents'),
    ]);

    if (deptRes.data?.departments && agentRes.data?.agents) {
      setDepartments(deptRes.data.departments);
      setAgents(agentRes.data.agents);
    } else {
      // Fallback to static data
      setDepartments(DEPARTMENTS);
      setAgents(AGENTS);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aMap = agentMap(agents);
  const ceo = aMap.get('ceo');

  const toggleDept = (id: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="bg-[hsl(var(--background))] flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingGlobe size="lg" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading org chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--background))] p-8 space-y-6 pb-12">
      {/* ═══════════════════════ Header ═══════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20">
            <Users className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">AI Company — Org Chart</h1>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              {agents.length} agents across {departments.length} departments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
            <button
              onClick={() => setView('chart')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                view === 'chart' ? 'bg-red-600 text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Chart
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                view === 'list' ? 'bg-red-600 text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════ Chart View ═══════════════════════ */}
      {view === 'chart' && (
        <div className="space-y-8">
          {/* CEO Card */}
          {ceo && (
            <div className="flex flex-col items-center">
              <button
                onClick={() => setSelectedAgent(ceo)}
                className="w-80 rounded-2xl border-2 border-primary/60 bg-[hsl(var(--card))] p-6 text-left transition-all duration-200 hover:border-primary hover:bg-[hsl(var(--muted))]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20">
                    <Crown className="h-7 w-7 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-[hsl(var(--foreground))]">{ceo.name}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(ceo.status)}`} />
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{ceo.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="rounded-xl bg-red-500/10 px-3 py-1 font-medium text-red-400">Executive</span>
                  <span className="text-[hsl(var(--muted-foreground))]">{ceo.tasksToday} tasks today</span>
                </div>
              </button>

              {/* Connector line down from CEO */}
              <div className="h-8 w-px bg-[hsl(var(--muted))]" />

              {/* Horizontal connector bar */}
              <div className="w-full max-w-6xl border-t border-[hsl(var(--border))]" />

              {/* C-Level Direct Reports */}
              <div className="mt-0 grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {ceo.directReports.map((reportId) => {
                  const agent = aMap.get(reportId);
                  if (!agent) return null;
                  const dept = departments.find((d) => d.id === agent.departmentId);
                  const DeptIcon = ICON_MAP[agent.departmentId] ?? Bot;
                  return (
                    <div key={reportId} className="flex flex-col items-center">
                      {/* Vertical connector from bar */}
                      <div className="h-4 w-px bg-[hsl(var(--muted))]" />
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-left transition-all duration-200 hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                      >
                        <div className="flex items-center gap-3">
                          <DeptIcon className="h-5 w-5 shrink-0 text-red-400" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{agent.name}</span>
                              <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(agent.status)}`} />
                            </div>
                            <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{agent.role}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="rounded-lg bg-[hsl(var(--muted))] px-2 py-1 text-[hsl(var(--muted-foreground))]">
                            {dept?.name ?? agent.department}
                          </span>
                          <span className="text-[hsl(var(--muted-foreground))]">{agent.tasksToday}t</span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Department Trees ── */}
          <div className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Departments</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {departments.map((dept) => {
                const DeptIcon = ICON_MAP[dept.icon] ?? Bot;
                const isExpanded = expandedDepts.has(dept.id);
                const deptAgents = dept.agentIds.map((id) => aMap.get(id)).filter(Boolean) as OrgAgent[];
                const head = aMap.get(dept.headId);

                return (
                  <div
                    key={dept.id}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isExpanded
                        ? 'border-primary/30 bg-[hsl(var(--card))]'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--border))]'
                    }`}
                  >
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="flex w-full items-center gap-4 p-6 text-left"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
                        <DeptIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{dept.name}</h3>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{deptAgents.length} agents</span>
                        </div>
                        {head && (
                          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                            Led by <span className="text-[hsl(var(--foreground))]">{head.name}</span>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-[hsl(var(--muted-foreground))]">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[hsl(var(--border))] px-6 pb-6 pt-4">
                        <DeptTree
                          agents={deptAgents}
                          headId={dept.headId}
                          aMap={aMap}
                          onSelect={setSelectedAgent}
                          depth={0}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ List View ═══════════════════════ */}
      {view === 'list' && (
        <div className="space-y-6">
          {departments.map((dept) => {
            const DeptIcon = ICON_MAP[dept.icon] ?? Bot;
            const deptAgents = dept.agentIds.map((id) => aMap.get(id)).filter(Boolean) as OrgAgent[];
            return (
              <div key={dept.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <div className="flex items-center gap-4 border-b border-[hsl(var(--border))] p-6">
                  <DeptIcon className="h-5 w-5 text-red-400" />
                  <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">{dept.name}</h3>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{deptAgents.length} agents</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))]">
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Agent</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Role</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Status</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Reports To</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">Tasks Today</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {deptAgents.map((agent) => {
                        const reportsToAgent = agent.reportsTo ? aMap.get(agent.reportsTo) : null;
                        return (
                          <tr
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className="cursor-pointer hover:bg-[hsl(var(--muted))] transition-all duration-200"
                          >
                            <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">{agent.name}</td>
                            <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] leading-relaxed">{agent.role}</td>
                            <td className="px-6 py-4">
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${statusDotClass(agent.status)}`} />
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">{statusLabel(agent.status)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">{reportsToAgent?.name ?? '—'}</td>
                            <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] tabular-nums">{agent.tasksToday}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════ Agent Detail Drawer ═══════════════════════ */}
      {selectedAgent && (
        <AgentDrawer
          agent={selectedAgent}
          aMap={aMap}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── Department Tree ─────────────────────────── */

function DeptTree({
  agents,
  headId,
  aMap,
  onSelect,
  depth
}: {
  agents: OrgAgent[];
  headId: string;
  aMap: Map<string, OrgAgent>;
  onSelect: (a: OrgAgent) => void;
  depth: number;
}) {
  const head = aMap.get(headId);
  if (!head) return null;

  const children = agents.filter((a) => a.reportsTo === headId && a.id !== headId);

  return (
    <div className={depth > 0 ? 'ml-6  pl-6' : ''}>
      <button
        onClick={() => onSelect(head)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 hover:bg-[hsl(var(--muted))]"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(head.status)}`} />
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{head.name}</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{head.role}</span>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{head.tasksToday}t</span>
      </button>
      {children.map((child) => (
        <DeptTree
          key={child.id}
          agents={agents}
          headId={child.id}
          aMap={aMap}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── Agent Detail Drawer ─────────────────────────── */

function AgentDrawer({
  agent,
  aMap,
  onClose
}: {
  agent: OrgAgent;
  aMap: Map<string, OrgAgent>;
  onClose: () => void;
}) {
  const reportsTo = agent.reportsTo ? aMap.get(agent.reportsTo) : null;
  const directReports = agent.directReports
    .map((id) => aMap.get(id))
    .filter(Boolean) as OrgAgent[];
  const DeptIcon = ICON_MAP[agent.departmentId] ?? Bot;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[hsl(var(--card))]" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-y-auto bg-[hsl(var(--background))] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
              <DeptIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{agent.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-8 p-8">
          {/* Status & Department */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 py-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(agent.status)}`} />
              <span className="text-[hsl(var(--foreground))]">{statusLabel(agent.status)}</span>
            </span>
            <span className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
              {agent.department}
            </span>
            <span className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">
              {agent.tasksToday} tasks today
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Description</h4>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{agent.description}</p>
          </div>

          {/* Reports To */}
          {reportsTo && (
            <div>
              <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Reports To</h4>
              <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(reportsTo.status)}`} />
                <span className="font-medium text-[hsl(var(--foreground))]">{reportsTo.name}</span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{reportsTo.role}</span>
              </div>
            </div>
          )}

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <div>
              <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Direct Reports ({directReports.length})
              </h4>
              <div className="space-y-2">
                {directReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(r.status)}`} />
                    <span className="font-medium text-[hsl(var(--foreground))]">{r.name}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">{r.role}</span>
                    <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{r.tasksToday}t</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div>
            <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Tools</h4>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map((tool) => (
                <span key={tool} className="rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {agent.permissions.map((perm) => (
                <span key={perm} className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Memory Scopes */}
          <div>
            <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Memory Scopes</h4>
            <div className="flex flex-wrap gap-2">
              {agent.memoryScopes.map((scope) => (
                <span key={scope} className="rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                  {scope}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Schedule</h4>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{agent.schedule}</p>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Quick Actions</h4>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200">
                <Play className="h-4 w-4" />
                Activate
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200">
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200">
                <Zap className="h-4 w-4" />
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}