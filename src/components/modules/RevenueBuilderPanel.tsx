'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Config ──────────────────────────────────────────────────────────────── */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface BuildAsset {
  type: string;
  status: 'pending' | 'building' | 'done' | 'error';
  content?: string;
  metadata?: Record<string, unknown>;
}

interface BuildResult {
  buildId: string;
  siteUrl: string;
  assets: Record<string, BuildAsset>;
  createdAt: string;
  // client-side enrichment
  revenue?: number;
  conversions?: number;
}

interface CreateForm {
  brandName: string;
  productName: string;
  tagline: string;
  productType: string;
  price: string;
  currency: string;
  billingType: 'once' | 'monthly' | 'yearly';
  targetAudience: string;
  topResult: string;
  differentiator: string;
  notFor: string;
  brandColor: string;
  fontStyle: string;
  tone: string;
  stripePublishableKey: string;
  testMode: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_dev_token')
  );
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function assetCount(assets: Record<string, BuildAsset>, status: string): number {
  return Object.values(assets).filter((a) => a.status === status).length;
}

const PRODUCT_TYPES = [
  'coaching',
  'course',
  'ebook',
  'template',
  'membership',
  'software',
  'consulting',
  'community',
];

const FONT_STYLES = ['modern', 'serif', 'minimal', 'bold', 'elegant'];
const TONES = ['professional', 'friendly', 'bold', 'inspiring', 'authoritative'];

const EMPTY_FORM: CreateForm = {
  brandName: '',
  productName: '',
  tagline: '',
  productType: 'course',
  price: '',
  currency: 'USD',
  billingType: 'once',
  targetAudience: '',
  topResult: '',
  differentiator: '',
  notFor: '',
  brandColor: '#f97316',
  fontStyle: 'modern',
  tone: 'professional',
  stripePublishableKey: '',
  testMode: true,
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
      {label}
    </p>
  );
}

function StatCard({
  label,
  value,
  accent = '#f97316',
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}

function AssetBadge({ status }: { status: BuildAsset['status'] }) {
  const map: Record<string, { label: string; color: string }> = {
    done: { label: 'done', color: '#22c55e' },
    building: { label: 'building', color: '#f97316' },
    pending: { label: 'pending', color: '#71717a' },
    error: { label: 'error', color: '#ef4444' },
  };
  const { label, color } = map[status] ?? { label: status, color: '#71717a' };
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{ color, background: `${color}18` }}
    >
      {label}
    </span>
  );
}

