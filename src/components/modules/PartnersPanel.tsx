'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type PartnerTier =
  | 'STANDARD_AFFILIATE'
  | 'PREMIUM_AFFILIATE'
  | 'RESELLER'
  | 'WHITE_LABEL'
  | 'AUTHORITY_BUSINESS';

type PartnerStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

interface Partner {
  id: string;
  name: string;
  email: string;
  company: string | null;
  tier: PartnerTier;
  status: PartnerStatus;
  commissionRate: number;
  referralCode: string;
  totalEarned: number;
  pendingBalance: number;
  totalPaid: number;
  createdAt: string;
  _count: { referrals: number; commissions: number; leads: number };
}

interface CommissionSummary {
  pending: { total: number; count: number };
  approved: { total: number; count: number };
  paid: { total: number; count: number };
  reversed: { total: number; count: number };
  byPartner: Array<{
    partnerId: string;
    partner: { id: string; name: string; email: string } | null;
    totalAmount: number;
    count: number;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const TIER_LABELS: Record<PartnerTier, string> = {
  STANDARD_AFFILIATE: 'Standard',
  PREMIUM_AFFILIATE: 'Premium',
  RESELLER: 'Reseller',
  WHITE_LABEL: 'White Label',
  AUTHORITY_BUSINESS: 'Authority',
};

const STATUS_COLORS: Record<PartnerStatus, string> = {
  PENDING: 'rgba(234,179,8,0.15)',
  APPROVED: 'rgba(34,197,94,0.15)',
  ACTIVE: 'rgba(34,197,94,0.15)',
  SUSPENDED: 'rgba(239,68,68,0.15)',
  TERMINATED: 'rgba(239,68,68,0.08)',
};

const STATUS_TEXT: Record<PartnerStatus, string> = {
  PENDING: '#eab308',
  APPROVED: '#22c55e',
  ACTIVE: '#22c55e',
  SUSPENDED: '#ef4444',
  TERMINATED: '#6b7280',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{sub}</span>}
    </div>
  );
}

function TierBadge({ tier }: { tier: PartnerTier }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 4,
        background: 'rgba(220,38,38,0.15)',
        color: '#f97316',
        border: '1px solid rgba(220,38,38,0.25)',
      }}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function StatusBadge({ status }: { status: PartnerStatus }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 4,
        background: STATUS_COLORS[status],
        color: STATUS_TEXT[status],
        border: `1px solid ${STATUS_TEXT[status]}33`,
      }}
    >
      {status}
    </span>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTrending() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface PartnersPanelProps {
  /** When set, the tier dropdown is constrained to these tiers only */
  programTiers?: string[];
  /** Pre-select this tier in the filter on mount */
  defaultTierFilter?: string;
  /** Override the heading label (default: "Partner Program") */
  programLabel?: string;
}

