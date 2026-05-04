'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Trash2,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Filter,
  X,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  type BadgeVariant,
} from '@memelli/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'refunded';

interface LineItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PaymentInfo {
  method: string;
  last4: string;
  brand: string;
  transactionId: string;
}

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  note?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  timeline: TimelineEvent[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'refunded'];

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  refunded: 'error',
};

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  processing: <RefreshCw className="h-3 w-3" />,
  shipped: <Truck className="h-3 w-3" />,
  delivered: <CheckCircle2 className="h-3 w-3" />,
  refunded: <RotateCcw className="h-3 w-3" />,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */

const SAMPLE_ORDERS: Order[] = [
  {
    id: generateId(),
    orderNumber: 'ORD-10001',
    customer: 'Marcus Thompson',
    email: 'marcus@example.com',
    items: [
      { id: generateId(), name: 'Premium Business Card Bundle', sku: 'BC-PRO-500', qty: 2, unitPrice: 49.99 },
      { id: generateId(), name: 'Logo Design Package', sku: 'LOGO-STD', qty: 1, unitPrice: 299.00 },
    ],
    subtotal: 398.98,
    tax: 33.91,
    shipping: 12.00,
    total: 444.89,
    status: 'processing',
    shippingAddress: { name: 'Marcus Thompson', line1: '1234 Oak Street', line2: 'Suite 200', city: 'Austin', state: 'TX', zip: '73301', country: 'US' },
    payment: { method: 'card', last4: '4242', brand: 'Visa', transactionId: 'txn_abc123def456' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-10T09:15:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-10T09:16:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-10T11:30:00Z' },
    ],
    createdAt: '2026-03-10T09:15:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10002',
    customer: 'Sarah Chen',
    email: 'sarah.chen@corp.io',
    items: [
      { id: generateId(), name: 'Enterprise SEO Audit', sku: 'SEO-ENT', qty: 1, unitPrice: 1500.00 },
    ],
    subtotal: 1500.00,
    tax: 127.50,
    shipping: 0,
    total: 1627.50,
    status: 'delivered',
    trackingNumber: '1Z999AA10123456784',
    shippingAddress: { name: 'Sarah Chen', line1: '500 Market St', city: 'San Francisco', state: 'CA', zip: '94105', country: 'US' },
    payment: { method: 'card', last4: '8910', brand: 'Mastercard', transactionId: 'txn_ghi789jkl012' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-05T14:00:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-05T14:01:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-05T16:00:00Z' },
      { id: generateId(), status: 'Shipped', timestamp: '2026-03-06T10:00:00Z', note: 'UPS Ground' },
      { id: generateId(), status: 'Delivered', timestamp: '2026-03-08T15:30:00Z' },
    ],
    createdAt: '2026-03-05T14:00:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10003',
    customer: 'James Rivera',
    email: 'jrivera@email.com',
    items: [
      { id: generateId(), name: 'Monthly Coaching Program', sku: 'COACH-MO', qty: 1, unitPrice: 199.00 },
      { id: generateId(), name: 'Business Strategy Workbook', sku: 'WB-STRAT', qty: 3, unitPrice: 29.99 },
    ],
    subtotal: 288.97,
    tax: 24.56,
    shipping: 8.50,
    total: 322.03,
    status: 'pending',
    shippingAddress: { name: 'James Rivera', line1: '789 Elm Ave', city: 'Denver', state: 'CO', zip: '80202', country: 'US' },
    payment: { method: 'card', last4: '5678', brand: 'Amex', transactionId: 'txn_mno345pqr678' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-14T08:45:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-14T08:46:00Z' },
    ],
    createdAt: '2026-03-14T08:45:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10004',
    customer: 'Priya Sharma',
    email: 'priya@startup.co',
    items: [
      { id: generateId(), name: 'Full Brand Identity Kit', sku: 'BRAND-FULL', qty: 1, unitPrice: 2499.00 },
    ],
    subtotal: 2499.00,
    tax: 212.42,
    shipping: 0,
    total: 2711.42,
    status: 'shipped',
    trackingNumber: 'FX1234567890',
    shippingAddress: { name: 'Priya Sharma', line1: '42 Innovation Blvd', city: 'Seattle', state: 'WA', zip: '98101', country: 'US' },
    payment: { method: 'card', last4: '1357', brand: 'Visa', transactionId: 'txn_stu901vwx234' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-08T11:00:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-08T11:01:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-09T09:00:00Z' },
      { id: generateId(), status: 'Shipped', timestamp: '2026-03-12T14:20:00Z', note: 'FedEx Express' },
    ],
    createdAt: '2026-03-08T11:00:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10005',
    customer: 'David Kim',
    email: 'david.kim@agency.net',
    items: [
      { id: generateId(), name: 'Social Media Content Pack', sku: 'SM-PACK-30', qty: 1, unitPrice: 599.00 },
      { id: generateId(), name: 'Analytics Dashboard License', sku: 'DASH-PRO', qty: 2, unitPrice: 99.00 },
    ],
    subtotal: 797.00,
    tax: 67.75,
    shipping: 0,
    total: 864.75,
    status: 'refunded',
    shippingAddress: { name: 'David Kim', line1: '100 Broadway', city: 'New York', state: 'NY', zip: '10005', country: 'US' },
    payment: { method: 'card', last4: '2468', brand: 'Visa', transactionId: 'txn_yza567bcd890' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-01T16:00:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-01T16:01:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-02T10:00:00Z' },
      { id: generateId(), status: 'Refund requested', timestamp: '2026-03-03T09:00:00Z', note: 'Customer requested cancellation' },
      { id: generateId(), status: 'Refunded', timestamp: '2026-03-04T11:00:00Z' },
    ],
    createdAt: '2026-03-01T16:00:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10006',
    customer: 'Elena Vasquez',
    email: 'elena@design.studio',
    items: [
      { id: generateId(), name: 'Website Redesign Package', sku: 'WEB-REDESIGN', qty: 1, unitPrice: 3500.00 },
      { id: generateId(), name: 'Hosting Plan - Annual', sku: 'HOST-YR', qty: 1, unitPrice: 240.00 },
      { id: generateId(), name: 'SSL Certificate', sku: 'SSL-PRO', qty: 1, unitPrice: 49.99 },
    ],
    subtotal: 3789.99,
    tax: 322.15,
    shipping: 0,
    total: 4112.14,
    status: 'processing',
    shippingAddress: { name: 'Elena Vasquez', line1: '88 Design Quarter', city: 'Miami', state: 'FL', zip: '33101', country: 'US' },
    payment: { method: 'card', last4: '9876', brand: 'Mastercard', transactionId: 'txn_efg123hij456' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-13T10:30:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-13T10:31:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-13T14:00:00Z' },
    ],
    createdAt: '2026-03-13T10:30:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10007',
    customer: 'Robert Chang',
    email: 'rchang@enterprise.com',
    items: [
      { id: generateId(), name: 'API Integration Setup', sku: 'API-SETUP', qty: 1, unitPrice: 750.00 },
    ],
    subtotal: 750.00,
    tax: 63.75,
    shipping: 0,
    total: 813.75,
    status: 'delivered',
    trackingNumber: 'N/A - Digital Delivery',
    shippingAddress: { name: 'Robert Chang', line1: '200 Tech Park Dr', city: 'Portland', state: 'OR', zip: '97201', country: 'US' },
    payment: { method: 'card', last4: '3141', brand: 'Visa', transactionId: 'txn_klm789nop012' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-02T12:00:00Z' },
      { id: generateId(), status: 'Payment confirmed', timestamp: '2026-03-02T12:01:00Z' },
      { id: generateId(), status: 'Processing started', timestamp: '2026-03-02T13:00:00Z' },
      { id: generateId(), status: 'Delivered', timestamp: '2026-03-03T09:00:00Z', note: 'Digital delivery complete' },
    ],
    createdAt: '2026-03-02T12:00:00Z',
  },
  {
    id: generateId(),
    orderNumber: 'ORD-10008',
    customer: 'Natasha Brooks',
    email: 'natasha@boutique.shop',
    items: [
      { id: generateId(), name: 'Custom Apparel Design', sku: 'APP-CUSTOM', qty: 5, unitPrice: 45.00 },
      { id: generateId(), name: 'Branded Packaging', sku: 'PKG-BRAND', qty: 100, unitPrice: 2.50 },
    ],
    subtotal: 475.00,
    tax: 40.38,
    shipping: 25.00,
    total: 540.38,
    status: 'pending',
    shippingAddress: { name: 'Natasha Brooks', line1: '55 Fashion Ave', city: 'Chicago', state: 'IL', zip: '60601', country: 'US' },
    payment: { method: 'card', last4: '7777', brand: 'Amex', transactionId: 'txn_qrs345tuv678' },
    timeline: [
      { id: generateId(), status: 'Order placed', timestamp: '2026-03-15T07:00:00Z' },
    ],
    createdAt: '2026-03-15T07:00:00Z',
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function OrderManagementPage() {
  /* ---- API Data ---- */
  const { data: apiOrders, isLoading, isError } = useApiQuery<{ data: any[]; meta?: { total: number } }>(
    ['commerce-orders'],
    '/api/commerce/orders?perPage=100'
  );
  const isDemo = isError || (!isLoading && !apiOrders);

  /* Map API response to local Order shape, fall back to sample data */
  const mappedApiOrders: Order[] = useMemo(() => {
    const raw = (apiOrders as any)?.data ?? (apiOrders as any);
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((o: any) => ({
      id: o.id,
      orderNumber: o.id?.slice(0, 8)?.toUpperCase() ?? 'ORD-0000',
      customer: o.contact ? `${o.contact.firstName ?? ''} ${o.contact.lastName ?? ''}`.trim() : 'Guest',
      email: o.contact?.email ?? '',
      items: (o.items ?? []).map((item: any) => ({
        id: item.id,
        name: item.product?.name ?? 'Product',
        sku: item.productId?.slice(0, 10) ?? '',
        qty: item.quantity ?? 1,
        unitPrice: Number(item.unitPrice ?? 0),
      })),
      subtotal: Number(o.subtotal ?? 0),
      tax: Number(o.taxTotal ?? 0),
      shipping: 0,
      total: Number(o.total ?? 0),
      status: (o.status ?? 'pending').toLowerCase() as OrderStatus,
      trackingNumber: undefined,
      shippingAddress: { name: '', line1: '', city: '', state: '', zip: '', country: '' },
      payment: { method: 'card', last4: '****', brand: 'Unknown', transactionId: '' },
      timeline: [
        { id: o.id + '_created', status: 'Order placed', timestamp: o.createdAt ?? new Date().toISOString() },
      ],
      createdAt: o.createdAt ?? new Date().toISOString(),
    }));
  }, [apiOrders]);

  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);

  /* Sync API data into local state when it arrives */
  useEffect(() => {
    if (mappedApiOrders.length > 0) {
      setOrders(mappedApiOrders);
    }
  }, [mappedApiOrders]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  /* ---- Filtering ---- */
  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  /* ---- Status counts ---- */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => {
      counts[s] = orders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [orders]);

  /* ---- Selection ---- */
  const allSelected = filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  }, [allSelected, filtered]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ---- Status update ---- */
  const updateStatus = useCallback((id: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              timeline: [
                ...o.timeline,
                {
                  id: generateId(),
                  status: `Status changed to ${newStatus}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : o,
      ),
    );
  }, []);

  /* ---- Bulk actions ---- */
  const bulkUpdateStatus = useCallback(
    (newStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) =>
          selectedIds.has(o.id)
            ? {
                ...o,
                status: newStatus,
                timeline: [
                  ...o.timeline,
                  {
                    id: generateId(),
                    status: `Bulk status change to ${newStatus}`,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
            : o,
        ),
      );
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
    },
    [selectedIds],
  );

  const bulkDelete = useCallback(() => {
    setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    setSelectedIds(new Set());
    setBulkMenuOpen(false);
  }, [selectedIds]);

  /* ---- Export ---- */
  const exportCSV = useCallback(() => {
    const headers = ['Order #', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.customer,
      o.email,
      o.items.length,
      o.total.toFixed(2),
      o.status,
      formatDate(o.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  /* ---- Toggle expand ---- */
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  /* ---- Summary stats ---- */
  const totalRevenue = useMemo(() => filtered.reduce((sum, o) => sum + o.total, 0), [filtered]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card space-y-6 p-8">
      {isDemo && <DemoBanner reason="API returned no data" />}
      {/* Header */}
      <PageHeader
        title="Order Management"
        subtitle={`${filtered.length} order${filtered.length !== 1 ? 's' : ''} \u00b7 ${formatCurrency(totalRevenue)} total revenue`}
        breadcrumb={[
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Orders', href: '/dashboard/commerce/orders' },
          { label: 'Management' },
        ]}
        actions={
          <Button
            size="sm"
            onClick={exportCSV}
            className="rounded-xl bg-muted hover:bg-muted border border-white/[0.06] text-foreground transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Orders', count: statusCounts.all, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'Pending', count: statusCounts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Processing', count: statusCounts.processing, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Shipped', count: statusCounts.shipped, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Delivered', count: statusCounts.delivered, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Refunded', count: statusCounts.refunded, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => setStatusFilter(card.label === 'All Orders' ? '' : card.label.toLowerCase() as OrderStatus)}
            className={`${card.bg} border border-white/[0.04] rounded-2xl p-4 text-left transition-all duration-200 hover:border-white/[0.08] ${
              (card.label === 'All Orders' && !statusFilter) || card.label.toLowerCase() === statusFilter
                ? 'ring-1 ring-red-500/40 border-red-500/20'
                : ''
            }`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders, customers, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/20 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="appearance-none bg-card border border-white/[0.06] rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/20 transition-all duration-200 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s]})
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200 whitespace-nowrap"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3">
          <span className="text-sm text-red-400 font-medium">
            {selectedIds.size} order{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              className="flex items-center gap-2 bg-muted border border-white/[0.06] rounded-xl px-4 py-2 text-xs text-foreground hover:bg-muted transition-all duration-200"
            >
              <MoreHorizontal className="h-4 w-4" />
              Bulk Actions
              <ChevronDown className="h-3 w-3" />
            </button>
            {bulkMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkUpdateStatus(s)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-white/[0.04] flex items-center gap-2 transition-colors duration-150"
                  >
                    {STATUS_ICON[s]}
                    Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
                <div className="border-t border-white/[0.06]" />
                <button
                  onClick={bulkDelete}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors duration-150"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkMenuOpen(false); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-white/[0.04] rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_1.2fr_0.6fr_0.8fr_0.8fr_0.8fr_40px] gap-4 items-center px-5 py-3 border-b border-white/[0.04] text-xs text-muted-foreground uppercase tracking-wider font-medium">
          <div>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="rounded border-border bg-muted text-red-500 focus:ring-red-500/40 focus:ring-offset-0 cursor-pointer"
            />
          </div>
          <div>Order #</div>
          <div>Customer</div>
          <div>Items</div>
          <div>Total</div>
          <div>Status</div>
          <div>Date</div>
          <div />
        </div>

        {/* Table Body */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">
              {searchQuery || statusFilter ? 'No orders match your search or filters' : 'No orders yet'}
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.id}>
              {/* Row */}
              <div
                className={`grid grid-cols-[40px_1fr_1.2fr_0.6fr_0.8fr_0.8fr_0.8fr_40px] gap-4 items-center px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer ${
                  expandedId === order.id ? 'bg-white/[0.02]' : ''
                } ${selectedIds.has(order.id) ? 'bg-red-500/5' : ''}`}
                onClick={() => toggleExpand(order.id)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggleSelect(order.id)}
                    className="rounded border-border bg-muted text-red-500 focus:ring-red-500/40 focus:ring-offset-0 cursor-pointer"
                  />
                </div>
                <div className="font-mono text-xs font-medium text-foreground tracking-tight">
                  {order.orderNumber}
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium tracking-tight">{order.customer}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </div>
                <div className="font-semibold text-red-400 text-sm tracking-tight">
                  {formatCurrency(order.total)}
                </div>
                <div>
                  <Badge variant={STATUS_VARIANT[order.status]} className="capitalize text-[11px]">
                    {order.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </div>
                <div className="text-muted-foreground">
                  {expandedId === order.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {expandedId === order.id && (
                <div className="bg-card border-b border-white/[0.04] px-8 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Line Items */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-red-400" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Line Items</h4>
                      </div>
                      <div className="bg-card border border-white/[0.04] rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[2fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-2 px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wider border-b border-white/[0.04]">
                          <div>Product</div>
                          <div>SKU</div>
                          <div className="text-right">Qty</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Total</div>
                        </div>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[2fr_0.6fr_0.6fr_0.8fr_0.8fr] gap-2 px-4 py-2.5 border-b border-white/[0.02] last:border-b-0 text-sm"
                          >
                            <div className="text-foreground truncate">{item.name}</div>
                            <div className="text-muted-foreground font-mono text-xs">{item.sku}</div>
                            <div className="text-muted-foreground text-right">{item.qty}</div>
                            <div className="text-muted-foreground text-right">{formatCurrency(item.unitPrice)}</div>
                            <div className="text-foreground text-right font-medium">{formatCurrency(item.qty * item.unitPrice)}</div>
                          </div>
                        ))}
                        <div className="border-t border-white/[0.06] px-4 py-2.5 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Tax</span>
                            <span>{formatCurrency(order.tax)}</span>
                          </div>
                          {order.shipping > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Shipping</span>
                              <span>{formatCurrency(order.shipping)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold text-red-400 pt-1 border-t border-white/[0.04]">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column: Address + Payment */}
                    <div className="space-y-4">
                      {/* Shipping Address */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-red-400" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Shipping Address</h4>
                        </div>
                        <div className="bg-card border border-white/[0.04] rounded-xl p-4 text-sm text-muted-foreground space-y-0.5">
                          <p className="text-foreground font-medium">{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.line1}</p>
                          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="h-4 w-4 text-red-400" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Payment</h4>
                        </div>
                        <div className="bg-card border border-white/[0.04] rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                          <p className="text-foreground font-medium">{order.payment.brand} ending in {order.payment.last4}</p>
                          <p className="text-xs font-mono text-muted-foreground">{order.payment.transactionId}</p>
                        </div>
                      </div>

                      {/* Tracking */}
                      {order.trackingNumber && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="h-4 w-4 text-red-400" />
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Tracking</h4>
                          </div>
                          <div className="bg-card border border-white/[0.04] rounded-xl p-4">
                            <p className="text-sm text-foreground font-mono">{order.trackingNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline + Status Update */}
                    <div className="space-y-4">
                      {/* Status Update */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Update Status</h4>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            className="w-full appearance-none bg-card border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/20 transition-all duration-200 cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-red-400" />
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Timeline</h4>
                        </div>
                        <div className="bg-card border border-white/[0.04] rounded-xl p-4 space-y-3 max-h-[280px] overflow-y-auto">
                          {order.timeline.map((event, idx) => (
                            <div key={event.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === order.timeline.length - 1 ? 'bg-red-400' : 'bg-muted'}`} />
                                {idx < order.timeline.length - 1 && (
                                  <div className="w-px h-full bg-muted mt-1" />
                                )}
                              </div>
                              <div className="pb-3">
                                <p className="text-xs text-foreground font-medium">{event.status}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(event.timestamp)}</p>
                                {event.note && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">{event.note}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between bg-card border border-white/[0.04] rounded-2xl px-6 py-4">
        <p className="text-xs text-muted-foreground tracking-wider">
          Showing {filtered.length} of {orders.length} orders
        </p>
        <p className="text-xs text-muted-foreground tracking-wider">
          Revenue: <span className="text-red-400 font-semibold">{formatCurrency(totalRevenue)}</span>
        </p>
      </div>
    </div>
  );
}