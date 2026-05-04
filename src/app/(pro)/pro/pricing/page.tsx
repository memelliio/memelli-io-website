'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  X,
  Package,
  DollarSign,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProPackage {
  id: string;
  name: string;
  description: string;
  services: string[];
  price: number;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  active: boolean;
}

interface BaseProduct {
  id: string;
  name: string;
  basePrice: number;
  category: string;
}

interface PackageForm {
  name: string;
  description: string;
  selectedProducts: string[];
  markupType: 'percentage' | 'fixed';
  markupValue: number;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProPricingPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [form, setForm] = useState<PackageForm>({
    name: '',
    description: '',
    selectedProducts: [],
    markupType: 'percentage',
    markupValue: 15,
  });

  // Fetch packages
  const { data: packages, isLoading } = useQuery<ProPackage[]>({
    queryKey: ['pro-packages'],
    queryFn: async () => {
      const res = await api.get<ProPackage[]>('/api/pro/packages');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Fetch base products
  const { data: baseProducts } = useQuery<BaseProduct[]>({
    queryKey: ['pro-base-products'],
    queryFn: async () => {
      const res = await api.get<BaseProduct[]>('/api/pro/products/catalog');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 300_000,
  });

  // Create/update package
  const saveMutation = useMutation({
    mutationFn: async (data: PackageForm & { id?: string }) => {
      const { id, ...body } = data;
      const res = id
        ? await api.patch(`/api/pro/packages/${id}`, body)
        : await api.post('/api/pro/packages', body);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success(editingId ? 'Package updated' : 'Package created');
      setShowCreate(false);
      setEditingId(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['pro-packages'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save package'),
  });

  // Toggle active
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await api.patch(`/api/pro/packages/${id}`, { active });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-packages'] });
      toast.success('Package status updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setForm({ name: '', description: '', selectedProducts: [], markupType: 'percentage', markupValue: 15 });
  }

  function startEdit(pkg: ProPackage) {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description,
      selectedProducts: pkg.services,
      markupType: pkg.markupType,
      markupValue: pkg.markupValue,
    });
    setShowCreate(true);
  }

  function toggleProduct(productId: string) {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter((id) => id !== productId)
        : [...prev.selectedProducts, productId],
    }));
  }

  const pkgList = packages ?? [];
  const catalog = baseProducts ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Pricing</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Create and manage service packages for your clients.</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowCreate(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Package
        </button>
      </div>

      {/* Package cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : pkgList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-zinc-900/60 py-16 backdrop-blur-xl">
          <Package className="h-10 w-10 text-white/10" />
          <p className="text-sm text-white/30">No packages yet. Create your first package.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pkgList.map((pkg) => (
            <div key={pkg.id} className="flex flex-col rounded-2xl border border-white/[0.04] bg-zinc-900/60 p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{pkg.name}</h3>
                  <p className="mt-0.5 text-xs text-white/30 line-clamp-2">{pkg.description}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${pkg.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/30'}`}>
                  {pkg.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-3 flex-1">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">Included Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.services.map((s, i) => (
                    <span key={i} className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-zinc-100">${pkg.price.toLocaleString()}</span>
                <span className="text-xs text-white/30">
                  ({pkg.markupType === 'percentage' ? `${pkg.markupValue}% markup` : `$${pkg.markupValue} fixed`})
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(pkg)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-xs font-medium text-white/50 transition-all duration-200 hover:bg-white/[0.04]"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: pkg.id, active: !pkg.active })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-xs font-medium text-white/50 transition-all duration-200 hover:bg-white/[0.04]"
                >
                  {pkg.active ? <ToggleRight className="h-3 w-3 text-emerald-400" /> : <ToggleLeft className="h-3 w-3" />}
                  {pkg.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Base product catalog */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">Base Product Catalog</span>
          </div>
          {showCatalog ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
        </button>
        {showCatalog && (
          <div className="border-t border-white/[0.04]">
            {catalog.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-white/30">No base products available.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-white/25">Product</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-white/25">Category</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-white/25">Base Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {catalog.map((p) => (
                    <tr key={p.id} className="text-white/60">
                      <td className="px-5 py-3 font-medium">{p.name}</td>
                      <td className="px-5 py-3 text-zinc-400">{p.category}</td>
                      <td className="px-5 py-3 text-right">${p.basePrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-zinc-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                {editingId ? 'Edit Package' : 'Create Package'}
              </h2>
              <button onClick={() => { setShowCreate(false); setEditingId(null); }} className="text-white/30 transition-colors hover:text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Package Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Premium Credit Package"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what's included..."
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Product selection */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Include Services</label>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                  {catalog.length === 0 ? (
                    <p className="text-xs text-white/30">No products available.</p>
                  ) : (
                    catalog.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.selectedProducts.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="h-3.5 w-3.5 rounded border-white/10 bg-white/[0.04] text-primary focus:ring-primary/20"
                        />
                        <span className="text-xs text-white/60">{p.name}</span>
                        <span className="ml-auto text-[10px] text-white/25">${p.basePrice}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Markup */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Markup Type</label>
                  <select
                    value={form.markupType}
                    onChange={(e) => setForm({ ...form, markupType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {form.markupType === 'percentage' ? 'Markup %' : 'Markup $'}
                  </label>
                  <input
                    type="number"
                    value={form.markupValue}
                    onChange={(e) => setForm({ ...form, markupValue: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                onClick={() => saveMutation.mutate(editingId ? { ...form, id: editingId } : form)}
                disabled={!form.name || saveMutation.isPending}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
