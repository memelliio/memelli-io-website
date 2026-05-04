'use client';

import { useEffect, useState } from 'react';
import { Search, CheckSquare, Square, Import, ChevronDown, CheckCircle } from 'lucide-react';
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

interface Cluster {
  id: string;
  name: string;
}

interface SeoQuestion {
  id: string;
  question: string;
  keyword: string;
  status: string;
  createdAt: string;
}

export default function KeywordsPage() {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [recentQuestions, setRecentQuestions] = useState<SeoQuestion[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      api('/api/seo/clusters').catch(() => ({ data: [] })),
    ]).then(([cData]) => {
      // Backend returns { success, data: [...] }
      const list = cData?.data ?? (Array.isArray(cData) ? cData : []);
      setClusters(list);
    });

    setLoadingRecent(true);
    api('/api/seo/questions?perPage=10')
      .then((data) => {
        // Backend returns { success, data: { items: [...], total, page, perPage } }
        const d = data?.data ?? data;
        const list = d?.items ?? (Array.isArray(d) ? d : []);
        setRecentQuestions(list.slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, []);

  async function handleGenerate() {
    if (!seedKeyword.trim()) return;
    setIsGenerating(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    try {
      const data = await api('/api/seo/keywords/suggest', {
        method: 'POST',
        body: JSON.stringify({ seedKeyword: seedKeyword.trim(), count: 30 })
      });
      // Backend returns { success, data: { keywords: [...], seedKeyword } }
      const d = data?.data ?? data;
      const kws: string[] = d?.keywords ?? d?.suggestions ?? (Array.isArray(d) ? d : []);
      setSuggestions(Array.isArray(kws) ? kws : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleItem(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(suggestions.map((_, i) => i)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleImport() {
    if (selected.size === 0) return;
    const selectedKeywords = Array.from(selected).map((i) => suggestions[i]);
    setImporting(true);
    try {
      const data = await api('/api/seo/keywords/import-keywords', {
        method: 'POST',
        body: JSON.stringify({
          keywords: selectedKeywords,
          ...(selectedClusterId ? { clusterId: selectedClusterId } : {})
        })
      });
      // Backend returns { success, data: { created, questionIds } }
      const d = data?.data ?? data;
      const count = d?.created ?? d?.count ?? selectedKeywords.length;
      showToast(`${count} questions created`);
      setSelected(new Set());

      // Refresh recent questions
      const fresh = await api('/api/seo/questions?perPage=10').catch(() => null);
      if (fresh) {
        // Backend returns { success, data: { items: [...] } }
        const fd = fresh?.data ?? fresh;
        const list = fd?.items ?? (Array.isArray(fd) ? fd : []);
        setRecentQuestions(list.slice(0, 10));
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-white/[0.03] text-muted-foreground border-white/[0.06]',
    GENERATING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    ARTICLE_DRAFTED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    PUBLISHED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  };

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Keyword Research</h1>
          <p className="text-muted-foreground leading-relaxed text-sm mt-1.5">Generate keyword suggestions and import them as SEO questions</p>
        </div>

        {/* Generator */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
          <h2 className="text-[11px] font-medium text-muted-foreground mb-4 uppercase tracking-widest">Generate Suggestions</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                placeholder="Enter a seed keyword (e.g. credit repair, mortgage rates)"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm transition-all duration-200"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !seedKeyword.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <LoadingGlobe size="sm" />
                  Generating...
                </>
              ) : (
                'Generate Suggestions'
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-primary/80 bg-primary/80/[0.08] border border-primary/20 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Suggestions list */}
          {suggestions.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{suggestions.length} suggestions — {selected.size} selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] text-foreground rounded-lg text-xs font-medium transition-all duration-150"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] text-foreground rounded-lg text-xs font-medium transition-all duration-150"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto pr-1">
                {suggestions.map((kw, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      selected.has(i)
                        ? 'bg-primary/80/[0.1] border-primary/25 text-foreground'
                        : 'bg-white/[0.03] border-white/[0.04] text-foreground hover:border-white/[0.08]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleItem(i)}
                      className="accent-purple-600 w-4 h-4"
                    />
                    <span className="text-sm truncate">{kw}</span>
                  </label>
                ))}
              </div>

              {/* Import controls */}
              {selected.size > 0 && (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                  <div className="relative">
                    <select
                      value={selectedClusterId}
                      onChange={(e) => setSelectedClusterId(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground focus:outline-none focus:border-primary/50 text-sm"
                    >
                      <option value="">No cluster</option>
                      {clusters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    {importing ? (
                      <>
                        <LoadingGlobe size="sm" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Import className="w-4 h-4" />
                        Import {selected.size} as Questions
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent questions */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Recently Imported Questions</h2>
          </div>
          {loadingRecent ? (
            <div className="flex items-center justify-center py-10">
              <LoadingGlobe size="md" />
            </div>
          ) : recentQuestions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No questions yet. Generate and import keywords above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">Question</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Keyword</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentQuestions.map((q) => (
                  <tr key={q.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-5 py-3 text-foreground max-w-xs truncate">{q.question}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{q.keyword || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${statusColors[q.status] ?? 'bg-white/[0.03] text-muted-foreground border-white/[0.06]'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-2xl text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
