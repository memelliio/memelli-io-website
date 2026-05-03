'use client';

import { useState, useEffect, useCallback } from 'react';

/* =========================================================================
   Config + Auth
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    null
  );
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: err?.error ?? `HTTP ${res.status}` };
    }
    const json = await res.json();
    const data: T =
      json && typeof json === 'object' && 'data' in json ? json.data : json;
    return { data, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/* =========================================================================
   Types
   ========================================================================= */

type Tab = 'calls' | 'sms' | 'email' | 'tickets' | 'analytics';

// --- Calls ---
interface CallRecord {
  id: string;
  direction: string;
  contactName: string;
  phoneNumber: string;
  duration: number;
  status: string;
  createdAt: string;
  recordingUrl: string | null;
  notes: string | null;
  disposition: string | null;
}

// --- SMS ---
interface SmsThread {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  direction: string;
}

interface SmsMessage {
  id: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
}

interface SmsThreadDetail {
  threadId: string;
  contactName: string;
  contactPhone: string;
  messages: SmsMessage[];
}

// --- Email ---
interface EmailThread {
  id: string;
  subject: string;
  from: string;
  to: string;
  preview: string;
  isRead: boolean;
  direction: string;
  createdAt: string;
}

interface EmailThreadDetail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  isRead: boolean;
  direction: string;
  createdAt: string;
}

// --- Tickets ---
interface TicketComment {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requester: string;
  assignedAgent: string | null;
  slaDeadline: string | null;
  createdAt: string;
  comments: TicketComment[];
}

// --- Analytics ---
interface CommsAnalytics {
  calls: { total: number };
  messages: { total: number };
  chats: { total: number };
  tickets: { total: number; open: number; resolved: number };
  voicemails: { total: number };
  avgWaitTimeSeconds: number;
  avgSatisfactionScore: number | null;
}

interface SentimentData {
  total: number;
  positive: { count: number; percentage: number };
  neutral: { count: number; percentage: number };
  negative: { count: number; percentage: number };
  avgScore: number | null;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function fmtDuration(s: number): string {
  if (!s || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'sent' || s === 'resolved' || s === 'closed') return '#22c55e';
  if (s === 'failed' || s === 'missed' || s === 'urgent') return '#ef4444';
  if (s === 'ringing' || s === 'in-progress' || s === 'queued' || s === 'in_progress') return '#f97316';
  if (s === 'open' || s === 'high') return '#dc2626';
  if (s === 'medium') return '#f59e0b';
  return '#71717a';
}

function priorityDot(priority: string): string {
  const p = priority.toLowerCase();
  if (p === 'urgent') return '#ef4444';
  if (p === 'high') return '#f97316';
  if (p === 'medium') return '#f59e0b';
  return '#71717a';
}

/* =========================================================================
   Sub-components
   ========================================================================= */

/* ── Shared loading / error skeletons ── */
function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            animation: 'pulse 1.6s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(220,38,38,0.12)',
        border: '1px solid rgba(220,38,38,0.3)',
        color: '#fca5a5',
        fontSize: 12,
        fontFamily: 'monospace',
      }}
    >
      {msg}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#71717a',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   CALLS TAB
   ───────────────────────────────────────── */
