'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus } from 'lucide-react';
import {
  PageHeader,
  Button,
  Badge,
  DataTable,
  FilterBar,
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

interface CreditReport {
  id: number;
  contactName: string;
  score: number | null;
  bureau: 'EQUIFAX' | 'EXPERIAN' | 'TRANSUNION' | string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED' | 'EXPIRED' | string;
  pulledAt: string;
}

interface ReportsResponse {
  success: boolean;
  data: CreditReport[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BUREAUS = ['EQUIFAX', 'EXPERIAN', 'TRANSUNION'] as const;

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  COMPLETE: 'success',
  FAILED: 'error',
  EXPIRED: 'muted',
};

const SCORE_RANGES = [
  { value: '720+', label: '720+ (Excellent)', min: 720, max: 850 },
  { value: '680-719', label: '680-719 (Good)', min: 680, max: 719 },
  { value: '620-679', label: '620-679 (Fair)', min: 620, max: 679 },
  { value: '<620', label: 'Below 620 (Poor)', min: 0, max: 619 },
] as const;

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const FILTERS: FilterConfig[] = [
  {
    key: 'bureau',
    label: 'Bureau',
    type: 'select',
    options: BUREAUS.map((b) => ({ value: b, label: b.charAt(0) + b.slice(1).toLowerCase() })),
  },
  {
    key: 'scoreRange',
    label: 'Score Range',
    type: 'select',
    options: SCORE_RANGES.map((r) => ({ value: r.value, label: r.label })),
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 720) return 'text-emerald-400';
  if (score >= 680) return 'text-yellow-400';
  if (score >= 620) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBadgeVariant(score: number | null): BadgeVariant {
  if (score == null) return 'muted';
  if (score >= 720) return 'success';
  if (score >= 680) return 'warning';
  if (score >= 620) return 'default';
  return 'error';
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreditReportsPage() {
  const api = useApi();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterValues>({});

  /* ---- Fetch ---- */
  const { data, isLoading } = useQuery<CreditReport[]>({
    queryKey: ['credit-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.bureau) params.set('bureau', filters.bureau);
      const qs = params.toString();
      const res = await api.get<ReportsResponse>(`/api/credit/reports${qs ? `?${qs}` : ''}`);
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load');
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  /* ---- Client-side score filtering ---- */
  const reports = useMemo(() => {
    let list = data ?? [];
    if (filters.scoreRange) {
      const range = SCORE_RANGES.find((r) => r.value === filters.scoreRange);
      if (range) {
        list = list.filter(
          (r) => r.score != null && r.score >= range.min && r.score <= range.max,
        );
      }
    }
    return list;
  }, [data, filters.scoreRange]);

  /* ---- Row click ---- */
  const handleRowClick = useCallback(
    (report: CreditReport) => {
      router.push(`/dashboard/credit/reports/${report.id}`);
    },
    [router],
  );

  /* ---- Columns ---- */
  const columns: DataTableColumn<CreditReport>[] = useMemo(
    () => [
      {
        header: 'Contact',
        accessor: 'contactName',
        render: (row) => (
          <button
            onClick={() => handleRowClick(row)}
            className="text-left font-semibold tracking-tight text-foreground hover:text-primary transition-colors duration-200"
          >
            {row.contactName || '\u2014'}
          </button>
        ),
      },
      {
        header: 'Score',
        accessor: 'score',
        render: (row) => (
          <Badge variant={scoreBadgeVariant(row.score)}>
            <span className={`font-mono font-semibold ${scoreColor(row.score)}`}>
              {row.score != null ? row.score : '\u2014'}
            </span>
          </Badge>
        ),
      },
      {
        header: 'Bureau',
        accessor: 'bureau',
        render: (row) => (
          <span className="text-sm text-muted-foreground capitalize">
            {row.bureau.charAt(0) + row.bureau.slice(1).toLowerCase()}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row) => (
          <Badge variant={STATUS_VARIANT[row.status] ?? 'muted'} className="capitalize">
            {row.status.toLowerCase()}
          </Badge>
        ),
      },
      {
        header: 'Pulled',
        accessor: 'pulledAt',
        render: (row) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.pulledAt)}</span>
        ),
      },
    ],
    [handleRowClick],
  );

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title="Credit Reports"
        subtitle={`${reports.length} report${reports.length !== 1 ? 's' : ''}`}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/dashboard/credit/pull')}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            Pull Credit
          </Button>
        }
      />

      <FilterBar
        filters={FILTERS}
        values={filters}
        onChange={(v) => setFilters(v)}
        onClear={() => setFilters({})}
      />

      <div className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No credit reports found"
              description="Pull your first credit report to get started."
              action={{
                label: 'Pull Credit',
                onClick: () => router.push('/dashboard/credit/pull'),
              }}
            />
          }
        />
      </div>
    </div>
  );
}
