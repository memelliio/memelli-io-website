'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
const ACCENT = '#dc2626';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Auth                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_dev_token') ||
    null
  );
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; status: number | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 404) return { data: null, status: 404, error: 'not_found' };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, status: res.status, error: err?.error ?? err?.message ?? `HTTP ${res.status}` };
    }
    const json = await res.json();
    const data: T =
      json && typeof json === 'object' && 'data' in json ? json.data : json;
    return { data, status: res.status, error: null };
  } catch (e: unknown) {
    return { data: null, status: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types — shaped from GET /api/comms/calls and /api/comms/voicemail         */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Call {
  id: string;
  direction: 'inbound' | 'outbound';
  contactName?: string | null;
  phoneNumber?: string | null;
  duration: number; // seconds
  status: string; // e.g. 'completed', 'missed', 'in-progress', 'ringing'
  createdAt: string;
  recordingUrl?: string | null;
  notes?: string | null;
}

interface Voicemail {
  id: string;
  fromNumber: string;
  fromName?: string | null;
  duration?: number | null;
  createdAt: string;
  isRead: boolean;
  transcription?: string | null;
  audioUrl?: string | null;
}

interface CommsAnalytics {
  calls: { total: number };
  voicemails: { total: number };
  avgWaitTimeSeconds: number;
}

interface CallsMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function callStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase().replace(/-/g, '');
  if (s === 'completed') return 'green';
  if (s === 'missed') return 'red';
  if (s === 'inprogress' || s === 'ringing') return 'blue';
  if (s === 'voicemail') return 'yellow';
  return 'default';
}

function callStatusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: 'Completed',
    missed: 'Missed',
    'in-progress': 'Live',
    ringing: 'Ringing',
    voicemail: 'Voicemail',
    failed: 'Failed',
    'on-hold': 'On Hold',
  };
  return map[status.toLowerCase()] ?? status;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Design primitives                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '0.75rem',
  padding: '1rem',
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

type BadgeVariant = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'default';

function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const map: Record<BadgeVariant, string> = {
    green: 'bg-emerald-950 text-emerald-400 border border-emerald-800/40',
    yellow: 'bg-yellow-950 text-yellow-400 border border-yellow-800/40',
    orange: 'bg-orange-950 text-orange-400 border border-orange-800/40',
    red: 'bg-red-950 text-red-400 border border-red-800/40',
    blue: 'bg-sky-950 text-sky-400 border border-sky-800/40',
    default: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-white/[0.06]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${map[variant]}`}>
      {label}
    </span>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-white/[0.05] animate-pulse ${className}`} />;
}

