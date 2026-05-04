'use client';

import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from '@memelli/ui';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RevenueVelocity {
  daily: number;
  weekly: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
  growthRate: number;
}

interface RevenueSummary {
  generatedAt: string;
  period: 'daily' | 'weekly';
  totalRevenue: number;
  revenueBySource: Record<string, number>;
  revenueByService: Record<string, number>;
  topSources: Array<{ source: string; revenue: number; pct: number }>;
  underperforming: Array<{ channel: string; revenue: number; avgBenchmark: number; gap: number }>;
  conversionRate: number;
  avgTransactionValue: number;
  pipelineValue: number;
  velocity: RevenueVelocity;
  customerCount: number;
  timestamp: number;
}

interface CustomerLTV {
  customerId: string;
  ltv: number;
  purchases: number;
  tenureDays: number;
  avgOrderValue: number;
  predictedAnnualValue: number;
  segment: 'high' | 'medium' | 'low';
}

interface StrategyRecommendation {
  id: string;
  category: 'growth' | 'optimization' | 'retention' | 'expansion' | 'risk';
  priority: number;
  title: string;
  description: string;
  expectedImpact: string;
  confidence: number;
  createdAt: string;
  action?: string;
}

interface UpsellOpportunity {
  customerId: string;
  currentServices: string[];
  recommendedService: string;
  trigger: string;
  confidence: number;
  estimatedRevenue: number;
}

interface SummaryResponse {
  summary: RevenueSummary | null;
  velocity: RevenueVelocity | null;
  upsellCount: number;
  ltvCustomerCount: number;
  topLTVCustomers: CustomerLTV[];
  generatedAt: string;
}

