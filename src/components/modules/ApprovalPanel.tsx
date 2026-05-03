'use client';

import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const BUREAUS = ['TransUnion', 'Experian', 'Equifax'] as const;
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
  return localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token') || null;
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
      return { data: null, status: res.status, error: err?.error ?? `HTTP ${res.status}` };
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
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

type DecisionTier = 'APPROVE' | 'BORDERLINE' | 'DECLINE';

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

interface BureauStatusEntry {
  status: 'PASS' | 'WARN' | 'FAIL';
  issues_count: number;
  decline_issues_count: number;
  issues: string[];
}

interface ApprovalSummary {
  headline: string;
  message: string;
  next_steps: string[];
  average_score: number;
  passing_bureaus: number;
  total_bureaus: number;
}

interface Recommendation {
  rule: string;
  tier: string;
  summary: string;
  description: string;
  remediation?: string;
}

interface InquiryRemoval {
  needed: boolean;
  bureaus: Record<string, { count: number; total_count: number; status: string }>;
}

interface AccountStats {
  open: number;
  closed: number;
  derogatory: number;
  total: number;
  latePayments: number;
  collections: number;
  delinquent: number;
}

interface DecisionJson {
  credit_scores?: BureauScore[];
  utilization_summary?: UtilizationSummary[];
  bureau_status?: Record<string, BureauStatusEntry>;
  approval_summary?: ApprovalSummary;
  recommendations?: Recommendation[];
  inquiry_removal?: InquiryRemoval;
  account_stats?: Record<string, AccountStats>;
  decision_tier?: DecisionTier;
}

interface CreditReport {
  id: number;
  clientId: string;
  decisionTier: DecisionTier;
  smartcreditEmail?: string;
  createdAt: string;
  decisionJson: DecisionJson;
  reportJson?: {
    tradelines?: any[];
    inquiries?: any[];
    public_records?: any[];
  };
}

interface ReportListItem {
  id: number;
  clientId: string;
  decisionTier: DecisionTier;
  smartcreditEmail?: string;
  createdAt: string;
  reportHash?: string;
}

interface DisputeStrategyItem {
  type: string;
  bureau?: string;
  description: string;
  priority: string;
}

interface DisputeStrategy {
  report_id: number;
  generated_at: string;
  disputes?: DisputeStrategyItem[];
  priority_disputes?: DisputeStrategyItem[];
  total_disputes?: number;
}

interface FundingProgram {
  name: string;
  description: string;
  estimatedAmount?: string;
  estimated_amount?: string;
}

interface FundingReadiness {
  report_id: number;
  evaluated_at: string;
  ready: boolean;
  score?: number;
  timeline?: string;
  estimatedTimeline?: string;
  programs?: FundingProgram[];
  approvedPrograms?: FundingProgram[];
  blockers?: string[];
}

interface PassUrl {
  report_id: number;
  pass_url: string;
  token: string;
  expires_at: string;
}

type ActiveTab = 'overview' | 'queue' | 'disputes' | 'funding';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function tierColor(tier: string): string {
  if (tier === 'APPROVE') return '#22c55e';
  if (tier === 'BORDERLINE') return '#f59e0b';
  return '#ef4444';
}

function tierLabel(tier: string): string {
  if (tier === 'APPROVE') return 'Approved';
  if (tier === 'BORDERLINE') return 'Borderline';
  if (tier === 'DECLINE') return 'Declined';
  return tier;
}

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

function bureauStatusColor(status: string): string {
  if (status === 'PASS') return '#22c55e';
  if (status === 'WARN') return '#f59e0b';
  return '#ef4444';
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function truncate(str: string, max = 22): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Design primitives                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  padding: '1rem',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.625rem',
  color: '#e4e4e7',
  fontSize: '0.75rem',
  width: '100%',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'rgba(255,255,255,0.06)',
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
      {children}
    </p>
  );
}

