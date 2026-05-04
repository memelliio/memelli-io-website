'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Ticket,
  AlertTriangle,
  Clock,
  Circle,
  CheckCircle2,
  User,
} from 'lucide-react';
import {
  PageHeader,
  DataTable,
  Button,
  FilterBar,
  Modal,
  Input,
  Textarea,
  Select,
  Badge,
  Skeleton,
} from '@memelli/ui';
import type { DataTableColumn, FilterConfig, FilterValues } from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TicketItem {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requester: string;
  assignedAgent?: string;
  slaDeadline?: string;
  createdAt: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  assignee?: string;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  content: string;
  authorName: string;
  authorRole: 'agent' | 'customer' | 'system';
  createdAt: string;
}

interface CreateTicketPayload {
  subject: string;
  description: string;
  priority: string;
}

interface TicketsResponse {
  data: TicketItem[];
  meta: { total: number; page: number; perPage: number };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'muted' }> = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'muted' },
};

const PRIORITY_BADGE: Record<string, { label: string; variant: 'muted' | 'info' | 'warning' | 'error' }> = {
  low: { label: 'Low', variant: 'muted' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'error' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open: <Circle className="h-3 w-3" />,
  in_progress: <Clock className="h-3 w-3" />,
  resolved: <CheckCircle2 className="h-3 w-3" />,
  closed: <CheckCircle2 className="h-3 w-3" />,
};

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ],
  },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSla(deadline?: string): { label: string; urgent: boolean } | null {
  if (!deadline) return null;
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return { label: 'Breached', urgent: true };
  const hours = remaining / 3600000;
  if (hours < 1) return { label: `${Math.floor(remaining / 60000)}m left`, urgent: true };
  if (hours < 4) return { label: `${Math.floor(hours)}h left`, urgent: false };
  return { label: `${Math.floor(hours)}h left`, urgent: false };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TicketsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  /* -- State -------------------------------------------------------- */
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  /* -- Queries ------------------------------------------------------ */
  const { data: ticketsResponse, isLoading } = useQuery<TicketsResponse>({
    queryKey: ['comms-tickets'],
    queryFn: async () => {
      const res = await api.get<TicketsResponse>('/api/comms/tickets');
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });
  const tickets: TicketItem[] = ticketsResponse?.data ?? [];

  /* -- Mutations ---------------------------------------------------- */
  const createTicket = useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const res = await api.post<TicketItem>('/api/comms/tickets', payload);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comms-tickets'] });
      resetModal();
    },
  });

  /* -- Filtered data ------------------------------------------------ */
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterValues.status && t.status !== filterValues.status) return false;
      if (filterValues.priority && t.priority !== filterValues.priority) return false;
      return true;
    });
  }, [tickets, filterValues]);

  /* -- Handlers ----------------------------------------------------- */
  const resetModal = useCallback(() => {
    setModalOpen(false);
    setNewSubject('');
    setNewDescription('');
    setNewPriority('medium');
  }, []);

  function handleCreate() {
    if (!newSubject.trim()) return;
    createTicket.mutate({
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
    });
  }

  /* -- Columns ------------------------------------------------------ */
  const columns: DataTableColumn<TicketItem>[] = [
    {
      header: 'Subject',
      accessor: 'subject',
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate max-w-[280px]">{row.subject}</p>
          <span className="text-xs text-muted-foreground font-mono">{row.id}</span>
        </div>
      ),
    },
    {
      header: 'Requester',
      accessor: 'requester',
      render: (row) => (
        <span className="text-sm text-foreground">{row.requester}</span>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => {
        const cfg = PRIORITY_BADGE[row.priority];
        return (
          <Badge variant={cfg?.variant ?? 'default'}>
            {row.priority === 'urgent' && <AlertTriangle className="mr-1 h-3 w-3" />}
            {cfg?.label ?? row.priority}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const cfg = STATUS_BADGE[row.status];
        return (
          <Badge variant={cfg?.variant ?? 'default'}>
            <span className="mr-1">{STATUS_ICON[row.status]}</span>
            {cfg?.label ?? row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Assigned Agent',
      accessor: 'assignedAgent',
      render: (row) =>
        row.assignedAgent ? (
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs text-foreground">{row.assignedAgent}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ),
    },
    {
      header: 'SLA',
      accessor: 'slaDeadline',
      render: (row) => {
        const sla = formatSla(row.slaDeadline);
        if (!sla) return <span className="text-xs text-muted-foreground">--</span>;
        return (
          <div className="flex items-center gap-1">
            {sla.urgent && <AlertTriangle className="h-3 w-3 text-primary" />}
            <span className={`text-xs font-medium ${sla.urgent ? 'text-primary' : 'text-muted-foreground'}`}>
              {sla.label}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      ),
    },
  ];

  /* -- Render ------------------------------------------------------- */
  return (
    <div className="bg-card space-y-6">
      <PageHeader
        title="Tickets"
        subtitle={`${tickets.length} total tickets`}
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Tickets' },
        ]}
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={() => setModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Ticket
          </Button>
        }
      />

      <FilterBar
        filters={FILTER_CONFIGS}
        values={filterValues}
        onChange={setFilterValues}
        onClear={() => setFilterValues({})}
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton variant="table-row" count={6} />
        </div>
      ) : (
        <DataTable<TicketItem>
          columns={columns}
          data={filteredTickets}
          isLoading={false}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/dashboard/communications/tickets/${row.id}`)}
          emptyState={
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Ticket className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          }
          pageSize={20}
        />
      )}

      {/* -- Create Ticket Modal ------------------------------------- */}
      <Modal isOpen={modalOpen} onClose={resetModal} title="Create Ticket">
        <div className="flex flex-col gap-4">
          <Input
            label="Subject"
            placeholder="Brief summary of the issue"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="Describe the issue in detail..."
            rows={4}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={newPriority}
            onChange={(val) => setNewPriority(val)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={resetModal}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              onClick={handleCreate}
              disabled={!newSubject.trim() || createTicket.isPending}
            >
              {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
          {createTicket.isError && (
            <p className="text-xs text-primary">
              {createTicket.error instanceof Error ? createTicket.error.message : 'Failed to create ticket'}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}