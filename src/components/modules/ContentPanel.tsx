'use client';

import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token')
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'INDEXED' | 'GENERATING' | 'PENDING' | string;

interface Article {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus | null;
  wordCount: number | null;
  keyword: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  cluster?: { id: string; name: string } | null;
  _count?: { rankings: number };
}

interface KnowledgeTopic {
  topic: string;
  source: string;
  accessCount: number;
}

interface KnowledgeStats {
  totalEntries: number;
  topTopics?: KnowledgeTopic[];
}

interface ArticlesResponse {
  success: boolean;
  data: Article[];
  meta: { total: number };
}

interface KnowledgeTopicsResponse {
  success: boolean;
  data: KnowledgeTopic[];
}

interface KnowledgeStatsResponse {
  success: boolean;
  data: KnowledgeStats;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fetch helpers                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
      }}
    >
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status?: ArticleStatus | null }) {
  const s = (status ?? 'DRAFT').toUpperCase();

  const map: Record<string, { bg: string; border: string; color: string; label: string }> = {
    PUBLISHED: {
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.25)',
      color: '#22c55e',
      label: 'Published',
    },
    INDEXED: {
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.2)',
      color: '#22c55e',
      label: 'Indexed',
    },
    GENERATING: {
      bg: 'rgba(249,115,22,0.12)',
      border: 'rgba(249,115,22,0.25)',
      color: '#f97316',
      label: 'Generating',
    },
    PENDING: {
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.2)',
      color: '#f97316',
      label: 'Pending',
    },
    DRAFT: {
      bg: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.10)',
      color: 'rgba(255,255,255,0.5)',
      label: 'Draft',
    },
  };

  const style = map[s] ?? map.DRAFT;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 500,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

function FilterPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        border: active
          ? '1px solid rgba(220,38,38,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        background: active
          ? 'rgba(220,38,38,0.15)'
          : 'rgba(255,255,255,0.03)',
        color: active ? '#f97316' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count != null && (
        <span
          style={{
            fontSize: 9,
            padding: '0 4px',
            borderRadius: 4,
            background: active
              ? 'rgba(220,38,38,0.3)'
              : 'rgba(255,255,255,0.06)',
            color: active ? '#f97316' : 'rgba(255,255,255,0.3)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Skeleton({ h = 14 }: { h?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: h,
        borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
      }}
    />
  );
}

