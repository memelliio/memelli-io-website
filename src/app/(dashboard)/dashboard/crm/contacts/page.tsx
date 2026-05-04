'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  DataTable,
  FilterBar,
  type DataTableColumn,
  type FilterConfig,
  type FilterValues,
  type BadgeVariant,
  EmptyState,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CRMContact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  source?: string | null;
  score?: number | null;
  createdAt: string;
  deals?: Array<{ id: string; value?: number; status: string }>;
  activities?: Array<{ id: string; occurredAt: string }>;
}

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const FILTERS: FilterConfig[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'PERSON', label: 'Person' },
      { value: 'COMPANY', label: 'Company' },
    ],
  },
  {
    key: 'tag',
    label: 'Tag',
    type: 'text',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getName(c: CRMContact): string {
  if (c.type === 'COMPANY') return c.companyName ?? '\u2014';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '\u2014';
}

function getDealsCount(c: CRMContact): number {
  return c.deals?.length ?? 0;
}

function getTotalDealValue(c: CRMContact): number {
  return (c.deals ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0);
}

function getLastActivity(c: CRMContact): string | null {
  if (!c.activities || c.activities.length === 0) return null;
  return c.activities[0].occurredAt;
}

function formatDate(d?: string | null): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  if (value === 0) return '\u2014';
  return `$${value.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CRMContactsPage() {
  const api = useApi();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterValues>({});
  const [page, setPage] = useState(1);
  const perPage = 25;

  /* ---- Fetch ---- */
  const { data, isLoading } = useQuery({
    queryKey: ['crm-contacts', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (filters.type) params.set('type', filters.type);
      if (filters.tag) params.set('tag', filters.tag);
      const res = await api.get<any>(`/api/contacts?${params}`);
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw as CRMContact[];
      if (raw?.data && Array.isArray(raw.data)) return raw.data as CRMContact[];
      if (raw?.items && Array.isArray(raw.items)) return raw.items as CRMContact[];
      return [] as CRMContact[];
    },
  });

  const contacts: CRMContact[] = data ?? [];

  /* ---- Columns ---- */
  const columns: DataTableColumn<CRMContact>[] = [
    {
      header: 'Name',
      accessor: 'firstName',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{getName(row)}</p>
          {row.type === 'PERSON' && row.companyName && (
            <p className="text-xs text-muted-foreground">{row.companyName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.email ?? '\u2014'}</span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.phone ?? '\u2014'}</span>
      ),
    },
    {
      header: 'Company',
      accessor: 'companyName',
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.companyName ?? '\u2014'}</span>
      ),
    },
    {
      header: 'Deals',
      accessor: 'id',
      render: (row) => (
        <span className="font-semibold text-primary">{getDealsCount(row)}</span>
      ),
    },
    {
      header: 'Total Value',
      accessor: 'id',
      render: (row) => {
        const value = getTotalDealValue(row);
        return (
          <span className={value > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
            {formatCurrency(value)}
          </span>
        );
      },
    },
    {
      header: 'Tags',
      accessor: 'tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
          {row.tags.length > 2 && (
            <Badge variant="default">+{row.tags.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Last Activity',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(getLastActivity(row))}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-card min-h-screen">
      <div className="space-y-6 p-8">
        <PageHeader
          title="CRM Contacts"
          subtitle={`${contacts.length} contact${contacts.length !== 1 ? 's' : ''} with deal relationships`}
          actions={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/dashboard/crm/contacts/new')}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
            >
              Add Contact
            </Button>
          }
        />

        <FilterBar
          filters={FILTERS}
          values={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1);
          }}
          onClear={() => {
            setFilters({});
            setPage(1);
          }}
        />

        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <DataTable
            columns={columns}
            data={contacts}
            isLoading={isLoading}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
            emptyState={
              <EmptyState
                icon={<Users className="h-6 w-6 text-muted-foreground" />}
                title="No contacts yet"
                description="Add your first contact to start building your CRM."
                action={{
                  label: 'Add Contact',
                  onClick: () => router.push('/dashboard/crm/contacts/new'),
                }}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}