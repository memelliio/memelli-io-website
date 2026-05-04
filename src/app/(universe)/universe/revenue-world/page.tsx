'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../hooks/useApi';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Globe,
  Zap,
  GraduationCap,
  ShoppingCart,
  Search,
  Code,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Target,
  Crown,
  BarChart3,
  Layers,
  Activity,
  Rocket,
  RefreshCw,
  Copy,
  Check,
  Gauge,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenueStream {
  id: string;
  name: string;
  revenue: number;
  previousRevenue: number;
  growth: number;
  icon: string;
  detail: string;
  sparkline: number[];
}

interface PipelineStage {
  name: string;
  count: number;
  conversionRate: number;
}

interface SubscriptionTier {
  tier: string;
  count: number;
  mrr: number;
  percentOfTotal: number;
  color: string;
}

interface AffiliateLeader {
  name: string;
  referrals: number;
  revenue: number;
}

interface AffiliateNetwork {
  litePartners: number;
  proPartners: number;
  totalReferrals: number;
  commissionPaid: number;
  netRevenue: number;
  topAffiliates: AffiliateLeader[];
}

interface ForecastMonth {
  month: string;
  projected: number;
}

interface Milestone {
  label: string;
  target: number;
  current: number;
}

interface CostItem {
  name: string;
  amount: number;
}

