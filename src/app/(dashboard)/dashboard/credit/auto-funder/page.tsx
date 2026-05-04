'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle,
  Building2,
  CreditCard,
  Send,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Shield,
  Percent,
  Calculator,
  User,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Star,
  RefreshCw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProductType =
  | 'credit_card'
  | 'personal_loan'
  | 'business_loan'
  | 'auto_loan'
  | 'home_equity'
  | 'secured_card';

type InstitutionType = 'bank' | 'credit_union';

interface SoftPullInstitution {
  id: string;
  name: string;
  type: InstitutionType;
  products: ProductType[];
  minimumScore: number;
  softPullConfirmed: boolean;
  directApplyUrl: string;
  approvalCriteriaNotes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Recommendation {
  institution: SoftPullInstitution;
  matchScore: number;
  matchReasons: string[];
}

interface EngineStats {
  total: number;
  confirmed: number;
  unconfirmed: number;
  banks: number;
  creditUnions: number;
  productCounts: Record<string, number>;
  scoreRanges: {
    below_580: number;
    '580_to_669': number;
    '670_to_739': number;
    '740_plus': number;
  };
  lastUpdated: string;
}

interface CreditProfileForm {
  score: number;
  product: ProductType | '';
  preferredType: InstitutionType | '';
  maxResults: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function approvalLikelihoodFromMatch(matchScore: number): number {
  // matchScore tops out around 110. Map it to 50–99% likelihood.
  return Math.min(99, Math.max(50, Math.round(40 + matchScore * 0.54)));
}

function productLabel(p: ProductType): string {
  const map: Record<ProductType, string> = {
    credit_card: 'Credit Card',
    personal_loan: 'Personal Loan',
    business_loan: 'Business Loan',
    auto_loan: 'Auto Loan',
    home_equity: 'Home Equity',
    secured_card: 'Secured Card',
  };
  return map[p] ?? p;
}

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Credit Score Ring                                                   */
/* ------------------------------------------------------------------ */

function CreditScoreRing({ score, change }: { score: number; change?: number }) {
  const animatedScore = useAnimatedCounter(score);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const minScore = 300;
  const maxScore = 850;
  const pct = (score - minScore) / (maxScore - minScore);
  const offset = circumference - pct * circumference;

  const getColor = (s: number) => {
    if (s >= 750) return '#22c55e';
    if (s >= 700) return '#84cc16';
    if (s >= 650) return '#f59e0b';
    if (s >= 600) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="148" height="148" viewBox="0 0 148 148">
        <circle cx="74" cy="74" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <circle
          cx="74"
          cy="74"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 74 74)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{animatedScore}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Credit Score</span>
        {change !== undefined && change !== 0 && (
          <span className={`mt-1 flex items-center gap-0.5 text-xs font-semibold ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change > 0 ? '+' : ''}{change}
            <TrendingUp className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  prefix,
  suffix,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ComponentType<any>;
  color: string;
  subtext?: string;
}) {
  const animatedValue = useAnimatedCounter(value);
  const formattedValue =
    value >= 1000000
      ? `${(animatedValue / 1000000).toFixed(1)}M`
      : value >= 1000
        ? `${(animatedValue / 1000).toFixed(animatedValue >= 100000 ? 0 : 1)}k`
        : animatedValue.toString();

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="absolute right-3 top-3 rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">
        {prefix}{formattedValue}{suffix}
      </p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Approval likelihood bar                                            */
/* ------------------------------------------------------------------ */

function LikelihoodBar({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recommendation card                                                */
/* ------------------------------------------------------------------ */

function RecommendationCard({
  rec,
  isExpanded,
  onToggle,
}: {
  rec: Recommendation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { institution, matchScore, matchReasons } = rec;
  const approvalLikelihood = approvalLikelihoodFromMatch(matchScore);
  const logoLetters = institution.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-border">
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Institution logo */}
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground">
          {logoLetters}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{institution.name}</h3>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
              {institution.type.replace('_', ' ')}
            </span>
            {institution.softPullConfirmed && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                Soft Pull
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {institution.products.slice(0, 3).map((p) => (
              <span key={p} className="text-xs text-muted-foreground">
                {productLabel(p)}
              </span>
            ))}
            {institution.products.length > 3 && (
              <span className="text-xs text-muted-foreground">+{institution.products.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Match score */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-bold text-foreground">{matchScore}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Match</span>
        </div>

        {/* Min score badge */}
        <div className="hidden flex-col items-center gap-0.5 sm:flex">
          <span className="text-sm font-semibold text-foreground">{institution.minimumScore}+</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Min Score</span>
        </div>

        {/* Apply button */}
        <div className="flex items-center gap-2">
          {institution.directApplyUrl ? (
            <a
              href={institution.directApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <Send className="h-3 w-3" />
              Apply
            </a>
          ) : null}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border bg-card px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Approval likelihood */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approval Likelihood</p>
              <LikelihoodBar value={approvalLikelihood} />
            </div>

            {/* Match reasons */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why It Matched</p>
              <div className="space-y-1">
                {matchReasons.length > 0 ? matchReasons.map((reason) => (
                  <div key={reason} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-400/60" />
                    {reason}
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">Score meets minimum threshold</p>
                )}
              </div>
            </div>

            {/* Criteria notes */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approval Criteria</p>
              {institution.approvalCriteriaNotes ? (
                <p className="text-xs text-muted-foreground">{institution.approvalCriteriaNotes}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No additional criteria on file</p>
              )}
              {institution.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {institution.tags.map((tag) => (
                    <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fee calculator                                                     */
/* ------------------------------------------------------------------ */

function FeeCalculator({ totalMatched }: { totalMatched: number }) {
  const [feeRate, setFeeRate] = useState(10);
  const backendFee = totalMatched * (feeRate / 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Backend Fee Calculator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Fee Rate</label>
            <span className="text-sm font-bold text-foreground">{feeRate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            value={feeRate}
            onChange={(e) => setFeeRate(Number(e.target.value))}
            className="mt-2 w-full accent-emerald-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>1%</span>
            <span>25%</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Institutions Matched</span>
            <span className="text-sm font-semibold text-foreground">{totalMatched}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="text-xs font-medium text-emerald-400/80">Projected Backend Fee %</span>
            <span className="text-lg font-bold text-emerald-400">{feeRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats summary donut                                                */
/* ------------------------------------------------------------------ */

function TypeDonut({ banks, creditUnions }: { banks: number; creditUnions: number }) {
  const total = banks + creditUnions;
  if (total === 0) return null;

  const bankPct = (banks / total) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#f59e0b" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(bankPct / 100) * circumference} ${circumference}`}
          strokeDashoffset={0}
          transform="rotate(-90 50 50)"
        />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#10b981" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${((100 - bankPct) / 100) * circumference} ${circumference}`}
          strokeDashoffset={-(bankPct / 100) * circumference}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="47" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
          {total}
        </text>
        <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="500">
          TOTAL
        </text>
      </svg>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-muted-foreground">Banks</span>
          <span className="ml-auto text-xs font-semibold text-foreground">{banks}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span className="text-xs text-muted-foreground">Credit Unions</span>
          <span className="ml-auto text-xs font-semibold text-foreground">{creditUnions}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile metric helper                                              */
/* ------------------------------------------------------------------ */

function ProfileMetric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${good ? 'text-emerald-400' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const PRODUCT_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'business_loan', label: 'Business Loan' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'home_equity', label: 'Home Equity' },
  { value: 'secured_card', label: 'Secured Card' },
];

export default function AutoFunderPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [form, setForm] = useState<CreditProfileForm>({
    score: 720,
    product: '',
    preferredType: '',
    maxResults: 20,
  });

  /* ---- Load engine stats on mount ---- */
  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/soft-pull/stats`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats as EngineStats);
        } else {
          setError(data.error ?? 'Failed to load engine stats');
        }
      } catch (err) {
        setError('Unable to reach the soft-pull engine');
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  /* ---- Submit credit profile for recommendations ---- */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecs(true);
    setError(null);
    setHasSearched(true);

    const payload: Record<string, unknown> = { score: form.score, maxResults: form.maxResults };
    if (form.product) payload.product = form.product;
    if (form.preferredType) payload.preferredType = form.preferredType;

    try {
      const res = await fetch(`${API_URL}/api/admin/soft-pull/recommend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations as Recommendation[]);
      } else {
        setError(data.error ?? 'Recommendation engine returned an error');
        setRecommendations([]);
      }
    } catch (err) {
      setError('Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  }, [form]);

  /* ---- Derived values ---- */
  const avgMatchScore =
    recommendations.length > 0
      ? Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)
      : 0;

  const avgLikelihood =
    recommendations.length > 0
      ? Math.round(
          recommendations.reduce((sum, r) => sum + approvalLikelihoodFromMatch(r.matchScore), 0) /
            recommendations.length
        )
      : 0;

  const confirmedCount = recommendations.filter((r) => r.institution.softPullConfirmed).length;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auto Funder</h1>
            <p className="text-sm text-muted-foreground">Multi-institution matching engine powered by soft-pull intelligence</p>
          </div>
        </div>

        {/* Engine status */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          {loadingStats ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : stats ? (
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-red-400" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {loadingStats ? 'Connecting...' : stats ? `${stats.confirmed} institutions live` : 'Engine offline'}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs text-red-400/60 hover:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Credit profile form */}
      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Credit Profile</h2>
          <span className="ml-auto text-xs text-muted-foreground">Run a soft-pull match</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Credit score */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Credit Score
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={300}
                max={850}
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-white/20 focus:border-emerald-500/40 focus:outline-none"
                placeholder="300–850"
                required
              />
            </div>
            <div className="mt-2">
              <input
                type="range"
                min={300}
                max={850}
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                <span>300</span>
                <span>850</span>
              </div>
            </div>
            {/* Mini score ring preview */}
            <div className="mt-3 flex justify-center">
              <CreditScoreRing score={form.score} />
            </div>
          </div>

          {/* Product type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Product Type</label>
            <select
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value as ProductType | '' }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="">Any product</option>
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label className="mb-1.5 mt-4 block text-xs font-medium text-muted-foreground">Institution Type</label>
            <select
              value={form.preferredType}
              onChange={(e) => setForm((f) => ({ ...f, preferredType: e.target.value as InstitutionType | '' }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="">Any type</option>
              <option value="bank">Bank</option>
              <option value="credit_union">Credit Union</option>
            </select>

            <label className="mb-1.5 mt-4 block text-xs font-medium text-muted-foreground">Max Results</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.maxResults}
              onChange={(e) => setForm((f) => ({ ...f, maxResults: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Engine stats preview */}
          <div className="lg:col-span-2">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Engine Database</p>
            {loadingStats ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Institutions</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Soft Pull Confirmed</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">{stats.confirmed}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Banks</p>
                  <p className="mt-1 text-xl font-bold text-indigo-400">{stats.banks}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Credit Unions</p>
                  <p className="mt-1 text-xl font-bold text-violet-400">{stats.creditUnions}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Engine stats unavailable</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={loadingRecs}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingRecs ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Soft Pull Match
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results summary stats — only shown after a search */}
      {hasSearched && recommendations.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Matches Found"
            value={recommendations.length}
            icon={Building2}
            color="#f59e0b"
            subtext="Institutions eligible"
          />
          <StatCard
            label="Avg Match Score"
            value={avgMatchScore}
            suffix="/100"
            icon={Star}
            color="#10b981"
          />
          <StatCard
            label="Avg Approval Likelihood"
            value={avgLikelihood}
            suffix="%"
            icon={TrendingUp}
            color="#22c55e"
          />
          <StatCard
            label="Soft Pull Confirmed"
            value={confirmedCount}
            icon={Shield}
            color="#06b6d4"
            subtext="No hard inquiry"
          />
        </div>
      )}

      {/* Recommendations list */}
      {hasSearched && (
        <div className="mb-6">
          {loadingRecs ? (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400/60" />
                <p className="text-sm text-muted-foreground">Running soft-pull match engine...</p>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {recommendations.length} Institution{recommendations.length !== 1 ? 's' : ''} Matched
                </h2>
                <span className="text-xs text-muted-foreground">Sorted by match score</span>
              </div>
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.institution.id}
                  rec={rec}
                  isExpanded={expandedRec === rec.institution.id}
                  onToggle={() =>
                    setExpandedRec(expandedRec === rec.institution.id ? null : rec.institution.id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No institutions matched this credit profile</p>
              <p className="mt-1 text-xs text-muted-foreground">Try lowering the score threshold or changing the product filter</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state before first search */}
      {!hasSearched && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Zap className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Enter a credit profile above and run a soft-pull match</p>
          <p className="mt-1 text-xs text-muted-foreground">Results will appear here</p>
        </div>
      )}

      {/* Bottom grid: Analytics + Fee Calculator */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Institution type breakdown */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Engine Analytics</h2>
          </div>
          {stats ? (
            <>
              <TypeDonut banks={stats.banks} creditUnions={stats.creditUnions} />
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confirmed Soft Pull</span>
                  <span className="text-sm font-semibold text-emerald-400">{stats.confirmed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Unconfirmed</span>
                  <span className="text-sm font-semibold text-foreground">{stats.unconfirmed}</span>
                </div>
                {stats.productCounts && Object.keys(stats.productCounts).length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Top Product</span>
                    <span className="text-sm font-semibold text-foreground">
                      {productLabel(
                        (Object.entries(stats.productCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as ProductType) ??
                          'credit_card'
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-semibold text-foreground">
                    {new Date(stats.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xs text-muted-foreground">Stats unavailable</p>
              )}
            </div>
          )}
        </div>

        {/* Fee calculator */}
        <FeeCalculator totalMatched={recommendations.length} />
      </div>
    </div>
  );
}
