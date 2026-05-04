'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  Phone,
  MessageSquare,
  Mail,
  MessageCircle,
  Tag,
  Voicemail,
  Users,
  Clock,
  AlertTriangle,
  Activity,
  X,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChannelStats {
  calls: { total: number; answered: number; missed: number };
  sms: { sent: number; received: number };
  email: { sent: number; received: number };
  liveChat: { activeSessions: number };
  tickets: { open: number; inProgress: number; overdue: number };
  voicemail: { unread: number };
}

interface CommEvent {
  id: string;
  type: 'call' | 'sms' | 'email' | 'chat' | 'ticket';
  tenantName: string;
  contactName: string;
  timestamp: string;
  status: string;
  summary?: string;
  direction?: 'inbound' | 'outbound';
  phone?: string;
  email?: string;
  tenantId?: string;
  timeline?: TimelineEntry[];
}

interface TimelineEntry {
  timestamp: string;
  event: string;
}

interface QueueInfo {
  name: string;
  depth: number;
  agentsAvailable: number;
  avgWaitTime: number;
  slaCompliance: number;
}

interface TicketOverview {
  byPriority: { urgent: number; high: number; medium: number; low: number };
  slaBreaches: number;
  avgResolutionTime: number;
  recentEscalations: Escalation[];
}

interface Escalation {
  id: string;
  ticketId: string;
  tenantName: string;
  reason: string;
  timestamp: string;
}

interface CommStatsResponse {
  channels: ChannelStats;
  activity: CommEvent[];
  queues: QueueInfo[];
  ticketOverview: TicketOverview;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  call: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  sms: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  email: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
  chat: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  ticket: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
};

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  chat: MessageCircle,
  ticket: Tag,
};

function commTypeBadge(type: string) {
  const colors = TYPE_COLORS[type] ?? { bg: 'bg-[hsl(var(--muted))]/$1', text: 'text-[hsl(var(--muted-foreground))]', border: 'border-[hsl(var(--border))]' };
  const Icon = TYPE_ICONS[type] ?? Tag;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <Icon className="h-3 w-3" />
      {type}
    </span>
  );
}

