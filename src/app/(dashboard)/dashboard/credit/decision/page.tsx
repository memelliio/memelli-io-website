'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowLeft,
  Share2,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreditScore {
  bureau: string;
  score: number;
  status: string;
}

interface TriggeredRule {
  rule: string;
  tier: string;
  summary: string;
}

interface ApprovalSummary {
  headline: string;
  message: string;
  average_score: number;
  passing_bureaus: number;
  total_bureaus: number;
}

interface RemediationStep {
  step: string;
  priority: string;
  description: string;
}

interface DecisionJson {
  credit_scores?: CreditScore[];
  decision_tier?: string;
  approval_summary?: ApprovalSummary;
  triggered_rules?: TriggeredRule[];
  remediation_steps?: RemediationStep[];
}

interface DecisionReport {
  id: number;
  decisionTier: string;
  createdAt: string;
  decisionJson?: DecisionJson;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tierConfig(tier: string) {
  switch (tier) {
    case 'APPROVE':
      return {
        label: 'Approved',
        color: 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20',
        icon: ShieldCheck,
        iconColor: 'text-emerald-400',
        bgGlow: 'shadow-emerald-500/[0.06]',
      };
    case 'BORDERLINE':
      return {
        label: 'Conditional',
        color: 'bg-amber-500/[0.06] text-amber-400 border-amber-500/20',
        icon: ShieldAlert,
        iconColor: 'text-amber-400',
        bgGlow: 'shadow-amber-500/[0.06]',
      };
    case 'DECLINE':
      return {
        label: 'Declined',
        color: 'bg-red-500/[0.06] text-red-400 border-red-500/20',
        icon: ShieldX,
        iconColor: 'text-red-400',
        bgGlow: 'shadow-red-500/[0.06]',
      };
    default:
      return {
        label: tier || 'Pending',
        color: 'bg-muted text-muted-foreground border-border',
        icon: ShieldCheck,
        iconColor: 'text-muted-foreground',
        bgGlow: '',
      };
  }
}

function scoreColor(score: number): string {
  if (score >= 700) return 'text-emerald-400';
  if (score >= 620) return 'text-amber-400';
  return 'text-red-400';
}

function scoreGlow(score: number): string {
  if (score >= 700) return 'drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]';
  if (score >= 620) return 'drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]';
  return 'drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]';
}

function scoreRingColor(score: number): string {
  if (score >= 700) return 'border-emerald-500/30';
  if (score >= 620) return 'border-amber-500/30';
  return 'border-red-500/30';
}

function ruleTierIcon(tier: string) {
  switch (tier) {
    case 'APPROVE':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
    case 'BORDERLINE':
      return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
    case 'DECLINE':
      return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function priorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'text-red-400 bg-red-500/[0.06] border-red-500/20';
    case 'medium':
      return 'text-amber-400 bg-amber-500/[0.06] border-amber-500/20';
    case 'low':
      return 'text-emerald-400 bg-emerald-500/[0.06] border-emerald-500/20';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Score Ring Component                                                */
/* ------------------------------------------------------------------ */

function ScoreRing({ bureau, score, status }: CreditScore) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] bg-card backdrop-blur-xl ${scoreRingColor(score)}`}
      >
        <span className={`text-2xl font-bold tracking-tighter ${scoreColor(score)} ${scoreGlow(score)}`}>
          {score}
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium tracking-tight text-foreground">{bureau}</p>
        <p
          className={`text-xs ${status === 'passing' ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {status === 'passing' ? 'Passing' : 'Below threshold'}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditDecisionPage() {
  const api = useApi();
  const router = useRouter();

  const { data: decision, isLoading } = useQuery<DecisionReport | null>({
    queryKey: ['credit-decision'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DecisionReport }>(
        '/api/credit/latest'
      );
      if (res.error) return null;
      return res.data?.data ?? null;
    },
    staleTime: 60_000,
  });

  const rerunMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean }>('/api/credit/pull', {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push('/dashboard/credit/pull');
    },
  });

