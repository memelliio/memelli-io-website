'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import {
  FileText,
  CheckCircle,
  DollarSign,
  Clock,
  XCircle,
  BadgeDollarSign,
  Building,
  CreditCard,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */

interface PipelineStage {
  name: string;
  count: number;
  totalValue: number;
  color: string;
}

interface FundingApplication {
  id: string;
  applicantName: string;
  tenant: string;
  businessType: string;
  requestedAmount: number;
  creditScore: number;
  stage: string;
  date: string;
}

interface FundingProduct {
  id: string;
  name: string;
  applications: number;
  approvalRate: number;
  avgFundedAmount: number;
}

interface DocumentReview {
  id: string;
  applicantName: string;
  documentType: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
}

interface LenderPartner {
  id: string;
  name: string;
  matchRate: number;
  totalFunded: number;
  activeDeals: number;
}

interface FundingStats {
  activeRequests: number;
  approvedThisMonth: number;
  totalFunded: number;
  pendingUnderwriting: number;
  declineRate: number;
  pipeline: PipelineStage[];
  recentApplications: FundingApplication[];
  products: FundingProduct[];
  documentQueue: DocumentReview[];
  lenders: LenderPartner[];
}

/* ─────────────────────────── Fallback Data ─────────────────────────── */

function buildFallbackData(): FundingStats {
  return {
    activeRequests: 0,
    approvedThisMonth: 0,
    totalFunded: 0,
    pendingUnderwriting: 0,
    declineRate: 0,
    pipeline: [
      { name: 'Application', count: 0, totalValue: 0, color: 'bg-blue-500' },
      { name: 'Document Review', count: 0, totalValue: 0, color: 'bg-cyan-500' },
      { name: 'Underwriting', count: 0, totalValue: 0, color: 'bg-yellow-500' },
      { name: 'Approved', count: 0, totalValue: 0, color: 'bg-emerald-500' },
      { name: 'Funded', count: 0, totalValue: 0, color: 'bg-green-500' },
      { name: 'Declined', count: 0, totalValue: 0, color: 'bg-red-500' },
    ],
    recentApplications: [],
    products: [],
    documentQueue: [],
    lenders: [],
  };
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Application:      { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  'Document Review': { bg: 'bg-cyan-500/10',    text: 'text-cyan-400' },
  Underwriting:     { bg: 'bg-yellow-500/10',   text: 'text-yellow-400' },
  Approved:         { bg: 'bg-emerald-500/10',  text: 'text-emerald-400' },
  Funded:           { bg: 'bg-green-500/10',    text: 'text-green-400' },
  Declined:         { bg: 'bg-red-500/10',      text: 'text-red-400' },
};

function getStageBadge(stage: string) {
  const cfg = STAGE_COLORS[stage] ?? { bg: 'bg-[hsl(var(--muted))]', text: 'text-[hsl(var(--muted-foreground))]' };
  return cfg;
}

/* ─────────────────────────── Components ─────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-[hsl(var(--foreground))]',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
        <p className={`text-lg font-semibold ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{title}</h2>
  );
}

/* ─────────────────────────── Pipeline ─────────────────────────── */

function PipelineView({ stages }: { stages: PipelineStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
      <SectionHeader title="Funding Pipeline" />
      <div className="mt-4 flex flex-col gap-3">
        {/* Stage flow */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 min-w-[130px]">
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{stage.name}</span>
                <span className="text-lg font-bold text-[hsl(var(--foreground))]">{stage.count}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatCurrency(stage.totalValue)}</span>
                {/* Mini bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${(stage.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Applications Table ─────────────────────────── */

function ApplicationsTable({ applications }: { applications: FundingApplication[] }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
      <SectionHeader title="Recent Applications" />
      {applications.length === 0 ? (
        <div className="mt-4 flex h-24 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No applications to display</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                <th className="pb-2 pr-4 font-medium">Applicant</th>
                <th className="pb-2 pr-4 font-medium">Tenant</th>
                <th className="pb-2 pr-4 font-medium">Business Type</th>
                <th className="pb-2 pr-4 font-medium text-right">Requested</th>
                <th className="pb-2 pr-4 font-medium text-right">Credit Score</th>
                <th className="pb-2 pr-4 font-medium">Stage</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {applications.map((app) => {
                const badge = getStageBadge(app.stage);
                return (
                  <tr key={app.id} className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-[hsl(var(--foreground))]">{app.applicantName}</td>
                    <td className="py-2.5 pr-4 text-[hsl(var(--muted-foreground))]">{app.tenant}</td>
                    <td className="py-2.5 pr-4 text-[hsl(var(--muted-foreground))]">{app.businessType}</td>
                    <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(app.requestedAmount)}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <span
                        className={
                          app.creditScore >= 720
                            ? 'text-emerald-400'
                            : app.creditScore >= 650
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }
                      >
                        {app.creditScore}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium uppercase ${badge.bg} ${badge.text}`}
                      >
                        {app.stage}
                      </span>
                    </td>
                    <td className="py-2.5 text-[hsl(var(--muted-foreground))]">{formatDate(app.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Funding Products ─────────────────────────── */

const PRODUCT_ICONS: Record<string, LucideIcon> = {
  LOC: CreditCard,
  'Business Card': CreditCard,
  SBA: Building,
  'Term Loan': BadgeDollarSign,
  'Revenue Based': TrendingUp,
};

function FundingProducts({ products }: { products: FundingProduct[] }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
      <SectionHeader title="Funding Products" />
      {products.length === 0 ? (
        <div className="mt-4 flex h-24 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No product data available</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const Icon = PRODUCT_ICONS[product.name] ?? BadgeDollarSign;
            return (
              <div
                key={product.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{product.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Apps</p>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{product.applications}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Approval</p>
                    <p className="text-sm font-semibold text-emerald-400">{product.approvalRate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Avg Funded</p>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{formatCurrency(product.avgFundedAmount)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Document Review Queue ─────────────────────────── */

function DocumentQueue({ documents }: { documents: DocumentReview[] }) {
  const pending = documents.filter((d) => d.status === 'pending');
  const verified = documents.filter((d) => d.status === 'verified');
  const rejected = documents.filter((d) => d.status === 'rejected');

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    pending:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    verified: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    rejected: { bg: 'bg-red-500/10',    text: 'text-red-400' },
  };

  function renderList(items: DocumentReview[], emptyMsg: string) {
    if (items.length === 0) {
      return <p className="text-sm text-[hsl(var(--muted-foreground))] px-3 py-2">{emptyMsg}</p>;
    }
    return (
      <div className="space-y-1.5">
        {items.map((doc) => {
          const style = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-[hsl(var(--foreground))] truncate">{doc.applicantName}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{doc.documentType}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(doc.submittedAt)}</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${style.bg} ${style.text}`}
                >
                  {doc.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
      <SectionHeader title="Document Review Queue" />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Pending</p>
          <p className="text-lg font-bold text-yellow-400">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Verified</p>
          <p className="text-lg font-bold text-emerald-400">{verified.length}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Rejected</p>
          <p className="text-lg font-bold text-red-400">{rejected.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Pending Review</h3>
        {renderList(pending, 'No documents pending review')}

        <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Recently Verified</h3>
        {renderList(verified, 'No recently verified documents')}

        <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Recently Rejected</h3>
        {renderList(rejected, 'No recently rejected documents')}
      </div>
    </div>
  );
}

/* ─────────────────────────── Lender Matching ─────────────────────────── */

function LenderMatching({ lenders }: { lenders: LenderPartner[] }) {
  const avgMatchRate =
    lenders.length > 0
      ? (lenders.reduce((sum, l) => sum + l.matchRate, 0) / lenders.length).toFixed(1)
      : '0';

  const topLenders = [...lenders].sort((a, b) => b.totalFunded - a.totalFunded).slice(0, 5);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5 space-y-4">
      <SectionHeader title="Lender Matching" />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Active Partners</p>
          <p className="text-lg font-bold text-blue-400">{lenders.length}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Avg Match Rate</p>
          <p className="text-lg font-bold text-emerald-400">{avgMatchRate}%</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Total Funded</p>
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">
            {formatCurrency(lenders.reduce((sum, l) => sum + l.totalFunded, 0))}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">Top Performing Lenders</h3>
        {topLenders.length === 0 ? (
          <div className="flex h-16 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No lender data available</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {topLenders.map((lender) => (
              <div
                key={lender.id}
                className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Building className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[hsl(var(--foreground))] truncate">{lender.name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{lender.activeDeals} active deals</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{lender.matchRate}% match</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{formatCurrency(lender.totalFunded)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function FundingPage() {
  const api = useApi();

  const [data, setData] = useState<FundingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get<FundingStats>('/api/admin/funding/stats');
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading funding data...</p>
        </div>
      </div>
    );
  }

  const stats = data ?? buildFallbackData();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Funding Engine</h1>
        <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
          All funding operations across the Memelli Universe
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-300">
            Could not reach funding API. Showing fallback data.
          </p>
          <span className="ml-auto text-xs text-yellow-500/70 truncate max-w-[200px]">{error}</span>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Active Funding Requests"
          value={stats.activeRequests.toLocaleString()}
          icon={FileText}
          accent="text-blue-400"
        />
        <StatCard
          label="Approved This Month"
          value={stats.approvedThisMonth.toLocaleString()}
          icon={CheckCircle}
          accent="text-emerald-400"
        />
        <StatCard
          label="Total Funded Amount"
          value={formatCurrency(stats.totalFunded)}
          icon={DollarSign}
          accent="text-green-400"
        />
        <StatCard
          label="Pending Underwriting"
          value={stats.pendingUnderwriting.toLocaleString()}
          icon={Clock}
          accent="text-yellow-400"
        />
        <StatCard
          label="Decline Rate"
          value={`${stats.declineRate}%`}
          icon={XCircle}
          accent={stats.declineRate > 30 ? 'text-red-400' : 'text-[hsl(var(--foreground))]'}
        />
      </div>

      {/* ── Funding Pipeline ── */}
      <PipelineView stages={stats.pipeline} />

      {/* ── Recent Applications ── */}
      <ApplicationsTable applications={stats.recentApplications} />

      {/* ── Funding Products + Document Queue ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FundingProducts products={stats.products} />
        <DocumentQueue documents={stats.documentQueue} />
      </div>

      {/* ── Lender Matching ── */}
      <LenderMatching lenders={stats.lenders} />
    </div>
  );
}
