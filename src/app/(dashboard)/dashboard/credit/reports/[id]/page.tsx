'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  TrendingUp,
  Search,
  FileWarning,
  Lightbulb,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, DataTable, type DataTableColumn } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BureauScore {
  bureau: string;
  score: number;
  status: string;
  threshold: number;
  score_type?: string;
}

interface Tradeline {
  bureau: string;
  creditor_name: string;
  account_number: string;
  account_type: string;
  current_balance: number | null;
  credit_limit: number | null;
  payment_status: string;
  account_rating: string;
  late_30_count: number | null;
  late_60_count: number | null;
  late_90_count: number | null;
}

interface Inquiry {
  bureau: string | null;
  company_name: string;
  date: string | null;
  type: string;
}

interface PublicRecord {
  bureau: string | null;
  type: string;
  status: string;
  date_filed: string | null;
  amount: number | null;
}

interface TriggeredRule {
  rule: string;
  tier: string;
  summary: string;
  description: string;
  remediation: string;
}

interface ReportDetail {
  id: number;
  clientId: string;
  decisionTier: string;
  createdAt: string;
  reportJson: {
    scores?: Record<string, any>;
    tradelines?: Tradeline[];
    inquiries?: Inquiry[];
    public_records?: PublicRecord[];
  };
  decisionJson: {
    decision_tier: string;
    credit_scores?: BureauScore[];
    triggered_rules?: TriggeredRule[];
    approval_summary?: {
      headline: string;
      message: string;
      next_steps: string[];
      average_score: number;
      passing_bureaus: number;
      total_bureaus: number;
    };
    remediation_steps?: { step_number: number; action: string; description: string; priority: string }[];
    utilization_summary?: { bureau: string; total_balance: number; total_limit: number; utilization_pct: number | null; status: string }[];
    inquiry_removal?: { needed: boolean; bureaus: Record<string, { count: number; total_count: number; status: string }> };
    recommendations?: TriggeredRule[];
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tierConfig(tier: string) {
  switch (tier) {
    case 'APPROVE':
      return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06] border-emerald-500/20', label: 'Approved' };
    case 'BORDERLINE':
      return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/[0.06] border-amber-500/20', label: 'Borderline' };
    case 'DECLINE':
      return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/[0.06] border-red-500/20', label: 'Declined' };
    default:
      return { icon: ShieldCheck, color: 'text-muted-foreground', bg: 'bg-muted border-border', label: tier };
  }
}

function scoreColor(score: number, threshold: number) {
  if (score >= threshold) return 'text-emerald-400';
  if (score >= threshold - 40) return 'text-amber-400';
  return 'text-red-400';
}

function scoreGlow(score: number, threshold: number) {
  if (score >= threshold) return 'drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]';
  if (score >= threshold - 40) return 'drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]';
  return 'drop-shadow-[0_0_10px_rgba(239,68,68,0.35)]';
}

function scoreGaugePct(score: number) {
  const min = 300;
  const max = 850;
  return Math.max(0, Math.min(100, ((score - min) / (max - min)) * 100));
}

function formatCurrency(val: number | null) {
  if (val === null || val === undefined) return '--';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/*  Score Gauge                                                        */
/* ------------------------------------------------------------------ */

function ScoreGauge({ bureau, score, status, threshold }: BureauScore) {
  const pct = scoreGaugePct(score);
  const passing = status === 'passing';

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card backdrop-blur-xl p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{bureau}</p>
      <div className="relative mt-3 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={passing ? '#34d399' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold tracking-tighter ${scoreColor(score, threshold)} ${scoreGlow(score, threshold)}`}>{score}</span>
        </div>
      </div>
      <span className={`mt-2 text-xs font-medium ${passing ? 'text-emerald-400' : 'text-red-400'}`}>
        {passing ? 'Passing' : 'Below threshold'}
      </span>
      <span className="text-[10px] text-muted-foreground">Min: {threshold}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const api = useApi();
  const reportId = params.id as string;

  const { data: report, isLoading } = useQuery<ReportDetail>({
    queryKey: ['credit-report', reportId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ReportDetail }>(`/api/credit/reports/${reportId}`);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load report');
      return res.data.data;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="line" height={32} />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <XCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Report not found</p>
        <button
          onClick={() => router.push('/dashboard/credit/reports')}
          className="mt-3 text-sm text-red-400 hover:underline"
        >
          Back to reports
        </button>
      </div>
    );
  }

  const decision = report.decisionJson;
  const tier = tierConfig(decision.decision_tier);
  const TierIcon = tier.icon;
  const scores = decision.credit_scores ?? [];
  const tradelines = report.reportJson?.tradelines ?? [];
  const inquiries = report.reportJson?.inquiries ?? [];
  const publicRecords = report.reportJson?.public_records ?? [];
  const triggeredRules = decision.triggered_rules ?? [];
  const recommendations = decision.recommendations ?? [];
  const remediationSteps = decision.remediation_steps ?? [];

  const tradelineColumns: DataTableColumn<Tradeline>[] = [
    { header: 'Creditor', accessor: 'creditor_name', render: (r) => <span className="text-sm font-medium tracking-tight text-foreground">{r.creditor_name}</span> },
    { header: 'Bureau', accessor: 'bureau', render: (r) => <span className="text-xs text-muted-foreground">{r.bureau}</span> },
    { header: 'Type', accessor: 'account_type', render: (r) => <span className="text-xs text-muted-foreground">{r.account_type}</span> },
    { header: 'Balance', accessor: 'current_balance', render: (r) => <span className="text-sm text-foreground">{formatCurrency(r.current_balance)}</span> },
    { header: 'Limit', accessor: 'credit_limit', render: (r) => <span className="text-sm text-muted-foreground">{formatCurrency(r.credit_limit)}</span> },
    { header: 'Status', accessor: 'payment_status', render: (r) => <span className="text-xs text-muted-foreground">{r.payment_status || r.account_rating}</span> },
    {
      header: 'Lates',
      accessor: 'late_30_count',
      render: (r) => {
        const total = (r.late_30_count ?? 0) + (r.late_60_count ?? 0) + (r.late_90_count ?? 0);
        return <span className={`text-xs ${total > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{total > 0 ? `${total}` : '--'}</span>;
      },
    },
  ];

  const inquiryColumns: DataTableColumn<Inquiry>[] = [
    { header: 'Company', accessor: 'company_name', render: (r) => <span className="text-sm text-foreground">{r.company_name}</span> },
    { header: 'Bureau', accessor: 'bureau', render: (r) => <span className="text-xs text-muted-foreground">{r.bureau ?? '--'}</span> },
    { header: 'Date', accessor: 'date', render: (r) => <span className="text-xs text-muted-foreground">{r.date ?? '--'}</span> },
    { header: 'Type', accessor: 'type', render: (r) => <span className="text-xs text-muted-foreground">{r.type}</span> },
  ];

  const publicRecordColumns: DataTableColumn<PublicRecord>[] = [
    { header: 'Type', accessor: 'type', render: (r) => <span className="text-sm text-foreground">{r.type}</span> },
    { header: 'Bureau', accessor: 'bureau', render: (r) => <span className="text-xs text-muted-foreground">{r.bureau ?? '--'}</span> },
    { header: 'Status', accessor: 'status', render: (r) => <span className="text-xs text-muted-foreground">{r.status}</span> },
    { header: 'Filed', accessor: 'date_filed', render: (r) => <span className="text-xs text-muted-foreground">{r.date_filed ?? '--'}</span> },
    { header: 'Amount', accessor: 'amount', render: (r) => <span className="text-sm text-foreground">{formatCurrency(r.amount)}</span> },
  ];

  return (
    <div className="space-y-8">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/credit/reports')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reports
      </button>

      {/* Header + decision banner */}
      <div className={`rounded-2xl border p-5 backdrop-blur-xl ${tier.bg}`}>
        <div className="flex items-start gap-4">
          <TierIcon className={`h-8 w-8 flex-shrink-0 ${tier.color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{decision.approval_summary?.headline ?? tier.label}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.bg}`}>
                {tier.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {decision.approval_summary?.message}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Report ID: {report.id} | Pulled: {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Score grid */}
      {scores.length > 0 && (
        <div>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Credit Scores</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {scores.map((s) => (
              <ScoreGauge key={s.bureau} {...s} />
            ))}
          </div>
        </div>
      )}

      {/* Tradelines */}
      {tradelines.length > 0 && (
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-red-400" />
              Tradelines ({tradelines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={tradelineColumns} data={tradelines} rowKey={(_, i) => i} pageSize={15} />
          </CardContent>
        </Card>
      )}

      {/* Inquiries */}
      {inquiries.length > 0 && (
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
              <Search className="h-4 w-4 text-blue-400" />
              Inquiries ({inquiries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={inquiryColumns} data={inquiries} rowKey={(_, i) => i} pageSize={10} />
          </CardContent>
        </Card>
      )}

      {/* Public Records */}
      {publicRecords.length > 0 && (
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
              <FileWarning className="h-4 w-4 text-amber-400" />
              Public Records ({publicRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={publicRecordColumns} data={publicRecords} rowKey={(_, i) => i} />
          </CardContent>
        </Card>
      )}

      {/* Decision: Triggered Rules + Remediation */}
      {(triggeredRules.length > 0 || remediationSteps.length > 0) && (
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Decision Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Triggered rules */}
            {triggeredRules.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Triggered Rules</h3>
                {triggeredRules.map((rule, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        rule.tier === 'DECLINE' ? 'bg-red-500/[0.06] text-red-400 border-red-500/20'
                          : rule.tier === 'BORDERLINE' ? 'bg-amber-500/[0.06] text-amber-400 border-amber-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {rule.tier}
                      </span>
                      <span className="text-sm font-medium tracking-tight text-foreground">{rule.summary}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
                    {rule.remediation && (
                      <p className="mt-1 text-xs text-red-400">Remediation: {rule.remediation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Remediation steps */}
            {remediationSteps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Remediation Steps</h3>
                {remediationSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/[0.08] text-xs font-bold text-red-400">
                      {step.step_number}
                    </span>
                    <div>
                      <p className="text-sm font-medium tracking-tight text-foreground">{step.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next steps from approval summary */}
            {decision.approval_summary?.next_steps && decision.approval_summary.next_steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Next Steps</h3>
                <ul className="space-y-1">
                  {decision.approval_summary.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
