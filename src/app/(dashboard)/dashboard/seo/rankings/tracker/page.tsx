'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Target,
  Globe,
  BarChart3,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PositionSnapshot {
  date: string;
  position: number;
}

interface TrackedKeyword {
  id: string;
  keyword: string;
  position: number;
  previousPosition: number | null;
  url: string;
  volume: number;
  difficulty: number;
  group: string;
  history: PositionSnapshot[];
}

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const GROUPS = ['All', 'Brand', 'Product', 'Long-tail', 'Local', 'Competitor'];

const SEED_KEYWORDS: TrackedKeyword[] = [
  { id: '1', keyword: 'business credit building', position: 3, previousPosition: 5, url: '/blog/business-credit-guide', volume: 4400, difficulty: 62, group: 'Product', history: [{ date: '03/01', position: 12 }, { date: '03/03', position: 10 }, { date: '03/05', position: 8 }, { date: '03/07', position: 6 }, { date: '03/09', position: 5 }, { date: '03/11', position: 4 }, { date: '03/13', position: 3 }] },
  { id: '2', keyword: 'memelli universe', position: 1, previousPosition: 1, url: '/home', volume: 1200, difficulty: 15, group: 'Brand', history: [{ date: '03/01', position: 1 }, { date: '03/03', position: 1 }, { date: '03/05', position: 1 }, { date: '03/07', position: 2 }, { date: '03/09', position: 1 }, { date: '03/11', position: 1 }, { date: '03/13', position: 1 }] },
  { id: '3', keyword: 'ai lead generation tool', position: 8, previousPosition: 14, url: '/features/lead-gen', volume: 6600, difficulty: 74, group: 'Product', history: [{ date: '03/01', position: 22 }, { date: '03/03', position: 19 }, { date: '03/05', position: 16 }, { date: '03/07', position: 14 }, { date: '03/09', position: 12 }, { date: '03/11', position: 10 }, { date: '03/13', position: 8 }] },
  { id: '4', keyword: 'crm for small business', position: 15, previousPosition: 12, url: '/features/crm', volume: 8100, difficulty: 81, group: 'Product', history: [{ date: '03/01', position: 10 }, { date: '03/03', position: 11 }, { date: '03/05', position: 12 }, { date: '03/07', position: 12 }, { date: '03/09', position: 13 }, { date: '03/11', position: 14 }, { date: '03/13', position: 15 }] },
  { id: '5', keyword: 'funding pre-qualification', position: 5, previousPosition: 9, url: '/blog/prequal-guide', volume: 2900, difficulty: 48, group: 'Long-tail', history: [{ date: '03/01', position: 18 }, { date: '03/03', position: 15 }, { date: '03/05', position: 12 }, { date: '03/07', position: 9 }, { date: '03/09', position: 7 }, { date: '03/11', position: 6 }, { date: '03/13', position: 5 }] },
  { id: '6', keyword: 'memelli coaching platform', position: 2, previousPosition: 3, url: '/features/coaching', volume: 880, difficulty: 22, group: 'Brand', history: [{ date: '03/01', position: 5 }, { date: '03/03', position: 4 }, { date: '03/05', position: 4 }, { date: '03/07', position: 3 }, { date: '03/09', position: 3 }, { date: '03/11', position: 3 }, { date: '03/13', position: 2 }] },
  { id: '7', keyword: 'automated seo content', position: 11, previousPosition: 11, url: '/blog/seo-automation', volume: 3300, difficulty: 67, group: 'Product', history: [{ date: '03/01', position: 14 }, { date: '03/03', position: 13 }, { date: '03/05', position: 12 }, { date: '03/07', position: 11 }, { date: '03/09', position: 11 }, { date: '03/11', position: 11 }, { date: '03/13', position: 11 }] },
  { id: '8', keyword: 'best affiliate program 2026', position: 6, previousPosition: 19, url: '/infinity/affiliate', volume: 5200, difficulty: 58, group: 'Competitor', history: [{ date: '03/01', position: 34 }, { date: '03/03', position: 28 }, { date: '03/05', position: 23 }, { date: '03/07', position: 19 }, { date: '03/09', position: 14 }, { date: '03/11', position: 9 }, { date: '03/13', position: 6 }] },
  { id: '9', keyword: 'miami business funding', position: 4, previousPosition: 7, url: '/local/miami-funding', volume: 1600, difficulty: 35, group: 'Local', history: [{ date: '03/01', position: 11 }, { date: '03/03', position: 9 }, { date: '03/05', position: 8 }, { date: '03/07', position: 7 }, { date: '03/09', position: 6 }, { date: '03/11', position: 5 }, { date: '03/13', position: 4 }] },
  { id: '10', keyword: 'white label saas platform', position: 18, previousPosition: 22, url: '/features/white-label', volume: 3700, difficulty: 71, group: 'Long-tail', history: [{ date: '03/01', position: 30 }, { date: '03/03', position: 28 }, { date: '03/05', position: 25 }, { date: '03/07', position: 22 }, { date: '03/09', position: 20 }, { date: '03/11', position: 19 }, { date: '03/13', position: 18 }] },
  { id: '11', keyword: 'ai coaching certification', position: 9, previousPosition: 16, url: '/blog/ai-coaching', volume: 2100, difficulty: 44, group: 'Long-tail', history: [{ date: '03/01', position: 25 }, { date: '03/03', position: 22 }, { date: '03/05', position: 19 }, { date: '03/07', position: 16 }, { date: '03/09', position: 13 }, { date: '03/11', position: 11 }, { date: '03/13', position: 9 }] },
  { id: '12', keyword: 'orlando seo services', position: 22, previousPosition: 20, url: '/local/orlando-seo', volume: 1900, difficulty: 53, group: 'Local', history: [{ date: '03/01', position: 18 }, { date: '03/03', position: 19 }, { date: '03/05', position: 19 }, { date: '03/07', position: 20 }, { date: '03/09', position: 21 }, { date: '03/11', position: 21 }, { date: '03/13', position: 22 }] },
];

