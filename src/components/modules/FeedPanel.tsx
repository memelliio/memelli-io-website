'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

/* =========================================================================
   Types
   ========================================================================= */

type Tab = 'news' | 'crypto' | 'weather' | 'finance' | 'games';

// News
interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  score?: number;
  summary?: string;
  category?: string;
}

// Crypto
interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  image?: string;
}

interface CryptoTrending {
  id: string;
  name: string;
  symbol: string;
  thumb?: string;
  market_cap_rank?: number;
}

// Weather
interface WeatherData {
  city: string;
  temperature: number;
  feelsLike?: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

// Finance
interface ExchangeRate {
  pair: string;
  rate: number;
  base?: string;
  target?: string;
  change?: number;
}

// Games
interface Game {
  id: string;
  title: string;
  description?: string;
  category: string;
  embedUrl?: string;
  url?: string;
  thumbnail?: string;
  tags?: string[];
  featured?: boolean;
}

/* =========================================================================
   Helpers
   ========================================================================= */

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  } catch {
    return '';
  }
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
}

function fmtRate(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

/* =========================================================================
   Base UI primitives
   ========================================================================= */

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '12px 14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color = '#71717a' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
        borderRadius: 4,
        fontSize: 10,
        fontFamily: 'monospace',
        padding: '1px 6px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTopColor: '#dc2626',
          animation: 'feed-spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
      {message}
    </p>
  );
}

/* =========================================================================
   Tab bar
   ========================================================================= */

const TABS: { id: Tab; label: string }[] = [
  { id: 'news',    label: 'News' },
  { id: 'crypto',  label: 'Crypto' },
  { id: 'weather', label: 'Weather' },
  { id: 'finance', label: 'Finance' },
  { id: 'games',   label: 'Games' },
];

function TabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 16,
        paddingBottom: 0,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              borderBottom: isActive
                ? '2px solid transparent'
                : '2px solid transparent',
              backgroundImage: isActive
                ? 'linear-gradient(90deg,#dc2626,#f97316)'
                : 'none',
              backgroundClip: isActive ? 'text' : undefined,
              WebkitBackgroundClip: isActive ? 'text' : undefined,
              WebkitTextFillColor: isActive ? 'transparent' : undefined,
              position: 'relative',
              transition: 'color 0.15s',
              letterSpacing: '0.03em',
            }}
          >
            {t.label}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  background: 'linear-gradient(90deg,#dc2626,#f97316)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   News tab
   ========================================================================= */

