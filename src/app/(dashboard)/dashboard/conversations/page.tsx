'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Brain,
  AlertTriangle,
  Target,
  TrendingUp,
  Search,
  Filter,
  X,
  ChevronRight,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Send,
  Eye,
  Zap,
  Shield,
  Settings,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  RefreshCw,
  UserCheck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Circle,
  Radio,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Modal } from '../../../../components/ui/modal';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConversationMetrics {
  activeConversations: number;
  highIntentVisitors: number;
  avgAiConfidence: number;
  escalationRate: number;
  qualifiedToday: number;
  conversionRate: number;
}

type ConversationStage =
  | 'new_visitor'
  | 'engaged'
  | 'intent_identified'
  | 'qualified'
  | 'escalated'
  | 'converted';

interface ConversationMessage {
  id: string;
  role: 'visitor' | 'ai' | 'human';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  visitorId: string;
  visitorName: string | null;
  muUid: string;
  stage: ConversationStage;
  intent: string;
  confidence: number;
  channel: 'web' | 'sms' | 'email' | 'voice';
  lastMessage: string;
  lastMessageAt: string;
  urgency: number;
  messages: ConversationMessage[];
  visitorInfo: {
    muUid: string;
    crmContactId: string | null;
    geo: string | null;
    device: string | null;
    sessionDuration: number;
    pagesViewed: number;
    currentPage: string | null;
  };
  qualificationChecklist: { label: string; completed: boolean }[];
  intentScores: Record<string, number>;
  actionsTaken: string[];
  escalationReason: string | null;
}

interface ActiveVisitor {
  muUid: string;
  currentPage: string;
  pagesViewed: number;
  sessionDuration: number;
  intentLevel: 'low' | 'medium' | 'high';
  crmMatch: boolean;
  highIntent: boolean;
  name: string | null;
}

interface VisitorSummary {
  muUid: string;
  pageTrail: string[];
  behaviorSignals: string[];
  intentHints: string[];
  sessionTimeline: { time: string; event: string }[];
}

interface TriggerRule {
  id: string;
  name: string;
  enabled: boolean;
  pageRules: string;
  behaviorRules: string;
  promptPreview: string;
  priority: number;
  cooldownMinutes: number;
}

type TabKey = 'live' | 'escalations' | 'intelligence' | 'triggers';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STAGE_CONFIG: Record<ConversationStage, { label: string; color: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'muted' | 'primary' | 'primary' | 'info' }> = {
  new_visitor: { label: 'New', color: 'bg-white/[0.04] text-white/50', variant: 'muted' },
  engaged: { label: 'Engaged', color: 'bg-blue-500/10 text-blue-300', variant: 'info' },
  intent_identified: { label: 'Intent', color: 'bg-red-500/10 text-red-300', variant: 'primary' },
  qualified: { label: 'Qualified', color: 'bg-emerald-500/10 text-emerald-300', variant: 'success' },
  escalated: { label: 'Escalated', color: 'bg-red-500/10 text-red-300', variant: 'destructive' },
  converted: { label: 'Converted', color: 'bg-emerald-500/10 text-emerald-300', variant: 'success' },
};

const CHANNEL_ICONS: Record<string, typeof Globe> = {
  web: Globe,
  sms: Smartphone,
  email: MessageSquare,
  voice: Monitor,
};

const INTENT_COLORS: Record<string, string> = {
  low: 'text-white/30',
  medium: 'text-amber-400',
  high: 'text-emerald-400',
};

