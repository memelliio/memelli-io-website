'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token')
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: {
    type?: string;
    link?: string;
  };
  createdAt: string;
  updatedAt: string;
}

type FilterMode = 'all' | 'unread' | 'read';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtRelative(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTypeLabel(n: Notification): string {
  const t = n.metadata?.type || n.channel || 'SYSTEM';
  return t.toUpperCase().replace(/_/g, ' ');
}

const TYPE_COLOR_MAP: Record<string, string> = {
  SYSTEM: '#dc2626',
  IN_APP: '#f97316',
  AI: '#a855f7',
  BILLING: '#eab308',
  CRM: '#22c55e',
  COMMERCE: '#06b6d4',
  COACHING: '#3b82f6',
  SEO: '#f472b6',
};

function typeColor(type: string): string {
  const key = (type || 'SYSTEM').split(' ')[0];
  return TYPE_COLOR_MAP[key] ?? '#6b7280';
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Inline SVG Icons (no external deps)                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IconBell({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconCheck({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCheckAll({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 6 7 17 2 12" />
      <polyline points="22 6 13 15" />
    </svg>
  );
}

function IconTrash({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconRefresh({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconExternalLink({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Skeleton                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="w-2 h-2 rounded-full bg-white/[0.08] animate-pulse mt-1.5 shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2.5 rounded bg-white/[0.06] animate-pulse w-1/3" />
            <div className="h-2 rounded bg-white/[0.04] animate-pulse w-4/5" />
            <div className="h-2 rounded bg-white/[0.03] animate-pulse w-1/4 mt-0.5" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Notification Row                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  markingRead: boolean;
  deleting: boolean;
}

function NotificationRow({ notification: n, onMarkRead, onDelete, markingRead, deleting }: NotificationRowProps) {
  const typeLabel = getTypeLabel(n);
  const color = typeColor(typeLabel);
  const link = n.metadata?.link;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-colors group relative"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: n.isRead ? 'transparent' : 'rgba(220,38,38,0.03)',
      }}
    >
      {/* Unread dot */}
      <div
        className="mt-1.5 shrink-0 w-2 h-2 rounded-full transition-all"
        style={{
          background: n.isRead ? 'rgba(255,255,255,0.1)' : color,
          boxShadow: n.isRead ? 'none' : `0 0 6px ${color}55`,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type badge + timestamp */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="inline-flex items-center rounded-full text-[9px] font-mono font-semibold px-1.5 py-0.5 tracking-wider uppercase"
            style={{
              color,
              background: `${color}18`,
              border: `1px solid ${color}30`,
            }}
          >
            {typeLabel}
          </span>
          <span className="text-[10px] font-mono text-zinc-600">{fmtRelative(n.createdAt)}</span>
        </div>

        {/* Title */}
        <p className={`text-[12px] font-semibold leading-tight mb-0.5 ${n.isRead ? 'text-zinc-400' : 'text-zinc-100'}`}>
          {n.title}
        </p>

        {/* Body */}
        {n.body && (
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{n.body}</p>
        )}

        {/* Link */}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono transition-colors"
            style={{ color }}
          >
            View <IconExternalLink size={10} color={color} />
          </a>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.isRead && (
          <button
            onClick={() => onMarkRead(n.id)}
            disabled={markingRead}
            title="Mark as read"
            className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#22c55e',
            }}
          >
            <IconCheck size={11} color="#22c55e" />
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          disabled={deleting}
          title="Delete"
          className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-40"
          style={{
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.15)',
            color: '#dc2626',
          }}
        >
          <IconTrash size={11} color="#dc2626" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [page, setPage] = useState(1);

  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const perPage = 25;

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (filter === 'unread') params.set('isRead', 'false');
      if (filter === 'read') params.set('isRead', 'true');

      const res = await fetch(`${API}/api/notifications?${params}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const data: Notification[] = json.data ?? [];
      setNotifications(data);
      setTotal(json.meta?.total ?? data.length);
    } catch (e: any) {
      setLoadError(e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // ── Fetch unread count (badge) ───────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications/count`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(json.data?.count ?? 0);
    } catch {
      // silent — badge is non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // ── Mark single as read ──────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (id: string) => {
    setMarkingReadId(id);
    try {
      const res = await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    } finally {
      setMarkingReadId(null);
    }
  }, []);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(`${API}/api/notifications/read-all`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }, []);

  // ── Delete notification ──────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }, [notifications]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  const FILTERS: { label: string; value: FilterMode }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Read', value: 'read' },
  ];

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: 'rgba(10,10,10,0.97)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex flex-col gap-3 px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #f97316)',
              }}
            >
              <IconBell size={14} color="#fff" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-zinc-100 text-base font-semibold tracking-tight">Notifications</h2>
              {unreadCount > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full text-[10px] font-mono font-bold min-w-[20px] h-[18px] px-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #f97316)',
                    color: '#fff',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchNotifications}
              title="Refresh"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <IconRefresh size={13} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e',
                }}
              >
                <IconCheckAll size={12} color="#22c55e" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all"
              style={
                filter === f.value
                  ? {
                      background: 'linear-gradient(135deg, rgba(220,38,38,0.25), rgba(249,115,22,0.25))',
                      color: '#f97316',
                      border: '1px solid rgba(249,115,22,0.3)',
                    }
                  : { color: '#71717a', border: '1px solid transparent' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <SkeletonRows count={7} />
        ) : loadError ? (
          <div className="flex flex-col items-center gap-2 py-12 px-4">
            <p className="text-[11px] text-red-400 font-mono text-center">{loadError}</p>
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <IconRefresh size={12} /> Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 px-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <IconBell size={18} color="#3f3f46" />
            </div>
            <p className="text-[12px] text-zinc-600 font-mono text-center">
              {filter === 'unread'
                ? 'No unread notifications'
                : filter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              markingRead={markingReadId === n.id}
              deleting={deletingId === n.id}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && !loadError && total > perPage && (
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-[10px] font-mono text-zinc-600">
            {showingFrom}–{showingTo} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[10px] font-mono text-zinc-600 px-1.5">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
