'use client';

import { useEffect, useState, useCallback } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
const PER_PAGE = 25;

/* =========================================================================
   Types — real /api/activities response shapes
   ========================================================================= */

type ActivityType =
  | 'NOTE'
  | 'EMAIL'
  | 'SMS'
  | 'CALL'
  | 'MEETING'
  | 'TASK'
  | 'SYSTEM'
  | 'SEO_LEAD'
  | 'PURCHASE'
  | 'LESSON_COMPLETED'
  | 'DEAL_STAGE_CHANGE'
  | 'ENROLLMENT_CREATED'
  | 'ORDER_PAID'
  | 'TASK_CREATED'
  | 'NOTIFICATION_SENT';

interface ActivityContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  companyName: string | null;
}

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subject?: string | null;
  body?: string | null;
  occurredAt: string;
  contactId?: string | null;
  contact?: ActivityContact | null;
  metadata?: Record<string, unknown>;
}

interface ActivitiesResponse {
  success: boolean;
  data: Activity[];
}

/* =========================================================================
   Filter options — all types from the Zod schema in activities.ts
   ========================================================================= */

const ALL_TYPES: ActivityType[] = [
  'NOTE',
  'EMAIL',
  'SMS',
  'CALL',
  'MEETING',
  'TASK',
  'SYSTEM',
  'SEO_LEAD',
  'PURCHASE',
  'LESSON_COMPLETED',
  'DEAL_STAGE_CHANGE',
  'ENROLLMENT_CREATED',
  'ORDER_PAID',
  'TASK_CREATED',
  'NOTIFICATION_SENT',
];

/* =========================================================================
   Helpers
   ========================================================================= */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    null
  );
}

async function fetchActivities(
  page: number,
  type: ActivityType | 'ALL',
): Promise<Activity[]> {
  try {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(PER_PAGE),
    });
    if (type !== 'ALL') params.set('type', type);

    const res = await fetch(`${API}/api/activities?${params.toString()}`, { headers });
    if (!res.ok) return [];
    const json: ActivitiesResponse = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffS = Math.floor(diffMs / 1000);

    if (diffS < 60) return 'just now';
    if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
    if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
    if (diffS < 86400 * 7) return `${Math.floor(diffS / 86400)}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '--';
  }
}

function fmtFull(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function contactName(contact?: ActivityContact | null): string | null {
  if (!contact) return null;
  const parts = [contact.firstName, contact.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (contact.email) return contact.email;
  if (contact.companyName) return contact.companyName;
  return null;
}

/* =========================================================================
   Type metadata — color + label (no emojis)
   ========================================================================= */

const TYPE_META: Record<ActivityType, { color: string; label: string }> = {
  NOTE:               { color: '#a3a3a3', label: 'Note' },
  EMAIL:              { color: '#3b82f6', label: 'Email' },
  SMS:                { color: '#22c55e', label: 'SMS' },
  CALL:               { color: '#f59e0b', label: 'Call' },
  MEETING:            { color: '#8b5cf6', label: 'Meeting' },
  TASK:               { color: '#06b6d4', label: 'Task' },
  SYSTEM:             { color: '#6b7280', label: 'System' },
  SEO_LEAD:           { color: '#f97316', label: 'SEO Lead' },
  PURCHASE:           { color: '#22c55e', label: 'Purchase' },
  LESSON_COMPLETED:   { color: '#8b5cf6', label: 'Lesson' },
  DEAL_STAGE_CHANGE:  { color: '#f97316', label: 'Deal' },
  ENROLLMENT_CREATED: { color: '#3b82f6', label: 'Enrollment' },
  ORDER_PAID:         { color: '#22c55e', label: 'Order Paid' },
  TASK_CREATED:       { color: '#06b6d4', label: 'Task Created' },
  NOTIFICATION_SENT:  { color: '#a3a3a3', label: 'Notification' },
};

function getTypeMeta(type: ActivityType) {
  return TYPE_META[type] ?? { color: '#71717a', label: type };
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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      className={`rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

