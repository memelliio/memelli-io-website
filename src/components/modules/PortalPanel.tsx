'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PartnerProfile {
  id: string;
  organizationName: string;
  tier: 'RESELLER' | 'WHITE_LABEL' | 'AUTHORITY_BUSINESS';
  portalConfig?: Record<string, unknown>;
  stats?: {
    totalClients?: number;
    activeClients?: number;
    totalRevenue?: number;
    packages?: number;
  };
}

interface BrandingConfig {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  welcomeMessage?: string;
  portalTitle?: string;
  mode?: string;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  inviteEmail?: string;
  status?: string;
  joinedAt?: string;
  invitedAt?: string;
}

interface ClientRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  stage?: string;
  status?: string;
  createdAt?: string;
}

interface FunnelStage {
  stage: string;
  count: number;
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
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function displayName(m: TeamMember): string {
  if (m.user?.firstName || m.user?.lastName) {
    return [m.user.firstName, m.user.lastName].filter(Boolean).join(' ');
  }
  return m.user?.email || m.inviteEmail || 'Unknown';
}

function initials(m: TeamMember): string {
  const name = displayName(m);
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    LEAD: 'Lead',
    APPLICATION: 'Application',
    DOCUMENT_REVIEW: 'Doc Review',
    AGREEMENT: 'Agreement',
    ONBOARDING: 'Onboarding',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return map[stage] || stage;
}

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    RESELLER: 'Reseller',
    WHITE_LABEL: 'White Label',
    AUTHORITY_BUSINESS: 'Authority Business',
  };
  return map[tier] || tier;
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    AGENT: 'Agent',
    VIEWER: 'Viewer',
  };
  return map[role] || role;
}

function stageColor(stage: string): string {
  const map: Record<string, string> = {
    LEAD: '#6366f1',
    APPLICATION: '#3b82f6',
    DOCUMENT_REVIEW: '#f59e0b',
    AGREEMENT: '#8b5cf6',
    ONBOARDING: '#f97316',
    ACTIVE: '#22c55e',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
  };
  return map[stage] || 'rgba(255,255,255,0.3)';
}

// ── Upgrade CTA ───────────────────────────────────────────────────────────────

function UpgradeCTA() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
      gap: 24,
      textAlign: 'center',
    }}>
      {/* Gradient ring icon */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(249,115,22,0.15))',
        border: '1px solid rgba(249,115,22,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          <defs>
            <linearGradient id="g1" x1="2" y1="2" x2="22" y2="22">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Pro Partner Access Required
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 360 }}>
          The Pro Portal is available exclusively to Reseller, White Label, and Authority Business partners.
          Upgrade your account to unlock client management, custom branding, team collaboration, and partner analytics.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 520 }}>
        {[
          { tier: 'Reseller', desc: 'Sell and manage clients under your brand' },
          { tier: 'White Label', desc: 'Full white-label portal and branding control' },
          { tier: 'Authority Business', desc: 'Enterprise-grade partner infrastructure' },
        ].map((t) => (
          <div key={t.tier} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '14px 12px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{t.tier}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <a
        href="/settings/billing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #dc2626, #f97316)',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          color: '#fff',
          textDecoration: 'none',
          letterSpacing: '0.02em',
        }}
      >
        Upgrade to Pro Partner
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    AUTHORITY_BUSINESS: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
    WHITE_LABEL: { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)', text: '#ef4444' },
    RESELLER: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#818cf8' },
  };
  const c = colors[tier] || { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.6)' };
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      color: c.text,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 5,
      padding: '3px 8px',
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
    }}>
      {tierLabel(tier)}
    </span>
  );
}

type TabKey = 'overview' | 'clients' | 'branding' | 'team';

// ── Main Component ────────────────────────────────────────────────────────────

