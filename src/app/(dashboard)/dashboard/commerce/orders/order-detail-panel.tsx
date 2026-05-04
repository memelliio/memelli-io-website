'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Package, CreditCard, Truck, ExternalLink, AlertTriangle } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Badge } from '../../../../../components/ui/badge';

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
  PENDING: { label: 'Confirm', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Process', next: 'PROCESSING' },
  PROCESSING: { label: 'Ship', next: 'SHIPPED' },
  SHIPPED: { label: 'Deliver', next: 'DELIVERED' },
  DELIVERED: null,
  CANCELLED: null,
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-zinc-500/20 text-zinc-400',
};

interface OrderDetailPanelProps {
  order: { id: string; status: string; [key: string]: any };
  onClose: () => void;
  onUpdated?: () => void;
}

export default function OrderDetailPanel({ order: initialOrder, onClose, onUpdated }: OrderDetailPanelProps) {
  const api = useApi();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ data: OrderDetail }>(`/api/commerce/orders/${initialOrder.id}`);
    if (res.data) {
      setOrder(res.data.data ?? (res.data as any));
    }
    setLoading(false);
  }, [initialOrder.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const res = await api.patch(`/api/commerce/orders/${initialOrder.id}/status`, { status: newStatus });
    setUpdating(false);
    if (!res.error) {
      await load();
      onUpdated?.();
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    handleStatusChange('CANCELLED');
  };

  const customerName = () => {
    if (!order?.contact) return null;
    const { firstName, lastName } = order.contact;
    if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ');
    return null;
  };

  const nextAction = order ? STATUS_FLOW[order.status] : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-100 font-mono">
              {order?.orderNumber ?? initialOrder.id.slice(0, 8)}
            </h2>
            {order && (
              <Badge variant={statusVariant[order.status] ?? 'muted'} className="capitalize">
                {order.status.toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/commerce/orders/${initialOrder.id}`}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              title="Open full page"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : !order ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
            Order not found
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-6">
            {/* Cancel Confirm */}
            {showCancelConfirm && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <p className="text-sm font-medium text-red-400">Cancel this order?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Keep
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {nextAction && (
                <button
                  onClick={() => handleStatusChange(nextAction.next)}
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {updating && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <Truck className="h-3.5 w-3.5" />
                  {nextAction.label}
                </button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="rounded-lg border border-red-500/30 bg-red-600/10 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500 mb-1">Total</p>
                <p className="text-lg font-semibold text-zinc-100">${order.total?.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500 mb-1">Date</p>
                <p className="text-sm font-medium text-zinc-100">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                <Package className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Items ({order.items?.length ?? 0})
                </h3>
              </div>
              {!order.items || order.items.length === 0 ? (
                <div className="py-6 text-center text-sm text-zinc-500">No items</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          {item.product?.name ?? 'Unknown Product'}
                        </p>
                        {item.variant?.name && (
                          <p className="text-xs text-zinc-500 mt-0.5">{item.variant.name}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.quantity} x ${item.unitPrice?.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-zinc-100">
                        ${item.total?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Totals */}
              <div className="border-t border-zinc-800 px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) ?? '0.00'}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount</span>
                    <span>-${order.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-zinc-100 pt-1.5 border-t border-zinc-800">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-sm font-semibold text-zinc-100 mb-2">Customer</h3>
              {order.contact ? (
                <div className="space-y-1">
                  {customerName() && (
                    <p className="text-sm font-medium text-zinc-100">{customerName()}</p>
                  )}
                  {order.contact.email && (
                    <p className="text-sm text-zinc-400">{order.contact.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No customer linked</p>
              )}
            </div>

            {/* Payments */}
            {order.payments && order.payments.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                  <CreditCard className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Payments</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">${payment.amount?.toFixed(2)}</p>
                        {payment.provider && (
                          <p className="text-xs text-zinc-500 mt-0.5">{payment.provider}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                          {payment.status}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
                <p className="text-sm text-zinc-300">{order.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-zinc-600 space-y-0.5 pt-2">
              <p>Created: {new Date(order.createdAt).toLocaleString()}</p>
              {order.shippedAt && <p>Shipped: {new Date(order.shippedAt).toLocaleString()}</p>}
              {order.deliveredAt && <p>Delivered: {new Date(order.deliveredAt).toLocaleString()}</p>}
              {order.cancelledAt && <p>Cancelled: {new Date(order.cancelledAt).toLocaleString()}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
