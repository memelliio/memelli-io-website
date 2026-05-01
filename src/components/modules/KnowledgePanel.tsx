'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function authHeader(): Record<string, string> {
  const token =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token'))) ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================================================================
   Types — real API response shapes
   ========================================================================= */

interface SearchResult {
  found: boolean;
  topic?: string;
  answer?: string;
  source?: string;
  accessCount?: number;
}

interface TopicEntry {
  topic: string;
  count?: number;
  entryCount?: number;
  source?: string;
  lastAccessed?: string;
  updatedAt?: string;
}

interface KnowledgeStats {
  totalEntries?: number;
  total?: number;
  totalTopics?: number;
  topics?: number;
  topSources?: Array<{ source: string; count: number }>;
  sources?: Record<string, number>;
  mostAccessed?: Array<{ topic: string; accessCount: number }>;
  recentEntries?: number;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* =========================================================================
   Sub-components
   ========================================================================= */

function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: '#dc2626',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: '0 0 14px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
      }}
    >
      {children}
    </h3>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          background: 'linear-gradient(90deg, #dc2626, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

/* =========================================================================
   Search section
   ========================================================================= */

function SearchSection() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query.trim(), 400);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResult(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `${API}/api/knowledge/search?q=${encodeURIComponent(debouncedQuery)}`,
      { headers: authHeader() }
    )
      .then(r => r.json())
      .then(json => {
        if (!json.success) {
          setError(json.error ?? 'Search failed');
          setResult(null);
        } else {
          setResult(json.data ?? null);
        }
      })
      .catch(() => setError('Request failed'))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle>Search knowledge base</SectionTitle>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search topics, answers..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '11px 42px 11px 14px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(220,38,38,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          {loading ? (
            <Spinner />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
        {query && (
          <button
            onClick={() => { setQuery(''); setResult(null); setError(null); inputRef.current?.focus(); }}
            style={{
              position: 'absolute',
              right: 38,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            x
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {result && !loading && !error && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${result.found ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          {result.found ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {result.topic}
                </div>
                {result.source && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#f97316',
                      background: 'rgba(249,115,22,0.12)',
                      border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: 4,
                      padding: '2px 7px',
                    }}
                  >
                    {result.source}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.65)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result.answer}
              </p>
              {result.accessCount !== undefined && (
                <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                  Accessed {result.accessCount} times
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '4px 0' }}>
              No knowledge found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Topics section
   ========================================================================= */

function TopicsSection() {
  const [topics, setTopics] = useState<TopicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/knowledge/topics`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        const raw = json.data ?? json.topics ?? [];
        // Normalize various shapes the API might return
        const normalized: TopicEntry[] = Array.isArray(raw)
          ? raw.map((t: any) =>
              typeof t === 'string'
                ? { topic: t }
                : {
                    topic: t.topic ?? t.name ?? t.title ?? String(t),
                    count: t.count ?? t.entryCount ?? t.entries ?? undefined,
                    source: t.source ?? undefined,
                    lastAccessed: t.lastAccessed ?? t.updatedAt ?? undefined,
                  }
            )
          : [];
        setTopics(normalized);
      })
      .catch(() => setError('Failed to load topics'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterText.trim()
    ? topics.filter(t => t.topic.toLowerCase().includes(filterText.toLowerCase()))
    : topics;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle>Stored topics ({topics.length})</SectionTitle>

      {!loading && !error && topics.length > 6 && (
        <input
          type="text"
          placeholder="Filter topics..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            outline: 'none',
          }}
        />
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner />
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>
          {topics.length === 0 ? 'No topics stored yet' : 'No topics match filter'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((t, i) => (
            <div
              key={`${t.topic}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 8,
                transition: 'background 0.12s, border-color 0.12s',
                cursor: 'default',
                gap: 8,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'rgba(255,255,255,0.06)';
                el.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
                el.style.borderColor = 'transparent';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.topic}
                </div>
                {t.source && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{t.source}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {t.count !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#f97316',
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.2)',
                      borderRadius: 4,
                      padding: '2px 7px',
                    }}
                  >
                    {t.count} {t.count === 1 ? 'entry' : 'entries'}
                  </span>
                )}
                {t.lastAccessed && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                    {new Date(t.lastAccessed).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Stats section
   ========================================================================= */

function StatsSection() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/knowledge/stats`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        setStats(json.data ?? json.stats ?? json ?? null);
      })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <SectionTitle>Stats</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <SectionTitle>Stats</SectionTitle>
        <div
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: '#f87171',
          }}
        >
          {error ?? 'No stats available'}
        </div>
      </div>
    );
  }

  const totalEntries = stats.totalEntries ?? stats.total ?? 0;
  const totalTopics = stats.totalTopics ?? stats.topics ?? 0;

  // Normalize top sources from either array or object form
  const topSources: Array<{ source: string; count: number }> = stats.topSources
    ? stats.topSources
    : stats.sources
    ? Object.entries(stats.sources)
        .map(([source, count]) => ({ source, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : [];

  const mostAccessed = stats.mostAccessed?.slice(0, 5) ?? [];

  return (
    <div>
      <SectionTitle>Stats</SectionTitle>

      {/* Primary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <StatCard label="Total entries" value={totalEntries.toLocaleString()} />
        <StatCard label="Topics" value={totalTopics.toLocaleString()} />
        {stats.recentEntries !== undefined && (
          <StatCard label="Recent entries" value={stats.recentEntries.toLocaleString()} sub="Last 30 days" />
        )}
      </div>

      {/* Top sources */}
      {topSources.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              marginBottom: 8,
            }}
          >
            Top sources
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topSources.map(s => {
              const pct = totalEntries > 0 ? Math.round((s.count / totalEntries) * 100) : 0;
              return (
                <div key={s.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{s.source}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.count.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(pct, 2)}%`,
                        background: 'linear-gradient(90deg, #dc2626, #f97316)',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most accessed */}
      {mostAccessed.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              marginBottom: 8,
            }}
          >
            Most accessed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mostAccessed.map((m, i) => (
              <div
                key={m.topic}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 7,
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: i === 0 ? '#f97316' : 'rgba(255,255,255,0.25)',
                      width: 14,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.topic}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }}
                >
                  {m.accessCount.toLocaleString()} hits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Main component
   ========================================================================= */

export function KnowledgePanel() {
  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        minHeight: '100%',
        padding: '24px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: 'rgba(255,255,255,0.85)',
        boxSizing: 'border-box',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 18,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #dc2626, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Knowledge Library
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          AI-powered knowledge base — search topics, browse entries, and view system intelligence stats
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

      <SearchSection />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

      <TopicsSection />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

      <StatsSection />
    </div>
  );
}
