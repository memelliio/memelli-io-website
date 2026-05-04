'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Copy, RefreshCw } from 'lucide-react';
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
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED' | 'percentage' | 'fixed';
  value: number;
  usesCount?: number;
  usedCount?: number;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
  storeId?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function genCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function isPercent(type: string) {
  return type === 'PERCENT' || type === 'percentage';
}

function formatDiscount(coupon: Coupon) {
  return isPercent(coupon.type)
    ? `${coupon.value}%`
    : `$${Number(coupon.value).toFixed(2)}`;
}

function usageLabel(coupon: Coupon) {
  const used = coupon.usesCount ?? coupon.usedCount ?? 0;
  const limit = coupon.maxUses ? String(coupon.maxUses) : '\u221E';
  return `${used} / ${limit}`;
}

const statusVariant: Record<string, 'success' | 'muted'> = {
  active: 'success',
  inactive: 'muted',
};

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount ($)' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CouponsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create form state
  const [fCode, setFCode] = useState('');
  const [fType, setFType] = useState('PERCENT');
  const [fValue, setFValue] = useState('');
  const [fMaxUses, setFMaxUses] = useState('');
  const [fExpiry, setFExpiry] = useState<Date | null>(null);
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);

  // Edit form state
  const [eType, setEType] = useState('PERCENT');
  const [eValue, setEValue] = useState('');
  const [eMaxUses, setEMaxUses] = useState('');
  const [eExpiry, setEExpiry] = useState<Date | null>(null);
  const [eActive, setEActive] = useState('true');
  const [eSubmitting, setESubmitting] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- Fetch coupons -------------------------------------------- */
  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['commerce', 'coupons'],
    queryFn: async () => {
      const res = await api.get<any>('/api/commerce/coupons');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Coupon[];
    },
  });

  /* ---- Create --------------------------------------------------- */
  const resetCreateForm = () => {
    setFCode('');
    setFType('PERCENT');
    setFValue('');
    setFMaxUses('');
    setFExpiry(null);
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
      if (fMaxUses) body.maxUses = parseInt(fMaxUses);
      if (fExpiry) body.expiresAt = fExpiry.toISOString();
      const res = await api.post('/api/commerce/coupons', body);
      if (res.error) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ['commerce', 'coupons'] });
      setCreateOpen(false);
      resetCreateForm();
      showToast('Coupon created');
    } catch (e: any) {
      setFError(e.message ?? 'Failed to create coupon');
    } finally {
      setFSubmitting(false);
    }
  };

  /* ---- Edit ----------------------------------------------------- */
  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEType(coupon.type === 'percentage' ? 'PERCENT' : coupon.type === 'fixed' ? 'FIXED' : coupon.type);
    setEValue(String(coupon.value));
    setEMaxUses(coupon.maxUses ? String(coupon.maxUses) : '');
    setEExpiry(coupon.expiresAt ? new Date(coupon.expiresAt) : null);
    setEActive(coupon.isActive ? 'true' : 'false');
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
      if (eMaxUses) body.maxUses = parseInt(eMaxUses);
      if (eExpiry) body.expiresAt = eExpiry.toISOString();
      const res = await api.patch(`/api/commerce/coupons/${editingCoupon.id}`, body);
      if (res.error) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ['commerce', 'coupons'] });
      setEditOpen(false);
      setEditingCoupon(null);
      showToast('Coupon updated');
    } catch (e: any) {
      setEError(e.message ?? 'Failed to update coupon');
    } finally {
      setESubmitting(false);
    }
  };

  /* ---- Copy code ------------------------------------------------ */
  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => showToast(`Copied: ${code}`));
  };

  /* ---- Table columns -------------------------------------------- */
  const columns: DataTableColumn<Coupon>[] = [
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary/80 bg-primary/80/[0.08] border border-primary/20 rounded-xl px-2.5 py-1 text-xs">
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
        <span className="font-semibold text-foreground tracking-tight">{formatDiscount(row)}</span>
      ),
    },
    {
      header: 'Usage',
      accessor: 'usesCount',
      render: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">{usageLabel(row)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => {
        const label = row.isActive ? 'Active' : 'Inactive';
        return (
          <Badge variant={statusVariant[label.toLowerCase()] ?? 'muted'} className="capitalize">
            {label}
          </Badge>
        );
      },
    },
    {
      header: 'Expires',
      accessor: 'expiresAt',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  /* ---- Render --------------------------------------------------- */
  return (
    <div className="min-h-screen bg-card">
      <div className="space-y-8 p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] rounded-2xl bg-card backdrop-blur-2xl border border-white/[0.06] px-4 py-3 text-sm text-foreground shadow-2xl">
            {toast}
          </div>
        )}

        {/* ---- Create Coupon Modal --------------------------------- */}
        <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); resetCreateForm(); }} title="Create Coupon">
          {fError && (
            <div className="mb-6 rounded-2xl bg-primary/80/[0.08] border border-primary/20 p-4 text-sm text-primary/80 backdrop-blur-xl">
              {fError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
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
                <Button type="button" variant="outline" size="sm" onClick={() => setFCode(genCode())} className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted transition-all duration-200">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Auto
                </Button>
              </div>
            </div>

            <Select
              label="Discount Type"
              options={DISCOUNT_TYPE_OPTIONS}
              value={fType}
              onChange={(v) => setFType(v)}
            />

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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Uses"
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }} className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200">
                Cancel
              </Button>
              <Button type="submit" disabled={fSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200">
                {fSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ---- Edit Coupon Modal ----------------------------------- */}
        <Modal
          isOpen={editOpen}
          onClose={() => { setEditOpen(false); setEditingCoupon(null); }}
          title={`Edit Coupon: ${editingCoupon?.code ?? ''}`}
        >
          {eError && (
            <div className="mb-6 rounded-2xl bg-primary/80/[0.08] border border-primary/20 p-4 text-sm text-primary/80 backdrop-blur-xl">
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Uses"
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
              <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditingCoupon(null); }} className="rounded-xl border border-white/[0.06] bg-muted hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200">
                Cancel
              </Button>
              <Button type="submit" disabled={eSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200">
                {eSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ---- Header ---------------------------------------------- */}
        <PageHeader
          title="Coupons"
          subtitle="Manage discount codes"
          breadcrumb={[
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Coupons' },
          ]}
          actions={
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          }
        />

        {/* ---- Table ----------------------------------------------- */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton variant="table-row" count={6} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={coupons}
              isLoading={false}
              rowKey={(row) => row.id}
              onRowClick={openEdit}
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Tag className="h-10 w-10 mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No coupons found</p>
                  <button onClick={() => setCreateOpen(true)} className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors duration-200">
                    Create your first coupon
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}