function Skeleton({ w = '100%', h = 12 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ animation: 'spin 0.8s linear infinite' }} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity={0.25} />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
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
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 8px', borderRadius: 9999,
      fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
      background: `${c}22`, color: c, border: `1px solid ${c}44`,
    }}>
      {name}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const c = tierColor(tier);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 8px', borderRadius: 9999,
      fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
      background: `${c}18`, color: c, border: `1px solid ${c}44`,
    }}>
      {tierLabel(tier)}
    </span>
  );
}

/* ─── Score Ring ────────────────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  const pct = scorePercent(score);
  return (
    <div style={{
      background: `conic-gradient(${color} 0% ${pct}%, rgba(255,255,255,0.07) ${pct}% 100%)`,
      borderRadius: '50%', width: 128, height: 128, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(10,10,10,0.97)',
        borderRadius: '50%', width: 98, height: 98,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color, opacity: 0.85 }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

/* ─── Score Range Bar ───────────────────────────────────────────────────── */

function ScoreRangeBar({ score }: { score: number }) {
  const pct = scorePercent(score);
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <div style={{ width: '100%', height: 6, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: color, transition: 'width 0.7s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'monospace', color: '#52525b' }}>
        {['300', '580', '670', '740', '800', '850'].map(v => <span key={v}>{v}</span>)}
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, color }: { label: string; value: React.ReactNode; sub: string; color: string }) {
  return (
    <div style={{ ...card, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color }}>{sub}</span>
    </div>
  );
}

/* ─── Gradient Button ───────────────────────────────────────────────────── */

function GradientButton({
  children, onClick, disabled = false, small = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#dc2626,#f97316)',
        border: 'none', borderRadius: '0.5rem',
        padding: small ? '0.3rem 0.75rem' : '0.4rem 1rem',
        fontSize: small ? 10 : 11, fontWeight: 600,
        color: disabled ? '#71717a' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab Bar                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'queue', label: 'Queue' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'funding', label: 'Funding' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Overview Tab                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({
  report, loading,
}: {
  report: CreditReport | null;
  loading: boolean;
}) {
  const [passLoading, setPassLoading] = useState(false);
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [passCopied, setPassCopied] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const dj = report?.decisionJson ?? {};
  const scores = dj.credit_scores ?? [];
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length)
    : 0;
  const utilization = dj.utilization_summary ?? [];
  const bureauStatus = dj.bureau_status ?? {};
  const approvalSummary = dj.approval_summary;
  const recommendations = dj.recommendations ?? [];
  const inquiryRemoval = dj.inquiry_removal;
  const accountStats = dj.account_stats ?? {};

  const totalAccounts = Object.values(accountStats).reduce((m, s) => Math.max(m, (s as AccountStats).total), 0);
  const totalOpen = Object.values(accountStats).reduce((m, s) => Math.max(m, (s as AccountStats).open), 0);
  const totalDerog = Object.values(accountStats).reduce((sum, s) => sum + (s as AccountStats).derogatory, 0);

  const tier = report?.decisionTier ?? '';
  const tc = tierColor(tier);

  const handleGeneratePass = useCallback(async () => {
    if (!report) return;
    setPassLoading(true);
    setPassError(null);
    const { data, error } = await apiFetch<PassUrl>(`/api/credit/reports/${report.id}/pass-url`, { method: 'POST' });
    setPassLoading(false);
    if (error || !data) {
      setPassError(error ?? 'Failed to generate pass URL');
      return;
    }
    setPassUrl(data.pass_url);
  }, [report]);

  const handleCopyPass = useCallback(() => {
    if (!passUrl) return;
    navigator.clipboard.writeText(passUrl).then(() => {
      setPassCopied(true);
      setTimeout(() => setPassCopied(false), 2500);
    });
  }, [passUrl]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '1.5rem 1rem' }}>
          <Skeleton w={128} h={128} />
          <Skeleton w={200} h={10} />
          <Skeleton w="100%" h={6} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} h={72} />)}
        </div>
        <Skeleton h={80} />
        <Skeleton h={100} />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>No credit report on file</p>
        <p style={{ color: '#52525b', fontSize: 11, fontFamily: 'monospace' }}>Pull a SmartCredit report to begin underwriting</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Decision verdict banner */}
      <div style={{
        ...card,
        padding: '0.75rem 1rem',
        background: `${tc}0d`,
        borderColor: `${tc}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Underwriting Decision
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: tc, marginTop: 2 }}>{tierLabel(tier)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b' }}>Report #{report.id}</p>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b' }}>{fmtDate(report.createdAt)}</p>
        </div>
      </div>

      {/* Approval summary headline */}
      {approvalSummary && (
        <div style={{ ...card, background: `${tc}07`, borderColor: `${tc}22` }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', marginBottom: 4 }}>{approvalSummary.headline}</p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa', lineHeight: 1.55 }}>{approvalSummary.message}</p>
          {approvalSummary.next_steps?.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {approvalSummary.next_steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: tc, fontSize: 10, marginTop: 2 }}>›</span>
                  <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score ring + bureau row */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <ScoreRing score={avgScore} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {scores.length > 0 ? scores.map(s => (
            <div key={s.bureau} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <BureauChip name={s.bureau} />
              <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#52525b' }}>{s.score_type}</span>
            </div>
          )) : BUREAUS.map(b => (
            <div key={b} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <BureauChip name={b} />
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b' }}>—</span>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', maxWidth: 280 }}>
          <ScoreRangeBar score={avgScore} />
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <StatCard
          label="Accounts"
          value={totalAccounts}
          sub={`${totalOpen} open`}
          color="#22c55e"
        />
        <StatCard
          label="Derogatory"
          value={totalDerog}
          sub="flagged"
          color={totalDerog > 0 ? '#ef4444' : '#22c55e'}
        />
        <StatCard
          label="Bureaus Passing"
          value={`${approvalSummary?.passing_bureaus ?? '—'}/${approvalSummary?.total_bureaus ?? '—'}`}
          sub="above threshold"
          color={approvalSummary && approvalSummary.passing_bureaus === approvalSummary.total_bureaus ? '#22c55e' : '#f59e0b'}
        />
      </div>

      {/* Bureau status grid */}
      {Object.keys(bureauStatus).length > 0 && (
        <div style={card}>
          <SectionHeader>Bureau Status</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.entries(bureauStatus) as [string, BureauStatusEntry][]).map(([bureau, bs]) => {
              const bc = bureauStatusColor(bs.status);
              return (
                <div key={bureau} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  background: `${bc}0d`, border: `1px solid ${bc}22`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BureauChip name={bureau} />
                    {bs.issues.length > 0 && (
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a' }}>
                        {bs.issues.slice(0, 2).map(i => i.replace(/_/g, ' ')).join(', ')}
                        {bs.issues.length > 2 && ` +${bs.issues.length - 2}`}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: bc }}>{bs.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit utilization */}
      {utilization.length > 0 && (
        <div style={card}>
          <SectionHeader>Credit Utilization by Bureau</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {utilization.map(u => {
              const pct = u.utilization_pct ?? 0;
              const bc = u.status === 'healthy' ? '#22c55e' : u.status === 'elevated' ? '#f59e0b' : '#ef4444';
              return (
                <div key={u.bureau}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <BureauChip name={u.bureau} />
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#a1a1aa' }}>
                      {u.utilization_pct != null ? `${pct}%` : 'No data'}
                      {u.total_limit > 0 && (
                        <span style={{ color: '#52525b' }}> ({fmtCurrency(u.total_balance)} / {fmtCurrency(u.total_limit)})</span>
                      )}
                    </span>
                  </div>
                  {u.utilization_pct != null && (
                    <div style={{ width: '100%', height: 5, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: bc, borderRadius: 9999, transition: 'width 0.7s ease' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inquiry removal */}
      {inquiryRemoval && (
        <div style={{
          ...card,
          background: inquiryRemoval.needed ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.05)',
          borderColor: inquiryRemoval.needed ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)',
        }}>
          <SectionHeader>Inquiry Removal Analysis</SectionHeader>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: inquiryRemoval.needed ? '#f87171' : '#4ade80', marginBottom: 8 }}>
            {inquiryRemoval.needed ? 'Inquiry removal recommended' : 'Inquiry count within acceptable range'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.entries(inquiryRemoval.bureaus) as [string, { count: number; total_count: number; status: string }][]).map(([bureau, info]) => {
              const ic = info.status === 'removal_needed' ? '#ef4444' : '#22c55e';
              return (
                <div key={bureau} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <BureauChip name={bureau} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a' }}>
                      {info.count} recent / {info.total_count} total
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: ic }}>
                      {info.status === 'removal_needed' ? 'Remove' : 'Pass'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action items */}
      {recommendations.length > 0 && (
        <div style={card}>
          <SectionHeader>Action Items ({recommendations.length})</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, i) => {
              const rc = tierColor(rec.tier);
              return (
                <div key={i} style={{
                  borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
                  background: `${rc}09`, border: `1px solid ${rc}22`,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#e4e4e7', lineHeight: 1.4, flex: 1 }}>{rec.summary}</p>
                    <TierBadge tier={rec.tier} />
                  </div>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', lineHeight: 1.55 }}>{rec.description}</p>
                  {rec.remediation && (
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b' }}>
                      Remediation: {rec.remediation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pass URL generator */}
      {(tier === 'APPROVE' || tier === 'BORDERLINE') && (
        <div style={{ ...card, background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.15)' }}>
          <SectionHeader>Shareable Approval Pass</SectionHeader>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 10 }}>
            Generate a public link to share this approval decision with lenders or clients.
          </p>
          {passUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ ...inputStyle, cursor: 'text', userSelect: 'all', wordBreak: 'break-all' }}>
                {passUrl}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <GradientButton onClick={handleCopyPass} small>
                  {passCopied ? 'Copied' : 'Copy Link'}
                </GradientButton>
                <button
                  onClick={() => window.open(passUrl, '_blank')}
                  style={{ fontSize: 10, fontFamily: 'monospace', color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Open in new tab
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GradientButton onClick={handleGeneratePass} disabled={passLoading}>
                {passLoading ? <><Spinner size={12} /> Generating...</> : 'Generate Pass URL'}
              </GradientButton>
              {passError && (
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#f87171' }}>{passError}</span>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Queue Tab — all reports list                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function QueueTab() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | DecisionTier>('ALL');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<ReportListItem[]>('/api/credit/reports').then(({ data, error: err }) => {
      if (cancelled) return;
      if (err && err !== 'not_found') setError(err);
      else setReports(data ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.decisionTier === filter);

  const counts: Record<string, number> = { ALL: reports.length };
  for (const tier of ['APPROVE', 'BORDERLINE', 'DECLINE'] as DecisionTier[]) {
    counts[tier] = reports.filter(r => r.decisionTier === tier).length;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['ALL', 'APPROVE', 'BORDERLINE', 'DECLINE'] as const).map(f => {
          const active = filter === f;
          const c = f === 'ALL' ? '#f97316' : tierColor(f);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
                padding: '3px 10px', borderRadius: 9999,
                border: `1px solid ${active ? c : 'rgba(255,255,255,0.08)'}`,
                background: active ? `${c}20` : 'transparent',
                color: active ? c : '#71717a',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f} {counts[f] != null ? `(${counts[f]})` : ''}
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {(['APPROVE', 'BORDERLINE', 'DECLINE'] as DecisionTier[]).map(t => (
          <StatCard
            key={t}
            label={tierLabel(t)}
            value={loading ? '—' : counts[t]}
            sub="applications"
            color={tierColor(t)}
          />
        ))}
      </div>

      {/* Report list */}
      <div style={card}>
        <SectionHeader>Application Queue ({filtered.length})</SectionHeader>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} h={52} />)}
          </div>
        ) : error ? (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#f87171' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b', textAlign: 'center', padding: '1.5rem 0' }}>
            No applications found
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
            {filtered.map(r => {
              const tc = tierColor(r.decisionTier);
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e4e4e7' }}>
                      Report #{r.id}
                    </span>
                    {r.smartcreditEmail && (
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncate(r.smartcreditEmail, 28)}
                      </span>
                    )}
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#3f3f46' }}>
                      {fmtDate(r.createdAt)}
                    </span>
                  </div>
                  <TierBadge tier={r.decisionTier} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Disputes Tab                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DisputesTab({ report }: { report: CreditReport | null }) {
  const [strategy, setStrategy] = useState<DisputeStrategy | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const [form, setForm] = useState({ accountName: '', bureau: 'Equifax' as Bureau, reason: DISPUTE_REASONS[0] });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* Load dispute strategy */
  useEffect(() => {
    if (!report?.clientId) return;
    let cancelled = false;
    setStrategyLoading(true);
    setStrategyError(null);
    apiFetch<DisputeStrategy>(`/api/credit-reports/disputes/${report.clientId}`).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err && err !== 'not_found') setStrategyError(err);
      else if (data) setStrategy(data);
      setStrategyLoading(false);
    });
    return () => { cancelled = true; };
  }, [report?.clientId]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountName.trim()) {
      setSubmitError('Account name is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const { error: err, status } = await apiFetch('/api/credit/disputes', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (status === 404 || !err) {
      setSubmitSuccess(true);
      setForm({ accountName: '', bureau: 'Equifax', reason: DISPUTE_REASONS[0] });
      setTimeout(() => setSubmitSuccess(false), 4000);
      return;
    }

    setSubmitError(err);
  }, [form]);

  const allDisputes = [
    ...(strategy?.priority_disputes ?? []),
    ...(strategy?.disputes?.filter(d => !strategy?.priority_disputes?.includes(d)) ?? []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Dispute strategy from API */}
      <div style={card}>
        <SectionHeader>Dispute Strategy {strategy ? `(${strategy.total_disputes ?? allDisputes.length} items)` : ''}</SectionHeader>
        {strategyLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} h={56} />)}
          </div>
        ) : strategyError ? (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#f87171' }}>{strategyError}</p>
        ) : !report ? (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b' }}>Load a credit report to generate a dispute strategy.</p>
        ) : allDisputes.length === 0 ? (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#4ade80', textAlign: 'center', padding: '1rem 0' }}>
            No dispute items identified — profile is clean.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {allDisputes.map((d, i) => {
              const priority = (d.priority ?? '').toLowerCase();
              const pc = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#71717a';
              return (
                <div key={i} style={{
                  borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                  background: `${pc}09`, border: `1px solid ${pc}20`,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#e4e4e7' }}>{d.type}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {d.bureau && <BureauChip name={d.bureau} />}
                      {d.priority && (
                        <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 600, color: pc, textTransform: 'uppercase' }}>
                          {d.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', lineHeight: 1.5 }}>{d.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual dispute form */}
      <div style={card}>
        <SectionHeader>File a Manual Dispute</SectionHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            name="accountName"
            type="text"
            placeholder="Account name (e.g. Chase Sapphire)"
            value={form.accountName}
            onChange={handleFormChange}
            style={inputStyle}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select name="bureau" value={form.bureau} onChange={handleFormChange} style={selectStyle}>
              {BUREAUS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select name="reason" value={form.reason} onChange={handleFormChange} style={selectStyle}>
              {DISPUTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {submitError && (
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#f87171' }}>{submitError}</p>
          )}
          {submitSuccess && (
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#4ade80' }}>Dispute submitted successfully.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GradientButton disabled={submitting} small>
              {submitting ? <><Spinner size={11} /> Submitting...</> : 'Submit Dispute'}
            </GradientButton>
          </div>
        </form>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Funding Tab                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FundingTab({ report }: { report: CreditReport | null }) {
  const [readiness, setReadiness] = useState<FundingReadiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!report?.clientId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<FundingReadiness>(`/api/credit-reports/funding-readiness/${report.clientId}`).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err && err !== 'not_found') setError(err);
      else if (data) setReadiness(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [report?.clientId]);

  const programs: FundingProgram[] = readiness?.programs ?? readiness?.approvedPrograms ?? [];
  const timeline = readiness?.timeline ?? readiness?.estimatedTimeline;
  const isReady = readiness?.ready;
  const blockers = readiness?.blockers ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Readiness banner */}
      {loading ? (
        <Skeleton h={72} />
      ) : !report ? (
        <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: 12, color: '#71717a', fontFamily: 'monospace' }}>No credit report loaded</p>
        </div>
      ) : readiness ? (
        <div style={{
          ...card,
          background: isReady ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.06)',
          borderColor: isReady ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: isReady ? '#4ade80' : '#f87171' }}>
              {isReady ? 'Funding Ready' : 'Not Yet Funding Ready'}
            </p>
            {readiness.score != null && (
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: scoreColor(readiness.score) }}>
                Score: {readiness.score}
              </span>
            )}
          </div>
          {timeline && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa', marginBottom: 6 }}>
              Timeline: <span style={{ color: isReady ? '#4ade80' : '#f59e0b' }}>{timeline}</span>
            </p>
          )}
          {blockers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Blockers</p>
              {blockers.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>×</span>
                  <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#f87171' }}>{b}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : error ? (
        <div style={{ ...card }}>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#f87171' }}>{error}</p>
        </div>
      ) : null}

      {/* Approved programs */}
      {(loading || programs.length > 0) && (
        <div style={card}>
          <SectionHeader>Approved Funding Programs</SectionHeader>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} h={64} />)}
            </div>
          ) : programs.length === 0 ? (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b', textAlign: 'center', padding: '1rem 0' }}>
              Address the blockers above to unlock funding programs.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {programs.map((p, i) => {
                const amount = p.estimatedAmount ?? p.estimated_amount;
                return (
                  <div key={i} style={{
                    borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
                    background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(249,115,22,0.18)',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#f97316' }}>{p.name}</p>
                      {amount && (
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>{amount}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', lineHeight: 1.5 }}>{p.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Funding pipeline stats from the report decision */}
      {report?.decisionTier && (
        <div style={{ ...card, background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(249,115,22,0.12)' }}>
          <SectionHeader>Pipeline Decision</SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a' }}>Current decision tier</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: tierColor(report.decisionTier), marginTop: 4 }}>
                {tierLabel(report.decisionTier)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b' }}>Report #{report.id}</p>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', marginTop: 2 }}>{fmtDate(report.createdAt)}</p>
            </div>
          </div>
          {report.decisionTier === 'APPROVE' && (
            <div style={{
              marginTop: 10, padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            }}>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#4ade80' }}>
                Client cleared for funding — a specialist will follow up within 24 hours.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Root Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ApprovalPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [report, setReport] = useState<CreditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  /* Load latest report on mount */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<CreditReport>('/api/credit/latest').then(({ data, status }) => {
      if (cancelled) return;
      if (status === 404 || !data) setNoData(true);
      else setReport(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const tier = report?.decisionTier ?? '';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      background: 'rgba(10,10,10,0.97)',
      overflowY: 'auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '1rem', minHeight: '100%' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5', margin: 0, letterSpacing: '-0.01em' }}>
              Approval &amp; Underwriting
            </h2>
            {loading ? (
              <div style={{ marginTop: 4 }}><Skeleton w={160} h={10} /></div>
            ) : report ? (
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', marginTop: 3 }}>
                Report #{report.id} &middot; {fmtDate(report.createdAt)}
                {report.smartcreditEmail && ` · ${truncate(report.smartcreditEmail, 24)}`}
              </p>
            ) : (
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', marginTop: 3 }}>No report on file</p>
            )}
          </div>
          {!loading && tier && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: tierColor(tier),
                boxShadow: `0 0 6px ${tierColor(tier)}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: tierColor(tier) }}>{tierLabel(tier)}</span>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 1 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  color: active ? '#f4f4f5' : '#71717a',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.375rem 0.75rem',
                  borderBottom: active ? '2px solid #f97316' : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'overview' && (
          <OverviewTab report={report} loading={loading} />
        )}
        {activeTab === 'queue' && (
          <QueueTab />
        )}
        {activeTab === 'disputes' && (
          <DisputesTab report={report} />
        )}
        {activeTab === 'funding' && (
          <FundingTab report={report} />
        )}

      </div>
    </div>
  );
}