function Spinner() {
  return (
    <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ── Direction icon ── */
function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  const isMissed = status === 'missed';
  const color =
    isMissed ? '#ef4444' : direction === 'inbound' ? '#4ade80' : ACCENT;

  if (direction === 'inbound') {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
      </svg>
    );
  }
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

/* ── Voicemail play stub ── */
function VoicemailRow({
  vm,
  onMarkRead,
}: {
  vm: Voicemail;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-b-0 ${!vm.isRead ? 'opacity-100' : 'opacity-60'}`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: vm.isRead ? 'rgba(255,255,255,0.1)' : ACCENT }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-[hsl(var(--foreground))] font-medium truncate">
            {vm.fromName ?? vm.fromNumber}
          </p>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] shrink-0">
            {relativeTime(vm.createdAt)}
          </span>
        </div>
        {vm.transcription && (
          <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] truncate mt-0.5 leading-relaxed">
            {vm.transcription}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {vm.duration != null && (
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
              {formatDuration(vm.duration)}
            </span>
          )}
          {!vm.isRead && (
            <button
              onClick={() => onMarkRead(vm.id)}
              className="text-[10px] font-mono transition-colors"
              style={{ color: ACCENT }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function PhonePanel() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [callsMeta, setCallsMeta] = useState<CallsMeta | null>(null);
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [analytics, setAnalytics] = useState<CommsAnalytics | null>(null);

  const [callsLoading, setCallsLoading] = useState(true);
  const [vmLoading, setVmLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [noPhoneData, setNoPhoneData] = useState(false);

  /* Dial state */
  const [dialNumber, setDialNumber] = useState('');
  const [dialing, setDialing] = useState(false);
  const [dialResult, setDialResult] = useState<{ success: boolean; message: string } | null>(null);
  const dialRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Active tab */
  const [tab, setTab] = useState<'calls' | 'voicemail'>('calls');

  /* ── Load data ── */
  useEffect(() => {
    let cancelled = false;

    // Calls: GET /api/comms/calls?limit=10
    apiFetch<Call[]>('/api/comms/calls?limit=10').then(({ data, status, error }) => {
      if (cancelled) return;
      setCallsLoading(false);
      if (status === 404 || (!data && !error)) {
        setNoPhoneData(true);
        return;
      }
      if (Array.isArray(data)) setCalls(data);
    });

    // Voicemails: GET /api/comms/voicemail
    apiFetch<Voicemail[]>('/api/comms/voicemail?perPage=5').then(({ data }) => {
      if (cancelled) return;
      setVmLoading(false);
      if (Array.isArray(data)) setVoicemails(data);
    });

    // Analytics: GET /api/comms/analytics
    apiFetch<CommsAnalytics>('/api/comms/analytics').then(({ data }) => {
      if (cancelled) return;
      setAnalyticsLoading(false);
      if (data) setAnalytics(data);
    });

    return () => { cancelled = true; };
  }, []);

  /* ── Calls today (rough from local data) ── */
  const callsToday = calls.filter((c) => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const completedCalls = calls.filter((c) => c.status === 'completed');
  const avgDuration =
    completedCalls.length > 0
      ? Math.round(completedCalls.reduce((s, c) => s + c.duration, 0) / completedCalls.length)
      : 0;

  const unreadVm = voicemails.filter((v) => !v.isRead).length;

  /* ── Quick dial ── */
  const handleDial = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const num = dialNumber.trim();
      if (!num) return;

      setDialing(true);
      setDialResult(null);

      const { error, status } = await apiFetch('/api/comms/calls/dial', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: num }),
      });

      setDialing(false);

      if (status === 404) {
        setDialResult({ success: false, message: 'Dial endpoint not configured.' });
      } else if (error) {
        setDialResult({ success: false, message: error });
      } else {
        setDialResult({ success: true, message: `Calling ${num}...` });
        setDialNumber('');
      }

      if (dialRef.current) clearTimeout(dialRef.current);
      dialRef.current = setTimeout(() => setDialResult(null), 5000);
    },
    [dialNumber]
  );

  /* ── Mark voicemail read ── */
  const markVoicemailRead = useCallback(async (id: string) => {
    setVoicemails((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isRead: true } : v))
    );
    await apiFetch(`/api/comms/voicemail/${id}/read`, { method: 'PATCH' });
  }, []);

  /* ── Refresh calls ── */
  const refreshCalls = useCallback(async () => {
    setCallsLoading(true);
    const { data } = await apiFetch<Call[]>('/api/comms/calls?limit=10');
    setCallsLoading(false);
    if (Array.isArray(data)) setCalls(data);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  No-data / connect state                                                   */
  /* ══════════════════════════════════════════════════════════════════════════ */

  if (!callsLoading && noPhoneData) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Phone</h2>
        </div>
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl py-12"
          style={card}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}33` }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[hsl(var(--foreground))] text-sm font-medium mb-1">Phone system not connected</p>
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">Connect Twilio to enable calling and voicemail</p>
          </div>
          <a
            href="/dashboard/settings/integrations"
            className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: ACCENT, color: '#fff' }}
          >
            Connect Phone System
          </a>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  Main render                                                               */
  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Phone</h2>
        <button
          onClick={refreshCalls}
          className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1"
        >
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Call Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Calls Today',
            value: analyticsLoading ? '—' : callsToday,
            sub: `${analytics?.calls?.total ?? 0} total`,
            color: ACCENT,
          },
          {
            label: 'Avg Duration',
            value: callsLoading ? '—' : formatDuration(avgDuration),
            sub: 'per call',
            color: '#71717a',
          },
          {
            label: 'Voicemail',
            value: vmLoading ? '—' : unreadVm,
            sub: 'unread',
            color: unreadVm > 0 ? '#f59e0b' : '#71717a',
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</span>
            <span className="text-xl font-bold leading-none text-white">{value}</span>
            <span className="text-[10px] font-mono" style={{ color }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Dial ── */}
      <div style={card}>
        <SectionHeader>Quick Dial</SectionHeader>
        <form onSubmit={handleDial} className="flex gap-2">
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <button
            type="submit"
            disabled={dialing || !dialNumber.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90 shrink-0"
            style={{ background: ACCENT }}
          >
            {dialing ? <Spinner /> : (
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            )}
            Dial
          </button>
        </form>
        {dialResult && (
          <p
            className="text-[10px] font-mono mt-2"
            style={{ color: dialResult.success ? '#4ade80' : '#ef4444' }}
          >
            {dialResult.message}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['calls', 'voicemail'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-wider transition-all"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: tab === t ? '#fff' : '#71717a',
              borderRight: t === 'calls' ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            {t === 'voicemail' && unreadVm > 0 ? `Voicemail (${unreadVm})` : t === 'calls' ? 'Recent Calls' : 'Voicemail'}
          </button>
        ))}
      </div>

      {/* ── Calls List ── */}
      {tab === 'calls' && (
        <div style={card}>
          <SectionHeader>Recent Calls</SectionHeader>
          {callsLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : calls.length === 0 ? (
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] text-center py-6">No calls on record.</p>
          ) : (
            <div className="flex flex-col">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] rounded transition-colors"
                >
                  {/* Direction icon */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <DirectionIcon direction={call.direction} status={call.status} />
                  </div>

                  {/* Name / number */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[hsl(var(--foreground))] font-medium truncate">
                      {call.contactName ?? call.phoneNumber ?? 'Unknown'}
                    </p>
                    <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                      {call.direction} &middot; {relativeTime(call.createdAt)}
                      {call.duration > 0 && (
                        <span className="text-[hsl(var(--muted-foreground))]"> &middot; {formatDuration(call.duration)}</span>
                      )}
                    </p>
                  </div>

                  {/* Status badge */}
                  <Badge
                    label={callStatusLabel(call.status)}
                    variant={callStatusVariant(call.status)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Voicemail List ── */}
      {tab === 'voicemail' && (
        <div style={card}>
          <SectionHeader>Voicemails</SectionHeader>
          {vmLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : voicemails.length === 0 ? (
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] text-center py-6">No voicemails.</p>
          ) : (
            <div>
              {voicemails.map((vm) => (
                <VoicemailRow key={vm.id} vm={vm} onMarkRead={markVoicemailRead} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Voice System Links ── */}
      <div
        className="flex items-center justify-between rounded-xl p-3 group transition-all"
        style={{
          background: `${ACCENT}08`,
          border: `1px solid ${ACCENT}22`,
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Voice System</span>
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {analyticsLoading ? 'Loading...' : `${analytics?.calls?.total ?? 0} calls logged`}
          </span>
        </div>
        <a
          href="/dashboard/comms/calls"
          className="text-[11px] font-mono flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: ACCENT }}
        >
          Full log
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

    </div>
  );
}
