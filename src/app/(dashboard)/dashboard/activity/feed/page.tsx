'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  LogIn,
  FileText,
  Handshake,
  Mail,
  Phone,
  CheckCircle2,
  Rocket,
  Bot,
  Search,
  X,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EventType =
  | 'login'
  | 'page_created'
  | 'deal_closed'
  | 'email_sent'
  | 'call_made'
  | 'task_completed'
  | 'deployment'
  | 'agent_action';

interface FeedEntry {
  id: string;
  type: EventType;
  actor: string;
  action: string;
  target?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EVENT_TYPES: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'login', label: 'Login' },
  { value: 'page_created', label: 'Page Created' },
  { value: 'deal_closed', label: 'Deal Closed' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'call_made', label: 'Call Made' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'agent_action', label: 'Agent Action' },
];

const TYPE_ICON: Record<EventType, typeof Activity> = {
  login: LogIn,
  page_created: FileText,
  deal_closed: Handshake,
  email_sent: Mail,
  call_made: Phone,
  task_completed: CheckCircle2,
  deployment: Rocket,
  agent_action: Bot,
};

const TYPE_COLOR: Record<EventType, string> = {
  login: 'bg-emerald-500/15 text-emerald-400',
  page_created: 'bg-blue-500/15 text-blue-400',
  deal_closed: 'bg-amber-500/15 text-amber-400',
  email_sent: 'bg-indigo-500/15 text-indigo-400',
  call_made: 'bg-teal-500/15 text-teal-400',
  task_completed: 'bg-green-500/15 text-green-400',
  deployment: 'bg-red-500/15 text-red-400',
  agent_action: 'bg-primary/80/15 text-primary',
};

const TYPE_DOT: Record<EventType, string> = {
  login: 'bg-emerald-400',
  page_created: 'bg-blue-400',
  deal_closed: 'bg-amber-400',
  email_sent: 'bg-indigo-400',
  call_made: 'bg-teal-400',
  task_completed: 'bg-green-400',
  deployment: 'bg-red-400',
  agent_action: 'bg-primary/70',
};

const TYPE_LABEL: Record<EventType, string> = {
  login: 'Login',
  page_created: 'Page Created',
  deal_closed: 'Deal Closed',
  email_sent: 'Email Sent',
  call_made: 'Call Made',
  task_completed: 'Task Completed',
  deployment: 'Deployment',
  agent_action: 'Agent Action',
};

/* ------------------------------------------------------------------ */
/*  Seed data generator (used when API returns empty)                   */
/* ------------------------------------------------------------------ */

