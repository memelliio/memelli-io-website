'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  CreditCard,
  CheckCircle,
  TrendingUp,
  Share2,
  Users,
  ShieldCheck,
  Building,
  ExternalLink,
  Eye,
  Clock,
} from 'lucide-react';

/* --------- Types --------- */

interface RecentApproval {
  id: string;
  userName: string;
  tenant: string;
  score: number;
  decision: 'Approved' | 'Declined' | 'Review';
  banksMatched: number;
  date: string;
}

interface BankPerformance {
  id: string;
  name: string;
  totalPulls: number;
  approvalRate: number;
  avgCreditLimit: number;
  responseTime: number;
}

interface SharedPage {
  id: string;
  url: string;
  userName: string;
  createdAt: string;
  views: number;
  clickThroughRate: number;
}

interface ApprovalSite {
  id: string;
  name: string;
  domain: string;
  totalApprovals: number;
  activeUsers: number;
}

interface DecisionDistribution {
  approved: number;
  conditional: number;
  declined: number;
}

interface ApprovalStats {
  totalSoftPulls: number;
  approvalsIssued: number;
  approvalRate: number;
  sharedApprovals: number;
  activeUsers: number;
  recentApprovals: RecentApproval[];
  decisionDistribution: DecisionDistribution;
  bankPerformance: BankPerformance[];
  sharedPages: SharedPage[];
  approvalSites: ApprovalSite[];
}

/* --------- Fallback Data --------- */

function buildFallbackData(): ApprovalStats {
  return {
    totalSoftPulls: 0,
    approvalsIssued: 0,
    approvalRate: 0,
    sharedApprovals: 0,
    activeUsers: 0,
    recentApprovals: [],
    decisionDistribution: { approved: 0, conditional: 0, declined: 0 },
    bankPerformance: [],
    sharedPages: [],
    approvalSites: [],
  };
}

/* --------- Helpers --------- */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function formatMs(ms: number): string {
  if (ms < 1) return '< 1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const DECISION_STYLE: Record<string, { bg: string; text: string }> = {
  Approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  Declined: { bg: 'bg-red-500/10', text: 'text-red-400' },
  Review: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
};

