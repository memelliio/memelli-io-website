'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Users, Calendar } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../../hooks/useWorkspacePanel';
import { WorkspaceLayout } from '../../../../../components/layout/WorkspaceLayout';
import { EnrollmentDetailPanel } from './enrollment-detail-panel';
import { ProgressBar } from '../../../../../components/ui/progress-bar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  progressPct?: number;
  program?: { id: string; name: string };
  contact?: { id: string; firstName?: string; lastName?: string; email?: string };
  _count?: { progress: number };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'muted' | 'destructive' | 'primary'> = {
  ACTIVE: 'primary',
  COMPLETED: 'success',
  DROPPED: 'destructive',
};

function contactName(e: Enrollment): string {
  if (!e.contact) return 'Unknown';
  const name = [e.contact.firstName, e.contact.lastName].filter(Boolean).join(' ');
  return name || e.contact.email || 'Unknown';
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EnrollmentsPage() {
  const api = useApi();
  const searchParams = useSearchParams();
  const programId = searchParams.get('programId');
  const { openRecord, selectedRecord } = useWorkspacePanel();

  const [filters, setFilters] = useState<FilterValues>({
    program: programId ?? '',
    status: '',
  });

  /* ---- Fetch enrollments ----------------------------------------- */
  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['coaching', 'enrollments', filters.program, filters.status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.program) params.set('programId', filters.program);
      if (filters.status) params.set('status', filters.status);
      const qs = params.toString();
      const res = await api.get<any>(`/api/coaching/enrollments${qs ? `?${qs}` : ''}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Enrollment[];
    },
  });

  /* ---- Derive program options from data -------------------------- */
  const programOptions = useMemo(() => {
    const seen = new Map<string, string>();
    enrollments.forEach((e) => {
      if (e.program?.id && e.program.name) {
        seen.set(e.program.id, e.program.name);
      }
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [enrollments]);

  /* ---- Filter configs -------------------------------------------- */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'program',
      label: 'Program',
      type: 'select',
      options: programOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'DROPPED', label: 'Dropped' },
      ],
    },
  ];

  /* ---- Table columns --------------------------------------------- */
  const columns: DataTableColumn<Enrollment>[] = [
    {
      header: 'Student',
      accessor: 'contact',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-white/90">{contactName(row)}</span>
        </div>
      ),
    },
    {
      header: 'Program',
      accessor: 'program',
      render: (row) => (
        <span className="text-sm text-white/50">{row.program?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Progress',
      accessor: 'progressPct',
      render: (row) => (
        <div className="flex min-w-[140px] items-center gap-2">
          <ProgressBar value={row.progressPct ?? 0} color="green" size="sm" />
          <span className="whitespace-nowrap tabular-nums text-xs text-white/30">
            {row.progressPct ?? 0}%
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'muted'} className="capitalize">
          {row.status?.toLowerCase() ?? 'active'}
        </Badge>
      ),
    },
    {
      header: 'Enrolled',
      accessor: 'enrolledAt',
      render: (row) => (
        <span className="flex items-center gap-1 text-xs text-white/30">
          <Calendar className="h-3 w-3" />
          {new Date(row.enrolledAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  /* ---- Row click -> open slide panel ------------------------------ */
  const handleRowClick = (enrollment: Enrollment) => {
    openRecord(enrollment.id, 'enrollment', enrollment, 'lg');
  };

  const selectedEnrollment = selectedRecord?.data as Enrollment | undefined;

  /* ---- Render ---------------------------------------------------- */
  return (
    <WorkspaceLayout
      panelContent={
        selectedEnrollment ? <EnrollmentDetailPanel enrollment={selectedEnrollment} /> : null
      }
      panelTitle="Enrollment Details"
    >
      <div className="space-y-8 p-6 transition-all duration-200">
        <PageHeader
          title="Enrollments"
          subtitle={programId ? 'Program enrollments' : 'All coaching enrollments'}
          breadcrumb={[
            { label: 'Coaching', href: '/dashboard/coaching' },
            { label: 'Enrollments' },
          ]}
        />

        <FilterBar
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
          onClear={() => setFilters({ program: '', status: '' })}
        />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton variant="table-row" count={6} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={enrollments}
            isLoading={false}
            rowKey={(row) => row.id}
            onRowClick={handleRowClick}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground leading-relaxed">
                <Users className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">No enrollments found</p>
              </div>
            }
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
