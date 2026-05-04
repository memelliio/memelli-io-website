'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, Square, Globe, Send, Archive, ChevronDown, CheckCircle, Edit2, Filter } from 'lucide-react';
import { API_URL as API } from '@/lib/config';

import { LoadingGlobe } from '@/components/ui/loading-globe';
async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Article {
  id: string;
  title: string;
  status: string;
  wordCount?: number;
  keyword?: string;
  clusterId?: string;
  cluster_id?: string;
  clusterName?: string;
  cluster_name?: string;
  createdAt: string;
}

interface Cluster {
  id: string;
  name: string;
}

type SortKey = 'createdAt' | 'wordCount' | 'status';
type SortDir = 'asc' | 'desc';

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-500/10 text-green-400 border-green-500/20',
  DRAFT: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
  GENERATING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PENDING: 'bg-white/[0.03] text-muted-foreground border-white/[0.06]',
  ARCHIVED: 'bg-primary/10 text-primary border-primary/20'
};

function runWithProgress<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  onProgress: (done: number, total: number) => void
): Promise<void> {
  let done = 0;
  return Promise.all(
    items.map((item) =>
      fn(item).finally(() => {
        done++;
        onProgress(done, items.length);
      })
    )
  ).then(() => {});
}

export default function BulkArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterCluster, setFilterCluster] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('/api/seo/articles?perPage=200').catch(() => ({ items: [] })),
      api('/api/seo/clusters').catch(() => []),
    ])
      .then(([articlesRaw, clustersRaw]) => {
        // Backend returns { success, data: [...], meta } for articles
        const ad = articlesRaw?.data ?? articlesRaw;
        const aList = Array.isArray(ad) ? ad : ad?.items ?? ad?.articles ?? [];
        // Backend returns { success, data: [...] } for clusters
        const cd = clustersRaw?.data ?? clustersRaw;
        const cList = Array.isArray(cd) ? cd : [];
        setArticles(aList);
        setClusters(cList);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load articles'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...articles];
    if (filterCluster) {
      list = list.filter((a) => (a.clusterId ?? a.cluster_id) === filterCluster);
    }
    if (filterStatus) {
      list = list.filter((a) => a.status === filterStatus);
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'wordCount') {
        cmp = (a.wordCount ?? 0) - (b.wordCount ?? 0);
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [articles, filterCluster, filterStatus, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  async function handleBulkPublish() {
    const ids = Array.from(selected);
    setBulkAction('publish');
    setBulkProgress({ done: 0, total: ids.length });
    await runWithProgress(ids, async (id) => {
      await api(`/api/seo/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PUBLISHED' })
      });
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'PUBLISHED' } : a)));
    }, (done, total) => setBulkProgress({ done, total }));
    setBulkAction(null);
    setBulkProgress(null);
    setSelected(new Set());
    showToast(`${ids.length} articles published`);
  }

  async function handleBulkIndex() {
    const ids = Array.from(selected);
    setBulkAction('index');
    setBulkProgress({ done: 0, total: ids.length });
    await runWithProgress(ids, async (id) => {
      await api(`/api/seo/articles/${id}/index`, { method: 'POST' }).catch(() => {});
    }, (done, total) => setBulkProgress({ done, total }));
    setBulkAction(null);
    setBulkProgress(null);
    setSelected(new Set());
    showToast(`${ids.length} articles submitted to index`);
  }

  async function handleBulkArchive() {
    const ids = Array.from(selected);
    setBulkAction('archive');
    setBulkProgress({ done: 0, total: ids.length });
    await runWithProgress(ids, async (id) => {
      await api(`/api/seo/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ARCHIVED' })
      });
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ARCHIVED' } : a)));
    }, (done, total) => setBulkProgress({ done, total }));
    setBulkAction(null);
    setBulkProgress(null);
    setSelected(new Set());
    showToast(`${ids.length} articles archived`);
  }

  const isBusy = bulkAction !== null;

  const allStatuses = Array.from(new Set(articles.map((a) => a.status)));

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bulk Article Operations</h1>
            <p className="text-muted-foreground leading-relaxed text-sm mt-1">Manage, publish, and index articles in bulk</p>
          </div>
          <Link
            href="/dashboard/seo/articles"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all articles
          </Link>
        </div>

        {/* Filters + sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <div className="relative">
            <select
              value={filterCluster}
              onChange={(e) => setFilterCluster(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-xl text-foreground focus:outline-none focus:border-primary/30 text-sm transition-all duration-200"
            >
              <option value="">All Clusters</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-xl text-foreground focus:outline-none focus:border-primary/30 text-sm transition-all duration-200"
            >
              <option value="">All Statuses</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
            <span>{filtered.length} articles</span>
            {selected.size > 0 && <span>· {selected.size} selected</span>}
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-card backdrop-blur-xl border border-primary/20 rounded-2xl">
            <span className="text-sm text-foreground font-medium">{selected.size} selected</span>
            <div className="w-px h-5 bg-white/[0.06]" />
            {bulkProgress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingGlobe size="sm" />
                <span>{bulkProgress.done}/{bulkProgress.total}</span>
              </div>
            )}
            <button
              onClick={handleBulkPublish}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-tight transition-all duration-200"
            >
              {bulkAction === 'publish' ? <LoadingGlobe size="sm" /> : <Globe className="w-3.5 h-3.5" />}
              Publish All
            </button>
            <button
              onClick={handleBulkIndex}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-tight transition-all duration-200"
            >
              {bulkAction === 'index' ? <LoadingGlobe size="sm" /> : <Send className="w-3.5 h-3.5" />}
              Submit to Index
            </button>
            <button
              onClick={handleBulkArchive}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.04] disabled:opacity-50 text-foreground rounded-xl text-xs font-semibold tracking-tight transition-all duration-200"
            >
              {bulkAction === 'archive' ? <LoadingGlobe size="sm" /> : <Archive className="w-3.5 h-3.5" />}
              Archive
            </button>
            <button
              onClick={() => setSelected(new Set())}
              disabled={isBusy}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingGlobe size="lg" />
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-center text-muted-foreground leading-relaxed text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-4 py-3 w-10">
                      <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                        {selected.size === filtered.length && filtered.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Keyword</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cluster</th>
                    <th
                      className="text-left px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none transition-colors"
                      onClick={() => toggleSort('status')}
                    >
                      <span className="flex items-center gap-1">
                        Status {sortKey === 'status' && <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none transition-colors"
                      onClick={() => toggleSort('wordCount')}
                    >
                      <span className="flex items-center gap-1">
                        Words {sortKey === 'wordCount' && <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none transition-colors"
                      onClick={() => toggleSort('createdAt')}
                    >
                      <span className="flex items-center gap-1">
                        Created {sortKey === 'createdAt' && <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                      </span>
                    </th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                        No articles match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr
                        key={a.id}
                        className={`border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-all duration-150 ${selected.has(a.id) ? 'bg-primary/[0.06]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <button onClick={() => toggleItem(a.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {selected.has(a.id) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-foreground max-w-xs truncate font-medium">{a.title}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{a.keyword || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{a.clusterName ?? a.cluster_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${statusColors[a.status] ?? 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{a.wordCount?.toLocaleString() ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/seo/articles/${a.id}/edit`}
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
