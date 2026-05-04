'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Clock, CheckCircle2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  Badge,
  Skeleton,
  StatusBadge,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentRole {
  id: string;
  slug: string;
  name: string;
  department: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  tasksCompleted?: number;
  role: AgentRole;
}

interface AgentsResponse {
  data: Agent[];
  meta?: { total: number; page: number; perPage: number };
}

/* ------------------------------------------------------------------ */
/*  Status color map                                                   */
/* ------------------------------------------------------------------ */

const AGENT_STATUS_MAP: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  active: 'green',
  idle: 'blue',
  busy: 'yellow',
  error: 'red',
  disabled: 'gray',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AgentsPage() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDept = searchParams.get('department') ?? '';

  const [filters, setFilters] = useState<FilterValues>({
    department: initialDept,
    status: '',
  });

  /* ---- Fetch agents via useQuery --------------------------------- */
  const {
    data: agents = [],
    isLoading,
  } = useQuery<Agent[]>({
    queryKey: ['agents', filters.department, filters.status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.department) params.set('department', filters.department);
      if (filters.status) params.set('status', filters.status);
      params.set('perPage', '100');

      const res = await api.get<AgentsResponse>(`/api/agents?${params.toString()}`);
      return res.data?.data ?? [];
    },
  });

  /* ---- Derived department options -------------------------------- */
  const departmentOptions = useMemo(() => {
    const depts = [...new Set(agents.map((a) => a.role?.department).filter(Boolean))];
    return depts.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }));
  }, [agents]);

  /* ---- Filter config --------------------------------------------- */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: departmentOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'IDLE', label: 'Idle' },
        { value: 'BUSY', label: 'Busy' },
        { value: 'ERROR', label: 'Error' },
        { value: 'DISABLED', label: 'Disabled' },
      ],
    },
  ];

  /* ---- Table columns --------------------------------------------- */
  const columns: DataTableColumn<Agent>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Bot className="h-4 w-4 text-red-400 shrink-0" />
          <span className="font-medium text-foreground tracking-tight">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span className="text-sm text-foreground">{row.role?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <Badge variant="primary" className="capitalize">
          {row.role?.department ?? '—'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge status={row.status} customMap={AGENT_STATUS_MAP} size="sm" />
      ),
    },
    {
      header: 'Last Active',
      accessor: 'updatedAt',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Tasks Completed',
      accessor: 'tasksCompleted',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {row.tasksCompleted ?? 0}
        </span>
      ),
    },
  ];

  /* ---- Row click -> navigate to detail page ----------------------- */
  const handleRowClick = (agent: Agent) => {
    router.push(`/dashboard/ai-company/agents/${agent.id}`);
  };

  /* ---- Render ---------------------------------------------------- */
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Agents"
        subtitle="Manage and monitor your AI workforce"
        breadcrumb={[
          { label: 'AI Company', href: '/dashboard/ai-company' },
          { label: 'Agents' },
        ]}
      />

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ department: '', status: '' })}
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="table-row" count={6} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={agents}
          isLoading={false}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm tracking-tight">No agents found</p>
            </div>
          }
        />
      )}
    </div>
  );
}