const TABS: { key: TabKey; label: string; icon: typeof MessageSquare }[] = [
  { key: 'live', label: 'Live Conversations', icon: MessageSquare },
  { key: 'escalations', label: 'Escalation Queue', icon: AlertTriangle },
  { key: 'intelligence', label: 'Visitor Intelligence', icon: Eye },
  { key: 'triggers', label: 'Proactive Triggers', icon: Zap },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shortUid(uid: string): string {
  return uid.length > 12 ? `${uid.slice(0, 4)}...${uid.slice(-4)}` : uid;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${seconds % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/[0.06]">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/40">{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: typeof Users; trend?: string }) {
  return (
    <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-white/90">{value}</p>
            {trend && <p className="mt-0.5 text-xs text-emerald-400">{trend}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
            <Icon className="h-5 w-5 text-white/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function ConversationsPage() {
  const api = useApi();

  /* State — data */
  const [metrics, setMetrics] = useState<ConversationMetrics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [visitors, setVisitors] = useState<ActiveVisitor[]>([]);
  const [escalations, setEscalations] = useState<Conversation[]>([]);
  const [visitorSummaries, setVisitorSummaries] = useState<Record<string, VisitorSummary>>({});
  const [triggers, setTriggers] = useState<TriggerRule[]>([]);

  /* State — UI */
  const [activeTab, setActiveTab] = useState<TabKey>('live');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [humanMessage, setHumanMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [stageFilter, setStageFilter] = useState<ConversationStage | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'confidence' | 'urgency'>('time');
  const [highIntentOnly, setHighIntentOnly] = useState(false);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerRule | null>(null);
  const [triggerForm, setTriggerForm] = useState({ name: '', pageRules: '', behaviorRules: '', promptPreview: '', priority: 1, cooldownMinutes: 30 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ */
  /*  Data Fetching                                                      */
  /* ------------------------------------------------------------------ */

  const fetchMetrics = useCallback(async () => {
    const [convRes, visRes] = await Promise.all([
      api.get<ConversationMetrics>('/api/admin/conversations/metrics/conversations'),
      api.get<{ highIntentVisitors?: number }>('/api/admin/conversations/metrics/visitors'),
    ]);
    if (convRes.data) {
      setMetrics({
        ...convRes.data,
        highIntentVisitors: visRes.data?.highIntentVisitors ?? convRes.data.highIntentVisitors,
      });
    }
  }, [api]);

  const fetchConversations = useCallback(async () => {
    const res = await api.get<Conversation[]>('/api/admin/conversations');
    if (res.data) {
      setConversations(res.data);
      setEscalations(res.data.filter((c) => c.stage === 'escalated'));
    }
  }, [api]);

  const fetchVisitors = useCallback(async () => {
    const res = await api.get<ActiveVisitor[]>('/api/admin/conversations/visitors/active');
    if (res.data) setVisitors(res.data);
  }, [api]);

  const fetchTriggers = useCallback(async () => {
    const res = await api.get<TriggerRule[]>('/api/admin/conversations/triggers');
    if (res.data) setTriggers(res.data);
  }, [api]);

  const fetchVisitorSummary = useCallback(async (muUid: string) => {
    if (visitorSummaries[muUid]) return;
    const [summaryRes, signalsRes] = await Promise.all([
      api.get<VisitorSummary>(`/api/admin/conversations/visitors/${muUid}/summary`),
      api.get<{ behaviorSignals?: string[]; intentHints?: string[] }>(`/api/admin/conversations/visitors/${muUid}/signals`),
    ]);
    if (summaryRes.data) {
      setVisitorSummaries((prev) => ({
        ...prev,
        [muUid]: {
          ...summaryRes.data!,
          behaviorSignals: signalsRes.data?.behaviorSignals ?? summaryRes.data!.behaviorSignals,
          intentHints: signalsRes.data?.intentHints ?? summaryRes.data!.intentHints,
        },
      }));
    }
  }, [api, visitorSummaries]);

  /* Initial + interval fetch */
  useEffect(() => {
    fetchMetrics();
    fetchConversations();
    fetchVisitors();
    fetchTriggers();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchConversations();
      fetchVisitors();
    }, 15_000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Scroll to bottom of messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  /* ------------------------------------------------------------------ */
  /*  Actions                                                            */
  /* ------------------------------------------------------------------ */

  const sendHumanMessage = async () => {
    if (!selectedConversation || !humanMessage.trim()) return;
    setSendingMessage(true);
    await api.post(`/api/admin/conversations/${selectedConversation.id}/send-human-message`, {
      content: humanMessage.trim(),
    });
    setHumanMessage('');
    setSendingMessage(false);
    await fetchConversations();
    const updated = conversations.find((c) => c.id === selectedConversation.id);
    if (updated) setSelectedConversation(updated);
  };

  const forceStageChange = async (convId: string, stage: ConversationStage) => {
    await api.patch(`/api/admin/conversations/${convId}`, { stage });
    await fetchConversations();
    if (selectedConversation?.id === convId) {
      setSelectedConversation((prev) => prev ? { ...prev, stage } : null);
    }
  };

  const closeConversation = async (convId: string) => {
    await api.patch(`/api/admin/conversations/${convId}`, { stage: 'converted' });
    setDetailOpen(false);
    setSelectedConversation(null);
    await fetchConversations();
  };

  const toggleTrigger = async (triggerId: string, enabled: boolean) => {
    await api.patch(`/api/admin/conversations/triggers/${triggerId}`, { enabled });
    await fetchTriggers();
  };

  const saveTrigger = async () => {
    if (editingTrigger) {
      await api.patch(`/api/admin/conversations/triggers/${editingTrigger.id}`, triggerForm);
    } else {
      await api.post('/api/admin/conversations/triggers', { ...triggerForm, enabled: true });
    }
    setTriggerModalOpen(false);
    setEditingTrigger(null);
    setTriggerForm({ name: '', pageRules: '', behaviorRules: '', promptPreview: '', priority: 1, cooldownMinutes: 30 });
    await fetchTriggers();
  };

  const deleteTrigger = async (triggerId: string) => {
    await api.del(`/api/admin/conversations/triggers/${triggerId}`);
    await fetchTriggers();
  };

  /* ------------------------------------------------------------------ */
  /*  Filtered & Sorted Conversations                                   */
  /* ------------------------------------------------------------------ */

  const filteredConversations = conversations
    .filter((c) => {
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = c.visitorName?.toLowerCase() ?? '';
        return c.muUid.toLowerCase().includes(q) || name.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'urgency') return b.urgency - a.urgency;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

  const filteredVisitors = highIntentOnly ? visitors.filter((v) => v.highIntent) : visitors;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen text-white/90">
      {/* Header */}
      <div className="border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/95">Conversations</h1>
            <p className="text-sm text-white/30">Monitor live visitors, active conversations, and AI confidence</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-xs text-white/40">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              Live
            </div>
            <Button variant="ghost" size="sm" onClick={() => { fetchMetrics(); fetchConversations(); fetchVisitors(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-white/[0.06] text-white/90 backdrop-blur-xl'
                    : 'text-white/30 hover:bg-white/[0.03] hover:text-white/60'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.key === 'escalations' && escalations.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {escalations.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="border-b border-white/[0.04] px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Active Conversations" value={metrics?.activeConversations ?? '-'} icon={MessageSquare} />
          <StatCard label="High Intent Visitors" value={metrics?.highIntentVisitors ?? '-'} icon={Target} />
          <StatCard label="Avg AI Confidence" value={metrics ? `${Math.round(metrics.avgAiConfidence * 100)}%` : '-'} icon={Brain} />
          <StatCard label="Escalation Rate" value={metrics ? `${Math.round(metrics.escalationRate * 100)}%` : '-'} icon={AlertTriangle} />
          <StatCard label="Qualified Today" value={metrics?.qualifiedToday ?? '-'} icon={UserCheck} />
          <StatCard label="Conversion Rate" value={metrics ? `${Math.round(metrics.conversionRate * 100)}%` : '-'} icon={TrendingUp} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-4">
        {/* ============================================================ */}
        {/*  TAB 1: Live Conversations                                   */}
        {/* ============================================================ */}
        {activeTab === 'live' && (
          <div className="flex gap-4">
            {/* Left: Conversation Feed (60%) */}
            <div className="flex-[3] min-w-0">
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    placeholder="Search by muUid or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl py-2 pl-9 pr-3 text-sm text-white/90 placeholder-white/20 focus:border-red-500/30 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as ConversationStage | 'all')}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/60 focus:border-red-500/30 focus:outline-none"
                >
                  <option value="all">All Stages</option>
                  {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>

                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/60 focus:border-red-500/30 focus:outline-none"
                >
                  <option value="all">All Channels</option>
                  <option value="web">Web</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="voice">Voice</option>
                </select>

                <button
                  onClick={() => setSortBy((s) => s === 'time' ? 'confidence' : s === 'confidence' ? 'urgency' : 'time')}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/40 hover:text-white/70"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {sortBy === 'time' ? 'Time' : sortBy === 'confidence' ? 'Confidence' : 'Urgency'}
                </button>
              </div>

              {/* Conversation List */}
              <div className="space-y-1">
                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <MessageSquare className="mb-2 h-8 w-8" />
                    <p className="text-sm">No conversations match your filters</p>
                  </div>
                )}
                {filteredConversations.map((conv) => {
                  const ChannelIcon = CHANNEL_ICONS[conv.channel] ?? Globe;
                  const stageCfg = STAGE_CONFIG[conv.stage];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedConversation(conv); setDetailOpen(true); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border border-white/[0.04] px-4 py-3 text-left transition-all hover:bg-white/[0.03] backdrop-blur-xl',
                        selectedConversation?.id === conv.id && 'border-white/[0.08] bg-white/[0.04]'
                      )}
                    >
                      {/* Visitor */}
                      <div className="min-w-[100px]">
                        <p className="text-sm font-medium text-white/80">
                          {conv.visitorName ?? shortUid(conv.muUid)}
                        </p>
                        {conv.visitorName && (
                          <p className="text-[11px] text-white/30 font-mono">{shortUid(conv.muUid)}</p>
                        )}
                      </div>

                      {/* Stage */}
                      <Badge variant={stageCfg.variant} className="shrink-0">
                        {stageCfg.label}
                      </Badge>

                      {/* Intent */}
                      <span className="hidden text-xs text-white/40 sm:inline min-w-[60px]">{conv.intent || '-'}</span>

                      {/* Confidence */}
                      <div className="hidden md:block">
                        <ConfidenceBar value={conv.confidence} />
                      </div>

                      {/* Channel */}
                      <ChannelIcon className="h-4 w-4 shrink-0 text-white/30" />

                      {/* Last Message */}
                      <p className="hidden flex-1 truncate text-xs text-white/30 lg:block">
                        {truncate(conv.lastMessage, 50)}
                      </p>

                      {/* Time */}
                      <span className="shrink-0 text-[11px] text-white/20">{timeAgo(conv.lastMessageAt)}</span>

                      <ChevronRight className="h-4 w-4 shrink-0 text-white/10" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Visitor Board (40%) */}
            <div className="hidden flex-[2] lg:block">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight text-white/60">Live Visitors</h2>
                <button
                  onClick={() => setHighIntentOnly(!highIntentOnly)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs transition-colors',
                    highIntentOnly ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/30'
                  )}
                >
                  {highIntentOnly ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                  High intent only
                </button>
              </div>

              <div className="space-y-2 max-h-[calc(100dvh-360px)] overflow-y-auto pr-1">
                {filteredVisitors.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-white/30">
                    <Users className="mb-2 h-6 w-6" />
                    <p className="text-xs">No active visitors</p>
                  </div>
                )}
                {filteredVisitors.map((visitor) => (
                  <Card
                    key={visitor.muUid}
                    className="cursor-pointer rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl transition-all hover:bg-white/[0.04]"
                    onClick={() => {
                      fetchVisitorSummary(visitor.muUid);
                      setExpandedVisitor(expandedVisitor === visitor.muUid ? null : visitor.muUid);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', visitor.highIntent ? 'bg-emerald-500' : 'bg-white/10')} />
                          <span className="text-sm font-medium text-white/80 font-mono">
                            {visitor.name ?? shortUid(visitor.muUid)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {visitor.crmMatch && (
                            <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                              <UserCheck className="h-3 w-3" /> CRM
                            </span>
                          )}
                          {visitor.highIntent && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              HIGH
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-white/30">
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <Globe className="h-3 w-3 shrink-0" />
                          {visitor.currentPage}
                        </span>
                        <span>{visitor.pagesViewed} pg</span>
                        <span>{formatDuration(visitor.sessionDuration)}</span>
                        <span className={cn('font-medium', INTENT_COLORS[visitor.intentLevel])}>
                          {visitor.intentLevel}
                        </span>
                      </div>

                      {/* Expanded visitor summary */}
                      {expandedVisitor === visitor.muUid && visitorSummaries[visitor.muUid] && (
                        <div className="mt-3 border-t border-white/[0.04] pt-3 space-y-2">
                          <div>
                            <p className="text-[10px] uppercase text-white/20 mb-1">Page Trail</p>
                            <div className="flex flex-wrap gap-1">
                              {visitorSummaries[visitor.muUid].pageTrail.map((p, i) => (
                                <span key={i} className="rounded-lg bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40">{p}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-white/20 mb-1">Signals</p>
                            <div className="flex flex-wrap gap-1">
                              {visitorSummaries[visitor.muUid].behaviorSignals.map((s, i) => (
                                <span key={i} className="rounded-lg bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 2: Escalation Queue                                     */}
        {/* ============================================================ */}
        {activeTab === 'escalations' && (
          <div className="space-y-2">
            {escalations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <Shield className="mb-3 h-10 w-10" />
                <p className="text-sm font-medium">No escalated conversations</p>
                <p className="text-xs mt-1">All conversations are being handled by AI</p>
              </div>
            )}
            {escalations.map((conv) => (
              <Card key={conv.id} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">
                          {conv.visitorName ?? shortUid(conv.muUid)}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          Reason: {conv.escalationReason ?? 'Low AI confidence'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-white/30">AI Confidence at escalation</p>
                        <ConfidenceBar value={conv.confidence} />
                      </div>
                      <span className="text-[11px] text-white/20">{timeAgo(conv.lastMessageAt)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedConversation(conv); setDetailOpen(true); }}
                      >
                        Take Over
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closeConversation(conv.id)}
                        className="text-white/30"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/30 pl-[52px]">
                    Last message: {truncate(conv.lastMessage, 120)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 3: Visitor Intelligence                                 */}
        {/* ============================================================ */}
        {activeTab === 'intelligence' && (
          <div className="space-y-2">
            {visitors.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <Eye className="mb-3 h-10 w-10" />
                <p className="text-sm font-medium">No active visitors</p>
              </div>
            )}
            {visitors.map((visitor) => {
              const summary = visitorSummaries[visitor.muUid];
              const isExpanded = expandedVisitor === visitor.muUid;
              return (
                <Card key={visitor.muUid} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
                  <CardContent className="p-4">
                    <button
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => {
                        fetchVisitorSummary(visitor.muUid);
                        setExpandedVisitor(isExpanded ? null : visitor.muUid);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('h-3 w-3 rounded-full', visitor.highIntent ? 'bg-emerald-500' : visitor.intentLevel === 'medium' ? 'bg-amber-500' : 'bg-white/10')} />
                        <div>
                          <p className="text-sm font-medium text-white/80">
                            {visitor.name ?? shortUid(visitor.muUid)}
                          </p>
                          <p className="text-[11px] text-white/30 font-mono">{visitor.muUid}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {visitor.currentPage}</span>
                        <span>{visitor.pagesViewed} pages</span>
                        <span>{formatDuration(visitor.sessionDuration)}</span>
                        <span className={cn('font-semibold', INTENT_COLORS[visitor.intentLevel])}>{visitor.intentLevel} intent</span>
                        {visitor.crmMatch && <Badge variant="info" className="text-[10px]">CRM Match</Badge>}
                        <ChevronRight className={cn('h-4 w-4 text-white/15 transition-transform', isExpanded && 'rotate-90')} />
                      </div>
                    </button>

                    {isExpanded && summary && (
                      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/[0.04] pt-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Page Trail</h4>
                          <div className="space-y-1">
                            {summary.pageTrail.map((page, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-white/40">
                                <ExternalLink className="h-3 w-3 shrink-0 text-white/15" />
                                {page}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Behavior Signals</h4>
                          <div className="flex flex-wrap gap-1">
                            {summary.behaviorSignals.map((signal, i) => (
                              <span key={i} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">{signal}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Intent Hints</h4>
                          <div className="flex flex-wrap gap-1">
                            {summary.intentHints.map((hint, i) => (
                              <span key={i} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">{hint}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Session Timeline</h4>
                          <div className="space-y-1.5">
                            {summary.sessionTimeline.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px]">
                                <span className="shrink-0 text-white/20">{item.time}</span>
                                <span className="text-white/40">{item.event}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/*  TAB 4: Proactive Triggers                                   */}
        {/* ============================================================ */}
        {activeTab === 'triggers' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-white/60">Trigger Rules</h2>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTrigger(null);
                  setTriggerForm({ name: '', pageRules: '', behaviorRules: '', promptPreview: '', priority: 1, cooldownMinutes: 30 });
                  setTriggerModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New Trigger
              </Button>
            </div>

            <div className="space-y-2">
              {triggers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-white/30">
                  <Zap className="mb-3 h-10 w-10" />
                  <p className="text-sm font-medium">No trigger rules configured</p>
                  <p className="text-xs mt-1">Create proactive engagement triggers for visitors</p>
                </div>
              )}
              {triggers.map((trigger) => (
                <Card key={trigger.id} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTrigger(trigger.id, !trigger.enabled)}
                          className={cn('transition-colors', trigger.enabled ? 'text-emerald-400' : 'text-white/15')}
                        >
                          {trigger.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <div>
                          <p className="text-sm font-medium text-white/80">{trigger.name}</p>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-white/30">
                            <span>Priority: {trigger.priority}</span>
                            <span>Cooldown: {trigger.cooldownMinutes}m</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTrigger(trigger);
                            setTriggerForm({
                              name: trigger.name,
                              pageRules: trigger.pageRules,
                              behaviorRules: trigger.behaviorRules,
                              promptPreview: trigger.promptPreview,
                              priority: trigger.priority,
                              cooldownMinutes: trigger.cooldownMinutes,
                            });
                            setTriggerModalOpen(true);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTrigger(trigger.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 border-t border-white/[0.04] pt-3 md:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase text-white/20 mb-1">Page Rules</p>
                        <p className="text-xs text-white/40">{trigger.pageRules || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-white/20 mb-1">Behavior Rules</p>
                        <p className="text-xs text-white/40">{trigger.behaviorRules || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-white/20 mb-1">Prompt Preview</p>
                        <p className="text-xs text-white/40">{truncate(trigger.promptPreview, 80) || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trigger Modal */}
            <Modal
              isOpen={triggerModalOpen}
              onClose={() => { setTriggerModalOpen(false); setEditingTrigger(null); }}
              title={editingTrigger ? 'Edit Trigger' : 'New Trigger'}
              size="lg"
              footer={
                <>
                  <Button variant="ghost" size="sm" onClick={() => { setTriggerModalOpen(false); setEditingTrigger(null); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveTrigger}>
                    {editingTrigger ? 'Update' : 'Create'}
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-white/40">Name</label>
                  <input
                    type="text"
                    value={triggerForm.name}
                    onChange={(e) => setTriggerForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 focus:border-red-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">Page Rules</label>
                  <input
                    type="text"
                    value={triggerForm.pageRules}
                    onChange={(e) => setTriggerForm((f) => ({ ...f, pageRules: e.target.value }))}
                    placeholder="e.g. /pricing, /demo"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">Behavior Rules</label>
                  <input
                    type="text"
                    value={triggerForm.behaviorRules}
                    onChange={(e) => setTriggerForm((f) => ({ ...f, behaviorRules: e.target.value }))}
                    placeholder="e.g. scroll > 70%, time > 30s"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">Prompt Preview</label>
                  <textarea
                    value={triggerForm.promptPreview}
                    onChange={(e) => setTriggerForm((f) => ({ ...f, promptPreview: e.target.value }))}
                    rows={3}
                    placeholder="AI prompt to send when trigger fires..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/30 focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Priority</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={triggerForm.priority}
                      onChange={(e) => setTriggerForm((f) => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 focus:border-red-500/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Cooldown (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={triggerForm.cooldownMinutes}
                      onChange={(e) => setTriggerForm((f) => ({ ...f, cooldownMinutes: parseInt(e.target.value) || 30 }))}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 focus:border-red-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/*  Conversation Detail Panel (slide-in)                           */}
      {/* ============================================================== */}
      {detailOpen && selectedConversation && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background backdrop-blur-sm" onClick={() => setDetailOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.04] bg-[#0a0a0b]/95 backdrop-blur-2xl shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold tracking-tight text-white/90">
                  {selectedConversation.visitorName ?? shortUid(selectedConversation.muUid)}
                </h2>
                <Badge variant={STAGE_CONFIG[selectedConversation.stage].variant}>
                  {STAGE_CONFIG[selectedConversation.stage].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedConversation.stage}
                  onChange={(e) => forceStageChange(selectedConversation.id, e.target.value as ConversationStage)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-2 py-1 text-xs text-white/60 focus:outline-none"
                >
                  {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => closeConversation(selectedConversation.id)} className="text-white/30 text-xs">
                  Close Conv
                </Button>
                <button onClick={() => setDetailOpen(false)} className="rounded-xl p-1 text-white/40 hover:bg-white/[0.06] hover:text-white/90">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Panel Body: two-column layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Messages */}
              <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.role === 'visitor' ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-3 py-2 text-sm backdrop-blur-xl',
                          msg.role === 'visitor'
                            ? 'bg-white/[0.04] text-white/80'
                            : msg.role === 'ai'
                            ? 'bg-red-500/15 text-red-100 border border-red-500/10'
                            : 'bg-blue-500/15 text-blue-100 border border-blue-500/10'
                        )}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-white/30">
                          {msg.role === 'visitor' && 'Visitor'}
                          {msg.role === 'ai' && (
                            <><Brain className="h-3 w-3" /> AI</>
                          )}
                          {msg.role === 'human' && (
                            <><UserCheck className="h-3 w-3" /> Agent</>
                          )}
                          <span className="ml-auto">{timeAgo(msg.timestamp)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-white/[0.04] p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={humanMessage}
                      onChange={(e) => setHumanMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendHumanMessage(); } }}
                      placeholder="Type a message as human agent..."
                      className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/30 focus:outline-none"
                    />
                    <Button size="sm" onClick={sendHumanMessage} isLoading={sendingMessage} disabled={!humanMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="hidden w-56 shrink-0 overflow-y-auto border-l border-white/[0.04] p-4 md:block">
                {/* Visitor Info */}
                <div className="mb-4">
                  <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Visitor</h4>
                  <div className="space-y-1.5 text-xs text-white/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/20 font-mono text-[10px]">muUid:</span>
                      <span className="font-mono truncate">{selectedConversation.visitorInfo.muUid}</span>
                    </div>
                    {selectedConversation.visitorInfo.crmContactId && (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-blue-400" />
                        <span>CRM linked</span>
                      </div>
                    )}
                    {selectedConversation.visitorInfo.geo && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>{selectedConversation.visitorInfo.geo}</span>
                      </div>
                    )}
                    {selectedConversation.visitorInfo.device && (
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3 w-3" />
                        <span>{selectedConversation.visitorInfo.device}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(selectedConversation.visitorInfo.sessionDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      <span>{selectedConversation.visitorInfo.pagesViewed} pages</span>
                    </div>
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="mb-4">
                  <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">AI Confidence</h4>
                  <ConfidenceBar value={selectedConversation.confidence} />
                </div>

                {/* Intent Scores */}
                <div className="mb-4">
                  <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Intent Scores</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedConversation.intentScores).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-white/30 capitalize">{key}</span>
                        <span className="text-white/60">{Math.round(val * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualification Checklist */}
                <div className="mb-4">
                  <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Qualification</h4>
                  <div className="space-y-1">
                    {selectedConversation.qualificationChecklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        {item.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-white/15" />
                        )}
                        <span className={item.completed ? 'text-white/60' : 'text-white/30'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Taken */}
                {selectedConversation.actionsTaken.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Actions Taken</h4>
                    <div className="space-y-1">
                      {selectedConversation.actionsTaken.map((action, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-white/40">
                          <Zap className="h-3 w-3 text-amber-500" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Escalation Context */}
                {selectedConversation.escalationReason && (
                  <div className="mt-4 rounded-2xl bg-red-500/5 border border-red-500/10 p-3">
                    <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">Escalation Reason</h4>
                    <p className="text-xs text-red-300">{selectedConversation.escalationReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
