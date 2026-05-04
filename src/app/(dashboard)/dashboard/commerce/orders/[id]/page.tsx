'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CreditCard, FileText, AlertTriangle, Truck } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Badge } from '../../../../../../components/ui/badge';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string } | null;
  variant?: { id: string; name: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  provider?: string;
  createdAt: string;
}

interface OrderContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface OrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  currency?: string;
  notes?: string;
  storeId: string;
  contact?: OrderContact;
  items: OrderItem[];
  payments?: Payment[];
  metaJson?: { shippingAddress?: Record<string, any>; billingAddress?: Record<string, any> };
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive' | 'primary'> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  PROCESSING: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

const STATUS_FLOW: Record<string, { label: string; next: string } | null> = {
  PENDING: { label: 'Confirm Order', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Mark Processing', next: 'PROCESSING' },
  PROCESSING: { label: 'Mark Shipped', next: 'SHIPPED' },
  SHIPPED: { label: 'Mark Delivered', next: 'DELIVERED' },
  DELIVERED: null,
  CANCELLED: null,
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-500/20 text-emerald-400',
  PENDING: 'bg-amber-500/20 text-amber-400',
  FAILED: 'bg-primary/20 text-primary',
  REFUNDED: 'bg-muted text-muted-foreground',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
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
    const res = await api.get<{ data: OrderDetail }>(`/api/commerce/orders/${id}`);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      const o = (res.data as any).data ?? res.data;
      setOrder(o);
      setNotes(o.notes ?? '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const res = await api.patch(`/api/commerce/orders/${id}/status`, { status: newStatus });
    setUpdating(false);
    if (res.error) {
      showToast(`Error: ${res.error}`);
    } else {
      showToast(`Status updated to ${newStatus}`);
      await load();
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    handleStatusChange('CANCELLED');
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    const res = await api.patch(`/api/commerce/orders/${id}`, { notes });
    setNotesSaving(false);
    if (res.error) {
      showToast(`Error: ${res.error}`);
    } else {
      showToast('Notes saved');
    }
  };

  const customerName = () => {
    if (!order?.contact) return null;
    const { firstName, lastName } = order.contact;
    if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ');
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">{error ?? 'Order not found'}</p>
        <Link href="/dashboard/commerce/orders" className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextAction = STATUS_FLOW[order.status];

  return (
    <div className="min-h-screen bg-card">
      <div className="flex flex-col gap-8 p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 rounded-2xl bg-card backdrop-blur-xl border border-white/[0.04] px-6 py-4 text-sm text-foreground shadow-2xl">
            {toast}
          </div>
        )}

        {/* Cancel Confirm */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-primary/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">Cancel Order?</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                This will cancel order{' '}
                <span className="font-mono text-foreground">{order.orderNumber ?? order.id.slice(0, 8)}</span>.
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-xl border border-white/[0.06] bg-muted hover:bg-muted px-4 py-2 text-sm text-foreground transition-all duration-200"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-medium text-white transition-all duration-200"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-6">
          <Link
            href="/dashboard/commerce/orders"
            className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200 mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground font-mono">
                {order.orderNumber ?? order.id.slice(0, 8)}
              </h1>
              <Badge variant={statusVariant[order.status] ?? 'muted'} className="capitalize">
                {order.status.toLowerCase()}
              </Badge>
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {nextAction && (
              <button
                onClick={() => handleStatusChange(nextAction.next)}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm font-medium disabled:opacity-50 transition-all duration-200"
              >
                {updating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                <Truck className="h-4 w-4" />
                {nextAction.label}
              </button>
            )}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-xl bg-muted hover:bg-muted border border-white/[0.06] px-6 py-3 text-sm font-medium text-primary disabled:opacity-50 transition-all duration-200"
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
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-5 border-b border-white/[0.04]">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Order Items</h2>
              </div>
              {!order.items || order.items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground leading-relaxed">No items</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-left">
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Product</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Variant</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Qty</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Unit Price</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.04] transition-all duration-200">
                          <td className="px-6 py-4 font-medium text-foreground tracking-tight">
                            {item.product?.name ?? 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {item.variant?.name ?? '---'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{item.quantity}</td>
                          <td className="px-6 py-4 text-foreground">${item.unitPrice?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-emerald-400 font-semibold text-right tracking-tight">
                            ${item.total?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Totals */}
              <div className="border-t border-white/[0.04] px-6 py-5 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) ?? '0.00'}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount</span>
                    <span>-${order.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-white/[0.04] tracking-tight">
                  <span>Total</span>
                  <span className="text-emerald-400">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-5 border-b border-white/[0.04]">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h2>
              </div>
              {!order.payments || order.payments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground leading-relaxed">No payments recorded</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.04] transition-all duration-200">
                      <div>
                        <p className="text-sm font-semibold text-foreground tracking-tight">${payment.amount?.toFixed(2)}</p>
                        {payment.provider && (
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">{payment.provider}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {payment.status}
                        </span>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-5 border-b border-white/[0.04]">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Notes</h2>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes about this order..."
                  className="w-full rounded-xl border border-white/[0.06] bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none backdrop-blur-xl transition-all duration-200"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-6 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
                  >
                    {notesSaving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Customer */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Customer</h3>
              {order.contact ? (
                <div className="space-y-2">
                  {customerName() && (
                    <p className="text-sm font-medium text-foreground tracking-tight">{customerName()}</p>
                  )}
                  {order.contact.email && (
                    <p className="text-sm text-muted-foreground">{order.contact.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer linked</p>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {order.shippedAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary/70 shadow-sm shadow-purple-400/50" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Shipped</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.shippedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Delivered</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.deliveredAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary/70 shadow-sm shadow-purple-400/50" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Cancelled</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.cancelledAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Order ID</span>
                  <span className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Items</span>
                  <span className="text-foreground">{order.items?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Payments</span>
                  <span className="text-foreground">{order.payments?.length ?? 0}</span>
                </div>
                {order.currency && (
                  <div className="flex justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Currency</span>
                    <span className="text-foreground">{order.currency}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}