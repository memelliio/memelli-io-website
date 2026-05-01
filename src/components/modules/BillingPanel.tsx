'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = 'trial' | 'starter' | 'pro' | 'enterprise';

interface PlanLimits {
  contacts: number;
  deals: number;
  articles: number;
  teamMembers: number;
  aiCommands: number;
}

interface BillingPlan {
  plan: Plan;
  status: string;
  limits: PlanLimits;
  tenantId: string;
  tenantName: string;
}

interface UsageStat {
  used: number;
  limit: number;
  period?: string;
}

interface BillingUsage {
  plan: Plan;
  usage: {
    contacts: UsageStat;
    deals: UsageStat;
    articles: UsageStat;
    teamMembers: UsageStat;
    aiCommands: UsageStat;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

const PLAN_ORDER: Plan[] = ['trial', 'starter', 'pro', 'enterprise'];

const PLAN_META: Record<
  Plan,
  { label: string; price: string; description: string; highlight: boolean; limits: PlanLimits }
> = {
  trial: {
    label: 'Trial',
    price: 'Free',
    description: 'Explore the platform with limited access.',
    highlight: false,
    limits: { contacts: 100, deals: 5, articles: 10, teamMembers: 1, aiCommands: 10 },
  },
  starter: {
    label: 'Starter',
    price: '$49/mo',
    description: 'Small teams ready to grow their pipeline.',
    highlight: false,
    limits: { contacts: 1000, deals: 10, articles: 100, teamMembers: 3, aiCommands: 100 },
  },
  pro: {
    label: 'Pro',
    price: '$149/mo',
    description: 'Scale your CRM, content, and AI operations.',
    highlight: true,
    limits: { contacts: 10000, deals: 100, articles: 1000, teamMembers: 10, aiCommands: 1000 },
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Custom',
    description: 'Unlimited everything. White-glove support.',
    highlight: false,
    limits: { contacts: -1, deals: -1, articles: -1, teamMembers: -1, aiCommands: -1 },
  },
};

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  contacts: 'Contacts',
  deals: 'Active Deals',
  articles: 'Articles',
  teamMembers: 'Team Members',
  aiCommands: 'AI Commands (30d)',
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
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function formatLimit(n: number): string {
  if (n === -1) return 'Unlimited';
  return n.toLocaleString();
}

function usagePct(used: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconBilling() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
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

function IconShield() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = usagePct(used, limit);
  const isUnlimited = limit === -1;

  const barGradient = pct >= 90
    ? 'linear-gradient(90deg,#dc2626,#ef4444)'
    : pct >= 70
    ? 'linear-gradient(90deg,#d97706,#eab308)'
    : 'linear-gradient(90deg,#dc2626,#f97316)';

  const valueColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : 'rgba(255,255,255,0.75)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {isUnlimited ? (
            <span style={{ color: '#f97316', fontSize: 11 }}>Unlimited</span>
          ) : (
            <>
              <span style={{ color: valueColor }}>{used.toLocaleString()}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}> / {limit.toLocaleString()}</span>
            </>
          )}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {isUnlimited ? (
          <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#dc2626,#f97316)', borderRadius: 3, opacity: 0.35 }} />
        ) : (
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: barGradient,
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }}
          />
        )}
      </div>
      {!isUnlimited && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
          {pct}% used
        </div>
      )}
    </div>
  );
}

interface PlanCardProps {
  planId: Plan;
  currentPlan: Plan;
  onUpgrade: (plan: Plan) => void;
  upgrading: Plan | null;
}

