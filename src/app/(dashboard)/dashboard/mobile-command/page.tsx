'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Users,
  Activity,
  MessageSquare,
  Mic,
  Send,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ArrowLeft,
  Monitor,
  Bot,
  Server,
  DollarSign,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════════ */

type SpeedMode = 'CRUISE' | 'HUSTLE' | 'BLITZ' | 'SWARM';
type SystemStatus = 'healthy' | 'degraded' | 'critical';
type ChatMode = 'meli' | 'claude';

interface QuickStat {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface ActivityEvent {
  id: string;
  type: 'deploy' | 'agent' | 'task' | 'error' | 'sms';
  description: string;
  timeAgo: string;
  expanded?: boolean;
  detail?: string;
}

interface SMSMessage {
  id: string;
  from: string;
  body: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Helpers                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  deploy: <Rocket className="h-4 w-4 text-blue-400" />,
  agent: <Bot className="h-4 w-4 text-primary" />,
  task: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <AlertTriangle className="h-4 w-4 text-red-400" />,
  sms: <MessageSquare className="h-4 w-4 text-amber-400" />,
};

const SPEED_COLORS: Record<SpeedMode, string> = {
  CRUISE: 'text-emerald-400',
  HUSTLE: 'text-amber-400',
  BLITZ: 'text-orange-400',
  SWARM: 'text-red-400',
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Status Bar                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function StatusBar({
  status,
  speedMode,
  agentCount,
}: {
  status: SystemStatus;
  speedMode: SpeedMode;
  agentCount: number;
}) {
  const statusDot =
    status === 'healthy'
      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
      : status === 'degraded'
        ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
        : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]';

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${statusDot}`} />
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          Memelli OS
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground tracking-wide">
          {fmtNum(agentCount)} agents
        </span>
        <span
          className={`text-[10px] font-bold tracking-widest ${SPEED_COLORS[speedMode]}`}
        >
          {speedMode}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Quick Stats Strip                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function QuickStatsStrip({
  stats,
  onTap,
}: {
  stats: QuickStat[];
  onTap: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto px-5 py-3 scrollbar-hide">
      {stats.map((s) => (
        <button
          key={s.id}
          onClick={() => onTap(s.id)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.06] bg-card px-4 py-2.5 transition-all active:scale-95 active:bg-white/[0.04]"
          style={{ minHeight: 48 }}
        >
          {s.icon}
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground leading-none">{s.label}</p>
            <p className={`text-sm font-bold leading-tight ${s.color}`}>
              {s.value}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Command Input                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function CommandInput({
  value,
  onChange,
  onSend,
  mode,
  onToggleMode,
  isSending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  mode: ChatMode;
  onToggleMode: () => void;
  isSending: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-5 py-3">
      <div className="rounded-2xl border border-white/[0.08] bg-card backdrop-blur-xl overflow-hidden">
        <div className="flex items-end gap-2 px-4 py-3">
          {/* Mic button */}
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground transition-all active:scale-90 active:bg-white/[0.08]"
            aria-label="Voice input"
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Melli what to do..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none py-3 leading-snug max-h-24 scrollbar-hide"
            style={{ minHeight: 48 }}
          />

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={!value.trim() || isSending}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 ${
              value.trim() && !isSending
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/[0.04] text-muted-foreground'
            }`}
            aria-label="Send"
          >
            {isSending ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-1 border-t border-white/[0.04] py-2">
          <button
            onClick={onToggleMode}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium tracking-wider uppercase transition-colors active:bg-white/[0.04]"
          >
            <span
              className={
                mode === 'meli' ? 'text-red-400' : 'text-muted-foreground'
              }
            >
              Melli
            </span>
            <span className="text-muted-foreground">|</span>
            <span
              className={
                mode === 'claude' ? 'text-blue-400' : 'text-muted-foreground'
              }
            >
              Claude
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Activity Feed                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function ActivityFeed({
  events,
  onToggleExpand,
}: {
  events: ActivityEvent[];
  onToggleExpand: (id: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-2 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Activity
        </span>
        <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="h-8 w-8 mb-2 opacity-40" />
          <span className="text-xs">System is quiet</span>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={() => onToggleExpand(event.id)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-white/[0.04]"
                style={{ minHeight: 48 }}
              >
                <div className="mt-0.5 shrink-0">
                  {EVENT_ICONS[event.type] || (
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">
                    {event.description}
                  </p>
                  <AnimatePresence>
                    {event.expanded && event.detail && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-[11px] text-muted-foreground mt-1 leading-relaxed overflow-hidden"
                      >
                        {event.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
                  {event.timeAgo}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Quick Actions Bar                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function QuickActionsBar({
  onAction,
  activeAction,
}: {
  onAction: (action: string) => void;
  activeAction: string | null;
}) {
  const actions = [
    { id: 'deploy', icon: Rocket, label: 'Deploy', color: 'text-blue-400' },
    { id: 'agents', icon: Users, label: 'Agents', color: 'text-primary' },
    { id: 'status', icon: Activity, label: 'Status', color: 'text-emerald-400' },
    { id: 'sms', icon: MessageSquare, label: 'SMS', color: 'text-amber-400' },
  ];

  return (
    <div className="border-t border-white/[0.04] bg-card backdrop-blur-xl">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        {actions.map((a) => {
          const Icon = a.icon;
          const isActive = activeAction === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onAction(a.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-90 ${
                isActive ? 'bg-white/[0.04]' : ''
              }`}
              style={{ minHeight: 56 }}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? a.color : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? a.color : 'text-muted-foreground'
                }`}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SMS Thread View                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function SMSThreadView({
  messages,
  onClose,
  onSendReply,
  isLoading,
}: {
  messages: SMSMessage[];
  onClose: () => void;
  onSendReply: (body: string) => void;
  isLoading: boolean;
}) {
  const [reply, setReply] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-10 flex flex-col bg-[#050507]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground active:scale-90 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">SMS Inbox</p>
          <p className="text-[10px] text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-border border-t-zinc-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
            <span className="text-xs">No messages yet</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.direction === 'outbound'
                    ? 'bg-red-500/15 text-foreground border border-red-500/20'
                    : 'bg-muted text-foreground border border-white/[0.04]'
                }`}
              >
                <p className="text-[13px] leading-relaxed">{msg.body}</p>
                <div className="flex items-center justify-between mt-1.5 gap-3">
                  <span className="text-[9px] text-muted-foreground">{msg.from}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {timeAgo(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply input */}
      <div className="border-t border-white/[0.04] px-5 py-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
        <div className="flex items-center gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && reply.trim()) {
                onSendReply(reply.trim());
                setReply('');
              }
            }}
            placeholder="Reply..."
            className="flex-1 rounded-xl border border-white/[0.06] bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
            style={{ minHeight: 48 }}
          />
          <button
            onClick={() => {
              if (reply.trim()) {
                onSendReply(reply.trim());
                setReply('');
              }
            }}
            disabled={!reply.trim()}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90 ${
              reply.trim()
                ? 'bg-red-500 text-white'
                : 'bg-white/[0.04] text-muted-foreground'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Desktop Redirect Banner                                           */
/* ═══════════════════════════════════════════════════════════════════ */

function DesktopBanner() {
  const router = useRouter();
  return (
    <div className="hidden md:flex h-screen bg-[#050507] items-center justify-center px-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/10 border border-red-500/20 flex items-center justify-center">
            <Monitor className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Mobile Command Center
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          This page is designed for your phone. On desktop, use the full
          dashboard for the complete experience.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-95"
        >
          Go to Dashboard
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Page                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

export default function MobileCommandPage() {
  const router = useRouter();

  // Core state
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('healthy');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('CRUISE');
  const [agentCount, setAgentCount] = useState(0);
  const [chatMode, setChatMode] = useState<ChatMode>('meli');
  const [commandText, setCommandText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showSMS, setShowSMS] = useState(false);

  // Data
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // Chat response display
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  /* ─── Fetch system data ─── */
  const fetchSystemData = useCallback(async () => {
    try {
      // Fetch health + pools + command center in parallel
      const [healthRes, poolRes, commandRes, feedRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/health-dashboard`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/admin/agent-pools`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/admin/command-center/`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/admin/command-center/live-feed`, { headers: authHeaders() }),
      ]);

      // Process health
      let healthStatus: SystemStatus = 'healthy';
      let dbLatency = '-';
      let apiUptime = '-';
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const h = await healthRes.value.json();
        healthStatus = h.overallStatus || 'healthy';
        dbLatency = `${h.database?.latencyMs ?? 0}ms`;
        apiUptime =
          h.api?.uptimeSeconds != null
            ? h.api.uptimeSeconds >= 86400
              ? `${Math.floor(h.api.uptimeSeconds / 86400)}d`
              : h.api.uptimeSeconds >= 3600
                ? `${Math.floor(h.api.uptimeSeconds / 3600)}h`
                : `${Math.floor(h.api.uptimeSeconds / 60)}m`
            : '-';
      }
      setSystemStatus(healthStatus);

      // Process pools
      let totalAgents = 0;
      let activeAgents = 0;
      if (poolRes.status === 'fulfilled' && poolRes.value.ok) {
        const p = await poolRes.value.json();
        totalAgents = p.totalAgents || 0;
        activeAgents = p.activeAgents || 0;
      }
      setAgentCount(totalAgents);

      // Process command center
      let tasksActive = 0;
      if (commandRes.status === 'fulfilled' && commandRes.value.ok) {
        const c = await commandRes.value.json();
        tasksActive = c.executionEngine?.tasksActive || 0;
      }

      // Build stats
      setStats([
        {
          id: 'tasks',
          label: 'Active Tasks',
          value: fmtNum(tasksActive),
          icon: <Zap className="h-4 w-4 text-amber-400" />,
          color: 'text-amber-400',
        },
        {
          id: 'agents',
          label: 'Agents Online',
          value: fmtNum(totalAgents),
          icon: <Users className="h-4 w-4 text-primary" />,
          color: 'text-primary',
        },
        {
          id: 'deploy',
          label: 'API Health',
          value: dbLatency,
          icon: <Server className="h-4 w-4 text-emerald-400" />,
          color: 'text-emerald-400',
        },
        {
          id: 'health',
          label: 'Uptime',
          value: apiUptime,
          icon: <Activity className="h-4 w-4 text-blue-400" />,
          color: 'text-blue-400',
        },
        {
          id: 'active',
          label: 'Active',
          value: fmtNum(activeAgents),
          icon: <Bot className="h-4 w-4 text-red-400" />,
          color: 'text-red-400',
        },
      ]);

      // Process live feed into events
      if (feedRes.status === 'fulfilled' && feedRes.value.ok) {
        const f = await feedRes.value.json();
        const feedEvents: ActivityEvent[] = (f.events || [])
          .slice(0, 10)
          .map((e: any) => ({
            id: e.id,
            type: mapEventType(e.type || e.domain),
            description: e.message || `${e.domain}: ${e.type}`,
            timeAgo: timeAgo(e.timestamp),
            detail: e.resolution || `Domain: ${e.domain} | Severity: ${e.severity}${e.assignedAgentId ? ` | Agent: ${e.assignedAgentId}` : ''}`,
          }));
        setEvents(feedEvents);
      }

      // Determine speed mode from active agents
      if (activeAgents > 500) setSpeedMode('SWARM');
      else if (activeAgents > 100) setSpeedMode('BLITZ');
      else if (activeAgents > 20) setSpeedMode('HUSTLE');
      else setSpeedMode('CRUISE');
    } catch {
      // Silently handle — status stays as-is
    }
  }, []);

  function mapEventType(type: string): ActivityEvent['type'] {
    const t = type.toLowerCase();
    if (t.includes('deploy')) return 'deploy';
    if (t.includes('agent') || t.includes('spawn')) return 'agent';
    if (t.includes('error') || t.includes('fail') || t.includes('critical')) return 'error';
    if (t.includes('sms') || t.includes('message')) return 'sms';
    return 'task';
  }

  /* ─── Fetch SMS ─── */
  const fetchSMS = useCallback(async () => {
    setSmsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/webhooks/twilio/sms/inbox`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const msgs: SMSMessage[] = (data.messages || data || []).map(
          (m: any) => ({
            id: m.id || m.sid || String(Math.random()),
            from: m.from || m.From || 'Unknown',
            body: m.body || m.Body || '',
            direction: m.direction || (m.from?.startsWith('+1') ? 'inbound' : 'outbound'),
            timestamp: m.timestamp || m.dateCreated || m.createdAt || new Date().toISOString(),
          }),
        );
        setSmsMessages(msgs);
      }
    } catch {
      // Silent
    }
    setSmsLoading(false);
  }, []);

  /* ─── Send command ─── */
  const handleSendCommand = useCallback(async () => {
    if (!commandText.trim() || isSending) return;
    const text = commandText.trim();
    setCommandText('');
    setIsSending(true);
    setLastResponse(null);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          message: text,
          mode: chatMode,
          source: 'mobile-command',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply =
          data.reply ||
          data.response ||
          data.message ||
          data.content ||
          'Command received.';
        setLastResponse(reply);

        // Add as event
        setEvents((prev) => [
          {
            id: `cmd-${Date.now()}`,
            type: 'task' as const,
            description: `You: ${text}`,
            timeAgo: 'now',
            detail: typeof reply === 'string' ? reply : JSON.stringify(reply),
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setLastResponse('Command failed. Try again.');
      }
    } catch {
      setLastResponse('Network error. Check connection.');
    }

    setIsSending(false);
  }, [commandText, chatMode, isSending]);

  /* ─── Send SMS reply ─── */
  const handleSendSMSReply = useCallback(async (body: string) => {
    try {
      await fetch(`${API_URL}/api/webhooks/twilio/sms/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body }),
      });
      // Add to local list optimistically
      setSmsMessages((prev) => [
        ...prev,
        {
          id: `out-${Date.now()}`,
          from: 'You',
          body,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      // Silent
    }
  }, []);

  /* ─── Quick action handlers ─── */
  const handleQuickAction = useCallback(
    (action: string) => {
      if (action === 'sms') {
        setShowSMS(true);
        fetchSMS();
        setActiveAction('sms');
        return;
      }

      setActiveAction(action);

      const commands: Record<string, string> = {
        deploy: 'Show deploy status and recent deployments',
        agents: 'Show agent pool status and workforce summary',
        status: 'Show full system health report',
      };

      if (commands[action]) {
        setCommandText(commands[action]);
      }
    },
    [fetchSMS],
  );

  /* ─── Toggle event expansion ─── */
  const handleToggleExpand = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, expanded: !e.expanded } : e,
      ),
    );
  }, []);

  /* ─── Polling ─── */
  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 10_000);
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  /* ─── Render ─── */
  return (
    <>
      {/* Desktop redirect */}
      <DesktopBanner />

      {/* Mobile layout */}
      <div className="relative flex flex-col h-[100dvh] bg-[#050507] md:hidden overflow-hidden">
        {/* Status Bar */}
        <StatusBar
          status={systemStatus}
          speedMode={speedMode}
          agentCount={agentCount}
        />

        {/* Quick Stats */}
        <QuickStatsStrip stats={stats} onTap={(id) => handleQuickAction(id)} />

        {/* Command Input */}
        <CommandInput
          value={commandText}
          onChange={setCommandText}
          onSend={handleSendCommand}
          mode={chatMode}
          onToggleMode={() =>
            setChatMode((m) => (m === 'meli' ? 'claude' : 'meli'))
          }
          isSending={isSending}
        />

        {/* Last response banner */}
        <AnimatePresence>
          {lastResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 mb-2 overflow-hidden"
            >
              <div className="rounded-xl border border-white/[0.06] bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-muted-foreground leading-relaxed flex-1">
                    {typeof lastResponse === 'string'
                      ? lastResponse.slice(0, 300)
                      : lastResponse}
                    {typeof lastResponse === 'string' &&
                      lastResponse.length > 300 &&
                      '...'}
                  </p>
                  <button
                    onClick={() => setLastResponse(null)}
                    className="shrink-0 text-muted-foreground active:text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Feed */}
        <ActivityFeed events={events} onToggleExpand={handleToggleExpand} />

        {/* Quick Actions Bar */}
        <QuickActionsBar
          onAction={handleQuickAction}
          activeAction={activeAction}
        />

        {/* SMS Thread Overlay */}
        <AnimatePresence>
          {showSMS && (
            <SMSThreadView
              messages={smsMessages}
              onClose={() => {
                setShowSMS(false);
                setActiveAction(null);
              }}
              onSendReply={handleSendSMSReply}
              isLoading={smsLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