export function PartnersPanel({ programTiers, defaultTierFilter, programLabel }: PartnersPanelProps = {}) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>(defaultTierFilter ?? '');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'partners' | 'commissions'>('partners');

  // Determine which tiers to show in the dropdown
  const availableTiers = programTiers
    ? (Object.keys(TIER_LABELS) as PartnerTier[]).filter(t => programTiers.includes(t))
    : (Object.keys(TIER_LABELS) as PartnerTier[]);

  // Heading label
  const heading = programLabel ?? 'Partner Program';

  const fetchPartners = (page = 1) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (statusFilter) params.set('status', statusFilter);
    if (tierFilter) params.set('tier', tierFilter);
    if (search) params.set('search', search);

    fetch(`${API_BASE}/api/partners?${params.toString()}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setPartners(res.data);
          setPagination(res.pagination);
        } else {
          setError(res.error || 'Failed to load partners');
        }
      })
      .catch(() => setError('Network error — could not reach the API'))
      .finally(() => setLoading(false));
  };

  const fetchSummary = () => {
    setSummaryLoading(true);
    fetch(`${API_BASE}/api/partners/commissions/summary`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) setSummary(res.data);
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  };

  useEffect(() => { fetchPartners(1); }, [statusFilter, tierFilter, search]);
  useEffect(() => { fetchSummary(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const totalPending = summary?.pending.total ?? 0;
  const totalApproved = summary?.approved.total ?? 0;
  const totalPaid = summary?.paid.total ?? 0;

  // ── Styles ──────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,10,0.97)',
    borderRadius: 16,
    padding: '28px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minHeight: 480,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#fff',
  };

  const headingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  };

  const gradientText: React.CSSProperties = {
    background: 'linear-gradient(90deg, #dc2626, #f97316)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 700,
    fontSize: 18,
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 4,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 16px',
    borderRadius: 7,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg, #dc2626, #f97316)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
  });

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    padding: '7px 12px',
    outline: 'none',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    flex: 1,
    minWidth: 160,
  };

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    padding: '7px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 14px',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '13px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
    color: 'rgba(255,255,255,0.85)',
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  };

  const pageBtn = (disabled: boolean): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7,
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
    padding: '6px 10px',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headingStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #dc2626, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <IconUsers />
          </div>
          <span style={gradientText}>{heading}</span>
        </div>
        <button
          style={btnStyle}
          onClick={() => { fetchPartners(pagination.page); fetchSummary(); }}
          title="Refresh"
        >
          <IconRefresh />
          <span>Refresh</span>
        </button>
      </div>

      {/* Commission summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard
          label="Pending Commissions"
          value={summaryLoading ? '—' : fmt(totalPending)}
          sub={summary ? `${summary.pending.count} records` : undefined}
        />
        <StatCard
          label="Approved Commissions"
          value={summaryLoading ? '—' : fmt(totalApproved)}
          sub={summary ? `${summary.approved.count} records` : undefined}
        />
        <StatCard
          label="Total Paid Out"
          value={summaryLoading ? '—' : fmt(totalPaid)}
          sub={summary ? `${summary.paid.count} payouts` : undefined}
        />
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <button style={tabStyle(activeTab === 'partners')} onClick={() => setActiveTab('partners')}>
          Partners
        </button>
        <button style={tabStyle(activeTab === 'commissions')} onClick={() => setActiveTab('commissions')}>
          Top Earners
        </button>
      </div>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <>
          {/* Filters */}
          <form onSubmit={handleSearch} style={filterRowStyle}>
            <input
              style={inputStyle}
              placeholder="Search by name, email, code..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <select style={selectStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {(['PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'TERMINATED'] as PartnerStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select style={selectStyle} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="">All Tiers</option>
              {availableTiers.map(t => (
                <option key={t} value={t}>{TIER_LABELS[t]}</option>
              ))}
            </select>
            <button type="submit" style={{ ...btnStyle, background: 'linear-gradient(135deg, #dc2626, #f97316)', color: '#fff', border: 'none' }}>
              Search
            </button>
          </form>

          {/* Table */}
          {error ? (
            <div style={{ color: '#ef4444', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>{error}</div>
          ) : loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
              Loading partners...
            </div>
          ) : partners.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
              No partners found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Partner</th>
                    <th style={thStyle}>Tier</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Commission</th>
                    <th style={thStyle}>Referrals</th>
                    <th style={thStyle}>Earned</th>
                    <th style={thStyle}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => (
                    <tr key={p.id} style={{ transition: 'background 0.1s' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.email}</div>
                        {p.referralCode && (
                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              color: '#f97316',
                              fontFamily: 'monospace',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {p.referralCode}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}><TierBadge tier={p.tier} /></td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: 'rgba(249,115,22,0.12)',
                            color: '#f97316',
                            padding: '2px 8px',
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {p.commissionRate}%
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.55)' }}>
                        {p._count?.referrals ?? 0}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>
                          {fmt(p.totalEarned ?? 0)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#eab308' }}>
                          {fmt(p.pendingBalance ?? 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div style={paginationStyle}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {pagination.total} partners — page {pagination.page} of {pagination.totalPages}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={pageBtn(pagination.page <= 1)}
                  disabled={pagination.page <= 1}
                  onClick={() => fetchPartners(pagination.page - 1)}
                >
                  <IconChevronLeft />
                </button>
                <button
                  style={pageBtn(pagination.page >= pagination.totalPages)}
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchPartners(pagination.page + 1)}
                >
                  <IconChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top Earners Tab */}
      {activeTab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {summaryLoading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
              Loading commission data...
            </div>
          ) : !summary || summary.byPartner.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
              No commission records yet.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                All-time commission leaders
              </div>
              {summary.byPartner.slice(0, 10).map((row, i) => {
                const pct =
                  summary.byPartner[0]?.totalAmount > 0
                    ? (row.totalAmount / summary.byPartner[0].totalAmount) * 100
                    : 0;
                return (
                  <div
                    key={row.partnerId}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: i === 0 ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.partner?.name ?? 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {row.partner?.email ?? row.partnerId}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          height: 3,
                          borderRadius: 2,
                          background: 'rgba(255,255,255,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg,#dc2626,#f97316)',
                            borderRadius: 2,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>{fmt(row.totalAmount)}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {row.count} commission{row.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Footer note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 4,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 11,
        }}
      >
        <IconTrending />
        <span>Partner data updates in real time from {API_BASE}</span>
      </div>
    </div>
  );
}
