'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Download, CheckSquare, Square } from 'lucide-react';
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

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  subtotal: number;
  items?: { id: string }[];
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
  createdAt: string;
}

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  PROCESSING: 'bg-red-500/10 text-red-300 border-red-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/commerce/orders?storeId=${storeId}`);
      setOrders(data.data ?? data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) load();
  }, [storeId, load]);

  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter((o) => o.status === activeTab.toUpperCase());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredOrders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          api(`/api/commerce/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      setSelected(new Set());
      setBulkStatus('');
      await load();
      showToast(`Updated ${selected.size} order(s) to ${bulkStatus}`);
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setBulkUpdating(false);
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

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}`}
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Orders</h1>
          <p className="text-sm text-white/40 mt-0.5">Manage and track store orders</p>
        </div>
        <button
          onClick={() => showToast('Export coming soon')}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all duration-200"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/[0.12] backdrop-blur-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.04] pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelected(new Set()); }}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
              activeTab === tab
                ? 'border-red-400 text-red-300'
                : 'border-transparent text-white/30 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/[0.06] border border-red-500/[0.1] backdrop-blur-xl px-5 py-3">
          <span className="text-sm text-red-300/80">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl px-3 py-1.5 text-sm text-white/80 focus:border-red-400/50 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200"
          >
            <option value="">Change status to...</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || bulkUpdating}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200"
          >
            {bulkUpdating ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
            Apply
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-white/30 hover:text-white/60 ml-auto transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/60 border-t-transparent" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-4 py-3.5">
                    <button onClick={toggleAll} className="text-white/30 hover:text-white/60 transition-colors duration-200">
                      {selected.size === filteredOrders.length && filteredOrders.length > 0
                        ? <CheckSquare className="h-4 w-4 text-red-400" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Order #</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Customer</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Items</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Total</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Status</th>
                  <th className="px-4 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/dashboard/commerce/stores/${storeId}/orders/${order.id}`)}
                    className="hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(order.id)} className="text-white/30 hover:text-white/60 transition-colors duration-200">
                        {selected.has(order.id)
                          ? <CheckSquare className="h-4 w-4 text-red-400" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-white/60">{order.orderNumber ?? order.id.slice(0, 8)}</td>
                    <td className="px-4 py-4">
                      {order.contact ? (
                        <div>
                          <p className="font-medium text-white/90">
                            {[order.contact.firstName, order.contact.lastName].filter(Boolean).join(' ') || order.contact.email || '—'}
                          </p>
                          {order.contact.email && (order.contact.firstName || order.contact.lastName) && (
                            <p className="text-xs text-white/30">{order.contact.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white/40">{order.items?.length ?? '—'}</td>
                    <td className="px-4 py-4 font-medium text-white/90">
                      ${Number(order.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm ${STATUS_COLORS[order.status] ?? 'bg-white/[0.04] text-white/40 border-white/[0.06]'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/30 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
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