function NewsTab() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API}/api/feeds/news`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setItems(j.data);
        else setError('Could not load news.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Empty message={error} />;
  if (!items.length) return <Empty message="No news items found." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <Card key={i}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                margin: '0 0 8px 0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f97316')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)')}
            >
              {item.title}
            </p>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge color="#dc2626">{item.source}</Badge>
            {item.category && <Badge color="#6b7280">{item.category}</Badge>}
            {item.score != null && (
              <Badge color="#f97316">{item.score} pts</Badge>
            )}
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginLeft: 'auto' }}>
              {relativeTime(item.publishedAt)}
            </span>
          </div>
          {item.summary && (
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: '8px 0 0 0', lineHeight: 1.5 }}>
              {item.summary}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

/* =========================================================================
   Crypto tab
   ========================================================================= */

function CryptoTab() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [trending, setTrending] = useState<CryptoTrending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API}/api/feeds/crypto`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          if (Array.isArray(j.data.prices)) setPrices(j.data.prices);
          if (Array.isArray(j.data.trending)) setTrending(j.data.trending);
        } else {
          setError('Could not load crypto data.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Empty message={error} />;
  if (!prices.length && !trending.length) return <Empty message="No crypto data." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {prices.length > 0 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Live Prices
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {prices.map((coin) => {
              const up = coin.price_change_percentage_24h >= 0;
              const changeColor = up ? '#22c55e' : '#ef4444';
              return (
                <Card key={coin.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>
                        {coin.symbol?.toUpperCase()}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '2px 0 0 0' }}>
                        {coin.name}
                      </p>
                    </div>
                    <span
                      style={{
                        color: changeColor,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        background: changeColor + '18',
                        border: `1px solid ${changeColor}33`,
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      {up ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                    </span>
                  </div>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 15,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      margin: 0,
                    }}
                  >
                    ${fmtPrice(coin.current_price)}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Trending
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {trending.slice(0, 5).map((coin, i) => (
              <Card key={coin.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'monospace', width: 18, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{coin.symbol}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 6 }}>{coin.name}</span>
                </div>
                {coin.market_cap_rank != null && (
                  <Badge color="#8b5cf6">Rank #{coin.market_cap_rank}</Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Weather tab
   ========================================================================= */

function WeatherTab() {
  const [city, setCity] = useState('Riverside');
  const [inputVal, setInputVal] = useState('Riverside');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((c: string) => {
    setLoading(true);
    setError('');
    fetch(`${API}/api/feeds/weather?city=${encodeURIComponent(c)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setWeather(j.data);
        else setError('Could not load weather data.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(city); }, [city, load]);

  const handleSearch = () => {
    const trimmed = inputVal.trim();
    if (trimmed) setCity(trimmed);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* City search */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter city..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '7px 12px',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            background: 'linear-gradient(90deg,#dc2626,#f97316)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 16px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Search
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && error && <Empty message={error} />}
      {!loading && !error && weather && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Main card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>
                  {weather.city}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                  {weather.condition}
                </p>
                {weather.description && weather.description !== weather.condition && (
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '4px 0 0 0' }}>
                    {weather.description}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    margin: 0,
                    background: 'linear-gradient(90deg,#dc2626,#f97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'monospace',
                    lineHeight: 1,
                  }}
                >
                  {Math.round(weather.temperature)}°
                </p>
                {weather.feelsLike != null && (
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '4px 0 0 0' }}>
                    Feels {Math.round(weather.feelsLike)}°
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Detail row */}
          {(weather.humidity != null || weather.windSpeed != null) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {weather.humidity != null && (
                <Card>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0' }}>Humidity</p>
                  <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', margin: 0 }}>{weather.humidity}%</p>
                </Card>
              )}
              {weather.windSpeed != null && (
                <Card>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0' }}>Wind</p>
                  <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', margin: 0 }}>{weather.windSpeed} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>km/h</span></p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Finance tab
   ========================================================================= */

function FinanceTab() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API}/api/feeds/finance/rates`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setRates(j.data);
        else setError('Could not load exchange rates.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Empty message={error} />;
  if (!rates.length) return <Empty message="No exchange rate data." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
        Exchange Rates
      </p>
      {rates.map((r, i) => {
        const label = r.pair ?? (r.base && r.target ? `${r.base}/${r.target}` : `Rate ${i + 1}`);
        const hasChange = r.change != null;
        const up = hasChange && (r.change ?? 0) >= 0;
        return (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge color="#f97316">{label}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                {fmtRate(r.rate)}
              </span>
              {hasChange && (
                <span
                  style={{
                    color: up ? '#22c55e' : '#ef4444',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    background: (up ? '#22c55e' : '#ef4444') + '18',
                    border: `1px solid ${up ? '#22c55e' : '#ef4444'}33`,
                    borderRadius: 4,
                    padding: '1px 6px',
                  }}
                >
                  {up ? '+' : ''}{r.change?.toFixed(4)}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* =========================================================================
   Games tab
   ========================================================================= */

function GamesTab() {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [embedGame, setEmbedGame] = useState<Game | null>(null);

  // Load games (with optional category filter)
  const loadGames = useCallback((cat: string) => {
    setLoading(true);
    setError('');
    const url =
      cat === 'all'
        ? `${API}/api/feeds/games`
        : `${API}/api/feeds/games?category=${encodeURIComponent(cat)}`;

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          if (Array.isArray(j.data)) setGames(j.data);
          if (Array.isArray(j.categories) && categories.length === 0) {
            setCategories(['all', ...j.categories]);
          }
        } else {
          setError('Could not load games.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [categories.length]);

  useEffect(() => { loadGames(activeCategory); }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Embed overlay
  if (embedGame) {
    const embedUrl = embedGame.embedUrl ?? embedGame.url;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setEmbedGame(null)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 12,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{embedGame.title}</span>
        </div>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={embedGame.title}
            style={{
              width: '100%',
              height: 420,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              background: '#000',
            }}
            allowFullScreen
          />
        ) : (
          <Empty message="No embed URL available for this game." />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Category filter strip */}
      {categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat
                  ? 'linear-gradient(90deg,#dc2626,#f97316)'
                  : 'rgba(255,255,255,0.05)',
                border: activeCategory === cat
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: activeCategory === cat ? 700 : 400,
                padding: '4px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                letterSpacing: '0.03em',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && <Spinner />}
      {!loading && error && <Empty message={error} />}
      {!loading && !error && games.length === 0 && <Empty message="No games found." />}
      {!loading && !error && games.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {games.map((game) => (
            <Card
              key={game.id}
              style={{
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {game.featured && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'linear-gradient(90deg,#dc2626,#f97316)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 3,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Featured
                </span>
              )}
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0', paddingRight: game.featured ? 60 : 0 }}>
                {game.title}
              </p>
              {game.category && (
                <Badge color="#8b5cf6">{game.category}</Badge>
              )}
              {game.description && (
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: '8px 0 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {game.description}
                </p>
              )}
              {(game.embedUrl || game.url) && (
                <button
                  onClick={() => setEmbedGame(game)}
                  style={{
                    marginTop: 10,
                    background: 'linear-gradient(90deg,#dc2626,#f97316)',
                    border: 'none',
                    borderRadius: 5,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    width: '100%',
                  }}
                >
                  Play
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   FeedPanel — main export
   ========================================================================= */

export function FeedPanel() {
  const [tab, setTab] = useState<Tab>('news');

  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
        minHeight: 400,
        maxHeight: 640,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Keyframe injection */}
      <style>{`
        @keyframes feed-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 14px 0',
            background: 'linear-gradient(90deg,#dc2626,#f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'monospace',
          }}
        >
          Live Feeds
        </h2>
        <TabBar active={tab} onSelect={setTab} />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === 'news'    && <NewsTab />}
        {tab === 'crypto'  && <CryptoTab />}
        {tab === 'weather' && <WeatherTab />}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'games'   && <GamesTab />}
      </div>
    </div>
  );
}

export default FeedPanel;