function priorityBar(label: string, count: number, color: string) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium w-14 ${color}`}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[hsl(var(--muted))]">
        <div
          className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(count * 5, 100)}%` }}
        />
      </div>
      <span className="text-sm font-bold text-[hsl(var(--foreground))] w-8 text-right">{count}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function UniverseCommunicationsPage() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelStats | null>(null);
  const [activity, setActivity] = useState<CommEvent[]>([]);
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [ticketOverview, setTicketOverview] = useState<TicketOverview | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommEvent | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get<CommStatsResponse>('/api/admin/communications/stats');
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if (res.data) {
      setChannels(res.data.channels);
      setActivity(res.data.activity);
      setQueues(res.data.queues);
      setTicketOverview(res.data.ticketOverview);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');

  /* ---- Loading / Error states ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading communications data...</p>
        </div>
      </div>
    );
  }

  if (error && !channels) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertTriangle className="h-10 w-10 text-orange-400" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); fetchStats(); }}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-white/15 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* -- Header -- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Communications</h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">All communication activity across the Memelli Universe</p>
        </div>

        {/* -- Channel Stats Row -- */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Calls Today */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Calls Today</span>
              <Phone className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(channels?.calls.total)}</p>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span className="text-emerald-400">{val(channels?.calls.answered)} answered</span>
              <span className="text-red-400">{val(channels?.calls.missed)} missed</span>
            </div>
          </div>

          {/* SMS Today */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">SMS Today</span>
              <MessageSquare className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">
              {val(channels ? channels.sms.sent + channels.sms.received : null)}
            </p>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span className="text-red-400">{val(channels?.sms.sent)} sent</span>
              <span className="text-red-300">{val(channels?.sms.received)} received</span>
            </div>
          </div>

          {/* Emails Today */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Emails Today</span>
              <Mail className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">
              {val(channels ? channels.email.sent + channels.email.received : null)}
            </p>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span className="text-sky-400">{val(channels?.email.sent)} sent</span>
              <span className="text-sky-300">{val(channels?.email.received)} received</span>
            </div>
          </div>

          {/* Live Chats Active */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Live Chats</span>
              <MessageCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(channels?.liveChat.activeSessions)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">Active sessions</p>
          </div>

          {/* Open Tickets */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Open Tickets</span>
              <Tag className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(channels?.tickets.open)}</p>
            <div className="mt-2 flex gap-3 text-[11px]">
              <span className="text-[hsl(var(--muted-foreground))]">{val(channels?.tickets.inProgress)} in-progress</span>
              <span className="text-red-400">{val(channels?.tickets.overdue)} overdue</span>
            </div>
          </div>

          {/* Voicemails */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Voicemails</span>
              <Voicemail className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(channels?.voicemail.unread)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">Unread messages</p>
          </div>
        </div>

        {/* -- Activity Feed + Queue Status -- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-400" />
              Activity Feed
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 max-h-[480px] overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent communications</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((evt) => (
                    <li
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 cursor-pointer hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all duration-150"
                    >
                      <div className="flex-shrink-0">{commTypeBadge(evt.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{evt.contactName}</span>
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{evt.tenantName}</span>
                        </div>
                        {evt.summary && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">{evt.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(evt.timestamp)}</span>
                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                          evt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          evt.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                          evt.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))]'
                        }`}>
                          {evt.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Queue Status */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Users className="h-5 w-5 text-red-400" />
              Queue Status
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-4">
              {queues.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No active queues</p>
              ) : (
                queues.map((q) => (
                  <div key={q.name} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">{q.name}</span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        q.slaCompliance >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                        q.slaCompliance >= 70 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {q.slaCompliance}% SLA
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))] block">Depth</span>
                        <span className="text-[hsl(var(--foreground))] font-medium">{q.depth}</span>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))] block">Agents</span>
                        <span className="text-[hsl(var(--foreground))] font-medium">{q.agentsAvailable}</span>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))] block">Avg Wait</span>
                        <span className="text-[hsl(var(--foreground))] font-medium">{formatDuration(q.avgWaitTime)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* -- Ticket Overview -- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Priority Breakdown */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Tag className="h-5 w-5 text-red-400" />
              Tickets by Priority
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
              {priorityBar('Urgent', ticketOverview?.byPriority.urgent ?? 0, 'text-red-400')}
              {priorityBar('High', ticketOverview?.byPriority.high ?? 0, 'text-orange-400')}
              {priorityBar('Medium', ticketOverview?.byPriority.medium ?? 0, 'text-amber-400')}
              {priorityBar('Low', ticketOverview?.byPriority.low ?? 0, 'text-blue-400')}

              <div className="border-t border-[hsl(var(--border))] pt-4 grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] block font-medium">SLA Breaches</span>
                  <span className={`text-lg font-bold tracking-tight ${
                    (ticketOverview?.slaBreaches ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {val(ticketOverview?.slaBreaches)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] block font-medium">Avg Resolution</span>
                  <span className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {ticketOverview?.avgResolutionTime != null
                      ? formatDuration(ticketOverview.avgResolutionTime)
                      : '\u2014'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] block font-medium">Total Open</span>
                  <span className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {val(
                      ticketOverview
                        ? ticketOverview.byPriority.urgent +
                          ticketOverview.byPriority.high +
                          ticketOverview.byPriority.medium +
                          ticketOverview.byPriority.low
                        : null
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Escalations */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Recent Escalations
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 max-h-[320px] overflow-y-auto">
              {(!ticketOverview?.recentEscalations || ticketOverview.recentEscalations.length === 0) ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No recent escalations</p>
              ) : (
                <ul className="space-y-3">
                  {ticketOverview.recentEscalations.map((esc) => (
                    <li
                      key={esc.id}
                      className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3"
                    >
                      <ArrowUpRight className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">Ticket #{esc.ticketId}</span>
                          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{esc.tenantName}</span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{esc.reason}</p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{formatTime(esc.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* -- Detail Panel (slide-over) -- */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            {/* Panel */}
            <div className="relative w-full max-w-lg bg-[hsl(var(--card))] shadow-2xl overflow-y-auto backdrop-blur-2xl">
              <div className="p-6">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {commTypeBadge(selectedEvent.type)}
                    <h3 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">Communication Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="rounded-xl p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <X className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  </button>
                </div>

                {/* Contact info */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 mb-4">
                  <h4 className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3">Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Name</span>
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">{selectedEvent.contactName}</span>
                    </div>
                    {selectedEvent.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Phone</span>
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{selectedEvent.phone}</span>
                      </div>
                    )}
                    {selectedEvent.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Email</span>
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{selectedEvent.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenant context */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 mb-4">
                  <h4 className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3">Tenant Context</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Tenant</span>
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">{selectedEvent.tenantName}</span>
                    </div>
                    {selectedEvent.tenantId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Tenant ID</span>
                        <span className="text-sm font-mono text-[hsl(var(--muted-foreground))] text-xs">{selectedEvent.tenantId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Communication details */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 mb-4">
                  <h4 className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3">Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Type</span>
                      <span className="text-sm text-[hsl(var(--foreground))] capitalize">{selectedEvent.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Status</span>
                      <span className={`text-sm font-medium ${
                        selectedEvent.status === 'completed' ? 'text-emerald-400' :
                        selectedEvent.status === 'missed' ? 'text-red-400' :
                        selectedEvent.status === 'active' ? 'text-blue-400' :
                        'text-[hsl(var(--foreground))]'
                      }`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                    {selectedEvent.direction && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Direction</span>
                        <span className="text-sm text-[hsl(var(--foreground))] capitalize">{selectedEvent.direction}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Time</span>
                      <span className="text-sm text-[hsl(var(--foreground))]">{formatTime(selectedEvent.timestamp)}</span>
                    </div>
                    {selectedEvent.summary && (
                      <div className="pt-2 border-t border-[hsl(var(--border))]">
                        <span className="text-sm text-[hsl(var(--muted-foreground))] block mb-1">Summary</span>
                        <p className="text-sm text-[hsl(var(--foreground))]">{selectedEvent.summary}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {selectedEvent.timeline && selectedEvent.timeline.length > 0 && (
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                    <h4 className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      {selectedEvent.timeline.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[hsl(var(--foreground))]">{entry.event}</p>
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(entry.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