/* ------------------------------------------------------------------ */
/*  SVG Line Chart                                                     */
/* ------------------------------------------------------------------ */

function PositionLineChart({ keywords }: { keywords: TrackedKeyword[] }) {
  if (keywords.length === 0) return null;

  const W = 720;
  const H = 260;
  const PAD = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const selected = keywords.slice(0, 5); // show top 5
  const dates = selected[0]?.history.map((h) => h.date) ?? [];
  const allPositions = selected.flatMap((k) => k.history.map((h) => h.position));
  const maxPos = Math.max(...allPositions, 1);
  const minPos = Math.min(...allPositions, 1);
  const range = Math.max(maxPos - minPos, 1);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  const xScale = (i: number) => PAD.left + (i / Math.max(dates.length - 1, 1)) * chartW;
  // Inverted: position 1 at top
  const yScale = (pos: number) => PAD.top + ((pos - minPos) / range) * chartH;

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Position History (Top 5)</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PAD.top + (i / 4) * chartH;
          const pos = Math.round(minPos + (i / 4) * range);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-zinc-500" fontSize={10}>
                #{pos}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {dates.map((d, i) => (
          <text key={d} x={xScale(i)} y={H - 6} textAnchor="middle" className="fill-zinc-500" fontSize={10}>
            {d}
          </text>
        ))}

        {/* Lines */}
        {selected.map((kw, ki) => {
          const points = kw.history.map((h, i) => `${xScale(i)},${yScale(h.position)}`).join(' ');
          return (
            <g key={kw.id}>
              <polyline fill="none" stroke={colors[ki]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
              {kw.history.map((h, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(h.position)} r={3} fill={colors[ki]} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {selected.map((kw, ki) => (
          <div key={kw.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[ki] }} />
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{kw.keyword}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Position Distribution Pie Chart                                    */
/* ------------------------------------------------------------------ */

function PositionPieChart({ keywords }: { keywords: TrackedKeyword[] }) {
  const buckets = useMemo(() => {
    const b = { top3: 0, top10: 0, top20: 0, beyond: 0 };
    keywords.forEach((k) => {
      if (k.position <= 3) b.top3++;
      else if (k.position <= 10) b.top10++;
      else if (k.position <= 20) b.top20++;
      else b.beyond++;
    });
    return b;
  }, [keywords]);

  const total = keywords.length || 1;
  const segments = [
    { label: 'Top 3', count: buckets.top3, color: '#22c55e' },
    { label: '4-10', count: buckets.top10, color: '#eab308' },
    { label: '11-20', count: buckets.top20, color: '#f97316' },
    { label: '20+', count: buckets.beyond, color: '#ef4444' },
  ];

  const R = 70;
  const CX = 90;
  const CY = 90;
  let cumAngle = -Math.PI / 2;

  const arcs = segments
    .filter((s) => s.count > 0)
    .map((s) => {
      const angle = (s.count / total) * 2 * Math.PI;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;
      const largeArc = angle > Math.PI ? 1 : 0;
      const x1 = CX + R * Math.cos(startAngle);
      const y1 = CY + R * Math.sin(startAngle);
      const x2 = CX + R * Math.cos(endAngle);
      const y2 = CY + R * Math.sin(endAngle);
      const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...s, d };
    });

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Position Distribution</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 180 180" className="w-36 h-36 shrink-0">
          {arcs.map((a) => (
            <path key={a.label} d={a.d} fill={a.color} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
          ))}
          <circle cx={CX} cy={CY} r={35} fill="rgb(10,10,14)" />
          <text x={CX} y={CY - 4} textAnchor="middle" className="fill-white font-semibold" fontSize={18}>
            {total}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" className="fill-zinc-500" fontSize={9}>
            keywords
          </text>
        </svg>
        <div className="space-y-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted-foreground w-10">{s.label}</span>
              <span className="text-xs text-foreground font-medium">{s.count}</span>
              <span className="text-xs text-muted-foreground">({((s.count / total) * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Movers                                                         */
/* ------------------------------------------------------------------ */

function TopMovers({ keywords }: { keywords: TrackedKeyword[] }) {
  const movers = useMemo(() => {
    return keywords
      .filter((k) => k.previousPosition !== null)
      .map((k) => ({ ...k, change: (k.previousPosition ?? k.position) - k.position }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);
  }, [keywords]);

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top Movers</h3>
      <div className="space-y-3">
        {movers.map((m) => (
          <div key={m.id} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground truncate">{m.keyword}</p>
              <p className="text-xs text-muted-foreground">#{m.position} position</p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                m.change > 0 ? 'text-emerald-400' : m.change < 0 ? 'text-red-400' : 'text-muted-foreground'
              }`}
            >
              {m.change > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : m.change < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              {m.change > 0 ? '+' : ''}
              {m.change}
            </div>
          </div>
        ))}
        {movers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No movement data yet.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Difficulty bar                                                     */
/* ------------------------------------------------------------------ */

function DifficultyBar({ value }: { value: number }) {
  const color = value <= 30 ? 'bg-emerald-500' : value <= 60 ? 'bg-yellow-500' : value <= 80 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/[0.06]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function RankingsTrackerPage() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>(SEED_KEYWORDS);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newGroup, setNewGroup] = useState('Product');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      const matchGroup = activeGroup === 'All' || k.group === activeGroup;
      const matchSearch = !search || k.keyword.toLowerCase().includes(search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [keywords, activeGroup, search]);

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const kw: TrackedKeyword = {
      id: Date.now().toString(),
      keyword: newKeyword.trim(),
      position: Math.floor(Math.random() * 50) + 1,
      previousPosition: null,
      url: newUrl.trim() || '/',
      volume: Math.floor(Math.random() * 5000) + 500,
      difficulty: Math.floor(Math.random() * 80) + 10,
      group: newGroup,
      history: [],
    };
    setKeywords((prev) => [kw, ...prev]);
    setNewKeyword('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const avgPosition = filtered.length > 0 ? (filtered.reduce((sum, k) => sum + k.position, 0) / filtered.length).toFixed(1) : '--';
  const totalVolume = filtered.reduce((sum, k) => sum + k.volume, 0);
  const improved = filtered.filter((k) => k.previousPosition !== null && k.position < k.previousPosition).length;
  const declined = filtered.filter((k) => k.previousPosition !== null && k.position > k.previousPosition).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
            <span>/</span>
            <a href="/dashboard/seo" className="hover:text-foreground transition-colors">SEO</a>
            <span>/</span>
            <a href="/dashboard/seo/rankings" className="hover:text-foreground transition-colors">Rankings</a>
            <span>/</span>
            <span className="text-foreground">Tracker</span>
          </nav>
          <h1 className="text-2xl font-bold text-white tracking-tight">Keyword Rankings Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track keyword positions, monitor changes, and analyze ranking trends.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Keyword
        </button>
      </div>

      {/* Add keyword form */}
      {showAddForm && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Add New Keyword</h3>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Keyword phrase..."
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/40 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Target URL (e.g. /blog/post)"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/40 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <div className="flex gap-2">
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-red-500/40 transition-colors"
              >
                {GROUPS.filter((g) => g !== 'All').map((g) => (
                  <option key={g} value={g} className="bg-card">
                    {g}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
          <p className="text-3xl font-semibold tracking-tight text-white">{avgPosition}</p>
          <p className="text-xs text-muted-foreground mt-1.5">Avg. Position</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
          <p className="text-3xl font-semibold tracking-tight text-red-400">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-1.5">Tracked Keywords</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
          <p className="text-3xl font-semibold tracking-tight text-emerald-400">{improved}</p>
          <p className="text-xs text-muted-foreground mt-1.5">Improved</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-5 text-center">
          <p className="text-3xl font-semibold tracking-tight text-orange-400">{declined}</p>
          <p className="text-xs text-muted-foreground mt-1.5">Declined</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PositionLineChart keywords={filtered} />
        </div>
        <div className="space-y-4">
          <PositionPieChart keywords={filtered} />
          <TopMovers keywords={filtered} />
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.08] hover:text-foreground'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Position</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Change</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Volume</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((kw) => {
                const change = kw.previousPosition !== null ? kw.previousPosition - kw.position : null;
                return (
                  <tr
                    key={kw.id}
                    onClick={() => setSelectedKeyword(selectedKeyword === kw.id ? null : kw.id)}
                    className={`hover:bg-white/[0.03] transition-colors duration-100 cursor-pointer ${
                      selectedKeyword === kw.id ? 'bg-red-500/[0.04]' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          kw.position <= 3 ? 'text-emerald-400' : kw.position <= 10 ? 'text-amber-400' : kw.position <= 20 ? 'text-orange-400' : 'text-muted-foreground'
                        }`}
                      >
                        #{kw.position}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {change === null ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">NEW</span>
                      ) : change > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                          <TrendingUp className="h-3 w-3" />+{change}
                        </span>
                      ) : change < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
                          <TrendingDown className="h-3 w-3" />{change}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Minus className="h-3 w-3" />0
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">{kw.url}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-foreground tabular-nums">{kw.volume.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3">
                      <DifficultyBar value={kw.difficulty} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-muted-foreground border border-white/[0.06]">
                        {kw.group}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No keywords match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini sparkline for selected keyword */}
      {selectedKeyword && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl p-5">
          {(() => {
            const kw = keywords.find((k) => k.id === selectedKeyword);
            if (!kw || kw.history.length === 0) return <p className="text-sm text-muted-foreground">No history data for this keyword.</p>;
            const minP = Math.min(...kw.history.map((h) => h.position));
            const maxP = Math.max(...kw.history.map((h) => h.position));
            const range = Math.max(maxP - minP, 1);
            const W = 600;
            const H = 80;
            const points = kw.history.map((h, i) => {
              const x = (i / Math.max(kw.history.length - 1, 1)) * W;
              const y = 8 + ((h.position - minP) / range) * (H - 16);
              return `${x},${y}`;
            }).join(' ');

            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Position trend: <span className="text-red-400">{kw.keyword}</span>
                  </h3>
                  <button onClick={() => setSelectedKeyword(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                  <polyline fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
                  {kw.history.map((h, i) => {
                    const x = (i / Math.max(kw.history.length - 1, 1)) * W;
                    const y = 8 + ((h.position - minP) / range) * (H - 16);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={4} fill="#ef4444" />
                        <text x={x} y={y - 8} textAnchor="middle" className="fill-zinc-400" fontSize={9}>
                          #{h.position}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
