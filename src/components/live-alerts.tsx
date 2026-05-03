'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  Rocket,
  CheckCircle,
  Wrench,
  AlertTriangle,
  XCircle,
  Shield,
  BarChart3,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

type AlertCategory = 'DEPLOY' | 'COMPLETE' | 'FIX' | 'WARNING' | 'ERROR' | 'HEAL' | 'METRIC' | 'NEW';

interface LiveAlert {
  id: string;
  category: AlertCategory;
  title: string;
  description: string;
  link?: string;
  timestamp: number;
  read: boolean;
}

/* ─────────────────────────── Category Config ─────────────────────────── */

const CATEGORY_CONFIG: Record<AlertCategory, { icon: typeof Bell; color: string; bg: string; border: string; glow: string }> = {
  DEPLOY:   { icon: Rocket,        color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/20',  glow: 'shadow-blue-500/10' },
  COMPLETE: { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  FIX:      { icon: Wrench,        color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
  WARNING:  { icon: AlertTriangle, color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/20', glow: 'shadow-yellow-500/10' },
  ERROR:    { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/20',   glow: 'shadow-red-500/10' },
  HEAL:     { icon: Shield,        color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    border: 'border-cyan-500/20',  glow: 'shadow-cyan-500/10' },
  METRIC:   { icon: BarChart3,     color: 'text-primary',  bg: 'bg-primary/80/15',  border: 'border-primary/20', glow: 'shadow-purple-500/10' },
  NEW:      { icon: Sparkles,      color: 'text-pink-400',    bg: 'bg-pink-500/15',    border: 'border-pink-500/20',  glow: 'shadow-pink-500/10' },
};

/* ─────────────────────────── Demo Seed Data ─────────────────────────── */

const now = Date.now();
const m = (mins: number) => now - mins * 60_000;

const DEMO_ALERTS: LiveAlert[] = [
  { id: 'demo-1',  category: 'DEPLOY',   title: 'Marketing Ebook is LIVE',       description: '9-chapter animated ebook deployed to /universe/marketing-ebook',   link: '/universe/marketing-ebook',    timestamp: m(1),  read: false },
  { id: 'demo-2',  category: 'DEPLOY',   title: 'Power Slides is LIVE',          description: 'Interactive slide deck deployed to /universe/power-slides',         link: '/universe/power-slides',       timestamp: m(2),  read: false },
  { id: 'demo-3',  category: 'DEPLOY',   title: 'Factory Live View is LIVE',     description: 'Agent factory dashboard deployed to /universe/factory',             link: '/universe/factory',            timestamp: m(3),  read: false },
  { id: 'demo-4',  category: 'DEPLOY',   title: 'Terminal Workspace is LIVE',    description: 'Dev terminal workspace deployed to /universe/terminal-workspace',   link: '/universe/terminal-workspace', timestamp: m(5),  read: false },
  { id: 'demo-5',  category: 'DEPLOY',   title: 'Session Stats is LIVE',         description: 'Session statistics page deployed to /universe/session-stats',       link: '/universe/session-stats',      timestamp: m(6),  read: false },
  { id: 'demo-6',  category: 'DEPLOY',   title: 'Performance Page is LIVE',      description: 'Performance dashboard deployed to /performance',                   link: '/performance',                 timestamp: m(8),  read: false },
  { id: 'demo-7',  category: 'DEPLOY',   title: 'Brochure is LIVE',              description: 'Company brochure deployed to /brochure',                            link: '/brochure',                    timestamp: m(10), read: false },
  { id: 'demo-8',  category: 'DEPLOY',   title: 'Claude Partnership is LIVE',    description: 'Partnership page deployed to /claude-partnership',                  link: '/claude-partnership',          timestamp: m(12), read: false },
  { id: 'demo-9',  category: 'DEPLOY',   title: 'Pitch Deck is LIVE',            description: 'Investor pitch deck deployed to /pitch',                            link: '/pitch',                       timestamp: m(14), read: false },
  { id: 'demo-10', category: 'FIX',      title: 'MUA Chat Fixed',                description: 'Chat interface repaired in command center',                         link: '/universe/command-center',     timestamp: m(4),  read: false },
  { id: 'demo-11', category: 'FIX',      title: 'Orb Visibility Fixed',          description: 'Floating orb rendering issue resolved',                             link: '/',                            timestamp: m(7),  read: false },
  { id: 'demo-12', category: 'FIX',      title: 'Deploy Bridge Wired',           description: 'Deploy pipeline bridge connected and validated',                    link: '/universe/deploy',             timestamp: m(9),  read: false },
  { id: 'demo-13', category: 'NEW',      title: 'TypeScript Checker Active',     description: 'Real-time TypeScript validation agent activated',                   link: '/universe/deploy',             timestamp: m(11), read: false },
  { id: 'demo-14', category: 'NEW',      title: 'Claude Globe + Hey Claude',     description: 'Interactive globe and wake word system deployed',                   link: '/universe/terminal-workspace', timestamp: m(13), read: false },
  { id: 'demo-15', category: 'COMPLETE', title: 'System Guide Upgraded',         description: 'System guide documentation fully upgraded',                         link: '/universe/guide',              timestamp: m(15), read: false },
  { id: 'demo-16', category: 'COMPLETE', title: 'Cockpit Map Upgraded',          description: 'Cockpit map topology view upgraded',                                link: '/universe/map',                timestamp: m(16), read: false },
  { id: 'demo-17', category: 'COMPLETE', title: 'Melli Follower Upgraded',     description: 'Melli follower monitor fully upgraded',                            link: '/universe/jessica-follower',   timestamp: m(17), read: false },
];

/* ─────────────────────────── Global Event Emitter ─────────────────────────── */

type AlertListener = (alert: LiveAlert) => void;
const listeners = new Set<AlertListener>();

export function emitAlert(alert: Omit<LiveAlert, 'id' | 'timestamp' | 'read'>) {
  const full: LiveAlert = {
    ...alert,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    read: false,
  };
  listeners.forEach((fn) => fn(full));
}

/* ─────────────────────────── Relative Time ─────────────────────────── */

function relativeTime(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─────────────────────────── Read State (localStorage) ─────────────────────────── */

const STORAGE_KEY = 'memelli_alerts_read';

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch { /* noop */ }
}

/* ─────────────────────────── Component ─────────────────────────── */

const AUTO_DISMISS_MS = 30_000;

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const readIdsRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Initialize with demo data + localStorage read state ── */
  useEffect(() => {
    const readIds = getReadIds();
    readIdsRef.current = readIds;
    const seeded = DEMO_ALERTS.map((a) => ({ ...a, read: readIds.has(a.id) }));
    setAlerts(seeded);
  }, []);

  /* ── Global event listener ── */
  useEffect(() => {
    const handler: AlertListener = (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  /* ── Poll /api/admin/alerts every 10s ── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/admin/alerts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.alerts)) {
            const readIds = readIdsRef.current;
            setAlerts((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const newAlerts: LiveAlert[] = data.alerts
                .filter((a: LiveAlert) => !existingIds.has(a.id))
                .map((a: LiveAlert) => ({ ...a, read: readIds.has(a.id) }));
              return newAlerts.length > 0 ? [...newAlerts, ...prev] : prev;
            });
          }
        }
      } catch {
        /* API not available — use demo data */
      }
    };
    pollRef.current = setInterval(poll, 10_000);
    poll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* ── Auto-dismiss unread alerts after 30s ── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    alerts.forEach((a) => {
      if (!a.read) {
        const age = Date.now() - a.timestamp;
        const remaining = AUTO_DISMISS_MS - age;
        if (remaining > 0) {
          timers.push(setTimeout(() => markRead(a.id), remaining));
        }
      }
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  /* ── Actions ── */
  const markRead = useCallback((id: string) => {
    readIdsRef.current.add(id);
    persistReadIds(readIdsRef.current);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => {
      prev.forEach((a) => readIdsRef.current.add(a.id));
      persistReadIds(readIdsRef.current);
      return prev.map((a) => ({ ...a, read: true }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  /* ── Derived ── */
  const unreadCount = alerts.filter((a) => !a.read).length;
  const sortedAlerts = [...alerts].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      {/* ═══════════════════════ Bell Toggle Button ═══════════════════════ */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-3 right-4 z-[60] flex items-center justify-center h-11 w-11 md:h-10 md:w-10 rounded-xl bg-zinc-900/90 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group safe-area-right"
        title="Live Alerts"
      >
        <Bell className={`h-4.5 w-4.5 transition-colors duration-200 ${open ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ═══════════════════════ Alert Panel ═══════════════════════ */}
      {open && (
        <div className="fixed top-14 right-2 md:right-4 z-[59] w-[380px] max-w-[calc(100vw-1rem)] flex flex-col max-h-[calc(100dvh-5rem)] rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-zinc-400" />
              <span className="text-[13px] font-semibold text-zinc-200">Live Alerts</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors duration-150"
                title="Mark all read"
              >
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">Read all</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors duration-150"
                title="Clear all"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center h-8 w-8 md:h-6 md:w-6 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors duration-150"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto">
            {sortedAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-[13px]">No alerts</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {sortedAlerts.map((alert) => {
                  const cfg = CATEGORY_CONFIG[alert.category];
                  const Icon = cfg.icon;
                  const isDismissing = dismissing.has(alert.id);

                  return (
                    <div
                      key={alert.id}
                      className={`relative rounded-xl border p-3 transition-all duration-200 ${
                        isDismissing
                          ? 'translate-x-[120%] opacity-0'
                          : 'translate-x-0 opacity-100'
                      } ${
                        alert.read
                          ? 'bg-zinc-900/40 border-white/[0.03]'
                          : `bg-zinc-900/70 ${cfg.border} shadow-lg ${cfg.glow}`
                      }`}
                      style={{ animationFillMode: 'forwards' }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category Icon */}
                        <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${cfg.bg}`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                              {alert.category}
                            </span>
                            {!alert.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                          <p className={`text-[13px] font-medium leading-tight ${alert.read ? 'text-zinc-500' : 'text-zinc-200'}`}>
                            {alert.title}
                          </p>
                          <p className={`text-[11px] leading-snug mt-0.5 ${alert.read ? 'text-zinc-600' : 'text-zinc-500'}`}>
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-zinc-600">
                              {relativeTime(alert.timestamp)}
                            </span>
                            {alert.link && (
                              <Link
                                href={alert.link}
                                onClick={() => markRead(alert.id)}
                                className={`text-[10px] font-medium hover:underline ${cfg.color}`}
                              >
                                View &rarr;
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Dismiss */}
                        <button
                          onClick={() => dismiss(alert.id)}
                          className="flex items-center justify-center h-8 w-8 md:h-5 md:w-5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors duration-150 shrink-0"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4 md:h-3 md:w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
