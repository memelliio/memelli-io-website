'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  MousePointerClick,
  UserPlus,
  ArrowRightLeft,
  Clock,
  BarChart3,
  GitBranch,
  Layers,
  Eye,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Globe,
  Smartphone,
  Mail,
  Search as SearchIcon,
  Link2,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { MetricTile } from '@memelli/ui';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AffiliatePerformance {
  id: string;
  name: string;
  email: string;
  code: string;
  tier: string;
  status: string;
  totalClicks: number;
  uniqueVisitors: number;
  signups: number;
  conversions: number;
  revenue: number;
  commissionEarned: number;
  commissionRate: number;
  pendingBalance: number;
  avgOrderValue: number;
  conversionRate: number;
  joinDate: string;
  lastActive: string;
}

interface ReferralChainNode {
  id: string;
  name: string;
  email: string;
  tier: string;
  depth: number;
  referrals: number;
  revenue: number;
  children: ReferralChainNode[];
}

interface CommissionTier {
  tier: string;
  minReferrals: number;
  maxReferrals: number | null;
  rate: number;
  affiliateCount: number;
  totalRevenue: number;
}

interface FunnelStep {
  stage: string;
  count: number;
  dropoff: number;
  rate: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  date: string;
  method: string;
  period: string;
}

interface TrafficSource {
  source: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface HeatmapCell {
  hour: number;
  day: number;
  clicks: number;
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const DEMO_AFFILIATES: AffiliatePerformance[] = [
  { id: '1', name: 'Marcus Chen', email: 'marcus@example.com', code: 'MARC2024', tier: 'PLATINUM', status: 'ACTIVE', totalClicks: 12840, uniqueVisitors: 9230, signups: 487, conversions: 312, revenue: 89420, commissionEarned: 17884, commissionRate: 20, pendingBalance: 3240, avgOrderValue: 286.60, conversionRate: 24.3, joinDate: '2024-06-15', lastActive: '2026-03-15' },
  { id: '2', name: 'Sarah Williams', email: 'sarah@example.com', code: 'SARAH24', tier: 'GOLD', status: 'ACTIVE', totalClicks: 8920, uniqueVisitors: 6410, signups: 298, conversions: 186, revenue: 52080, commissionEarned: 7812, commissionRate: 15, pendingBalance: 1680, avgOrderValue: 279.99, conversionRate: 20.9, joinDate: '2024-09-01', lastActive: '2026-03-14' },
  { id: '3', name: 'David Park', email: 'david@example.com', code: 'DPARK', tier: 'GOLD', status: 'ACTIVE', totalClicks: 6340, uniqueVisitors: 4890, signups: 201, conversions: 134, revenue: 38920, commissionEarned: 5838, commissionRate: 15, pendingBalance: 920, avgOrderValue: 290.45, conversionRate: 21.1, joinDate: '2024-11-20', lastActive: '2026-03-16' },
  { id: '4', name: 'Lisa Rodriguez', email: 'lisa@example.com', code: 'LISAROD', tier: 'SILVER', status: 'ACTIVE', totalClicks: 4210, uniqueVisitors: 3120, signups: 142, conversions: 78, revenue: 21840, commissionEarned: 2184, commissionRate: 10, pendingBalance: 540, avgOrderValue: 280.00, conversionRate: 18.5, joinDate: '2025-01-10', lastActive: '2026-03-13' },
  { id: '5', name: 'James Thompson', email: 'james@example.com', code: 'JT2025', tier: 'SILVER', status: 'ACTIVE', totalClicks: 3890, uniqueVisitors: 2940, signups: 118, conversions: 64, revenue: 17920, commissionEarned: 1792, commissionRate: 10, pendingBalance: 380, avgOrderValue: 280.00, conversionRate: 16.5, joinDate: '2025-02-18', lastActive: '2026-03-12' },
  { id: '6', name: 'Emma Davis', email: 'emma@example.com', code: 'EMMA25', tier: 'STARTER', status: 'ACTIVE', totalClicks: 1240, uniqueVisitors: 890, signups: 42, conversions: 18, revenue: 5040, commissionEarned: 252, commissionRate: 5, pendingBalance: 120, avgOrderValue: 280.00, conversionRate: 14.5, joinDate: '2025-08-01', lastActive: '2026-03-10' },
  { id: '7', name: 'Alex Kim', email: 'alex@example.com', code: 'ALEXK', tier: 'STARTER', status: 'INACTIVE', totalClicks: 620, uniqueVisitors: 410, signups: 14, conversions: 4, revenue: 1120, commissionEarned: 56, commissionRate: 5, pendingBalance: 56, avgOrderValue: 280.00, conversionRate: 6.5, joinDate: '2025-10-15', lastActive: '2026-01-20' },
];

const DEMO_CHAIN: ReferralChainNode = {
  id: '1', name: 'Marcus Chen', email: 'marcus@example.com', tier: 'PLATINUM', depth: 0, referrals: 24, revenue: 89420,
  children: [
    { id: '2', name: 'Sarah Williams', email: 'sarah@example.com', tier: 'GOLD', depth: 1, referrals: 12, revenue: 52080, children: [
      { id: '4', name: 'Lisa Rodriguez', email: 'lisa@example.com', tier: 'SILVER', depth: 2, referrals: 4, revenue: 21840, children: [] },
      { id: '6', name: 'Emma Davis', email: 'emma@example.com', tier: 'STARTER', depth: 2, referrals: 1, revenue: 5040, children: [] },
    ]},
    { id: '3', name: 'David Park', email: 'david@example.com', tier: 'GOLD', depth: 1, referrals: 8, revenue: 38920, children: [
      { id: '5', name: 'James Thompson', email: 'james@example.com', tier: 'SILVER', depth: 1, referrals: 3, revenue: 17920, children: [] },
    ]},
  ],
};

const DEMO_TIERS: CommissionTier[] = [
  { tier: 'STARTER', minReferrals: 0, maxReferrals: 10, rate: 5, affiliateCount: 42, totalRevenue: 28400 },
  { tier: 'SILVER', minReferrals: 11, maxReferrals: 50, rate: 10, affiliateCount: 18, totalRevenue: 64200 },
  { tier: 'GOLD', minReferrals: 51, maxReferrals: 200, rate: 15, affiliateCount: 8, totalRevenue: 142800 },
  { tier: 'PLATINUM', minReferrals: 201, maxReferrals: 500, rate: 20, affiliateCount: 3, totalRevenue: 268400 },
  { tier: 'DIAMOND', minReferrals: 501, maxReferrals: null, rate: 25, affiliateCount: 1, totalRevenue: 412000 },
];

const DEMO_FUNNEL: FunnelStep[] = [
  { stage: 'Link Click', count: 38060, dropoff: 0, rate: 100 },
  { stage: 'Page View', count: 27890, dropoff: 26.7, rate: 73.3 },
  { stage: 'Signup', count: 1302, dropoff: 95.3, rate: 4.7 },
  { stage: 'Trial Start', count: 842, dropoff: 35.3, rate: 64.7 },
  { stage: 'First Purchase', count: 596, dropoff: 29.2, rate: 70.8 },
  { stage: 'Repeat Purchase', count: 312, dropoff: 47.7, rate: 52.3 },
];

const DEMO_PAYOUTS: PayoutRecord[] = [
  { id: 'p1', amount: 4280, status: 'COMPLETED', date: '2026-03-01', method: 'ACH', period: 'Feb 2026' },
  { id: 'p2', amount: 3840, status: 'COMPLETED', date: '2026-02-01', method: 'ACH', period: 'Jan 2026' },
  { id: 'p3', amount: 5120, status: 'COMPLETED', date: '2026-01-01', method: 'ACH', period: 'Dec 2025' },
  { id: 'p4', amount: 3960, status: 'COMPLETED', date: '2025-12-01', method: 'ACH', period: 'Nov 2025' },
  { id: 'p5', amount: 4640, status: 'COMPLETED', date: '2025-11-01', method: 'ACH', period: 'Oct 2025' },
  { id: 'p6', amount: 3280, status: 'COMPLETED', date: '2025-10-01', method: 'ACH', period: 'Sep 2025' },
];

const DEMO_SOURCES: TrafficSource[] = [
  { source: 'Instagram', clicks: 12840, conversions: 186, revenue: 52080, conversionRate: 14.5 },
  { source: 'YouTube', clicks: 8920, conversions: 134, revenue: 37520, conversionRate: 15.0 },
  { source: 'Blog / SEO', clicks: 6340, conversions: 98, revenue: 27440, conversionRate: 15.5 },
  { source: 'Twitter / X', clicks: 4210, conversions: 42, revenue: 11760, conversionRate: 10.0 },
  { source: 'Email', clicks: 3120, conversions: 78, revenue: 21840, conversionRate: 25.0 },
  { source: 'TikTok', clicks: 1890, conversions: 38, revenue: 10640, conversionRate: 20.1 },
  { source: 'Direct', clicks: 740, conversions: 20, revenue: 5600, conversionRate: 27.0 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function generateHeatmapData(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const peakMultiplier =
        (hour >= 9 && hour <= 11) ? 2.5 :
        (hour >= 12 && hour <= 14) ? 3.0 :
        (hour >= 17 && hour <= 20) ? 2.8 :
        (hour >= 21 && hour <= 23) ? 1.8 :
        (hour >= 0 && hour <= 5) ? 0.3 :
        1.0;
      const dayMultiplier = (day <= 4) ? 1.2 : 0.8;
      const base = Math.floor(Math.random() * 40 + 10);
      cells.push({ hour, day, clicks: Math.floor(base * peakMultiplier * dayMultiplier) });
    }
  }
  return cells;
}

const DEMO_HEATMAP = generateHeatmapData();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const fmtDate = (d: string) => new Date(d).toLocaleDateString();

const tierVariant: Record<string, BadgeVariant> = {
  STARTER: 'muted',
  SILVER: 'default',
  GOLD: 'warning',
  PLATINUM: 'primary',
  DIAMOND: 'primary',
};

const statusVariant: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  PENDING: 'warning',
  COMPLETED: 'success',
};

const tierColors: Record<string, string> = {
  STARTER: 'bg-muted',
  SILVER: 'bg-muted',
  GOLD: 'bg-amber-500',
  PLATINUM: 'bg-cyan-400',
  DIAMOND: 'bg-violet-400',
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ReferralTreeNode({ node, depth = 0 }: { node: ReferralChainNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-white/[0.06] pl-4' : ''}>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className="w-3.5 shrink-0" />
        )}

        <div className={`h-2 w-2 rounded-full shrink-0 ${tierColors[node.tier] ?? 'bg-muted'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
            <Badge variant={tierVariant[node.tier] ?? 'muted'} className="text-[10px]">
              {node.tier}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{node.email}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Referrals</p>
            <p className="text-sm font-medium text-foreground">{node.referrals}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</p>
            <p className="text-sm font-medium text-emerald-400">{fmtCurrency(node.revenue)}</p>
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children.map((child) => (
            <ReferralTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelBar({ step, maxCount }: { step: FunnelStep; maxCount: number }) {
  const width = (step.count / maxCount) * 100;
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 shrink-0">
        <p className="text-xs font-medium text-foreground">{step.stage}</p>
      </div>
      <div className="flex-1 relative">
        <div className="h-8 rounded-lg bg-muted overflow-hidden">
          <div
            className="h-full rounded-lg bg-gradient-to-r from-red-600/80 to-red-500/60 transition-all duration-500"
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <p className="text-sm font-medium text-foreground">{fmtCompact(step.count)}</p>
      </div>
      <div className="w-16 shrink-0 text-right">
        {step.dropoff > 0 ? (
          <span className="text-xs text-red-400/80">-{step.dropoff.toFixed(1)}%</span>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>
    </div>
  );
}

function HeatmapGrid({ data }: { data: HeatmapCell[] }) {
  const maxClicks = Math.max(...data.map((c) => c.clicks));

  const getOpacity = (clicks: number) => {
    if (maxClicks === 0) return 0.05;
    const ratio = clicks / maxClicks;
    return 0.05 + ratio * 0.95;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hour labels */}
        <div className="flex mb-1 ml-12">
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div
              key={h}
              className="text-[10px] text-muted-foreground text-center"
              style={{ width: `${(100 / 8)}%` }}
            >
              {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-0.5">
            <div className="w-10 shrink-0 text-[10px] text-muted-foreground text-right pr-2">{day}</div>
            <div className="flex-1 flex gap-0.5">
              {HOURS.map((hour) => {
                const cell = data.find((c) => c.day === dayIdx && c.hour === hour);
                const clicks = cell?.clicks ?? 0;
                return (
                  <div
                    key={hour}
                    className="flex-1 h-5 rounded-sm cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-white/20"
                    style={{ backgroundColor: `rgba(239, 68, 68, ${getOpacity(clicks)})` }}
                    title={`${day} ${hour}:00 - ${clicks} clicks`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 mr-1">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((op) => (
            <div
              key={op}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `rgba(239, 68, 68, ${op})` }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}

function PayoutChart({ payouts }: { payouts: PayoutRecord[] }) {
  const sorted = [...payouts].reverse();
  const maxAmount = Math.max(...sorted.map((p) => p.amount));

  return (
    <div className="flex items-end gap-2 h-48">
      {sorted.map((p) => {
        const height = maxAmount > 0 ? (p.amount / maxAmount) * 100 : 0;
        return (
          <div key={p.id} className="flex-1 flex flex-col items-center gap-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">{fmtCurrency(p.amount)}</p>
            <div className="w-full relative flex-1 flex items-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600/70 to-emerald-400/40 transition-all duration-300 hover:from-emerald-500/80 hover:to-emerald-300/50"
                style={{ height: `${height}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground text-center leading-tight">{p.period}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison panel                                                   */
/* ------------------------------------------------------------------ */

function ComparePanel({
  affiliates,
  selected,
  onToggle,
}: {
  affiliates: AffiliatePerformance[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const compared = affiliates.filter((a) => selected.includes(a.id));
  if (compared.length < 2) return null;

  const metrics = [
    { label: 'Total Clicks', key: 'totalClicks' as const, fmt: fmtCompact },
    { label: 'Signups', key: 'signups' as const, fmt: (n: number) => String(n) },
    { label: 'Conversions', key: 'conversions' as const, fmt: (n: number) => String(n) },
    { label: 'Revenue', key: 'revenue' as const, fmt: fmtCurrency },
    { label: 'Commission Earned', key: 'commissionEarned' as const, fmt: fmtCurrency },
    { label: 'Conversion Rate', key: 'conversionRate' as const, fmt: (n: number) => `${n}%` },
    { label: 'Avg Order Value', key: 'avgOrderValue' as const, fmt: fmtCurrency },
  ];

  return (
    <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/[0.04]">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Side-by-Side Comparison
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left w-48">
                Metric
              </th>
              {compared.map((a) => (
                <th
                  key={a.id}
                  className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-foreground normal-case text-xs font-semibold">{a.name}</span>
                    <Badge variant={tierVariant[a.tier] ?? 'muted'} className="text-[9px]">{a.tier}</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {metrics.map((m) => {
              const values = compared.map((a) => a[m.key]);
              const best = Math.max(...values);
              return (
                <tr key={m.key} className="hover:bg-white/[0.02] transition-colors duration-150">
                  <td className="px-6 py-3 text-muted-foreground text-xs font-medium">{m.label}</td>
                  {compared.map((a) => {
                    const val = a[m.key];
                    const isBest = val === best && compared.length > 1;
                    return (
                      <td key={a.id} className="px-6 py-3 text-center">
                        <span className={`text-sm font-medium ${isBest ? 'text-emerald-400' : 'text-foreground'}`}>
                          {m.fmt(val)}
                        </span>
                        {isBest && (
                          <ArrowUpRight className="inline-block h-3 w-3 ml-1 text-emerald-400" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AffiliateDeepPage() {
  const api = useApi();
  const [affiliates, setAffiliates] = useState<AffiliatePerformance[]>(DEMO_AFFILIATES);
  const [chain, setChain] = useState<ReferralChainNode>(DEMO_CHAIN);
  const [tiers, setTiers] = useState<CommissionTier[]>(DEMO_TIERS);
  const [funnel, setFunnel] = useState<FunnelStep[]>(DEMO_FUNNEL);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(DEMO_PAYOUTS);
  const [sources, setSources] = useState<TrafficSource[]>(DEMO_SOURCES);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>(DEMO_HEATMAP);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'chain' | 'funnel' | 'payouts' | 'traffic' | 'compare'>('overview');

  const selectedAffiliate = useMemo(
    () => affiliates.find((a) => a.id === selectedId) ?? affiliates[0],
    [affiliates, selectedId]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  /* Try to load live data, fall back to demo */
  const loadLiveData = useCallback(async () => {
    try {
      const res = await api.get<{ data: AffiliatePerformance[] }>('/api/partners/analytics/deep');
      if (res.data?.data?.length) {
        setAffiliates(res.data.data);
      }
    } catch {
      // keep demo data
    }
  }, []);

  useEffect(() => {
    loadLiveData();
  }, [loadLiveData]);

  const funnelMax = Math.max(...funnel.map((s) => s.count));

  const sourceIcons: Record<string, React.ReactNode> = {
    Instagram: <Smartphone className="h-3.5 w-3.5" />,
    YouTube: <Eye className="h-3.5 w-3.5" />,
    'Blog / SEO': <SearchIcon className="h-3.5 w-3.5" />,
    'Twitter / X': <Globe className="h-3.5 w-3.5" />,
    Email: <Mail className="h-3.5 w-3.5" />,
    TikTok: <Smartphone className="h-3.5 w-3.5" />,
    Direct: <Link2 className="h-3.5 w-3.5" />,
  };

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'chain' as const, label: 'Referral Chain', icon: GitBranch },
    { id: 'funnel' as const, label: 'Conversion Funnel', icon: Layers },
    { id: 'payouts' as const, label: 'Payout History', icon: DollarSign },
    { id: 'traffic' as const, label: 'Traffic Sources', icon: Globe },
    { id: 'compare' as const, label: 'Compare', icon: Users },
  ];

  return (
    <div className="bg-card min-h-screen">
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Deep Affiliate Analytics
            </h1>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Individual performance, referral chains, and conversion intelligence
            </p>
          </div>

          {/* Affiliate Selector */}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-3 text-foreground focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 min-w-[220px]"
          >
            {affiliates.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.tier})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-card border border-white/[0.04] rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-red-600/90 text-white shadow-lg shadow-red-900/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ============================================== */}
            {/*  OVERVIEW TAB                                  */}
            {/* ============================================== */}
            {activeTab === 'overview' && selectedAffiliate && (
              <>
                {/* Affiliate Header Card */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-foreground">{selectedAffiliate.name}</h2>
                        <Badge variant={tierVariant[selectedAffiliate.tier] ?? 'muted'}>
                          {selectedAffiliate.tier}
                        </Badge>
                        <Badge variant={statusVariant[selectedAffiliate.status] ?? 'muted'}>
                          {selectedAffiliate.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedAffiliate.email}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Code: <span className="font-mono text-red-400">{selectedAffiliate.code}</span></span>
                        <span>Joined {fmtDate(selectedAffiliate.joinDate)}</span>
                        <span>Last active {fmtDate(selectedAffiliate.lastActive)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Commission Rate</p>
                      <p className="text-3xl font-bold text-red-400">{selectedAffiliate.commissionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Metric Tiles */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <MetricTile
                    label="Total Clicks"
                    value={fmtCompact(selectedAffiliate.totalClicks)}
                    icon={<MousePointerClick className="h-4 w-4" />}
                  />
                  <MetricTile
                    label="Unique Visitors"
                    value={fmtCompact(selectedAffiliate.uniqueVisitors)}
                    icon={<Eye className="h-4 w-4" />}
                  />
                  <MetricTile
                    label="Signups"
                    value={selectedAffiliate.signups}
                    icon={<UserPlus className="h-4 w-4" />}
                    trend="up"
                  />
                  <MetricTile
                    label="Conversions"
                    value={selectedAffiliate.conversions}
                    icon={<ArrowRightLeft className="h-4 w-4" />}
                    trend="up"
                  />
                  <MetricTile
                    label="Revenue"
                    value={fmtCurrency(selectedAffiliate.revenue)}
                    icon={<DollarSign className="h-4 w-4" />}
                    trend="up"
                  />
                  <MetricTile
                    label="Commission Earned"
                    value={fmtCurrency(selectedAffiliate.commissionEarned)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    trend="up"
                  />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                    <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
                      Conversion Performance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">Conversion Rate</span>
                          <span className="text-sm font-semibold text-foreground">{selectedAffiliate.conversionRate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-red-600 to-red-400"
                            style={{ width: `${Math.min(selectedAffiliate.conversionRate * 3, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">Avg Order Value</span>
                          <span className="text-sm font-semibold text-emerald-400">{fmtCurrency(selectedAffiliate.avgOrderValue)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                            style={{ width: `${Math.min((selectedAffiliate.avgOrderValue / 400) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                    <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
                      Balance Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Balance</span>
                        <span className="text-lg font-semibold text-amber-400">{fmtCurrency(selectedAffiliate.pendingBalance)}</span>
                      </div>
                      <div className="h-px bg-white/[0.04]" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Earned</span>
                        <span className="text-lg font-semibold text-emerald-400">{fmtCurrency(selectedAffiliate.commissionEarned)}</span>
                      </div>
                      <div className="h-px bg-white/[0.04]" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Paid Out</span>
                        <span className="text-lg font-semibold text-foreground">
                          {fmtCurrency(selectedAffiliate.commissionEarned - selectedAffiliate.pendingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                    <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
                      Click Heatmap (Time of Day)
                    </h3>
                    <HeatmapGrid data={heatmap} />
                  </div>
                </div>
              </>
            )}

            {/* ============================================== */}
            {/*  REFERRAL CHAIN TAB                            */}
            {/* ============================================== */}
            {activeTab === 'chain' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      Referral Chain Visualization
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">Click nodes to expand/collapse downstream referrals</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {Object.entries(tierColors).map(([tier, color]) => (
                      <div key={tier} className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="text-[10px] text-muted-foreground uppercase">{tier}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <ReferralTreeNode node={chain} />
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/*  COMMISSION TIERS                               */}
            {activeTab === 'chain' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.04]">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Commission Tier Structure
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {tiers.map((t) => (
                    <div
                      key={t.tier}
                      className={`rounded-xl border border-white/[0.04] p-4 text-center transition-all duration-200 hover:border-white/[0.08] ${
                        selectedAffiliate?.tier === t.tier ? 'ring-1 ring-red-500/30 bg-red-500/[0.03]' : 'bg-card'
                      }`}
                    >
                      <div className={`inline-block h-3 w-3 rounded-full mb-3 ${tierColors[t.tier] ?? 'bg-muted'}`} />
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{t.tier}</p>
                      <p className="text-2xl font-bold text-foreground mb-2">{t.rate}%</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.minReferrals}{t.maxReferrals ? `-${t.maxReferrals}` : '+'} referrals
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <p className="text-[10px] text-muted-foreground">{t.affiliateCount} affiliates</p>
                        <p className="text-xs text-emerald-400/80 font-medium mt-0.5">{fmtCurrency(t.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/*  CONVERSION FUNNEL TAB                         */}
            {/* ============================================== */}
            {activeTab === 'funnel' && (
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.04]">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Conversion Funnel for {selectedAffiliate?.name ?? 'All Affiliates'}
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  {funnel.map((step) => (
                    <FunnelBar key={step.stage} step={step} maxCount={funnelMax} />
                  ))}
                </div>

                {/* Funnel Summary */}
                <div className="px-6 py-5 border-t border-white/[0.04] grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Overall Conversion</p>
                    <p className="text-xl font-bold text-foreground">
                      {((funnel[funnel.length - 1]?.count / funnel[0]?.count) * 100).toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Click to Repeat Purchase</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Biggest Dropoff</p>
                    <p className="text-xl font-bold text-red-400">
                      {funnel.reduce((max, s) => s.dropoff > max.dropoff ? s : max, funnel[0]).stage}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      -{funnel.reduce((max, s) => s.dropoff > max.dropoff ? s : max, funnel[0]).dropoff.toFixed(1)}% loss
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Revenue per Click</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {fmtCurrency(selectedAffiliate ? selectedAffiliate.revenue / selectedAffiliate.totalClicks : 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/*  PAYOUT HISTORY TAB                            */}
            {/* ============================================== */}
            {activeTab === 'payouts' && (
              <>
                {/* Payout Chart */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-6">
                    Payout History ({selectedAffiliate?.name})
                  </h2>
                  <PayoutChart payouts={payouts} />
                </div>

                {/* Payout Table */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/[0.04]">
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      Payout Ledger
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-left">
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Period</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Method</th>
                          <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {payouts.map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.03] transition-colors duration-150">
                            <td className="px-6 py-4 font-medium text-foreground">{p.period}</td>
                            <td className="px-6 py-4 text-emerald-400 font-medium">{fmtCurrency(p.amount)}</td>
                            <td className="px-6 py-4">
                              <Badge variant={statusVariant[p.status] ?? 'muted'} className="capitalize">
                                {p.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{p.method}</td>
                            <td className="px-6 py-4 text-muted-foreground">{fmtDate(p.date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ============================================== */}
            {/*  TRAFFIC SOURCES TAB                           */}
            {/* ============================================== */}
            {activeTab === 'traffic' && (
              <>
                {/* Top Sources Table */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/[0.04]">
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      Top Converting Traffic Sources
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {sources.map((s) => {
                      const maxClicks = Math.max(...sources.map((x) => x.clicks));
                      const width = (s.clicks / maxClicks) * 100;
                      return (
                        <div key={s.source} className="group">
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="w-5 text-muted-foreground">{sourceIcons[s.source] ?? <Globe className="h-3.5 w-3.5" />}</div>
                            <span className="text-sm font-medium text-foreground w-28">{s.source}</span>
                            <div className="flex-1 relative">
                              <div className="h-6 rounded-md bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-md bg-gradient-to-r from-red-600/60 to-red-500/30 transition-all duration-500"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right w-16">
                                <p className="text-xs font-medium text-foreground">{fmtCompact(s.clicks)}</p>
                                <p className="text-[9px] text-muted-foreground">clicks</p>
                              </div>
                              <div className="text-right w-14">
                                <p className="text-xs font-medium text-foreground">{s.conversions}</p>
                                <p className="text-[9px] text-muted-foreground">conv.</p>
                              </div>
                              <div className="text-right w-20">
                                <p className="text-xs font-medium text-emerald-400">{fmtCurrency(s.revenue)}</p>
                                <p className="text-[9px] text-muted-foreground">revenue</p>
                              </div>
                              <div className="text-right w-14">
                                <p className={`text-xs font-medium ${s.conversionRate >= 20 ? 'text-emerald-400' : s.conversionRate >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {s.conversionRate}%
                                </p>
                                <p className="text-[9px] text-muted-foreground">rate</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Click Heatmap (full width) */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-6">
                    Link Click Heatmap (Time of Day)
                  </h2>
                  <HeatmapGrid data={heatmap} />
                </div>
              </>
            )}

            {/* ============================================== */}
            {/*  COMPARE TAB                                   */}
            {/* ============================================== */}
            {activeTab === 'compare' && (
              <>
                {/* Affiliate Selection for Compare */}
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
                    Select Affiliates to Compare (up to 4)
                  </h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {affiliates.map((a) => {
                      const isSelected = compareIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleCompare(a.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-red-500/40 bg-red-500/[0.06]'
                              : 'border-white/[0.04] bg-card hover:border-white/[0.08]'
                          }`}
                        >
                          <div className={`h-3 w-3 rounded-full border-2 shrink-0 transition-colors duration-200 ${
                            isSelected ? 'border-red-500 bg-red-500' : 'border-border'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant={tierVariant[a.tier] ?? 'muted'} className="text-[9px]">{a.tier}</Badge>
                              <span className="text-[10px] text-muted-foreground">{fmtCurrency(a.revenue)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comparison Table */}
                {compareIds.length >= 2 ? (
                  <ComparePanel
                    affiliates={affiliates}
                    selected={compareIds}
                    onToggle={toggleCompare}
                  />
                ) : (
                  <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select at least 2 affiliates to compare side-by-side</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
