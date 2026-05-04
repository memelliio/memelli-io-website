'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, GraduationCap } from 'lucide-react';
import {
  DataTable,
  PageHeader,
  Button,
  FilterBar,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { DataTableColumn, FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

interface Program {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  completionRate?: number;
  _count?: { modules: number; enrollments: number };
  createdAt: string;
}

const statusVariant: Record<string, 'success' | 'muted' | 'destructive'> = {
  PUBLISHED: 'success',
  DRAFT: 'muted',
  ARCHIVED: 'destructive',
};

const filterConfigs: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
];

export default function ProgramsPage() {
  const api = useApi();
  const router = useRouter();
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { data: programsData, isLoading } = useQuery({
    queryKey: ['coaching', 'programs'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/programs');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return list as Program[];
    },
  });

  const programs = programsData ?? [];

  const filtered = programs.filter((p) => {
    if (filterValues.status && p.status !== filterValues.status) return false;
    return true;
  });

  const columns: DataTableColumn<Program>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-white/90">{row.name}</p>
          {row.description && (
            <p className="max-w-xs truncate text-xs text-white/30">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Modules',
      accessor: 'id',
      render: (row) => (
        <span className="text-white/50">{row._count?.modules ?? 0}</span>
      ),
    },
    {
      header: 'Enrollments',
      accessor: 'id',
      render: (row) => (
        <span className="text-white/50">{row._count?.enrollments ?? 0}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      header: 'Completion',
      accessor: 'completionRate',
      render: (row) => {
        const rate = row.completionRate ?? 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
            <span className="text-xs text-white/30">{rate}%</span>
          </div>
        );
      },
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'muted'} className="capitalize">
          {row.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-white/30">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton variant="line" className="h-8 w-48" />
        <Skeleton variant="line" className="h-4 w-64" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="table-row" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Programs"
        subtitle="Manage coaching programs, modules, and enrollments"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Coaching', href: '/dashboard/coaching' },
          { label: 'Programs' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/dashboard/coaching/programs/new')}
          >
            Create Program
          </Button>
        }
      />

      <FilterBar
        filters={filterConfigs}
        values={filterValues}
        onChange={setFilterValues}
        onClear={() => setFilterValues({})}
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={false}
        rowKey={(row) => row.id}
        pageSize={15}
        onRowClick={(row) => router.push(`/dashboard/coaching/programs/${row.id}`)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground leading-relaxed">
            <GraduationCap className="mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">No programs found</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first coaching program to get started.</p>
          </div>
        }
      />
    </div>
  );
}
