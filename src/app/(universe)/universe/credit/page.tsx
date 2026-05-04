'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  CreditCard,
  CheckCircle,
  Wrench,
  BadgeDollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreditStats {
  creditPullsToday: number;
  fundingReadyUsers: number;
  creditRepairRouted: number;
  activeFundingRequests: number;
  pendingReviews: number;
  approvalRate: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  recentPulls: CreditPull[];
  fundingPipeline: {
    applied: number;
    underReview: number;
    approved: number;
    funded: number;
    declined: number;
  };
  creditRepairQueue: {
    usersRouted: number;
    activePrograms: number;
    avgTimelineWeeks: number;
    completionRate: number;
  };
  prequalActivity: {
    recentChecks: PrequalCheck[];
    bankApprovalRate: number;
    topBanks: BankPerformance[];
  };
}

interface CreditPull {
  id: string;
  contactName: string;
  tenant: string;
  score: number;
  category: string;
  decision: 'Funding Ready' | 'Credit Repair';
  date: string;
}

interface PrequalCheck {
  id: string;
  contactName: string;
  bank: string;
  result: 'Preapproved' | 'Declined' | 'Pending';
  amount: number;
  date: string;
}

interface BankPerformance {
  bank: string;
  approvalRate: number;
  totalChecks: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function scoreCategory(score: number): string {
  if (score >= 720) return 'Excellent';
  if (score >= 680) return 'Good';
  if (score >= 620) return 'Fair';
  return 'Poor';
}

function scoreCategoryColor(cat: string): string {
  switch (cat) {
    case 'Excellent': return 'text-emerald-400';
    case 'Good': return 'text-green-400';
    case 'Fair': return 'text-amber-400';
    case 'Poor': return 'text-red-400';
    default: return 'text-[hsl(var(--muted-foreground))]';
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditFundingPage() {
  const api = useApi();

  const [stats, setStats] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get<CreditStats>('/api/admin/credit/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setStats(res.data);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  /* ---- derived helpers ---- */
  const val = (v: number | undefined | null) => (v != null ? v.toLocaleString() : '\u2014');
  const pct = (v: number | undefined | null) => (v != null ? `${v}%` : '\u2014');

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-red-500" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading credit &amp; funding data...</p>
        </div>
      </div>
    );
  }

  /* ---- error state ---- */
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-orange-400" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="mt-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---- score distribution bar ---- */
  const dist = stats?.scoreDistribution ?? { excellent: 0, good: 0, fair: 0, poor: 0 };
  const distTotal = dist.excellent + dist.good + dist.fair + dist.poor;

  const pipeline = stats?.fundingPipeline ?? { applied: 0, underReview: 0, approved: 0, funded: 0, declined: 0 };
  const repair = stats?.creditRepairQueue ?? { usersRouted: 0, activePrograms: 0, avgTimelineWeeks: 0, completionRate: 0 };
  const prequal = stats?.prequalActivity ?? { recentChecks: [], bankApprovalRate: 0, topBanks: [] };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-[1600px] px-6 py-8">

        {/* -- Header -- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-red-400" />
            Credit &amp; Funding
          </h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">All credit and funding activity across the Memelli Universe</p>
        </div>

        {/* -- Stats Row (6 cards) -- */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Credit Pulls Today</span>
              <CreditCard className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-2">{val(stats?.creditPullsToday)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Inquiries processed</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Funding Ready</span>
              <CheckCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">{val(stats?.fundingReadyUsers)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Users qualified</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Credit Repair Routed</span>
              <Wrench className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-400 mt-2">{val(stats?.creditRepairRouted)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Needs improvement</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Active Funding</span>
              <BadgeDollarSign className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-blue-400 mt-2">{val(stats?.activeFundingRequests)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">In progress</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Pending Reviews</span>
              <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-orange-400 mt-2">{val(stats?.pendingReviews)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Awaiting action</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 transition-colors hover:bg-[hsl(var(--muted))]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Approval Rate</span>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">{pct(stats?.approvalRate)}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Overall success</p>
          </div>
        </div>

        {/* -- Credit Score Distribution -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-400" />
            Credit Score Distribution
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6">
            {distTotal > 0 ? (
              <>
                <div className="flex h-8 w-full overflow-hidden rounded-xl">
                  {dist.excellent > 0 && (
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(dist.excellent / distTotal) * 100}%` }} />
                  )}
                  {dist.good > 0 && (
                    <div className="bg-green-500 transition-all" style={{ width: `${(dist.good / distTotal) * 100}%` }} />
                  )}
                  {dist.fair > 0 && (
                    <div className="bg-amber-500 transition-all" style={{ width: `${(dist.fair / distTotal) * 100}%` }} />
                  )}
                  {dist.poor > 0 && (
                    <div className="bg-red-500 transition-all" style={{ width: `${(dist.poor / distTotal) * 100}%` }} />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Excellent (720+)</span>
                    <span className="ml-auto text-sm font-semibold text-emerald-400">{dist.excellent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Good (680-719)</span>
                    <span className="ml-auto text-sm font-semibold text-green-400">{dist.good}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Fair (620-679)</span>
                    <span className="ml-auto text-sm font-semibold text-amber-400">{dist.fair}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Poor (&lt;620)</span>
                    <span className="ml-auto text-sm font-semibold text-red-400">{dist.poor}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No score distribution data available</p>
            )}
          </div>
        </div>

        {/* -- Recent Credit Pulls Table -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-400" />
            Recent Credit Pulls
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Contact</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Tenant</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Score</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Category</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Decision</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentPulls ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">No recent credit pulls</td>
                    </tr>
                  ) : (
                    stats!.recentPulls.map((pull) => {
                      const cat = pull.category || scoreCategory(pull.score);
                      return (
                        <tr key={pull.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                          <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{pull.contactName}</td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{pull.tenant}</td>
                          <td className={`px-4 py-3 font-semibold ${scoreCategoryColor(cat)}`}>{pull.score}</td>
                          <td className={`px-4 py-3 ${scoreCategoryColor(cat)}`}>{cat}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                pull.decision === 'Funding Ready'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {pull.decision}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatTime(pull.date)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* -- Funding Pipeline + Credit Repair Queue -- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">

          {/* Funding Pipeline */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-red-400" />
              Funding Pipeline
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 border-l-2 border-l-red-500/40">
              {(() => {
                const stages: { label: string; count: number; color: string; bgColor: string }[] = [
                  { label: 'Applied', count: pipeline.applied, color: 'text-blue-400', bgColor: 'bg-blue-500' },
                  { label: 'Under Review', count: pipeline.underReview, color: 'text-amber-400', bgColor: 'bg-amber-500' },
                  { label: 'Approved', count: pipeline.approved, color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
                  { label: 'Funded', count: pipeline.funded, color: 'text-green-400', bgColor: 'bg-green-500' },
                  { label: 'Declined', count: pipeline.declined, color: 'text-red-400', bgColor: 'bg-red-500' },
                ];
                const maxCount = Math.max(...stages.map((s) => s.count), 1);
                return (
                  <div className="space-y-4">
                    {stages.map((stage) => (
                      <div key={stage.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-[hsl(var(--foreground))]">{stage.label}</span>
                          <span className={`text-sm font-semibold ${stage.color}`}>{stage.count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                          <div
                            className={`h-2 rounded-full ${stage.bgColor} transition-all`}
                            style={{ width: `${(stage.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Credit Repair Queue */}
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-400" />
              Credit Repair Queue
            </h2>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 border-l-2 border-l-amber-500/40">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Users Routed</p>
                  <p className="text-2xl font-bold tracking-tight text-amber-400 mt-1">{val(repair.usersRouted)}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Active Programs</p>
                  <p className="text-2xl font-bold tracking-tight text-blue-400 mt-1">{val(repair.activePrograms)}</p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Avg Timeline</p>
                  <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-1">
                    {repair.avgTimelineWeeks ? `${repair.avgTimelineWeeks} wks` : '\u2014'}
                  </p>
                </div>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-400 mt-1">{pct(repair.completionRate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -- Prequal Activity -- */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-400" />
            Prequal Activity
          </h2>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Prequalification Checks */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
                <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Recent Prequalification Checks</span>
                </div>
                <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))]">
                        <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Contact</th>
                        <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Bank</th>
                        <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Result</th>
                        <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Amount</th>
                        <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prequal.recentChecks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">No recent prequal checks</td>
                        </tr>
                      ) : (
                        prequal.recentChecks.map((check) => (
                          <tr key={check.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                            <td className="px-4 py-2.5 text-[hsl(var(--foreground))] font-medium">{check.contactName}</td>
                            <td className="px-4 py-2.5 text-[hsl(var(--muted-foreground))]">{check.bank}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  check.result === 'Preapproved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : check.result === 'Declined'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {check.result}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[hsl(var(--foreground))]">{formatCurrency(check.amount)}</td>
                            <td className="px-4 py-2.5 text-[hsl(var(--muted-foreground))]">{formatTime(check.date)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bank Performance + Approval Rate */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-2">Bank Preapproval Rate</p>
                <p className="text-3xl font-bold tracking-tight text-red-400">{pct(prequal.bankApprovalRate)}</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">Across all banks</p>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-medium mb-3">Top Performing Banks</p>
                {prequal.topBanks.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No bank data yet</p>
                ) : (
                  <div className="space-y-3">
                    {prequal.topBanks.map((bank) => (
                      <div key={bank.bank} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[hsl(var(--foreground))] font-medium">{bank.bank}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{bank.totalChecks} checks</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{bank.approvalRate}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
