'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Wallet,
  CreditCard,
  Calendar,
  Settings,
  Save,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface EarningsSummary {
  pending: number;
  approved: number;
  paidLifetime: number;
}

interface EarningRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
}

interface PayoutRow {
  id: string;
  period: string;
  amount: number;
  paymentMethod: string;
  status: 'scheduled' | 'processing' | 'paid' | 'failed';
  paidDate?: string;
}

interface NextPayout {
  date: string;
  estimatedAmount: number;
}

interface PayoutSettings {
  method: 'bank_transfer' | 'paypal' | 'check';
  details: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400/80',
  approved: 'bg-blue-500/10 text-blue-400/80',
  paid: 'bg-emerald-500/10 text-emerald-400/80',
  rejected: 'bg-rose-500/10 text-rose-400/80',
  scheduled: 'bg-indigo-500/10 text-indigo-400/80',
  processing: 'bg-amber-500/10 text-amber-400/80',
  failed: 'bg-rose-500/10 text-rose-400/80',
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function PayoutsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [payMethod, setPayMethod] = useState<PayoutSettings['method']>('bank_transfer');
  const [payDetails, setPayDetails] = useState('');

  // Earnings summary
  const { data: summary } = useQuery<EarningsSummary>({
    queryKey: ['lite-earnings-summary'],
    queryFn: async () => {
      const res = await api.get<EarningsSummary>('/api/lite/earnings/summary');
      if (res.error || !res.data) return { pending: 0, approved: 0, paidLifetime: 0 };
      return res.data;
    },
    staleTime: 60_000,
  });

  // Earnings table
  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningRow[]>({
    queryKey: ['lite-earnings'],
    queryFn: async () => {
      const res = await api.get<EarningRow[]>('/api/lite/earnings');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  // Payout history
  const { data: payouts } = useQuery<PayoutRow[]>({
    queryKey: ['lite-payouts'],
    queryFn: async () => {
      const res = await api.get<PayoutRow[]>('/api/lite/payouts');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Next payout
  const { data: nextPayout } = useQuery<NextPayout | null>({
    queryKey: ['lite-next-payout'],
    queryFn: async () => {
      const res = await api.get<NextPayout>('/api/lite/payouts/next');
      if (res.error || !res.data) return null;
      return res.data;
    },
    staleTime: 120_000,
  });

  // Payout settings
  const { data: settings } = useQuery<PayoutSettings>({
    queryKey: ['lite-payout-settings'],
    queryFn: async () => {
      const res = await api.get<PayoutSettings>('/api/lite/payouts/settings');
      if (res.error || !res.data) return { method: 'bank_transfer' as const, details: '' };
      setPayMethod(res.data.method);
      setPayDetails(res.data.details);
      return res.data;
    },
    staleTime: 300_000,
  });

  // Save settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/api/lite/payouts/settings', { method: payMethod, details: payDetails });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payout settings saved!');
      qc.invalidateQueries({ queryKey: ['lite-payout-settings'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const earningsData = earnings ?? [];
  const payoutsData = payouts ?? [];
  const summaryData = summary ?? { pending: 0, approved: 0, paidLifetime: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Earnings &amp; Payouts</h1>
        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">Track your earnings and manage payout preferences.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-amber-400/60" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-400/90">{fmtCurrency(summaryData.pending)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400/60" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-blue-400/90">{fmtCurrency(summaryData.approved)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Paid (Lifetime)</span>
            <DollarSign className="h-4 w-4 text-emerald-400/60" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-400/90">{fmtCurrency(summaryData.paidLifetime)}</p>
        </div>
      </div>

      {/* Next payout */}
      {nextPayout && (
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-100">Next Payout</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {new Date(nextPayout.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' '} &mdash; Estimated: <span className="font-medium text-emerald-400/80">{fmtCurrency(nextPayout.estimatedAmount)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Earnings table */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Earnings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {earningsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-3">
                      <div className="h-5 animate-pulse rounded-lg bg-white/[0.03]" />
                    </td>
                  </tr>
                ))
              ) : earningsData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-zinc-400">
                    No earnings yet. Start sharing your referral link to earn commissions!
                  </td>
                </tr>
              ) : (
                earningsData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-5 py-3 text-zinc-400">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-white/60">{row.description}</td>
                    <td className="px-5 py-3 text-right font-medium text-white/70">
                      {fmtCurrency(row.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[row.status] ?? ''}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout history */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-4">
          <CreditCard className="h-4 w-4 text-emerald-400/70" />
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {payoutsData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                    No payouts yet.
                  </td>
                </tr>
              ) : (
                payoutsData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-5 py-3 text-white/60">{row.period}</td>
                    <td className="px-5 py-3 text-right font-medium text-white/70">
                      {fmtCurrency(row.amount)}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 capitalize">
                      {row.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[row.status] ?? ''}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {row.paidDate ? new Date(row.paidDate).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Payout Settings</h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {showSettings ? 'Close' : 'Edit'}
          </button>
        </div>

        {showSettings ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PayoutSettings['method'])}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="bank_transfer">Bank Transfer (ACH)</option>
                <option value="paypal">PayPal</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {payMethod === 'paypal' ? 'PayPal Email' : payMethod === 'check' ? 'Mailing Address' : 'Account Details'}
              </label>
              <textarea
                value={payDetails}
                onChange={(e) => setPayDetails(e.target.value)}
                rows={3}
                placeholder={
                  payMethod === 'paypal'
                    ? 'your-email@example.com'
                    : payMethod === 'check'
                    ? 'Full mailing address'
                    : 'Routing number, account number'
                }
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/15 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={() => saveSettings.mutate()}
              disabled={saveSettings.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {saveSettings.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-zinc-400">
            <p>
              <span className="text-zinc-400/60">Method:</span>{' '}
              <span className="capitalize text-white/60">
                {(settings?.method ?? 'bank_transfer').replace('_', ' ')}
              </span>
            </p>
            {settings?.details && (
              <p className="mt-1">
                <span className="text-zinc-400/60">Details:</span>{' '}
                <span className="text-white/50">{settings.details.substring(0, 40)}{settings.details.length > 40 ? '...' : ''}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