function TypeBadge({ type }: { type: ActivityType }) {
  const meta = getTypeMeta(type);
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 leading-none"
      style={{
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {meta.label}
    </span>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  const name = contactName(activity.contact);

  return (
    <div
      className="border-b last:border-b-0 cursor-pointer"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Type indicator line */}
        <div
          className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5"
          style={{
            background: getTypeMeta(activity.type).color,
            minHeight: 14,
          }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <TypeBadge type={activity.type} />
            <span className="text-xs text-zinc-200 font-medium truncate flex-1">
              {activity.title}
            </span>
          </div>

          {name && (
            <p className="text-[11px] font-mono text-zinc-500 truncate">{name}</p>
          )}

          {expanded && activity.body && (
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed whitespace-pre-wrap break-words">
              {activity.body}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span
          className="text-[10px] font-mono text-zinc-600 shrink-0 mt-0.5"
          title={fmtFull(activity.occurredAt)}
        >
          {fmtDate(activity.occurredAt)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
      </div>
      <p className="text-xs font-mono text-zinc-600">
        {filtered ? 'No activities of this type' : 'No activities yet'}
      </p>
    </div>
  );
}

/* =========================================================================
   Main Component
   ========================================================================= */

export function ActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const load = useCallback(
    async (p: number, t: ActivityType | 'ALL', reset: boolean) => {
      setLoading(true);
      setError(false);

      const results = await fetchActivities(p, t);

      if (results === null) {
        setError(true);
        setLoading(false);
        return;
      }

      setActivities((prev) => (reset ? results : [...prev, ...results]));
      setHasMore(results.length === PER_PAGE);
      setLoading(false);
    },
    [],
  );

  // Initial load + filter change
  useEffect(() => {
    setPage(1);
    setActivities([]);
    load(1, typeFilter, true);
  }, [typeFilter, load]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, typeFilter, false);
  }

  function handleTypeSelect(t: ActivityType | 'ALL') {
    setTypeFilter(t);
    setShowTypeMenu(false);
  }

  const filterLabel =
    typeFilter === 'ALL' ? 'All Types' : getTypeMeta(typeFilter).label;

  return (
    <div
      className="flex flex-col h-full w-full text-zinc-100"
      style={{ background: 'rgba(10,10,10,0.97)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Activities
          </span>
          {loading && (
            <span className="text-[10px] font-mono text-zinc-600 animate-pulse">
              loading...
            </span>
          )}
          {error && !loading && (
            <span className="text-[10px] font-mono text-red-600">API unreachable</span>
          )}
        </div>

        {/* Type filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu((v) => !v)}
            className="flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: typeFilter === 'ALL' ? '#71717a' : getTypeMeta(typeFilter as ActivityType).color,
            }}
          >
            {filterLabel}
            <span
              className="inline-block transition-transform"
              style={{
                transform: showTypeMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                fontSize: 8,
                color: '#52525b',
              }}
            >
              v
            </span>
          </button>

          {showTypeMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50 py-1"
              style={{
                background: 'rgba(18,18,18,0.98)',
                border: '1px solid rgba(255,255,255,0.10)',
                minWidth: 160,
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              }}
            >
              <button
                key="ALL"
                onClick={() => handleTypeSelect('ALL')}
                className="w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors hover:bg-white/5"
                style={{ color: typeFilter === 'ALL' ? '#fff' : '#71717a' }}
              >
                All Types
              </button>
              {ALL_TYPES.map((t) => {
                const meta = getTypeMeta(t);
                return (
                  <button
                    key={t}
                    onClick={() => handleTypeSelect(t)}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors hover:bg-white/5 flex items-center gap-2"
                    style={{ color: typeFilter === t ? '#fff' : '#71717a' }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      {activities.length > 0 && (
        <div
          className="flex items-center gap-4 px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
        >
          <span className="text-[10px] font-mono text-zinc-600">
            Showing {activities.length} {typeFilter !== 'ALL' ? getTypeMeta(typeFilter).label : ''} activities
          </span>
        </div>
      )}

      {/* ── Feed ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Close type menu on background click */}
        {showTypeMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTypeMenu(false)}
          />
        )}

        {!loading && activities.length === 0 ? (
          <EmptyState filtered={typeFilter !== 'ALL'} />
        ) : (
          <div className="px-4 py-4">
            <SectionHeader>
              {typeFilter === 'ALL' ? 'All Activity' : getTypeMeta(typeFilter).label}
              {activities.length > 0 && (
                <span className="ml-1 text-zinc-600">— {activities.length} loaded</span>
              )}
            </SectionHeader>

            <Card>
              {activities.map((a) => (
                <ActivityRow key={a.id} activity={a} />
              ))}

              {/* Loading skeleton rows */}
              {loading && activities.length === 0 && (
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 animate-pulse"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="w-0.5 h-10 rounded-full shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className="h-3 rounded w-1/3"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        />
                        <div
                          className="h-2.5 rounded w-2/3"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        />
                      </div>
                      <div
                        className="h-2.5 w-10 rounded shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                    </div>
                  ))}
                </>
              )}

              {loading && activities.length > 0 && (
                <div className="px-4 py-3 text-center">
                  <span className="text-[10px] font-mono text-zinc-600 animate-pulse">
                    loading more...
                  </span>
                </div>
              )}
            </Card>

            {/* Load more */}
            {!loading && hasMore && activities.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="text-xs font-mono px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#71717a',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#a3a3a3';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#71717a';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  Load more
                </button>
              </div>
            )}

            {!loading && !hasMore && activities.length > 0 && (
              <p className="text-center text-[10px] font-mono text-zinc-700 mt-4">
                All activities loaded
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
