'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  Globe,
  Cpu,
  Calendar,
  Clock,
  Mail,
  Shield,
  ArrowUpCircle,
  Ban,
  Trash2,
  UserCog,
  X,
  ArrowUpDown,
  AlertCircle,
  Inbox
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: string;
  status: 'active' | 'trial' | 'suspended' | 'churned';
  sitesCount: number;
  enginesCount: number;
  createdAt: string;
  lastActivity: string;
}

type StatusFilter = 'all' | 'active' | 'trial' | 'suspended' | 'churned';
type SortField = 'name' | 'createdAt' | 'lastActivity' | 'sitesCount';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<Tenant['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  trial: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/30',
  churned: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
};

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
  Starter: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Pro: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Enterprise: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
};

function planColor(plan: string): string {
  return PLAN_COLORS[plan] ?? PLAN_COLORS.Free;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TenantsPage() {
  const api = useApi();

  /* Data */
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* UI state */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  /* Fetch */
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<{ data: Tenant[]; meta: { total: number; page: number; perPage: number } }>('/api/admin/tenants');
    if (res.error) {
      setError(res.error);
    } else {
      // Backend returns paginated { data, meta }; useApi preserves envelope when meta is present
      const payload = res.data;
      setTenants(payload?.data ?? []);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Derived plans list */
  const allPlans = Array.from(new Set(tenants.map((t) => t.plan))).sort();

  /* Filtered + sorted */
  const filtered = tenants
    .filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (planFilter !== 'all' && t.plan !== planFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.ownerEmail.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sitesCount':
          return b.sitesCount - a.sitesCount;
        case 'lastActivity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  /* Status filter options */
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'trial', label: 'Trial' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'churned', label: 'Churned' },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'createdAt', label: 'Created' },
    { value: 'lastActivity', label: 'Last Active' },
    { value: 'name', label: 'Name' },
    { value: 'sitesCount', label: 'Sites' },
  ];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Main content */}
      <div className={`flex-1 transition-all ${selectedTenant ? 'mr-[420px]' : ''}`}>
        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* ---- Header ---- */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
              {!loading && (
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/30">
                  {filtered.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] pl-9 pr-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                />
              </div>

              {/* Add Tenant */}
              <button className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-red-500 transition-colors">
                <Plus className="h-4 w-4" />
                Add Tenant
              </button>
            </div>
          </div>

          {/* ---- Filter Bar ---- */}
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-1">Status</span>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-red-600 text-[hsl(var(--foreground))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-[hsl(var(--muted))]" />

            {/* Plan filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Plan</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 text-xs text-[hsl(var(--foreground))] outline-none focus:border-red-500/50"
              >
                <option value="all">All Plans</option>
                {allPlans.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-5 w-px bg-[hsl(var(--muted))]" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="h-7 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 text-xs text-[hsl(var(--foreground))] outline-none focus:border-red-500/50"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---- Content ---- */}
          <div className="mt-6">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
                <LoadingGlobe size="lg" />
                <p className="mt-3 text-sm">Loading tenants...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchTenants}
                  className="mt-4 rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
                <Inbox className="h-10 w-10" />
                <p className="mt-3 text-sm font-medium">
                  {tenants.length === 0 ? 'No tenants yet' : 'No tenants match your filters'}
                </p>
                {tenants.length > 0 && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                      setPlanFilter('all');
                    }}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Table */}
            {!loading && !error && filtered.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Tenant</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Owner</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Plan</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Sites</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-center">Engines</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Created</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Last Active</th>
                      <th className="px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tenant) => (
                      <tr
                        key={tenant.id}
                        onClick={() => setSelectedTenant(tenant)}
                        className={`cursor-pointer border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--muted))] ${
                          selectedTenant?.id === tenant.id ? 'bg-[hsl(var(--muted))] backdrop-blur-xl' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            <span className="font-medium text-[hsl(var(--foreground))]">{tenant.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{tenant.ownerEmail}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${planColor(tenant.plan)}`}
                          >
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[tenant.status]}`}
                          >
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{tenant.sitesCount}</td>
                        <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{tenant.enginesCount}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(tenant.createdAt)}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{relativeTime(tenant.lastActivity)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedTenant(tenant)}
                              className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                              title="View"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400"
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Detail Panel ---- */}
      {selectedTenant && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col bg-[hsl(var(--background))] shadow-2xl">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
            <h2 className="text-lg font-semibold">{selectedTenant.name}</h2>
            <button
              onClick={() => setSelectedTenant(null)}
              className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Status + Plan */}
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[selectedTenant.status]}`}
              >
                {selectedTenant.status}
              </span>
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${planColor(selectedTenant.plan)}`}
              >
                {selectedTenant.plan}
              </span>
            </div>

            {/* Owner info */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Owner</h3>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
                <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <span>{selectedTenant.ownerEmail}</span>
              </div>
            </div>

            {/* Products / Entitlements */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Products &amp; Entitlements
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Plan: {selectedTenant.plan}
                </span>
                <span className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))]">
                  {selectedTenant.enginesCount} engine{selectedTenant.enginesCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Site Inventory */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Site Inventory
              </h3>
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
                <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <span>
                  {selectedTenant.sitesCount} site{selectedTenant.sitesCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span>Created {formatDate(selectedTenant.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span>Last active {relativeTime(selectedTenant.lastActivity)}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3 text-center">
                <Globe className="mx-auto h-5 w-5 text-blue-400" />
                <p className="mt-1 text-lg font-bold">{selectedTenant.sitesCount}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Sites</p>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3 text-center">
                <Cpu className="mx-auto h-5 w-5 text-violet-400" />
                <p className="mt-1 text-lg font-bold">{selectedTenant.enginesCount}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Engines</p>
              </div>
            </div>
          </div>

          {/* Panel footer: quick actions */}
          <div className="border-t border-[hsl(var(--border))] px-5 py-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                <ArrowUpCircle className="h-3.5 w-3.5 text-blue-400" />
                Upgrade Plan
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                Impersonate
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
                <Ban className="h-3.5 w-3.5" />
                Suspend
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