interface RecommendationsResponse {
  recommendations: StrategyRecommendation[];
  upsellOpportunities: UpsellOpportunity[];
  generatedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function signedPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function trendColor(trend: RevenueVelocity['trend']): string {
  if (trend === 'accelerating') return 'text-green-400';
  if (trend === 'decelerating') return 'text-red-400';
  return 'text-yellow-400';
}

function categoryStyle(category: StrategyRecommendation['category']): string {
  const map: Record<string, string> = {
    growth: 'bg-green-900 text-green-300',
    optimization: 'bg-blue-50 text-blue-300',
    retention: 'bg-card text-primary/80',
    expansion: 'bg-yellow-900 text-yellow-300',
    risk: 'bg-red-50 text-red-300',
  };
  return map[category] ?? 'bg-muted text-foreground';
}

function segmentTextColor(segment: CustomerLTV['segment']): string {
  if (segment === 'high') return 'text-green-400';
  if (segment === 'medium') return 'text-yellow-400';
  return 'text-red-400';
}

function segmentBadgeStyle(segment: CustomerLTV['segment']): string {
  if (segment === 'high') return 'bg-green-900 text-green-300';
  if (segment === 'medium') return 'bg-yellow-900 text-yellow-300';
  return 'bg-red-50 text-red-300';
}

// ─── Skeleton Atoms ──────────────────────────────────────────────────────────

function MetricSkeleton() {
  return (
    <Card className="bg-[#111] border-border">
      <CardContent className="p-5">
        <Skeleton className="h-3 w-28 mb-3 bg-muted" />
        <Skeleton className="h-8 w-24 mb-2 bg-muted" />
        <Skeleton className="h-3 w-20 bg-muted" />
      </CardContent>
    </Card>
  );
}

function BlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="bg-[#111] border-border">
      <CardHeader>
        <Skeleton className="h-5 w-48 bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-muted rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RevenueStrategyPage() {
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [recsData, setRecsData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<Record<string, boolean>>({});
  const [dispatched, setDispatched] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();
      const [summaryRes, recsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/revenue-strategy/summary`, { headers }),
        fetch(`${API_URL}/api/admin/revenue-strategy/recommendations`, { headers }),
      ]);

      if (!summaryRes.ok) throw new Error(`Summary fetch failed (${summaryRes.status})`);
      if (!recsRes.ok) throw new Error(`Recommendations fetch failed (${recsRes.status})`);

      const [summaryJson, recsJson] = await Promise.all([summaryRes.json(), recsRes.json()]);
      setSummaryData(summaryJson);
      setRecsData(recsJson);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue strategy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dispatchTask = useCallback(async (action: string, taskId: string) => {
    setDispatching((prev) => ({ ...prev, [taskId]: true }));
    try {
      await fetch(`${API_URL}/api/admin/command-center/dispatch`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: action, source: 'revenue-strategy' }),
      });
      setDispatched((prev) => ({ ...prev, [taskId]: true }));
    } catch {
      // best-effort
    } finally {
      setDispatching((prev) => ({ ...prev, [taskId]: false }));
    }
  }, []);

  const velocity = summaryData?.velocity ?? null;
  const summary = summaryData?.summary ?? null;
  const topLTV = summaryData?.topLTVCustomers ?? [];
  const recommendations = recsData?.recommendations ?? [];
  const upsells = recsData?.upsellOpportunities ?? [];

  const ltvCounts = topLTV.reduce(
    (acc, c) => { acc[c.segment] = (acc[c.segment] ?? 0) + 1; return acc; },
    { high: 0, medium: 0, low: 0 } as Record<string, number>,
  );

  const churnRisk = topLTV.filter((c) => c.segment === 'low');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── Header ── */}
      <div className="border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue Strategy</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-driven revenue intelligence — velocity, LTV, upsells, and growth recommendations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 rounded-lg border border-red-800 bg-red-50 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="px-8 py-6 space-y-10">

        {/* ── Revenue Velocity ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Revenue Velocity
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <>
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </>
            ) : (
              <>
                <Card className="bg-[#111] border-border">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Daily Change</p>
                    <p className={`text-2xl font-bold ${(velocity?.daily ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {velocity ? fmt(velocity.daily) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">vs yesterday</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#111] border-border">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weekly Change</p>
                    <p className={`text-2xl font-bold ${(velocity?.weekly ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {velocity ? fmt(velocity.weekly) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">vs 7 days ago</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#111] border-border">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth Rate</p>
                    <p className={`text-2xl font-bold ${(velocity?.growthRate ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {velocity ? signedPct(velocity.growthRate) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">daily rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#111] border-border">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trend</p>
                    <p className={`text-2xl font-bold capitalize ${velocity ? trendColor(velocity.trend) : 'text-muted-foreground'}`}>
                      {velocity?.trend ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">momentum signal</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* ── Revenue Overview ── */}
        {!loading && summary && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Revenue Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#111] border-border">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-red-500">{fmt(summary.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.period} period</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111] border-border">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Transaction</p>
                  <p className="text-2xl font-bold text-white">{fmt(summary.avgTransactionValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">per conversion</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111] border-border">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pipeline Value</p>
                  <p className="text-2xl font-bold text-white">{fmt(summary.pipelineValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">active opportunities</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111] border-border">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conversion Rate</p>
                  <p className={`text-2xl font-bold ${summary.conversionRate >= 0.15 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {(summary.conversionRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">15% target</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* ── Upsell Opportunities + LTV Segments ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upsell Opportunities */}
          {loading ? (
            <BlockSkeleton rows={4} />
          ) : (
            <Card className="bg-[#111] border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  Top Upsell Opportunities
                  <Badge className="bg-red-50 text-red-300 text-xs ml-1">
                    {summaryData?.upsellCount ?? 0} identified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upsells.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">
                    No upsell opportunities identified yet. Run a strategy refresh to generate them.
                  </p>
                ) : (
                  upsells.slice(0, 8).map((opp, i) => {
                    const taskId = `upsell-${opp.customerId}-${i}`;
                    return (
                      <div
                        key={taskId}
                        className="flex items-start justify-between gap-3 rounded-lg bg-card p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white capitalize truncate">
                            {opp.recommendedService.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Customer {opp.customerId.slice(-8)} · {opp.trigger}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-green-400">{fmt(opp.estimatedRevenue)}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{Math.round(opp.confidence * 100)}% confidence</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dispatchTask(`upsell_${opp.recommendedService}_for_${opp.customerId}`, taskId)}
                          disabled={dispatching[taskId] || dispatched[taskId]}
                          className="shrink-0 border-border text-foreground hover:bg-muted text-xs px-2.5 py-1 h-auto"
                        >
                          {dispatched[taskId] ? 'Dispatched' : dispatching[taskId] ? '...' : 'Dispatch Task'}
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {/* Customer LTV Segments */}
          {loading ? (
            <BlockSkeleton rows={5} />
          ) : (
            <Card className="bg-[#111] border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  Customer LTV Segments
                  <Badge className="bg-muted text-foreground text-xs ml-1">
                    {summaryData?.ltvCustomerCount ?? 0} tracked
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Segment summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(['high', 'medium', 'low'] as const).map((seg) => (
                    <div key={seg} className="rounded-lg bg-card p-3 text-center">
                      <p className={`text-xl font-bold ${segmentTextColor(seg)}`}>
                        {ltvCounts[seg] ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{seg} LTV</p>
                    </div>
                  ))}
                </div>

                {/* Top LTV list */}
                {topLTV.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No LTV data available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {topLTV.map((c, i) => (
                      <div
                        key={c.customerId}
                        className="flex items-center justify-between rounded-lg bg-card px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                          <div>
                            <p className="text-xs font-mono text-foreground">{c.customerId.slice(-12)}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.purchases} purchases · {c.tenureDays}d tenure
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-white">
                            {fmt(c.predictedAnnualValue)}<span className="text-xs text-muted-foreground">/yr</span>
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${segmentBadgeStyle(c.segment)}`}>
                            {c.segment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Underperforming Channels ── */}
        <section>
          {loading ? (
            <BlockSkeleton rows={3} />
          ) : (
            <Card className="bg-[#111] border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-semibold">Underperforming Channels</CardTitle>
              </CardHeader>
              <CardContent>
                {!summary || summary.underperforming.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-2">All channels are meeting benchmark targets.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 pr-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Channel</th>
                          <th className="pb-2 pr-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actual</th>
                          <th className="pb-2 pr-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Benchmark</th>
                          <th className="pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Gap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {summary.underperforming.map((ch) => (
                          <tr key={ch.channel}>
                            <td className="py-3 pr-6 text-white capitalize">{ch.channel.replace(/_/g, ' ')}</td>
                            <td className="py-3 pr-6 text-yellow-400">{fmt(ch.revenue)}</td>
                            <td className="py-3 pr-6 text-muted-foreground">{fmt(ch.avgBenchmark)}</td>
                            <td className="py-3 text-red-400 font-medium">-{fmt(ch.gap)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── AI Growth Strategy Recommendations ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            AI Growth Strategy Recommendations
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BlockSkeleton rows={2} />
              <BlockSkeleton rows={2} />
              <BlockSkeleton rows={2} />
              <BlockSkeleton rows={2} />
            </div>
          ) : recommendations.length === 0 ? (
            <Card className="bg-[#111] border-border">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">
                  No recommendations generated yet. Trigger a strategy refresh to generate AI insights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => {
                const taskId = `rec-${rec.id}`;
                const action = rec.action ?? rec.title;
                return (
                  <Card key={rec.id} className="bg-[#111] border-border flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${categoryStyle(rec.category)}`}>
                          {rec.category}
                        </span>
                        <span className="text-xs text-muted-foreground">Priority {rec.priority}</span>
                      </div>
                      <CardTitle className="text-white text-sm font-semibold mt-2 leading-snug">
                        {rec.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 flex-1">
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                      <div className="rounded-lg bg-card px-3 py-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Expected Impact</p>
                        <p className="text-xs font-medium text-green-400">{rec.expectedImpact}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${Math.round(rec.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => dispatchTask(action, taskId)}
                          disabled={dispatching[taskId] || dispatched[taskId]}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 h-auto"
                        >
                          {dispatched[taskId]
                            ? 'Dispatched'
                            : dispatching[taskId]
                            ? 'Dispatching...'
                            : 'Dispatch Task'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Churn Risk Customers ── */}
        <section>
          {loading ? (
            <BlockSkeleton rows={4} />
          ) : (
            <Card className="bg-[#111] border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  Churn Risk Customers
                  <Badge className="bg-red-50 text-red-300 text-xs ml-1">
                    Low LTV
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {churnRisk.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-2">
                    No low-LTV customers in the current top sample.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {churnRisk.map((c) => {
                      const taskId = `churn-${c.customerId}`;
                      return (
                        <div
                          key={c.customerId}
                          className="flex items-center justify-between rounded-lg bg-card px-3 py-2.5"
                        >
                          <div>
                            <p className="text-xs font-mono text-foreground">{c.customerId.slice(-14)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              LTV {fmt(c.ltv)} · Avg order {fmt(c.avgOrderValue)} · {c.tenureDays}d active
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="text-sm font-semibold text-red-400">
                              {fmt(c.predictedAnnualValue)}<span className="text-xs text-muted-foreground">/yr</span>
                            </p>
                            <Button
                              size="sm"
                              onClick={() => dispatchTask(`retention_outreach_for_${c.customerId}`, taskId)}
                              disabled={dispatching[taskId] || dispatched[taskId]}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 h-auto"
                            >
                              {dispatched[taskId]
                                ? 'Dispatched'
                                : dispatching[taskId]
                                ? '...'
                                : 'Dispatch Task'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Footer */}
        {summaryData && (
          <p className="text-xs text-muted-foreground text-right pb-4">
            Data generated: {new Date(summaryData.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