function PlanCard({ planId, currentPlan, onUpgrade, upgrading }: PlanCardProps) {
  const meta = PLAN_META[planId];
  const isCurrent = planId === currentPlan;
  const isEnterprise = planId === 'enterprise';
  const canUpgrade = !isCurrent && planId !== 'trial';
  const isUpgrading = upgrading === planId;
  const anyUpgrading = upgrading !== null;

  return (
    <div
      style={{
        flex: '1 1 160px',
        minWidth: 150,
        background: meta.highlight
          ? 'linear-gradient(135deg,rgba(220,38,38,0.10),rgba(249,115,22,0.06))'
          : 'rgba(255,255,255,0.03)',
        border: isCurrent
          ? '1.5px solid rgba(220,38,38,0.55)'
          : meta.highlight
          ? '1.5px solid rgba(249,115,22,0.28)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '20px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}
    >
      {/* Badge */}
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            right: 12,
            background: 'linear-gradient(90deg,#dc2626,#f97316)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.09em',
            padding: '2px 8px',
            borderRadius: '0 0 6px 6px',
            textTransform: 'uppercase',
          }}
        >
          Current
        </div>
      )}
      {meta.highlight && !isCurrent && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            right: 12,
            background: 'rgba(249,115,22,0.15)',
            color: '#f97316',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.09em',
            padding: '2px 8px',
            borderRadius: '0 0 6px 6px',
            textTransform: 'uppercase',
            border: '1px solid rgba(249,115,22,0.28)',
            borderTop: 'none',
          }}
        >
          Popular
        </div>
      )}

      {/* Name + Price */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? 'rgba(255,255,255,0.5)' : '#fff', marginBottom: 2 }}>
          {meta.label}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            background: 'linear-gradient(90deg,#dc2626,#f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}
        >
          {meta.price}
        </div>
      </div>

      {/* Limits list */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.9, flexGrow: 1 }}>
        {(Object.keys(LIMIT_LABELS) as Array<keyof PlanLimits>).map(k => (
          <div key={k}>
            <span style={{ color: meta.limits[k] === -1 ? '#f97316' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {formatLimit(meta.limits[k])}
            </span>{' '}
            {LIMIT_LABELS[k]}
          </div>
        ))}
      </div>

      {/* Action */}
      {isCurrent ? (
        <div
          style={{
            padding: '8px 0',
            borderRadius: 7,
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            color: 'rgba(220,38,38,0.7)',
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Active
        </div>
      ) : canUpgrade ? (
        <button
          onClick={() => !isUpgrading && !anyUpgrading && onUpgrade(planId)}
          disabled={anyUpgrading}
          style={{
            padding: '9px 0',
            borderRadius: 7,
            border: 'none',
            background: meta.highlight
              ? 'linear-gradient(135deg,#dc2626,#f97316)'
              : 'rgba(255,255,255,0.07)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: anyUpgrading ? 'not-allowed' : 'pointer',
            opacity: anyUpgrading && !isUpgrading ? 0.45 : 1,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isUpgrading ? (
            'Upgrading...'
          ) : isEnterprise ? (
            'Contact Sales'
          ) : (
            <>
              <IconArrowUp />
              Upgrade
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BillingPanel() {
  const [billing, setBilling] = useState<BillingPlan | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<Plan | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const fetchBilling = () => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/billing/plan`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) setBilling(res.data);
        else setError(res.error || 'Failed to load billing information');
      })
      .catch(() => setError('Network error — could not reach the billing API'))
      .finally(() => setLoading(false));
  };

  const fetchUsage = () => {
    setUsageLoading(true);
    fetch(`${API_BASE}/api/billing/usage`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => { if (res.success) setUsage(res.data); })
      .catch(() => {})
      .finally(() => setUsageLoading(false));
  };

  useEffect(() => {
    fetchBilling();
    fetchUsage();
  }, []);

  const handleUpgrade = (plan: Plan) => {
    if (!billing || plan === billing.plan) return;
    setUpgrading(plan);
    setUpgradeError(null);
    setUpgradeSuccess(null);

    fetch(`${API_BASE}/api/billing/upgrade`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ plan }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setUpgradeSuccess(`Successfully upgraded to ${PLAN_META[plan].label}`);
          fetchBilling();
          fetchUsage();
          setTimeout(() => setUpgradeSuccess(null), 5000);
        } else {
          setUpgradeError(res.error || 'Upgrade failed');
        }
      })
      .catch(() => setUpgradeError('Network error during upgrade'))
      .finally(() => setUpgrading(null));
  };

  // ── Shared styles ────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,10,0.97)',
    borderRadius: 16,
    padding: '28px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minHeight: 520,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#fff',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '20px 22px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    marginBottom: 10,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const planName = billing?.plan ?? 'trial';

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg,#dc2626,#f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <IconBilling />
          </div>
          <span
            style={{
              background: 'linear-gradient(90deg,#dc2626,#f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            Billing &amp; Plan
          </span>
        </div>
        <button
          style={{
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
          }}
          onClick={() => { fetchBilling(); fetchUsage(); }}
        >
          <IconRefresh />
          Refresh
        </button>
      </div>

      {/* Banners */}
      {upgradeSuccess && (
        <div
          style={{
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.28)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IconCheck />
          {upgradeSuccess}. Your new limits are active immediately.
        </div>
      )}

      {upgradeError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.09)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {upgradeError}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.09)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* ── 1. Current Plan Card ─────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Current Plan</div>
        <div style={cardStyle}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              Loading billing information...
            </div>
          ) : billing ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Active Plan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        background: 'linear-gradient(90deg,#dc2626,#f97316)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1,
                      }}
                    >
                      {PLAN_META[planName]?.label ?? planName}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background:
                          billing.status === 'active' || billing.status === 'ACTIVE'
                            ? 'rgba(34,197,94,0.10)'
                            : 'rgba(234,179,8,0.10)',
                        color:
                          billing.status === 'active' || billing.status === 'ACTIVE'
                            ? '#22c55e'
                            : '#eab308',
                        border: `1px solid ${
                          billing.status === 'active' || billing.status === 'ACTIVE'
                            ? 'rgba(34,197,94,0.25)'
                            : 'rgba(234,179,8,0.25)'
                        }`,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'capitalize',
                      }}
                    >
                      {billing.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>
                    {billing.tenantName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
                    {PLAN_META[planName]?.price}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {PLAN_META[planName]?.description}
                  </div>
                </div>
              </div>

              {/* Plan limits grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {(Object.keys(LIMIT_LABELS) as Array<keyof PlanLimits>).map(key => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: billing.limits[key] === -1 ? '#f97316' : '#fff',
                      }}
                    >
                      {formatLimit(billing.limits[key])}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.32)',
                        marginTop: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {LIMIT_LABELS[key]}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ── 2. Usage Indicators ──────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Current Usage</div>
        <div style={cardStyle}>
          {usageLoading ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Loading usage data...</div>
          ) : !usage ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Usage data unavailable.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(Object.keys(LIMIT_LABELS) as Array<keyof PlanLimits>).map(key => (
                <UsageBar
                  key={key}
                  label={LIMIT_LABELS[key]}
                  used={(usage.usage as any)[key]?.used ?? 0}
                  limit={(usage.usage as any)[key]?.limit ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Plan Comparison ───────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}>Available Plans</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {PLAN_ORDER.map(p => (
            <PlanCard
              key={p}
              planId={p}
              currentPlan={billing?.plan ?? 'trial'}
              onUpgrade={handleUpgrade}
              upgrading={upgrading}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>
        <IconShield />
        Billing managed by Memelli OS &mdash; Stripe integration coming soon.
      </div>
    </div>
  );
}
