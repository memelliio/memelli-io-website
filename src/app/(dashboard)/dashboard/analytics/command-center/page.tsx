'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DollarSign, Users, Eye, TrendingUp, Globe, Megaphone,
  Bot, CheckCircle2, ArrowUpRight, ArrowDownRight, Activity,
  Download, Sparkles, Calendar, ChevronDown, ShoppingCart,
  UserPlus, FileText, MousePointerClick, Clock, Zap,
  BarChart3, PieChart as PieChartIcon, Search, RefreshCw,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface KPI {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: React.ComponentType<any>;
  format?: 'currency' | 'number' | 'percent';
}

interface RevenuePoint {
  date: string;
  amount: number;
}

interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface TopPage {
  page: string;
  views: number;
  bounceRate: number;
  avgTime: string;
}

interface Campaign {
  name: string;
  spend: number;
  leads: number;
  cpa: number;
  roi: number;
  status: 'active' | 'paused' | 'completed';
}

interface RecentEvent {
  id: string;
  type: 'signup' | 'purchase' | 'pageview' | 'form_submission';
  description: string;
  timestamp: Date;
}

type DateRange = 'today' | '7d' | '30d' | '90d' | 'custom';

/* ================================================================== */
/*  MOCK DATA GENERATORS                                               */
/* ================================================================== */

function generateRevenueData(days: number): RevenuePoint[] {
  const data: RevenuePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().slice(0, 10),
      amount: Math.floor(800 + Math.random() * 4200 + Math.sin(i / 3) * 1500),
    });
  }
  return data;
}

const TRAFFIC_SOURCES: TrafficSource[] = [
  { name: 'Organic', value: 42, color: '#ef4444' },
  { name: 'Paid', value: 24, color: '#f97316' },
  { name: 'Referral', value: 15, color: '#eab308' },
  { name: 'Social', value: 12, color: '#3b82f6' },
  { name: 'Direct', value: 7, color: '#f59e0b' },
];

const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Visitors', value: 24830, color: '#ef4444' },
  { label: 'Leads', value: 4210, color: '#f97316' },
  { label: 'Trials', value: 1450, color: '#eab308' },
  { label: 'Customers', value: 612, color: '#22c55e' },
];

const TOP_PAGES: TopPage[] = [
  { page: '/pricing', views: 8420, bounceRate: 32.1, avgTime: '2:45' },
  { page: '/features', views: 6310, bounceRate: 28.4, avgTime: '3:12' },
  { page: '/blog/ai-automation', views: 5180, bounceRate: 45.2, avgTime: '4:30' },
  { page: '/signup', views: 4920, bounceRate: 18.7, avgTime: '1:58' },
  { page: '/case-studies', views: 3740, bounceRate: 35.6, avgTime: '5:15' },
  { page: '/integrations', views: 2890, bounceRate: 41.3, avgTime: '2:22' },
];

const CAMPAIGNS: Campaign[] = [
  { name: 'Q1 Launch Campaign', spend: 12400, leads: 342, cpa: 36.26, roi: 285, status: 'active' },
  { name: 'Retargeting - Trials', spend: 4800, leads: 186, cpa: 25.81, roi: 412, status: 'active' },
  { name: 'Brand Awareness', spend: 8200, leads: 124, cpa: 66.13, roi: 145, status: 'paused' },
  { name: 'Partner Webinar', spend: 2100, leads: 89, cpa: 23.60, roi: 520, status: 'completed' },
];

const EVENT_TYPES = ['signup', 'purchase', 'pageview', 'form_submission'] as const;
const EVENT_DESCRIPTIONS: Record<string, string[]> = {
  signup: ['New user registered from organic search', 'Affiliate signup via partner link', 'Trial account created from webinar'],
  purchase: ['Pro plan purchased — $99/mo', 'Enterprise upgrade — $299/mo', 'Add-on: AI Agent Pack — $49'],
  pageview: ['Pricing page viewed (returning visitor)', 'Case study downloaded', 'Feature comparison opened'],
  form_submission: ['Contact form submitted', 'Demo request from enterprise lead', 'Newsletter subscription'],
};

function generateEvents(count: number): RecentEvent[] {
  const events: RecentEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const descs = EVENT_DESCRIPTIONS[type];
    events.push({
      id: `evt-${i}`,
      type,
      description: descs[Math.floor(Math.random() * descs.length)],
      timestamp: new Date(now - i * 45000 - Math.random() * 30000),
    });
  }
  return events;
}

/* ================================================================== */
/*  ANIMATED COUNTER HOOK                                              */
/* ================================================================== */

