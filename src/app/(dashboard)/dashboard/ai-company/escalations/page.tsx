'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  DataTable,
  StatusBadge,
  SlidePanel,
  Spinner,
  Button,
  Badge,
  Textarea,
} from '@memelli/ui';
import type { FilterConfig, FilterValues, DataTableColumn } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Escalation {
  id: string;
  title: string;
  description?: string;
  context?: any;
  priority: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  createdBy?: { id: string; name: string; role?: { slug: string } };
  assignedTo?: { id: string; name: string; role?: { slug: string } };
}

const PRIORITY_MAP: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
  critical: 'red',
};

const ESCALATION_STATUS_MAP: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  open: 'yellow',
  acknowledged: 'blue',
  resolved: 'green',
  dismissed: 'gray',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EscalationsPage() {
  const api = useApi();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({ priority: '', status: '' });

  // Detail panel
  const [selected, setSelected] = useState<Escalation | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.status) params.set('status', filters.status);
    params.set('perPage', '100');

    const res = await api.get<any>(`/api/agents/reports/escalations?${params.toString()}`);
    if (res.data?.data) setEscalations(res.data.data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priority, filters.status]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'CRITICAL', label: 'Critical' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'Open' },
        { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'DISMISSED', label: 'Dismissed' },
      ],
    },
  ];

  const columns: DataTableColumn<Escalation>[] = [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-sm font-medium text-foreground tracking-tight">{row.title}</span>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <StatusBadge status={row.priority} customMap={PRIORITY_MAP} size="sm" />
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <StatusBadge status={row.status} customMap={ESCALATION_STATUS_MAP} size="sm" />
      ),
    },
    {
      header: 'Created By',
      accessor: 'createdBy',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.createdBy?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Assigned To',
      accessor: 'assignedTo',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.assignedTo?.name ?? '—'}</span>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleRowClick = (esc: Escalation) => {
    setSelected(esc);
    setPanelOpen(true);
    setResolution('');
  };

  const handleResolve = async () => {
    if (!selected || !resolution.trim()) return;
    setResolving(true);
    const res = await api.post<any>(`/api/agents/reports/escalations/${selected.id}/resolve`, {
      resolution: resolution.trim(),
      status: 'RESOLVED',
    });
    setResolving(false);
    if (res.data?.data) {
      setPanelOpen(false);
      setSelected(null);
      setResolution('');
      fetchEscalations();
    }
  };

  const canResolve = selected && (selected.status === 'OPEN' || selected.status === 'ACKNOWLEDGED');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Escalations"
        subtitle="Agent escalations requiring human attention"
        breadcrumb={[
          { label: 'AI Company', href: '/dashboard/ai-company' },
          { label: 'Escalations' },
        ]}
      />

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({ priority: '', status: '' })}
      />

      <DataTable
        columns={columns}
        data={escalations}
        isLoading={loading}
        rowKey={(row) => row.id}
        emptyState={
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm tracking-tight">No escalations found</p>
          </div>
        }
      />

      {/* Detail panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelected(null);
        }}
        title={selected?.title ?? 'Escalation Detail'}
        width="lg"
        footer={
          canResolve ? (
            <div className="space-y-3">
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter resolution notes..."
                rows={3}
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPanelOpen(false);
                    setSelected(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={resolving}
                  disabled={!resolution.trim()}
                  onClick={handleResolve}
                  leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                >
                  Resolve
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Status row */}
            <div className="flex items-center gap-3">
              <StatusBadge status={selected.priority} customMap={PRIORITY_MAP} />
              <StatusBadge status={selected.status} customMap={ESCALATION_STATUS_MAP} />
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Description
                </h4>
                <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
              </div>
            )}

            {/* Context */}
            {selected.context && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Context
                </h4>
                <div className="rounded-2xl border border-white/[0.04] bg-background backdrop-blur-xl p-4 text-xs text-muted-foreground font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {typeof selected.context === 'object'
                    ? JSON.stringify(selected.context, null, 2)
                    : String(selected.context)}
                </div>
              </div>
            )}

            {/* Created by / Assigned to */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Created By
                </h4>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selected.createdBy?.name ?? '—'}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Assigned To
                </h4>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selected.assignedTo?.name ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>Created: {new Date(selected.createdAt).toLocaleString()}</p>
              {selected.resolvedAt && (
                <p>Resolved: {new Date(selected.resolvedAt).toLocaleString()}</p>
              )}
            </div>

            {/* Resolution (if already resolved) */}
            {selected.resolution && (
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Resolution
                </h4>
                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-50 backdrop-blur-xl p-4 text-sm text-emerald-300 leading-relaxed">
                  {selected.resolution}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
