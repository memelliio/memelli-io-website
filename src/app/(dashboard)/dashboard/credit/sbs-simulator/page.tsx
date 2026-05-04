'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Building2,
  DollarSign,
  Shield,
  Clock,
  Users,
  CreditCard,
  FileWarning,
  TrendingUp,
  ChevronDown,
  Info,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type IndustryRisk = 'low' | 'medium' | 'high' | 'very_high';

interface FactorScore {
  factor: string;
  label: string;
  rawValue: number | string;
  weight: number;
  points: number;
  maxPoints: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface SBSResult {
  totalScore: number;
  tier: string;
  tierColor: string;
  factors: FactorScore[];
  calculatedAt: string;
}

interface ImprovementAction {
  factor: string;
  currentGrade: string;
  action: string;
  potentialGain: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  timeframe: string;
}

interface ImprovementPlan {
  currentScore: number;
  projectedScore: number;
  actions: ImprovementAction[];
}

interface IndustryComparison {
  industry: string;
  averageScore: number;
  yourScore: number;
  percentile: number;
  aboveAverage: boolean;
}

interface CalcResponse {
  score: SBSResult;
  improvement: ImprovementPlan;
  comparison: IndustryComparison | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'construction', label: 'Construction' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

const RISK_OPTIONS: { value: IndustryRisk; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'very_high', label: 'Very High', color: '#ef4444' },
];

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

/* ------------------------------------------------------------------ */
/*  Score Gauge SVG                                                    */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score, tier, tierColor }: { score: number; tier: string; tierColor: string }) {
  const radius = 90;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI; // half circle
  const pct = Math.min(score, 100) / 100;
  const offset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={200} height={120} viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke="#27272a"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke={tierColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
        {/* Score text */}
        <text x="100" y="95" textAnchor="middle" className="text-4xl font-bold" fill="#fafafa" fontSize="36">
          {Math.round(score)}
        </text>
        <text x="100" y="115" textAnchor="middle" fill={tierColor} fontSize="13" fontWeight="600">
          {tier}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slider component                                                   */
/* ------------------------------------------------------------------ */

function FactorSlider({
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  format,
}: {
  label: string;
  icon: React.ComponentType<any>;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const display = format ? format(value) : `${value}${unit ?? ''}`;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground tabular-nums">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sbs-slider w-full"
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-500"
          style={{ width: `${pct}%`, transition: 'width 0.15s ease' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Factor bar component                                               */
/* ------------------------------------------------------------------ */

function FactorBar({ factor }: { factor: FactorScore }) {
  const pct = factor.maxPoints > 0 ? (factor.points / factor.maxPoints) * 100 : 0;
  const gradeColor = GRADE_COLORS[factor.grade] ?? '#71717a';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{factor.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-foreground tabular-nums">{factor.points}/{factor.maxPoints}</span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
            style={{ backgroundColor: gradeColor + '20', color: gradeColor }}
          >
            {factor.grade}
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: gradeColor,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function SBSSimulatorPage() {
  // Inputs
  const [yearsInBusiness, setYearsInBusiness] = useState(5);
  const [annualRevenue, setAnnualRevenue] = useState(500_000);
  const [industryRisk, setIndustryRisk] = useState<IndustryRisk>('medium');
  const [creditHistoryYears, setCreditHistoryYears] = useState(5);
  const [tradeReferences, setTradeReferences] = useState(3);
  const [paymentHistoryScore, setPaymentHistoryScore] = useState(85);
  const [publicRecords, setPublicRecords] = useState(0);
  const [industry, setIndustry] = useState('technology');

  // Result
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const res = await fetch(`${API_URL}/api/admin/sbs/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          yearsInBusiness,
          annualRevenue,
          industryRisk,
          creditHistoryYears,
          tradeReferences,
          paymentHistoryScore,
          publicRecords,
          industry,
        }),
      });
      if (res.ok) {
        const data: CalcResponse = await res.json();
        setResult(data);
      }
    } catch {
      // silent — keep last result
    } finally {
      setLoading(false);
    }
  }, [yearsInBusiness, annualRevenue, industryRisk, creditHistoryYears, tradeReferences, paymentHistoryScore, publicRecords, industry]);

  // Live recalculate on any input change (debounced)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(calculate, 300);
    return () => clearTimeout(debounceRef.current);
  }, [calculate]);

  const score = result?.score;
  const improvement = result?.improvement;
  const comparison = result?.comparison;

  return (
    <>
      {/* Slider styles */}
      <style jsx global>{`
        .sbs-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: transparent;
          outline: none;
          position: relative;
          z-index: 1;
        }
        .sbs-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
          background: #27272a;
        }
        .sbs-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1d4ed8;
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 6px rgba(59,130,246,0.4);
        }
        .sbs-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: #27272a;
        }
        .sbs-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1d4ed8;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(59,130,246,0.4);
        }
      `}</style>

      <div className="min-h-screen bg-card p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SBS Simulator</h1>
              <p className="text-sm text-muted-foreground">Small Business Score — weighted creditworthiness model</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ─── Left column: Inputs ─── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Factor sliders card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Business Profile</h2>

              <FactorSlider
                label="Years in Business"
                icon={Clock}
                value={yearsInBusiness}
                min={0}
                max={50}
                step={1}
                unit=" yrs"
                onChange={setYearsInBusiness}
              />

              <FactorSlider
                label="Annual Revenue"
                icon={DollarSign}
                value={annualRevenue}
                min={0}
                max={10_000_000}
                step={50_000}
                onChange={setAnnualRevenue}
                format={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
              />

              {/* Industry risk selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Industry Risk</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {RISK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIndustryRisk(opt.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        industryRisk === opt.value
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-border bg-muted text-muted-foreground hover:border-border'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <FactorSlider
                label="Credit History"
                icon={CreditCard}
                value={creditHistoryYears}
                min={0}
                max={30}
                step={1}
                unit=" yrs"
                onChange={setCreditHistoryYears}
              />

              <FactorSlider
                label="Trade References"
                icon={Users}
                value={tradeReferences}
                min={0}
                max={20}
                step={1}
                onChange={setTradeReferences}
              />

              <FactorSlider
                label="Payment History (On-Time %)"
                icon={TrendingUp}
                value={paymentHistoryScore}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setPaymentHistoryScore}
              />

              <FactorSlider
                label="Public Records (Liens/Judgments)"
                icon={FileWarning}
                value={publicRecords}
                min={0}
                max={10}
                step={1}
                onChange={setPublicRecords}
              />
            </div>

            {/* Industry selector */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Industry Comparison</span>
              </div>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-500/50"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* ─── Right column: Results ─── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Score gauge */}
            <div className="rounded-xl border border-border bg-card p-6">
              {score ? (
                <div className="flex flex-col items-center">
                  <ScoreGauge score={score.totalScore} tier={score.tier} tierColor={score.tierColor} />
                  {loading && (
                    <div className="mt-2 h-1 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-8 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <p className="mt-3 text-sm text-muted-foreground">Calculating score...</p>
                </div>
              )}
            </div>

            {/* Factor breakdown */}
            {score && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Factor Breakdown</h2>
                <div className="space-y-3">
                  {score.factors.map((f) => (
                    <FactorBar key={f.factor} factor={f} />
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                  <span className="text-xs text-muted-foreground">Total weighted score</span>
                  <span className="text-sm font-bold text-foreground">{score.totalScore} / 100</span>
                </div>
              </div>
            )}

            {/* Industry comparison */}
            {comparison && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Industry Comparison</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                    <p className="text-xl font-bold text-foreground">{comparison.yourScore}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Industry Avg</p>
                    <p className="text-xl font-bold text-muted-foreground">{comparison.averageScore}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Percentile</p>
                    <p className="text-xl font-bold" style={{ color: comparison.aboveAverage ? '#22c55e' : '#f59e0b' }}>
                      {comparison.percentile}th
                    </p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="space-y-1">
                  <div className="relative h-4 w-full rounded-full bg-muted">
                    {/* Industry average marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-muted"
                      style={{ left: `${comparison.averageScore}%` }}
                    />
                    {/* Your score */}
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        width: `${comparison.yourScore}%`,
                        backgroundColor: comparison.aboveAverage ? '#22c55e' : '#f59e0b',
                        opacity: 0.6,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span>Industry avg: {comparison.averageScore}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Improvement plan */}
            {improvement && improvement.actions.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Improvement Plan</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Current: {improvement.currentScore}</span>
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Projected: {improvement.projectedScore}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {improvement.actions.map((action, i) => {
                    const dc = DIFFICULTY_COLORS[action.difficulty] ?? DIFFICULTY_COLORS.moderate;
                    return (
                      <div key={i} className="rounded-lg border border-border bg-muted p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: (GRADE_COLORS[action.currentGrade] ?? '#71717a') + '20',
                                color: GRADE_COLORS[action.currentGrade] ?? '#71717a',
                              }}
                            >
                              {action.currentGrade}
                            </span>
                            <span className="text-sm font-medium text-foreground">{action.factor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${dc.bg} ${dc.text}`}>
                              {action.difficulty}
                            </span>
                            <span className="text-xs text-emerald-400 font-medium">+{action.potentialGain} pts</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{action.action}</p>
                        <p className="text-[10px] text-muted-foreground">Timeframe: {action.timeframe}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weight info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Weights: Payment History 20% | Annual Revenue 20% | Years in Business 15% | Credit History 15% | Industry Risk 10% | Trade References 10% | Public Records 10%. Score range 0-100.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