function BuildCard({
  build,
  onView,
  onShare,
}: {
  build: BuildResult;
  onView: (b: BuildResult) => void;
  onShare: (url: string) => void;
}) {
  const total = Object.keys(build.assets).length;
  const done = assetCount(build.assets, 'done');
  const errored = assetCount(build.assets, 'error');
  const isComplete = done === total;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-white truncate">
            {build.siteUrl.replace('https://', '')}
          </span>
          <span className="text-[11px] text-zinc-500">{fmtDate(build.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isComplete ? (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: '#22c55e', background: '#22c55e18' }}
            >
              live
            </span>
          ) : errored > 0 ? (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: '#ef4444', background: '#ef444418' }}
            >
              partial
            </span>
          ) : (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: '#f97316', background: '#f9731618' }}
            >
              building
            </span>
          )}
        </div>
      </div>

      {/* Asset progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>assets</span>
          <span>
            {done}/{total}
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${total ? (done / total) * 100 : 0}%`,
              background: '#f97316',
            }}
          />
        </div>
      </div>

      {/* Revenue / conversions (mock until real Stripe webhooks) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Revenue</span>
          <span className="text-sm font-bold" style={{ color: '#f97316' }}>
            {fmtCurrency(build.revenue ?? 0)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Conversions</span>
          <span className="text-sm font-bold text-white">{build.conversions ?? 0}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 pt-1">
        <a
          href={build.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-[11px] font-mono py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a1a1aa',
          }}
        >
          view
        </a>
        <button
          onClick={() => onView(build)}
          className="flex-1 text-center text-[11px] font-mono py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.2)',
            color: '#f97316',
          }}
        >
          edit
        </button>
        <button
          onClick={() => onShare(build.siteUrl)}
          className="flex-1 text-center text-[11px] font-mono py-1.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a1a1aa',
          }}
        >
          share
        </button>
      </div>
    </div>
  );
}

function BuildDetailModal({
  build,
  onClose,
}: {
  build: BuildResult;
  onClose: () => void;
}) {
  const assetKeys = Object.keys(build.assets);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: '#0f0f0f',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{build.siteUrl}</p>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              {build.buildId} · {fmtDate(build.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-sm font-mono transition-colors"
          >
            close
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader label="Generated Assets" />
          {assetKeys.map((key) => {
            const asset = build.assets[key];
            return (
              <div
                key={key}
                className="rounded-xl p-3 flex flex-col gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-300">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <AssetBadge status={asset.status} />
                </div>
                {asset.status === 'done' && asset.metadata && (
                  <p className="text-[10px] text-zinc-600 font-mono truncate">
                    {JSON.stringify(asset.metadata).slice(0, 120)}...
                  </p>
                )}
                {asset.status === 'error' && (
                  <p className="text-[10px] text-red-500 font-mono">
                    {String((asset.metadata as any)?.error ?? 'Unknown error')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Create Form ─────────────────────────────────────────────────────────── */

function CreateSiteForm({
  onSuccess,
}: {
  onSuccess: (build: BuildResult) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brandName.trim() || !form.productName.trim() || !form.price) {
      setError('Brand name, product name, and price are required.');
      return;
    }
    setError(null);
    setLoading(true);
    const payload = {
      brandName: form.brandName,
      productTypes: [form.productType],
      productName: form.productName,
      tagline: form.tagline,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      billingType: form.billingType,
      targetAudience: form.targetAudience,
      benefits: {
        topResult: form.topResult,
        differentiator: form.differentiator,
        notFor: form.notFor,
      },
      brandColor: form.brandColor,
      fontStyle: form.fontStyle,
      tone: form.tone,
      stripePublishableKey: form.stripePublishableKey || undefined,
      testMode: form.testMode,
    };
    const res = await apiFetch<{ data: BuildResult }>(
      '/api/revenue-builder/generate',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    setLoading(false);
    if (res?.data) {
      onSuccess(res.data);
      setForm(EMPTY_FORM);
    } else {
      setError('Build failed. Check your connection and try again.');
    }
  }

  const inputCls =
    'w-full bg-transparent text-sm text-white placeholder-zinc-600 outline-none py-2 px-3 rounded-lg transition-colors focus:ring-1';
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
  };
  const labelCls = 'text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Core info */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Brand & Product" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Brand Name *</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. LaunchFast"
              value={form.brandName}
              onChange={(e) => set('brandName', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Product Name *</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Creator Accelerator"
              value={form.productName}
              onChange={(e) => set('productName', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Go from 0 to $10K in 90 days"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Product Type</label>
            <select
              className={inputCls}
              style={inputStyle}
              value={form.productType}
              onChange={(e) => set('productType', e.target.value)}
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: '#111' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Target Audience</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Aspiring freelancers"
              value={form.targetAudience}
              onChange={(e) => set('targetAudience', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Pricing" />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Price *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              style={inputStyle}
              placeholder="497"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select
              className={inputCls}
              style={inputStyle}
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
                <option key={c} value={c} style={{ background: '#111' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className={labelCls}>Billing Type</label>
            <div className="flex gap-2">
              {(['once', 'monthly', 'yearly'] as const).map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => set('billingType', bt)}
                  className="flex-1 text-[11px] font-mono py-1.5 rounded-lg transition-colors"
                  style={{
                    background:
                      form.billingType === bt
                        ? 'rgba(249,115,22,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border:
                      form.billingType === bt
                        ? '1px solid rgba(249,115,22,0.35)'
                        : '1px solid rgba(255,255,255,0.07)',
                    color: form.billingType === bt ? '#f97316' : '#71717a',
                  }}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Value Proposition" />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Top Result</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Land your first $5K client in 30 days"
              value={form.topResult}
              onChange={(e) => set('topResult', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Differentiator</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. No cold calling — all inbound"
              value={form.differentiator}
              onChange={(e) => set('differentiator', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Not For</label>
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. People who want overnight riches"
              value={form.notFor}
              onChange={(e) => set('notFor', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Brand style */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Brand Style" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                value={form.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
              />
              <span className="text-[11px] font-mono text-zinc-500">{form.brandColor}</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Font Style</label>
            <select
              className={inputCls}
              style={inputStyle}
              value={form.fontStyle}
              onChange={(e) => set('fontStyle', e.target.value)}
            >
              {FONT_STYLES.map((f) => (
                <option key={f} value={f} style={{ background: '#111' }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select
              className={inputCls}
              style={inputStyle}
              value={form.tone}
              onChange={(e) => set('tone', e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t} value={t} style={{ background: '#111' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stripe connect */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Stripe Integration" />
        <div>
          <label className={labelCls}>Stripe Publishable Key</label>
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="pk_live_... or pk_test_..."
            value={form.stripePublishableKey}
            onChange={(e) => set('stripePublishableKey', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('testMode', !form.testMode)}
            className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
            style={{
              background: form.testMode
                ? 'rgba(249,115,22,0.5)'
                : 'rgba(255,255,255,0.1)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: form.testMode ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
          <span className="text-[12px] text-zinc-400">
            Test mode{' '}
            <span className="text-zinc-600">(use pk_test_ key)</span>
          </span>
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-400 font-mono">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: loading
            ? 'rgba(249,115,22,0.3)'
            : 'rgba(249,115,22,0.9)',
          color: '#fff',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Building site — this takes ~30s...' : 'Generate Digital Product Site'}
      </button>

      <p className="text-[10px] font-mono text-zinc-600 text-center">
        Generates: homepage copy, SEO, offer page, email sequence, ad copy, brand guide, phone scripts, and brochure — all in parallel via AI.
      </p>
    </form>
  );
}

/* ─── Main Panel ──────────────────────────────────────────────────────────── */

export function RevenueBuilderPanel() {
  const [builds, setBuilds] = useState<BuildResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [selectedBuild, setSelectedBuild] = useState<BuildResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<{ data: BuildResult[]; total: number }>(
      '/api/revenue-builder/builds'
    );
    setLoading(false);
    if (res?.data) {
      setBuilds(res.data);
    }
  }, []);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  function handleBuildSuccess(build: BuildResult) {
    setBuilds((prev) => [build, ...prev]);
    setActiveView('list');
  }

  function handleShare(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  }

  /* Derived stats */
  const totalRevenue = builds.reduce((s, b) => s + (b.revenue ?? 0), 0);
  const activeSites = builds.filter((b) => {
    const total = Object.keys(b.assets).length;
    const done = assetCount(b.assets, 'done');
    return done === total && total > 0;
  }).length;
  const totalConversions = builds.reduce((s, b) => s + (b.conversions ?? 0), 0);

  return (
    <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-white">Revenue Builder</h2>
          <p className="text-[11px] text-zinc-500 font-mono">
            Digital product sites · Stripe · AI-generated assets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('list')}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background:
                activeView === 'list'
                  ? 'rgba(249,115,22,0.15)'
                  : 'rgba(255,255,255,0.04)',
              border:
                activeView === 'list'
                  ? '1px solid rgba(249,115,22,0.3)'
                  : '1px solid rgba(255,255,255,0.07)',
              color: activeView === 'list' ? '#f97316' : '#71717a',
            }}
          >
            my sites
          </button>
          <button
            onClick={() => setActiveView('create')}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background:
                activeView === 'create'
                  ? 'rgba(249,115,22,0.15)'
                  : 'rgba(255,255,255,0.04)',
              border:
                activeView === 'create'
                  ? '1px solid rgba(249,115,22,0.3)'
                  : '1px solid rgba(255,255,255,0.07)',
              color: activeView === 'create' ? '#f97316' : '#71717a',
            }}
          >
            + new site
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div>
        <SectionHeader label="Overview" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} />
          <StatCard label="Active Sites" value={activeSites} />
          <StatCard label="Conversions" value={totalConversions} />
        </div>
      </div>

      {/* Copied toast */}
      {copiedUrl && (
        <div
          className="text-[11px] font-mono text-center py-2 rounded-lg"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e',
          }}
        >
          Link copied to clipboard
        </div>
      )}

      {/* Content */}
      {activeView === 'list' ? (
        <div className="flex flex-col gap-4">
          <SectionHeader label={`Your Sites (${builds.length})`} />
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl h-36 animate-pulse"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                />
              ))}
            </div>
          ) : builds.length === 0 ? (
            <div
              className="rounded-xl p-8 flex flex-col items-center gap-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-sm text-zinc-400">No sites yet</p>
              <p className="text-[11px] text-zinc-600 font-mono max-w-xs">
                Create your first digital product site with AI-generated copy, SEO, and Stripe checkout in under 60 seconds.
              </p>
              <button
                onClick={() => setActiveView('create')}
                className="mt-2 px-4 py-2 rounded-lg text-[11px] font-mono transition-colors"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  color: '#f97316',
                }}
              >
                Create your first site
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {builds.map((b) => (
                <BuildCard
                  key={b.buildId}
                  build={b}
                  onView={setSelectedBuild}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <SectionHeader label="Create New Site" />
          <CreateSiteForm onSuccess={handleBuildSuccess} />
        </div>
      )}

      {/* Build detail modal */}
      {selectedBuild && (
        <BuildDetailModal
          build={selectedBuild}
          onClose={() => setSelectedBuild(null)}
        />
      )}
    </div>
  );
}
