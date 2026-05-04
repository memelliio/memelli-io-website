'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Tag } from 'lucide-react';
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

interface Variant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  inventory?: number;
}

interface PriceRule {
  id: string;
  name: string;
  type: string;
  value: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inventory?: number;
  variants?: Variant[];
  priceRules?: PriceRule[];
}

const TYPE_OPTIONS = ['DIGITAL', 'PHYSICAL', 'SERVICE', 'SUBSCRIPTION'];

export default function ProductDetailPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [inventory, setInventory] = useState('');
  const [type, setType] = useState('DIGITAL');

  // Variant form
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [vName, setVName] = useState('');
  const [vSku, setVSku] = useState('');
  const [vPrice, setVPrice] = useState('');
  const [vInventory, setVInventory] = useState('');
  const [vSubmitting, setVSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/commerce/stores/${storeId}/products/${productId}`);
      const p: Product = data.data ?? data;
      setProduct(p);
      setName(p.name ?? '');
      setDescription(p.description ?? '');
      setPrice(p.price?.toString() ?? '');
      setCompareAtPrice(p.compareAtPrice?.toString() ?? '');
      setSku(p.sku ?? '');
      setInventory(p.inventory?.toString() ?? '');
      setType(p.type ?? 'DIGITAL');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, productId]);

  useEffect(() => {
    if (storeId && productId) load();
  }, [storeId, productId, load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/commerce/stores/${storeId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description: description || undefined,
          price: parseFloat(price),
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
          sku: sku || undefined,
          inventory: inventory ? parseInt(inventory) : undefined,
          type,
        }),
      });
      showToast('Product saved');
      await load();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    const newStatus = product.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      await api(`/api/commerce/stores/${storeId}/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setProduct((p) => p ? { ...p, status: newStatus } : p);
      showToast(`Product ${newStatus === 'ACTIVE' ? 'published' : 'archived'}`);
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setVSubmitting(true);
    try {
      const data = await api(`/api/commerce/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          name: vName,
          sku: vSku || undefined,
          price: vPrice ? parseFloat(vPrice) : undefined,
          inventory: vInventory ? parseInt(vInventory) : undefined,
        }),
      });
      setProduct((p) =>
        p ? { ...p, variants: [...(p.variants ?? []), data.data ?? data] } : p
      );
      setShowVariantForm(false);
      setVName(''); setVSku(''); setVPrice(''); setVInventory('');
      showToast('Variant added');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setVSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/60 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-[#0a0a0a]">
        <p className="text-sm text-red-300">{error ?? 'Product not found'}</p>
        <Link href={`/dashboard/commerce/stores/${storeId}`} className="text-sm text-red-400 hover:underline">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-5 py-3 text-sm text-white/90 shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}`}
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{product.name}</h1>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-red-500/[0.08] text-red-300 border border-red-500/[0.12]">
              {product.type}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${product.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'}`}>
              {product.status}
            </span>
          </div>
        </div>
        <button
          onClick={handleToggleStatus}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            product.status === 'ACTIVE'
              ? 'bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
              : 'bg-emerald-500/[0.08] border border-emerald-500/[0.15] text-emerald-300 hover:bg-emerald-500/[0.15]'
          }`}
        >
          {product.status === 'ACTIVE' ? 'Archive' : 'Publish'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col gap-5">
            <h2 className="font-semibold text-white/90">Product Details</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 resize-none transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 font-mono focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Compare At</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Inventory</label>
                <input
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200"
              >
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Variants */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <h3 className="font-semibold text-white/90">Variants</h3>
              <button
                onClick={() => setShowVariantForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {!product.variants || product.variants.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/20">No variants</div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {product.variants.map((v) => (
                  <div key={v.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-white/90">{v.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {v.sku && <span className="text-xs font-mono text-white/30">{v.sku}</span>}
                      {v.price != null && <span className="text-xs text-white/40">${v.price.toFixed(2)}</span>}
                      {v.inventory != null && <span className="text-xs text-white/25">Inv: {v.inventory}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Variant Form */}
            {showVariantForm && (
              <div className="border-t border-white/[0.04] p-5">
                <form onSubmit={handleAddVariant} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">New Variant</span>
                    <button type="button" onClick={() => setShowVariantForm(false)} className="text-white/25 hover:text-white/60 transition-colors duration-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input required placeholder="Variant name" value={vName} onChange={(e) => setVName(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="SKU" value={vSku} onChange={(e) => setVSku(e.target.value)}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-xs text-white/80 font-mono focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                    <input type="number" min="0" step="0.01" placeholder="Price" value={vPrice} onChange={(e) => setVPrice(e.target.value)}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2 text-xs text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                  </div>
                  <input type="number" min="0" placeholder="Inventory" value={vInventory} onChange={(e) => setVInventory(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                  <button type="submit" disabled={vSubmitting}
                    className="rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200">
                    {vSubmitting ? 'Adding...' : 'Add Variant'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Price Rules */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.04]">
              <Tag className="h-4 w-4 text-white/30" />
              <h3 className="font-semibold text-white/90">Price Rules</h3>
            </div>
            {!product.priceRules || product.priceRules.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/20">No active price rules</div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {product.priceRules.filter((r) => r.isActive).map((rule) => (
                  <div key={rule.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/90">{rule.name}</p>
                      <span className="text-xs text-red-300">
                        {rule.type === 'PERCENTAGE' ? `${rule.value}%` : `$${rule.value}`} off
                      </span>
                    </div>
                    {(rule.startsAt || rule.endsAt) && (
                      <p className="text-xs text-white/25 mt-1">
                        {rule.startsAt && `From ${new Date(rule.startsAt).toLocaleDateString()}`}
                        {rule.endsAt && ` — Until ${new Date(rule.endsAt).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
