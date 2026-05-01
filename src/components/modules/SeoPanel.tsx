'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  Search,
  FileText,
  BarChart2,
  Zap,
  Activity,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface RankingRow {
  id: string;
  keyword: string;
  position: number | null;
  previousPosition: number | null;
  weeklyImpressions: number;
  weeklyClicks: number;
  ctr: number;
  title: string;
  articleId: string;
}

interface RankingSummary {
  totalRecords: number;
  avgPosition: number | null;
  totalImpressions: number;
  totalClicks: number;
  ctr: number | null;
  rows: RankingRow[];
}

interface Article {
  id: string;
  title: string;
  status: string | null;
  wordCount: number | null;
  keyword: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface IndexingData {
  totalPages: number;
  indexedPages: number;
  pendingPages: number;
  errorPages: number;
  lastSitemapUpdate: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-1">
      {children}
    </h3>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; color?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: accent ? '#22c55e' : '#71717a' }} />
        <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-white text-2xl font-bold leading-none">{value}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank?: number | null }) {
  if (rank == null) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-5 rounded text-[10px] font-mono font-bold bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
        —
      </span>
    );
  }
  let style: React.CSSProperties;
  if (rank <= 3) {
    style = { background: 'rgba(202,138,4,0.15)', color: '#facc15', border: '1px solid rgba(202,138,4,0.3)' };
  } else if (rank <= 10) {
    style = { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' };
  } else {
    style = { background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' };
  }
  return (
    <span
      className="inline-flex items-center justify-center min-w-[2rem] px-1.5 h-5 rounded text-[10px] font-mono font-bold"
      style={style}
    >
      #{rank}
    </span>
  );
}

function RankChange({ current, previous }: { current?: number | null; previous?: number | null }) {
  if (current == null || previous == null) {
    return <Minus size={11} className="text-[hsl(var(--muted-foreground))]" />;
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-mono text-green-400">
        <ArrowUp size={10} />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-mono text-red-400">
        <ArrowDown size={10} />
        {Math.abs(diff)}
      </span>
    );
  }
  return <Minus size={11} className="text-[hsl(var(--muted-foreground))]" />;
}

function ArticleStatusBadge({ status }: { status?: string | null }) {
  const s = (status || 'DRAFT').toUpperCase();
  if (s === 'PUBLISHED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-950 text-green-400 border border-green-800/40">
        Published
      </span>
    );
  }
  if (s === 'INDEXED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
        style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.2)' }}>
        Indexed
      </span>
    );
  }
  if (s === 'GENERATING' || s === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-950 text-yellow-400 border border-yellow-800/40">
        Generating
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-white/[0.06]">
      Draft
    </span>
  );
}

