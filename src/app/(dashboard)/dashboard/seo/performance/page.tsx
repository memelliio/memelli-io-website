'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { API_URL as API } from '@/lib/config';

async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface RankingRow {
  id: string;
  title: string;
  keyword?: string;
  position?: number;
  previousPosition?: number;
  previous_position?: number;
  weeklyImpressions?: number;
  weekly_impressions?: number;
  weeklyClicks?: number;
  weekly_clicks?: number;
  ctr?: number;
  articleId?: string;
  article_id?: string;
}

interface Summary {
  avgPosition?: number;
  avg_position?: number;
  totalImpressions?: number;
  total_impressions?: number;
  totalClicks?: number;
  total_clicks?: number;
  ctr?: number;
  rows?: RankingRow[];
  articles?: RankingRow[];
  items?: RankingRow[];
}

interface EditRow extends RankingRow {
  newPosition: string;
}

type SortKey = 'title' | 'keyword' | 'position' | 'weeklyImpressions' | 'weeklyClicks' | 'ctr';
type SortDir = 'asc' | 'desc';

function positionColor(pos?: number) {
  if (!pos) return 'text-muted-foreground';
  if (pos <= 3) return 'text-emerald-400';
  if (pos <= 10) return 'text-amber-400';
  return 'text-primary';
}

function positionBg(pos?: number) {
  if (!pos) return '';
  if (pos <= 3) return 'bg-emerald-500/10 border-emerald-500/20';
  if (pos <= 10) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-primary/10 border-primary/20';
}

function PositionChange({ current, previous }: { current?: number; previous?: number }) {
  if (!current || !previous || current === previous) {
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  }
  const diff = previous - current; // positive = improved (position number decreased)
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-xs">
        <TrendingUp className="w-3 h-3" />+{diff}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-primary text-xs">
      <TrendingDown className="w-3 h-3" />{diff}
    </span>
  );
}

