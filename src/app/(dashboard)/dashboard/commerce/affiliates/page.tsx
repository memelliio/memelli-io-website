'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  DataTable,
  FilterBar,
  Modal,
  Input,
  Select,
  Skeleton,
  EmptyState,
  type DataTableColumn,
  type FilterConfig,
  type FilterValues,
  type BadgeVariant,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Store {
  id: string;
  name: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commission?: number;
  commissionRate?: number;
  clicks?: number;
  conversions?: number;
  totalEarned: number;
  isActive: boolean;
  status?: 'active' | 'pending' | 'suspended';
  createdAt: string;
  storeId?: string;
  stats?: {
    referralCount: number;
    referralRevenue: number;
  };
}

interface Payout {
  id: string;
  amount: number;
  notes?: string;
  paidAt: string;
}

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'suspended', label: 'Suspended' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveStatus(a: Affiliate): 'active' | 'pending' | 'suspended' {
  if (a.status) return a.status;
  return a.isActive ? 'active' : 'pending';
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'success',
  pending: 'warning',
  suspended: 'destructive',
};

function formatCurrency(value: number): string {
  return `$${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d?: string | null): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AffiliatesPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterValues>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  /* ---- Stores for dropdown ---- */
  const [stores, setStores] = useState<Store[]>([]);

  /* ---- Form state ---- */
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fCommission, setFCommission] = useState('10');
  const [fStoreId, setFStoreId] = useState('');
  const [fCode, setFCode] = useState('');
  const [fSubmitting, setFSubmitting] = useState(false);
  const [fError, setFError] = useState<string | null>(null);

  /* ---- Fetch stores for dropdown ---- */
  useEffect(() => {
    (async () => {
      const res = await api.get<any>('/api/commerce/stores');
      if (res.data) {
        const raw = res.data;
        const list: Store[] = Array.isArray(raw) ? raw : (raw.data ?? []);
        setStores(list);
        if (list.length > 0 && !fStoreId) setFStoreId(list[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Fetch affiliates ---- */
  const { data, isLoading } = useQuery({
    queryKey: ['commerce-affiliates', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      const qs = params.toString();
      const res = await api.get<any>(`/api/commerce/affiliates${qs ? `?${qs}` : ''}`);
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw as Affiliate[];
      if (raw?.data && Array.isArray(raw.data)) return raw.data as Affiliate[];
      if (raw?.items && Array.isArray(raw.items)) return raw.items as Affiliate[];
      return [] as Affiliate[];
    },
  });

  const affiliates: Affiliate[] = data ?? [];

  /* ---- Fetch detail + payouts ---- */
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['commerce-affiliate-detail', selectedAffiliate?.id],
    enabled: !!selectedAffiliate,
    queryFn: async () => {
      const [detailRes, payoutsRes] = await Promise.allSettled([
        api.get<any>(`/api/commerce/affiliates/${selectedAffiliate!.id}`),
        api.get<any>(`/api/commerce/affiliates/${selectedAffiliate!.id}/payouts`),
      ]);
      const detail =
        detailRes.status === 'fulfilled'
          ? (detailRes.value.data?.data ?? detailRes.value.data ?? selectedAffiliate)
          : selectedAffiliate;
      const payouts: Payout[] =
        payoutsRes.status === 'fulfilled'
          ? (payoutsRes.value.data?.data ?? payoutsRes.value.data ?? [])
          : [];
      return { detail: detail as Affiliate, payouts };
    },
  });

  /* ---- Client-side status filter ---- */
  const filtered = affiliates.filter((a) => {
    if (filters.status && resolveStatus(a) !== filters.status) return false;
    return true;
  });

  /* ---- Auto-generate affiliate code from name ---- */
  const generateCode = (name: string) => {
    const base = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 12);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return base ? `${base}-${suffix}` : suffix;
  };

  /* ---- Create handler ---- */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFSubmitting(true);
    setFError(null);
    try {
      if (!fStoreId) throw new Error('Please select a store');
      const code = fCode.trim() || generateCode(fName);
      const body = {
        storeId: fStoreId,
        name: fName,
        email: fEmail,
        code,
        commissionRate: parseFloat(fCommission),
      };
      const res = await api.post('/api/commerce/affiliates', body);
      if (res.error) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ['commerce-affiliates'] });
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      setFError(err.message ?? 'Failed to create affiliate');
    } finally {
      setFSubmitting(false);
    }
  };

  const resetForm = () => {
    setFName('');
    setFEmail('');
    setFCommission('10');
    setFCode('');
    if (stores.length > 0) setFStoreId(stores[0].id);
    setFError(null);
  };

  /* ---- Columns ---- */
  const columns: DataTableColumn<Affiliate>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground tracking-tight">{row.name ?? '\u2014'}</p>
          <span className="font-mono text-xs text-primary">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Referral Code',
      accessor: 'code',
      render: (row) => (
        <span className="rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 font-mono text-sm text-primary/80">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Clicks',
      accessor: 'clicks',
      render: (row) => (
        <span className="text-sm text-foreground">{row.clicks ?? row.stats?.referralCount ?? 0}</span>
      ),
    },
    {
      header: 'Conversions',
      accessor: 'conversions',
      render: (row) => (
        <span className="font-semibold text-foreground tracking-tight">{row.conversions ?? 0}</span>
      ),
    },
    {
      header: 'Commission Earned',
      accessor: 'totalEarned',
      render: (row) => (
        <span className="font-semibold text-emerald-400 tracking-tight">{formatCurrency(row.totalEarned)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => {
        const status = resolveStatus(row);
        return (
          <Badge variant={STATUS_VARIANTS[status] ?? 'default'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  /* ---- Detail view ---- */
  const detail = detailData?.detail ?? selectedAffiliate;
  const payouts = detailData?.payouts ?? [];

  return (
    <div className="min-h-screen bg-card">
      <div className="space-y-6 p-8">
        {/* Header */}
        <PageHeader
          title="Affiliates"
          subtitle={`${filtered.length} affiliate partner${filtered.length !== 1 ? 's' : ''}`}
          actions={
            <Button leftIcon={<Plus className="h-4 w-4 text-muted-foreground" />} onClick={() => setShowCreate(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200">
              Create Affiliate
            </Button>
          }
        />

        {/* Filters */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
          <FilterBar
            filters={FILTERS}
            values={filters}
            onChange={(v) => setFilters(v)}
            onClear={() => setFilters({})}
          />
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            <div className="space-y-3">
              <Skeleton variant="line" className="h-10 w-full rounded-xl bg-muted" />
              <Skeleton variant="line" className="h-10 w-full rounded-xl bg-muted" />
              <Skeleton variant="line" className="h-10 w-full rounded-xl bg-muted" />
              <Skeleton variant="line" className="h-10 w-full rounded-xl bg-muted" />
              <Skeleton variant="line" className="h-10 w-full rounded-xl bg-muted" />
            </div>
          </div>
        ) : (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <DataTable
              columns={columns}
              data={filtered}
              isLoading={isLoading}
              rowKey={(row) => row.id}
              onRowClick={(row) => setSelectedAffiliate(row)}
              emptyState={
                <EmptyState
                  icon={<Users className="h-6 w-6 text-muted-foreground" />}
                  title="No affiliates yet"
                  description="Create your first affiliate partner to start tracking referrals."
                  action={{
                    label: 'Create Affiliate',
                    onClick: () => setShowCreate(true),
                  }}
                />
              }
            />
          </div>
        )}

        {/* Create Affiliate Modal */}
        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Create Affiliate">
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            {fError && (
              <div className="mb-4 rounded-2xl bg-primary/10 border border-primary/20 p-3 text-sm text-primary/80 backdrop-blur-xl">
                {fError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              {stores.length > 0 && (
                <Select
                  label="Store"
                  options={stores.map((s) => ({ value: s.id, label: s.name }))}
                  value={fStoreId}
                  onChange={(v) => setFStoreId(v)}
                />
              )}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</label>
                <Input
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="John Smith"
                  className="rounded-xl bg-muted border-white/[0.06] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Email</label>
                <Input
                  required
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="rounded-xl bg-muted border-white/[0.06] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Referral Code</label>
                <Input
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="Auto-generated if empty"
                  className="rounded-xl bg-muted border-white/[0.06] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">Leave blank to auto-generate from name</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Commission Rate (%)</label>
                <Input
                  required
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={fCommission}
                  onChange={(e) => setFCommission(e.target.value)}
                  className="rounded-xl bg-muted border-white/[0.06] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="rounded-xl bg-muted hover:bg-muted border border-white/[0.06] text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={fSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200">
                  {fSubmitting ? 'Creating...' : 'Create Affiliate'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Detail Slide-over Modal */}
        <Modal
          isOpen={!!selectedAffiliate}
          onClose={() => setSelectedAffiliate(null)}
          title="Affiliate Detail"
        >
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton variant="line" className="h-6 w-3/4 rounded-xl bg-muted" />
                <Skeleton variant="line" className="h-4 w-1/2 rounded-xl bg-muted" />
                <Skeleton variant="line" className="h-4 w-2/3 rounded-xl bg-muted" />
                <Skeleton variant="card" className="h-24 w-full rounded-2xl bg-muted" />
              </div>
            ) : detail ? (
              <div className="space-y-6">
                {/* Identity */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Name</p>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{detail.name ?? '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Email</p>
                    <p className="text-muted-foreground leading-relaxed">{detail.email ?? '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Referral Code</p>
                    <span className="rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 font-mono text-sm text-primary/80">
                      {detail.code}
                    </span>
                  </div>
                </div>

                {/* Commission */}
                <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Commission Rate</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {detail.commission ?? detail.commissionRate ?? 0}%
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Clicks</p>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {detail.clicks ?? detail.stats?.referralCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Conversions</p>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{detail.conversions ?? 0}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Total Earned</p>
                  <p className="text-2xl font-semibold tracking-tight text-emerald-400">{formatCurrency(detail.totalEarned)}</p>
                </div>

                {/* Status + Joined */}
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Status</p>
                    <Badge variant={STATUS_VARIANTS[resolveStatus(detail)] ?? 'default'}>
                      {resolveStatus(detail).charAt(0).toUpperCase() + resolveStatus(detail).slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Joined</p>
                    <p className="text-muted-foreground leading-relaxed">{formatDate(detail.createdAt)}</p>
                  </div>
                </div>

                {/* Payout History */}
                <div className="pt-6 border-t border-white/[0.04]">
                  <h4 className="text-2xl font-semibold tracking-tight text-foreground mb-3">Payout History</h4>
                  {payouts.length === 0 ? (
                    <p className="text-muted-foreground leading-relaxed">No payouts recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {payouts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5"
                        >
                          <div>
                            <p className="text-2xl font-semibold tracking-tight text-emerald-400">
                              ${p.amount.toFixed(2)}
                            </p>
                            {p.notes && (
                              <p className="text-muted-foreground leading-relaxed mt-0.5">{p.notes}</p>
                            )}
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {new Date(p.paidAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      </div>
    </div>
  );
}