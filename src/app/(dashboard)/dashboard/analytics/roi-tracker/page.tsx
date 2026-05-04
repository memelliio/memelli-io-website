'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Target,
  Calendar, ArrowUpRight, ArrowDownRight, Trophy, AlertTriangle,
  BarChart2, Hash, Zap,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = 'sms' | 'email' | 'social' | 'paid';
type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  spend: number;
  leads: number;
  conversions: number;
  revenue: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_META: Record<Channel, { label: string; color: string; barColor: string }> = {
  sms:    { label: 'SMS',    color: 'text-sky-400',    barColor: '#38bdf8'  },
  email:  { label: 'Email',  color: 'text-violet-400', barColor: '#a78bfa'  },
  social: { label: 'Social', color: 'text-amber-400',  barColor: '#fbbf24'  },
  paid:   { label: 'Paid',   color: 'text-rose-400',   barColor: '#fb7185'  },
};

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: '7d',  label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'all', label: 'All Time' },
];

const SEED_CAMPAIGNS: Campaign[] = [
  { id: 'c1',  name: 'Spring Funding Push',       channel: 'paid',   spend: 12400, leads: 620,  conversions: 87,  revenue: 74200  },
  { id: 'c2',  name: 'SMS Re-engagement',          channel: 'sms',    spend: 1800,  leads: 340,  conversions: 54,  revenue: 28600  },
  { id: 'c3',  name: 'Weekly Newsletter',           channel: 'email',  spend: 450,   leads: 210,  conversions: 38,  revenue: 19400  },
  { id: 'c4',  name: 'Instagram Lead Gen',          channel: 'social', spend: 5600,  leads: 480,  conversions: 42,  revenue: 22100  },
  { id: 'c5',  name: 'Google Ads — Credit Repair',  channel: 'paid',   spend: 18200, leads: 890,  conversions: 112, revenue: 96800  },
  { id: 'c6',  name: 'Facebook Retargeting',        channel: 'social', spend: 3200,  leads: 260,  conversions: 31,  revenue: 15800  },
  { id: 'c7',  name: 'Affiliate Email Blast',       channel: 'email',  spend: 720,   leads: 180,  conversions: 29,  revenue: 14200  },
  { id: 'c8',  name: 'SMS Flash Sale',              channel: 'sms',    spend: 980,   leads: 410,  conversions: 68,  revenue: 34500  },
  { id: 'c9',  name: 'TikTok Awareness',            channel: 'social', spend: 7800,  leads: 1200, conversions: 56,  revenue: 18900  },
  { id: 'c10', name: 'Google Ads — Funding',        channel: 'paid',   spend: 9400,  leads: 520,  conversions: 74,  revenue: 62400  },
  { id: 'c11', name: 'Drip Nurture Sequence',       channel: 'email',  spend: 320,   leads: 95,   conversions: 22,  revenue: 11800  },
  { id: 'c12', name: 'SMS Appointment Reminders',   channel: 'sms',    spend: 540,   leads: 190,  conversions: 44,  revenue: 21200  },
];

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

function roi(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return ((revenue - spend) / spend) * 100;
}

function cpl(spend: number, leads: number): number {
  if (leads === 0) return 0;
  return spend / leads;
}

function cpa(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}