interface Opportunity {
  title: string;
  description: string;
  estimatedValue: number;
  type: 'conversion' | 'upsell' | 'retention' | 'reactivation';
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface RevenueDashboardData {
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    revenueGrowth: number;
    churnRate: number;
    ltv: number;
  };
  streams: RevenueStream[];
  pipeline: PipelineStage[];
  subscriptionTiers: SubscriptionTier[];
  affiliateNetwork: AffiliateNetwork;
  forecast: {
    currentMonth: number;
    nextMonths: ForecastMonth[];
    milestones: Milestone[];
  };
  costs: {
    items: CostItem[];
    totalCosts: number;
    totalRevenue: number;
    margin: number;
    burnRate: number;
    runwayMonths: number;
  };
  opportunities: Opportunity[];
  /** Last 12 months of total revenue — used for trend chart */
  monthlyTrend?: MonthlyRevenue[];
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const DEMO_MONTHLY_TREND: MonthlyRevenue[] = [
  { month: 'Apr 25', revenue: 8_400 },
  { month: 'May 25', revenue: 9_800 },
  { month: 'Jun 25', revenue: 11_200 },
  { month: 'Jul 25', revenue: 12_600 },
  { month: 'Aug 25', revenue: 13_900 },
  { month: 'Sep 25', revenue: 15_400 },
  { month: 'Oct 25', revenue: 16_800 },
  { month: 'Nov 25', revenue: 18_200 },
  { month: 'Dec 25', revenue: 19_700 },
  { month: 'Jan 26', revenue: 21_300 },
  { month: 'Feb 26', revenue: 23_100 },
  { month: 'Mar 26', revenue: 24_850 },
];

const DEMO_DATA: RevenueDashboardData = {
  overview: {
    mrr: 24_850,
    arr: 298_200,
    activeSubscriptions: 312,
    revenueGrowth: 18.4,
    churnRate: 3.2,
    ltv: 2_840,
  },
  streams: [
    { id: 'subscriptions', name: 'Subscriptions', revenue: 14_200, previousRevenue: 12_100, growth: 17.4, icon: 'CreditCard', detail: 'Starter: 180 | Pro: 95 | Enterprise: 37', sparkline: [40, 55, 48, 62, 58, 70, 65, 78, 82, 90, 88, 100] },
    { id: 'affiliate', name: 'Affiliate Commissions', revenue: 3_200, previousRevenue: 2_800, growth: 14.3, icon: 'Users', detail: '284 partners | $11.27 avg payout', sparkline: [30, 35, 42, 38, 50, 55, 48, 60, 58, 65, 70, 72] },
    { id: 'whitelabel', name: 'White-Label Licensing', revenue: 2_995, previousRevenue: 2_495, growth: 20.0, icon: 'Globe', detail: '6 partners | $499/mo avg', sparkline: [20, 25, 30, 28, 35, 40, 38, 45, 50, 55, 58, 60] },
    { id: 'credit', name: 'Credit Report Pulls', revenue: 1_840, previousRevenue: 1_650, growth: 11.5, icon: 'Zap', detail: '920 pulls | $2.00/pull margin', sparkline: [50, 45, 55, 60, 48, 52, 58, 62, 55, 68, 72, 75] },
    { id: 'funding', name: 'Funding Referrals', revenue: 4_500, previousRevenue: 3_200, growth: 40.6, icon: 'DollarSign', detail: '15 closes | $300 avg commission', sparkline: [10, 15, 20, 18, 30, 35, 28, 40, 45, 55, 60, 75] },
    { id: 'coaching', name: 'Coaching Enrollments', revenue: 2_100, previousRevenue: 1_900, growth: 10.5, icon: 'GraduationCap', detail: '42 active students | $50/mo', sparkline: [35, 38, 40, 42, 45, 48, 50, 52, 48, 55, 58, 60] },
    { id: 'commerce', name: 'Commerce Fees', revenue: 1_250, previousRevenue: 980, growth: 27.6, icon: 'ShoppingCart', detail: '$62.5K GMV | 2% take rate', sparkline: [15, 20, 25, 22, 30, 28, 35, 40, 38, 45, 50, 55] },
    { id: 'seo', name: 'SEO Services', revenue: 3_600, previousRevenue: 3_200, growth: 12.5, icon: 'Search', detail: '24 clients | $150/mo avg', sparkline: [40, 45, 42, 50, 48, 55, 52, 58, 60, 65, 68, 72] },
    { id: 'api', name: 'API Access', revenue: 890, previousRevenue: 650, growth: 36.9, icon: 'Code', detail: '18 developers | usage-based', sparkline: [8, 12, 15, 18, 22, 25, 30, 28, 35, 40, 45, 50] },
    { id: 'marketplace', name: 'Marketplace', revenue: 0, previousRevenue: 0, growth: 0, icon: 'Store', detail: 'Coming Soon — listing + transaction fees', sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  pipeline: [
    { name: 'Visitors', count: 12_400, conversionRate: 100 },
    { name: 'Leads', count: 2_480, conversionRate: 20 },
    { name: 'Trials', count: 620, conversionRate: 25 },
    { name: 'Paid', count: 312, conversionRate: 50.3 },
    { name: 'Retained', count: 289, conversionRate: 92.6 },
    { name: 'Expanded', count: 84, conversionRate: 29.1 },
  ],
  subscriptionTiers: [
    { tier: 'Starter', count: 180, mrr: 8_820, percentOfTotal: 57.7, color: '#3B82F6' },
    { tier: 'Pro', count: 95, mrr: 14_155, percentOfTotal: 30.4, color: '#8B5CF6' },
    { tier: 'Enterprise', count: 37, mrr: 18_463, percentOfTotal: 11.9, color: '#F59E0B' },
  ],
  affiliateNetwork: {
    litePartners: 218,
    proPartners: 66,
    totalReferrals: 1_842,
    commissionPaid: 8_450,
    netRevenue: 22_300,
    topAffiliates: [
      { name: 'Marcus Johnson', referrals: 142, revenue: 4_260 },
      { name: 'Sarah Chen', referrals: 98, revenue: 2_940 },
      { name: 'David Park', referrals: 76, revenue: 2_280 },
      { name: 'Lisa Rodriguez', referrals: 61, revenue: 1_830 },
      { name: 'James Wright', referrals: 54, revenue: 1_620 },
    ],
  },
  forecast: {
    currentMonth: 26_200,
    nextMonths: [
      { month: 'Apr 2026', projected: 29_300 },
      { month: 'May 2026', projected: 32_800 },
      { month: 'Jun 2026', projected: 36_700 },
    ],
    milestones: [
      { label: '$10K MRR', target: 10_000, current: 24_850 },
      { label: '$50K MRR', target: 50_000, current: 24_850 },
      { label: '$100K MRR', target: 100_000, current: 24_850 },
    ],
  },
  costs: {
    items: [
      { name: 'Railway (API + DB + Redis)', amount: 2_400 },
      // { name: 'Vercel (Frontend)', amount: 320 },  // neutralized 2026-04-30: vercel deprecated, see CLAUDE.md
      { name: 'Claude API (Anthropic)', amount: 3_800 },
      { name: 'Twilio (SMS/Voice)', amount: 1_200 },
      { name: 'Deepgram (Voice AI)', amount: 450 },
      { name: 'Domain & SSL', amount: 80 },
      { name: 'Monitoring & Logs', amount: 150 },
    ],
    totalCosts: 8_400,
    totalRevenue: 24_850,
    margin: 66.2,
    burnRate: 8_400,
    runwayMonths: 18,
  },
  opportunities: [
    { title: '184 leads not converted', description: 'Leads in pipeline >7 days without trial signup', estimatedValue: 9_200, type: 'conversion' },
    { title: '23 trials expiring this week', description: 'Active trials approaching 14-day limit', estimatedValue: 3_450, type: 'conversion' },
    { title: '67 customers eligible for upsell', description: 'Starter users hitting Pro feature limits', estimatedValue: 6_700, type: 'upsell' },
    { title: '41 affiliates inactive 30+ days', description: 'Partners who stopped referring — re-engage campaign', estimatedValue: 2_050, type: 'reactivation' },
  ],
  monthlyTrend: DEMO_MONTHLY_TREND,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard,
  Users,
  Globe,
  Zap,
  DollarSign,
  GraduationCap,
  ShoppingCart,
  Search,
  Code,
  Store,
};

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  pulse = false,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  pulse?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const [flash, setFlash] = useState(false);
  const frameRef = useRef<number>(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value && pulse) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value, pulse]);

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
    <span className={flash ? 'animate-pulse' : ''}>
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Sparkline (SVG)                                               */
/* ------------------------------------------------------------------ */

function Sparkline({
  data,
  color = '#10B981',
  width = 80,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Trend Line Chart (SVG — last 12 months)                   */
/* ------------------------------------------------------------------ */

function RevenueTrendChart({ data }: { data: MonthlyRevenue[] }) {
  if (!data.length) return null;

  const W = 560;
  const H = 180;
  const PAD_L = 55;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = data.map((d) => d.revenue);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const pts = data.map((d, i) => {
    const x = PAD_L + (i / (data.length - 1)) * chartW;
    const y = PAD_T + chartH - ((d.revenue - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD_T + chartH} L${pts[0].x},${PAD_T + chartH} Z`;

  // Y-axis gridlines (4 steps)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + (range * i) / 4;
    const y = PAD_T + chartH - (i / 4) * chartH;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke="#27272a" strokeWidth="0.5" />
          <text x={PAD_L - 6} y={g.y + 3} textAnchor="end" fill="#71717a" fontSize="9" fontFamily="monospace">
            ${Math.round(g.val / 1000)}k
          </text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#trend-area-grad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#10B981" stroke="#09090b" strokeWidth="1.5" />
          <text
            x={p.x}
            y={PAD_T + chartH + 16}
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
            fontFamily="monospace"
          >
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Source Pie Chart (SVG)                                     */
/* ------------------------------------------------------------------ */

const PIE_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#F97316', '#84CC16',
];

function RevenueSourcePieChart({ streams }: { streams: RevenueStream[] }) {
  const activeStreams = streams.filter((s) => s.revenue > 0);
  const total = activeStreams.reduce((s, st) => s + st.revenue, 0) || 1;

  const SIZE = 180;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 70;
  const INNER_R = 42;

  let cumAngle = -Math.PI / 2; // start at top

  const slices = activeStreams.map((s, i) => {
    const fraction = s.revenue / total;
    const startAngle = cumAngle;
    const sweep = fraction * Math.PI * 2;
    cumAngle += sweep;
    const endAngle = cumAngle;

    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const ix1 = CX + INNER_R * Math.cos(startAngle);
    const iy1 = CY + INNER_R * Math.sin(startAngle);
    const ix2 = CX + INNER_R * Math.cos(endAngle);
    const iy2 = CY + INNER_R * Math.sin(endAngle);

    const largeArc = sweep > Math.PI ? 1 : 0;
    const d = [
      `M${ix1},${iy1}`,
      `L${x1},${y1}`,
      `A${R},${R} 0 ${largeArc} 1 ${x2},${y2}`,
      `L${ix2},${iy2}`,
      `A${INNER_R},${INNER_R} 0 ${largeArc} 0 ${ix1},${iy1}`,
      'Z',
    ].join(' ');

    return { d, color: PIE_COLORS[i % PIE_COLORS.length], name: s.name, pct: (fraction * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        {slices.map((sl, i) => (
          <path key={i} d={sl.d} fill={sl.color} stroke="#09090b" strokeWidth="1.5">
            <title>{sl.name}: {sl.pct}%</title>
          </path>
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
          {formatCurrency(total)}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#71717a" fontSize="9">
          total/mo
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {slices.map((sl, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sl.color }} />
            <span className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">{sl.name}</span>
            <span className="ml-auto text-[10px] font-semibold text-[hsl(var(--foreground))]">{sl.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Growth Badge                                                       */
/* ------------------------------------------------------------------ */

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-[hsl(var(--muted-foreground))]">--</span>;
  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const color = positive ? 'text-emerald-400' : 'text-red-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<any>;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-[#E11D2E]" />
      <h2 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">{title}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass Card                                                         */
/* ------------------------------------------------------------------ */

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Opportunity Type Badge                                             */
/* ------------------------------------------------------------------ */

function OpportunityBadge({ type }: { type: Opportunity['type'] }) {
  const map: Record<Opportunity['type'], { label: string; cls: string }> = {
    conversion: { label: 'Convert', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    upsell: { label: 'Upsell', cls: 'bg-primary/20 text-primary border-primary/30' },
    retention: { label: 'Retain', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    reactivation: { label: 'Re-engage', cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  };
  const { label, cls } = map[type];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Velocity Metric                                            */
/* ------------------------------------------------------------------ */

function computeVelocity(trend: MonthlyRevenue[]): { velocity: number; accelerating: boolean } {
  if (trend.length < 3) return { velocity: 0, accelerating: false };
  const recent = trend.slice(-3);
  const g1 = recent[1].revenue > 0 ? ((recent[1].revenue - recent[0].revenue) / recent[0].revenue) * 100 : 0;
  const g2 = recent[2].revenue > 0 ? ((recent[2].revenue - recent[1].revenue) / recent[1].revenue) * 100 : 0;
  return { velocity: g2, accelerating: g2 > g1 };
}

/* ------------------------------------------------------------------ */
/*  Export to clipboard                                                */
/* ------------------------------------------------------------------ */

function buildRevenueSummary(data: RevenueDashboardData): string {
  const { overview, streams, costs, forecast, opportunities } = data;
  const trend = data.monthlyTrend ?? DEMO_MONTHLY_TREND;
  const { velocity } = computeVelocity(trend);

  const lines: string[] = [
    '=== MEMELLI UNIVERSE  —  Revenue Summary ===',
    '',
    `MRR: ${formatCurrency(overview.mrr)}`,
    `ARR: ${formatCurrency(overview.arr)}`,
    `Active Subscriptions: ${formatNumber(overview.activeSubscriptions)}`,
    `Revenue Growth: ${overview.revenueGrowth.toFixed(1)}%`,
    `Churn Rate: ${overview.churnRate.toFixed(1)}%`,
    `LTV: ${formatCurrency(overview.ltv)}`,
    `Revenue Velocity (MoM): ${velocity.toFixed(1)}%`,
    '',
    '--- Revenue Streams ---',
    ...streams.filter((s) => s.revenue > 0).map((s) => `  ${s.name}: ${formatCurrency(s.revenue)} (${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(1)}%)`),
    '',
    `--- Cost vs Revenue ---`,
    `  Total Revenue: ${formatCurrency(costs.totalRevenue)}`,
    `  Total Costs: ${formatCurrency(costs.totalCosts)}`,
    `  Margin: ${costs.margin.toFixed(1)}%`,
    `  Burn Rate: ${formatCurrency(costs.burnRate)}/mo`,
    `  Runway: ${costs.runwayMonths} months`,
    '',
    '--- Forecast ---',
    `  Current Month: ${formatCurrency(forecast.currentMonth)}`,
    ...forecast.nextMonths.map((m) => `  ${m.month}: ${formatCurrency(m.projected)}`),
    '',
    '--- Opportunities ---',
    ...opportunities.map((o) => `  [${o.type.toUpperCase()}] ${o.title} — ${formatCurrency(o.estimatedValue)}`),
    `  Total: ${formatCurrency(opportunities.reduce((s, o) => s + o.estimatedValue, 0))}`,
    '',
    `Generated: ${new Date().toLocaleString()}`,
  ];

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RevenueWorldPage() {
  const api = useApi();

  /* ---- react-query with 30s polling, graceful demo fallback ---- */
  const { data: apiData, isLoading, dataUpdatedAt, refetch } = useQuery<RevenueDashboardData>({
    queryKey: ['revenue-dashboard'],
    queryFn: async () => {
      const res = await api.get<RevenueDashboardData>('/api/admin/revenue-dashboard');
      if (res.error || !res.data) throw new Error(res.error ?? 'No data');
      return res.data;
    },
    refetchInterval: 30_000,
    retry: 1,
    // On error, react-query keeps previous data or we fall through to DEMO_DATA below
  });

  const data: RevenueDashboardData = apiData ?? DEMO_DATA;
  const isDemo = !apiData;
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  const { overview, streams, pipeline, subscriptionTiers, affiliateNetwork, forecast, costs, opportunities } = data;
  const monthlyTrend = data.monthlyTrend ?? DEMO_MONTHLY_TREND;

  /* ---- Revenue Velocity ---- */
  const { velocity, accelerating } = useMemo(() => computeVelocity(monthlyTrend), [monthlyTrend]);

  /* ---- Export clipboard state ---- */
  const [copied, setCopied] = useState(false);
  const handleExport = useCallback(() => {
    navigator.clipboard.writeText(buildRevenueSummary(data)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data]);

  /* ---- Loading ---- */
  if (isLoading && !apiData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-[#E11D2E]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading Revenue Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-4 py-6 sm:px-6 lg:px-8">
      {/* ---- Page Header ---- */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Revenue Command Center
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Every revenue stream, pipeline, and opportunity in one view
            {isDemo && (
              <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                DEMO DATA
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleExport}
            title="Copy revenue summary to clipboard"
            className="rounded-lg border border-[hsl(var(--border))] bg-white/5 p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-white/10 hover:text-[hsl(var(--foreground))]"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-[hsl(var(--border))] bg-white/5 p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-white/10 hover:text-[hsl(var(--foreground))]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  TOP — Revenue Overview Bar (with MRR pulse + Velocity)          */}
      {/* ================================================================ */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {[
          { label: 'Monthly Recurring Revenue', value: overview.mrr, prefix: '$', icon: DollarSign, accent: 'text-emerald-400', pulse: true },
          { label: 'Annual Recurring Revenue', value: overview.arr, prefix: '$', icon: BarChart3, accent: 'text-emerald-400' },
          { label: 'Active Subscriptions', value: overview.activeSubscriptions, prefix: '', icon: Users, accent: 'text-blue-400' },
          { label: 'Revenue Growth', value: overview.revenueGrowth, prefix: '', suffix: '%', icon: TrendingUp, accent: 'text-emerald-400' },
          { label: 'Churn Rate', value: overview.churnRate, prefix: '', suffix: '%', icon: TrendingDown, accent: 'text-red-400' },
          { label: 'Lifetime Value', value: overview.ltv, prefix: '$', icon: Crown, accent: 'text-amber-400' },
          { label: 'Revenue Velocity', value: Math.round(velocity * 10) / 10, prefix: '', suffix: '%', icon: Gauge, accent: accelerating ? 'text-emerald-400' : 'text-amber-400' },
        ].map((metric) => (
          <GlassCard key={metric.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <metric.icon className={`h-3.5 w-3.5 ${metric.accent}`} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                {metric.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${metric.accent}`}>
              <AnimatedCounter
                value={metric.value}
                prefix={metric.prefix || ''}
                suffix={metric.suffix || ''}
                pulse={(metric as any).pulse}
              />
            </p>
            {metric.label === 'Revenue Velocity' && (
              <span className={`text-[10px] font-medium ${accelerating ? 'text-emerald-400' : 'text-amber-400'}`}>
                {accelerating ? 'Accelerating' : 'Decelerating'}
              </span>
            )}
          </GlassCard>
        ))}
      </div>

      {/* ================================================================ */}
      {/*  SECTION 0.5 — Revenue Trend + Source Pie (new charts)           */}
      {/* ================================================================ */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {/* Trend Line Chart — 3 cols */}
          <GlassCard className="lg:col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#E11D2E]" />
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">Revenue Trend (12 months)</span>
            </div>
            <RevenueTrendChart data={monthlyTrend} />
          </GlassCard>
          {/* Pie Chart — 2 cols */}
          <GlassCard className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#E11D2E]" />
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">Revenue Sources</span>
            </div>
            <RevenueSourcePieChart streams={streams} />
          </GlassCard>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 1 — Revenue Streams Grid                                */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={Layers} title="Revenue Streams" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {streams.map((stream) => {
            const IconComp = ICON_MAP[stream.icon] || DollarSign;
            const isFuture = stream.revenue === 0 && stream.growth === 0;
            return (
              <GlassCard
                key={stream.id}
                className={`relative overflow-hidden transition hover:border-[hsl(var(--border))] ${isFuture ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-[#E11D2E]/10 p-1.5">
                      <IconComp className="h-4 w-4 text-[#E11D2E]" />
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{stream.name}</span>
                  </div>
                  <GrowthBadge value={stream.growth} />
                </div>
                <p className="mt-2 text-lg font-bold text-emerald-400">
                  {isFuture ? '--' : formatCurrency(stream.revenue)}
                </p>
                <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{stream.detail}</p>
                <div className="mt-2">
                  <Sparkline
                    data={stream.sparkline}
                    color={isFuture ? '#52525b' : stream.growth >= 0 ? '#10B981' : '#EF4444'}
                    width={120}
                    height={20}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 2 — Pipeline View                                       */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={Activity} title="Revenue Pipeline" />
        <GlassCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-0">
            {pipeline.map((stage, idx) => {
              const maxCount = pipeline[0].count;
              const heightPct = Math.max((stage.count / maxCount) * 100, 8);
              const isLast = idx === pipeline.length - 1;
              return (
                <div key={stage.name} className="flex flex-1 flex-col items-center gap-1">
                  {/* Bar */}
                  <div className="flex w-full flex-col items-center">
                    <span className="mb-1 text-sm font-bold text-[hsl(var(--foreground))]">
                      {formatNumber(stage.count)}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${Math.round(heightPct * 1.2)}px`,
                        background: `linear-gradient(to top, rgba(225, 29, 46, ${0.15 + (idx * 0.15)}), rgba(16, 185, 129, ${0.1 + (idx * 0.15)}))`,
                        minHeight: '12px',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">{stage.name}</span>
                  {!isLast && (
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {stage.conversionRate}%
                    </span>
                  )}
                  {isLast && (
                    <span className="text-[10px] font-semibold text-amber-400">
                      {stage.conversionRate}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Visitor-to-paid conversion:{' '}
              <span className="font-semibold text-emerald-400">
                {((pipeline[3]?.count || 0) / (pipeline[0]?.count || 1) * 100).toFixed(1)}%
              </span>
            </span>
          </div>
        </GlassCard>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 3 — Subscription Breakdown                              */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={CreditCard} title="Subscription Breakdown" />
        <GlassCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Stacked bar */}
            <div>
              <div className="mb-3 flex h-8 w-full overflow-hidden rounded-lg">
                {subscriptionTiers.map((tier) => (
                  <div
                    key={tier.tier}
                    className="flex items-center justify-center text-[10px] font-bold text-[hsl(var(--foreground))] transition-all duration-700"
                    style={{
                      width: `${tier.percentOfTotal}%`,
                      backgroundColor: tier.color,
                      minWidth: '40px',
                    }}
                  >
                    {tier.percentOfTotal}%
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {subscriptionTiers.map((tier) => (
                  <div key={tier.tier} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{tier.tier}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Tier details */}
            <div className="space-y-2">
              {subscriptionTiers.map((tier) => (
                <div
                  key={tier.tier}
                  className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{tier.tier}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {tier.count} subs
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(tier.mrr)}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 4 — Affiliate Network                                   */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={Users} title="Affiliate Network" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Stats */}
          <GlassCard>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Infinity Lite', value: affiliateNetwork.litePartners, color: 'text-blue-400' },
                { label: 'Infinity Pro', value: affiliateNetwork.proPartners, color: 'text-primary' },
                { label: 'Total Referrals', value: affiliateNetwork.totalReferrals, color: 'text-[hsl(var(--foreground))]' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{s.label}</span>
                  <span className={`text-lg font-bold ${s.color}`}>{formatNumber(s.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Commission Paid</span>
                <p className="text-sm font-bold text-red-400">{formatCurrency(affiliateNetwork.commissionPaid)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Net Revenue</span>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(affiliateNetwork.netRevenue)}</p>
              </div>
            </div>
          </GlassCard>
          {/* Top 5 Leaderboard */}
          <GlassCard>
            <p className="mb-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Top 5 Affiliates
            </p>
            <div className="space-y-1.5">
              {affiliateNetwork.topAffiliates.map((af, idx) => (
                <div
                  key={af.name}
                  className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--foreground))]' : idx === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-[hsl(var(--foreground))]">{af.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{af.referrals} refs</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatCurrency(af.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 5 — Revenue Forecast                                    */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={Rocket} title="Revenue Forecast" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Projections */}
          <GlassCard>
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Current Month Projection</span>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(forecast.currentMonth)}</p>
            </div>
            <div className="space-y-2">
              {forecast.nextMonths.map((m) => (
                <div key={m.month} className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{m.month}</span>
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">{formatCurrency(m.projected)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
          {/* Milestones */}
          <GlassCard>
            <p className="mb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              MRR Milestones
            </p>
            <div className="space-y-3">
              {forecast.milestones.map((ms) => {
                const pct = Math.min((ms.current / ms.target) * 100, 100);
                const reached = pct >= 100;
                return (
                  <div key={ms.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--foreground))]">{ms.label}</span>
                      <span className={`text-xs font-bold ${reached ? 'text-emerald-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {reached ? 'REACHED' : `${pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${pct}%`,
                          background: reached
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #E11D2E, #F87171)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 6 — Cost vs Revenue                                     */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={BarChart3} title="Cost vs Revenue" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Cost breakdown */}
          <GlassCard className="lg:col-span-2">
            <div className="space-y-1.5">
              {costs.items.map((item) => {
                const pct = (item.amount / costs.totalCosts) * 100;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-48 truncate text-xs text-[hsl(var(--muted-foreground))]">{item.name}</span>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                        <div
                          className="h-full rounded-full bg-red-500/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-xs font-semibold text-red-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
          {/* Summary */}
          <GlassCard>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Revenue</span>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(costs.totalRevenue)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Total Costs</span>
                <p className="text-lg font-bold text-red-400">{formatCurrency(costs.totalCosts)}</p>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Margin</span>
                <p className="text-lg font-bold text-emerald-400">{costs.margin.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Burn Rate</span>
                <p className="text-sm font-bold text-red-400">{formatCurrency(costs.burnRate)}/mo</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Runway</span>
                <p className="text-sm font-bold text-amber-400">{costs.runwayMonths} months</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 7 — Opportunities                                       */}
      {/* ================================================================ */}
      <section className="mb-8">
        <SectionHeader icon={Target} title="Revenue Opportunities" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {opportunities.map((opp) => (
            <GlassCard key={opp.title} className="flex flex-col gap-2 transition hover:border-[#E11D2E]/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{opp.title}</span>
                </div>
                <OpportunityBadge type={opp.type} />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{opp.description}</p>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(opp.estimatedValue)} potential
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Total opportunity value:{' '}
            <span className="font-bold text-emerald-400">
              {formatCurrency(opportunities.reduce((sum, o) => sum + o.estimatedValue, 0))}
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}