export function PortalPanel() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const headers = authHeaders();

      // First check partner access
      const meRes = await fetch(`${API_BASE}/api/pro/me`, { headers });

      if (meRes.status === 403 || meRes.status === 401) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!meRes.ok) {
        const txt = await meRes.text().catch(() => '');
        setError(txt || 'Failed to load partner profile');
        setLoading(false);
        return;
      }

      const meJson = await meRes.json();
      if (meJson.success) setPartner(meJson.data);

      // Load branding, team, clients, funnel in parallel
      const [brandRes, teamRes, clientRes, funnelRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/pro/branding`, { headers }),
        fetch(`${API_BASE}/api/pro/team`, { headers }),
        fetch(`${API_BASE}/api/pro/clients`, { headers }),
        fetch(`${API_BASE}/api/pro/clients/funnel`, { headers }),
      ]);

      if (brandRes.status === 'fulfilled' && brandRes.value.ok) {
        const j = await brandRes.value.json();
        if (j.success) setBranding(j.data);
      }
      if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
        const j = await teamRes.value.json();
        if (j.success) setTeam(Array.isArray(j.data) ? j.data : []);
      }
      if (clientRes.status === 'fulfilled' && clientRes.value.ok) {
        const j = await clientRes.value.json();
        if (j.success) setClients(Array.isArray(j.data) ? j.data : []);
      }
      if (funnelRes.status === 'fulfilled' && funnelRes.value.ok) {
        const j = await funnelRes.value.json();
        if (j.success) setFunnel(Array.isArray(j.data) ? j.data : []);
      }

      setLoading(false);
    }

    load();
  }, []);

  // ── Skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{
          height: 80,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
          animation: 'pulse 1.6s ease-in-out infinite',
        }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              height: 100,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'pulse 1.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  // ── Access Denied — show upgrade CTA ─────────────────────────────────
  if (accessDenied) {
    return (
      <div style={{ background: 'rgba(10,10,10,0.97)', minHeight: '100%' }}>
        <UpgradeCTA />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error || !partner) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 40 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{error || 'Partner profile unavailable'}</span>
      </div>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'clients', label: `Clients${clients.length > 0 ? ` (${clients.length})` : ''}` },
    { key: 'branding', label: 'Branding' },
    { key: 'team', label: `Team${team.length > 0 ? ` (${team.length})` : ''}` },
  ];

  const funnelMax = funnel.length > 0 ? Math.max(...funnel.map((f) => f.count), 1) : 1;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Partner Header ───────────────────────────────────────────── */}
      <Card style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #dc2626, #f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {(partner.organizationName || 'P')[0].toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                {partner.organizationName || 'Partner Organization'}
              </span>
              <TierBadge tier={partner.tier} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              Partner ID: {partner.id.slice(0, 8)}...
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            {[
              { label: 'Clients', value: fmtNum(partner.stats?.totalClients ?? clients.length) },
              { label: 'Revenue', value: fmt(partner.stats?.totalRevenue ?? 0) },
              { label: 'Team', value: fmtNum(team.length) },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid #f97316' : '2px solid transparent',
              color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 13,
              fontWeight: activeTab === t.key ? 600 : 400,
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Funnel chart */}
          {funnel.length > 0 && (
            <Card>
              <SectionTitle>Onboarding Funnel</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {funnel.map((f) => {
                  const pct = Math.round((f.count / funnelMax) * 100);
                  return (
                    <div key={f.stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{stageLabel(f.stage)}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{f.count}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: stageColor(f.stage),
                          borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Partner config summary */}
          <Card>
            <SectionTitle>Portal Configuration</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Tier', value: tierLabel(partner.tier) },
                { label: 'Portal Title', value: branding?.portalTitle || 'Not set' },
                { label: 'Font', value: branding?.fontFamily || 'Default' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {branding?.welcomeMessage && (
              <div style={{
                marginTop: 14,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
                borderLeft: '3px solid rgba(249,115,22,0.4)',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Welcome Message
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                  {branding.welcomeMessage}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Clients ─────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {clients.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>No clients onboarded yet.</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                Use the onboarding flow to add your first client.
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Client', 'Email', 'Stage', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 500, color: '#fff' }}>
                      {c.firstName} {c.lastName}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {c.email}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {c.stage ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: stageColor(c.stage),
                          background: `${stageColor(c.stage)}18`,
                          border: `1px solid ${stageColor(c.stage)}30`,
                          borderRadius: 5,
                          padding: '2px 8px',
                        }}>
                          {stageLabel(c.stage)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {c.status || 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Tab: Branding ────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>Brand Identity</SectionTitle>
            {!branding ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No branding configured.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Color swatches */}
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Color Palette
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Primary', value: branding.primaryColor },
                      { label: 'Secondary', value: branding.secondaryColor },
                      { label: 'Accent', value: branding.accentColor },
                    ].map((color) => color.value ? (
                      <div key={color.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: color.value,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{color.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{color.value}</div>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                  {!branding.primaryColor && !branding.secondaryColor && !branding.accentColor && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No colors configured.</div>
                  )}
                </div>

                {/* Logo */}
                {branding.logo && (
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Logo
                    </div>
                    <div style={{
                      padding: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      display: 'inline-flex',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={branding.logo}
                        alt="Partner logo"
                        style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {/* Settings grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Portal Title', value: branding.portalTitle },
                    { label: 'Font Family', value: branding.fontFamily },
                    { label: 'Branding Mode', value: branding.mode },
                  ].filter((s) => s.value).map((s) => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Welcome message */}
                {branding.welcomeMessage && (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    borderLeft: '3px solid rgba(249,115,22,0.4)',
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      Welcome Message
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                      {branding.welcomeMessage}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Team ────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <Card>
          <SectionTitle>Team Members</SectionTitle>
          {team.length === 0 ? (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>No team members yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map((m) => (
                <div key={m.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 9,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(220,38,38,0.4), rgba(249,115,22,0.4))',
                    border: '1px solid rgba(249,115,22,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {initials(m)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName(m)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                      {m.user?.email || m.inviteEmail || ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: m.role === 'OWNER' ? '#f97316' : 'rgba(255,255,255,0.5)',
                      background: m.role === 'OWNER' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${m.role === 'OWNER' ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 4,
                      padding: '2px 7px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {roleLabel(m.role)}
                    </span>
                    {m.status && m.status !== 'ACTIVE' && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                        {m.status === 'PENDING' ? 'Invite Pending' : m.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