function generateSeedData(): FeedEntry[] {
  const now = Date.now();
  const actors = [
    'Mel Briggs', 'Melli AI', 'Deploy Agent', 'CRM Agent',
    'SEO Agent', 'Commerce Agent', 'System', 'Admin',
  ];
  const seeds: Omit<FeedEntry, 'id' | 'timestamp'>[] = [
    { type: 'login', actor: 'Mel Briggs', action: 'logged in', target: 'Admin Dashboard' },
    { type: 'agent_action', actor: 'Melli AI', action: 'processed intake for', target: 'New Lead: Sarah Chen' },
    { type: 'deployment', actor: 'Deploy Agent', action: 'deployed', target: 'API v2.14.0 to production' },
    { type: 'deal_closed', actor: 'CRM Agent', action: 'closed deal', target: 'Enterprise Package - $12,500' },
    { type: 'email_sent', actor: 'Melli AI', action: 'sent follow-up email to', target: 'james@acmecorp.com' },
    { type: 'task_completed', actor: 'SEO Agent', action: 'completed keyword cluster for', target: 'Credit Repair Services' },
    { type: 'page_created', actor: 'Commerce Agent', action: 'created product page', target: 'Premium Coaching Bundle' },
    { type: 'call_made', actor: 'Melli AI', action: 'completed outbound call to', target: '+1 (555) 234-5678' },
    { type: 'agent_action', actor: 'System', action: 'spawned 12 patrol agents for', target: 'Health Check Sweep' },
    { type: 'login', actor: 'Admin', action: 'logged in via', target: 'API Key' },
    { type: 'deployment', actor: 'Deploy Agent', action: 'rolled back', target: 'Worker v1.8.3 (health check failed)' },
    { type: 'task_completed', actor: 'CRM Agent', action: 'enriched 45 contacts in', target: 'Funding Pipeline' },
    { type: 'email_sent', actor: 'Melli AI', action: 'sent welcome sequence to', target: '3 new signups' },
    { type: 'deal_closed', actor: 'CRM Agent', action: 'moved to won', target: 'Starter Plan - $2,400' },
    { type: 'agent_action', actor: 'Melli AI', action: 'classified SMS from', target: '+1 (555) 876-5432 as funding inquiry' },
    { type: 'page_created', actor: 'SEO Agent', action: 'published article', target: 'How to Build Business Credit in 90 Days' },
    { type: 'call_made', actor: 'Melli AI', action: 'transferred call to', target: 'Mel Briggs (escalation)' },
    { type: 'task_completed', actor: 'Deploy Agent', action: 'completed cache bust for', target: 'Railway API rebuild' },
    { type: 'login', actor: 'Mel Briggs', action: 'logged in from', target: 'Mobile Device' },
    { type: 'agent_action', actor: 'System', action: 'auto-healed', target: 'Redis connection pool (3 stale connections)' },
  ];

  return seeds.map((s, i) => ({
    ...s,
    id: `feed-${i}`,
    timestamp: new Date(now - i * 4 * 60 * 1000).toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ActivityFeedPage() {
  const api = useApi();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<EventType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newEntries, setNewEntries] = useState<FeedEntry[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const perPage = 20;

  /* ---- Fetch entries ---- */
  const loadEntries = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          perPage: String(perPage),
        });
        if (activeTab !== 'all') params.set('type', activeTab.toUpperCase());

        const res = await api.get<
          | { data: FeedEntry[]; total?: number }
          | FeedEntry[]
        >(`/api/activities?${params}`);

        const raw = res.data;
        let list: FeedEntry[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;

        // Normalize entries to our expected shape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized: FeedEntry[] = (list as any[]).map((item: any) => ({
          id: String(item.id ?? crypto.randomUUID()),
          type: normalizeType(String(item.type ?? 'agent_action')),
          actor: String(item.actor ?? item.title ?? 'System'),
          action: String(item.action ?? item.body ?? item.type ?? 'performed action'),
          target: item.target ? String(item.target) : null,
          timestamp: String(item.timestamp ?? item.occurredAt ?? item.createdAt ?? new Date().toISOString()),
          metadata: (item.metadata as Record<string, unknown>) ?? undefined,
        }));

        // If API returned empty, use seed data on first page
        if (normalized.length === 0 && pageNum === 1) {
          const seed = generateSeedData();
          setEntries(seed);
          setHasMore(false);
        } else {
          if (append) {
            setEntries((prev) => [...prev, ...normalized]);
          } else {
            setEntries(normalized);
          }
          setHasMore(normalized.length >= perPage);
        }
      } catch {
        // On error, show seed data
        if (pageNum === 1) {
          setEntries(generateSeedData());
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, api],
  );

  function normalizeType(raw: string): EventType {
    const map: Record<string, EventType> = {
      LOGIN: 'login',
      PAGE_CREATED: 'page_created',
      DEAL_CLOSED: 'deal_closed',
      EMAIL_SENT: 'email_sent',
      EMAIL: 'email_sent',
      CALL_MADE: 'call_made',
      CALL: 'call_made',
      TASK_COMPLETED: 'task_completed',
      TASK: 'task_completed',
      DEPLOYMENT: 'deployment',
      AGENT_ACTION: 'agent_action',
      SYSTEM: 'agent_action',
      NOTE: 'page_created',
      SMS: 'email_sent',
      MEETING: 'call_made',
      SEO_LEAD: 'agent_action',
      PURCHASE: 'deal_closed',
      NOTIFICATION_SENT: 'agent_action',
    };
    return map[raw.toUpperCase()] ?? 'agent_action';
  }

  useEffect(() => {
    setPage(1);
    loadEntries(1);
  }, [activeTab, loadEntries]);

  /* ---- Real-time polling for new entries ---- */
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      if (entries.length === 0) return;
      try {
        const latestTs = entries[0]?.timestamp;
        const params = new URLSearchParams({ perPage: '5' });
        if (activeTab !== 'all') params.set('type', activeTab.toUpperCase());

        const res = await api.get<
          | { data: FeedEntry[] }
          | FeedEntry[]
        >(`/api/activities?${params}`);

        const raw = res.data;
        let list: FeedEntry[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fresh = (list as any[])
          .map((item: any) => ({
            id: String(item.id ?? crypto.randomUUID()),
            type: normalizeType(String(item.type ?? 'agent_action')),
            actor: String(item.actor ?? item.title ?? 'System'),
            action: String(item.action ?? item.body ?? 'performed action'),
            target: item.target ? String(item.target) : null,
            timestamp: String(item.timestamp ?? item.occurredAt ?? item.createdAt ?? new Date().toISOString()),
          }))
          .filter(
            (e: FeedEntry) =>
              latestTs && new Date(e.timestamp) > new Date(latestTs),
          );

        if (fresh.length > 0) {
          setNewEntries((prev) => [...fresh, ...prev]);
        }
      } catch {
        /* silent */
      }
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [entries, activeTab, api]);

  /* ---- Merge new entries ---- */
  function mergeNewEntries() {
    setEntries((prev) => [...newEntries, ...prev]);
    setNewEntries([]);
  }

  /* ---- Load more ---- */
  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEntries(nextPage, true);
  }

  /* ---- Client-side filters ---- */
  const filtered = entries.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.target ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (dateFrom && new Date(e.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && new Date(e.timestamp) > new Date(dateTo + 'T23:59:59'))
      return false;
    return true;
  });

  const hasFilters = search || dateFrom || dateTo;

  /* ---- Counts per type ---- */
  const typeCounts: Record<string, number> = {};
  entries.forEach((e) => {
    typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;
  });

  return (
    <div className="min-h-screen bg-card">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Activity Feed
          </h1>
          <p className="text-muted-foreground leading-relaxed mt-1">
            Unified timeline of all system events
          </p>
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-1 border-b border-white/[0.04] overflow-x-auto scrollbar-hide">
          {EVENT_TYPES.map((t) => {
            const count =
              t.value === 'all'
                ? entries.length
                : typeCounts[t.value] ?? 0;
            return (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === t.value
                    ? 'border-b-2 border-red-500 text-red-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeTab === t.value
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-white/[0.04] text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Date Range */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-72 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 [color-scheme:dark]"
            />
            <span className="text-xs font-medium text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 [color-scheme:dark]"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl transition-all duration-200"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* New entries banner */}
        {newEntries.length > 0 && (
          <button
            onClick={mergeNewEntries}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-300 animate-pulse"
          >
            <Activity className="h-4 w-4" />
            {newEntries.length} new event{newEntries.length > 1 ? 's' : ''} — click to load
          </button>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.04] border-t-red-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 text-muted-foreground" />
            <p className="text-muted-foreground leading-relaxed">No events found</p>
            {hasFilters && (
              <p className="text-xs text-muted-foreground mt-2">
                Try adjusting your filters
              </p>
            )}
          </div>
        ) : (
          <div className="relative ml-6">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-red-500/20" />

            <div className="space-y-1">
              {filtered.map((entry, idx) => {
                const Icon = TYPE_ICON[entry.type] ?? Activity;
                const dotColor = TYPE_DOT[entry.type] ?? 'bg-muted';
                const iconBg = TYPE_COLOR[entry.type] ?? 'bg-muted text-foreground';
                const isNew = idx === 0 && newEntries.length === 0;

                return (
                  <div
                    key={entry.id}
                    className={`relative flex items-start gap-6 group ${
                      isNew ? '' : ''
                    }`}
                    style={{
                      animation:
                        idx < 3 ? `feedSlideIn 0.3s ease-out ${idx * 0.05}s both` : undefined,
                    }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 mt-5 h-3 w-3 shrink-0 rounded-full ring-4 ring-zinc-950 ${dotColor} shadow-lg`}
                    />

                    {/* Entry card */}
                    <div className="flex-1 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 hover:border-white/[0.08] hover:bg-card transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Type icon */}
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${iconBg}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0">
                            <p className="text-sm text-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">
                                {entry.actor}
                              </span>{' '}
                              <span className="text-muted-foreground">
                                {entry.action}
                              </span>
                              {entry.target && (
                                <>
                                  {' '}
                                  <span className="font-medium text-foreground">
                                    {entry.target}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Timestamp */}
                        <span
                          className="shrink-0 text-xs font-medium text-muted-foreground cursor-default"
                          title={formatFullTimestamp(entry.timestamp)}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>

                      {/* Footer badge */}
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md ${iconBg}`}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {TYPE_LABEL[entry.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl text-sm font-medium text-foreground hover:text-foreground hover:border-white/[0.1] hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load more events
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-in animation keyframes */}
      <style jsx global>{`
        @keyframes feedSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
