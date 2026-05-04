'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gavel, Clock, Trophy, X } from 'lucide-react';
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

interface Bid {
  id: string;
  amount: number;
  bidderName?: string;
  bidderEmail?: string;
  createdAt: string;
}

interface AuctionDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  startPrice: number;
  reservePrice?: number;
  currentBid?: number;
  startAt?: string;
  endAt?: string;
  winnerName?: string;
  winnerEmail?: string;
  bids?: Bid[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/[0.04] text-white/40 border-white/[0.06]',
  ACTIVE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  CLOSED: 'bg-white/[0.04] text-white/30 border-white/[0.06]',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function Countdown({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); setUrgent(false); return; }
      setUrgent(diff < 3600000); // < 1 hour
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
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${urgent ? 'text-red-300' : 'text-amber-300/80'}`}>
      <Clock className="h-4 w-4" />
      {timeLeft}
    </span>
  );
}

export default function AuctionDetailPage() {
  const { storeId, auctionId } = useParams<{ storeId: string; auctionId: string }>();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/commerce/auctions/${auctionId}`);
      setAuction(data.data ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    if (auctionId) load();
  }, [auctionId, load]);

  const handleActivate = async () => {
    setUpdating(true);
    try {
      await api(`/api/commerce/auctions/${auctionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      setAuction((a) => a ? { ...a, status: 'ACTIVE' } : a);
      showToast('Auction activated');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    const amount = parseFloat(bidAmount);
    const minBid = (auction?.currentBid ?? auction?.startPrice ?? 0);
    if (amount <= minBid) {
      setBidError(`Bid must be greater than $${minBid.toFixed(2)}`);
      return;
    }
    setBidSubmitting(true);
    try {
      await api(`/api/commerce/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      setShowBidModal(false);
      setBidAmount('');
      await load();
      showToast(`Bid of $${amount.toFixed(2)} placed`);
    } catch (e: any) {
      setBidError(e.message);
    } finally {
      setBidSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/60 border-t-transparent" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-[#0a0a0a]">
        <p className="text-sm text-red-300">{error ?? 'Auction not found'}</p>
        <Link href={`/dashboard/commerce/stores/${storeId}/auctions`} className="text-sm text-red-400 hover:underline">
          Back to auctions
        </Link>
      </div>
    );
  }

  const bids = auction.bids ?? [];
  const topBid = bids.length > 0 ? bids.reduce((m, b) => b.amount > m.amount ? b : m, bids[0]) : null;
  const currentBid = auction.currentBid ?? topBid?.amount ?? null;
  const reserveMet = auction.reservePrice != null && currentBid != null && currentBid >= auction.reservePrice;

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-5 py-3 text-sm text-white/90 shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-6 mx-4 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white/90">Place a Bid</h3>
              <button onClick={() => { setShowBidModal(false); setBidError(null); }} className="text-white/30 hover:text-white/70 transition-colors duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-white/40 mb-4">
              Current bid: <span className="font-semibold text-white/90">
                {currentBid != null ? `$${currentBid.toFixed(2)}` : `$${auction.startPrice.toFixed(2)} (start)`}
              </span>
            </p>
            {bidError && (
              <div className="mb-4 rounded-xl bg-red-500/[0.06] border border-red-500/[0.12] p-3 text-sm text-red-300">
                {bidError}
              </div>
            )}
            <form onSubmit={handlePlaceBid} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Your Bid Amount ($)</label>
                <input
                  required
                  type="number"
                  min={((currentBid ?? auction.startPrice) + 0.01).toFixed(2)}
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Min: $${((currentBid ?? auction.startPrice) + 0.01).toFixed(2)}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowBidModal(false); setBidError(null); }}
                  className="flex-1 rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={bidSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200">
                  {bidSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
                  Place Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}/auctions`}
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200 mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{auction.title}</h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[auction.status] ?? 'bg-white/[0.04] text-white/40 border-white/[0.06]'}`}>
              {auction.status}
            </span>
          </div>
          {auction.status === 'ACTIVE' && auction.endAt && (
            <div className="mt-2">
              <Countdown endAt={auction.endAt} />
            </div>
          )}
        </div>
        {auction.status === 'DRAFT' && (
          <button
            onClick={handleActivate}
            disabled={updating}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40 transition-all duration-200"
          >
            {updating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : <Gavel className="h-4 w-4" />}
            Activate Auction
          </button>
        )}
        {auction.status === 'ACTIVE' && (
          <button
            onClick={() => setShowBidModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-all duration-200"
          >
            <Gavel className="h-4 w-4" />
            Place Bid
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Bid History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Current Highest Bid */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
            <p className="text-sm text-white/30 mb-2">Current Highest Bid</p>
            <p className="text-4xl font-bold text-white/95">
              {currentBid != null
                ? `$${currentBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : <span className="text-white/20">No bids yet</span>}
            </p>
            {auction.reservePrice != null && (
              <div className="mt-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${reserveMet ? 'bg-emerald-400' : 'bg-white/20'}`} />
                <span className={`text-xs ${reserveMet ? 'text-emerald-300' : 'text-white/30'}`}>
                  Reserve {reserveMet ? 'met' : `not met — $${auction.reservePrice.toFixed(2)} required`}
                </span>
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-white/[0.04]">
              <h2 className="font-semibold text-white/90">Bid History ({bids.length})</h2>
            </div>
            {bids.length === 0 ? (
              <div className="py-12 text-center text-sm text-white/20">No bids placed yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Amount</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Bidder</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {[...bids].sort((a, b) => b.amount - a.amount).map((bid, i) => (
                      <tr key={bid.id} className={i === 0 ? 'bg-red-500/[0.04]' : ''}>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${i === 0 ? 'text-red-300' : 'text-white/90'}`}>
                            ${bid.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          {i === 0 && (
                            <span className="ml-2 text-[11px] text-red-300/80 bg-red-500/[0.08] rounded-full px-2 py-0.5">Leading</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/40">
                          {bid.bidderName ?? bid.bidderEmail ?? 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-white/25 text-xs text-right">
                          {new Date(bid.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Auction Info */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
            <h3 className="font-semibold text-white/90 mb-4">Auction Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/30">Start Price</span>
                <span className="text-white/60">${auction.startPrice.toFixed(2)}</span>
              </div>
              {auction.reservePrice != null && (
                <div className="flex justify-between">
                  <span className="text-white/30">Reserve Price</span>
                  <span className="text-white/60">${auction.reservePrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/30">Total Bids</span>
                <span className="text-white/60">{bids.length}</span>
              </div>
              {auction.startAt && (
                <div className="flex justify-between">
                  <span className="text-white/30">Started</span>
                  <span className="text-white/50 text-xs">{new Date(auction.startAt).toLocaleString()}</span>
                </div>
              )}
              {auction.endAt && (
                <div className="flex justify-between">
                  <span className="text-white/30">{auction.status === 'CLOSED' ? 'Ended' : 'Ends'}</span>
                  <span className="text-white/50 text-xs">{new Date(auction.endAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {auction.description && (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
              <h3 className="font-semibold text-white/90 mb-3">Description</h3>
              <p className="text-sm text-white/40 leading-relaxed">{auction.description}</p>
            </div>
          )}

          {/* Winner Section (CLOSED) */}
          {auction.status === 'CLOSED' && (
            <div className="rounded-2xl border border-amber-500/[0.12] bg-amber-500/[0.04] backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-amber-300/80" />
                <h3 className="font-semibold text-amber-200/80">Winner</h3>
              </div>
              {auction.winnerName || auction.winnerEmail || topBid ? (
                <div className="space-y-1">
                  {auction.winnerName && (
                    <p className="text-sm font-medium text-white/90">{auction.winnerName}</p>
                  )}
                  {auction.winnerEmail && (
                    <p className="text-sm text-white/40">{auction.winnerEmail}</p>
                  )}
                  {!auction.winnerName && !auction.winnerEmail && topBid && (
                    <p className="text-sm text-white/40">{topBid.bidderName ?? topBid.bidderEmail ?? 'Anonymous bidder'}</p>
                  )}
                  {currentBid != null && (
                    <p className="text-lg font-bold text-amber-200/80 mt-2">
                      ${currentBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/30">No winner — auction closed with no bids</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
