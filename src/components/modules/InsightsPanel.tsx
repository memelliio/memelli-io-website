'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  contacts: number;
  openDeals: number;
  dealValue: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  publishedArticles: number;
  aiCommands: number;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    occurredAt: string;
    contactId: string | null;
  }>;
}

interface EngineStats {
  commerce: {
    stores: number;
    products: number;
    orders: number;
    revenue: number;
  };
  crm: {
    pipelines: number;
    deals: number;
    contacts_with_deals: number;
    win_rate: number;
  };
  coaching: {
    programs: number;
    enrollments: number;
    completions: number;
    certificates: number;
  };
  seo: {
    questions: number;
    articles: number;
    published: number;
    indexed: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{sub}</span>}
    </div>
  );
}

function BarChart({ bars }: { bars: Array<{ label: string; value: number; max: number; color?: string }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bars.map((b) => {
        const pct = b.max > 0 ? Math.min(100, (b.value / b.max) * 100) : 0;
        return (
          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{b.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{fmtNum(b.value)}</span>
            </div>
            <div style={{
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: b.color || 'linear-gradient(90deg, #dc2626, #f97316)',
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 3,
        height: 14,
        background: 'linear-gradient(180deg, #dc2626, #f97316)',
        borderRadius: 2,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Engine Comparison Table ───────────────────────────────────────────────────

interface EngineRow {
  engine: string;
  primaryMetric: string;
  primaryLabel: string;
  secondaryMetric: string;
  secondaryLabel: string;
  score: number; // 0-100 relative strength
}

function buildEngineRows(stats: EngineStats, dashboard: DashboardData): EngineRow[] {
  const maxRevenue = Math.max(stats.commerce.revenue, 1);
  const maxDeals = Math.max(stats.crm.deals, 1);
  const maxEnroll = Math.max(stats.coaching.enrollments + stats.coaching.completions, 1);
  const maxArticles = Math.max(stats.seo.articles, 1);

  return [
    {
      engine: 'Commerce',
      primaryMetric: fmt(stats.commerce.revenue),
      primaryLabel: 'Total Revenue',
      secondaryMetric: `${fmtNum(stats.commerce.orders)} orders`,
      secondaryLabel: 'Orders',
      score: Math.round((stats.commerce.revenue / maxRevenue) * 100),
    },
    {
      engine: 'CRM',
      primaryMetric: `${stats.crm.win_rate}%`,
      primaryLabel: 'Win Rate',
      secondaryMetric: `${fmtNum(stats.crm.deals)} deals`,
      secondaryLabel: 'Total Deals',
      score: Math.min(100, Math.round((stats.crm.deals / Math.max(maxDeals, 1)) * 100)),
    },
    {
      engine: 'Coaching',
      primaryMetric: fmtNum(stats.coaching.enrollments),
      primaryLabel: 'Active Enrollments',
      secondaryMetric: `${stats.coaching.certificates} certs`,
      secondaryLabel: 'Certificates',
      score: Math.round(((stats.coaching.enrollments + stats.coaching.completions) / maxEnroll) * 100),
    },
    {
      engine: 'SEO',
      primaryMetric: fmtNum(stats.seo.published),
      primaryLabel: 'Published Articles',
      secondaryMetric: `${stats.seo.indexed} indexed`,
      secondaryLabel: 'Indexed',
      score: Math.round((stats.seo.articles / maxArticles) * 100),
    },
  ];
}

// ── Main Component ────────────────────────────────────────────────────────────

export function InsightsPanel() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = authHeaders();
        const [dashRes, engRes] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/dashboard`, { headers }),
          fetch(`${API_BASE}/api/analytics/engine-stats`, { headers }),
        ]);

        if (!dashRes.ok || !engRes.ok) {
          const msg = !dashRes.ok ? await dashRes.text() : await engRes.text();
          throw new Error(msg || 'Failed to load analytics');
        }

        const dashJson = await dashRes.json();
        const engJson = await engRes.json();

        if (dashJson.success) setDashboard(dashJson.data);
        if (engJson.success) setEngineStats(engJson.data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 90,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 180,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error || !dashboard || !engineStats) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 40 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{error || 'No data available'}</span>
      </div>
    );
  }

  const engineRows = buildEngineRows(engineStats, dashboard);
  const topEngine = [...engineRows].sort((a, b) => b.score - a.score)[0];

  // Leads engine inferred from CRM contacts
  const leadsValue = dashboard.contacts;

  // Commerce revenue bar chart for breakdown
  const revenueMax = Math.max(
    engineStats.commerce.revenue,
    engineStats.crm.deals * 500, // rough proxy
    engineStats.coaching.enrollments * 200,
    engineStats.seo.published * 50,
    1,
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Top KPI Row ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Monthly Revenue" value={fmt(dashboard.monthlyRevenue)} sub={`${fmtNum(dashboard.monthlyOrders)} orders this month`} />
        <StatCard label="Open Pipeline" value={fmt(dashboard.dealValue)} sub={`${fmtNum(dashboard.openDeals)} open deals`} />
        <StatCard label="Total Contacts" value={fmtNum(dashboard.contacts)} sub="In CRM" />
        <StatCard label="AI Commands (30d)" value={fmtNum(dashboard.aiCommands)} sub={`${fmtNum(dashboard.publishedArticles)} articles live`} />
      </div>

      {/* ── Engine Comparison ───────────────────────────────────────── */}
      <Card>
        <SectionTitle>Engine Performance — Comparative</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Bar chart */}
          <div>
            <BarChart bars={engineRows.map((r) => ({
              label: r.engine,
              value: r.score,
              max: 100,
              color: r.engine === topEngine.engine
                ? 'linear-gradient(90deg, #dc2626, #f97316)'
                : 'rgba(255,255,255,0.15)',
            }))} />
            <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Scores are relative to the highest-performing engine across revenue, deal activity, enrollments, and content volume.
            </p>
          </div>

          {/* Engine detail cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {engineRows.map((r) => (
              <div key={r.engine} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: r.engine === topEngine.engine ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${r.engine === topEngine.engine ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{r.engine}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.secondaryMetric}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: r.engine === topEngine.engine ? '#f97316' : '#fff' }}>
                    {r.primaryMetric}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{r.primaryLabel}</div>
                </div>
                {r.engine === topEngine.engine && (
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#f97316',
                    background: 'rgba(249,115,22,0.12)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    Top
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Engine Deep-Dives ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Commerce */}
        <Card>
          <SectionTitle>Commerce Engine</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Revenue', value: fmt(engineStats.commerce.revenue) },
              { label: 'Orders', value: fmtNum(engineStats.commerce.orders) },
              { label: 'Products', value: fmtNum(engineStats.commerce.products) },
              { label: 'Stores', value: fmtNum(engineStats.commerce.stores) },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <BarChart bars={[
            { label: 'Orders Filled', value: engineStats.commerce.orders, max: Math.max(engineStats.commerce.orders, 1) },
          ]} />
        </Card>

        {/* CRM */}
        <Card>
          <SectionTitle>CRM Engine</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Win Rate', value: `${engineStats.crm.win_rate}%` },
              { label: 'Open Deals', value: fmtNum(dashboard.openDeals) },
              { label: 'Total Deals', value: fmtNum(engineStats.crm.deals) },
              { label: 'Pipelines', value: fmtNum(engineStats.crm.pipelines) },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <BarChart bars={[
            { label: 'Deals with Contacts', value: engineStats.crm.contacts_with_deals, max: Math.max(engineStats.crm.deals, 1) },
            { label: 'Open Pipeline', value: dashboard.openDeals, max: Math.max(engineStats.crm.deals, 1) },
          ]} />
        </Card>

        {/* Coaching */}
        <Card>
          <SectionTitle>Coaching Engine</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Programs', value: fmtNum(engineStats.coaching.programs) },
              { label: 'Active', value: fmtNum(engineStats.coaching.enrollments) },
              { label: 'Completions', value: fmtNum(engineStats.coaching.completions) },
              { label: 'Certificates', value: fmtNum(engineStats.coaching.certificates) },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <BarChart bars={[
            { label: 'Active Enrollments', value: engineStats.coaching.enrollments, max: Math.max(engineStats.coaching.enrollments + engineStats.coaching.completions, 1) },
            { label: 'Completions', value: engineStats.coaching.completions, max: Math.max(engineStats.coaching.enrollments + engineStats.coaching.completions, 1) },
          ]} />
        </Card>

        {/* SEO */}
        <Card>
          <SectionTitle>SEO Traffic Engine</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Questions', value: fmtNum(engineStats.seo.questions) },
              { label: 'Total Articles', value: fmtNum(engineStats.seo.articles) },
              { label: 'Published', value: fmtNum(engineStats.seo.published) },
              { label: 'Indexed', value: fmtNum(engineStats.seo.indexed) },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <BarChart bars={[
            { label: 'Published', value: engineStats.seo.published, max: Math.max(engineStats.seo.articles, 1) },
            { label: 'Indexed', value: engineStats.seo.indexed, max: Math.max(engineStats.seo.articles, 1) },
          ]} />
        </Card>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────── */}
      {dashboard.recentActivities.length > 0 && (
        <Card>
          <SectionTitle>Recent Activity</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {dashboard.recentActivities.slice(0, 8).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < Math.min(dashboard.recentActivities.length, 8) - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626, #f97316)',
                  flexShrink: 0,
                  marginTop: 5,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.title}
                  </div>
                  {a.body && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.body}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 1 }}>
                  {timeAgo(a.occurredAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