function CallsTab() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialNumber, setDialNumber] = useState('');
  const [dialing, setDialing] = useState(false);
  const [dialMsg, setDialMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound' | 'missed'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<CallRecord[]>('/comms/calls?limit=50');
    if (err) setError(err);
    else setCalls(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const dial = async () => {
    if (!dialNumber.trim()) return;
    setDialing(true);
    setDialMsg(null);
    const { error: err } = await apiFetch('/comms/calls/dial', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: dialNumber.trim() }),
    });
    if (err) setDialMsg(`Error: ${err}`);
    else {
      setDialMsg('Call initiated');
      setDialNumber('');
      setTimeout(load, 1500);
    }
    setDialing(false);
  };

  const filtered = calls.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'missed') return c.status === 'missed';
    return c.direction === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Dialer */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Outbound Dial
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={dialNumber}
            onChange={e => setDialNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && dial()}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 11px',
              color: '#fff',
              fontSize: 13,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            onClick={dial}
            disabled={dialing || !dialNumber.trim()}
            style={{
              background: dialing || !dialNumber.trim()
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg,#dc2626,#f97316)',
              border: 'none',
              borderRadius: 7,
              padding: '7px 16px',
              color: '#fff',
              fontSize: 12,
              fontFamily: 'monospace',
              fontWeight: 600,
              cursor: dialing || !dialNumber.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {dialing ? 'Calling...' : 'Call'}
          </button>
        </div>
        {dialMsg && (
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: dialMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
            {dialMsg}
          </span>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['all', 'inbound', 'outbound', 'missed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === f ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              padding: '4px 10px',
              color: filter === f ? '#fca5a5' : '#a1a1aa',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#71717a',
            fontSize: 11,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && <LoadingRows />}
        {!loading && error && <ErrorBanner msg={error} />}
        {!loading && !error && filtered.length === 0 && (
          <span style={{ color: '#52525b', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>No calls found.</span>
        )}
        {!loading && !error && filtered.map(call => (
          <div
            key={call.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9,
              padding: '10px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {call.contactName || call.phoneNumber}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: statusColor(call.status),
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {call.status.replace(/-/g, ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{call.phoneNumber}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b' }}>
                {call.direction.toUpperCase()}
              </span>
              {call.duration > 0 && (
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>
                  {fmtDuration(call.duration)}
                </span>
              )}
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3f3f46', marginLeft: 'auto' }}>
                {relTime(call.createdAt)}
              </span>
            </div>
            {call.notes && (
              <span style={{ fontSize: 11, color: '#71717a', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {call.notes}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SMS TAB
   ───────────────────────────────────────── */
function SmsTab() {
  const [threads, setThreads] = useState<SmsThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<SmsThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  // New SMS form
  const [showNew, setShowNew] = useState(false);
  const [newTo, setNewTo] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSending, setNewSending] = useState(false);
  const [newMsg, setNewMsg] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<SmsThread[]>('/comms/sms/threads?limit=50');
    if (err) setError(err);
    else setThreads(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = async (threadId: string) => {
    setThreadLoading(true);
    const { data, error: err } = await apiFetch<SmsThreadDetail>(`/comms/sms/threads/${threadId}`);
    if (!err && data) setActiveThread(data);
    setThreadLoading(false);
  };

  const sendReply = async () => {
    if (!activeThread || !replyBody.trim()) return;
    setSending(true);
    setSendMsg(null);
    const { error: err } = await apiFetch(`/comms/sms/send`, {
      method: 'POST',
      body: JSON.stringify({ threadId: activeThread.threadId, body: replyBody.trim() }),
    });
    if (err) setSendMsg(`Error: ${err}`);
    else {
      setSendMsg('Sent');
      setReplyBody('');
      await openThread(activeThread.threadId);
      setTimeout(() => setSendMsg(null), 2000);
    }
    setSending(false);
  };

  const sendNew = async () => {
    if (!newTo.trim() || !newBody.trim()) return;
    setNewSending(true);
    setNewMsg(null);
    const { error: err } = await apiFetch('/comms/sms/send', {
      method: 'POST',
      body: JSON.stringify({ to: newTo.trim(), body: newBody.trim() }),
    });
    if (err) setNewMsg(`Error: ${err}`);
    else {
      setNewMsg('Sent');
      setNewTo('');
      setNewBody('');
      await loadThreads();
      setTimeout(() => { setShowNew(false); setNewMsg(null); }, 1500);
    }
    setNewSending(false);
  };

  if (activeThread) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setActiveThread(null)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600 }}>{activeThread.contactName}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>{activeThread.contactPhone}</div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '4px 0',
          }}
        >
          {threadLoading && <LoadingRows count={3} />}
          {!threadLoading && activeThread.messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '78%',
                  background: msg.direction === 'outbound'
                    ? 'linear-gradient(135deg,rgba(220,38,38,0.25),rgba(249,115,22,0.2))'
                    : 'rgba(255,255,255,0.06)',
                  border: msg.direction === 'outbound'
                    ? '1px solid rgba(220,38,38,0.3)'
                    : '1px solid rgba(255,255,255,0.09)',
                  borderRadius: msg.direction === 'outbound' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
                  padding: '8px 11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <span style={{ color: '#e4e4e7', fontSize: 12, lineHeight: 1.5 }}>{msg.body}</span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#52525b' }}>
                    {relTime(msg.createdAt)}
                  </span>
                  {msg.direction === 'outbound' && (
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: statusColor(msg.status) }}>
                      {msg.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <textarea
            rows={2}
            placeholder="Type a reply..."
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {sendMsg && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: sendMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
                {sendMsg}
              </span>
            )}
            <button
              onClick={sendReply}
              disabled={sending || !replyBody.trim()}
              style={{
                marginLeft: 'auto',
                background: sending || !replyBody.trim()
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#dc2626,#f97316)',
                border: 'none',
                borderRadius: 7,
                padding: '7px 16px',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: sending || !replyBody.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setShowNew(!showNew)}
          style={{
            background: showNew ? 'rgba(220,38,38,0.15)' : 'linear-gradient(135deg,#dc2626,#f97316)',
            border: showNew ? '1px solid rgba(220,38,38,0.4)' : 'none',
            borderRadius: 7,
            padding: '6px 14px',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showNew ? 'Cancel' : 'New SMS'}
        </button>
        <button
          onClick={loadThreads}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '5px 10px',
            color: '#71717a',
            fontSize: 11,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* New SMS form */}
      {showNew && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            type="tel"
            placeholder="To: +1 (555) 000-0000"
            value={newTo}
            onChange={e => setNewTo(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <textarea
            rows={2}
            placeholder="Message..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {newMsg && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: newMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
                {newMsg}
              </span>
            )}
            <button
              onClick={sendNew}
              disabled={newSending || !newTo.trim() || !newBody.trim()}
              style={{
                marginLeft: 'auto',
                background: newSending || !newTo.trim() || !newBody.trim()
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#dc2626,#f97316)',
                border: 'none',
                borderRadius: 7,
                padding: '7px 16px',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: newSending ? 'not-allowed' : 'pointer',
              }}
            >
              {newSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && <LoadingRows />}
        {!loading && error && <ErrorBanner msg={error} />}
        {!loading && !error && threads.length === 0 && (
          <span style={{ color: '#52525b', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>No SMS threads.</span>
        )}
        {!loading && !error && threads.map(thread => (
          <button
            key={thread.id}
            onClick={() => openThread(thread.id)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9,
              padding: '10px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: thread.unreadCount > 0 ? 700 : 500 }}>
                {thread.contactName}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {thread.unreadCount > 0 && (
                  <span
                    style={{
                      background: 'linear-gradient(135deg,#dc2626,#f97316)',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {thread.unreadCount}
                  </span>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3f3f46' }}>
                  {relTime(thread.lastMessageAt)}
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#71717a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {thread.lastMessage || '(no messages yet)'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   EMAIL TAB
   ───────────────────────────────────────── */
function EmailTab() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<EmailThreadDetail | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  // Compose fields
  const [cTo, setCTo] = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cBody, setCBody] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeMsg, setComposeMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<EmailThread[]>('/comms/email/threads?limit=50');
    if (err) setError(err);
    else setThreads(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEmail = async (id: string) => {
    setEmailLoading(true);
    const { data, error: err } = await apiFetch<EmailThreadDetail>(`/comms/email/threads/${id}`);
    if (!err && data) setActiveEmail(data);
    setEmailLoading(false);
  };

  const sendEmail = async () => {
    if (!cTo.trim() || !cSubject.trim() || !cBody.trim()) return;
    setComposing(true);
    setComposeMsg(null);
    const { error: err } = await apiFetch('/comms/email/send', {
      method: 'POST',
      body: JSON.stringify({ to: cTo.trim(), subject: cSubject.trim(), body: cBody.trim() }),
    });
    if (err) setComposeMsg(`Error: ${err}`);
    else {
      setComposeMsg('Sent');
      setCTo(''); setCSubject(''); setCBody('');
      await load();
      setTimeout(() => { setShowCompose(false); setComposeMsg(null); }, 1500);
    }
    setComposing(false);
  };

  const deleteThread = async (id: string) => {
    await apiFetch(`/comms/email/threads/${id}`, { method: 'DELETE' });
    setActiveEmail(null);
    load();
  };

  if (activeEmail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveEmail(null)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <button
            onClick={() => deleteThread(activeEmail.id)}
            style={{
              marginLeft: 'auto',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#fca5a5',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>

        {emailLoading ? (
          <LoadingRows count={3} />
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h3 style={{ margin: 0, color: '#e4e4e7', fontSize: 15, fontWeight: 700 }}>{activeEmail.subject}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>
                From: {activeEmail.from}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>
                To: {activeEmail.to}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3f3f46' }}>
                {relTime(activeEmail.createdAt)}
              </span>
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                paddingTop: 12,
                color: '#d4d4d8',
                fontSize: 13,
                lineHeight: 1.65,
                wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{ __html: activeEmail.body || '(empty)' }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowCompose(!showCompose)}
          style={{
            background: showCompose ? 'rgba(220,38,38,0.15)' : 'linear-gradient(135deg,#dc2626,#f97316)',
            border: showCompose ? '1px solid rgba(220,38,38,0.4)' : 'none',
            borderRadius: 7,
            padding: '6px 14px',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showCompose ? 'Cancel' : 'Compose'}
        </button>
        <button
          onClick={load}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '5px 10px',
            color: '#71717a',
            fontSize: 11,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            type="email"
            placeholder="To: email@example.com"
            value={cTo}
            onChange={e => setCTo(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Subject"
            value={cSubject}
            onChange={e => setCSubject(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <textarea
            rows={4}
            placeholder="Body..."
            value={cBody}
            onChange={e => setCBody(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              minHeight: 80,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {composeMsg && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: composeMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
                {composeMsg}
              </span>
            )}
            <button
              onClick={sendEmail}
              disabled={composing || !cTo.trim() || !cSubject.trim() || !cBody.trim()}
              style={{
                marginLeft: 'auto',
                background: composing ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#dc2626,#f97316)',
                border: 'none',
                borderRadius: 7,
                padding: '7px 16px',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: composing ? 'not-allowed' : 'pointer',
              }}
            >
              {composing ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && <LoadingRows />}
        {!loading && error && <ErrorBanner msg={error} />}
        {!loading && !error && threads.length === 0 && (
          <span style={{ color: '#52525b', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>No email threads.</span>
        )}
        {!loading && !error && threads.map(thread => (
          <button
            key={thread.id}
            onClick={() => openEmail(thread.id)}
            style={{
              background: !thread.isRead ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${!thread.isRead ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 9,
              padding: '10px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = thread.isRead ? 'rgba(255,255,255,0.04)' : 'rgba(220,38,38,0.06)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: !thread.isRead ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {thread.subject}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3f3f46', flexShrink: 0 }}>
                {relTime(thread.createdAt)}
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>
              {thread.direction === 'outbound' ? `To: ${thread.to}` : `From: ${thread.from}`}
            </span>
            {thread.preview && (
              <span style={{ fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {thread.preview}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TICKETS TAB
   ───────────────────────────────────────── */
function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all');
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentMsg, setCommentMsg] = useState<string | null>(null);
  // New ticket
  const [showNew, setShowNew] = useState(false);
  const [nSubject, setNSubject] = useState('');
  const [nDesc, setNDesc] = useState('');
  const [nPriority, setNPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = statusFilter !== 'all' ? `?status=${statusFilter.toUpperCase()}` : '';
    const { data, error: err } = await apiFetch<Ticket[]>(`/comms/tickets${params}&perPage=50`);
    if (err) setError(err);
    else setTickets(data ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const addComment = async () => {
    if (!activeTicket || !comment.trim()) return;
    setCommenting(true);
    setCommentMsg(null);
    const { error: err } = await apiFetch(`/comms/tickets/${activeTicket.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: comment.trim(), isInternal: false }),
    });
    if (err) setCommentMsg(`Error: ${err}`);
    else {
      setCommentMsg('Comment added');
      setComment('');
      // Refresh ticket detail
      const { data } = await apiFetch<Ticket[]>(`/comms/tickets`);
      const updated = (data ?? []).find(t => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
      setTimeout(() => setCommentMsg(null), 2000);
    }
    setCommenting(false);
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await apiFetch(`/comms/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
    if (activeTicket?.id === ticketId) {
      setActiveTicket(prev => prev ? { ...prev, status } : prev);
    }
  };

  const escalate = async (ticketId: string) => {
    await apiFetch(`/comms/tickets/${ticketId}/escalate`, { method: 'POST' });
    load();
  };

  const createTicket = async () => {
    if (!nSubject.trim() || !nDesc.trim()) return;
    setCreating(true);
    setCreateMsg(null);
    const { error: err } = await apiFetch('/comms/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: nSubject.trim(), description: nDesc.trim(), priority: nPriority }),
    });
    if (err) setCreateMsg(`Error: ${err}`);
    else {
      setCreateMsg('Created');
      setNSubject(''); setNDesc(''); setNPriority('MEDIUM');
      await load();
      setTimeout(() => { setShowNew(false); setCreateMsg(null); }, 1500);
    }
    setCreating(false);
  };

  if (activeTicket) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveTicket(null)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTicket.subject}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: statusColor(activeTicket.status) }}>
                {activeTicket.status.toUpperCase()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityDot(activeTicket.priority), display: 'inline-block' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>{activeTicket.priority.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {activeTicket.status !== 'resolved' && (
            <button
              onClick={() => updateStatus(activeTicket.id, 'resolved')}
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 6,
                padding: '4px 10px',
                color: '#86efac',
                fontSize: 10,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              Mark Resolved
            </button>
          )}
          {activeTicket.status === 'open' && (
            <button
              onClick={() => updateStatus(activeTicket.id, 'in_progress')}
              style={{
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 6,
                padding: '4px 10px',
                color: '#fdba74',
                fontSize: 10,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              In Progress
            </button>
          )}
          <button
            onClick={() => escalate(activeTicket.id)}
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#fca5a5',
              fontSize: 10,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            Escalate
          </button>
        </div>

        {/* Details */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#52525b', textTransform: 'uppercase', marginBottom: 2 }}>Requester</div>
              <div style={{ color: '#d4d4d8', fontSize: 12 }}>{activeTicket.requester}</div>
            </div>
            {activeTicket.assignedAgent && (
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#52525b', textTransform: 'uppercase', marginBottom: 2 }}>Assigned</div>
                <div style={{ color: '#d4d4d8', fontSize: 12 }}>{activeTicket.assignedAgent}</div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#52525b', textTransform: 'uppercase', marginBottom: 2 }}>Created</div>
              <div style={{ fontFamily: 'monospace', color: '#71717a', fontSize: 11 }}>{relTime(activeTicket.createdAt)}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, color: '#a1a1aa', fontSize: 12, lineHeight: 1.6, wordBreak: 'break-word' }}>
            {activeTicket.description}
          </div>
        </div>

        {/* Comments */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase' }}>
            Comments ({activeTicket.comments.length})
          </span>
          {activeTicket.comments.map(c => (
            <div
              key={c.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600 }}>{c.authorName}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3f3f46' }}>{relTime(c.createdAt)}</span>
              </div>
              <span style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.5 }}>{c.content}</span>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <textarea
            rows={2}
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {commentMsg && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: commentMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
                {commentMsg}
              </span>
            )}
            <button
              onClick={addComment}
              disabled={commenting || !comment.trim()}
              style={{
                marginLeft: 'auto',
                background: commenting || !comment.trim()
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg,#dc2626,#f97316)',
                border: 'none',
                borderRadius: 7,
                padding: '6px 14px',
                color: '#fff',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: commenting || !comment.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {commenting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setShowNew(!showNew)}
          style={{
            background: showNew ? 'rgba(220,38,38,0.15)' : 'linear-gradient(135deg,#dc2626,#f97316)',
            border: showNew ? '1px solid rgba(220,38,38,0.4)' : 'none',
            borderRadius: 7,
            padding: '6px 14px',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showNew ? 'Cancel' : 'New Ticket'}
        </button>
        {(['all', 'open', 'resolved', 'closed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              background: statusFilter === f ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${statusFilter === f ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              padding: '4px 10px',
              color: statusFilter === f ? '#fca5a5' : '#71717a',
              fontSize: 10,
              fontFamily: 'monospace',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#71717a',
            fontSize: 10,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="Subject"
            value={nSubject}
            onChange={e => setNSubject(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <textarea
            rows={3}
            placeholder="Description..."
            value={nDesc}
            onChange={e => setNDesc(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              padding: '7px 10px',
              color: '#e4e4e7',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>Priority:</span>
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map(p => (
              <button
                key={p}
                onClick={() => setNPriority(p)}
                style={{
                  background: nPriority === p ? `${priorityDot(p)}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${nPriority === p ? priorityDot(p) : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 5,
                  padding: '3px 8px',
                  color: nPriority === p ? priorityDot(p) : '#71717a',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {createMsg && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: createMsg.startsWith('Error') ? '#fca5a5' : '#86efac' }}>
                {createMsg}
              </span>
            )}
            <button
              onClick={createTicket}
              disabled={creating || !nSubject.trim() || !nDesc.trim()}
              style={{
                marginLeft: 'auto',
                background: creating ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#dc2626,#f97316)',
                border: 'none',
                borderRadius: 7,
                padding: '7px 16px',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      )}

      {/* Ticket list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && <LoadingRows />}
        {!loading && error && <ErrorBanner msg={error} />}
        {!loading && !error && tickets.length === 0 && (
          <span style={{ color: '#52525b', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>No tickets found.</span>
        )}
        {!loading && !error && tickets.map(ticket => (
          <button
            key={ticket.id}
            onClick={() => setActiveTicket(ticket)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${priorityDot(ticket.priority)}`,
              borderRadius: 9,
              padding: '10px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {ticket.subject}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: statusColor(ticket.status), flexShrink: 0 }}>
                {ticket.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>{ticket.requester}</span>
              {ticket.comments.length > 0 && (
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b' }}>
                  {ticket.comments.length} comment{ticket.comments.length !== 1 ? 's' : ''}
                </span>
              )}
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#3f3f46', marginLeft: 'auto' }}>
                {relTime(ticket.createdAt)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ANALYTICS TAB
   ───────────────────────────────────────── */
function AnalyticsTab() {
  const [summary, setSummary] = useState<CommsAnalytics | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [summaryRes, sentimentRes] = await Promise.all([
      apiFetch<CommsAnalytics>('/comms/analytics'),
      apiFetch<SentimentData>('/comms/analytics/sentiment'),
    ]);
    if (summaryRes.error) setError(summaryRes.error);
    else setSummary(summaryRes.data);
    if (!sentimentRes.error && sentimentRes.data) setSentiment(sentimentRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={load}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#71717a',
            fontSize: 10,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingRows count={6} />}
      {!loading && error && <ErrorBanner msg={error} />}

      {!loading && !error && summary && (
        <>
          {/* Volume stats grid */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Volume
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
              <StatCard label="Calls" value={summary.calls.total} />
              <StatCard label="Messages" value={summary.messages.total} />
              <StatCard label="Chats" value={summary.chats.total} />
              <StatCard label="Voicemails" value={summary.voicemails.total} />
            </div>
          </div>

          {/* Tickets */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Tickets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
              <StatCard label="Total" value={summary.tickets.total} />
              <StatCard label="Open" value={summary.tickets.open} />
              <StatCard label="Resolved" value={summary.tickets.resolved} />
            </div>
          </div>

          {/* Performance */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
              <StatCard
                label="Avg Wait Time"
                value={summary.avgWaitTimeSeconds > 0
                  ? fmtDuration(Math.round(summary.avgWaitTimeSeconds))
                  : '--'}
              />
              <StatCard
                label="Satisfaction"
                value={summary.avgSatisfactionScore !== null
                  ? `${(summary.avgSatisfactionScore * 100).toFixed(0)}%`
                  : '--'}
              />
            </div>
          </div>
        </>
      )}

      {/* Sentiment */}
      {!loading && sentiment && sentiment.total > 0 && (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Sentiment ({sentiment.total} records)
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Bar */}
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1 }}>
              {sentiment.positive.percentage > 0 && (
                <div style={{ flex: sentiment.positive.percentage, background: '#22c55e', borderRadius: '4px 0 0 4px' }} />
              )}
              {sentiment.neutral.percentage > 0 && (
                <div style={{ flex: sentiment.neutral.percentage, background: '#a1a1aa' }} />
              )}
              {sentiment.negative.percentage > 0 && (
                <div style={{ flex: sentiment.negative.percentage, background: '#ef4444', borderRadius: '0 4px 4px 0' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Positive', data: sentiment.positive, color: '#22c55e' },
                { label: 'Neutral', data: sentiment.neutral, color: '#a1a1aa' },
                { label: 'Negative', data: sentiment.negative, color: '#ef4444' },
              ].map(({ label, data, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e7', marginLeft: 13 }}>
                    {data.percentage}%
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#52525b', marginLeft: 13 }}>
                    {data.count} records
                  </span>
                </div>
              ))}
              {sentiment.avgScore !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a', marginLeft: 13 }}>Avg Score</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e7', marginLeft: 13 }}>
                    {sentiment.avgScore.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && sentiment && sentiment.total === 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9,
            padding: '14px',
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#52525b',
            textAlign: 'center',
          }}
        >
          No sentiment data recorded yet.
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CommsPanel — root export
   ========================================================================= */

const TABS: { key: Tab; label: string }[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'sms', label: 'SMS' },
  { key: 'email', label: 'Email' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'analytics', label: 'Analytics' },
];

export function CommsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('calls');

  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 280,
        minHeight: 300,
        overflow: 'hidden',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        color: '#e4e4e7',
      }}
    >
      {/* Keyframe injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key
                ? '2px solid transparent'
                : '2px solid transparent',
              borderImage: activeTab === tab.key
                ? 'linear-gradient(135deg,#dc2626,#f97316) 1'
                : 'none',
              padding: '10px 14px',
              color: activeTab === tab.key ? '#fff' : '#71717a',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: activeTab === tab.key ? 700 : 400,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '14px 14px 12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeTab === 'calls' && <CallsTab />}
        {activeTab === 'sms' && <SmsTab />}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}

export default CommsPanel;
