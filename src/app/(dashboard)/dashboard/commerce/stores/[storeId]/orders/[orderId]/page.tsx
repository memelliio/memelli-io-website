'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CreditCard, FileText, AlertTriangle } from 'lucide-react';
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

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  provider?: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  couponCode?: string;
  couponDiscount?: number;
  items?: OrderItem[];
  payments?: Payment[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  PROCESSING: 'bg-red-500/10 text-red-300 border-red-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-300',
  PENDING: 'bg-yellow-500/10 text-yellow-300',
  FAILED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-white/[0.04] text-white/40',
};

const STATUS_FLOW: Record<string, { label: string; next: string } | null> = {
  PENDING: { label: 'Confirm Order', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Mark Processing', next: 'PROCESSING' },
  PROCESSING: { label: 'Mark Shipped', next: 'SHIPPED' },
  SHIPPED: { label: 'Mark Delivered', next: 'DELIVERED' },
  DELIVERED: null,
  CANCELLED: null,
};

export default function OrderDetailPage() {
  const { storeId, orderId } = useParams<{ storeId: string; orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/commerce/orders/${orderId}`);
      const o = data.data ?? data;
      setOrder(o);
      setNotes(o.notes ?? '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) load();
  }, [orderId, load]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await api(`/api/commerce/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      showToast(`Order status updated to ${newStatus}`);
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    await handleStatusChange('CANCELLED');
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await api(`/api/commerce/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      showToast('Notes saved');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setNotesSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-400/60 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-[#0a0a0a]">
        <p className="text-sm text-red-300">{error ?? 'Order not found'}</p>
        <Link href={`/dashboard/commerce/stores/${storeId}/orders`} className="text-sm text-red-400 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const nextAction = STATUS_FLOW[order.status];
  const subtotal = order.subtotal ?? order.items?.reduce((s, i) => s + i.totalPrice, 0) ?? 0;
  const discount = order.discountAmount ?? order.couponDiscount ?? 0;
  const tax = order.taxAmount ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0a] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] px-5 py-3 text-sm text-white/90 shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl p-6 mx-4 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-red-500/[0.08] p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-300" />
              </div>
              <h3 className="font-semibold text-white/90">Cancel Order?</h3>
            </div>
            <p className="text-sm text-white/40 mb-6">
              This will cancel order <span className="font-mono text-white/70">{order.orderNumber}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] transition-all duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-all duration-200"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/dashboard/commerce/stores/${storeId}/orders`}
          className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200 mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-white font-mono">{order.orderNumber}</h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm ${STATUS_COLORS[order.status] ?? 'bg-white/[0.04] text-white/40 border-white/[0.06]'}`}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-white/30 mt-0.5">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {nextAction && (
            <button
              onClick={() => handleStatusChange(nextAction.next)}
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200"
            >
              {updating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
              {nextAction.label}
            </button>
          )}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/[0.08] border border-red-500/[0.15] px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/[0.15] disabled:opacity-40 transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order Items */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
              <Package className="h-4 w-4 text-white/30" />
              <h2 className="font-semibold text-white/90">Order Items</h2>
            </div>
            {!order.items || order.items.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/25">No items</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-left">
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Product</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Variant</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Qty</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25">Unit Price</th>
                      <th className="px-6 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white/25 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 font-medium text-white/90">{item.productName}</td>
                        <td className="px-6 py-4 text-white/30 text-xs">{item.variantName ?? '—'}</td>
                        <td className="px-6 py-4 text-white/40">{item.quantity}</td>
                        <td className="px-6 py-4 text-white/60">${item.unitPrice?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-white/90 font-medium text-right">${item.totalPrice?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Totals */}
            <div className="border-t border-white/[0.04] px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm text-white/40">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-300/80">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm text-white/40">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-white/90 pt-2 border-t border-white/[0.04]">
                <span>Total</span>
                <span>${order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
              <CreditCard className="h-4 w-4 text-white/30" />
              <h2 className="font-semibold text-white/90">Payments</h2>
            </div>
            {!order.payments || order.payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/25">No payments recorded</div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white/90">${payment.amount?.toFixed(2)}</p>
                      {payment.provider && (
                        <p className="text-xs text-white/30 mt-0.5">{payment.provider}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_COLORS[payment.status] ?? 'bg-white/[0.04] text-white/40'}`}>
                        {payment.status}
                      </span>
                      <p className="text-xs text-white/25 mt-1">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
              <FileText className="h-4 w-4 text-white/30" />
              <h2 className="font-semibold text-white/90">Notes</h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this order..."
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 resize-none transition-all duration-200"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 transition-all duration-200"
                >
                  {notesSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Customer */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
            <h3 className="font-semibold text-white/90 mb-4">Customer</h3>
            {order.customerName || order.customerEmail ? (
              <div className="space-y-2">
                {order.customerName && (
                  <p className="text-sm font-medium text-white/90">{order.customerName}</p>
                )}
                {order.customerEmail && (
                  <p className="text-sm text-white/40">{order.customerEmail}</p>
                )}
                {order.customerPhone && (
                  <p className="text-sm text-white/40">{order.customerPhone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/20">No customer linked</p>
            )}
          </div>

          {/* Coupon */}
          {order.couponCode && (
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
              <h3 className="font-semibold text-white/90 mb-3">Coupon Applied</h3>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-red-300 bg-red-500/[0.08] border border-red-500/[0.12] rounded-lg px-2.5 py-1">
                  {order.couponCode}
                </span>
                {order.couponDiscount && (
                  <span className="text-sm font-medium text-emerald-300">-${order.couponDiscount.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
            <h3 className="font-semibold text-white/90 mb-4">Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/30">Order ID</span>
                <span className="font-mono text-xs text-white/40">{order.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Items</span>
                <span className="text-white/60">{order.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Payments</span>
                <span className="text-white/60">{order.payments?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
