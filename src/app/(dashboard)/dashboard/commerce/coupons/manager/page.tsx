'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Copy,
  RefreshCw,
  Filter,
  Layers,
  BarChart3,
  Percent,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Hash,
  ShoppingCart,
  Zap,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  PageHeader,
  DataTable,
  Button,
  Modal,
  Input,
  Select,
  Badge,
  Skeleton,
  DatePicker,
} from '@memelli/ui';
import type { DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED' | 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  usesCount?: number;
  usedCount?: number;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
  storeId?: string;
  productIds?: string[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function genBulkCodes(count: number, prefix: string): string[] {
  const codes: string[] = [];
  const set = new Set<string>();
  while (codes.length < count) {
    const suffix = genCode().slice(0, 6);
    const code = prefix ? `${prefix}${suffix}` : suffix;
    if (!set.has(code)) {
      set.add(code);
      codes.push(code);
    }
  }
  return codes;
}

function isPercent(type: string): boolean {
  return type === 'PERCENT' || type === 'percentage';
}

function formatDiscount(coupon: Coupon): string {
  return isPercent(coupon.type)
    ? `${coupon.value}%`
    : `$${Number(coupon.value).toFixed(2)}`;
}

function usageCount(coupon: Coupon): number {
  return coupon.usesCount ?? coupon.usedCount ?? 0;
}

function usageLabel(coupon: Coupon): string {
  const used = usageCount(coupon);
  const limit = coupon.maxUses ? String(coupon.maxUses) : '\u221E';
  return `${used} / ${limit}`;
}

function usagePercent(coupon: Coupon): number {
  const used = usageCount(coupon);
  if (!coupon.maxUses || coupon.maxUses === 0) return 0;
  return Math.min(100, Math.round((used / coupon.maxUses) * 100));
}

function isExpired(coupon: Coupon): boolean {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
}

function getCouponStatus(coupon: Coupon): 'active' | 'expired' | 'inactive' {
  if (isExpired(coupon)) return 'expired';
  if (!coupon.isActive) return 'inactive';
  return 'active';
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'muted'> = {
  active: 'success',
  expired: 'error',
  inactive: 'muted',
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount ($)' },
];

type FilterType = 'all' | 'active' | 'expired' | 'inactive';

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CouponManagerPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  /* ---- UI state --------------------------------------------------- */
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  /* ---- Create form state ------------------------------------------ */
  const [fCode, setFCode] = useState('');
  const [fType, setFType] = useState('PERCENT');
  const [fValue, setFValue] = useState('');
  const [fMinOrder, setFMinOrder] = useState('');
  const [fMaxUses, setFMaxUses] = useState('');
  const [fExpiry, setFExpiry] = useState<Date | null>(null);
  const [fProducts, setFProducts] = useState('');
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);

  /* ---- Edit form state -------------------------------------------- */
  const [eType, setEType] = useState('PERCENT');
  const [eValue, setEValue] = useState('');
  const [eMinOrder, setEMinOrder] = useState('');
  const [eMaxUses, setEMaxUses] = useState('');
  const [eExpiry, setEExpiry] = useState<Date | null>(null);
  const [eActive, setEActive] = useState('true');
  const [eProducts, setEProducts] = useState('');
  const [eSubmitting, setESubmitting] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  /* ---- Bulk generate state ---------------------------------------- */
  const [bPrefix, setBPrefix] = useState('');
  const [bCount, setBCount] = useState('10');
  const [bType, setBType] = useState('PERCENT');
  const [bValue, setBValue] = useState('');
  const [bMaxUses, setBMaxUses] = useState('');
  const [bExpiry, setBExpiry] = useState<Date | null>(null);
  const [bSubmitting, setBSubmitting] = useState(false);
  const [bError, setBError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- Fetch coupons ---------------------------------------------- */
  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['commerce', 'coupons', 'manager'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/coupons');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Coupon[];
    },
  });

  /* ---- Filtered coupons ------------------------------------------- */
  const filteredCoupons = useMemo(() => {
    if (activeFilter === 'all') return coupons;
    return coupons.filter((c) => getCouponStatus(c) === activeFilter);
  }, [coupons, activeFilter]);

  /* ---- Analytics -------------------------------------------------- */
  const analytics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => getCouponStatus(c) === 'active').length;
    const expired = coupons.filter((c) => getCouponStatus(c) === 'expired').length;
    const inactive = coupons.filter((c) => getCouponStatus(c) === 'inactive').length;
    const totalUses = coupons.reduce((sum, c) => sum + usageCount(c), 0);
    const percentCoupons = coupons.filter((c) => isPercent(c.type)).length;
    const fixedCoupons = total - percentCoupons;
    const avgDiscount = total > 0
      ? coupons.reduce((sum, c) => sum + c.value, 0) / total
      : 0;
    const mostUsed = coupons.length > 0
      ? [...coupons].sort((a, b) => usageCount(b) - usageCount(a))[0]
      : null;
    const highestValue = coupons.length > 0
      ? [...coupons].sort((a, b) => b.value - a.value)[0]
      : null;

    return {
      total,
      active,
      expired,
      inactive,
      totalUses,
      percentCoupons,
      fixedCoupons,
      avgDiscount: avgDiscount.toFixed(1),
      mostUsed,
      highestValue,
    };
  }, [coupons]);

  /* ---- Create ----------------------------------------------------- */
  const resetCreateForm = () => {
    setFCode('');
    setFType('PERCENT');
    setFValue('');
    setFMinOrder('');
    setFMaxUses('');
    setFExpiry(null);
    setFProducts('');
    setFError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFSubmitting(true);
    setFError(null);
    try {
      const body: Record<string, any> = {
        code: fCode,
        type: fType,
        value: parseFloat(fValue),
      };
      if (fMinOrder) body.minOrderAmount = parseFloat(fMinOrder);
      if (fMaxUses) body.maxUses = parseInt(fMaxUses);
      if (fExpiry) body.expiresAt = fExpiry.toISOString();
      if (fProducts.trim()) {
        body.productIds = fProducts.split(',').map((s) => s.trim()).filter(Boolean);
      }
      const res = await api.post('/api/commerce/coupons', body);
      if (res.error) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ['commerce', 'coupons', 'manager'] });
      setCreateOpen(false);
      resetCreateForm();
      showToast('Coupon created');
    } catch (err: any) {
      setFError(err.message ?? 'Failed to create coupon');
    } finally {
      setFSubmitting(false);
    }
  };

  /* ---- Edit ------------------------------------------------------- */
  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEType(coupon.type === 'percentage' ? 'PERCENT' : coupon.type === 'fixed' ? 'FIXED' : coupon.type);
    setEValue(String(coupon.value));
    setEMinOrder(coupon.minOrderAmount ? String(coupon.minOrderAmount) : '');
    setEMaxUses(coupon.maxUses ? String(coupon.maxUses) : '');
    setEExpiry(coupon.expiresAt ? new Date(coupon.expiresAt) : null);
    setEActive(coupon.isActive ? 'true' : 'false');
    setEProducts(coupon.productIds?.join(', ') ?? '');
    setEError(null);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    setESubmitting(true);
    setEError(null);
    try {
      const body: Record<string, any> = {
        type: eType,
        value: parseFloat(eValue),
        isActive: eActive === 'true',
      };
      if (eMinOrder) body.minOrderAmount = parseFloat(eMinOrder);
      if (eMaxUses) body.maxUses = parseInt(eMaxUses);
      if (eExpiry) body.expiresAt = eExpiry.toISOString();
      if (eProducts.trim()) {
        body.productIds = eProducts.split(',').map((s) => s.trim()).filter(Boolean);
      }
      const res = await api.patch(`/api/commerce/coupons/${editingCoupon.id}`, body);
      if (res.error) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ['commerce', 'coupons', 'manager'] });
      setEditOpen(false);
      setEditingCoupon(null);
      showToast('Coupon updated');
    } catch (err: any) {
      setEError(err.message ?? 'Failed to update coupon');
    } finally {
      setESubmitting(false);
    }
  };

  /* ---- Bulk generate ---------------------------------------------- */
  const resetBulkForm = () => {
    setBPrefix('');
    setBCount('10');
    setBType('PERCENT');
    setBValue('');
    setBMaxUses('');
    setBExpiry(null);
    setBError(null);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBSubmitting(true);
    setBError(null);
    try {
      const count = parseInt(bCount);
      if (isNaN(count) || count < 1 || count > 500) {
        throw new Error('Count must be between 1 and 500');
      }
      const codes = genBulkCodes(count, bPrefix.toUpperCase());
      let created = 0;
      const batchSize = 5;
      for (let i = 0; i < codes.length; i += batchSize) {
        const batch = codes.slice(i, i + batchSize);
        const promises = batch.map((code) => {
          const body: Record<string, any> = {
            code,
            type: bType,
            value: parseFloat(bValue),
          };
          if (bMaxUses) body.maxUses = parseInt(bMaxUses);
          if (bExpiry) body.expiresAt = bExpiry.toISOString();
          return api.post('/api/commerce/coupons', body).then(() => { created++; });
        });
        await Promise.allSettled(promises);
      }
      queryClient.invalidateQueries({ queryKey: ['commerce', 'coupons', 'manager'] });
      setBulkOpen(false);
      resetBulkForm();
      showToast(`${created} coupons generated`);
    } catch (err: any) {
      setBError(err.message ?? 'Failed to generate coupons');
    } finally {
      setBSubmitting(false);
    }
  };

  /* ---- Copy code -------------------------------------------------- */
  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => showToast(`Copied: ${code}`));
  };

  /* ---- Table columns ---------------------------------------------- */
  const columns: DataTableColumn<Coupon>[] = [
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-red-300 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-2.5 py-1 text-xs tracking-wide">
            {row.code}
          </span>
          <button
            onClick={(e) => copyCode(row.code, e)}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            title="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: 'Discount',
      accessor: 'value',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/[0.08] border border-red-500/20">
            {isPercent(row.type) ? (
              <Percent className="h-3 w-3 text-red-400" />
            ) : (
              <DollarSign className="h-3 w-3 text-red-400" />
            )}
          </div>
          <span className="font-semibold text-foreground tracking-tight">{formatDiscount(row)}</span>
        </div>
      ),
    },
    {
      header: 'Min Order',
      accessor: 'minOrderAmount' as any,
      render: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.minOrderAmount ? `$${Number(row.minOrderAmount).toFixed(2)}` : '\u2014'}
        </span>
      ),
    },
    {
      header: 'Usage',
      accessor: 'usesCount',
      render: (row) => {
        const pct = usagePercent(row);
        return (
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground tabular-nums">{usageLabel(row)}</span>
            {row.maxUses && row.maxUses > 0 && (
              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pct >= 90 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => {
        const status = getCouponStatus(row);
        return (
          <Badge variant={STATUS_VARIANT[status] ?? 'muted'} className="capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Expires',
      accessor: 'expiresAt',
      render: (row) => {
        if (!row.expiresAt) return <span className="text-xs text-muted-foreground">\u2014</span>;
        const d = new Date(row.expiresAt);
        const exp = isExpired(row);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className={`h-3 w-3 ${exp ? 'text-red-400/60' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${exp ? 'text-red-400/60 line-through' : 'text-muted-foreground'}`}>
              {d.toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Products',
      accessor: 'productIds' as any,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.productIds && row.productIds.length > 0
            ? `${row.productIds.length} product${row.productIds.length !== 1 ? 's' : ''}`
            : 'All'}
        </span>
      ),
    },
  ];

  /* ---- Filter tabs ------------------------------------------------ */
  const filterTabs: { key: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', count: analytics.total, icon: <Tag className="h-3.5 w-3.5" /> },
    { key: 'active', label: 'Active', count: analytics.active, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { key: 'expired', label: 'Expired', count: analytics.expired, icon: <XCircle className="h-3.5 w-3.5" /> },
    { key: 'inactive', label: 'Inactive', count: analytics.inactive, icon: <Filter className="h-3.5 w-3.5" /> },
  ];

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className="min-h-screen bg-card">
      <div className="space-y-8 p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] rounded-2xl bg-card backdrop-blur-2xl border border-white/[0.06] px-4 py-3 text-sm text-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            {toast}
          </div>
        )}

        {/* ---- Header ------------------------------------------------ */}
        <PageHeader
          title="Coupon Manager"
          subtitle="Create, manage, and analyze discount codes"
          breadcrumb={[
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Coupons', href: '/dashboard/commerce/coupons' },
            { label: 'Manager' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setAnalyticsOpen(true)}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-foreground transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkOpen(true)}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-foreground transition-all duration-200"
              >
                <Layers className="h-4 w-4 mr-2" />
                Bulk Generate
              </Button>
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          }
        />

        {/* ---- Stats cards ------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Coupons', value: analytics.total, icon: <Tag className="h-4 w-4" />, color: 'text-red-400' },
            { label: 'Active', value: analytics.active, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-400' },
            { label: 'Total Uses', value: analytics.totalUses, icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-400' },
            { label: 'Avg Discount', value: `${analytics.avgDiscount}`, icon: <Percent className="h-4 w-4" />, color: 'text-amber-400' },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                <div className={`${color} opacity-60`}>{icon}</div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* ---- Filter tabs ------------------------------------------- */}
        <div className="flex items-center gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeFilter === tab.key
                  ? 'bg-red-600/20 border border-red-500/30 text-red-300'
                  : 'border border-white/[0.04] bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs tabular-nums ${activeFilter === tab.key ? 'text-red-400/80' : 'text-muted-foreground'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ---- Table ------------------------------------------------- */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton variant="table-row" count={6} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCoupons}
              isLoading={false}
              rowKey={(row) => row.id}
              onRowClick={openEdit}
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Tag className="h-10 w-10 mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {activeFilter !== 'all' ? `No ${activeFilter} coupons found` : 'No coupons found'}
                  </p>
                  {activeFilter === 'all' && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      Create your first coupon
                    </button>
                  )}
                </div>
              }
            />
          )}
        </div>

        {/* ============================================================ */}
        {/*  CREATE COUPON MODAL                                          */}
        {/* ============================================================ */}
        <Modal
          isOpen={createOpen}
          onClose={() => { setCreateOpen(false); resetCreateForm(); }}
          title="Create Coupon"
        >
          {fError && (
            <div className="mb-6 rounded-2xl bg-red-500/[0.08] border border-red-500/20 p-4 text-sm text-red-300 backdrop-blur-xl">
              {fError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Code */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Code</label>
              <div className="flex gap-3">
                <Input
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="flex-1 font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFCode(genCode())}
                  className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted transition-all duration-200"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Auto
                </Button>
              </div>
            </div>

            {/* Type */}
            <Select
              label="Discount Type"
              options={DISCOUNT_TYPE_OPTIONS}
              value={fType}
              onChange={(v) => setFType(v)}
            />

            {/* Value */}
            <Input
              label={`Value ${fType === 'PERCENT' ? '(%)' : '($)'}`}
              type="number"
              min={0}
              step={fType === 'PERCENT' ? 1 : 0.01}
              max={fType === 'PERCENT' ? 100 : undefined}
              value={fValue}
              onChange={(e) => setFValue(e.target.value)}
              placeholder={fType === 'PERCENT' ? '20' : '10.00'}
              required
            />

            {/* Min Order Amount */}
            <Input
              label="Minimum Order Amount ($)"
              type="number"
              min={0}
              step={0.01}
              value={fMinOrder}
              onChange={(e) => setFMinOrder(e.target.value)}
              placeholder="No minimum"
            />

            {/* Max Uses & Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Usage Limit"
                type="number"
                min={0}
                value={fMaxUses}
                onChange={(e) => setFMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
              <DatePicker
                value={fExpiry}
                onChange={setFExpiry}
                placeholder="No expiry"
                minDate={new Date()}
              />
            </div>

            {/* Products */}
            <Input
              label="Product IDs (comma-separated, leave empty for all)"
              value={fProducts}
              onChange={(e) => setFProducts(e.target.value)}
              placeholder="product-id-1, product-id-2"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateOpen(false); resetCreateForm(); }}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={fSubmitting}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                {fSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ============================================================ */}
        {/*  EDIT COUPON MODAL                                            */}
        {/* ============================================================ */}
        <Modal
          isOpen={editOpen}
          onClose={() => { setEditOpen(false); setEditingCoupon(null); }}
          title={`Edit Coupon: ${editingCoupon?.code ?? ''}`}
        >
          {eError && (
            <div className="mb-6 rounded-2xl bg-red-500/[0.08] border border-red-500/20 p-4 text-sm text-red-300 backdrop-blur-xl">
              {eError}
            </div>
          )}
          <form onSubmit={handleEdit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Code</label>
              <Input value={editingCoupon?.code ?? ''} disabled className="font-mono opacity-60" />
            </div>

            <Select
              label="Discount Type"
              options={DISCOUNT_TYPE_OPTIONS}
              value={eType}
              onChange={(v) => setEType(v)}
            />

            <Input
              label={`Value ${eType === 'PERCENT' ? '(%)' : '($)'}`}
              type="number"
              min={0}
              step={eType === 'PERCENT' ? 1 : 0.01}
              max={eType === 'PERCENT' ? 100 : undefined}
              value={eValue}
              onChange={(e) => setEValue(e.target.value)}
              required
            />

            <Input
              label="Minimum Order Amount ($)"
              type="number"
              min={0}
              step={0.01}
              value={eMinOrder}
              onChange={(e) => setEMinOrder(e.target.value)}
              placeholder="No minimum"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Usage Limit"
                type="number"
                min={0}
                value={eMaxUses}
                onChange={(e) => setEMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
              <DatePicker
                value={eExpiry}
                onChange={setEExpiry}
                placeholder="No expiry"
              />
            </div>

            <Input
              label="Product IDs (comma-separated)"
              value={eProducts}
              onChange={(e) => setEProducts(e.target.value)}
              placeholder="All products"
            />

            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={eActive}
              onChange={(v) => setEActive(v)}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditOpen(false); setEditingCoupon(null); }}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={eSubmitting}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                {eSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ============================================================ */}
        {/*  BULK GENERATE MODAL                                          */}
        {/* ============================================================ */}
        <Modal
          isOpen={bulkOpen}
          onClose={() => { setBulkOpen(false); resetBulkForm(); }}
          title="Bulk Generate Coupons"
        >
          {bError && (
            <div className="mb-6 rounded-2xl bg-red-500/[0.08] border border-red-500/20 p-4 text-sm text-red-300 backdrop-blur-xl">
              {bError}
            </div>
          )}
          <form onSubmit={handleBulkGenerate} className="space-y-6">
            <div className="rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 p-4 text-sm text-amber-300/80">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 mt-0.5 text-amber-400/60" />
                <p>Generate multiple unique coupon codes at once. Codes are auto-generated with an optional prefix.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code Prefix"
                value={bPrefix}
                onChange={(e) => setBPrefix(e.target.value.toUpperCase())}
                placeholder="SUMMER"
              />
              <Input
                label="Number of Coupons"
                type="number"
                min={1}
                max={500}
                value={bCount}
                onChange={(e) => setBCount(e.target.value)}
                placeholder="10"
                required
              />
            </div>

            <Select
              label="Discount Type"
              options={DISCOUNT_TYPE_OPTIONS}
              value={bType}
              onChange={(v) => setBType(v)}
            />

            <Input
              label={`Value ${bType === 'PERCENT' ? '(%)' : '($)'}`}
              type="number"
              min={0}
              step={bType === 'PERCENT' ? 1 : 0.01}
              max={bType === 'PERCENT' ? 100 : undefined}
              value={bValue}
              onChange={(e) => setBValue(e.target.value)}
              placeholder={bType === 'PERCENT' ? '20' : '10.00'}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Usage Limit (per code)"
                type="number"
                min={0}
                value={bMaxUses}
                onChange={(e) => setBMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
              <DatePicker
                value={bExpiry}
                onChange={setBExpiry}
                placeholder="No expiry"
                minDate={new Date()}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setBulkOpen(false); resetBulkForm(); }}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bSubmitting}
                className="rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                {bSubmitting ? 'Generating...' : `Generate ${bCount || 0} Coupons`}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ============================================================ */}
        {/*  ANALYTICS MODAL                                              */}
        {/* ============================================================ */}
        <Modal
          isOpen={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          title="Coupon Analytics"
        >
          <div className="space-y-6">
            {/* Overview grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Coupons', value: analytics.total, icon: <Tag className="h-4 w-4 text-red-400" /> },
                { label: 'Active', value: analytics.active, icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
                { label: 'Expired', value: analytics.expired, icon: <XCircle className="h-4 w-4 text-red-400/60" /> },
                { label: 'Inactive', value: analytics.inactive, icon: <Filter className="h-4 w-4 text-muted-foreground" /> },
                { label: 'Total Redemptions', value: analytics.totalUses, icon: <TrendingUp className="h-4 w-4 text-blue-400" /> },
                { label: 'Avg Discount', value: analytics.avgDiscount, icon: <Percent className="h-4 w-4 text-amber-400" /> },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.04] bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {/* Type breakdown */}
            <div className="rounded-xl border border-white/[0.04] bg-card p-4">
              <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Discount Type Breakdown</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">Percentage</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{analytics.percentCoupons}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-500"
                      style={{ width: analytics.total > 0 ? `${(analytics.percentCoupons / analytics.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">Fixed Amount</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{analytics.fixedCoupons}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: analytics.total > 0 ? `${(analytics.fixedCoupons / analytics.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top coupons */}
            <div className="grid grid-cols-2 gap-3">
              {analytics.mostUsed && (
                <div className="rounded-xl border border-white/[0.04] bg-card p-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Most Used</h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-300 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-2 py-0.5 text-xs">
                      {analytics.mostUsed.code}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1 tabular-nums">
                    {usageCount(analytics.mostUsed)} uses
                  </p>
                </div>
              )}
              {analytics.highestValue && (
                <div className="rounded-xl border border-white/[0.04] bg-card p-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Highest Value</h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-300 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-2 py-0.5 text-xs">
                      {analytics.highestValue.code}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {formatDiscount(analytics.highestValue)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setAnalyticsOpen(false)}
                className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
