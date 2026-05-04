'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CreditCard,
  BadgeDollarSign,
  ChevronRight,
  Sparkles,
  FileWarning,
  Wrench,
  CalendarClock
} from 'lucide-react';
import { API_URL } from '@/lib/config';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ANALYSIS_STEPS = [
  { id: 'history', label: 'Analyzing credit history', icon: CreditCard },
  { id: 'tradelines', label: 'Reviewing tradelines', icon: TrendingUp },
  { id: 'inquiries', label: 'Checking inquiries', icon: FileWarning },
  { id: 'payments', label: 'Evaluating payment history', icon: Clock },
  { id: 'debt', label: 'Assessing debt ratios', icon: BadgeDollarSign },
  { id: 'funding', label: 'Calculating funding readiness', icon: Sparkles },
] as const;

const STEP_DURATION_MS = 1200;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreditIssue {
  category: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixable: boolean;
}

interface ApprovedProgram {
  name: string;
  description: string;
  estimatedAmount: string;
}

interface EvaluationResult {
  sessionId: string;
  contactId: string | null;
  creditScore: number;
  scoreCategory: 'excellent' | 'good' | 'fair' | 'poor';
  fundingReady: boolean;
  issues: CreditIssue[];
  recommendations: string[];
  estimatedTimeline: string;
  approvedPrograms: ApprovedProgram[];
  evaluatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(category: string): string {
  switch (category) {
    case 'excellent': return 'text-emerald-400';
    case 'good': return 'text-green-400';
    case 'fair': return 'text-amber-400';
    case 'poor': return 'text-red-400';
    default: return 'text-muted-foreground';
  }
}

function scoreBgGlow(category: string): string {
  switch (category) {
    case 'excellent': return 'shadow-emerald-500/10';
    case 'good': return 'shadow-green-500/10';
    case 'fair': return 'shadow-amber-500/10';
    case 'poor': return 'shadow-red-500/10';
    default: return '';
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-300 bg-red-500/5 border-red-500/10';
    case 'high': return 'text-orange-400 bg-orange-500/5 border-orange-500/10';
    case 'medium': return 'text-amber-400 bg-amber-500/5 border-amber-500/10';
    case 'low': return 'text-muted-foreground bg-card0/5 border-zinc-500/10';
    default: return 'text-muted-foreground bg-card0/5 border-zinc-500/10';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return severity;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CreditReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" /></div>}>
      <CreditReviewInner />
    </Suspense>
  );
}

function CreditReviewInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch evaluation from API
  const fetchEvaluation = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/api/credit-review/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Evaluation failed');
        return;
      }
      setEvaluation(json.data);
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
  }, [sessionId]);

  // Start the analysis animation + API call in parallel
  useEffect(() => {
    if (!sessionId || fetchedRef.current) return;
    fetchedRef.current = true;

    // Fire off the API call immediately
    fetchEvaluation();

    // Animate the steps one by one
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCompletedSteps(step);
      if (step >= ANALYSIS_STEPS.length) {
        clearInterval(interval);
      }
    }, STEP_DURATION_MS);

    return () => clearInterval(interval);
  }, [sessionId, fetchEvaluation]);

  // Show result once both animation is done AND data is loaded
  useEffect(() => {
    if (completedSteps >= ANALYSIS_STEPS.length && evaluation) {
      const timer = setTimeout(() => setShowResult(true), 600);
      return () => clearTimeout(timer);
    }
  }, [completedSteps, evaluation]);

  /* ── Error / Missing Session ── */

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-5" />
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Session Not Found</h1>
          <p className="text-muted-foreground text-sm mb-8 font-light">
            No session ID was provided. Please start the onboarding process from the beginning.
          </p>
          <button
            onClick={() => router.push('/start')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 transition-colors duration-200"
          >
            Start Over
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-5" />
          <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Evaluation Error</h1>
          <p className="text-muted-foreground text-sm mb-8 font-light">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchedRef.current = false;
              setCompletedSteps(0);
              setShowResult(false);
              setEvaluation(null);
              fetchEvaluation();
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Render ── */

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-xl border border-border mb-5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">Secure Credit Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/90 mb-3">
            Credit Review &amp; Funding Readiness
          </h1>
          <p className="text-muted-foreground text-sm font-light">
            Analyzing your credit profile to determine funding eligibility
          </p>
        </motion.div>

        {/* Analysis Steps */}
        <div className="space-y-3 mb-12">
          {ANALYSIS_STEPS.map((step, index) => {
            const isCompleted = index < completedSteps;
            const isActive = index === completedSteps && completedSteps < ANALYSIS_STEPS.length;
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500
                  ${isCompleted
                    ? 'bg-emerald-950/10 border-emerald-500/10'
                    : isActive
                    ? 'bg-card backdrop-blur-xl border-border'
                    : 'bg-card border-white/[0.02]'}
                `}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <LoadingGlobe size="md" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                      >
                        <StepIcon className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted
                      ? 'text-emerald-300/80'
                      : isActive
                      ? 'text-white'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="ml-1"
                    >
                      ...
                    </motion.span>
                  )}
                  {isCompleted && (
                    <span className="ml-2 text-emerald-500/40 text-xs">Complete</span>
                  )}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        {!showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <div className="h-1 bg-card rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-emerald-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: `${(completedSteps / ANALYSIS_STEPS.length) * 100}%`
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {completedSteps < ANALYSIS_STEPS.length
                ? `Step ${completedSteps + 1} of ${ANALYSIS_STEPS.length}`
                : evaluation
                ? 'Preparing results...'
                : 'Finalizing analysis...'}
            </p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {showResult && evaluation && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {evaluation.fundingReady ? (
                <FundingReadyResult evaluation={evaluation} />
              ) : (
                <CreditRepairResult evaluation={evaluation} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Funding Ready Result                                               */
/* ------------------------------------------------------------------ */

function FundingReadyResult({ evaluation }: { evaluation: EvaluationResult }) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Congratulations Banner */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`
          relative overflow-hidden rounded-2xl border border-emerald-500/15
          bg-card backdrop-blur-xl
          p-10 text-center shadow-2xl ${scoreBgGlow(evaluation.scoreCategory)}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/[0.03] to-transparent pointer-events-none" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-5" />
        </motion.div>

        <h2 className="text-2xl font-semibold tracking-tight text-white/90 mb-3 relative">
          Congratulations — You Qualify for Funding
        </h2>
        <p className="text-muted-foreground text-sm mb-8 relative max-w-md mx-auto font-light">
          Your credit profile meets our underwriting standards. You are pre-approved
          for the following funding programs.
        </p>

        {/* Score Display */}
        <div className="relative inline-flex flex-col items-center mb-8">
          <div
            className={`
              text-5xl font-semibold tabular-nums tracking-tight
              ${scoreColor(evaluation.scoreCategory)}
            `}
          >
            {evaluation.creditScore}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-2">
            Credit Score — {evaluation.scoreCategory}
          </div>
        </div>
      </motion.div>

      {/* Approved Programs */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-5 flex items-center gap-2.5">
          <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
          Approved Programs
        </h3>
        <div className="grid gap-3">
          {evaluation.approvedPrograms.map((program, i) => (
            <motion.div
              key={program.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-card backdrop-blur-xl border border-border hover:border-emerald-500/10 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mt-0.5">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{program.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{program.description}</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-emerald-400">
                    {program.estimatedAmount}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {evaluation.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Tips to Maximize Your Approval
          </h3>
          <ul className="space-y-2.5">
            {evaluation.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/50 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-4"
      >
        <button
          onClick={() => router.push(`/start/apply?sessionId=${evaluation.sessionId}`)}
          className="
            w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl
            bg-red-600 hover:bg-red-500 text-white font-medium text-base
            transition-colors duration-200 shadow-lg shadow-red-500/10
          "
        >
          Continue to Application
          <ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          No obligation. Completing the application takes about 5 minutes.
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Credit Repair Result                                               */
/* ------------------------------------------------------------------ */

function CreditRepairResult({ evaluation }: { evaluation: EvaluationResult }) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`
          relative overflow-hidden rounded-2xl border border-amber-500/15
          bg-card backdrop-blur-xl
          p-10 text-center shadow-2xl
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.02] to-transparent pointer-events-none" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-5" />
        </motion.div>

        <h2 className="text-2xl font-semibold tracking-tight text-white/90 mb-3 relative">
          Not Quite Ready — But We Can Fix That
        </h2>
        <p className="text-muted-foreground text-sm mb-8 relative max-w-md mx-auto font-light">
          Your credit profile needs improvement before you qualify for funding.
          Our credit repair program can get you there.
        </p>

        {/* Score Display */}
        <div className="relative inline-flex flex-col items-center mb-4">
          <div
            className={`
              text-5xl font-semibold tabular-nums tracking-tight
              ${scoreColor(evaluation.scoreCategory)}
            `}
          >
            {evaluation.creditScore}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-2">
            Credit Score — {evaluation.scoreCategory}
          </div>
          <div className="text-xs text-muted-foreground mt-2.5">
            680+ required for funding eligibility
          </div>
        </div>
      </motion.div>

      {/* Issues Found */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-5 flex items-center gap-2.5">
          <FileWarning className="w-5 h-5 text-amber-400" />
          Issues Found ({evaluation.issues.length})
        </h3>
        <div className="space-y-3">
          {evaluation.issues.map((issue, i) => (
            <motion.div
              key={issue.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`
                p-5 rounded-2xl border
                ${severityColor(issue.severity)}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{issue.category}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {issue.fixable && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <Wrench className="w-3 h-3" />
                      Fixable
                    </span>
                  )}
                  <span
                    className={`
                      inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full
                      ${severityColor(issue.severity)}
                    `}
                  >
                    {severityLabel(issue.severity)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-white/90 mb-5 flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Repair Recommendations
        </h3>
        <ul className="space-y-3">
          {evaluation.recommendations.map((rec, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              {rec}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 p-5 rounded-2xl bg-card backdrop-blur-xl border border-border"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <CalendarClock className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Estimated Timeline</h4>
          <p className="text-sm text-indigo-400 font-medium">{evaluation.estimatedTimeline}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            With our professional credit repair program
          </p>
        </div>
      </motion.div>

      {/* Pricing Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white/90">Credit Repair Program</h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Professional dispute letters, bureau monitoring, and ongoing support
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-white/90">
              $99<span className="text-base font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground">Cancel anytime</p>
          </div>
        </div>

        <ul className="space-y-2.5 mb-8">
          {[
            'Personalized dispute strategy based on your report',
            'Monthly dispute rounds to all 3 bureaus',
            'Real-time progress tracking dashboard',
            'Dedicated credit specialist assigned to your case',
            'Score monitoring with alerts',
            'Funding re-evaluation when ready',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/50 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={() => router.push(`/start/repair?sessionId=${evaluation.sessionId}`)}
          className="
            w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl
            bg-red-600 hover:bg-red-500 text-white font-medium text-base
            transition-colors duration-200
          "
        >
          Start Credit Repair
          <ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          30-day money-back guarantee. No long-term contracts.
        </p>
      </motion.div>
    </div>
  );
}
