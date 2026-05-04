'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../../../../../hooks/useApi';
import VoiceButton from '@/components/ai/VoiceButton';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Search,
  Mic,
  X,
  PanelRightOpen,
  PanelRightClose,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

/* ----------------------------------------------------------------------- Types */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
}

interface AgentDef {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  description: string;
  tools: string[];
  permissions: string[];
  memoryScopes: string[];
}

interface RecentTask {
  id: string;
  label: string;
  status: 'completed' | 'running' | 'failed';
  timestamp: string;
}

interface ChatSession {
  id: string;
  agentId: string;
}

/* ----------------------------------------------------------------------- Fallback Agent Roster */

const DEPARTMENTS: { id: string; name: string; agents: Omit<AgentDef, 'department' | 'departmentId'>[] }[] = [
  {
    id: 'executive',
    name: 'Executive',
    agents: [
      { id: 'ceo', name: 'CEO Agent', role: 'CEO', status: 'active', description: 'Strategic oversight, revenue forecasting, cross-department alignment.', tools: ['analytics', 'forecasting', 'reporting'], permissions: ['all'], memoryScopes: ['global', 'executive'] },
      { id: 'cos', name: 'Chief of Staff', role: 'Chief of Staff', status: 'active', description: 'Cross-department coordination, executive scheduling, priority management.', tools: ['scheduling', 'task-routing', 'reporting'], permissions: ['read-all', 'delegate'], memoryScopes: ['global', 'executive'] },
      { id: 'strategy', name: 'Strategy Agent', role: 'Strategy', status: 'idle', description: 'Market analysis, competitive intelligence, growth planning.', tools: ['research', 'analytics', 'modeling'], permissions: ['read-all'], memoryScopes: ['global', 'executive', 'market'] },
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    agents: [
      { id: 'coo', name: 'COO Agent', role: 'COO', status: 'active', description: 'Pipeline optimization, workflow management, operational efficiency.', tools: ['workflow', 'monitoring', 'automation'], permissions: ['operations-all'], memoryScopes: ['global', 'operations'] },
      { id: 'workflow-mgr', name: 'Workflow Manager', role: 'Workflow Manager', status: 'active', description: 'Queue rebalancing, task routing, SLA enforcement.', tools: ['queue-manager', 'sla-monitor'], permissions: ['operations-write'], memoryScopes: ['operations'] },
      { id: 'qa', name: 'QA Agent', role: 'QA', status: 'active', description: 'Output validation, quality scoring, error detection.', tools: ['validator', 'scoring'], permissions: ['operations-read'], memoryScopes: ['operations', 'quality'] },
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    agents: [
      { id: 'cfo', name: 'CFO Agent', role: 'CFO', status: 'active', description: 'Financial oversight, reconciliation, budget management.', tools: ['accounting', 'forecasting', 'reporting'], permissions: ['finance-all'], memoryScopes: ['global', 'finance'] },
      { id: 'revenue', name: 'Revenue Agent', role: 'Revenue', status: 'active', description: 'MRR tracking, churn analysis, revenue attribution.', tools: ['analytics', 'billing'], permissions: ['finance-read'], memoryScopes: ['finance', 'revenue'] },
      { id: 'billing', name: 'Billing Agent', role: 'Billing', status: 'active', description: 'Invoice generation, payment processing, dunning workflows.', tools: ['invoicing', 'payment-gateway'], permissions: ['finance-write'], memoryScopes: ['finance', 'billing'] },
      { id: 'fraud', name: 'Fraud Agent', role: 'Fraud Detection', status: 'idle', description: 'Transaction monitoring, anomaly detection, fraud alerting.', tools: ['anomaly-detection', 'alerting'], permissions: ['finance-read', 'security-write'], memoryScopes: ['finance', 'security'] },
    ]
  },
  {
    id: 'sales',
    name: 'Sales',
    agents: [
      { id: 'cro', name: 'CRO Agent', role: 'CRO', status: 'active', description: 'Deal reviews, pipeline strategy, revenue target tracking.', tools: ['crm', 'analytics', 'forecasting'], permissions: ['sales-all'], memoryScopes: ['global', 'sales'] },
      { id: 'lead-qual', name: 'Lead Qualifier', role: 'Lead Qualification', status: 'active', description: 'Lead scoring, qualification workflows, routing to reps.', tools: ['scoring', 'crm', 'enrichment'], permissions: ['sales-write'], memoryScopes: ['sales', 'leads'] },
      { id: 'pipeline', name: 'Pipeline Agent', role: 'Pipeline Manager', status: 'active', description: 'Stage progression, deal health, forecasting.', tools: ['crm', 'analytics'], permissions: ['sales-read'], memoryScopes: ['sales'] },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    agents: [
      { id: 'cmo', name: 'CMO Agent', role: 'CMO', status: 'active', description: 'Campaign strategy, brand management, channel optimization.', tools: ['campaigns', 'analytics', 'content'], permissions: ['marketing-all'], memoryScopes: ['global', 'marketing'] },
      { id: 'campaigns', name: 'Campaign Agent', role: 'Campaigns', status: 'active', description: 'A/B testing, campaign execution, performance analysis.', tools: ['email', 'ads', 'analytics'], permissions: ['marketing-write'], memoryScopes: ['marketing'] },
      { id: 'content', name: 'Content Agent', role: 'Content', status: 'active', description: 'Blog posts, social media, copy generation.', tools: ['writing', 'seo', 'social'], permissions: ['marketing-write'], memoryScopes: ['marketing', 'content'] },
    ]
  },
  {
    id: 'support',
    name: 'Support',
    agents: [
      { id: 'chat-agent', name: 'Chat Agent', role: 'Chat Support', status: 'active', description: 'Live chat handling, FAQ resolution, escalation routing.', tools: ['chat', 'knowledge-base', 'ticketing'], permissions: ['support-write'], memoryScopes: ['support', 'customers'] },
      { id: 'ticket-proc', name: 'Ticket Processor', role: 'Ticket Processing', status: 'active', description: 'Ticket triage, auto-categorization, SLA tracking.', tools: ['ticketing', 'classification'], permissions: ['support-write'], memoryScopes: ['support'] },
      { id: 'retention', name: 'Retention Agent', role: 'Retention', status: 'active', description: 'Churn risk detection, save offers, outreach campaigns.', tools: ['crm', 'email', 'analytics'], permissions: ['support-write', 'sales-read'], memoryScopes: ['support', 'customers'] },
    ]
  },
  {
    id: 'compliance',
    name: 'Compliance',
    agents: [
      { id: 'doc-verify', name: 'Doc Verifier', role: 'Document Verification', status: 'active', description: 'ID validation, document authenticity checks, KYC workflows.', tools: ['ocr', 'verification', 'kyc'], permissions: ['compliance-write'], memoryScopes: ['compliance'] },
      { id: 'policy', name: 'Policy Agent', role: 'Policy', status: 'idle', description: 'Regulatory monitoring, policy enforcement, audit trails.', tools: ['policy-engine', 'audit'], permissions: ['compliance-all'], memoryScopes: ['compliance', 'legal'] },
      { id: 'risk', name: 'Risk Agent', role: 'Risk Assessment', status: 'active', description: 'Risk scoring, portfolio analysis, exposure monitoring.', tools: ['risk-model', 'analytics'], permissions: ['compliance-read'], memoryScopes: ['compliance', 'risk'] },
    ]
  },
  {
    id: 'security',
    name: 'Security',
    agents: [
      { id: 'access-mon', name: 'Access Monitor', role: 'Access Control', status: 'active', description: 'Auth log scanning, permission auditing, session monitoring.', tools: ['log-scanner', 'alerting'], permissions: ['security-all'], memoryScopes: ['security'] },
      { id: 'threat-det', name: 'Threat Detector', role: 'Threat Detection', status: 'active', description: 'Anomaly detection, intrusion monitoring, threat alerting.', tools: ['anomaly-detection', 'firewall', 'alerting'], permissions: ['security-all'], memoryScopes: ['security'] },
    ]
  },
  {
    id: 'engineering',
    name: 'Engineering',
    agents: [
      { id: 'platform-health', name: 'Platform Health', role: 'Platform Monitor', status: 'active', description: 'Uptime monitoring, performance metrics, incident detection.', tools: ['monitoring', 'alerting'], permissions: ['engineering-read'], memoryScopes: ['engineering'] },
      { id: 'worker-health', name: 'Worker Health', role: 'Worker Monitor', status: 'active', description: 'Worker process health, restart management, resource monitoring.', tools: ['process-manager', 'monitoring'], permissions: ['engineering-write'], memoryScopes: ['engineering'] },
      { id: 'queue-health', name: 'Queue Health', role: 'Queue Monitor', status: 'active', description: 'Queue depth monitoring, dead letter handling, throughput analysis.', tools: ['queue-monitor', 'analytics'], permissions: ['engineering-read'], memoryScopes: ['engineering'] },
    ]
  },
  {
    id: 'frontline',
    name: 'Frontline',
    agents: [
      { id: 'receptionist', name: 'Receptionist', role: 'Receptionist', status: 'active', description: 'Call routing, inquiry handling, visitor management.', tools: ['phone', 'routing', 'crm'], permissions: ['frontline-write'], memoryScopes: ['frontline'] },
      { id: 'calendar', name: 'Calendar Agent', role: 'Calendar', status: 'active', description: 'Booking management, scheduling, appointment confirmations.', tools: ['calendar', 'email', 'sms'], permissions: ['frontline-write'], memoryScopes: ['frontline'] },
      { id: 'greeter', name: 'Greeter', role: 'Greeter', status: 'active', description: 'New visitor onboarding, first-touch personalization.', tools: ['onboarding', 'personalization'], permissions: ['frontline-read'], memoryScopes: ['frontline', 'customers'] },
    ]
  },
  {
    id: 'forum-seo',
    name: 'Forum SEO',
    agents: [
      { id: 'question-disc', name: 'Question Discovery', role: 'Question Discovery', status: 'active', description: 'Scanning Reddit, Quora, forums for relevant questions.', tools: ['web-scraper', 'nlp', 'ranking'], permissions: ['seo-write'], memoryScopes: ['seo', 'content'] },
      { id: 'thread-create', name: 'Thread Creator', role: 'Thread Creation', status: 'active', description: 'Drafting authoritative forum threads with backlinks.', tools: ['writing', 'seo', 'posting'], permissions: ['seo-write'], memoryScopes: ['seo', 'content'] },
      { id: 'indexing', name: 'Indexing Agent', role: 'Indexing', status: 'error', description: 'Google indexing API submission, crawl monitoring.', tools: ['google-api', 'sitemap'], permissions: ['seo-write'], memoryScopes: ['seo'] },
      { id: 'reping', name: 'Reping Agent', role: 'Thread Refresh', status: 'active', description: 'Bumping stale threads, updating outdated answers.', tools: ['posting', 'scheduling'], permissions: ['seo-write'], memoryScopes: ['seo'] },
    ]
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    agents: [
      { id: 'memory-curator', name: 'Memory Curator', role: 'Memory Curator', status: 'active', description: 'Pruning stale memories, relevance scoring, deduplication.', tools: ['memory-store', 'ranking'], permissions: ['knowledge-all'], memoryScopes: ['global', 'knowledge'] },
      { id: 'decision-rec', name: 'Decision Recorder', role: 'Decision Recorder', status: 'active', description: 'Logging decision chains, rationale capture, audit trails.', tools: ['logging', 'memory-store'], permissions: ['knowledge-write'], memoryScopes: ['knowledge'] },
      { id: 'context-builder', name: 'Context Builder', role: 'Context Builder', status: 'active', description: 'Building tenant context, assembling agent working memory.', tools: ['memory-store', 'aggregation'], permissions: ['knowledge-read'], memoryScopes: ['global', 'knowledge'] },
    ]
  },
  {
    id: 'coaching',
    name: 'Coaching',
    agents: [
      { id: 'credit-coach', name: 'Credit Coach', role: 'Credit Coach', status: 'active', description: 'Personalized credit improvement plans, dispute strategy.', tools: ['credit-analysis', 'dispute-engine', 'education'], permissions: ['coaching-write'], memoryScopes: ['coaching', 'customers'] },
      { id: 'financial-coach', name: 'Financial Coach', role: 'Financial Coach', status: 'active', description: 'Budgeting guidance, debt payoff strategies, savings plans.', tools: ['budgeting', 'calculators', 'education'], permissions: ['coaching-write'], memoryScopes: ['coaching', 'customers'] },
      { id: 'onboarding-coach', name: 'Onboarding Coach', role: 'Onboarding', status: 'idle', description: 'New client orientation, portal walkthrough, goal setting.', tools: ['onboarding', 'scheduling', 'education'], permissions: ['coaching-read'], memoryScopes: ['coaching'] },
    ]
  },
];

const ALL_AGENTS: AgentDef[] = DEPARTMENTS.flatMap((dept) =>
  dept.agents.map((a) => ({ ...a, department: dept.name, departmentId: dept.id })),
);

/* ----------------------------------------------------------------------- Quick Actions */

const QUICK_ACTIONS: Record<string, string[]> = {
  executive: ['Give me a business summary', "What's the company status?", 'Revenue forecast this quarter'],
  operations: ["How's throughput today?", 'Any bottlenecks?', 'Show queue depths'],
  finance: ['Monthly revenue report', 'Outstanding invoices', 'Cash flow status'],
  sales: ["How's the pipeline?", 'Score this lead', 'Top deals this week'],
  marketing: ['Campaign performance', 'Content calendar status', 'Top performing channels'],
  support: ['Check open tickets', "What's the SLA status?", 'Escalated issues'],
  compliance: ['Pending verifications', 'Compliance audit status', 'Policy violations this week'],
  security: ['Any security alerts?', 'Failed login attempts', 'Permission audit'],
  engineering: ['System health check', 'Worker status', 'Queue depths'],
  frontline: ["Today's appointments", 'Missed calls', 'New visitor count'],
  'forum-seo': ['Discover questions today', 'What threads need refresh?', 'Indexing status'],
  knowledge: ['Memory usage stats', 'Stale memories count', 'Recent decisions logged'],
  coaching: ['Active coaching sessions', 'Client progress summary', 'Pending action items']
};

/* ----------------------------------------------------------------------- Recent Tasks (mock) */

function getMockRecentTasks(agentId: string): RecentTask[] {
  const base = [
    { id: `${agentId}-t1`, label: 'Process daily report', status: 'completed' as const, timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: `${agentId}-t2`, label: 'Sync cross-department data', status: 'completed' as const, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: `${agentId}-t3`, label: 'Run scheduled analysis', status: 'running' as const, timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: `${agentId}-t4`, label: 'Update memory context', status: 'completed' as const, timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: `${agentId}-t5`, label: 'Health check ping', status: 'completed' as const, timestamp: new Date(Date.now() - 900000).toISOString() },
  ];
  return base;
}

/* ----------------------------------------------------------------------- Helpers */

function statusDotColor(status: AgentDef['status']): string {
  switch (status) {
    case 'active': return 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]';
    case 'idle': return 'bg-white/20';
    case 'error': return 'bg-primary/80 shadow-[0_0_6px_rgba(239,68,68,0.5)]';
    case 'offline': return 'bg-white/10';
  }
}

function statusLabel(status: AgentDef['status']): string {
  switch (status) {
    case 'active': return 'Active';
    case 'idle': return 'Idle';
    case 'error': return 'Error';
    case 'offline': return 'Offline';
  }
}

function taskStatusIcon(status: RecentTask['status']) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case 'running': return <LoadingGlobe size="sm" />;
    case 'failed': return <XCircle className="h-3.5 w-3.5 text-primary" />;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ----------------------------------------------------------------------- Page Component */

export default function AgentChatPage() {
  const api = useApi();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showActions, setShowActions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close actions dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter agents
  const filteredDepartments = DEPARTMENTS.map((dept) => ({
    ...dept,
    agents: dept.agents.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  })).filter((dept) => dept.agents.length > 0);

  // Toggle department collapse
  const toggleDept = useCallback((deptId: string) => {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }, []);

  // Select agent & create session
  const selectAgent = useCallback(
    async (agent: AgentDef) => {
      setSelectedAgent(agent);
      setMessages([
        {
          id: generateId(),
          role: 'system',
          content: `Connected to ${agent.name} (${agent.role}) in ${agent.department}`,
          timestamp: new Date().toISOString()
        },
      ]);
      setSession(null);

      // Create chat session
      const res = await api.post<ChatSession>('/api/agents-chat/sessions', {
        agentId: agent.id,
        agentRole: agent.role,
        department: agent.departmentId
      });
      if (res.data) {
        setSession(res.data);
      } else {
        // Use a mock session if API not available
        setSession({ id: `local-${Date.now()}`, agentId: agent.id });
      }
    },
    [api],
  );

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !selectedAgent) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setSending(true);

      // Auto-resize textarea back
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }

      const sessionId = session?.id ?? 'pending';
      const res = await api.post<{ message: ChatMessage }>(`/api/agents-chat/sessions/${sessionId}/messages`, {
        content: content.trim(),
        role: 'user'
      });

      if (res.data?.message) {
        setMessages((prev) => [...prev, res.data!.message]);
      } else {
        // Mock response when API unavailable
        const mockResponse: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `I'm ${selectedAgent.name}, your ${selectedAgent.role} in the ${selectedAgent.department} department. I received your message: "${content.trim()}". I'm ready to help with any ${selectedAgent.department.toLowerCase()}-related tasks.`,
          timestamp: new Date().toISOString(),
          agentName: selectedAgent.name
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, mockResponse]);
          setSending(false);
        }, 800);
        return;
      }

      setSending(false);
    },
    [selectedAgent, session, api],
  );

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage],
  );

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = '44px';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  }, []);

  // Voice transcript handler
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  // Quick action handler
  const handleQuickAction = useCallback(
    (action: string) => {
      setShowActions(false);
      sendMessage(action);
    },
    [sendMessage],
  );

  const quickActions = selectedAgent ? QUICK_ACTIONS[selectedAgent.departmentId] ?? [] : [];
  const recentTasks = selectedAgent ? getMockRecentTasks(selectedAgent.id) : [];

  /* =============================== Render =============================== */

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden bg-[hsl(var(--background))] antialiased">
      {/* ----------- Left Sidebar: Agent Selector ----------- */}
      <div className="w-72 shrink-0 bg-[hsl(var(--background))] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] tracking-tight">Agent Chat</h2>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-3">
            {DEPARTMENTS.length} departments, {ALL_AGENTS.length}+ agents
          </p>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl pl-8 pr-3 py-2 text-sm text-[hsl(var(--muted-foreground))] placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
          {filteredDepartments.map((dept) => {
            const isCollapsed = collapsedDepts.has(dept.id);
            return (
              <div key={dept.id}>
                <button
                  onClick={() => toggleDept(dept.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[hsl(var(--muted))] transition-all duration-150"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    {dept.name}
                  </span>
                  <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">{dept.agents.length}</span>
                </button>

                {!isCollapsed && (
                  <div className="pb-1">
                    {dept.agents.map((agent) => {
                      const isSelected = selectedAgent?.id === agent.id;
                      return (
                        <button
                          key={agent.id}
                          onClick={() =>
                            selectAgent({ ...agent, department: dept.name, departmentId: dept.id })
                          }
                          className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-primary/80/[0.06] border-r-2 border-primary'
                              : 'hover:bg-[hsl(var(--muted))]'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 ${statusDotColor(agent.status)}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm truncate ${isSelected ? 'text-primary/80 font-medium' : 'text-[hsl(var(--muted-foreground))]'}`}>
                              {agent.name}
                            </p>
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{agent.role}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------- Main Chat Area ----------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))]">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] backdrop-blur-sm">
                  <Bot className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] tracking-tight">{selectedAgent.name}</h3>
                    <span className={`h-2 w-2 rounded-full ${statusDotColor(selectedAgent.status)}`} />
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{statusLabel(selectedAgent.status)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{selectedAgent.role}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">|</span>
                    <span className="rounded-lg bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {selectedAgent.department}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200"
                title={showInfoPanel ? 'Hide info panel' : 'Show info panel'}
              >
                {showInfoPanel ? (
                  <PanelRightClose className="h-4.5 w-4.5" />
                ) : (
                  <PanelRightOpen className="h-4.5 w-4.5" />
                )}
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
              {messages.map((msg) => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] italic">
                        {msg.content}
                        <span className="ml-2 text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[70%]">
                        <div className="rounded-2xl rounded-br-md bg-primary/80 px-4 py-2.5 text-sm text-[hsl(var(--foreground))]">
                          {msg.content}
                        </div>
                        <p className="text-right text-[10px] text-[hsl(var(--muted-foreground))] mt-1 mr-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                }

                // assistant
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[70%]">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-medium text-primary">
                          {msg.agentName ?? selectedAgent.name}
                        </span>
                      </div>
                      <div className="rounded-2xl rounded-bl-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))]">
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 ml-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <div className="flex items-end gap-3">
                {/* Execute Task Dropdown */}
                <div className="relative" ref={actionsRef}>
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:border-white/[0.1] transition-all duration-200"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Execute Task</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showActions && quickActions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl shadow-black/50 py-1 z-50">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                        Quick Actions
                      </p>
                      {quickActions.map((action) => (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-150"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedAgent.name}...`}
                    rows={1}
                    className="w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 pr-12 text-sm text-[hsl(var(--muted-foreground))] placeholder-white/20 focus:outline-none focus:border-primary/30 transition-all duration-200"
                    style={{ height: 44, maxHeight: 160 }}
                  />
                </div>

                {/* Voice Button */}
                <VoiceButton
                  onTranscript={handleVoiceTranscript}
                  size="sm"
                />

                {/* Send Button */}
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || sending}
                  className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary/80 text-[hsl(var(--foreground))] hover:bg-primary/80/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
                >
                  {sending ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--muted-foreground))] tracking-tight">Select an Agent</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-xs">
                Choose an agent from the sidebar to start a conversation. Chat with any agent across all {DEPARTMENTS.length} departments.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ----------- Right Info Panel ----------- */}
      {showInfoPanel && selectedAgent && (
        <div className="w-80 shrink-0 bg-[hsl(var(--background))] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
          <div className="p-4 space-y-5">
            {/* Agent Details */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                Agent Details
              </h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{selectedAgent.description}</p>

              {/* Tools */}
              <div className="mt-3">
                <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] backdrop-blur-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-3">
                <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400/80"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[hsl(var(--border))]" />

            {/* Current Context */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                Current Context
              </h4>

              <div className="space-y-2.5">
                <div>
                  <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-1">Tenant Scope</p>
                  <span className="rounded-lg bg-primary/80/[0.06] border border-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/80">
                    Current Tenant
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Memory Scopes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.memoryScopes.map((scope) => (
                      <span
                        key={scope}
                        className="rounded-lg bg-primary/80/[0.06] border border-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/80"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[hsl(var(--border))]" />

            {/* Recent Activity */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2"
                  >
                    <div className="mt-0.5 shrink-0">{taskStatusIcon(task.status)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{task.label}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(task.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
