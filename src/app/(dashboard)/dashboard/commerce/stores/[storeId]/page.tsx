'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Save,
  Plus,
  Box,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Select,
  MetricTile,
  DataTable,
  type DataTableColumn,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
  currency: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  _count?: { products: number; orders: number };
}

interface Product {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  sku?: string;
  inventory?: number;
  status: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  contact?: { firstName?: string; lastName?: string; email?: string };
}

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  DRAFT: 'warning',
  ARCHIVED: 'destructive',
};

const orderStatusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive' | 'primary'> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

const CURRENCIES = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'CAD', value: 'CAD' },
  { label: 'AUD', value: 'AUD' },
];

function unwrapData<T>(res: { data: T | null }): T | null {
  if (!res.data) return null;
  const d = res.data as any;
  return d.data ?? d;
}

function unwrapArray<T>(res: { data: T | null }): T[] {
  if (!res.data) return [];
  const d = res.data as any;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return [];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const api = useApi();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    const [storeRes, prodsRes, ordersRes, analyticsRes] = await Promise.all([
      api.get<any>(`/api/commerce/stores/${storeId}`),
      api.get<any>(`/api/commerce/products?storeId=${storeId}`),
      api.get<any>(`/api/commerce/orders?storeId=${storeId}&perPage=10`),
      api.get<any>(`/api/commerce/stores/${storeId}/analytics`),
    ]);

    const s = unwrapData<Store>(storeRes);
    if (s) {
      setStore(s);
      setEditName(s.name);
      setEditDescription(s.description ?? '');
      setEditCurrency(s.currency);
      setEditAddress(s.address ?? '');
      setEditPhone(s.phone ?? '');
      setEditEmail(s.email ?? '');
    }
    setProducts(unwrapArray<Product>(prodsRes));
    setOrders(unwrapArray<Order>(ordersRes));
    setAnalytics(unwrapData<Analytics>(analyticsRes));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    setSaveMsg(null);

    const body: Record<string, any> = {
      name: editName,
      description: editDescription || undefined,
      currency: editCurrency,
      address: editAddress || undefined,
      phone: editPhone || undefined,
      email: editEmail || undefined,
    };

    const res = await api.patch<any>(`/api/commerce/stores/${storeId}`, body);
    if (res.error) {
      setSaveMsg(res.error);
    } else {
      const updated = unwrapData<Store>(res);
      if (updated) setStore(updated);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2000);
    }
    setSaving(false);
  };

  /* Product columns */
  const productColumns: DataTableColumn<Product>[] = [
    { header: 'Name', accessor: 'name', render: (r) => <span className="font-medium text-white/90">{r.name}</span> },
    {
      header: 'Type',
      accessor: 'type',
      render: (r) => (
        <Badge variant="primary" className="capitalize">
          {r.type.toLowerCase()}
        </Badge>
      ),
    },
    { header: 'Price', accessor: 'basePrice', render: (r) => <span className="text-white/70">{fmtCurrency(Number(r.basePrice))}</span> },
    { header: 'SKU', accessor: 'sku', render: (r) => <span className="font-mono text-xs text-white/30">{r.sku || '---'}</span> },
    { header: 'Inventory', accessor: 'inventory', render: (r) => <span className="text-white/40">{r.inventory ?? '---'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'success' : 'muted'} className="capitalize">
          {r.status.toLowerCase()}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/commerce/stores"
          className="rounded-2xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground backdrop-blur-xl transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">{store?.name ?? 'Store'}</h1>
          <p className="text-sm text-white/30 mt-0.5 font-mono">{store?.slug}</p>
        </div>
        {store && (
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[store.status] ?? 'muted'} className="capitalize">
              {store.status.toLowerCase()}
            </Badge>
            <Badge variant="primary">{store.currency}</Badge>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Revenue"
          value={fmtCurrency(analytics?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricTile
          label="Orders"
          value={analytics?.totalOrders ?? 0}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <MetricTile
          label="Active Products"
          value={analytics?.activeProducts ?? 0}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg Order Value"
          value={
            analytics && analytics.totalOrders > 0
              ? fmtCurrency(analytics.totalRevenue / analytics.totalOrders)
              : '$0.00'
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultTab="settings">
        <TabList>
          <Tab id="settings">Settings</Tab>
          <Tab id="products">Products ({products.length})</Tab>
          <Tab id="orders">Orders ({orders.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Settings Tab */}
          <TabPanel id="settings">
            <Card className="mt-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Store Settings</CardTitle>
                <div className="flex items-center gap-2">
                  {saveMsg && (
                    <span
                      className={`text-xs ${saveMsg === 'Saved' ? 'text-emerald-400' : 'text-primary'}`}
                    >
                      {saveMsg}
                    </span>
                  )}
                  <Button size="sm" onClick={handleSave} isLoading={saving}>
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/60">Store Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/60">Currency</label>
                    <Select
                      value={editCurrency}
                      onChange={(val) => setEditCurrency(val)}
                      options={CURRENCIES}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder-white/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/60">Address</label>
                    <Input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/60">Phone</label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/60">Email</label>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Products Tab */}
          <TabPanel id="products">
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg tracking-tight font-semibold text-foreground">Products</h3>
                <Link
                  href={`/dashboard/commerce/stores/${storeId}/products`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Link>
              </div>
              <DataTable<Product>
                columns={productColumns}
                data={products}
                rowKey={(r) => r.id}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <Box className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No products in this store</p>
                  </div>
                }
              />
            </div>
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel id="orders">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {orders.map((order) => {
                      const contactName = order.contact
                        ? `${order.contact.firstName ?? ''} ${order.contact.lastName ?? ''}`.trim()
                        : null;
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.04] transition-all duration-200"
                        >
                          <div>
                            <p className="text-sm font-medium text-white/90">
                              {contactName || `Order ${order.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-white/30 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white/80">
                              {fmtCurrency(Number(order.total))}
                            </span>
                            <Badge
                              variant={orderStatusVariant[order.status] ?? 'muted'}
                              className="capitalize"
                            >
                              {order.status.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
