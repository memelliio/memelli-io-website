'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Gauge,
  Calendar,
  CreditCard,
  Users,
  ShoppingCart,
  Briefcase,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Rocket,
  Shield,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScenarioProjection {
  month: string;
  best: number;
  expected: number;
  worst: number;
}

interface RevenueSource {
  id: string;
  name: string;
  current: number;
  percentage: number;
  growth: number;
  color: string;
  icon: string;
}

interface Milestone {
  label: string;
  target: number;
  current: number;
  eta: string;
}

interface ForecastData {
  currentMRR: number;
  previousMRR: number;
  mrrGrowthRate: number;
  arr: number;
  monthlyBurn: number;
  cashOnHand: number;
  projections: ScenarioProjection[];
  sources: RevenueSource[];
  milestones: Milestone[];
  breakEven: {
    monthlyExpenses: number;
    currentRevenue: number;
    gap: number;
    achieved: boolean;
    projectedDate: string;
  };
  runway: {
    months: number;
    cashOnHand: number;
    burnRate: number;
    category: 'critical' | 'caution' | 'healthy' | 'strong';
  };
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const GROWTH_RATES = { best: 0.20, expected: 0.12, worst: 0.04 };

function generateProjections(baseMRR: number): ScenarioProjection[] {
  const months = [
    'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026',
    'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026',
    'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027',
  ];
  let best = baseMRR;
  let expected = baseMRR;
  let worst = baseMRR;
  return months.map((month) => {
    best = Math.round(best * (1 + GROWTH_RATES.best / 12 * 3));
    expected = Math.round(expected * (1 + GROWTH_RATES.expected / 12 * 3));
    worst = Math.round(worst * (1 + GROWTH_RATES.worst / 12 * 3));
    return { month, best, expected, worst };
  });
}

const DEMO_DATA: ForecastData = {
  currentMRR: 24_850,
  previousMRR: 21_300,
  mrrGrowthRate: 16.7,
  arr: 298_200,
  monthlyBurn: 8_400,
  cashOnHand: 156_000,
  projections: generateProjections(24_850),
  sources: [
    { id: 'subscriptions', name: 'Subscriptions', current: 14_200, percentage: 57.1, growth: 17.4, color: '#3B82F6', icon: 'CreditCard' },
    { id: 'funding', name: 'Funding Referrals', current: 4_500, percentage: 18.1, growth: 40.6, color: '#10B981', icon: 'DollarSign' },
    { id: 'seo', name: 'SEO Services', current: 3_600, percentage: 14.5, growth: 12.5, color: '#8B5CF6', icon: 'Briefcase' },
    { id: 'affiliates', name: 'Affiliate Commissions', current: 3_200, percentage: 12.9, growth: 14.3, color: '#F59E0B', icon: 'Users' },
    { id: 'whitelabel', name: 'White-Label', current: 2_995, percentage: 12.1, growth: 20.0, color: '#EC4899', icon: 'Shield' },
    { id: 'coaching', name: 'Coaching', current: 2_100, percentage: 8.5, growth: 10.5, color: '#06B6D4', icon: 'Target' },
    { id: 'credit', name: 'Credit Pulls', current: 1_840, percentage: 7.4, growth: 11.5, color: '#F97316', icon: 'Gauge' },
    { id: 'commerce', name: 'Commerce Fees', current: 1_250, percentage: 5.0, growth: 27.6, color: '#14B8A6', icon: 'ShoppingCart' },
    { id: 'api', name: 'API Access', current: 890, percentage: 3.6, growth: 36.9, color: '#A855F7', icon: 'BarChart3' },
  ],
  milestones: [
    { label: '$10K MRR', target: 10_000, current: 24_850, eta: 'Achieved' },
    { label: '$50K MRR', target: 50_000, current: 24_850, eta: 'Oct 2026' },
    { label: '$100K MRR', target: 100_000, current: 24_850, eta: 'Jun 2027' },
    { label: '$250K MRR', target: 250_000, current: 24_850, eta: 'Mar 2028' },
  ],
  breakEven: {
    monthlyExpenses: 8_400,
    currentRevenue: 24_850,
    gap: 0,
    achieved: true,
    projectedDate: 'Achieved',
  },
  runway: {
    months: 18,
    cashOnHand: 156_000,
    burnRate: 8_400,
    category: 'strong',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard, DollarSign, Briefcase, Users, Shield,
  Target, Gauge, ShoppingCart, BarChart3,
};

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {fmtNum(display)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Scenario Projection Chart (SVG)                                    */
/* ------------------------------------------------------------------ */

function ProjectionChart({ data }: { data: ScenarioProjection[] }) {
  const W = 700;
  const H = 260;
  const PAD_L = 60;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 44;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const allVals = data.flatMap((d) => [d.best, d.expected, d.worst]);
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals) * 0.9;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD_T + chartH - ((v - minVal) / range) * chartH;

  const makeLine = (key: 'best' | 'expected' | 'worst') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d[key])}`).join(' ');

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (range * i) / 4;
    const y = PAD_T + chartH - (i / 4) * chartH;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="best-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="worst-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y}
            stroke="#1F2937" strokeWidth="1" strokeDasharray="4,4"
          />
          <text x={PAD_L - 8} y={g.y + 4} textAnchor="end" fill="#6B7280" fontSize="10">
            {fmtCompact(g.val)}
          </text>
        </g>
      ))}

      {/* Area between best and worst */}
      <path
        d={`${makeLine('best')} L${toX(data.length - 1)},${toY(data[data.length - 1].worst)} ${data
          .slice()
          .reverse()
          .map((d, i) => `L${toX(data.length - 1 - i)},${toY(d.worst)}`)
          .join(' ')} Z`}
        fill="#374151" fillOpacity="0.2"
      />

      {/* Best scenario line */}
      <path d={makeLine('best')} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6,3" />
      {/* Expected scenario line */}
      <path d={makeLine('expected')} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
      {/* Worst scenario line */}
      <path d={makeLine('worst')} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="6,3" />

      {/* Dots on expected */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.expected)} r="3" fill="#3B82F6" />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        i % 2 === 0 && (
          <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fill="#6B7280" fontSize="9">
            {d.month.replace(' 20', "'")}
          </text>
        )
      ))}

      {/* End labels */}
      <text x={W - PAD_R + 4} y={toY(data[data.length - 1].best) + 4} fill="#10B981" fontSize="10" fontWeight="600">
        {fmtCompact(data[data.length - 1].best)}
      </text>
      <text x={W - PAD_R + 4} y={toY(data[data.length - 1].expected) + 4} fill="#3B82F6" fontSize="10" fontWeight="600">
        {fmtCompact(data[data.length - 1].expected)}
      </text>
      <text x={W - PAD_R + 4} y={toY(data[data.length - 1].worst) + 4} fill="#EF4444" fontSize="10" fontWeight="600">
        {fmtCompact(data[data.length - 1].worst)}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Source Bar                                                  */
/* ------------------------------------------------------------------ */

function SourceBar({ source, maxRevenue }: { source: RevenueSource; maxRevenue: number }) {
  const IconComp = ICON_MAP[source.icon] || DollarSign;
  const barWidth = Math.max((source.current / maxRevenue) * 100, 2);

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: source.color + '20' }}
      >
        <IconComp size={14} style={{ color: source.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[hsl(var(--foreground))] truncate">{source.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[hsl(var(--foreground))]">{fmt(source.current)}</span>
            <span className={`text-[10px] flex items-center gap-0.5 ${
              source.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {source.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {source.growth.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barWidth}%`, backgroundColor: source.color }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Milestone Progress Bar                                             */
/* ------------------------------------------------------------------ */

function MilestoneBar({ milestone }: { milestone: Milestone }) {
  const progress = Math.min((milestone.current / milestone.target) * 100, 100);
  const achieved = milestone.current >= milestone.target;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {achieved ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Target size={14} className="text-[hsl(var(--muted-foreground))]" />
          )}
          <span className={`text-sm font-semibold ${achieved ? 'text-emerald-400' : 'text-[hsl(var(--foreground))]'}`}>
            {milestone.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
            {fmt(milestone.current)} / {fmt(milestone.target)}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            achieved
              ? 'bg-emerald-900/50 text-emerald-300'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
          }`}>
            {achieved ? 'ACHIEVED' : milestone.eta}
          </span>
        </div>
      </div>
      <div className="h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-1000 relative"
          style={{
            width: `${progress}%`,
            background: achieved
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : `linear-gradient(90deg, #3B82F6, #60A5FA)`,
          }}
        >
          {!achieved && (
            <div className="absolute right-0 top-0 h-full w-1 bg-white/30 animate-pulse" />
          )}
        </div>
        {!achieved && (
          <div
            className="absolute top-0 h-full w-px bg-[hsl(var(--muted-foreground))]"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{progress.toFixed(1)}%</span>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
          {achieved ? '' : `${fmt(milestone.target - milestone.current)} remaining`}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scenario Selector                                                  */
/* ------------------------------------------------------------------ */

type Scenario = 'best' | 'expected' | 'worst';

const SCENARIO_CONFIG: Record<Scenario, { label: string; color: string; rate: string }> = {
  best: { label: 'Best Case', color: '#10B981', rate: '20% annual' },
  expected: { label: 'Expected', color: '#3B82F6', rate: '12% annual' },
  worst: { label: 'Worst Case', color: '#EF4444', rate: '4% annual' },
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function RevenueForecastPage() {
  const [data] = useState<ForecastData>(DEMO_DATA);
  const [activeScenario, setActiveScenario] = useState<Scenario>('expected');
  const [timeframe, setTimeframe] = useState<3 | 6 | 12>(12);

  const visibleProjections = useMemo(
    () => data.projections.slice(0, timeframe),
    [data.projections, timeframe],
  );

  const endProjection = useMemo(() => {
    const last = visibleProjections[visibleProjections.length - 1];
    return last ? last[activeScenario] : data.currentMRR;
  }, [visibleProjections, activeScenario, data.currentMRR]);

  const projectedGrowth = useMemo(
    () => ((endProjection - data.currentMRR) / data.currentMRR) * 100,
    [endProjection, data.currentMRR],
  );

  const mrrChange = data.currentMRR - data.previousMRR;
  const mrrChangePercent = (mrrChange / data.previousMRR) * 100;

  const runwayColor = {
    critical: 'text-red-400',
    caution: 'text-amber-400',
    healthy: 'text-blue-400',
    strong: 'text-emerald-400',
  }[data.runway.category];

  const runwayBg = {
    critical: 'bg-red-900/20 border-red-800/50',
    caution: 'bg-amber-900/20 border-amber-800/50',
    healthy: 'bg-blue-900/20 border-blue-800/50',
    strong: 'bg-emerald-900/20 border-emerald-800/50',
  }[data.runway.category];

  const maxSourceRevenue = Math.max(...data.sources.map((s) => s.current));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            Revenue Forecast
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Projections based on current growth trajectory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Timeframe:</span>
          {([3, 6, 12] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeframe === t
                  ? 'bg-blue-600 text-[hsl(var(--foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {t}M
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current MRR */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Current MRR</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            <AnimatedCounter value={data.currentMRR} prefix="$" />
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            mrrChange >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {mrrChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {fmt(Math.abs(mrrChange))} ({mrrChangePercent.toFixed(1)}%) vs last month
          </div>
        </div>

        {/* Projected MRR */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Projected {timeframe}M
            </span>
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            <AnimatedCounter value={endProjection} prefix="$" />
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-blue-400">
            <ArrowUpRight size={12} />
            +{projectedGrowth.toFixed(1)}% growth ({SCENARIO_CONFIG[activeScenario].label})
          </div>
        </div>

        {/* ARR */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Current ARR</span>
            <Calendar size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            <AnimatedCounter value={data.arr} prefix="$" />
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">MRR x 12 annualized</div>
        </div>

        {/* Growth Rate */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Growth Rate</span>
            <Rocket size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {data.mrrGrowthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Month over month</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Projection Chart — spans 2 cols */}
        <div className="xl:col-span-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Revenue Projections</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {timeframe}-month forecast across three scenarios
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(Object.keys(SCENARIO_CONFIG) as Scenario[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveScenario(s)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    activeScenario === s
                      ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: SCENARIO_CONFIG[s].color }}
                  />
                  {SCENARIO_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <ProjectionChart data={visibleProjections} />

          {/* Scenario summary row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[hsl(var(--border))]">
            {(Object.keys(SCENARIO_CONFIG) as Scenario[]).map((s) => {
              const last = visibleProjections[visibleProjections.length - 1];
              const val = last ? last[s] : data.currentMRR;
              return (
                <div key={s} className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">
                    {SCENARIO_CONFIG[s].label} ({SCENARIO_CONFIG[s].rate})
                  </div>
                  <div className="text-lg font-bold" style={{ color: SCENARIO_CONFIG[s].color }}>
                    {fmt(val)}
                  </div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    +{(((val - data.currentMRR) / data.currentMRR) * 100).toFixed(1)}% from today
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">Revenue by Source</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">Current MRR breakdown</p>
          <div className="space-y-0.5">
            {data.sources.map((s) => (
              <SourceBar key={s.id} source={s} maxRevenue={maxSourceRevenue} />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Total MRR</span>
            <span className="text-sm font-bold text-[hsl(var(--foreground))]">{fmt(data.currentMRR)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Milestones + Break-Even + Runway */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Milestone Progress */}
        <div className="xl:col-span-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Target Milestones</h2>
          </div>
          <div className="space-y-1">
            {data.milestones.map((m) => (
              <MilestoneBar key={m.label} milestone={m} />
            ))}
          </div>
        </div>

        {/* Right Column: Break-Even + Runway stacked */}
        <div className="space-y-6">
          {/* Break-Even Analysis */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Break-Even Analysis</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Monthly Revenue</span>
                <span className="text-sm font-mono text-emerald-400">{fmt(data.breakEven.currentRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Monthly Expenses</span>
                <span className="text-sm font-mono text-red-400">{fmt(data.breakEven.monthlyExpenses)}</span>
              </div>
              <div className="h-px bg-[hsl(var(--muted))]" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Net Profit</span>
                <span className="text-sm font-mono text-emerald-400">
                  {fmt(data.breakEven.currentRevenue - data.breakEven.monthlyExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Margin</span>
                <span className="text-sm font-mono text-emerald-400">
                  {((1 - data.breakEven.monthlyExpenses / data.breakEven.currentRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`mt-2 p-2.5 rounded-lg text-center ${
                data.breakEven.achieved
                  ? 'bg-emerald-900/30 border border-emerald-800/50'
                  : 'bg-amber-900/30 border border-amber-800/50'
              }`}>
                {data.breakEven.achieved ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300">Break-Even Achieved</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">
                      Projected: {data.breakEven.projectedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Runway Calculator */}
          <div className={`rounded-xl p-5 border ${runwayBg}`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className={runwayColor} />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">Runway</h2>
            </div>
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${runwayColor}`}>
                {data.runway.months}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">months of runway</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Cash on Hand</span>
                <span className="text-xs font-mono text-[hsl(var(--foreground))]">{fmt(data.runway.cashOnHand)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Monthly Burn</span>
                <span className="text-xs font-mono text-[hsl(var(--foreground))]">{fmt(data.runway.burnRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Net Burn (after revenue)</span>
                <span className="text-xs font-mono text-emerald-400">
                  {data.currentMRR > data.runway.burnRate
                    ? `+${fmt(data.currentMRR - data.runway.burnRate)}/mo`
                    : `-${fmt(data.runway.burnRate - data.currentMRR)}/mo`
                  }
                </span>
              </div>
            </div>
            {data.currentMRR > data.runway.burnRate && (
              <div className="mt-3 p-2 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-center">
                <span className="text-[10px] text-emerald-300">
                  Revenue exceeds burn rate - cash positive
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Source Donut Visual */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">Revenue Composition</h2>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {(() => {
              const total = data.sources.reduce((a, s) => a + s.current, 0);
              let cumAngle = -90;
              return data.sources.map((s) => {
                const angle = (s.current / total) * 360;
                const startAngle = cumAngle;
                cumAngle += angle;
                const endAngle = cumAngle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;

                const outerR = 90;
                const innerR = 60;

                const x1 = 100 + outerR * Math.cos(startRad);
                const y1 = 100 + outerR * Math.sin(startRad);
                const x2 = 100 + outerR * Math.cos(endRad);
                const y2 = 100 + outerR * Math.sin(endRad);
                const x3 = 100 + innerR * Math.cos(endRad);
                const y3 = 100 + innerR * Math.sin(endRad);
                const x4 = 100 + innerR * Math.cos(startRad);
                const y4 = 100 + innerR * Math.sin(startRad);

                return (
                  <path
                    key={s.id}
                    d={`M${x1},${y1} A${outerR},${outerR} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc} 0 ${x4},${y4} Z`}
                    fill={s.color}
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                );
              });
            })()}
            <text x="100" y="95" textAnchor="middle" fill="#F4F4F5" fontSize="18" fontWeight="700">
              {fmt(data.currentMRR)}
            </text>
            <text x="100" y="115" textAnchor="middle" fill="#71717A" fontSize="10">
              Total MRR
            </text>
          </svg>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {data.sources.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.name}</span>
                <span className="text-xs font-mono text-[hsl(var(--foreground))] ml-auto">{s.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-[hsl(var(--muted-foreground))] py-2">
        Revenue Forecast Dashboard &middot; Memelli Universe &middot; Updated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
