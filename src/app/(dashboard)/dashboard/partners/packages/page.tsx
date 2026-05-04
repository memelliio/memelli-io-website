'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  X,
  Package,
  Check,
  Edit2,
  Trash2,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PartnerPackage {
  id: string;
  name: string;
  tier: string;
  price: number;
  billingCycle: string;
  commissionRate: number;
  features: string[];
  maxReferrals?: number;
  isActive: boolean;
  partnersCount?: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierVariant: Record<string, BadgeVariant> = {
  STARTER: 'muted',
  SILVER: 'default',
  GOLD: 'warning',
  PLATINUM: 'primary',
  DIAMOND: 'primary',
};

const TIERS = ['STARTER', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'LIFETIME'];

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PartnerPackagesPage() {
  const api = useApi();
  const [packages, setPackages] = useState<PartnerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PartnerPackage | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [fName, setFName] = useState('');
  const [fTier, setFTier] = useState('STARTER');
  const [fPrice, setFPrice] = useState('0');
  const [fBilling, setFBilling] = useState('MONTHLY');
  const [fCommission, setFCommission] = useState('10');
  const [fMaxReferrals, setFMaxReferrals] = useState('');
  const [fFeatures, setFFeatures] = useState('');
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<any>('/api/partners/packages');
    if (res.data) {
      const list = res.data.data ?? res.data ?? [];
      setPackages(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setFName('');
    setFTier('STARTER');
    setFPrice('0');
    setFBilling('MONTHLY');
    setFCommission('10');
    setFMaxReferrals('');
    setFFeatures('');
    setFError(null);
    setEditingPackage(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg: PartnerPackage) => {
    setEditingPackage(pkg);
    setFName(pkg.name);
    setFTier(pkg.tier);
    setFPrice(String(pkg.price));
    setFBilling(pkg.billingCycle);
    setFCommission(String(pkg.commissionRate));
    setFMaxReferrals(pkg.maxReferrals != null ? String(pkg.maxReferrals) : '');
    setFFeatures(pkg.features.join('\n'));
    setFError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFSubmitting(true);
    setFError(null);

    const body = {
      name: fName,
      tier: fTier,
      price: parseFloat(fPrice),
      billingCycle: fBilling,
      commissionRate: parseFloat(fCommission),
      maxReferrals: fMaxReferrals ? parseInt(fMaxReferrals, 10) : null,
      features: fFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      if (editingPackage) {
        const res = await api.patch<any>(`/api/partners/packages/${editingPackage.id}`, body);
        if (res.error) throw new Error(res.error);
        showToast('Package updated');
      } else {
        const res = await api.post<any>('/api/partners/packages', body);
        if (res.error) throw new Error(res.error);
        showToast('Package created');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err: any) {
      setFError(err.message ?? 'Failed to save package');
    } finally {
      setFSubmitting(false);
    }
  };

  const handleDelete = async (pkg: PartnerPackage) => {
    if (!confirm(`Delete "${pkg.name}" package? This cannot be undone.`)) return;
    const res = await api.del<any>(`/api/partners/packages/${pkg.id}`);
    if (!res.error) {
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      showToast('Package deleted');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="flex flex-col gap-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-8 right-8 z-50 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4 text-sm text-foreground shadow-2xl">
            {toast}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
            <div className="w-full max-w-lg bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  {editingPackage ? 'Edit Package' : 'Create Package'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {fError && (
                <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  {fError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Package Name</label>
                  <input
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="e.g. Gold Partner Plan"
                    className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tier</label>
                    <select
                      value={fTier}
                      onChange={(e) => setFTier(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Billing Cycle</label>
                    <select
                      value={fBilling}
                      onChange={(e) => setFBilling(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    >
                      {BILLING_CYCLES.map((b) => (
                        <option key={b} value={b}>
                          {b.charAt(0) + b.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Price ($)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={fPrice}
                      onChange={(e) => setFPrice(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Commission (%)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={fCommission}
                      onChange={(e) => setFCommission(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Max Referrals</label>
                    <input
                      type="number"
                      min="0"
                      value={fMaxReferrals}
                      onChange={(e) => setFMaxReferrals(e.target.value)}
                      placeholder="Unlimited"
                      className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Features (one per line)</label>
                  <textarea
                    value={fFeatures}
                    onChange={(e) => setFFeatures(e.target.value)}
                    rows={5}
                    placeholder={"Custom referral link\nDedicated support\nMonthly payouts\nAnalytics dashboard"}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-6 py-3 text-sm text-foreground transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fSubmitting}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-medium disabled:opacity-50 transition-all duration-200"
                  >
                    {fSubmitting && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partners
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Partner Packages</h1>
              <p className="text-muted-foreground leading-relaxed mt-1">
                Manage tiers, pricing, and features for your partner program
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Create Package
            </button>
          </div>
        </div>

        {/* Package Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-10 w-10 mb-4 opacity-30" />
            <p className="text-sm">No packages created yet</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Create your first package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 pb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={tierVariant[pkg.tier] ?? 'muted'}>{pkg.tier}</Badge>
                        <Badge variant={pkg.isActive ? 'success' : 'muted'}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        className="rounded-xl p-2 text-muted-foreground hover:text-red-400 hover:bg-white/[0.04] transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-foreground">
                      {fmtCurrency(pkg.price)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      /{pkg.billingCycle.toLowerCase()}
                    </span>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Commission</p>
                      <p className="text-lg font-bold text-foreground">{pkg.commissionRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Partners</p>
                      <p className="text-lg font-bold text-foreground">{pkg.partnersCount ?? 0}</p>
                    </div>
                  </div>

                  {pkg.maxReferrals != null && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Max referrals: <span className="text-foreground">{pkg.maxReferrals}</span>
                    </p>
                  )}
                </div>

                {/* Features */}
                {pkg.features.length > 0 && (
                  <div className="border-t border-white/[0.04] p-6 pt-5 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">Features</p>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                          <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}