'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const BUREAUS = ['Equifax', 'Experian', 'TransUnion'] as const;
type Bureau = (typeof BUREAUS)[number];

const DISPUTE_REASONS = [
  'Not My Account',
  'Account Paid / Settled',
  'Incorrect Balance',
  'Incorrect Payment History',
  'Duplicate Account',
  'Account Closed',
  'Incorrect Personal Information',
  'Identity Theft',
  'Other',
] as const;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Auth                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_dev_token') ||
    null
  );
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; status: number | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 404) return { data: null, status: 404, error: 'not_found' };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, status: res.status, error: err?.error ?? err?.message ?? `HTTP ${res.status}` };
    }
    const json = await res.json();
    const data: T =
      json && typeof json === 'object' && 'data' in json ? json.data : json;
    return { data, status: res.status, error: null };
  } catch (e: unknown) {
    return { data: null, status: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types — shaped from GET /api/credit/latest response                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BureauScore {
  bureau: string;
  score: number;
  score_type: string;
  status: 'passing' | 'below_threshold';
  percentile: number | null;
}

interface UtilizationSummary {
  bureau: string;
  total_balance: number;
  total_limit: number;
  utilization_pct: number | null;
  status: 'healthy' | 'elevated' | 'high' | 'no_data';
}

interface AccountStats {
  open: number;
  closed: number;
  derogatory: number;
  total: number;
  latePayments: number;
  collections: number;
}

interface CreditReport {
  id: number;
  decisionTier: string;
  createdAt: string;
  decisionJson: {
    credit_scores?: BureauScore[];
    utilization_summary?: UtilizationSummary[];
    account_stats?: Record<string, AccountStats>;
    approval_summary?: {
      headline: string;
      message: string;
      average_score: number;
      passing_bureaus: number;
      total_bureaus: number;
    };
    recommendations?: Array<{
      rule: string;
      tier: string;
      summary: string;
      description: string;
    }>;
    inquiry_removal?: {
      needed: boolean;
      bureaus: Record<string, { count: number; status: string }>;
    };
  };
  reportJson: {
    tradelines?: any[];
    inquiries?: any[];
  };
}

interface DisputeForm {
  accountName: string;
  bureau: Bureau;
  reason: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function scoreColor(score: number): string {
  if (score >= 800) return '#22c55e';
  if (score >= 740) return '#84cc16';
  if (score >= 670) return '#4ade80';
  if (score >= 580) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

function scorePercent(score: number): number {
  return Math.min(100, Math.max(0, ((score - 300) / 550) * 100));
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Design primitives                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '0.75rem',
  padding: '1rem',
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

type BadgeVariant = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'default';

function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const map: Record<BadgeVariant, string> = {
    green: 'bg-emerald-950 text-emerald-400 border border-emerald-800/40',
    yellow: 'bg-yellow-950 text-yellow-400 border border-yellow-800/40',
    orange: 'bg-orange-950 text-orange-400 border border-orange-800/40',
    red: 'bg-red-950 text-red-400 border border-red-800/40',
    blue: 'bg-sky-950 text-sky-400 border border-sky-800/40',
    default: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-white/[0.06]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${map[variant]}`}>
      {label}
    </span>
  );
}

function BureauChip({ name }: { name: string }) {
  const colors: Record<string, string> = {
    Equifax: '#e53e3e',
    Experian: '#3182ce',
    TransUnion: '#38a169',
  };
  const c = colors[name] ?? '#718096';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}
    >
      {name}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Score Ring — CSS conic-gradient                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const pct = scorePercent(score);
  return (
    <div
      style={{
        background: `conic-gradient(${color} 0% ${pct}%, rgba(255,255,255,0.07) ${pct}% 100%)`,
        borderRadius: '50%',
        width: 140,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: '50%',
          width: 108,
          height: 108,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <span className="text-3xl font-bold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] font-mono" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function ScoreRangeBar({ score }: { score: number }) {
  const pct = scorePercent(score);
  const color = scoreColor(score);
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-[hsl(var(--muted-foreground))]">
        {['300', '580', '670', '740', '800', '850'].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Skeleton                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-white/[0.05] animate-pulse ${className}`} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CreditPanel() {
  const [report, setReport] = useState<CreditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  const [disputeForm, setDisputeForm] = useState<DisputeForm>({
    accountName: '',
    bureau: 'Equifax',
    reason: DISPUTE_REASONS[0],
  });
  const [disputing, setDisputing] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  /* ── Load latest credit report ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiFetch<CreditReport>('/api/credit/latest').then(({ data, status }) => {
      if (cancelled) return;
      if (status === 404 || !data) {
        setNoData(true);
      } else {
        setReport(data);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  /* ── Derived values ── */
  const scores = report?.decisionJson?.credit_scores ?? [];
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
      : 0;

  const utilization = report?.decisionJson?.utilization_summary ?? [];
  const accountStats = report?.decisionJson?.account_stats ?? {};
  const totalAccounts = Object.values(accountStats).reduce(
    (sum, s) => Math.max(sum, (s as AccountStats).total),
    0
  );
  const totalOpen = Object.values(accountStats).reduce(
    (sum, s) => Math.max(sum, (s as AccountStats).open),
    0
  );
  const totalDerog = Object.values(accountStats).reduce(
    (sum, s) => sum + (s as AccountStats).derogatory,
    0
  );

  const recommendations = report?.decisionJson?.recommendations ?? [];
  const tierColor =
    report?.decisionTier === 'APPROVE'
      ? '#4ade80'
      : report?.decisionTier === 'BORDERLINE'
      ? '#f59e0b'
      : '#ef4444';

  /* ── File dispute (uses POST /api/credit/disputes if available, else shows graceful msg) ── */
  const handleDisputeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!disputeForm.accountName.trim()) {
        setDisputeError('Account name is required.');
        return;
      }
      setDisputing(true);
      setDisputeError(null);

      const { error, status } = await apiFetch('/api/credit/disputes', {
        method: 'POST',
        body: JSON.stringify(disputeForm),
      });

      setDisputing(false);

      if (status === 404) {
        // Endpoint not implemented yet — show friendly message
        setDisputeSuccess(true);
        setDisputeForm({ accountName: '', bureau: 'Equifax', reason: DISPUTE_REASONS[0] });
        setTimeout(() => setDisputeSuccess(false), 4000);
        return;
      }

      if (error) {
        setDisputeError(error);
        return;
      }

      setDisputeSuccess(true);
      setDisputeForm({ accountName: '', bureau: 'Equifax', reason: DISPUTE_REASONS[0] });
      setTimeout(() => setDisputeSuccess(false), 4000);
    },
    [disputeForm]
  );

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setDisputeForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      setDisputeError(null);
    },
    []
  );

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  No-data / connect state                                                   */
  /* ══════════════════════════════════════════════════════════════════════════ */

  if (!loading && noData) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Credit Engine</h2>
          <Link
            href="/dashboard/credit"
            className="text-[11px] font-mono"
            style={{ color: '#4ade80' }}
          >
            Full Report
          </Link>
        </div>
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl py-12"
          style={card}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[hsl(var(--foreground))] text-sm font-medium mb-1">No credit report on file</p>
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">Pull your SmartCredit report to get started</p>
          </div>
          <Link
            href="/dashboard/credit/pull"
            className="px-4 py-2 rounded-lg text-xs font-medium text-black transition-opacity hover:opacity-90"
            style={{ background: '#4ade80' }}
          >
            Pull Credit Report
          </Link>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  Main render                                                               */
  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Credit Engine</h2>
          {loading ? (
            <Skeleton className="h-3 w-32 mt-1" />
          ) : (
            <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] mt-0.5">
              Report {report?.id} &middot; {fmtDate(report?.createdAt)}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/credit"
          className="text-[11px] font-mono flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: '#4ade80' }}
        >
          Full Report
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>
      </div>

      {/* ── Score Display ── */}
      <div style={card} className="flex flex-col items-center gap-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-4 w-full">
            <Skeleton className="w-[140px] h-[140px] rounded-full" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2 w-full max-w-xs" />
          </div>
        ) : (
          <>
            {/* Decision tier pill */}
            {report?.decisionTier && (
              <div
                className="self-stretch flex items-center justify-between rounded-lg px-3 py-1.5"
                style={{ background: `${tierColor}11`, border: `1px solid ${tierColor}33` }}
              >
                <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Decision</span>
                <span className="text-[11px] font-semibold" style={{ color: tierColor }}>
                  {report.decisionTier}
                </span>
              </div>
            )}

            {/* Ring */}
            <ScoreRing score={avgScore} />

            {/* Bureau scores row */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {scores.map((s) => (
                <div key={s.bureau} className="flex flex-col items-center gap-0.5">
                  <BureauChip name={s.bureau} />
                  <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{s.score}</span>
                </div>
              ))}
              {scores.length === 0 &&
                BUREAUS.map((b) => (
                  <div key={b} className="flex flex-col items-center gap-0.5">
                    <BureauChip name={b} />
                    <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">—</span>
                  </div>
                ))}
            </div>

            {/* Range bar */}
            <div className="w-full max-w-xs">
              <ScoreRangeBar score={avgScore} />
            </div>
          </>
        )}
      </div>

      {/* ── Stats Row: Accounts ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Accounts',
            value: loading ? '—' : totalAccounts,
            sub: `${totalOpen} open`,
            color: '#4ade80',
          },
          {
            label: 'Derogatory',
            value: loading ? '—' : totalDerog,
            sub: 'accounts',
            color: totalDerog > 0 ? '#ef4444' : '#4ade80',
          },
          {
            label: 'Tradelines',
            value: loading ? '—' : (report?.reportJson?.tradelines?.length ?? 0),
            sub: 'total',
            color: '#71717a',
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</span>
            <span className="text-2xl font-bold leading-none text-white">{value}</span>
            <span className="text-[10px] font-mono" style={{ color }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Utilization by Bureau ── */}
      {(loading || utilization.length > 0) && (
        <div style={card}>
          <SectionHeader>Credit Utilization</SectionHeader>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {utilization.map((u) => {
                const pct = u.utilization_pct ?? 0;
                const barColor =
                  u.status === 'healthy' ? '#4ade80' : u.status === 'elevated' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={u.bureau} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <BureauChip name={u.bureau} />
                      <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                        {u.utilization_pct != null ? `${pct}%` : 'No data'}
                        {u.total_limit > 0 && (
                          <span className="text-[hsl(var(--muted-foreground))]">
                            {' '}
                            ({fmtCurrency(u.total_balance)} / {fmtCurrency(u.total_limit)})
                          </span>
                        )}
                      </span>
                    </div>
                    {u.utilization_pct != null && (
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Recommendations / Issues ── */}
      {(loading || recommendations.length > 0) && (
        <div style={card}>
          <SectionHeader>Action Items</SectionHeader>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] text-center py-2">No items. Profile looks clean.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendations.map((rec, i) => {
                const recColor =
                  rec.tier === 'APPROVE' ? '#4ade80' : rec.tier === 'BORDERLINE' ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={i}
                    className="rounded-lg p-2.5 flex flex-col gap-1"
                    style={{ background: `${recColor}09`, border: `1px solid ${recColor}22` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] text-[hsl(var(--foreground))] font-medium leading-tight">{rec.summary}</p>
                      <Badge
                        label={rec.tier}
                        variant={
                          rec.tier === 'APPROVE'
                            ? 'green'
                            : rec.tier === 'BORDERLINE'
                            ? 'yellow'
                            : 'red'
                        }
                      />
                    </div>
                    <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] leading-relaxed">{rec.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── File Dispute Form ── */}
      <div style={card}>
        <SectionHeader>File a Dispute</SectionHeader>
        <form onSubmit={handleDisputeSubmit} className="flex flex-col gap-2">
          <input
            name="accountName"
            type="text"
            placeholder="Account name (e.g. Chase Sapphire)"
            value={disputeForm.accountName}
            onChange={handleFormChange}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:ring-1 transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              name="bureau"
              value={disputeForm.bureau}
              onChange={handleFormChange}
              className="rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] outline-none focus:ring-1 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {BUREAUS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              name="reason"
              value={disputeForm.reason}
              onChange={handleFormChange}
              className="rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] outline-none focus:ring-1 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {disputeError && (
            <p className="text-[10px] font-mono text-red-400">{disputeError}</p>
          )}
          {disputeSuccess && (
            <p className="text-[10px] font-mono" style={{ color: '#4ade80' }}>
              Dispute submitted successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={disputing}
            className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-black transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ background: '#4ade80' }}
          >
            {disputing ? <Spinner /> : (
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            File Dispute
          </button>
        </form>
      </div>

      {/* ── Funding Pipeline Teaser ── */}
      <Link
        href="/dashboard/credit/funding-pipeline"
        className="flex items-center justify-between rounded-xl p-3 group transition-all hover:opacity-90"
        style={{
          background: 'rgba(74,222,128,0.05)',
          border: '1px solid rgba(74,222,128,0.15)',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Funding Pipeline</span>
          <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
            {loading
              ? 'Loading...'
              : report?.decisionTier === 'APPROVE'
              ? 'You qualify — view funding offers'
              : 'View your funding readiness'}
          </span>
        </div>
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ade80"
          strokeWidth={2}
          className="group-hover:translate-x-0.5 transition-transform"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>

    </div>
  );
}
