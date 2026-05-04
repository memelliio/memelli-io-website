'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag, Plus, Copy, X, RefreshCw, Ban } from 'lucide-react';
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

interface CouponRaw {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED' | string;
  value: number;
  usedCount: number;
  maxUses?: number;
  expiresAt?: string;
  createdAt: string;
}

interface Coupon extends CouponRaw {
  isActive: boolean;
  usesCount: number;
}

function toCoupon(raw: CouponRaw): Coupon {
  const expired = raw.expiresAt ? new Date(raw.expiresAt) < new Date() : false;
  return {
    ...raw,
    usesCount: raw.usedCount ?? 0,
    isActive: !expired,
  };
}

function genCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const TYPE_LABELS: Record<string, string> = {
  PERCENT: 'Percentage',
  FIXED: 'Fixed Amount',
};

export default function CouponsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [storeName, setStoreName] = useState<string>('Store');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [fCode, setFCode] = useState('');
  const [fType, setFType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [fValue, setFValue] = useState('');
  const [fMaxUses, setFMaxUses] = useState('');
  const [fExpires, setFExpires] = useState('');
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storeData = await api(`/api/commerce/stores/${storeId}`);
      const s = storeData?.data ?? storeData;
      setStoreName(s?.name ?? 'Store');
      setCoupons((s?.coupons ?? []).map(toCoupon));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) load();
  }, [storeId, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFSubmitting(true);
    setFError(null);
    try {
      const body: Record<string, any> = {
        code: fCode,
        type: fType,
        value: parseFloat(fValue),
      };
      if (fMaxUses) body.maxUses = parseInt(fMaxUses);
      if (fExpires) body.expiresAt = new Date(fExpires).toISOString();
      const data = await api(`/api/commerce/stores/${storeId}/coupons`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setCoupons((prev) => [toCoupon(data?.data ?? data), ...prev]);
      setShowModal(false);
      resetForm();
      showToast('Coupon created');
    } catch (e: any) {
      setFError(`Failed to create coupon: ${e.message}`);
    } finally {
      setFSubmitting(false);
    }
  };

  const resetForm = () => {
    setFCode('');
    setFType('PERCENT');
    setFValue('');
    setFMaxUses('');
    setFExpires('');
    setFError(null);
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api(`/api/commerce/stores/${storeId}/coupons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ expiresAt: new Date().toISOString() }),
      });
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, isActive: false, expiresAt: new Date().toISOString() } : c));
      showToast('Coupon deactivated');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => showToast(`Copied: ${code}`));
  };

  const activeCoupons = coupons.filter((c) => c.isActive);
  const inactiveCoupons = coupons.filter((c) => !c.isActive);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-2xl px-4 py-3 text-sm text-white/90 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-6 mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold tracking-tight text-white/90">Create Coupon</h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-white/30 hover:text-white/60 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {fError && (
              <div className="mb-4 rounded-xl bg-primary/[0.06] border border-primary/[0.12] p-3 text-sm text-primary">
                {fError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">Code</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={fCode}
                    onChange={(e) => setFCode(e.target.value.toUpperCase())}
                    placeholder="SAVE20"
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFCode(genCode())}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/40 hover:bg-white/[0.08] hover:text-white/70 transition-all duration-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Auto
                  </button>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">Discount Type</label>
                <select
                  value={fType}
                  onChange={(e) => setFType(e.target.value as 'PERCENT' | 'FIXED')}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/50">
                  Value {fType === 'PERCENT' ? '(%)' : '($)'}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step={fType === 'PERCENT' ? '1' : '0.01'}
                  max={fType === 'PERCENT' ? '100' : undefined}
                  value={fValue}
                  onChange={(e) => setFValue(e.target.value)}
                  placeholder={fType === 'PERCENT' ? '20' : '10.00'}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {/* Max Uses & Expires */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/50">Max Uses</label>
                  <input
                    type="number"
                    min="0"
                    value={fMaxUses}
                    onChange={(e) => setFMaxUses(e.target.value)}
                    placeholder="0 = unlimited"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/50">Expires At</label>
                  <input
                    type="date"
                    value={fExpires}
                    onChange={(e) => setFExpires(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/90 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-40 transition-all duration-200"
                >
                  {fSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}`}
          className="rounded-2xl p-2 text-white/40 hover:bg-white/[0.06] hover:text-white/80 backdrop-blur-xl transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">Coupons</h1>
          <p className="text-sm text-white/30 mt-0.5">{storeName}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-primary/[0.06] border border-primary/[0.12] p-4 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Coupons', value: coupons.length },
          { label: 'Active', value: activeCoupons.length },
          { label: 'Inactive', value: inactiveCoupons.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4 hover:-translate-y-0.5 transition-all duration-300">
            <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-white/90 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
          <Tag className="h-4 w-4 text-white/30" />
          <h2 className="font-semibold tracking-tight text-white/90">All Coupons</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Tag className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No coupons yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-primary/80 hover:underline"
            >
              Create your first coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Code</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Type</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Value</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Uses / Max</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Expires</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Status</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary/80 bg-primary/[0.08] border border-primary/[0.15] rounded-lg px-2 py-0.5 text-xs">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-white/20 hover:text-white/60 transition-colors duration-200"
                          title="Copy code"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">{TYPE_LABELS[coupon.type] ?? coupon.type}</td>
                    <td className="px-6 py-4 font-medium text-white/90">
                      {coupon.type === 'PERCENT' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-white/40">
                      {coupon.usesCount ?? 0} / {coupon.maxUses ? coupon.maxUses : '\u221e'}
                    </td>
                    <td className="px-6 py-4 text-white/30 text-xs">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/30'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {coupon.isActive && (
                        <button
                          onClick={() => handleDeactivate(coupon.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-2.5 py-1.5 text-xs text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200"
                        >
                          <Ban className="h-3 w-3" />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
