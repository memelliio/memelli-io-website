'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, CreditCard, Truck, Bell, Globe } from 'lucide-react';
import { API_URL as API } from '@/lib/config';
async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

type SettingsTab = 'general' | 'payment' | 'shipping' | 'notifications';

interface StoreSettings {
  id: string;
  name: string;
  slug: string;
  description?: string;
  currency: string;
  logoUrl?: string;
  settings?: {
    acceptManualPayments?: boolean;
    shippingEnabled?: boolean;
    flatRateShipping?: number;
    freeShippingThreshold?: number;
    emailOnOrderConfirmation?: boolean;
    emailOnShipment?: boolean;
  };
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN'];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors duration-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
          checked ? 'bg-primary/90' : 'bg-white/[0.1]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export default function StoreSettingsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // General fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoUrl, setLogoUrl] = useState('');

  // Payment fields
  const [acceptManual, setAcceptManual] = useState(false);

  // Shipping fields
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [flatRate, setFlatRate] = useState('');
  const [freeThreshold, setFreeThreshold] = useState('');

  // Notification fields
  const [emailOnConfirm, setEmailOnConfirm] = useState(true);
  const [emailOnShipment, setEmailOnShipment] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/api/commerce/stores/${storeId}`);
      const s: StoreSettings = data?.data ?? data;
      setStore(s);
      setName(s.name ?? '');
      setDescription(s.description ?? '');
      setCurrency(s.currency ?? 'USD');
      setLogoUrl(s.logoUrl ?? '');
      const cfg = s.settings ?? {};
      setAcceptManual(cfg.acceptManualPayments ?? false);
      setShippingEnabled(cfg.shippingEnabled ?? false);
      setFlatRate(cfg.flatRateShipping != null ? String(cfg.flatRateShipping) : '');
      setFreeThreshold(cfg.freeShippingThreshold != null ? String(cfg.freeShippingThreshold) : '');
      setEmailOnConfirm(cfg.emailOnOrderConfirmation ?? true);
      setEmailOnShipment(cfg.emailOnShipment ?? true);
    } catch (e: any) {
      showToast(`Failed to load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) load();
  }, [storeId, load]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/commerce/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, description, currency, logoUrl }),
      });
      showToast('General settings saved');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (patch: Record<string, any>) => {
    setSaving(true);
    try {
      await api(`/api/commerce/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ settings: patch }),
      });
      showToast('Settings saved');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{className?: string}> }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-2xl px-4 py-3 text-sm text-white/90 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}`}
          className="rounded-2xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground backdrop-blur-xl transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Store Settings</h1>
          <p className="text-sm text-white/30 mt-0.5 font-mono">{store?.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-white/20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.04]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
              activeTab === id
                ? 'border-primary/80 text-primary'
                : 'border-transparent text-white/30 hover:text-white/60'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-6 max-w-2xl">
          <h2 className="font-semibold tracking-tight text-white/90 mb-5">General Settings</h2>
          <form onSubmit={handleSaveGeneral} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/50">Store Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/50">Slug</label>
              <input
                readOnly
                value={store?.slug ?? ''}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/30 font-mono cursor-not-allowed"
              />
              <p className="text-xs text-white/20">Slug cannot be changed after creation</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/50">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/50">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/50">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-40 transition-all duration-200"
              >
                {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="flex flex-col gap-4 max-w-2xl">
          {/* Stripe */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight text-white/90">Stripe</h3>
                <p className="text-xs text-white/30 mt-0.5">Accept card payments via Stripe</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Stripe integration coming soon')}
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-400/60 cursor-not-allowed opacity-50"
            >
              Connect Stripe
              <span className="ml-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/30">Coming soon</span>
            </button>
          </div>

          {/* Manual Payments */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-6">
            <h3 className="font-semibold tracking-tight text-white/90 mb-1">Manual / Bank Transfer</h3>
            <p className="text-sm text-white/30 mb-4">Allow customers to pay via bank transfer or manual arrangements</p>
            <Toggle
              checked={acceptManual}
              onChange={(v) => {
                setAcceptManual(v);
                handleSaveSettings({ acceptManualPayments: v });
              }}
              label="Accept manual/bank transfer payments"
            />
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === 'shipping' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-6 max-w-2xl">
          <h2 className="font-semibold tracking-tight text-white/90 mb-5">Shipping Settings</h2>
          <div className="space-y-5">
            <Toggle
              checked={shippingEnabled}
              onChange={(v) => setShippingEnabled(v)}
              label="Enable shipping"
            />
            {shippingEnabled && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/50">Flat Rate Shipping ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={flatRate}
                    onChange={(e) => setFlatRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <p className="text-xs text-white/20">Applied to all orders unless free shipping threshold is met</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/50">Free Shipping Threshold ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    placeholder="Leave blank to disable"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <p className="text-xs text-white/20">Orders above this amount qualify for free shipping</p>
                </div>
              </>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSaveSettings({
                  shippingEnabled,
                  flatRateShipping: flatRate ? parseFloat(flatRate) : undefined,
                  freeShippingThreshold: freeThreshold ? parseFloat(freeThreshold) : undefined,
                })}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-40 transition-all duration-200"
              >
                {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Save Shipping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-6 max-w-2xl">
          <h2 className="font-semibold tracking-tight text-white/90 mb-5">Notification Settings</h2>
          <div className="space-y-4">
            <Toggle
              checked={emailOnConfirm}
              onChange={(v) => setEmailOnConfirm(v)}
              label="Email customer on order confirmation"
            />
            <Toggle
              checked={emailOnShipment}
              onChange={(v) => setEmailOnShipment(v)}
              label="Email customer on shipment"
            />
            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleSaveSettings({
                  emailOnOrderConfirmation: emailOnConfirm,
                  emailOnShipment: emailOnShipment,
                })}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-40 transition-all duration-200"
              >
                {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Save Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
