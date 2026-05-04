'use client';

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';
import {
  Target,
  Plus,
  Trash2,
  Flame,
  Thermometer,
  Snowflake,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  Settings,
  History,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Segment = 'hot' | 'warm' | 'cold';

interface ScoringRule {
  id: string;
  field: string;
  condition: string;
  value: string;
  points: number;
  active: boolean;
}

interface AutoAssignRule {
  id: string;
  minScore: number;
  segment: Segment;
  assignTo: string;
  active: boolean;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  score: number;
  segment: Segment;
  lastActivity: string;
  scoreHistory: { date: string; score: number; reason: string }[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FIELDS = [
  'email_opened',
  'page_visits',
  'form_submitted',
  'time_on_site',
  'industry',
  'job_title',
  'company_size',
  'source',
  'country',
  'engagement_count',
];

const CONDITIONS: Record<string, string[]> = {
  email_opened: ['equals', 'greater_than', 'less_than'],
  page_visits: ['greater_than', 'less_than', 'equals'],
  form_submitted: ['equals', 'contains'],
  time_on_site: ['greater_than', 'less_than'],
  industry: ['equals', 'contains', 'not_equals'],
  job_title: ['equals', 'contains', 'not_equals'],
  company_size: ['greater_than', 'less_than', 'equals'],
  source: ['equals', 'not_equals'],
  country: ['equals', 'not_equals'],
  engagement_count: ['greater_than', 'less_than', 'equals'],
};

const CONDITION_LABELS: Record<string, string> = {
  equals: 'equals',
  not_equals: 'not equals',
  greater_than: '> greater than',
  less_than: '< less than',
  contains: 'contains',
};

const SEGMENT_CONFIG: Record<Segment, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  hot: {
    label: 'Hot',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <Flame className="h-4 w-4 text-red-400" />,
  },
  warm: {
    label: 'Warm',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: <Thermometer className="h-4 w-4 text-amber-400" />,
  },
  cold: {
    label: 'Cold',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Snowflake className="h-4 w-4 text-blue-400" />,
  },
};

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const SEED_RULES: ScoringRule[] = [
  { id: 'r1', field: 'page_visits', condition: 'greater_than', value: '5', points: 15, active: true },
  { id: 'r2', field: 'email_opened', condition: 'greater_than', value: '3', points: 10, active: true },
  { id: 'r3', field: 'form_submitted', condition: 'equals', value: 'demo_request', points: 25, active: true },
  { id: 'r4', field: 'job_title', condition: 'contains', value: 'Director', points: 20, active: true },
  { id: 'r5', field: 'company_size', condition: 'greater_than', value: '50', points: 10, active: false },
  { id: 'r6', field: 'source', condition: 'equals', value: 'referral', points: 20, active: true },
  { id: 'r7', field: 'time_on_site', condition: 'greater_than', value: '120', points: 15, active: true },
];

const SEED_AUTO_ASSIGN: AutoAssignRule[] = [
  { id: 'a1', minScore: 80, segment: 'hot' as const, assignTo: 'Sales Agent A', active: true },
  { id: 'a2', minScore: 50, segment: 'warm' as const, assignTo: 'Nurture Agent', active: true },
  { id: 'a3', minScore: 0, segment: 'cold' as const, assignTo: 'Marketing Pool', active: true },
];

function makeHistory(baseScore: number): { date: string; score: number; reason: string }[] {
  const reasons = [
    'Page visit scored',
    'Email opened',
    'Form submitted',
    'Demo requested',
    'Job title matched',
    'Referral source',
    'Time on site threshold',
  ];
  const entries: { date: string; score: number; reason: string }[] = [];
  let s = Math.max(0, baseScore - 45);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 2);
    const bump = Math.floor(Math.random() * 12) + 3;
    s = Math.min(100, s + bump);
    entries.push({ date: d.toISOString().split('T')[0], score: s, reason: reasons[6 - i] });
  }
  entries[entries.length - 1].score = baseScore;
  return entries;
}

