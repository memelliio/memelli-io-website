'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart,
  Trophy, AlertTriangle, BarChart2, Percent, RotateCcw,
  ArrowUpRight, ArrowDownRight, Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all';
type Category = 'digital' | 'physical' | 'subscription' | 'service';
type SortKey = 'revenue' | 'units' | 'conversion' | 'refund' | 'aov';

interface Product {
  id: string;
  name: string;
  category: Category;
  revenue: number;
  unitsSold: number;
  views: number;
  refunds: number;
  refundAmount: number;
  /** Revenue history for last 6 months */
  trend: number[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<Category, { label: string; color: string; barColor: string }> = {
  digital:      { label: 'Digital',       color: 'text-violet-400', barColor: '#a78bfa' },
  physical:     { label: 'Physical',      color: 'text-sky-400',    barColor: '#38bdf8' },
  subscription: { label: 'Subscription',  color: 'text-emerald-400', barColor: '#34d399' },
  service:      { label: 'Service',       color: 'text-amber-400',  barColor: '#fbbf24' },
};

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: '7d',  label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'ytd', label: 'YTD' },
  { id: 'all', label: 'All' },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p1',  name: 'Credit Mastery Course',       category: 'digital',      revenue: 142800, unitsSold: 952,  views: 14200, refunds: 28,  refundAmount: 4200,  trend: [18200, 21400, 24800, 22100, 26900, 29400] },
  { id: 'p2',  name: 'Funding Blueprint Pro',        category: 'digital',      revenue: 98400,  unitsSold: 328,  views: 8900,  refunds: 12,  refundAmount: 3600,  trend: [14100, 15800, 16200, 17400, 16900, 18000] },
  { id: 'p3',  name: 'Business Credit Toolkit',      category: 'physical',     revenue: 67200,  unitsSold: 1120, views: 12400, refunds: 45,  refundAmount: 2700,  trend: [9800, 10200, 11400, 11800, 12000, 12000] },
  { id: 'p4',  name: 'VIP Coaching Membership',      category: 'subscription', revenue: 186400, unitsSold: 466,  views: 6200,  refunds: 8,   refundAmount: 3200,  trend: [26400, 28200, 30100, 31400, 34800, 35500] },
  { id: 'p5',  name: 'Credit Repair Starter Kit',    category: 'physical',     revenue: 34800,  unitsSold: 580,  views: 9800,  refunds: 52,  refundAmount: 3120,  trend: [5200, 5400, 5800, 6100, 6200, 6100] },
  { id: 'p6',  name: '1-on-1 Strategy Session',      category: 'service',      revenue: 124600, unitsSold: 249,  views: 4100,  refunds: 3,   refundAmount: 1500,  trend: [18400, 19200, 20800, 21400, 22100, 22700] },
  { id: 'p7',  name: 'Dispute Letter Templates',     category: 'digital',      revenue: 28400,  unitsSold: 1420, views: 18600, refunds: 62,  refundAmount: 1240,  trend: [4200, 4400, 4600, 4800, 5100, 5300] },
  { id: 'p8',  name: 'Elite Annual Membership',      category: 'subscription', revenue: 224800, unitsSold: 281,  views: 3800,  refunds: 5,   refundAmount: 4000,  trend: [32100, 34800, 36200, 38400, 40200, 43100] },
  { id: 'p9',  name: 'Tradeline Package',            category: 'service',      revenue: 78200,  unitsSold: 156,  views: 3200,  refunds: 7,   refundAmount: 3500,  trend: [11200, 12400, 13100, 13400, 13800, 14300] },
  { id: 'p10', name: 'Credit Score Planner',         category: 'digital',      revenue: 15600,  unitsSold: 780,  views: 11200, refunds: 38,  refundAmount: 760,   trend: [2100, 2400, 2600, 2700, 2800, 3000] },
  { id: 'p11', name: 'Funding Accelerator Workshop', category: 'service',      revenue: 52400,  unitsSold: 131,  views: 2800,  refunds: 4,   refundAmount: 1600,  trend: [7200, 8100, 8600, 9200, 9400, 9900] },
  { id: 'p12', name: 'Credit Monitoring Bundle',     category: 'subscription', revenue: 42600,  unitsSold: 710,  views: 7400,  refunds: 32,  refundAmount: 1920,  trend: [6200, 6600, 7000, 7200, 7600, 8000] },
];

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function conversionRate(units: number, views: number): number {
  if (views === 0) return 0;
  return (units / views) * 100;
}

