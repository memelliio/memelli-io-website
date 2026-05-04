'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  DataTable,
} from '@memelli/ui';
import type { DataTableColumn } from '@memelli/ui';
import {
  Building2,
  Globe,
  Users,
  Plus,
  ExternalLink,
  DollarSign,
  Briefcase,
  Pencil,
  Check,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage?: string;
  createdAt?: string;
}

interface Organization {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  contacts?: Contact[];
  deals?: Deal[];
  contactCount?: number;
  dealCount?: number;
  revenue?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Real Estate',
  'Retail', 'Manufacturing', 'Education', 'Media', 'Transportation', 'Other',
];

const SIZES = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201+', label: '201+' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function contactName(c: Contact): string {
  if (c.name) return c.name;
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function stageBadgeVariant(stage?: string): 'success' | 'warning' | 'info' | 'primary' | 'muted' {
  switch (stage?.toLowerCase()) {
    case 'won':
    case 'closed won':
      return 'success';
    case 'lost':
    case 'closed lost':
      return 'warning';
    case 'negotiation':
      return 'primary';
    case 'proposal':
      return 'info';
    default:
      return 'muted';
  }
}

/* ------------------------------------------------------------------ */
/*  Contact table columns                                              */
/* ------------------------------------------------------------------ */

const contactColumns: DataTableColumn<Contact>[] = [
  {
    header: 'Name',
    accessor: 'name',
    render: (row) => (
      <span className="font-medium text-foreground">{contactName(row)}</span>
    ),
  },
  {
    header: 'Email',
    accessor: 'email',
    render: (row) => (
      <span className="text-muted-foreground">{row.email ?? '---'}</span>
    ),
  },
  {
    header: 'Phone',
    accessor: 'phone',
    render: (row) => (
      <span className="text-muted-foreground">{row.phone ?? '---'}</span>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  // ---- inline edit state ----
  const [isEditing, setIsEditing] = useState(false);
  const [editing, setEditing] = useState<Partial<Organization>>({});

  // ---- fetch org ----
  const {
    data: org,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      const res = await api.get<{ organization?: Organization } & Organization>(
        `/api/organizations/${orgId}`,
      );
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to fetch organization');
      return res.data.organization ?? res.data;
    },
    enabled: !!orgId,
  });

  // ---- update mutation ----
  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<Organization>) => {
      const res = await api.patch<{ organization?: Organization } & Organization>(
        `/api/organizations/${orgId}`,
        patch,
      );
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to update organization');
      return res.data.organization ?? res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', orgId], updated);
      setIsEditing(false);
      setEditing({});
    },
  });

  // ---- edit handlers ----
  function startEdit() {
    if (!org) return;
    setEditing({ name: org.name, website: org.website, industry: org.industry, size: org.size });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditing({});
  }

  function saveEdit() {
    updateMutation.mutate(editing);
  }

  // ---- derived data ----
  const contacts = org?.contacts ?? [];
  const deals = org?.deals ?? [];
  const contactCount = org?.contactCount ?? contacts.length;
  const dealCount = org?.dealCount ?? deals.length;
  const revenue = org?.revenue ?? deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-card px-8 py-8">
        <PageHeader
          title=""
          breadcrumb={[
            { label: 'Organizations', href: '/dashboard/organizations' },
            { label: 'Loading...' },
          ]}
        />

        {/* Stat cards skeleton */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
        </div>

        {/* Info card skeleton */}
        <div className="mt-6">
          <Skeleton variant="card" />
        </div>

        {/* Table skeleton */}
        <div className="mt-6 space-y-3">
          <Skeleton variant="table-row" count={5} />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error / not found                                                */
  /* ---------------------------------------------------------------- */
  if (isError || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <div className="text-center">
          <p className="text-muted-foreground leading-relaxed">Organization not found.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/dashboard/organizations')}
          >
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-card px-8 py-8">
      {/* Page header with breadcrumb */}
      <PageHeader
        title={isEditing ? '' : org.name}
        subtitle={isEditing ? undefined : (org.industry ?? undefined)}
        breadcrumb={[
          { label: 'Organizations', href: '/dashboard/organizations' },
          { label: org.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEdit} leftIcon={<X className="h-3.5 w-3.5 text-muted-foreground" />}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveEdit}
                  isLoading={updateMutation.isPending}
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  leftIcon={<Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/dashboard/contacts/new?organizationId=${org.id}`)}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add Contact
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Inline edit form */}
      {isEditing && (
        <Card className="mt-6 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Edit Organization</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Website</label>
                <input
                  value={editing.website ?? ''}
                  onChange={(e) => setEditing((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Industry</label>
                <select
                  value={editing.industry ?? ''}
                  onChange={(e) => setEditing((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Size</label>
                <select
                  value={editing.size ?? ''}
                  onChange={(e) => setEditing((f) => ({ ...f, size: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.04] bg-muted px-4 py-3 text-sm text-foreground outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                >
                  <option value="">Select size</option>
                  {SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="rounded-2xl border-white/[0.04] bg-card p-5">
          <CardContent className="flex items-center gap-6 p-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/20">
              <Users className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Contacts</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{contactCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/[0.04] bg-card p-5">
          <CardContent className="flex items-center gap-6 p-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 border border-red-500/20">
              <Briefcase className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Deals</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{dealCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/[0.04] bg-card p-5">
          <CardContent className="flex items-center gap-6 p-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/20">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Revenue</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(revenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization info card */}
      {!isEditing && (
        <Card className="mt-6 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
              <Building2 className="h-6 w-6 text-red-400" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Industry</p>
                <p className="mt-2 text-sm text-foreground">
                  {org.industry ? (
                    <Badge variant="primary">{org.industry}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Company Size</p>
                <p className="mt-2 text-sm text-foreground">
                  {org.size ? (
                    <Badge variant="info">{org.size} employees</Badge>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Website</p>
                {org.website ? (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <Globe className="h-4 w-4" />
                    {org.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Not set</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts table */}
      <Card className="mt-6 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
            <Users className="h-6 w-6 text-muted-foreground" />
            Contacts
            <Badge variant="muted">{contactCount}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/contacts/new?organizationId=${org.id}`)}
            leftIcon={<Plus className="h-3.5 w-3.5 text-muted-foreground" />}
          >
            Add Contact
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable<Contact>
            columns={contactColumns}
            data={contacts}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/dashboard/contacts/${row.id}`)}
            emptyState={
              <div className="py-12 text-center text-muted-foreground leading-relaxed">
                No contacts linked to this organization.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Deals / Activity section */}
      <Card className="mt-6 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
            Deals &amp; Activity
            <Badge variant="muted">{dealCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {deals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground leading-relaxed">
              No deals associated with this organization yet.
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-muted px-6 py-4 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-4">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{deal.title}</p>
                      {deal.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {deal.value != null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(deal.value)}
                      </span>
                    )}
                    <Badge variant={stageBadgeVariant(deal.stage)}>
                      {deal.stage ?? 'Open'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}