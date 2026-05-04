'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  X,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge, type BadgeVariant } from '../../../../../components/ui/badge';
import { MetricTile } from '@memelli/ui';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Payout {
  id: string;
  partnerName: string;
  amount: number;
  status: string;
  period: string;
  method: string;
  processedDate: string | null;
  createdAt: string;
}

interface PayoutMeta {
  total: number;
  pendingCount: number;
  processingCount: number;
  completedThisMonth: number;
  totalPaid: number;
}

interface PartnerOption {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PayoutsPage() {
  const api = useApi();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [meta, setMeta] = useState<PayoutMeta>({
    total: 0,
    pendingCount: 0,
    processingCount: 0,
    completedThisMonth: 0,
    totalPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [creating, setCreating] = useState(false);

  const perPage = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('perPage', String(perPage));

    const res = await api.get<{
      data: Payout[];
      meta: PayoutMeta;
    }>(`/api/partners/payouts?${params.toString()}`);

    if (res.data) {
      setPayouts(res.data.data ?? []);
      setMeta(
        res.data.meta ?? {
          total: 0,
          pendingCount: 0,
          processingCount: 0,
          completedThisMonth: 0,
          totalPaid: 0,
        }
      );
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = async () => {
    setModalOpen(true);
    setSelectedPartnerId('');
    setPeriodFrom('');
    setPeriodTo('');
    setPartnersLoading(true);
    try {
      const res = await api.get<{ data: PartnerOption[] }>('/api/partners?perPage=500&fields=id,name');
      if (res.data) {
        setPartners(res.data.data ?? []);
      }
    } catch {
      // fallback empty
    } finally {
      setPartnersLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const createPayout = async () => {
    if (!selectedPartnerId || !periodFrom || !periodTo) return;
    setCreating(true);
    try {
      await api.post('/api/partners/payouts', {
        partnerId: selectedPartnerId,
        periodFrom,
        periodTo,
      });
      closeModal();
      load();
    } catch {
      // error handled by useApi
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(meta.total / perPage);

  return (
    <div className="flex flex-col gap-6 min-h-screen p-8">
      {/* Create Payout Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Create Payout</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Partner Select */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Partner</label>
                {partnersLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground leading-relaxed text-sm py-2">
                    <LoadingGlobe size="sm" />
                    Loading partners...
                  </div>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  >
                    <option value="">Select a partner</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Period From</label>
                  <input
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Period To</label>
                  <input
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.04]">
              <button
                onClick={closeModal}
                className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-sm font-medium text-foreground hover:text-foreground transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createPayout}
                disabled={!selectedPartnerId || !periodFrom || !periodTo || creating}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {creating ? (
                  <>
                    <LoadingGlobe size="sm" />
                    Creating...
                  </>
                ) : (
                  'Create Payout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payouts</h1>
          <p className="text-muted-foreground leading-relaxed mt-1">
            Manage partner payout disbursements
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create Payout
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Pending Payouts"
          value={meta.pendingCount}
          icon={<Clock className="h-4 w-4" />}
          trend={meta.pendingCount > 0 ? 'flat' : 'flat'}
        />
        <MetricTile
          label="Processing"
          value={meta.processingCount}
          icon={<Loader2 className="h-4 w-4" />}
          trend={meta.processingCount > 0 ? 'flat' : 'flat'}
        />
        <MetricTile
          label="Completed This Month"
          value={meta.completedThisMonth}
          icon={<CheckCircle className="h-4 w-4" />}
          trend={meta.completedThisMonth > 0 ? 'up' : 'flat'}
        />
        <MetricTile
          label="Total Paid"
          value={fmtCurrency(meta.totalPaid)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={meta.totalPaid > 0 ? 'up' : 'flat'}
        />
      </div>

      {/* Table */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-muted-foreground leading-relaxed">No payouts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Partner</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Amount</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Period</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Method</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{p.partnerName}</td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">{fmtCurrency(p.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[p.status] ?? 'muted'} className="capitalize">
                        {p.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">{p.period}</td>
                    <td className="px-6 py-4 text-foreground">{p.method}</td>
                    <td className="px-6 py-4 text-muted-foreground">{fmtDate(p.processedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.04] px-6 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Page {page} of {totalPages} ({meta.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-foreground hover:text-foreground disabled:opacity-40 transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="bg-card hover:bg-muted border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-foreground hover:text-foreground disabled:opacity-40 transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}