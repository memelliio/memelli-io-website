'use client';

import { useEffect, useState } from 'react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { StatCard } from '../../../../../components/ui/stat-card';
import { TrendingUp, Users, DollarSign, Target, ArrowRight, BarChart3, GitMerge } from 'lucide-react';

interface PipelineReport {
  pipelineId: string;
  pipelineName: string;
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  dealsByStage: Array<{
    stageId: string;
    stageName: string;
    count: number;
    value: number;
  }>;
}

interface ActivityReport {
  type: string;
  count: number;
}

interface StageBreakdown {
  stageId: string;
  stageName: string;
  pipelineId: string;
  pipelineName: string;
  order: number;
  count: number;
  value: number;
}

export default function CRMAnalyticsPage() {
  const api = useApi();
  const [pipelines, setPipelines] = useState<PipelineReport[]>([]);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
  const [byStage, setByStage] = useState<StageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prRes, actRes, stRes] = await Promise.all([
        api.get<any>('/api/crm/reports/pipeline-report'),
        api.get<any>('/api/crm/reports/activity-report'),
        api.get<any>('/api/crm/reports/deals-by-stage'),
      ]);

      const extract = (raw: any) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.data && Array.isArray(raw.data)) return raw.data;
        if (raw.items && Array.isArray(raw.items)) return raw.items;
        return [];
      };

      setPipelines(extract(prRes.data));
      setActivities(extract(actRes.data));
      setByStage(extract(stRes.data));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute conversion rates between stages
  const conversionRates = (() => {
    if (byStage.length < 2) return [];
    const rates: Array<{ from: string; to: string; rate: number; fromCount: number; toCount: number }> = [];
    for (let i = 0; i < byStage.length - 1; i++) {
      const fromCount = byStage[i].count;
      const toCount = byStage[i + 1].count;
      const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
      rates.push({
        from: byStage[i].stageName,
        to: byStage[i + 1].stageName,
        rate,
        fromCount,
        toCount,
      });
    }
    return rates;
  })();

  // Source attribution from pipeline data
  const totalDeals = pipelines.reduce((s, p) => s + p.totalDeals, 0);
  const totalValue = pipelines.reduce((s, p) => s + p.totalValue, 0);
  const totalWon = pipelines.reduce((s, p) => s + p.wonDeals, 0);
  const overallWinRate = pipelines.length > 0
    ? Math.round(pipelines.reduce((s, p) => s + p.winRate, 0) / pipelines.length)
    : 0;

  // Activity totals
  const totalActivities = activities.reduce((s, a) => s + a.count, 0);
  const maxActivityCount = Math.max(...activities.map((a) => a.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-card p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">CRM Analytics</h1>
        <p className="text-muted-foreground leading-relaxed mt-2">Conversion charts, performance metrics, and source attribution</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Deals" value={totalDeals} icon={GitMerge} />
        <StatCard label="Total Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Won Deals" value={totalWon} icon={Target} />
        <StatCard label="Win Rate" value={`${overallWinRate}%`} icon={TrendingUp} />
      </div>

      {/* Conversion Funnel */}
      <section>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" /> Stage Conversion Rates
        </h2>
        {conversionRates.length === 0 ? (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="py-14 text-center text-muted-foreground leading-relaxed">
              Not enough stage data for conversion analysis. Add deals to at least 2 stages.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="p-8 space-y-6">
              {conversionRates.map((cr, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-semibold tracking-tight text-foreground">{cr.from}</span>
                        <span className="text-muted-foreground">{cr.fromCount} deals</span>
                      </div>
                      <div className="h-10 w-full overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.04]">
                        <div
                          className="h-full rounded-2xl bg-primary hover:bg-primary/90 flex items-center px-4 transition-all duration-200"
                          style={{ width: '100%' }}
                        >
                          <span className="text-white font-medium">{cr.fromCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center shrink-0 px-3">
                      <ArrowRight className="h-5 w-5 text-primary" />
                      <span className={`text-lg font-semibold tracking-tight ${cr.rate >= 50 ? 'text-emerald-400' : cr.rate >= 25 ? 'text-amber-400' : 'text-primary'}`}>
                        {cr.rate}%
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-semibold tracking-tight text-foreground">{cr.to}</span>
                        <span className="text-muted-foreground">{cr.toCount} deals</span>
                      </div>
                      <div className="h-10 w-full overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.04]">
                        <div
                          className="h-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 flex items-center px-4 transition-all duration-200"
                          style={{ width: `${Math.max((cr.toCount / cr.fromCount) * 100, 5)}%` }}
                        >
                          <span className="text-white font-medium">{cr.toCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Performance Metrics by Pipeline (Rep) */}
      <section>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" /> Performance by Pipeline
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((p) => {
            const avgDealSize = p.totalDeals > 0 ? Math.round(p.totalValue / p.totalDeals) : 0;
            const closed = p.wonDeals + p.lostDeals;
            return (
              <Card key={p.pipelineId} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                <CardContent className="p-8 space-y-6">
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">{p.pipelineName}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Win Rate</p>
                      <p className="text-2xl font-semibold tracking-tight text-primary">{p.winRate}%</p>
                    </div>
                    <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Avg Deal</p>
                      <p className="text-2xl font-semibold tracking-tight text-foreground">${avgDealSize.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Total Deals</p>
                      <p className="text-2xl font-semibold tracking-tight text-foreground">{p.totalDeals}</p>
                    </div>
                    <div className="rounded-2xl border-white/[0.04] bg-card p-5 text-center">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Revenue</p>
                      <p className="text-2xl font-semibold tracking-tight text-emerald-400">${p.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Mini win/loss bar */}
                  {closed > 0 && (
                    <div className="flex gap-1">
                      <div className="h-2 rounded-l-2xl bg-emerald-400 transition-all duration-200" style={{ width: `${p.winRate}%` }} />
                      <div className="h-2 rounded-r-2xl bg-primary transition-all duration-200" style={{ width: `${100 - p.winRate}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {pipelines.length === 0 && (
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardContent className="py-14 text-center text-muted-foreground leading-relaxed">No pipeline data</CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Source Attribution (Activity types as proxy) */}
      <section>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" /> Activity Attribution (Last 30 Days)
        </h2>
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardContent className="p-8 space-y-6">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground leading-relaxed">No activity data available</div>
            ) : (
              activities.map((a) => {
                const pct = (a.count / maxActivityCount) * 100;
                const totalPct = totalActivities > 0 ? Math.round((a.count / totalActivities) * 100) : 0;
                return (
                  <div key={a.type} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tracking-tight text-foreground">{a.type}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground leading-relaxed">{a.count} activities</span>
                        <Badge variant="muted">{totalPct}%</Badge>
                      </div>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.04]">
                      <div
                        className="h-full rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-200"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* Pipeline Source Attribution */}
      <section>
        <h2 className="mb-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pipeline Contribution</h2>
        <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-8 py-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pipeline</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Deals</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Value</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">% of Total</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium w-40">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pipelines.map((p) => {
                  const valuePct = totalValue > 0 ? Math.round((p.totalValue / totalValue) * 100) : 0;
                  return (
                    <tr key={p.pipelineId} className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-8 py-6 font-semibold tracking-tight text-foreground">{p.pipelineName}</td>
                      <td className="px-8 py-6 text-muted-foreground leading-relaxed">{p.totalDeals}</td>
                      <td className="px-8 py-6 font-semibold tracking-tight text-foreground">${p.totalValue.toLocaleString()}</td>
                      <td className="px-8 py-6 text-primary font-semibold">{valuePct}%</td>
                      <td className="px-8 py-6">
                        <div className="h-2 w-full overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.04]">
                          <div className="h-full rounded-2xl bg-primary transition-all duration-200" style={{ width: `${valuePct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}