function ArticleRow({ article }: { article: Article }) {
  const date = article.publishedAt ?? article.createdAt;
  const displayDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.1s',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: '#e4e4e7',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {article.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {article.keyword && (
            <span
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.25)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 140,
              }}
            >
              {article.keyword}
            </span>
          )}
          {article.cluster?.name && !article.keyword && (
            <span
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              {article.cluster.name}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={article.status} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {article.wordCount != null && article.wordCount > 0 && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {article.wordCount.toLocaleString()}w
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          {displayDate}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'INDEXED', label: 'Indexed' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'GENERATING', label: 'Generating' },
] as const;

export function ContentPanel() {
  /* ── Articles state ── */
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Knowledge state ── */
  const [knowledgeTopics, setKnowledgeTopics] = useState<KnowledgeTopic[]>([]);
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats | null>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'knowledge'>('articles');

  /* ── Create article form ── */
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createKeyword, setCreateKeyword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  /* ── Knowledge search ── */
  const [knowledgeQ, setKnowledgeQ] = useState('');
  const [knowledgeResult, setKnowledgeResult] = useState<{
    found: boolean;
    topic?: string;
    answer?: string;
    source?: string;
    accessCount?: number;
  } | null>(null);
  const [searchingKnowledge, setSearchingKnowledge] = useState(false);
  const [knowledgeSearchError, setKnowledgeSearchError] = useState<string | null>(null);

  /* ── Store knowledge form ── */
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeTopic, setStoreTopic] = useState('');
  const [storeAnswer, setStoreAnswer] = useState('');
  const [storing, setStoring] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeSuccess, setStoreSuccess] = useState(false);

  /* ── Fetch articles ── */
  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    setArticleError(null);
    try {
      const params = new URLSearchParams({ perPage: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const data = await apiFetch<ArticlesResponse>(
        `/api/seo/articles?${params.toString()}`,
      );
      if (data.success) {
        const rows = Array.isArray(data.data)
          ? data.data
          : Array.isArray((data.data as any)?.data)
          ? (data.data as any).data
          : [];
        setArticles(rows);
        setTotal(data.meta?.total ?? rows.length);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load articles';
      setArticleError(msg);
    } finally {
      setLoadingArticles(false);
    }
  }, [statusFilter, searchQuery]);

  /* ── Fetch knowledge ── */
  const fetchKnowledge = useCallback(async () => {
    setLoadingKnowledge(true);
    try {
      const [topicsRes, statsRes] = await Promise.allSettled([
        apiFetch<KnowledgeTopicsResponse>('/api/knowledge/topics'),
        apiFetch<KnowledgeStatsResponse>('/api/knowledge/stats'),
      ]);
      if (topicsRes.status === 'fulfilled' && topicsRes.value.success) {
        setKnowledgeTopics(
          Array.isArray(topicsRes.value.data) ? topicsRes.value.data : [],
        );
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setKnowledgeStats(statsRes.value.data);
      }
    } catch {
      /* non-critical */
    } finally {
      setLoadingKnowledge(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    if (activeTab === 'knowledge') fetchKnowledge();
  }, [activeTab, fetchKnowledge]);

  /* ── Auto-slug from title ── */
  const handleTitleChange = (val: string) => {
    setCreateTitle(val);
    setCreateSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80),
    );
  };

  /* ── Create article ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createSlug.trim()) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      await apiFetch('/api/seo/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: createTitle.trim(),
          slug: createSlug.trim(),
          ...(createKeyword.trim() ? { metaDescription: createKeyword.trim() } : {}),
        }),
      });
      setCreateSuccess(true);
      setCreateTitle('');
      setCreateSlug('');
      setCreateKeyword('');
      setShowCreate(false);
      fetchArticles();
      setTimeout(() => setCreateSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create article';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  /* ── Knowledge search ── */
  const handleKnowledgeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeQ.trim()) return;
    setSearchingKnowledge(true);
    setKnowledgeResult(null);
    setKnowledgeSearchError(null);
    try {
      const data = await apiFetch<{ success: boolean; data: any }>(
        `/api/knowledge/search?q=${encodeURIComponent(knowledgeQ.trim())}`,
      );
      if (data.success) setKnowledgeResult(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setKnowledgeSearchError(msg);
    } finally {
      setSearchingKnowledge(false);
    }
  };

  /* ── Store knowledge ── */
  const handleStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeTopic.trim() || !storeAnswer.trim()) return;
    setStoring(true);
    setStoreError(null);
    setStoreSuccess(false);
    try {
      await apiFetch('/api/knowledge/store', {
        method: 'POST',
        body: JSON.stringify({
          topic: storeTopic.trim(),
          answer: storeAnswer.trim(),
          source: 'manual',
        }),
      });
      setStoreSuccess(true);
      setStoreTopic('');
      setStoreAnswer('');
      setShowStoreForm(false);
      fetchKnowledge();
      setTimeout(() => setStoreSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to store entry';
      setStoreError(msg);
    } finally {
      setStoring(false);
    }
  };

  /* ── Status counts ── */
  const countsByStatus = articles.reduce<Record<string, number>>((acc, a) => {
    const s = (a.status ?? 'DRAFT').toUpperCase();
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: '#f4f4f5',
              letterSpacing: '-0.02em',
            }}
          >
            Content Library
          </h2>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#f97316',
            }}
          >
            {total > 0 ? `${total} articles` : 'SEO + Knowledge'}
          </span>
        </div>
        {createSuccess && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#22c55e',
            }}
          >
            Article created successfully.
          </span>
        )}
        {storeSuccess && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#22c55e',
            }}
          >
            Knowledge entry stored.
          </span>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: 4,
        }}
      >
        {(['articles', 'knowledge'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '5px 10px',
              borderRadius: 7,
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background:
                activeTab === tab
                  ? 'linear-gradient(90deg,rgba(220,38,38,0.25),rgba(249,115,22,0.25))'
                  : 'transparent',
              color:
                activeTab === tab
                  ? '#f97316'
                  : 'rgba(255,255,255,0.35)',
            }}
          >
            {tab === 'articles' ? 'SEO Articles' : 'Knowledge Base'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ARTICLES TAB                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {activeTab === 'articles' && (
        <>
          {/* ── Summary stat cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 8,
            }}
          >
            {[
              {
                label: 'Total',
                value: total,
                accent: false,
              },
              {
                label: 'Published',
                value:
                  (countsByStatus['PUBLISHED'] ?? 0) +
                  (countsByStatus['INDEXED'] ?? 0),
                accent: true,
              },
              {
                label: 'Draft',
                value: countsByStatus['DRAFT'] ?? 0,
                accent: false,
              },
              {
                label: 'In Progress',
                value:
                  (countsByStatus['GENERATING'] ?? 0) +
                  (countsByStatus['PENDING'] ?? 0),
                accent: false,
              },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <SectionLabel>{label}</SectionLabel>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: accent ? 'transparent' : '#fff',
                    background: accent
                      ? 'linear-gradient(90deg,#dc2626,#f97316)'
                      : undefined,
                    WebkitBackgroundClip: accent ? 'text' : undefined,
                    WebkitTextFillColor: accent ? 'transparent' : undefined,
                  }}
                >
                  {loadingArticles ? '—' : value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Filters + search + create button ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
              {STATUS_FILTERS.map(({ key, label }) => (
                <FilterPill
                  key={key}
                  label={label}
                  active={statusFilter === key}
                  count={
                    key === 'all'
                      ? undefined
                      : countsByStatus[key] ?? 0
                  }
                  onClick={() => setStatusFilter(key)}
                />
              ))}
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                color: '#d4d4d8',
                outline: 'none',
                width: 120,
              }}
            />
            <button
              onClick={() => setShowCreate((v) => !v)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'monospace',
                border: '1px solid rgba(220,38,38,0.4)',
                background: showCreate
                  ? 'rgba(220,38,38,0.2)'
                  : 'rgba(220,38,38,0.1)',
                color: '#f97316',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {showCreate ? 'Cancel' : '+ New Article'}
            </button>
          </div>

          {/* ── Create article form ── */}
          {showCreate && (
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <SectionLabel>New Article</SectionLabel>
              <form
                onSubmit={handleCreate}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <input
                  type="text"
                  placeholder="Title *"
                  value={createTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  disabled={creating}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Slug (auto-filled) *"
                    value={createSlug}
                    onChange={(e) =>
                      setCreateSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      )
                    }
                    required
                    disabled={creating}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Keyword (optional)"
                    value={createKeyword}
                    onChange={(e) => setCreateKeyword(e.target.value)}
                    disabled={creating}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {createError && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#dc2626',
                    }}
                  >
                    {createError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={
                      creating || !createTitle.trim() || !createSlug.trim()
                    }
                    style={{
                      padding: '5px 14px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      border: 'none',
                      background: creating
                        ? 'rgba(220,38,38,0.4)'
                        : 'linear-gradient(90deg,#dc2626,#f97316)',
                      color: '#fff',
                      cursor: creating ? 'default' : 'pointer',
                      opacity: creating ? 0.7 : 1,
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Draft'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Articles list ── */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 12px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <SectionLabel>
                {statusFilter === 'all' ? 'All Articles' : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Articles`}
              </SectionLabel>
              <button
                onClick={fetchArticles}
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>

            {loadingArticles ? (
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} h={40} />
                ))}
              </div>
            ) : articleError ? (
              <p
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: '#dc2626',
                }}
              >
                {articleError}
              </p>
            ) : articles.length === 0 ? (
              <p
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                No articles found.
              </p>
            ) : (
              <>
                {articles.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
                {total > articles.length && (
                  <p
                    style={{
                      padding: '8px 12px',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.25)',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      textAlign: 'center',
                    }}
                  >
                    Showing {articles.length} of {total} — use filters to narrow results
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* KNOWLEDGE TAB                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {activeTab === 'knowledge' && (
        <>
          {/* ── Knowledge stats ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: 8,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <SectionLabel>Total Entries</SectionLabel>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: 'transparent',
                  background: 'linear-gradient(90deg,#dc2626,#f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {loadingKnowledge
                  ? '—'
                  : knowledgeStats?.totalEntries ?? knowledgeTopics.length}
              </span>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <SectionLabel>Topics Stored</SectionLabel>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: '#fff',
                }}
              >
                {loadingKnowledge ? '—' : knowledgeTopics.length}
              </span>
            </div>
          </div>

          {/* ── Knowledge search ── */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <SectionLabel>Search Knowledge Base</SectionLabel>
            <form
              onSubmit={handleKnowledgeSearch}
              style={{ display: 'flex', gap: 8 }}
            >
              <input
                type="text"
                placeholder="Enter a topic or question..."
                value={knowledgeQ}
                onChange={(e) => {
                  setKnowledgeQ(e.target.value);
                  setKnowledgeResult(null);
                  setKnowledgeSearchError(null);
                }}
                disabled={searchingKnowledge}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="submit"
                disabled={searchingKnowledge || !knowledgeQ.trim()}
                style={{
                  padding: '5px 14px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  border: 'none',
                  background: searchingKnowledge
                    ? 'rgba(220,38,38,0.4)'
                    : 'linear-gradient(90deg,#dc2626,#f97316)',
                  color: '#fff',
                  cursor: searchingKnowledge ? 'default' : 'pointer',
                  opacity: searchingKnowledge ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                {searchingKnowledge ? 'Searching...' : 'Search'}
              </button>
            </form>

            {knowledgeSearchError && (
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#dc2626',
                }}
              >
                {knowledgeSearchError}
              </p>
            )}

            {knowledgeResult && (
              <div
                style={{
                  background: knowledgeResult.found
                    ? 'rgba(34,197,94,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${knowledgeResult.found ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {knowledgeResult.found ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#e4e4e7',
                        }}
                      >
                        {knowledgeResult.topic}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {knowledgeResult.source && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              padding: '1px 7px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {knowledgeResult.source}
                          </span>
                        )}
                        {knowledgeResult.accessCount != null && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: 'rgba(255,255,255,0.25)',
                            }}
                          >
                            {knowledgeResult.accessCount}x accessed
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.6,
                        maxHeight: 120,
                        overflowY: 'auto',
                      }}
                    >
                      {knowledgeResult.answer}
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    No entry found for this topic. Store it below.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Store knowledge ── */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <SectionLabel>Store New Entry</SectionLabel>
              <button
                onClick={() => setShowStoreForm((v) => !v)}
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '2px 9px',
                  borderRadius: 6,
                  background: showStoreForm
                    ? 'rgba(220,38,38,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showStoreForm ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color: showStoreForm ? '#f97316' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                }}
              >
                {showStoreForm ? 'Cancel' : '+ Add Entry'}
              </button>
            </div>

            {showStoreForm && (
              <form
                onSubmit={handleStore}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <input
                  type="text"
                  placeholder="Topic *"
                  value={storeTopic}
                  onChange={(e) => setStoreTopic(e.target.value)}
                  required
                  disabled={storing}
                  style={inputStyle}
                />
                <textarea
                  placeholder="Answer / knowledge content *"
                  value={storeAnswer}
                  onChange={(e) => setStoreAnswer(e.target.value)}
                  required
                  disabled={storing}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
                {storeError && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#dc2626',
                    }}
                  >
                    {storeError}
                  </p>
                )}
                <div
                  style={{ display: 'flex', justifyContent: 'flex-end' }}
                >
                  <button
                    type="submit"
                    disabled={storing || !storeTopic.trim() || !storeAnswer.trim()}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      border: 'none',
                      background: storing
                        ? 'rgba(220,38,38,0.4)'
                        : 'linear-gradient(90deg,#dc2626,#f97316)',
                      color: '#fff',
                      cursor: storing ? 'default' : 'pointer',
                      opacity: storing ? 0.7 : 1,
                    }}
                  >
                    {storing ? 'Storing...' : 'Store Entry'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Topics list ── */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 12px 8px' }}>
              <SectionLabel>
                Stored Topics ({knowledgeTopics.length})
              </SectionLabel>
            </div>

            {loadingKnowledge ? (
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} h={32} />
                ))}
              </div>
            ) : knowledgeTopics.length === 0 ? (
              <p
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                No knowledge entries yet.
              </p>
            ) : (
              knowledgeTopics.slice(0, 15).map((t, idx) => (
                <div
                  key={t.topic}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    borderTop:
                      idx === 0
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#dc2626,#f97316)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: '#d4d4d8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.topic}
                  </span>
                  {t.source && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        padding: '1px 6px',
                        borderRadius: 5,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {t.source}
                    </span>
                  )}
                  {t.accessCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.2)',
                        flexShrink: 0,
                      }}
                    >
                      {t.accessCount}x
                    </span>
                  )}
                </div>
              ))
            )}
            {knowledgeTopics.length > 15 && (
              <p
                style={{
                  padding: '8px 12px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  textAlign: 'center',
                }}
              >
                + {knowledgeTopics.length - 15} more entries
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Shared style constant                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 11,
  color: '#d4d4d8',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