function roas(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────

function ROIBarChart({ campaigns }: { campaigns: Campaign[] }) {
  const sorted = [...campaigns].sort((a, b) => roi(b.revenue, b.spend) - roi(a.revenue, a.spend));
  const roiValues = sorted.map((c) => roi(c.revenue, c.spend));
  const maxROI = Math.max(...roiValues, 1);
  const barCount = sorted.length;

  const svgW = 800;
  const svgH = 320;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 80;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW = Math.min(40, (chartW / barCount) * 0.65);
  const gap = (chartW - barW * barCount) / (barCount + 1);

  // Y-axis grid lines
  const yTicks = 5;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (maxROI / yTicks) * i;
    const y = padT + chartH - (val / maxROI) * chartH;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={line.y}
            x2={svgW - padR}
            y2={line.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={line.y + 4}
            textAnchor="end"
            className="fill-zinc-600"
            fontSize="10"
            fontFamily="system-ui"
          >
            {line.val.toFixed(0)}%
          </text>
        </g>
      ))}

      {/* Bars */}
      {sorted.map((c, i) => {
        const roiVal = roi(c.revenue, c.spend);
        const barH = (roiVal / maxROI) * chartH;
        const x = padL + gap + i * (barW + gap);
        const y = padT + chartH - barH;
        const meta = CHANNEL_META[c.channel];
        const isBest = i === 0;
        const isWorst = i === barCount - 1;

        return (
          <g key={c.id}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={meta.barColor}
              opacity={isBest ? 1 : isWorst ? 0.5 : 0.75}
            />
            {/* ROI label on top */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              className={isBest ? 'fill-emerald-400' : isWorst ? 'fill-red-400' : 'fill-zinc-400'}
              fontFamily="system-ui"
            >
              {roiVal.toFixed(0)}%
            </text>
            {/* Best / Worst badge */}
            {isBest && (
              <text
                x={x + barW / 2}
                y={y - 18}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                className="fill-emerald-400"
                fontFamily="system-ui"
              >
                BEST
              </text>
            )}
            {isWorst && (
              <text
                x={x + barW / 2}
                y={y - 18}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                className="fill-red-400"
                fontFamily="system-ui"
              >
                WORST
              </text>
            )}
            {/* Campaign name */}
            <text
              x={x + barW / 2}
              y={padT + chartH + 14}
              textAnchor="middle"
              fontSize="8"
              className="fill-zinc-500"
              fontFamily="system-ui"
            >
              {c.name.length > 14 ? c.name.slice(0, 13) + '...' : c.name}
            </text>
            {/* Channel label */}
            <text
              x={x + barW / 2}
              y={padT + chartH + 28}
              textAnchor="middle"
              fontSize="8"
              fontWeight="500"
              fill={meta.barColor}
              fontFamily="system-ui"
            >
              {meta.label}
            </text>
          </g>
        );
      })}

      {/* Y-axis label */}
      <text
        x={12}
        y={padT + chartH / 2}
        textAnchor="middle"
        fontSize="10"
        className="fill-zinc-600"
        fontFamily="system-ui"
        transform={`rotate(-90, 12, ${padT + chartH / 2})`}
      >
        ROI %
      </text>
    </svg>
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
  accent?: 'emerald' | 'red' | 'zinc' | 'amber' | 'sky';
}) {
  const accentMap = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    zinc: 'text-foreground',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
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

export default function ROITrackerPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'revenue' | 'spend' | 'cpl'>('roi');

  const campaigns = useMemo(() => {
    let filtered = [...SEED_CAMPAIGNS];
    if (channelFilter !== 'all') {
      filtered = filtered.filter((c) => c.channel === channelFilter);
    }
    return filtered;
  }, [channelFilter]);

  const sorted = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      switch (sortBy) {
        case 'roi':     return roi(b.revenue, b.spend) - roi(a.revenue, a.spend);
        case 'revenue': return b.revenue - a.revenue;
        case 'spend':   return b.spend - a.spend;
        case 'cpl':     return cpl(a.spend, a.leads) - cpl(b.spend, b.leads);
        default:        return 0;
      }
    });
  }, [campaigns, sortBy]);

  // Aggregates
  const totalSpend       = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalLeads       = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const overallROI       = roi(totalRevenue, totalSpend);
  const overallROAS      = roas(totalRevenue, totalSpend);
  const overallCPL       = cpl(totalSpend, totalLeads);
  const overallCPA       = cpa(totalSpend, totalConversions);

  // Best / Worst
  const best  = [...campaigns].sort((a, b) => roi(b.revenue, b.spend) - roi(a.revenue, a.spend))[0];
  const worst = [...campaigns].sort((a, b) => roi(a.revenue, a.spend) - roi(b.revenue, b.spend))[0];

  return (
    <div className="min-h-screen bg-card px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Campaign ROI Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Return on investment across all marketing channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-1.5 rounded-xl bg-card border border-white/[0.04] p-1">
            {DATE_RANGES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === d.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4 mb-6">
        <Tile
          label="Total Spend"
          value={fmt(totalSpend)}
          sub={`${campaigns.length} campaigns`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <Tile
          label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${fmtShort(totalConversions)} conversions`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="emerald"
        />
        <Tile
          label="Overall ROI"
          value={`${overallROI.toFixed(1)}%`}
          sub={overallROI > 0 ? 'Profitable' : 'Unprofitable'}
          icon={<Target className="h-4 w-4" />}
          accent={overallROI > 0 ? 'emerald' : 'red'}
        />
        <Tile
          label="ROAS"
          value={`${overallROAS.toFixed(2)}x`}
          sub={`$1 in = $${overallROAS.toFixed(2)} out`}
          icon={<Zap className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <Tile
          label="Cost per Lead"
          value={`$${overallCPL.toFixed(2)}`}
          sub={`${fmtShort(totalLeads)} total leads`}
          icon={<Users className="h-4 w-4" />}
          accent="sky"
        />
        <Tile
          label="Cost per Acquisition"
          value={`$${overallCPA.toFixed(2)}`}
          sub={`${fmtShort(totalConversions)} total conversions`}
          icon={<Hash className="h-4 w-4" />}
        />
        <Tile
          label="Best Performer"
          value={best ? `${roi(best.revenue, best.spend).toFixed(0)}% ROI` : '--'}
          sub={best?.name ?? '--'}
          icon={<Trophy className="h-4 w-4" />}
          accent="emerald"
        />
        <Tile
          label="Worst Performer"
          value={worst ? `${roi(worst.revenue, worst.spend).toFixed(0)}% ROI` : '--'}
          sub={worst?.name ?? '--'}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Bar Chart */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">ROI by Campaign</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sorted by return on investment percentage</p>
          </div>
          <div className="flex items-center gap-3">
            {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => (
              <div key={ch} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: CHANNEL_META[ch].barColor }}
                />
                {CHANNEL_META[ch].label}
              </div>
            ))}
          </div>
        </div>
        {campaigns.length > 0 ? (
          <ROIBarChart campaigns={campaigns} />
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <BarChart2 className="h-10 w-10 opacity-20" />
          </div>
        )}
      </div>

      {/* Campaign Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">All Campaigns</h2>

          <div className="flex items-center gap-3">
            {/* Channel Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  channelFilter === 'all'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                All
              </button>
              {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    channelFilter === ch
                      ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {CHANNEL_META[ch].label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-muted border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
            >
              <option value="roi">Sort: ROI</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="spend">Sort: Spend</option>
              <option value="cpl">Sort: CPL</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No campaigns match the current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Campaign</th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Channel</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Spend</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Leads</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Conv.</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">CPL</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">CPA</th>
                  <th className="pb-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sorted.map((c) => {
                  const roiVal = roi(c.revenue, c.spend);
                  const cplVal = cpl(c.spend, c.leads);
                  const cpaVal = cpa(c.spend, c.conversions);
                  const isBest  = best && c.id === best.id;
                  const isWorst = worst && c.id === worst.id;
                  const meta = CHANNEL_META[c.channel];

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isBest ? 'bg-emerald-50' : isWorst ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3.5 font-medium text-foreground tracking-tight">
                        <div className="flex items-center gap-2">
                          {isBest && <Trophy className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                          {isWorst && <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                          {c.name}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/[0.04] bg-muted ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{fmt(c.spend)}</td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{c.leads.toLocaleString()}</td>
                      <td className="py-3.5 text-right text-foreground tabular-nums">{c.conversions.toLocaleString()}</td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400 tabular-nums">{fmt(c.revenue)}</td>
                      <td className="py-3.5 text-right text-muted-foreground tabular-nums">${cplVal.toFixed(2)}</td>
                      <td className="py-3.5 text-right text-muted-foreground tabular-nums">${cpaVal.toFixed(2)}</td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                            roiVal >= 300 ? 'text-emerald-400' : roiVal >= 100 ? 'text-emerald-300/80' : roiVal >= 0 ? 'text-amber-400' : 'text-red-400'
                          }`}
                        >
                          {roiVal >= 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {roiVal.toFixed(1)}%
                        </span>
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
              <strong className="text-foreground">{campaigns.length}</strong> campaigns
            </span>
            <span>
              Total Spend: <strong className="text-foreground">{fmt(totalSpend)}</strong>
            </span>
            <span>
              Total Revenue: <strong className="text-emerald-400">{fmt(totalRevenue)}</strong>
            </span>
            <span>
              Avg CPL: <strong className="text-foreground">${overallCPL.toFixed(2)}</strong>
            </span>
            <span>
              Avg CPA: <strong className="text-foreground">${overallCPA.toFixed(2)}</strong>
            </span>
            <span>
              ROAS: <strong className="text-amber-400">{overallROAS.toFixed(2)}x</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
