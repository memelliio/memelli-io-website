'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

// Dispatch job types mapping to backend queue domain keywords
const DISPATCH_TYPES = [
  { value: 'content_generation', label: 'content_generation' },
  { value: 'ai_agent',           label: 'ai_agent'           },
  { value: 'automation',         label: 'automation'         },
  { value: 'crm',                label: 'crm'                },
  { value: 'seo_index',          label: 'seo_index'          },
  { value: 'analytics_rollup',   label: 'analytics_rollup'   },
  { value: 'commerce',           label: 'commerce'           },
  { value: 'coaching',           label: 'coaching'           },
  { value: 'notification',       label: 'notification'       },
  { value: 'email',              label: 'email'              },
  { value: 'reporting',          label: 'reporting'          },
  { value: 'lead_engine',        label: 'lead_engine'        },
] as const;
type DispatchType = typeof DISPATCH_TYPES[number]['value'];

/* =========================================================================
   Types — aligned to real API shapes
   ========================================================================= */

// GET /api/agents/dashboard
interface AgentDashboard {
  activeCounts: {
    total: number;
    active: number;
    idle: number;
    busy: number;
    error: number;
    disabled: number;
  };
  recentTasks: RecentTask[];
  openEscalations: unknown[];
}

interface RecentTask {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  agent?: { name: string } | null;
}

// GET /api/cockpit/queues
interface QueueEntry {
  key: string;
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  depth: number;
  error?: string;
}

interface QueuesResponse {
  totalQueues: number;
  totalDepth: number;
  totalFailed: number;
  queues: QueueEntry[];
}

// GET /api/cockpit/status
interface ServiceHealth {
  name: string;
  url: string;
  status: 'up' | 'down';
  responseTimeMs: number;
  lastChecked: string;
  error?: string;
}

interface CockpitStatus {
  overall: 'all_operational' | 'degraded' | 'all_down';
  services: ServiceHealth[];
  queues: { discovered: number; depths: QueueEntry[]; totalWaiting: number; totalActive: number };
  workers: { total: number; online: number };
  agents: { total: number; active: number; idle: number; pools: number };
  checkedAt: string;
}

/* =========================================================================
   Auth + Fetch helpers
   ========================================================================= */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_dev_token') ||
    null
  );
}

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && typeof json === 'object' && 'data' in json) return (json as any).data as T;
    return json as T;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, data: null, error: json?.error || `HTTP ${res.status}` };
    }
    const data = json && typeof json === 'object' && 'data' in json ? (json as any).data : json;
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, data: null, error: String(err) };
  }
}

/* =========================================================================
   Time helpers
   ========================================================================= */

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* =========================================================================
   Icons — inline SVG only
   ========================================================================= */

function IconAgents() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5" r="2.5" stroke="#10b981" strokeWidth="1.4" />
      <circle cx="3" cy="11" r="1.8" stroke="#10b981" strokeWidth="1.2" />
      <circle cx="13" cy="11" r="1.8" stroke="#10b981" strokeWidth="1.2" />
      <line x1="8" y1="7.5" x2="4.4" y2="9.5" stroke="#10b981" strokeWidth="1" />
      <line x1="8" y1="7.5" x2="11.6" y2="9.5" stroke="#10b981" strokeWidth="1" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="4"    width="12" height="2" rx="1" fill="#10b981" opacity="0.9" />
      <rect x="2" y="7.5" width="9"  height="2" rx="1" fill="#10b981" opacity="0.6" />
      <rect x="2" y="11"  width="6"  height="2" rx="1" fill="#10b981" opacity="0.3" />
    </svg>
  );
}

function IconWorkers() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="#10b981" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="#10b981" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="#10b981" strokeWidth="1.3" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="#10b981" strokeWidth="1.3" opacity="0.35" />
    </svg>
  );
}