  const tier = tierConfig(decision?.decisionTier ?? '');
  const TierIcon = tier.icon;
  const scores = decision?.decisionJson?.credit_scores ?? [];
  const rules = decision?.decisionJson?.triggered_rules ?? [];
  const remediation = decision?.decisionJson?.remediation_steps ?? [];
  const summary = decision?.decisionJson?.approval_summary;
  const showRemediation =
    decision?.decisionTier === 'DECLINE' ||
    decision?.decisionTier === 'BORDERLINE';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/credit')}
            className="rounded-xl border border-border bg-card backdrop-blur-xl p-2 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/[0.04]"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Credit Decision
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {decision
                ? `Report from ${formatDate(decision.createdAt)}`
                : 'Latest credit decision analysis'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card backdrop-blur-xl text-foreground hover:border-red-500/20 hover:bg-red-500/[0.04]"
            onClick={() => {
              /* share handler */
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card backdrop-blur-xl text-foreground hover:border-red-500/20 hover:bg-red-500/[0.04]"
            onClick={() => {
              /* download handler */
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-red-500/20"
            onClick={() => rerunMutation.mutate()}
            disabled={rerunMutation.isPending}
          >
            <RotateCcw
              className={`mr-2 h-4 w-4 ${rerunMutation.isPending ? 'animate-spin' : ''}`}
            />
            Run Again
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton variant="stat-card" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="stat-card" />
            ))}
          </div>
          <Skeleton variant="stat-card" />
        </div>
      ) : !decision ? (
        /* Empty state */
        <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium tracking-tight text-foreground">
              No credit decision available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pull a credit report to get your decision analysis.
            </p>
            <Button
              className="mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-red-500/20"
              onClick={() => router.push('/dashboard/credit/pull')}
            >
              Pull Credit Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Decision Tier Banner */}
          <Card
            className={`rounded-2xl border border-border bg-card backdrop-blur-xl shadow-lg ${tier.bgGlow}`}
          >
            <CardContent className="flex items-center gap-6 p-6">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${tier.color}`}
              >
                <TierIcon className={`h-8 w-8 ${tier.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {tier.label}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${tier.color}`}
                  >
                    {decision.decisionTier}
                  </span>
                </div>
                {summary && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {summary.headline}
                  </p>
                )}
                {summary && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.message}
                  </p>
                )}
              </div>
              <div className="text-right">
                {summary && (
                  <>
                    <p className="text-4xl font-bold tracking-tighter text-foreground drop-shadow-[0_0_16px_rgba(239,68,68,0.3)]">
                      {summary.average_score}
                    </p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary.passing_bureaus}/{summary.total_bureaus} bureaus
                      passing
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credit Scores */}
          {scores.length > 0 && (
            <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="tracking-tight font-semibold text-foreground">
                  Bureau Credit Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around py-4">
                  {scores.map((s) => (
                    <ScoreRing key={s.bureau} {...s} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Triggered Rules */}
          {rules.length > 0 && (
            <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Triggered Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card backdrop-blur-xl p-4"
                    >
                      {ruleTierIcon(rule.tier)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium tracking-tight text-foreground">
                            {rule.rule}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              rule.tier === 'APPROVE'
                                ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20'
                                : rule.tier === 'BORDERLINE'
                                  ? 'bg-amber-500/[0.06] text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/[0.06] text-red-400 border-red-500/20'
                            }`}
                          >
                            {rule.tier}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {rule.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remediation Steps */}
          {showRemediation && remediation.length > 0 && (
            <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 tracking-tight font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  Remediation Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {remediation.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card backdrop-blur-xl p-4"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/[0.08] text-xs font-bold text-red-400">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium tracking-tight text-foreground">
                            {step.step}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityColor(step.priority)}`}
                          >
                            {step.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Link to full report */}
          <Card className="rounded-2xl border border-border bg-card backdrop-blur-xl">
            <CardContent className="p-4">
              <button
                onClick={() =>
                  router.push(`/dashboard/credit/reports/${decision.id}`)
                }
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card backdrop-blur-xl p-4 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-muted p-2">
                    <ShieldCheck className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium tracking-tight text-foreground">
                      View Full Credit Report
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete tradeline analysis, inquiries, and account details
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
