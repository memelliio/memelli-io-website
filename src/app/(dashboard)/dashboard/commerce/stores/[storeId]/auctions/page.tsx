'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gavel, Plus, X, Clock } from 'lucide-react';
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

interface Auction {
  id: string;
  title: string;
  description?: string;
  status: string;
  startPrice: number;
  reservePrice?: number;
  currentBid?: number;
  startAt?: string;
  endAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/[0.04] text-white/40 border-white/[0.06]',
  ACTIVE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  CLOSED: 'bg-white/[0.04] text-white/30 border-white/[0.06]',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function Countdown({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endAt]);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-300/80">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

export default function AuctionsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create form state
  const [cTitle, setCTitle] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cStartPrice, setCStartPrice] = useState('');
  const [cReservePrice, setCReservePrice] = useState('');
  const [cStartAt, setCStartAt] = useState('');
  const [cEndAt, setCEndAt] = useState('');
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cError, setCError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/commerce/auctions?storeId=${storeId}`);
      setAuctions(data.data ?? data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) load();
  }, [storeId, load]);

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    setCSubmitting(true);
    setCError(null);
    try {
      const data = await api(`/api/commerce/auctions`, {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          title: cTitle,
          description: cDescription || undefined,
          startPrice: parseFloat(cStartPrice),
          reservePrice: cReservePrice ? parseFloat(cReservePrice) : undefined,
          startAt: cStartAt ? new Date(cStartAt).toISOString() : new Date().toISOString(),
          endAt: cEndAt ? new Date(cEndAt).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      });
      setAuctions((prev) => [data.data ?? data, ...prev]);
      setShowCreateModal(false);
      setCTitle(''); setCDescription(''); setCStartPrice(''); setCReservePrice(''); setCStartAt(''); setCEndAt('');
      showToast('Auction created');
    } catch (e: any) {
      setCError(e.message);
    } finally {
      setCSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-5 py-3 text-sm text-white/90 shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-6 mx-4 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white/90">Create Auction</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white/70 transition-colors duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            {cError && (
              <div className="mb-4 rounded-xl bg-red-500/[0.06] border border-red-500/[0.12] p-3 text-sm text-red-300">
                {cError}
              </div>
            )}
            <form onSubmit={handleCreateAuction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Title</label>
                <input required value={cTitle} onChange={(e) => setCTitle(e.target.value)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Description</label>
                <textarea value={cDescription} onChange={(e) => setCDescription(e.target.value)} rows={3}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 resize-none transition-all duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Start Price</label>
                  <input required type="number" min="0" step="0.01" value={cStartPrice} onChange={(e) => setCStartPrice(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Reserve Price <span className="text-white/20">(optional)</span></label>
                  <input type="number" min="0" step="0.01" value={cReservePrice} onChange={(e) => setCReservePrice(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">Start At</label>
                  <input type="datetime-local" value={cStartAt} onChange={(e) => setCStartAt(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/60">End At</label>
                  <input type="datetime-local" value={cEndAt} onChange={(e) => setCEndAt(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={cSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200">
                  {cSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
                  Create Auction
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
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Auctions</h1>
          <p className="text-sm text-white/40 mt-0.5">Create and manage live auctions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create Auction
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/[0.12] backdrop-blur-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Auctions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/60 border-t-transparent" />
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <Gavel className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm mb-4">No auctions yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Create your first auction
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <button
              key={auction.id}
              onClick={() => router.push(`/dashboard/commerce/stores/${storeId}/auctions/${auction.id}`)}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 text-left hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white/90 group-hover:text-red-300 transition-colors duration-200 line-clamp-2 flex-1 mr-2">
                  {auction.title}
                </h3>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[auction.status] ?? 'bg-white/[0.04] text-white/40 border-white/[0.06]'}`}>
                  {auction.status}
                </span>
              </div>

              {auction.description && (
                <p className="text-sm text-white/30 mb-4 line-clamp-2">{auction.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/25">Current Bid</span>
                  <span className="text-sm font-semibold text-white/90">
                    {auction.currentBid != null
                      ? `$${auction.currentBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : `$${auction.startPrice.toFixed(2)} start`}
                  </span>
                </div>
                {auction.status === 'ACTIVE' && auction.endAt && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.1] px-3 py-1.5 -mx-1">
                    <span className="text-xs text-white/25">Ends in</span>
                    <Countdown endAt={auction.endAt} />
                  </div>
                )}
                {auction.status !== 'ACTIVE' && auction.endAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/25">
                      {auction.status === 'CLOSED' ? 'Ended' : 'Ends'}
                    </span>
                    <span className="text-xs text-white/30">{new Date(auction.endAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