function IconHealth() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <polyline points="1,8 4,8 5.5,3.5 7.5,12.5 9.5,6 11,8 15,8" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconDispatch() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <polygon points="2,2 12,7 2,12" fill="#10b981" />
    </svg>
  );
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      style={{ animation: spinning ? 'spin-ccw 1s linear infinite' : 'none' }}
    >
      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="8,1 11,4 8,4" stroke="#71717a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* =========================================================================
   Sub-components
   ========================================================================= */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function StatusDot({ status }: { status: 'active' | 'idle' | 'error' | 'busy' | 'up' | 'down' | 'degraded' }) {
  if (status === 'active' || status === 'busy' || status === 'up') {
    return (
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: '#10b981', flexShrink: 0,
        animation: 'pulse-green 1.8s ease-in-out infinite',
      }} />
    );
  }
  if (status === 'error' || status === 'down') {
    return (
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: '#ef4444', flexShrink: 0,
      }} />
    );
  }
  if (status === 'degraded') {
    return (
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: '#f59e0b', flexShrink: 0,
      }} />
    );
  }
  // idle
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: '#52525b', flexShrink: 0,
    }} />
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    running:   { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
    pending:   { bg: 'rgba(113,113,122,0.14)', color: '#a1a1aa' },
    failed:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
    active:    { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
    error:     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  };
  const s = map[status] ?? map['pending'];
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace',
      padding: '2px 7px', borderRadius: 4,
      background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function QueueBar({ depth, max }: { depth: number; max: number }) {
  const pct = max > 0 ? Math.min(1, depth / max) : 0;
  const color = pct > 0.75 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function HealthCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: 16,
      flex: '1 1 0',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ? '#10b981' : '#f4f4f5', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#52525b', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

/* =========================================================================
   Main Component
   ========================================================================= */

export function AIWorkforcePanel() {
  const [dashboard, setDashboard]   = useState<AgentDashboard | null>(null);
  const [queues, setQueues]         = useState<QueuesResponse | null>(null);
  const [status, setStatus]         = useState<CockpitStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [dispatchType, setDispatchType]   = useState<DispatchType>('content_generation');
  const [dispatchInput, setDispatchInput] = useState('');
  const [dispatching, setDispatching]     = useState(false);
  const [dispatchMsg, setDispatchMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const dispatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [dash, q, st] = await Promise.all([
      apiFetch<AgentDashboard>('/api/agents/dashboard'),
      apiFetch<QueuesResponse>('/api/cockpit/queues'),
      apiFetch<CockpitStatus>('/api/cockpit/status'),
    ]);
    if (dash) setDashboard(dash);
    if (q)    setQueues(q);
    if (st)   setStatus(st);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // Derived counts from real data
  const counts = dashboard?.activeCounts ?? { total: 0, active: 0, idle: 0, busy: 0, error: 0, disabled: 0 };
  const totalWaiting = queues?.totalDepth ?? 0;
  const totalFailed  = queues?.totalFailed ?? 0;
  const workers      = status?.workers ?? { total: 0, online: 0 };
  const services     = status?.services ?? [];
  const overallStatus = status?.overall ?? 'all_operational';

  // Sort queues by depth desc, show top 10 non-zero first
  const sortedQueues = queues
    ? [...queues.queues].sort((a, b) => b.depth - a.depth)
    : [];
  const maxDepth = sortedQueues.length > 0 ? Math.max(1, sortedQueues[0].depth) : 1;

  const recentTasks = dashboard?.recentTasks ?? [];

  async function handleDispatch() {
    if (!dispatchInput.trim()) return;
    setDispatching(true);
    setDispatchMsg(null);
    const res = await apiPost('/api/admin/command-center/dispatch-task', {
      task:   dispatchInput.trim(),
      type:   dispatchType,
      priority: 'normal',
    });
    setDispatching(false);
    if (res.ok) {
      setDispatchMsg({ ok: true, text: 'Task dispatched to agent pool.' });
      setDispatchInput('');
      setTimeout(load, 2000);
    } else {
      setDispatchMsg({ ok: false, text: res.error || 'Dispatch failed. Check API connection.' });
    }
    if (dispatchTimer.current) clearTimeout(dispatchTimer.current);
    dispatchTimer.current = setTimeout(() => setDispatchMsg(null), 6000);
  }

  const overallDotStatus: 'active' | 'degraded' | 'error' =
    overallStatus === 'all_operational' ? 'active'
    : overallStatus === 'degraded'      ? 'degraded'
    : 'error';

  return (
    <>
      <style>{`
        @keyframes pulse-green {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70%  { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 20,
        padding: '20px 20px 28px', minHeight: 0,
        overflowY: 'auto', height: '100%', boxSizing: 'border-box',
      }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
              AI Workforce
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
              <StatusDot status={overallDotStatus} />
              <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace' }}>
                {overallStatus === 'all_operational' ? 'all systems operational'
                  : overallStatus === 'degraded'    ? 'degraded'
                  : 'systems down'}
              </span>
              {lastRefresh && (
                <>
                  <span style={{ color: '#3f3f46', fontSize: 10 }}>|</span>
                  <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: 'monospace' }}>
                    refreshed {timeAgo(lastRefresh.toISOString())}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={load}
              disabled={loading}
              title="Refresh now"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <IconRefresh spinning={loading} />
            </button>
            <a
              href="/admin/command-center"
              style={{
                fontSize: 12, color: '#10b981', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
                whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.25)',
                background: 'rgba(16,185,129,0.06)',
              }}
            >
              Command Center
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M2 8L8 2M8 2H4M8 2V6" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── System Health Cards ──────────────────────────────────────────── */}
        <div>
          <SectionHeader>System Health</SectionHeader>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <HealthCard
              icon={<IconAgents />}
              label="Active Agents"
              value={counts.active + counts.busy}
              sub={`${counts.idle} idle · ${counts.error} error · ${counts.total} total`}
              accent
            />
            <HealthCard
              icon={<IconQueue />}
              label="Jobs Queued"
              value={totalWaiting}
              sub={`${totalFailed} failed · ${queues?.totalQueues ?? 0} queues`}
            />
            <HealthCard
              icon={<IconWorkers />}
              label="Workers Online"
              value={workers.online}
              sub={`of ${workers.total} registered`}
              accent={workers.online > 0}
            />
            <HealthCard
              icon={<IconHealth />}
              label="Services Up"
              value={`${services.filter(s => s.status === 'up').length}/${services.length}`}
              sub={services.filter(s => s.status === 'down').map(s => s.name).join(', ') || 'all operational'}
            />
          </div>
        </div>

        {/* ── Agent Pool Status ────────────────────────────────────────────── */}
        <div>
          <SectionHeader>Agent Pool Status</SectionHeader>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Status breakdown row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Total',    value: counts.total,                  color: '#a1a1aa' },
                { label: 'Active',   value: counts.active,                 color: '#10b981' },
                { label: 'Busy',     value: counts.busy,                   color: '#60a5fa' },
                { label: 'Idle',     value: counts.idle,                   color: '#52525b' },
                { label: 'Error',    value: counts.error,                  color: '#f87171' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color, lineHeight: 1 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Status indicator bar */}
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {[
                { label: 'active',   color: '#10b981', count: counts.active  },
                { label: 'busy',     color: '#60a5fa', count: counts.busy    },
                { label: 'idle',     color: '#3f3f46', count: counts.idle    },
                { label: 'error',    color: '#ef4444', count: counts.error   },
                { label: 'disabled', color: '#27272a', count: counts.disabled },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
                    {s.count} {s.label}
                  </span>
                </div>
              ))}
              {counts.total === 0 && (
                <span style={{ fontSize: 12, color: '#3f3f46', fontFamily: 'monospace' }}>
                  no agents provisioned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Queue Depths ─────────────────────────────────────────────────── */}
        <div>
          <SectionHeader>Job Queue Depths</SectionHeader>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.4fr 60px 60px 60px 60px',
              gap: 8, padding: '8px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['Queue', 'Waiting', 'Active', 'Failed', 'Done'].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>

            {sortedQueues.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 12, color: '#3f3f46', fontFamily: 'monospace' }}>
                {loading ? 'loading queue data...' : 'no queue data available'}
              </div>
            )}

            {sortedQueues.map((q, idx) => (
              <div
                key={q.key}
                style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 60px 60px 60px 60px',
                  gap: 8, padding: '9px 16px', alignItems: 'center',
                  borderBottom: idx < sortedQueues.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                {/* Queue name + bar */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#d4d4d8', fontFamily: 'monospace', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.name.replace(/_queue$/, '')}
                  </div>
                  <QueueBar depth={q.depth} max={maxDepth} />
                </div>
                <div style={{ fontSize: 12, color: q.waiting > 0 ? '#f4f4f5' : '#52525b', fontFamily: 'monospace' }}>
                  {q.waiting}
                </div>
                <div style={{ fontSize: 12, color: q.active > 0 ? '#60a5fa' : '#52525b', fontFamily: 'monospace' }}>
                  {q.active}
                </div>
                <div style={{ fontSize: 12, color: q.failed > 0 ? '#f87171' : '#52525b', fontFamily: 'monospace' }}>
                  {q.failed}
                </div>
                <div style={{ fontSize: 12, color: '#52525b', fontFamily: 'monospace' }}>
                  {q.completed}
                </div>
              </div>
            ))}

            {/* Footer totals */}
            {queues && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1.4fr 60px 60px 60px 60px',
                gap: 8, padding: '8px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase' }}>
                  {queues.totalQueues} queues
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: queues.totalDepth > 0 ? '#a1a1aa' : '#52525b', fontWeight: 600 }}>
                  {queues.totalDepth}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b' }}>—</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: queues.totalFailed > 0 ? '#f87171' : '#52525b', fontWeight: 600 }}>
                  {queues.totalFailed}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b' }}>—</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Task Executions ───────────────────────────────────────── */}
        <div>
          <SectionHeader>Recent Job Executions</SectionHeader>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1fr 90px 70px',
              gap: 8, padding: '8px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['Task Type', 'Agent', 'Status', 'Time'].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>

            {recentTasks.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 12, color: '#3f3f46', fontFamily: 'monospace' }}>
                {loading ? 'loading task feed...' : 'no recent tasks'}
              </div>
            )}

            {recentTasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1.6fr 1fr 90px 70px',
                  gap: 8, padding: '9px 16px', alignItems: 'center',
                  borderBottom: idx < recentTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div style={{ fontSize: 12, color: '#d4d4d8', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.type || 'user_request'}
                </div>
                <div style={{ fontSize: 12, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.agent?.name || '—'}
                </div>
                <div>
                  <TaskStatusBadge status={task.status} />
                </div>
                <div style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
                  {timeAgo(task.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Service Health ───────────────────────────────────────────────── */}
        {services.length > 0 && (
          <div>
            <SectionHeader>External Services</SectionHeader>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              {services.map((svc, idx) => (
                <div
                  key={svc.name}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 16px',
                    borderBottom: idx < services.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <StatusDot status={svc.status === 'up' ? 'up' : 'down'} />
                    <span style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 500 }}>{svc.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
                      {svc.responseTimeMs}ms
                    </span>
                    {svc.error && (
                      <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'monospace' }}>
                        {svc.error}
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, fontFamily: 'monospace',
                      padding: '2px 7px', borderRadius: 4,
                      background: svc.status === 'up' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: svc.status === 'up' ? '#10b981' : '#f87171',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Dispatch Task ────────────────────────────────────────────────── */}
        <div>
          <SectionHeader>Dispatch Task</SectionHeader>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Job type select */}
              <select
                value={dispatchType}
                onChange={e => setDispatchType(e.target.value as DispatchType)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#d4d4d8',
                  fontSize: 12, fontFamily: 'monospace',
                  padding: '8px 10px', cursor: 'pointer',
                  outline: 'none', flexShrink: 0,
                }}
              >
                {DISPATCH_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#18181b' }}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Task description input */}
              <input
                type="text"
                value={dispatchInput}
                onChange={e => setDispatchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !dispatching) handleDispatch(); }}
                placeholder="Describe the task to dispatch..."
                style={{
                  flex: '1 1 180px', minWidth: 0,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#d4d4d8',
                  fontSize: 13, padding: '8px 12px', outline: 'none',
                }}
              />

              {/* Dispatch button */}
              <button
                onClick={handleDispatch}
                disabled={dispatching || !dispatchInput.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, flexShrink: 0,
                  border: '1px solid rgba(16,185,129,0.35)',
                  background: dispatching || !dispatchInput.trim()
                    ? 'rgba(16,185,129,0.05)'
                    : 'rgba(16,185,129,0.12)',
                  color: dispatching || !dispatchInput.trim() ? '#52525b' : '#10b981',
                  fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  cursor: dispatching || !dispatchInput.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <IconDispatch />
                {dispatching ? 'Dispatching...' : 'Dispatch'}
              </button>
            </div>

            {/* Feedback */}
            {dispatchMsg && (
              <div style={{
                marginTop: 10, fontSize: 12, fontFamily: 'monospace',
                color: dispatchMsg.ok ? '#10b981' : '#f87171',
                padding: '6px 10px', borderRadius: 6,
                background: dispatchMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${dispatchMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {dispatchMsg.text}
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 11, color: '#3f3f46', fontFamily: 'monospace' }}>
              Routes to /api/admin/command-center/dispatch-task — auto-classified by domain + layer
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