function useAnimatedCounter(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(from + (target - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}

/* ================================================================== */
/*  SPARKLINE COMPONENT                                                */
/* ================================================================== */

function Sparkline({ data, width = 120, height = 32, color = '#ef4444' }: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/*  KPI CARD                                                           */
/* ================================================================== */

function KPICard({ kpi }: { kpi: KPI }) {
  const animated = useAnimatedCounter(kpi.value);
  const Icon = kpi.icon;
  const isPositive = kpi.change >= 0;

  const formatted = useMemo(() => {
    if (kpi.format === 'currency') return `$${animated.toLocaleString()}`;
    if (kpi.format === 'percent') return `${(animated / 10).toFixed(1)}%`;
    return animated.toLocaleString();
  }, [animated, kpi.format]);

  return (
    <div className="relative group rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 hover:border-red-500/30 transition-all duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{kpi.label}</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {kpi.prefix}{formatted}{kpi.suffix}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-400" />
        </div>
      </div>
      <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(kpi.change)}% vs prev period
      </div>
    </div>
  );
}

/* ================================================================== */
/*  REVENUE LINE CHART (CSS/SVG)                                       */
/* ================================================================== */

function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { path, areaPath, points, maxVal, minVal } = useMemo(() => {
    if (!data.length) return { path: '', areaPath: '', points: [], maxVal: 0, minVal: 0 };

    const w = 1000;
    const h = 280;
    const padX = 40;
    const padY = 30;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    const amounts = data.map(d => d.amount);
    const mx = Math.max(...amounts);
    const mn = Math.min(...amounts) * 0.85;
    const range = mx - mn || 1;

    const pts = data.map((d, i) => ({
      x: padX + (i / (data.length - 1)) * chartW,
      y: padY + chartH - ((d.amount - mn) / range) * chartH,
      amount: d.amount,
      date: d.date,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${linePath} L ${pts[pts.length - 1].x} ${padY + chartH} L ${pts[0].x} ${padY + chartH} Z`;

    return { path: linePath, areaPath: area, points: pts, maxVal: mx, minVal: mn };
  }, [data]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = maxVal - minVal;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(minVal + (range * i) / 4));
    }
    return ticks;
  }, [maxVal, minVal]);

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
            <p className="text-xs text-white/40 mt-0.5">Last 30 days performance</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="w-3 h-0.5 bg-red-500 rounded-full" />
            Daily Revenue
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 1000 280"
          className="w-full h-auto"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = 30 + 220 - ((tick - minVal) / ((maxVal - minVal) || 1)) * 220;
            return (
              <g key={i}>
                <line x1="40" y1={y} x2="960" y2={y} stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
                <text x="35" y={y + 4} textAnchor="end" fill="white" fillOpacity="0.25" fontSize="10">
                  ${(tick / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Line */}
          <path d={path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover zones */}
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
              <rect
                x={p.x - (1000 / data.length) / 2}
                y="0"
                width={1000 / data.length}
                height="280"
                fill="transparent"
                className="cursor-crosshair"
              />
              {hoveredIdx === i && (
                <>
                  <line x1={p.x} y1="30" x2={p.x} y2="250" stroke="white" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <circle cx={p.x} cy={p.y} r="5" fill="#ef4444" stroke="#1a1a1a" strokeWidth="2" />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute pointer-events-none bg-background border border-white/10 rounded-lg px-3 py-2 text-xs backdrop-blur-sm"
            style={{
              left: `${(points[hoveredIdx].x / 1000) * 100}%`,
              top: '60px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-white/50">{points[hoveredIdx].date}</p>
            <p className="text-white font-bold">${points[hoveredIdx].amount.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PIE CHART (SVG)                                                    */
/* ================================================================== */

function TrafficPieChart({ sources }: { sources: TrafficSource[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = sources.reduce((s, src) => s + src.value, 0);

  const slices = useMemo(() => {
    let cumAngle = -90;
    return sources.map((src) => {
      const angle = (src.value / total) * 360;
      const startAngle = cumAngle;
      cumAngle += angle;
      const endAngle = cumAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const largeArc = angle > 180 ? 1 : 0;

      const cx = 100, cy = 100, r = 80;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      return {
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: src.color,
        name: src.name,
        value: src.value,
      };
    });
  }, [sources, total]);

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <h3 className="text-sm font-semibold text-white mb-4">Traffic Sources</h3>
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 200 200" className="w-40 h-40 flex-shrink-0">
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.path}
                fill={slice.color}
                opacity={hovered === null || hovered === i ? 1 : 0.3}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="transition-opacity duration-200 cursor-pointer"
                stroke="#0a0a0a"
                strokeWidth="1"
              />
            ))}
            <circle cx="100" cy="100" r="45" fill="#0a0a0a" />
            <text x="100" y="96" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
              {hovered !== null ? `${slices[hovered].value}%` : `${total}%`}
            </text>
            <text x="100" y="112" textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="9">
              {hovered !== null ? slices[hovered].name : 'Total'}
            </text>
          </svg>
          <div className="space-y-2 flex-1">
            {sources.map((src, i) => (
              <div
                key={src.name}
                className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-md transition-colors ${hovered === i ? 'bg-white/[0.05]' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                  <span className="text-white/70">{src.name}</span>
                </div>
                <span className="text-white font-semibold">{src.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CONVERSION FUNNEL                                                  */
/* ================================================================== */

function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const widthPct = (stage.value / stages[0].value) * 100;
            const dropOff = i > 0
              ? (((stages[i - 1].value - stage.value) / stages[i - 1].value) * 100).toFixed(1)
              : null;

            return (
              <div key={stage.label}>
                {dropOff && (
                  <div className="flex items-center gap-2 mb-1 ml-2">
                    <ArrowDownRight className="w-3 h-3 text-red-400/60" />
                    <span className="text-[10px] text-red-400/60">-{dropOff}% drop-off</span>
                  </div>
                )}
                <div className="relative">
                  <div
                    className="h-11 rounded-lg flex items-center px-4 transition-all duration-500"
                    style={{
                      width: `${Math.max(widthPct, 20)}%`,
                      backgroundColor: `${stage.color}20`,
                      borderLeft: `3px solid ${stage.color}`,
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium text-white/80">{stage.label}</span>
                      <span className="text-sm font-bold text-white">{stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/40">Overall conversion</span>
          <span className="text-sm font-bold text-emerald-400">
            {((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TOP PAGES TABLE                                                    */
/* ================================================================== */

function TopPagesTable({ pages }: { pages: TopPage[] }) {
  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <h3 className="text-sm font-semibold text-white mb-4">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-white/40 font-medium pb-3 pr-4">Page</th>
                <th className="text-right text-white/40 font-medium pb-3 px-3">Views</th>
                <th className="text-right text-white/40 font-medium pb-3 px-3">Bounce</th>
                <th className="text-right text-white/40 font-medium pb-3 pl-3">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.page} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <span className="text-white/80 font-mono text-[11px]">{page.page}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-white font-semibold tabular-nums">{page.views.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={page.bounceRate > 40 ? 'text-red-400' : page.bounceRate > 30 ? 'text-yellow-400' : 'text-emerald-400'}>
                      {page.bounceRate}%
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right text-white/60 tabular-nums">{page.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CAMPAIGN CARDS                                                     */
/* ================================================================== */

function CampaignCards({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <h3 className="text-sm font-semibold text-white mb-4">Campaign Performance</h3>
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/[0.1] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/90">{c.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                  c.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-white/5 text-white/40'
                }`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-[11px]">
                <div>
                  <p className="text-white/30 mb-0.5">Spend</p>
                  <p className="text-white font-semibold">${c.spend.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/30 mb-0.5">Leads</p>
                  <p className="text-white font-semibold">{c.leads}</p>
                </div>
                <div>
                  <p className="text-white/30 mb-0.5">CPA</p>
                  <p className="text-white font-semibold">${c.cpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-white/30 mb-0.5">ROI</p>
                  <p className={`font-semibold ${c.roi > 200 ? 'text-emerald-400' : c.roi > 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {c.roi}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ACTIVE USERS CARD                                                  */
/* ================================================================== */

function ActiveUsersCard() {
  const [activeUsers, setActiveUsers] = useState(347);
  const [sparkData, setSparkData] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => 200 + Math.floor(Math.random() * 200))
  );
  const animated = useAnimatedCounter(activeUsers);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 20 - 8));
      setSparkData(prev => [...prev.slice(1), 200 + Math.floor(Math.random() * 200)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Active Users Right Now</h3>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-bold text-white tabular-nums">{animated}</p>
            <p className="text-xs text-white/40 mt-1">real-time connected sessions</p>
          </div>
          <Sparkline data={sparkData} width={140} height={48} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EVENTS FEED                                                        */
/* ================================================================== */

function EventsFeed({ events }: { events: RecentEvent[] }) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    signup: UserPlus,
    purchase: ShoppingCart,
    pageview: Eye,
    form_submission: FileText,
  };

  const colorMap: Record<string, string> = {
    signup: 'text-emerald-400 bg-emerald-500/10',
    purchase: 'text-yellow-400 bg-yellow-500/10',
    pageview: 'text-blue-400 bg-blue-500/10',
    form_submission: 'text-primary bg-primary/10',
  };

  function timeAgo(ts: Date): string {
    const diff = Math.floor((Date.now() - ts.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Events</h3>
          <Activity className="w-4 h-4 text-white/30" />
        </div>
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
          {events.map((evt) => {
            const Icon = iconMap[evt.type] || Zap;
            const cls = colorMap[evt.type] || 'text-white/40 bg-white/5';
            return (
              <div key={evt.id} className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${cls}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/80 truncate">{evt.description}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(evt.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DATE RANGE SELECTOR                                                */
/* ================================================================== */

function DateRangeSelector({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  const options: { label: string; value: DateRange }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt.value
              ? 'bg-red-500/20 text-red-400 shadow-sm'
              : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function AnalyticsCommandCenterPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [events] = useState(() => generateEvents(20));

  const daysMap: Record<DateRange, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90, custom: 30 };
  const revenueData = useMemo(() => generateRevenueData(daysMap[dateRange]), [dateRange]);

  const totalRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.amount, 0), [revenueData]);

  const kpis: KPI[] = useMemo(() => [
    { label: 'Total Revenue', value: totalRevenue, format: 'currency', change: 12.4, icon: DollarSign },
    { label: 'Total Contacts', value: 14820, format: 'number', change: 8.2, icon: Users },
    { label: 'Active Users', value: 3247, format: 'number', change: 15.1, icon: Activity },
    { label: 'Conversion Rate', value: 47, format: 'percent', change: 3.8, icon: TrendingUp },
    { label: 'Page Views', value: 128400, format: 'number', change: 22.6, icon: Eye },
    { label: 'Top Source', value: 42, format: 'percent', suffix: ' organic', change: 5.1, icon: Globe },
    { label: 'Active Campaigns', value: 12, format: 'number', change: -2.0, icon: Megaphone },
    { label: 'Agent Tasks Done', value: 8472, format: 'number', change: 34.7, icon: Bot },
  ], [totalRevenue]);

  const handleExport = useCallback(() => {
    const headers = ['Metric', 'Value', 'Change'];
    const rows = kpis.map(k => [k.label, k.value.toString(), `${k.change}%`]);
    const revenueRows = revenueData.map(r => [r.date, `$${r.amount}`, '']);
    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      'Date,Revenue,',
      ...revenueRows.map(r => r.join(',')),
    ].join('\n');

    navigator.clipboard.writeText(csv).then(() => {
      alert('Analytics data copied to clipboard as CSV');
    });
  }, [kpis, revenueData]);

  const handleAiInsights = useCallback(() => {
    setAiInsightsOpen(true);
    setAiThinking(true);
    setAiInsight('');

    setTimeout(() => {
      setAiThinking(false);
      setAiInsight(
        `Based on the last ${daysMap[dateRange]} days of data:\n\n` +
        `Revenue is trending UP 12.4% with strongest performance mid-week. ` +
        `Organic traffic dominates at 42%, suggesting strong SEO. ` +
        `The funnel conversion from Visitors to Customers sits at 2.5% — ` +
        `the biggest drop-off is Leads to Trials (-65.6%). ` +
        `Recommendation: Focus on trial activation campaigns and reduce the /blog bounce rate (45.2%). ` +
        `The "Partner Webinar" campaign shows highest ROI at 520% — consider scaling this channel. ` +
        `Agent task completion is up 34.7%, indicating healthy system automation.`
      );
    }, 2500);
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Analytics Command Center</h1>
              <p className="text-xs text-white/40">Real-time performance intelligence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white/60 hover:text-white hover:border-white/[0.12] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleAiInsights}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium hover:bg-red-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Insights
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsightsOpen && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl p-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Melli AI Analysis</h3>
            <button
              onClick={() => setAiInsightsOpen(false)}
              className="ml-auto text-white/30 hover:text-white/60 text-xs"
            >
              Dismiss
            </button>
          </div>
          {aiThinking ? (
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />
              <p className="text-xs text-white/50">Melli is analyzing your data...</p>
            </div>
          ) : (
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{aiInsight}</p>
          )}
        </div>
      )}

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Row 1 — Revenue Chart */}
      <RevenueChart data={revenueData} />

      {/* Row 2 — Traffic + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficPieChart sources={TRAFFIC_SOURCES} />
        <ConversionFunnel stages={FUNNEL_STAGES} />
      </div>

      {/* Row 3 — Pages + Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPagesTable pages={TOP_PAGES} />
        <CampaignCards campaigns={CAMPAIGNS} />
      </div>

      {/* Row 4 — Real-time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveUsersCard />
        <EventsFeed events={events} />
      </div>
    </div>
  );
}