const SEED_LEADS: Lead[] = [
  { id: 'l1', name: 'Jordan Mitchell', email: 'jordan@techcorp.io', company: 'TechCorp', score: 92, segment: 'hot' as const, lastActivity: '2026-03-14' },
  { id: 'l2', name: 'Casey Williams', email: 'casey@innovate.co', company: 'InnovateCo', score: 87, segment: 'hot' as const, lastActivity: '2026-03-13' },
  { id: 'l3', name: 'Morgan Lee', email: 'morgan@enterprise.com', company: 'Enterprise Inc', score: 81, segment: 'hot' as const, lastActivity: '2026-03-12' },
  { id: 'l4', name: 'Riley Parker', email: 'riley@growth.io', company: 'GrowthIO', score: 74, segment: 'warm' as const, lastActivity: '2026-03-11' },
  { id: 'l5', name: 'Taylor Chen', email: 'taylor@startup.dev', company: 'StartupDev', score: 68, segment: 'warm' as const, lastActivity: '2026-03-10' },
  { id: 'l6', name: 'Alex Rivera', email: 'alex@media.co', company: 'MediaCo', score: 55, segment: 'warm' as const, lastActivity: '2026-03-09' },
  { id: 'l7', name: 'Sam Nakamura', email: 'sam@design.studio', company: 'Design Studio', score: 42, segment: 'cold' as const, lastActivity: '2026-03-08' },
  { id: 'l8', name: 'Dana Kovac', email: 'dana@logistics.net', company: 'LogiNet', score: 35, segment: 'cold' as const, lastActivity: '2026-03-07' },
  { id: 'l9', name: 'Quinn Foster', email: 'quinn@retail.biz', company: 'RetailBiz', score: 28, segment: 'cold' as const, lastActivity: '2026-03-06' },
  { id: 'l10', name: 'Avery Singh', email: 'avery@finance.co', company: 'FinanceCo', score: 18, segment: 'cold' as const, lastActivity: '2026-03-05' },
].map((l) => ({ ...l, scoreHistory: makeHistory(l.score) }));

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function segmentForScore(score: number): Segment {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-red-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-blue-400';
}

/* ------------------------------------------------------------------ */
/*  SVG Score Distribution Chart                                       */
/* ------------------------------------------------------------------ */