function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
          <div className="h-3 rounded bg-white/[0.05] flex-1 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/[0.05] animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function SeoPanel() {
  const api = useApi();
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  /* ── Data fetching — real endpoints ── */

  // GET /api/seo/rankings/summary — aggregated ranking data with rows
  const rankingsQuery = useQuery({
    queryKey: ['seo-panel-rankings-summary'],
    queryFn: () => api.get<RankingSummary>('/api/seo/rankings/summary'),
    staleTime: 60_000,
    retry: false,
  });

  // GET /api/seo/articles — articles with status + word count
  const articlesQuery = useQuery({
    queryKey: ['seo-panel-articles'],
    queryFn: () => api.get<{ data: Article[]; meta: { total: number } }>('/api/seo/articles?perPage=6'),
    staleTime: 60_000,
    retry: false,
  });

  // GET /api/seo/indexing — IndexNow/indexing status
  const indexingQuery = useQuery({
    queryKey: ['seo-panel-indexing'],
    queryFn: () => api.get<IndexingData>('/api/seo/indexing'),
    staleTime: 60_000,
    retry: false,
  });

  /* ── Derived data ── */
  const rankingSummary = rankingsQuery.data?.data as RankingSummary | null | undefined;
  const rankingRows: RankingRow[] = rankingSummary?.rows?.slice(0, 8) ?? [];

  const articlesRaw = articlesQuery.data?.data;
  const articles: Article[] = Array.isArray(articlesRaw)
    ? articlesRaw
    : Array.isArray((articlesRaw as any)?.data)
    ? (articlesRaw as any).data
    : [];

  const indexing = indexingQuery.data?.data as IndexingData | null | undefined;

  const articlesPublished = articles.filter(
    (a) => (a.status || '').toUpperCase() === 'PUBLISHED' || (a.status || '').toUpperCase() === 'INDEXED'
  ).length;

  /* ── Generate article via POST /api/seo/generate/generate-single ── */
  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!keyword.trim()) return;
      setGenerating(true);
      setGenerateError(null);
      setGenerateSuccess(false);

      const res = await api.post('/api/seo/generate/generate-single', { keyword: keyword.trim() });
      setGenerating(false);

      if (res.error) {
        setGenerateError(res.error);
        return;
      }
      setGenerateSuccess(true);
      setKeyword('');
      // Invalidate articles cache so the new draft appears
      qc.invalidateQueries({ queryKey: ['seo-panel-articles'] });
      setTimeout(() => setGenerateSuccess(false), 4000);
    },
    [api, keyword, qc]
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">SEO &amp; Content</h2>
          {/* IndexNow live indicator */}
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#22c55e' }}
            />
            IndexNow
          </span>
        </div>
        <Link
          href="/dashboard/seo"
          className="flex items-center gap-1 text-[11px] text-[hsl(var(--foreground))] hover:text-white transition-colors font-mono"
        >
          Full SEO
          <ExternalLink size={11} />
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={Search}
          label="Keywords Tracked"
          value={rankingsQuery.isLoading ? '—' : (rankingSummary?.totalRecords ?? 0)}
          accent
        />
        <StatCard
          icon={BarChart2}
          label="Avg Position"
          value={
            rankingsQuery.isLoading
              ? '—'
              : rankingSummary?.avgPosition != null
              ? `#${rankingSummary.avgPosition}`
              : '—'
          }
          accent
        />
        <StatCard
          icon={FileText}
          label="Published"
          value={articlesQuery.isLoading ? '—' : articlesPublished}
        />
        <StatCard
          icon={Activity}
          label="Indexed"
          value={
            indexingQuery.isLoading
              ? '—'
              : indexing?.indexedPages != null
              ? indexing.indexedPages
              : '—'
          }
        />
      </div>

      {/* ── Indexing coverage bar ── */}
      {!indexingQuery.isLoading && indexing && indexing.totalPages > 0 && (
        <div
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between">
            <SectionHeader>Index Coverage</SectionHeader>
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
              {indexing.indexedPages} / {indexing.totalPages} pages
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.round((indexing.indexedPages / indexing.totalPages) * 100)}%`,
                background: '#22c55e',
              }}
            />
          </div>
          <div className="flex gap-3 text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            <span style={{ color: '#22c55e' }}>{indexing.indexedPages} indexed</span>
            <span>{indexing.pendingPages} pending</span>
            {indexing.errorPages > 0 && (
              <span className="text-red-400">{indexing.errorPages} errors</span>
            )}
          </div>
        </div>
      )}

      {/* ── Top Rankings table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <SectionHeader>Keyword Rankings</SectionHeader>
          <div className="hidden sm:flex items-center gap-4 pr-1">
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-10 text-right">Rank</span>
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-8 text-center">Chg</span>
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-14 text-right">Impr</span>
          </div>
        </div>
        <div className="px-3 pb-2">
          {rankingsQuery.isLoading ? (
            <RowSkeleton count={5} />
          ) : rankingsQuery.isError || rankingRows.length === 0 ? (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] py-4 text-center font-mono">
              {rankingsQuery.isError ? 'Could not load rankings.' : 'No rankings recorded yet.'}
            </p>
          ) : (
            rankingRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors rounded"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[hsl(var(--foreground))] truncate block">{row.keyword}</span>
                  {row.title && row.title !== 'Untitled' && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate block font-mono">
                      {row.title}
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <RankBadge rank={row.position} />
                </div>
                <div className="shrink-0 w-8 flex justify-center">
                  <RankChange current={row.position} previous={row.previousPosition} />
                </div>
                <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] shrink-0 w-14 text-right">
                  {row.weeklyImpressions > 0
                    ? row.weeklyImpressions >= 1000
                      ? `${(row.weeklyImpressions / 1000).toFixed(1)}K`
                      : row.weeklyImpressions.toLocaleString()
                    : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Recent Articles ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-3 pt-3 pb-2">
          <SectionHeader>Recent Articles</SectionHeader>
        </div>
        <div className="px-3 pb-2">
          {articlesQuery.isLoading ? (
            <RowSkeleton count={4} />
          ) : articlesQuery.isError || articles.length === 0 ? (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] py-4 text-center font-mono">
              {articlesQuery.isError ? 'Could not load articles.' : 'No articles yet.'}
            </p>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors rounded"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[hsl(var(--foreground))] truncate block">{article.title}</span>
                  {article.keyword && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono truncate block">
                      {article.keyword}
                    </span>
                  )}
                </div>
                <div className="shrink-0">
                  <ArticleStatusBadge status={article.status} />
                </div>
                {article.wordCount != null && (
                  <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] shrink-0">
                    {article.wordCount.toLocaleString()}w
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SEO Score summary ── */}
      {!rankingsQuery.isLoading && rankingSummary && rankingSummary.totalRecords > 0 && (
        <div
          className="rounded-xl p-3 grid grid-cols-3 gap-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Impressions</span>
            <span className="text-sm font-bold text-white">
              {rankingSummary.totalImpressions >= 1000
                ? `${(rankingSummary.totalImpressions / 1000).toFixed(1)}K`
                : rankingSummary.totalImpressions.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Clicks</span>
            <span className="text-sm font-bold text-white">
              {rankingSummary.totalClicks.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">CTR</span>
            <span className="text-sm font-bold" style={{ color: '#22c55e' }}>
              {rankingSummary.ctr != null ? `${rankingSummary.ctr}%` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* ── Generate Article by Keyword ── */}
      <div
        className="rounded-xl p-3 flex flex-col gap-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <SectionHeader>Generate Article</SectionHeader>
        <form onSubmit={handleGenerate} className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Enter target keyword..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setGenerateError(null);
            }}
            disabled={generating}
            className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <button
            type="submit"
            disabled={generating || !keyword.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all disabled:opacity-50 shrink-0"
            style={{ background: generating ? 'rgba(34,197,94,0.5)' : '#22c55e' }}
          >
            {generating ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Zap size={11} />
            )}
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>
        {generateError && (
          <p className="text-[10px] text-red-400 font-mono">{generateError}</p>
        )}
        {generateSuccess && (
          <p className="text-[10px] font-mono" style={{ color: '#22c55e' }}>
            Article generated and saved as draft.
          </p>
        )}
      </div>

    </div>
  );
}