/* --------- Components --------- */

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-[hsl(var(--foreground))]',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3.5 transition-colors hover:bg-[hsl(var(--muted))]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
        <p className={`text-lg font-semibold tracking-tight ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[hsl(var(--foreground))]">{label}</span>
        <span className="text-[hsl(var(--muted-foreground))] font-medium">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(percentage, 0.5)}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold tracking-tight text-[hsl(var(--foreground))]">{children}</h2>
  );
}

/* --------- Page --------- */

export default function ApprovalPage() {
  const api = useApi();

  const [data, setData] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get<ApprovalStats>('/api/admin/approval/stats');
    if (res.error) {
      setData(buildFallbackData());
      setError(res.error);
    } else {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* -- Loading -- */
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading approval data...</p>
        </div>
      </div>
    );
  }

  const stats = data ?? buildFallbackData();
  const distTotal =
    stats.decisionDistribution.approved +
    stats.decisionDistribution.conditional +
    stats.decisionDistribution.declined;
  const approvedPct = distTotal > 0 ? (stats.decisionDistribution.approved / distTotal) * 100 : 0;
  const conditionalPct = distTotal > 0 ? (stats.decisionDistribution.conditional / distTotal) * 100 : 0;
  const declinedPct = distTotal > 0 ? (stats.decisionDistribution.declined / distTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* -- Header -- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Approval Standard</h1>
        <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
          Soft-pull approval operations across the Memelli Universe
        </p>
      </div>

      {/* -- Error banner -- */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 px-4 py-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-300">
            Could not reach approval stats API. Showing fallback data.
          </p>
          <span className="ml-auto text-xs text-yellow-500/70 truncate max-w-[200px]">{error}</span>
        </div>
      )}

      {/* -- Stats Row -- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Soft Pulls" value={formatNumber(stats.totalSoftPulls)} icon={CreditCard} accent="text-blue-400" />
        <StatCard label="Approvals Issued" value={formatNumber(stats.approvalsIssued)} icon={CheckCircle} accent="text-emerald-400" />
        <StatCard label="Approval Rate" value={`${stats.approvalRate.toFixed(1)}%`} icon={TrendingUp} accent="text-cyan-400" />
        <StatCard label="Shared Approvals" value={formatNumber(stats.sharedApprovals)} icon={Share2} accent="text-red-400" />
        <StatCard label="Active Users" value={formatNumber(stats.activeUsers)} icon={Users} accent="text-amber-400" />
      </div>

      {/* -- Recent Approvals Table -- */}
      <section className="space-y-3">
        <SectionHeading>Recent Approvals</SectionHeading>
        <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
          {stats.recentApprovals.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No recent approvals</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                  <th className="px-4 py-3 font-medium">Banks Matched</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {stats.recentApprovals.map((a) => {
                  const style = DECISION_STYLE[a.decision] ?? { bg: 'bg-[hsl(var(--muted))]', text: 'text-[hsl(var(--muted-foreground))]' };
                  return (
                    <tr key={a.id} className="hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                      <td className="px-4 py-3 text-[hsl(var(--foreground))]">{a.userName}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{a.tenant}</td>
                      <td className="px-4 py-3 text-[hsl(var(--foreground))] font-medium">{a.score}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                          {a.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{a.banksMatched}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{a.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* -- Decision Distribution + Bank Performance -- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Decision Distribution */}
        <section className="space-y-3">
          <SectionHeading>Decision Distribution</SectionHeading>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
            {distTotal === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No decision data available</p>
            ) : (
              <>
                <DistributionBar label="Approved" percentage={approvedPct} color="bg-emerald-500" />
                <DistributionBar label="Conditional" percentage={conditionalPct} color="bg-yellow-500" />
                <DistributionBar label="Declined" percentage={declinedPct} color="bg-red-500" />
              </>
            )}
          </div>
        </section>

        {/* Bank Performance */}
        <section className="space-y-3">
          <SectionHeading>Bank Performance</SectionHeading>
          <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
            {stats.bankPerformance.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No bank data available</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    <th className="px-4 py-3 font-medium">Bank</th>
                    <th className="px-4 py-3 font-medium">Pulls</th>
                    <th className="px-4 py-3 font-medium">Approval %</th>
                    <th className="px-4 py-3 font-medium">Avg Limit</th>
                    <th className="px-4 py-3 font-medium">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {stats.bankPerformance.map((b) => (
                    <tr key={b.id} className="hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                      <td className="px-4 py-3 text-[hsl(var(--foreground))]">
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                          {b.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatNumber(b.totalPulls)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${b.approvalRate >= 60 ? 'text-emerald-400' : b.approvalRate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {b.approvalRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--foreground))]">{formatCurrency(b.avgCreditLimit)}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                          {formatMs(b.responseTime)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* -- Shared Approval Pages -- */}
      <section className="space-y-3">
        <SectionHeading>Shared Approval Pages</SectionHeading>
        <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] backdrop-blur-xl">
          {stats.sharedPages.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No shared approval pages yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Share Link</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {stats.sharedPages.map((sp) => (
                  <tr key={sp.id} className="hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                    <td className="px-4 py-3 text-[hsl(var(--foreground))]">{sp.userName}</td>
                    <td className="px-4 py-3">
                      <a
                        href={sp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{sp.url}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{sp.createdAt}</td>
                    <td className="px-4 py-3 text-[hsl(var(--foreground))]">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                        {formatNumber(sp.views)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{sp.clickThroughRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* -- Approval Sites -- */}
      <section className="space-y-3">
        <SectionHeading>Approval Sites</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.approvalSites.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No approval sites configured
            </div>
          ) : (
            stats.approvalSites.map((site) => (
              <div
                key={site.id}
                className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/5">
                      <ShieldCheck className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))] truncate">{site.name}</h3>
                      <a
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        {site.domain}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Total Approvals</span>
                    <span className="text-[hsl(var(--foreground))] font-medium">{formatNumber(site.totalApprovals)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Active Users</span>
                    <span className="text-[hsl(var(--foreground))] font-medium">{formatNumber(site.activeUsers)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