function ScoreDistributionChart({ leads }: { leads: Lead[] }) {
  const buckets = useMemo(() => {
    const b = Array.from({ length: 10 }, (_, i) => ({
      label: `${i * 10}-${i * 10 + 9}`,
      min: i * 10,
      max: i * 10 + 9,
      count: 0,
    }));
    leads.forEach((l) => {
      const idx = Math.min(Math.floor(l.score / 10), 9);
      b[idx].count++;
    });
    return b;
  }, [leads]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const barWidth = 36;
  const gap = 8;
  const chartHeight = 140;
  const chartWidth = buckets.length * (barWidth + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        width={chartWidth + 48}
        height={chartHeight + 40}
        viewBox={`0 0 ${chartWidth + 48} ${chartHeight + 40}`}
        className="mx-auto"
      >
        {buckets.map((b, i) => {
          const barH = maxCount > 0 ? (b.count / maxCount) * chartHeight : 0;
          const x = 24 + i * (barWidth + gap);
          const y = chartHeight - barH;
          const segment = segmentForScore(b.min);
          const fill =
            segment === 'hot'
              ? 'url(#grad-hot)'
              : segment === 'warm'
                ? 'url(#grad-warm)'
                : 'url(#grad-cold)';

          return (
            <g key={b.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={fill}
                className="transition-all duration-300"
              />
              {b.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-zinc-300 text-[11px] font-medium"
                >
                  {b.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px]"
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="grad-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="grad-warm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="grad-cold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score History Mini-Chart                                            */
/* ------------------------------------------------------------------ */

function ScoreHistoryChart({ history }: { history: { date: string; score: number; reason: string }[] }) {
  if (history.length === 0) return null;
  const w = 280;
  const h = 60;
  const padX = 8;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const step = innerW / (history.length - 1 || 1);

  const points = history.map((e, i) => ({
    x: padX + i * step,
    y: padY + innerH - (e.score / 100) * innerH,
    ...e,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${h - padY} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${h - padY} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="hist-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#hist-fill)" />
      <polyline points={polyline} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#ef4444" stroke="#18181b" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function LeadScoringPage() {
  /* ---- API Data ---- */
  const { data: apiScoringConfig, isError } = useApiQuery<any>(
    ['lead-scoring-rules'],
    '/api/leads/scoring/rules'
  );
  const isDemo = isError || !apiScoringConfig;

  const [rules, setRules] = useState<ScoringRule[]>(SEED_RULES);
  const [autoAssign, setAutoAssign] = useState<AutoAssignRule[]>(SEED_AUTO_ASSIGN);
  const [leads] = useState<Lead[]>(SEED_LEADS);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  /* Sync API rules when available */
  useEffect(() => {
    const apiRules = (apiScoringConfig as any)?.rules;
    if (Array.isArray(apiRules) && apiRules.length > 0) {
      setRules(apiRules.map((r: any, i: number) => ({
        id: `api_r${i}`,
        field: r.field ?? 'page_visits',
        condition: r.operator ?? 'equals',
        value: String(r.value ?? ''),
        points: Number(r.weight ?? 10),
        active: true,
      })));
    }
  }, [apiScoringConfig]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'leads' | 'auto-assign'>('rules');

  // New rule form state
  const [newField, setNewField] = useState(FIELDS[0]);
  const [newCondition, setNewCondition] = useState(CONDITIONS[FIELDS[0]][0]);
  const [newValue, setNewValue] = useState('');
  const [newPoints, setNewPoints] = useState(10);

  const segmentCounts = useMemo(() => {
    const counts: Record<Segment, number> = { hot: 0, warm: 0, cold: 0 };
    leads.forEach((l) => counts[l.segment]++);
    return counts;
  }, [leads]);

  const totalPossiblePoints = useMemo(
    () => rules.filter((r) => r.active).reduce((sum, r) => sum + r.points, 0),
    [rules],
  );

  const avgScore = useMemo(
    () => (leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0),
    [leads],
  );

  const sortedLeads = useMemo(() => [...leads].sort((a, b) => b.score - a.score), [leads]);

  /* -- Handlers -- */
  const addRule = useCallback(() => {
    if (!newValue.trim()) return;
    setRules((prev) => [
      ...prev,
      { id: uid(), field: newField, condition: newCondition, value: newValue.trim(), points: newPoints, active: true },
    ]);
    setNewValue('');
    setNewPoints(10);
    setShowRuleForm(false);
  }, [newField, newCondition, newValue, newPoints]);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }, []);

  const toggleAutoAssign = useCallback((id: string) => {
    setAutoAssign((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }, []);

  const selectClasses =
    'w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/40 appearance-none';
  const inputClasses =
    'w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500/40';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {isDemo && <DemoBanner reason="No scoring rules from API" />}
      {/* -- Header -- */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
          <span>/</span>
          <a href="/dashboard/leads" className="hover:text-foreground transition-colors">Leads</a>
          <span>/</span>
          <span className="text-foreground">Scoring</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20">
              <Target className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Lead Scoring</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{leads.length} leads scored across {rules.filter(r => r.active).length} active rules</p>
            </div>
          </div>
        </div>
      </div>

      {/* -- Segment Cards + Stats -- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Segment cards */}
        {(['hot', 'warm', 'cold'] as Segment[]).map((seg) => {
          const cfg = SEGMENT_CONFIG[seg];
          return (
            <div
              key={seg}
              className={`rounded-2xl border ${cfg.border} ${cfg.bg} backdrop-blur-xl p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                {cfg.icon}
                <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className={`text-3xl font-bold tabular-nums ${cfg.color}`}>{segmentCounts[seg]}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {seg === 'hot' ? 'Score 80+' : seg === 'warm' ? 'Score 50-79' : 'Score 0-49'}
              </p>
            </div>
          );
        })}

        {/* Avg score */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Avg Score</span>
          </div>
          <div className={`text-3xl font-bold tabular-nums ${scoreColor(avgScore)}`}>{avgScore}</div>
          <p className="text-xs text-muted-foreground mt-1">Across all leads</p>
        </div>

        {/* Max possible */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Max Points</span>
          </div>
          <div className="text-3xl font-bold tabular-nums text-foreground">{totalPossiblePoints}</div>
          <p className="text-xs text-muted-foreground mt-1">From active rules</p>
        </div>
      </div>

      {/* -- Score Distribution Chart -- */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Score Distribution</h2>
        <ScoreDistributionChart leads={leads} />
      </div>

      {/* -- Tabs -- */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/[0.04]">
        {[
          { key: 'rules' as const, label: 'Scoring Rules', icon: <Settings className="h-4 w-4" /> },
          { key: 'leads' as const, label: 'Lead Rankings', icon: <Users className="h-4 w-4" /> },
          { key: 'auto-assign' as const, label: 'Auto-Assign', icon: <Zap className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === tab.key
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  TAB: Scoring Rules                                          */}
      {/* ============================================================ */}
      {activeTab === 'rules' && (
        <div>
          {/* Add rule button / form */}
          {!showRuleForm ? (
            <button
              onClick={() => setShowRuleForm(true)}
              className="mb-6 flex items-center gap-2 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150 w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Add Scoring Rule
            </button>
          ) : (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-red-400">New Scoring Rule</h3>
                <button onClick={() => setShowRuleForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Field</label>
                  <select
                    value={newField}
                    onChange={(e) => {
                      setNewField(e.target.value);
                      setNewCondition(CONDITIONS[e.target.value][0]);
                    }}
                    className={selectClasses}
                  >
                    {FIELDS.map((f) => (
                      <option key={f} value={f} className="bg-card">
                        {f.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className={selectClasses}
                  >
                    {(CONDITIONS[newField] || []).map((c) => (
                      <option key={c} value={c} className="bg-card">
                        {CONDITION_LABELS[c] || c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g. 5, CEO, referral"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Points</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newPoints}
                      onChange={(e) => setNewPoints(Number(e.target.value))}
                      min={-50}
                      max={100}
                      className={inputClasses}
                    />
                    <button
                      onClick={addRule}
                      disabled={!newValue.trim()}
                      className="shrink-0 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors duration-150"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rules table */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Active</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Field</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Condition</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Value</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Points</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors duration-100 ${
                      !rule.active ? 'opacity-40' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`h-5 w-9 rounded-full transition-colors duration-150 relative ${
                          rule.active ? 'bg-red-500' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                            rule.active ? 'left-[18px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-foreground capitalize">{rule.field.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-muted-foreground">{CONDITION_LABELS[rule.condition] || rule.condition}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-foreground font-mono">
                        {rule.value}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`font-semibold tabular-nums text-sm ${
                          rule.points > 0 ? 'text-emerald-400' : rule.points < 0 ? 'text-red-400' : 'text-muted-foreground'
                        }`}
                      >
                        {rule.points > 0 ? '+' : ''}
                        {rule.points}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      No scoring rules defined. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  TAB: Lead Rankings                                          */}
      {/* ============================================================ */}
      {activeTab === 'leads' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 w-10">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Lead</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Company</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Score</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Segment</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Last Activity</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead, idx) => {
                const seg = SEGMENT_CONFIG[lead.segment];
                const isExpanded = expandedLead === lead.id;
                return (
                  <Fragment key={lead.id}>
                    <tr
                      onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors duration-100 cursor-pointer"
                    >
                      <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                lead.score >= 80
                                  ? 'bg-red-500'
                                  : lead.score >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className={`font-bold tabular-nums text-sm ${scoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${seg.bg} ${seg.border} ${seg.color}`}
                        >
                          {seg.icon}
                          {seg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {new Date(lead.lastActivity).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-white/[0.02]">
                        <td colSpan={7} className="px-5 py-4 bg-white/[0.01]">
                          <div className="flex items-start gap-6">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Score History
                                </h4>
                              </div>
                              <ScoreHistoryChart history={lead.scoreHistory} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                                Score Events
                              </h4>
                              <div className="space-y-1.5">
                                {lead.scoreHistory.map((e, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-muted-foreground">{e.date}</span>
                                    <span className="text-foreground flex-1 mx-3 truncate">{e.reason}</span>
                                    <span className={`font-semibold tabular-nums ${scoreColor(e.score)}`}>
                                      {e.score}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  TAB: Auto-Assign Rules                                      */}
      {/* ============================================================ */}
      {activeTab === 'auto-assign' && (
        <div className="space-y-4">
          {autoAssign.map((rule) => {
            const seg = SEGMENT_CONFIG[rule.segment];
            return (
              <div
                key={rule.id}
                className={`rounded-2xl border backdrop-blur-xl p-5 transition-opacity duration-150 ${
                  rule.active
                    ? `${seg.border} ${seg.bg}`
                    : 'border-white/[0.04] bg-white/[0.02] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {seg.icon}
                      <span className={`text-sm font-semibold ${seg.color}`}>{seg.label} Leads</span>
                    </div>
                    <div className="h-4 w-px bg-white/[0.06]" />
                    <div className="text-sm text-foreground">
                      Score <span className="font-mono font-semibold text-foreground">&ge; {rule.minScore}</span>
                    </div>
                    <div className="h-4 w-px bg-white/[0.06]" />
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-muted-foreground">Assign to:</span>
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs font-medium text-foreground">
                        {rule.assignTo}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAutoAssign(rule.id)}
                    className={`h-5 w-9 rounded-full transition-colors duration-150 relative ${
                      rule.active ? 'bg-red-500' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
                        rule.active ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 mt-6">
            <h3 className="text-sm font-medium text-foreground mb-3">How Auto-Assign Works</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                When a lead's score crosses a threshold, they are automatically assigned to the configured agent or pool.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Rules are evaluated top-down. The first matching rule wins.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Score changes trigger re-evaluation, so leads can move between segments automatically.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
