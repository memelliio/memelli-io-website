'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MousePointerClick,
  UserPlus,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { MetricTile } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
  id: string;
  name: string;
  revenue: number;
  referrals: number;
  conversionRate: number;
}

interface AnalyticsData {
  totalClicks: number;
  totalSignups: number;
  conversions: number;
  revenue: number;
  avgConversionRate: number;
  leaderboard: LeaderboardEntry[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PartnerAnalyticsPage() {
  const api = useApi();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(30);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<AnalyticsData>(
      `/api/partners/analytics/leaderboard?days=${days}`
    );
    if (res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Partner Analytics</h1>
            <p className="text-muted-foreground leading-relaxed mt-1">
              Performance metrics across your partner network
            </p>
          </div>

          {/* Date Range Selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl px-4 py-3 text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Metric Tiles */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <MetricTile
                label="Total Clicks"
                value={data?.totalClicks ?? 0}
                icon={<MousePointerClick className="h-4 w-4" />}
              />
              <MetricTile
                label="Total Signups"
                value={data?.totalSignups ?? 0}
                icon={<UserPlus className="h-4 w-4" />}
                trend={(data?.totalSignups ?? 0) > 0 ? 'up' : 'flat'}
              />
              <MetricTile
                label="Conversions"
                value={data?.conversions ?? 0}
                icon={<ArrowRightLeft className="h-4 w-4" />}
                trend={(data?.conversions ?? 0) > 0 ? 'up' : 'flat'}
              />
              <MetricTile
                label="Revenue"
                value={fmtCurrency(data?.revenue ?? 0)}
                icon={<DollarSign className="h-4 w-4" />}
                trend={(data?.revenue ?? 0) > 0 ? 'up' : 'flat'}
              />
              <MetricTile
                label="Avg Conversion Rate"
                value={`${(data?.avgConversionRate ?? 0).toFixed(1)}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                trend={(data?.avgConversionRate ?? 0) > 0 ? 'up' : 'flat'}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Revenue Over Time */}
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-6">
                  Revenue Over Time
                </h2>
                <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-white/[0.06] bg-card">
                  <p className="text-muted-foreground">Line chart placeholder</p>
                </div>
              </div>

              {/* Signups by Source */}
              <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-6">
                  Signups by Source
                </h2>
                <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-white/[0.06] bg-card">
                  <p className="text-muted-foreground">Bar chart placeholder</p>
                </div>
              </div>
            </div>

            {/* Top Partners Leaderboard */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.04]">
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Top Partners
                </h2>
              </div>

              {(data?.leaderboard ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No partner data for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left">
                          #
                        </th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left">
                          Revenue
                        </th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left">
                          Referrals
                        </th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-left">
                          Conversion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {(data?.leaderboard ?? []).map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className="hover:bg-white/[0.04] transition-all duration-200"
                        >
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {entry.name}
                          </td>
                          <td className="px-6 py-4 text-red-400 font-medium">
                            {fmtCurrency(Number(entry.revenue) || 0)}
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {entry.referrals}
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {entry.conversionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}