export default function PerformancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [updateMode, setUpdateMode] = useState(false);
  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await api('/api/seo/rankings/summary');
      // Backend returns { success, data: { avgPosition, totalImpressions, totalClicks, ctr, rows } }
      const data = raw?.data ?? raw;
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rankings');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows: RankingRow[] = summary?.rows ?? summary?.articles ?? summary?.items ?? [];

  const sorted = [...rows].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (sortKey) {
      case 'title': av = a.title; bv = b.title; break;
      case 'keyword': av = a.keyword ?? ''; bv = b.keyword ?? ''; break;
      case 'position': av = a.position ?? 999; bv = b.position ?? 999; break;
      case 'weeklyImpressions': av = a.weeklyImpressions ?? a.weekly_impressions ?? 0; bv = b.weeklyImpressions ?? b.weekly_impressions ?? 0; break;
      case 'weeklyClicks': av = a.weeklyClicks ?? a.weekly_clicks ?? 0; bv = b.weeklyClicks ?? b.weekly_clicks ?? 0; break;
      case 'ctr': av = a.ctr ?? 0; bv = b.ctr ?? 0; break;
    }
    if (typeof av === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    }
    return sortDir === 'asc' ? av - (bv as number) : (bv as number) - av;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-muted-foreground" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  function startUpdate() {
    setEditRows(sorted.map(r => ({ ...r, newPosition: String(r.position ?? '') })));
    setUpdateMode(true);
  }

  async function saveUpdates() {
    setSaving(true);
    try {
      await Promise.all(
        editRows
          .filter(r => r.newPosition && String(r.position ?? '') !== r.newPosition)
          .map(r =>
            api(`/api/seo/rankings/${r.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ position: parseInt(r.newPosition) }),
            }).catch(() => null)
          )
      );
      showToast('Rankings updated');
      setUpdateMode(false);
      load();
    } catch {
      showToast('Some updates failed');
    } finally {
      setSaving(false);
    }
  }

  const avgPos = summary?.avgPosition ?? summary?.avg_position;
  const totalImpressions = summary?.totalImpressions ?? summary?.total_impressions ?? 0;
  const totalClicks = summary?.totalClicks ?? summary?.total_clicks ?? 0;
  // Backend now returns `ctr` directly
  const ctr = typeof summary?.ctr === 'number' ? summary.ctr : (totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">SEO Performance</h1>
            <p className="text-muted-foreground leading-relaxed text-sm mt-1.5">Rankings, impressions, and click-through rates</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-sm text-foreground transition-all duration-150"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              disabled
              title="Connect GSC to import rankings"
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.04] rounded-xl text-sm text-muted-foreground cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" /> Import from Google Search Console
            </button>
          </div>
        </div>

        {/* GSC notice */}
        <div className="px-4 py-3 bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl flex items-center gap-3">
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Connect Google Search Console to automatically import rankings data.{' '}
            <span className="text-muted-foreground text-xs">(Coming soon — manually track rankings below)</span>
          </p>
        </div>

        {/* Metrics */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Avg. Position</p>
                <p className={`text-3xl font-semibold tracking-tight ${positionColor(avgPos)}`}>{avgPos?.toFixed(1) ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1.5">across tracked keywords</p>
              </div>
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Total Impressions</p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">{totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1.5">this week</p>
              </div>
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Total Clicks</p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1.5">this week</p>
              </div>
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">CTR</p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">{ctr.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1.5">click-through rate</p>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-primary/[0.06] border border-primary/15 rounded-xl text-sm text-primary/80">{error}</div>
            )}

            {/* Table */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <h2 className="font-semibold tracking-tight text-foreground">Article Rankings</h2>
                {!updateMode ? (
                  <button
                    onClick={startUpdate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary rounded-xl text-sm text-white font-medium transition-all duration-200"
                  >
                    Update Rankings
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUpdateMode(false)}
                      className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-sm text-foreground transition-all duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveUpdates}
                      disabled={saving}
                      className="px-3 py-1.5 bg-primary hover:bg-primary disabled:opacity-40 rounded-xl text-sm text-white font-medium transition-all duration-200"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      {([
                        ['title', 'Title'],
                        ['keyword', 'Keyword'],
                        ['position', 'Position'],
                        ['weeklyImpressions', 'Impressions'],
                        ['weeklyClicks', 'Clicks'],
                        ['ctr', 'CTR'],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th
                          key={key}
                          onClick={() => toggleSort(key)}
                          className="px-4 py-3 font-medium text-muted-foreground text-xs cursor-pointer hover:text-foreground transition-all duration-200"
                        >
                          <div className="flex items-center gap-1">
                            {label}
                            <SortIcon col={key} />
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 font-medium text-muted-foreground text-xs">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          No ranking data yet. Import from GSC or update manually.
                        </td>
                      </tr>
                    )}
                    {sorted.map((row, i) => {
                      const impressions = row.weeklyImpressions ?? row.weekly_impressions ?? 0;
                      const clicks = row.weeklyClicks ?? row.weekly_clicks ?? 0;
                      const rowCtr = row.ctr ?? (impressions > 0 ? (clicks / impressions) * 100 : 0);
                      const prevPos = row.previousPosition ?? row.previous_position;
                      const editRow = editRows[i];

                      return (
                        <tr key={row.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                          <td className="px-4 py-3 max-w-xs">
                            <a
                              href={`/dashboard/seo/articles/${row.articleId ?? row.article_id ?? row.id}`}
                              className="text-foreground hover:text-primary/80 transition-all duration-200 line-clamp-2 text-xs"
                            >
                              {row.title}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{row.keyword ?? '—'}</td>
                          <td className="px-4 py-3">
                            {updateMode && editRow ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={editRow.newPosition}
                                onChange={e => setEditRows(rows => rows.map((r, j) => j === i ? { ...r, newPosition: e.target.value } : r))}
                                className="w-16 px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50"
                              />
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-semibold ${positionBg(row.position)} ${positionColor(row.position)}`}>
                                #{row.position ?? '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{rowCtr.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <PositionChange current={row.position} previous={prevPos} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-2xl text-sm text-foreground">
          {toast}
        </div>
      )}
    </div>
  );
}
