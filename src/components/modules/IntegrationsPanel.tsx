'use client';

import { useEffect, useState, useCallback } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function authHeader(): Record<string, string> {
  const token =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('memelli_live_token') || localStorage.getItem('memelli_token'))) ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================================================================
   Types — real API response shapes
   ========================================================================= */

type IntegrationStatus = 'active' | 'configured' | 'unconfigured' | 'error';
type IntegrationCategory =
  | 'payment'
  | 'crm'
  | 'sms'
  | 'ai'
  | 'news'
  | 'crypto'
  | 'finance'
  | 'communication'
  | 'calendar'
  | 'developer'
  | 'business'
  | string;

interface Integration {
  slug: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  authType?: string;
  freeLimit?: string;
  envVar?: string;
}

interface IntegrationSummary {
  total: number;
  configured: number;
  unconfigured: number;
}

interface NewsItem {
  title: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  summary?: string;
}

interface CryptoItem {
  id?: string;
  symbol: string;
  name: string;
  current_price?: number;
  price?: number;
  price_change_percentage_24h?: number;
  change24h?: number;
  market_cap?: number;
}

interface FinanceItem {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  name?: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

type LiveTab = 'news' | 'crypto' | 'finance';

/* =========================================================================
   Helpers
   ========================================================================= */

function categoryColor(cat: IntegrationCategory): string {
  const map: Record<string, string> = {
    payment: '#f97316',
    crm: '#dc2626',
    sms: '#7c3aed',
    ai: '#2563eb',
    news: '#0891b2',
    crypto: '#d97706',
    finance: '#16a34a',
    communication: '#be185d',
    calendar: '#0d9488',
    developer: '#4f46e5',
    business: '#9333ea',
  };
  return map[cat] ?? '#6b7280';
}

function statusLabel(status: IntegrationStatus): { text: string; color: string } {
  if (status === 'active' || status === 'configured') {
    return { text: 'Configured', color: '#16a34a' };
  }
  if (status === 'error') {
    return { text: 'Error', color: '#dc2626' };
  }
  return { text: 'Not configured', color: '#6b7280' };
}

function fmt(n: number | undefined, prefix = ''): string {
  if (n === undefined || n === null) return '—';
  if (Math.abs(n) >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${prefix}${(n / 1_000).toFixed(2)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

/* =========================================================================
   Sub-components
   ========================================================================= */

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: '0 0 14px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
      }}
    >
      {children}
    </h3>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: '#dc2626',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

/* =========================================================================
   Integration card
   ========================================================================= */

function IntegrationCard({ integration }: { integration: Integration }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/integrations/${integration.slug}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const json = await res.json();
      setTestResult({ ok: json.success, message: json.message ?? (json.success ? 'Connection OK' : 'Failed') });
    } catch {
      setTestResult({ ok: false, message: 'Request failed' });
    } finally {
      setTesting(false);
    }
  }, [integration.slug]);

  const sl = statusLabel(integration.status);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.16)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 5,
            }}
          >
            {integration.name}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill text={integration.category} color={categoryColor(integration.category)} />
            <Pill text={sl.text} color={sl.color} />
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(220,38,38,0.4)',
            background: 'rgba(220,38,38,0.1)',
            color: '#f87171',
            cursor: testing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s',
            opacity: testing ? 0.7 : 1,
          }}
        >
          {testing ? <Spinner /> : 'Test'}
        </button>
      </div>

      {testResult && (
        <div
          style={{
            fontSize: 11,
            color: testResult.ok ? '#4ade80' : '#f87171',
            background: testResult.ok ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
            border: `1px solid ${testResult.ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: 6,
            padding: '5px 10px',
          }}
        >
          {testResult.message}
        </div>
      )}

      {integration.freeLimit && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{integration.freeLimit}</div>
      )}
    </div>
  );
}

/* =========================================================================
   Live feeds
   ========================================================================= */

function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/integrations/news?limit=12`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        const articles: NewsItem[] = json.articles ?? json.items ?? json.news ?? [];
        setItems(articles.slice(0, 12));
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>;
  if (error) return <div style={{ color: '#f87171', fontSize: 12, padding: 8 }}>{error}</div>;
  if (!items.length) return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>No news available</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 4, lineHeight: 1.4 }}>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {item.source && <span>{item.source}</span>}
            {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CryptoFeed() {
  const [coins, setCoins] = useState<CryptoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/integrations/crypto`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        const list: CryptoItem[] = json.prices ?? json.coins ?? json.data ?? [];
        setCoins(list.slice(0, 20));
      })
      .catch(() => setError('Failed to load crypto prices'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>;
  if (error) return <div style={{ color: '#f87171', fontSize: 12, padding: 8 }}>{error}</div>;
  if (!coins.length) return <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>No crypto data available</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 90px',
          gap: 8,
          padding: '6px 12px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        <span>Asset</span>
        <span style={{ textAlign: 'right' }}>Price</span>
        <span style={{ textAlign: 'right' }}>24h</span>
      </div>
      {coins.map((coin, i) => {
        const price = coin.current_price ?? coin.price;
        const change = coin.price_change_percentage_24h ?? coin.change24h;
        const isUp = (change ?? 0) >= 0;
        return (
          <div
            key={coin.id ?? coin.symbol ?? i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 90px',
              gap: 8,
              padding: '8px 12px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
              borderRadius: 6,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{coin.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{coin.symbol}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
              {price !== undefined ? `$${price >= 1 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(6)}` : '—'}
            </div>
            <div
              style={{
                textAlign: 'right',
                fontSize: 11,
                fontWeight: 600,
                color: isUp ? '#4ade80' : '#f87171',
              }}
            >
              {change !== undefined ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FinanceFeed() {
  const [stocks, setStocks] = useState<FinanceItem[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/integrations/finance`, { headers: authHeader() })
      .then(r => r.json())
      .then(json => {
        const stockList: FinanceItem[] = json.stocks ?? json.quotes ?? json.data ?? [];
        setStocks(stockList.slice(0, 10));
        const rateMap: Record<string, number> = json.rates ?? json.exchangeRates ?? {};
        const rateList: ExchangeRate[] = Object.entries(rateMap)
          .slice(0, 8)
          .map(([currency, rate]) => ({ currency, rate: Number(rate) }));
        setRates(rateList);
      })
      .catch(() => setError('Failed to load market data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>;
  if (error) return <div style={{ color: '#f87171', fontSize: 12, padding: 8 }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stocks */}
      {stocks.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
            Equities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {stocks.map((s, i) => {
              const isUp = (s.changePercent ?? s.change ?? 0) >= 0;
              return (
                <div
                  key={s.symbol}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 90px 90px',
                    gap: 8,
                    padding: '7px 12px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{s.symbol}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name ?? ''}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                    {s.price !== undefined ? `$${s.price.toFixed(2)}` : '—'}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: isUp ? '#4ade80' : '#f87171' }}>
                    {s.changePercent !== undefined
                      ? `${isUp ? '+' : ''}${s.changePercent.toFixed(2)}%`
                      : s.change !== undefined
                      ? `${isUp ? '+' : ''}${s.change.toFixed(2)}`
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exchange rates */}
      {rates.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
            Exchange rates (USD base)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {rates.map(r => (
              <div
                key={r.currency}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{r.currency}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.rate.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stocks.length === 0 && rates.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>No market data available</div>
      )}
    </div>
  );
}

/* =========================================================================
   Main component
   ========================================================================= */

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [liveTab, setLiveTab] = useState<LiveTab>('news');

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/integrations`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setIntegrations(json.integrations ?? []);
      setSummary(json.summary ?? null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category))).sort()];
  const filtered = categoryFilter === 'all' ? integrations : integrations.filter(i => i.category === categoryFilter);

  const configuredCount = summary?.configured ?? integrations.filter(i => i.status === 'active' || i.status === 'configured').length;
  const totalCount = summary?.total ?? integrations.length;

  const LIVE_TABS: { key: LiveTab; label: string }[] = [
    { key: 'news', label: 'News' },
    { key: 'crypto', label: 'Crypto' },
    { key: 'finance', label: 'Markets' },
  ];

  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        minHeight: '100%',
        padding: '24px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: 'rgba(255,255,255,0.85)',
        boxSizing: 'border-box',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #dc2626, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Integrations
          </h2>
          <button
            onClick={loadIntegrations}
            disabled={loading}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Connected services, live data feeds, and market intelligence
        </p>
      </div>

      {/* Summary stat bar */}
      {(summary || integrations.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Total', value: totalCount },
            { label: 'Configured', value: configuredCount, color: '#4ade80' },
            { label: 'Not configured', value: totalCount - configuredCount, color: '#f87171' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color ?? 'rgba(255,255,255,0.85)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrations grid */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle>All integrations</SectionTitle>

        {/* Category filter */}
        {!loading && !error && categories.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'capitalize',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${categoryFilter === cat ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: categoryFilter === cat ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.03)',
                  color: categoryFilter === cat ? '#f87171' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner />
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 12,
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8 }}>
            No integrations found
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map(integration => (
              <IntegrationCard key={integration.slug} integration={integration} />
            ))}
          </div>
        )}
      </div>

      {/* Live feeds */}
      <div>
        <SectionTitle>Live feeds</SectionTitle>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: 4,
            width: 'fit-content',
          }}
        >
          {LIVE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setLiveTab(t.key)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: liveTab === t.key
                  ? 'linear-gradient(90deg, rgba(220,38,38,0.35), rgba(249,115,22,0.35))'
                  : 'transparent',
                color: liveTab === t.key ? '#f97316' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: 16,
          }}
        >
          {liveTab === 'news' && <NewsFeed />}
          {liveTab === 'crypto' && <CryptoFeed />}
          {liveTab === 'finance' && <FinanceFeed />}
        </div>
      </div>
    </div>
  );
}
