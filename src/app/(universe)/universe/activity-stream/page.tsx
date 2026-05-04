'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/config';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface FeedEvent {
  id: string;
  domain: string;
  type: string;
  severity: string;
  message: string;
  handled: boolean;
  assignedAgentId: string | null;
  resolution: string | null;
  timestamp: string;
  resolvedAt: string | null;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error';

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Map event type/severity to a display badge */
function classifyBadge(event: FeedEvent): { label: string; color: string } {
  const t = event.type.toLowerCase();
  const s = event.severity.toLowerCase();

  if (s === 'critical' || s === 'error') return { label: 'ERROR', color: '#ff4444' };
  if (t.includes('heal') || t.includes('repair') || event.resolution) return { label: 'HEAL', color: '#00e5ff' };
  if (t.includes('deploy')) return { label: 'DEPLOY', color: '#ff9800' };
  if (t.includes('dispatch') || t.includes('assign')) return { label: 'DISPATCH', color: '#76ff03' };
  if (t.includes('queue') || t.includes('process')) return { label: 'QUEUE', color: '#7c4dff' };
  if (t.includes('complete') || t.includes('resolve') || event.handled) return { label: 'DONE', color: '#00e676' };
  if (s === 'warning') return { label: 'WARN', color: '#ffd600' };
  return { label: 'EVENT', color: '#4caf50' };
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function ActivityStreamPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [poolCount, setPoolCount] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [paused, setPaused] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // ── Fetch ──────────────────────────────────────────────────────────

  const fetchFeed = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/command-center/live-feed`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();

      if (json.success && json.data) {
        const incoming: FeedEvent[] = json.data.events ?? [];
        setTotalEvents(json.data.totalEvents ?? 0);
        setPoolCount(json.data.poolCount ?? 0);
        setStatus('connected');
        setLastPoll(new Date());

        setSeenIds((prev) => {
          const next = new Set(prev);
          const brandNew: FeedEvent[] = [];
          for (const ev of incoming) {
            if (!next.has(ev.id)) {
              next.add(ev.id);
              brandNew.push(ev);
            }
          }

          if (brandNew.length > 0) {
            setEvents((old) => {
              const merged = [...old, ...brandNew];
              // Keep last 500 entries in memory
              return merged.slice(-500);
            });
          }

          return next;
        });
      }
    } catch {
      setStatus('error');
    }
  }, []);

  // ── Polling ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(() => {
      if (!pausedRef.current) fetchFeed();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // ── Auto-scroll ────────────────────────────────────────────────────

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, paused]);

  // ── Render ─────────────────────────────────────────────────────────

  const statusDot =
    status === 'connected' ? '#00e676' : status === 'connecting' ? '#ffd600' : '#ff4444';

  return (
    <div
      style={{
        background: '#0a0a0a',
        color: '#33ff33',
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", monospace',
        fontSize: 13,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header Bar ──────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: '1px solid #1a3a1a',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#0d0d0d',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#00e676', letterSpacing: 2 }}>
            ACTIVITY STREAM
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusDot,
              display: 'inline-block',
              boxShadow: `0 0 6px ${statusDot}`,
              animation: status === 'connected' ? 'pulse 2s infinite' : undefined,
            }}
          />
          <span style={{ color: '#555', fontSize: 11 }}>
            {status === 'connected'
              ? 'LIVE'
              : status === 'connecting'
                ? 'CONNECTING...'
                : 'DISCONNECTED'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11, color: '#666' }}>
          <span>
            POOLS <span style={{ color: '#33ff33' }}>{poolCount}</span>
          </span>
          <span>
            TOTAL <span style={{ color: '#33ff33' }}>{totalEvents}</span>
          </span>
          <span>
            BUFFER <span style={{ color: '#33ff33' }}>{events.length}</span>
          </span>
          {lastPoll && (
            <span>
              LAST POLL <span style={{ color: '#33ff33' }}>{formatTime(lastPoll.toISOString())}</span>
            </span>
          )}
          <button
            onClick={() => setPaused((p) => !p)}
            style={{
              background: paused ? '#331a00' : '#0a1a0a',
              border: `1px solid ${paused ? '#ff9800' : '#1a3a1a'}`,
              color: paused ? '#ff9800' : '#33ff33',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            {paused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* ── Column Headers ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '6px 20px',
          borderBottom: '1px solid #1a3a1a',
          color: '#444',
          fontSize: 10,
          letterSpacing: 2,
          display: 'grid',
          gridTemplateColumns: '90px 80px 100px 1fr 140px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span>TIMESTAMP</span>
        <span>TYPE</span>
        <span>DOMAIN</span>
        <span>MESSAGE</span>
        <span>STATUS</span>
      </div>

      {/* ── Stream Body ─────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {events.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#333' }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Waiting for events...</div>
            <div style={{ fontSize: 11 }}>Polling /api/admin/command-center/live-feed every 3s</div>
          </div>
        )}

        {events.map((ev, i) => {
          const badge = classifyBadge(ev);
          const isNew = i >= events.length - 5;

          return (
            <div
              key={ev.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 80px 100px 1fr 140px',
                gap: 12,
                padding: '3px 20px',
                borderBottom: '1px solid #111',
                opacity: isNew ? 1 : 0.7,
                animation: isNew ? 'fadeIn 0.3s ease-out' : undefined,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Timestamp */}
              <span style={{ color: '#555' }}>{formatTime(ev.timestamp)}</span>

              {/* Type Badge */}
              <span
                style={{
                  color: '#0a0a0a',
                  background: badge.color,
                  padding: '1px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  display: 'inline-block',
                  textAlign: 'center',
                  lineHeight: '18px',
                  maxWidth: 72,
                }}
              >
                {badge.label}
              </span>

              {/* Domain */}
              <span style={{ color: '#888', textTransform: 'uppercase', fontSize: 11 }}>
                {ev.domain}
              </span>

              {/* Message */}
              <span
                style={{
                  color: ev.severity === 'critical' || ev.severity === 'error' ? '#ff4444' : '#33ff33',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {ev.message}
                {ev.resolution && (
                  <span style={{ color: '#00e5ff', marginLeft: 8 }}>
                    {' '}
                    &rarr; {ev.resolution}
                  </span>
                )}
              </span>

              {/* Status */}
              <span style={{ color: ev.handled ? '#00e676' : '#ffd600', fontSize: 11 }}>
                {ev.handled ? 'HANDLED' : 'PENDING'}
                {ev.assignedAgentId && (
                  <span style={{ color: '#555', marginLeft: 6 }}>
                    [{ev.assignedAgentId.slice(0, 8)}]
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #1a3a1a',
          padding: '6px 20px',
          fontSize: 10,
          color: '#333',
          display: 'flex',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span>MEMELLI UNIVERSE ACTIVITY STREAM v1.0</span>
        <span>
          {paused && (
            <span style={{ color: '#ff9800', marginRight: 12 }}>PAUSED</span>
          )}
          POLL INTERVAL 3000ms
        </span>
      </div>

      {/* ── Animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        div::-webkit-scrollbar-thumb {
          background: #1a3a1a;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #2a5a2a;
        }
      `}</style>
    </div>
  );
}