function refundRate(refunds: number, units: number): number {
  if (units === 0) return 0;
  return (refunds / units) * 100;
}

function aov(revenue: number, units: number): number {
  if (units === 0) return 0;
  return revenue / units;
}

// ─── SVG Product Comparison Bar Chart ────────────────────────────────────────

function ProductComparisonChart({
  products,
  metric,
}: {
  products: Product[];
  metric: 'revenue' | 'units' | 'conversion';
}) {
  const sorted = [...products].sort((a, b) => {
    if (metric === 'revenue') return b.revenue - a.revenue;
    if (metric === 'units') return b.unitsSold - a.unitsSold;
    return conversionRate(b.unitsSold, b.views) - conversionRate(a.unitsSold, a.views);
  }).slice(0, 10);

  const values = sorted.map((p) => {
    if (metric === 'revenue') return p.revenue;
    if (metric === 'units') return p.unitsSold;
    return conversionRate(p.unitsSold, p.views);
  });
  const maxVal = Math.max(...values, 1);

  const svgW = 800;
  const svgH = 340;
  const padL = 200;
  const padR = 80;
  const padT = 16;
  const padB = 16;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barH = Math.min(24, (chartH / sorted.length) * 0.7);
  const gap = (chartH - barH * sorted.length) / (sorted.length + 1);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((pct, i) => {
        const x = padL + pct * chartW;
        return (
          <g key={i}>
            <line x1={x} y1={padT} x2={x} y2={svgH - padB} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={x} y={svgH - 2} textAnchor="middle" fontSize="9" className="fill-zinc-600" fontFamily="system-ui">
              {metric === 'revenue' ? fmt(maxVal * pct) : metric === 'units' ? fmtShort(maxVal * pct) : `${(maxVal * pct).toFixed(1)}%`}
            </text>
          </g>
        );
      })}

      {sorted.map((p, i) => {
        const val = values[i];
        const w = (val / maxVal) * chartW;
        const y = padT + gap + i * (barH + gap);
        const meta = CATEGORY_META[p.category];
        const isTop3 = i < 3;
        const isBottom = i >= sorted.length - 2 && sorted.length > 4;

        return (
          <g key={p.id}>
            {/* Product name */}
            <text
              x={padL - 8}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize="10"
              className={isTop3 ? 'fill-zinc-200' : 'fill-zinc-500'}
              fontWeight={isTop3 ? '600' : '400'}
              fontFamily="system-ui"
            >
              {p.name.length > 24 ? p.name.slice(0, 23) + '...' : p.name}
            </text>
            {/* Bar */}
            <rect
              x={padL}
              y={y}
              width={Math.max(w, 2)}
              height={barH}
              rx={4}
              fill={meta.barColor}
              opacity={isBottom ? 0.45 : isTop3 ? 1 : 0.7}
            />
            {/* Value label */}
            <text
              x={padL + w + 6}
              y={y + barH / 2 + 4}
              fontSize="10"
              fontWeight="600"
              className={isTop3 ? 'fill-zinc-200' : isBottom ? 'fill-red-400' : 'fill-zinc-400'}
              fontFamily="system-ui"
            >
              {metric === 'revenue' ? fmt(val) : metric === 'units' ? fmtShort(val) : `${val.toFixed(1)}%`}
            </text>
            {/* Rank badge for top 3 */}
            {isTop3 && (
              <text
                x={padL + 8}
                y={y + barH / 2 + 3.5}
                fontSize="9"
                fontWeight="700"
                className="fill-white"
                fontFamily="system-ui"
              >
                #{i + 1}
              </text>
            )}
            {/* Underperformer flag */}
            {isBottom && (
              <text
                x={padL + w + 6 + (metric === 'revenue' ? 48 : metric === 'units' ? 32 : 40)}
                y={y + barH / 2 + 4}
                fontSize="8"
                fontWeight="600"
                className="fill-red-500"
                fontFamily="system-ui"
              >
                UNDERPERFORMER
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Revenue Trend Sparkline (per product) ───────────────────────────────────

function TrendSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padX = 2;
  const padY = 3;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = padX + chartW;
        const y = padY + chartH - ((last - min) / range) * chartH;
        return <circle cx={x} cy={y} r="2" fill={color} />;
      })()}
    </svg>
  );
}

// ─── Category Breakdown Donut ────────────────────────────────────────────────

function CategoryDonut({ products }: { products: Product[] }) {
  const categories = (Object.keys(CATEGORY_META) as Category[]).map((cat) => {
    const items = products.filter((p) => p.category === cat);
    const revenue = items.reduce((s, p) => s + p.revenue, 0);
    const count = items.length;
    return { cat, revenue, count, ...CATEGORY_META[cat] };
  }).filter((c) => c.revenue > 0);

  const total = categories.reduce((s, c) => s + c.revenue, 0);
  if (total === 0) return null;

  const cx = 100;
  const cy = 100;
  const r = 70;
  const innerR = 48;
  let startAngle = -90;

  const arcs = categories.map((c) => {
    const pct = c.revenue / total;
    const angle = pct * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const ix1 = cx + innerR * Math.cos(startRad);
    const iy1 = cy + innerR * Math.sin(startRad);
    const ix2 = cx + innerR * Math.cos(endRad);
    const iy2 = cy + innerR * Math.sin(endRad);

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    startAngle = endAngle;

    return { ...c, path, pct };
  });

  return (
    <div className="flex items-center gap-8">
      <svg width="200" height="200" viewBox="0 0 200 200" className="flex-shrink-0">
        {arcs.map((arc) => (
          <path key={arc.cat} d={arc.path} fill={arc.barColor} opacity="0.85" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" className="fill-zinc-100" fontFamily="system-ui">
          {fmt(total)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" className="fill-zinc-500" fontFamily="system-ui">
          Total Revenue
        </text>
      </svg>
      <div className="space-y-3">
        {arcs.map((arc) => (
          <div key={arc.cat} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: arc.barColor }} />
            <div>
              <span className="text-sm font-medium text-foreground">{arc.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{(arc.pct * 100).toFixed(1)}%</span>
              <div className="text-[11px] text-muted-foreground">
                {fmt(arc.revenue)} &middot; {arc.count} product{arc.count !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Metric Tile ─────────────────────────────────────────────────────────────

function Tile({
  label,
  value,
  sub,
  icon,
  accent = 'zinc',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'emerald' | 'red' | 'zinc' | 'amber' | 'sky' | 'violet';
}) {
  const accentMap = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    zinc: 'text-foreground',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
    violet: 'text-violet-400',
  };

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProductAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'units' | 'conversion'>('revenue');

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return [...SEED_PRODUCTS];
    return SEED_PRODUCTS.filter((p) => p.category === categoryFilter);
  }, [categoryFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'revenue':    return b.revenue - a.revenue;
        case 'units':      return b.unitsSold - a.unitsSold;
        case 'conversion': return conversionRate(b.unitsSold, b.views) - conversionRate(a.unitsSold, a.views);
        case 'refund':     return refundRate(b.refunds, b.unitsSold) - refundRate(a.refunds, a.unitsSold);
        case 'aov':        return aov(b.revenue, b.unitsSold) - aov(a.revenue, a.unitsSold);
        default:           return 0;
      }
    });
  }, [filtered, sortBy]);

  // Aggregates
  const totalRevenue     = filtered.reduce((s, p) => s + p.revenue, 0);
  const totalUnits       = filtered.reduce((s, p) => s + p.unitsSold, 0);
  const totalViews       = filtered.reduce((s, p) => s + p.views, 0);
  const totalRefunds     = filtered.reduce((s, p) => s + p.refunds, 0);
  const totalRefundAmt   = filtered.reduce((s, p) => s + p.refundAmount, 0);
  const overallConv      = conversionRate(totalUnits, totalViews);
  const overallRefund    = refundRate(totalRefunds, totalUnits);
  const overallAOV       = aov(totalRevenue, totalUnits);

  // Best / Worst
  const bestSeller    = [...filtered].sort((a, b) => b.revenue - a.revenue)[0];
  const worstSeller   = [...filtered].sort((a, b) => a.revenue - b.revenue)[0];

  // Underperformers: refund rate > 5% or conversion < 5%
  const underperformers = filtered.filter(
    (p) => refundRate(p.refunds, p.unitsSold) > 5 || conversionRate(p.unitsSold, p.views) < 5,
  );

  return (
    <div className="min-h-screen bg-card px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Product Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue, units sold, conversion rates, and product health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-card border border-white/[0.04] p-1">
            {DATE_RANGES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === d.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Tile
          label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${filtered.length} products`}
          icon={<DollarSign className="h-4 w-4" />}
          accent="emerald"
        />
        <Tile
          label="Units Sold"
          value={fmtShort(totalUnits)}
          sub={`${fmtShort(totalViews)} total views`}
          icon={<Package className="h-4 w-4" />}
          accent="sky"
        />
        <Tile
          label="Conversion Rate"
          value={`${overallConv.toFixed(1)}%`}
          sub="Views to purchases"
          icon={<Percent className="h-4 w-4" />}
          accent="violet"
        />
        <Tile
          label="Avg Order Value"
          value={fmt(overallAOV)}
          sub="Per unit sold"
          icon={<ShoppingCart className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      {/* Secondary Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <Tile
          label="Refund Rate"
          value={`${overallRefund.toFixed(1)}%`}
          sub={`${totalRefunds} refunds (${fmt(totalRefundAmt)})`}
          icon={<RotateCcw className="h-4 w-4" />}
          accent={overallRefund > 5 ? 'red' : 'zinc'}
        />
        <Tile
          label="Top Seller"
          value={bestSeller ? fmt(bestSeller.revenue) : '--'}
          sub={bestSeller?.name ?? '--'}
          icon={<Trophy className="h-4 w-4" />}
          accent="emerald"
        />
        <Tile
          label="Lowest Performer"
          value={worstSeller ? fmt(worstSeller.revenue) : '--'}
          sub={worstSeller?.name ?? '--'}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="red"
        />
        <Tile
          label="Flagged Products"
          value={`${underperformers.length}`}
          sub="High refund or low conversion"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={underperformers.length > 0 ? 'amber' : 'zinc'}
        />
      </div>

      {/* Product Comparison Chart */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Product Comparison</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top 10 products ranked by selected metric</p>
          </div>
          <div className="flex items-center gap-2">
            {(['revenue', 'units', 'conversion'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  chartMetric === m
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {m === 'revenue' ? 'Revenue' : m === 'units' ? 'Units Sold' : 'Conversion %'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_META[cat].barColor }} />
              {CATEGORY_META[cat].label}
            </div>
          ))}
        </div>

        {filtered.length > 0 ? (
          <ProductComparisonChart products={filtered} metric={chartMetric} />
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <BarChart2 className="h-10 w-10 opacity-20" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-5">Category Breakdown</h2>
          <CategoryDonut products={filtered} />
        </div>

        {/* Revenue Trend per Product (sparklines) */}
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Revenue Trend</h2>
          <p className="text-xs text-muted-foreground mb-5">Monthly revenue per product ({MONTHS[0]} - {MONTHS[MONTHS.length - 1]})</p>
          <div className="space-y-3">
            {[...filtered].sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((p) => {
              const lastTwo = p.trend.slice(-2);
              const trendDir = lastTwo[1] >= lastTwo[0] ? 'up' : 'down';
              const meta = CATEGORY_META[p.category];
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.barColor }} />
                    <span className="text-sm text-foreground truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <TrendSparkline data={p.trend} color={meta.barColor} />
                    <div className="flex items-center gap-1 w-16 justify-end">
                      {trendDir === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs font-medium tabular-nums ${trendDir === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt(lastTwo[1])}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Underperformers Alert */}
      {underperformers.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50 backdrop-blur-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-300 tracking-tight">Flagged Products</h2>
            <span className="text-xs text-amber-500 ml-2">Refund rate &gt; 5% or conversion &lt; 5%</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {underperformers.map((p) => {
              const rr = refundRate(p.refunds, p.unitsSold);
              const cr = conversionRate(p.unitsSold, p.views);
              const flags: string[] = [];
              if (rr > 5) flags.push(`${rr.toFixed(1)}% refund rate`);
              if (cr < 5) flags.push(`${cr.toFixed(1)}% conversion`);
              return (
                <div key={p.id} className="rounded-xl border border-amber-500/10 bg-card p-4">
                  <p className="text-sm font-medium text-foreground mb-1">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mb-2">{CATEGORY_META[p.category].label} &middot; {fmt(p.revenue)}</p>
                  <div className="flex flex-wrap gap-2">
                    {flags.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Product Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">All Products</h2>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                All
              </button>
              {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {CATEGORY_META[cat].label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-muted border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="revenue">Sort: Revenue</option>
              <option value="units">Sort: Units Sold</option>
              <option value="conversion">Sort: Conversion</option>
              <option value="refund">Sort: Refund Rate</option>
              <option value="aov">Sort: AOV</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No products match the current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Product</th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Units</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Conv %</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Refund %</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">AOV</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sorted.map((p, i) => {
                  const cr = conversionRate(p.unitsSold, p.views);
                  const rr = refundRate(p.refunds, p.unitsSold);
                  const pAov = aov(p.revenue, p.unitsSold);
                  const meta = CATEGORY_META[p.category];
                  const isBest  = bestSeller && p.id === bestSeller.id;
                  const isWorst = worstSeller && p.id === worstSeller.id;
                  const isFlagged = rr > 5 || cr < 5;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isBest ? 'bg-emerald-50' : isWorst ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3.5 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="py-3.5 font-medium text-foreground tracking-tight">
                        <div className="flex items-center gap-2">
                          {isBest && <Trophy className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                          {isWorst && <TrendingDown className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                          {isFlagged && !isBest && !isWorst && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                          {p.name}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/[0.04] bg-muted ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400 tabular-nums">{fmt(p.revenue)}</td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{p.unitsSold.toLocaleString()}</td>
                      <td className="py-3.5 text-right tabular-nums">
                        <span className={cr >= 8 ? 'text-emerald-400' : cr >= 5 ? 'text-foreground' : 'text-red-400'}>
                          {cr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right tabular-nums">
                        <span className={rr <= 2 ? 'text-emerald-400' : rr <= 5 ? 'text-foreground' : 'text-red-400'}>
                          {rr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{fmt(pAov)}</td>
                      <td className="py-3.5 text-right">
                        <TrendSparkline data={p.trend} color={meta.barColor} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        {sorted.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-6 text-[11px] text-muted-foreground">
            <span>
              <strong className="text-foreground">{filtered.length}</strong> products
            </span>
            <span>
              Revenue: <strong className="text-emerald-400">{fmt(totalRevenue)}</strong>
            </span>
            <span>
              Units: <strong className="text-foreground">{fmtShort(totalUnits)}</strong>
            </span>
            <span>
              Avg Conv: <strong className="text-foreground">{overallConv.toFixed(1)}%</strong>
            </span>
            <span>
              Avg Refund: <strong className={overallRefund > 5 ? 'text-red-400' : 'text-foreground'}>{overallRefund.toFixed(1)}%</strong>
            </span>
            <span>
              AOV: <strong className="text-amber-400">{fmt(overallAOV)}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
