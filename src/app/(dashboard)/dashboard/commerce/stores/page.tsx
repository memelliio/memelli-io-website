'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import {
  DataTable,
  PageHeader,
  Button,
  Modal,
  Input,
  Badge,
  Skeleton,
  type DataTableColumn,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Store {
  id: string;
  name: string;
  slug: string;
  url?: string | null;
  status: string;
  createdAt: string;
  _count?: { products: number; orders: number };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'muted' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  DRAFT: 'warning',
  ARCHIVED: 'destructive',
};

function unwrapArray<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj.stores)) return obj.stores as T[];
  return [];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StoreListPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Fetch stores
  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ['commerce-stores'],
    queryFn: async () => {
      const res = await api.get<unknown>('/api/commerce/stores');
      if (res.error) throw new Error(res.error);
      return unwrapArray<Store>(res.data);
    },
  });

  // Create store mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; slug: string; description: string }) => {
      const res = await api.post<Store>('/api/commerce/stores', payload);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (created) => {
      toast.success(`Store "${created.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['commerce-stores'] });
      closeModal();
      router.push(`/dashboard/commerce/stores/${created.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create store');
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Store name is required');
      return;
    }
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'store';
    createMutation.mutate({ name: trimmed, slug, description: newDescription.trim() });
  };

  /* ------ Columns ------ */

  const columns: DataTableColumn<Store>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <span className="font-semibold tracking-tight text-foreground">{row.name}</span>
      ),
    },
    {
      header: 'URL',
      accessor: 'slug',
      render: (row) =>
        row.url ? (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-primary hover:text-primary/80 underline truncate max-w-[200px] block transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {row.url}
          </a>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">/{row.slug}</span>
        ),
    },
    {
      header: 'Products',
      accessor: 'products_count',
      render: (row) => (
        <span className="text-muted-foreground tabular-nums">{row._count?.products ?? 0}</span>
      ),
    },
    {
      header: 'Orders',
      accessor: 'orders_count',
      render: (row) => (
        <span className="text-muted-foreground tabular-nums">{row._count?.orders ?? 0}</span>
      ),
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
        <span className="text-xs text-muted-foreground">{fmtDate(row.createdAt)}</span>
      ),
    },
  ];

  /* ------ Loading skeleton ------ */

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title="Stores"
          subtitle="Manage your commerce storefronts"
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Commerce', href: '/dashboard/commerce' },
            { label: 'Stores' },
          ]}
        />
        <div className="space-y-3">
          <Skeleton variant="table-row" count={5} />
        </div>
      </div>
    );
  }

  /* ------ Render ------ */

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Stores"
        subtitle="Manage your commerce storefronts"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commerce', href: '/dashboard/commerce' },
          { label: 'Stores' },
        ]}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Store
          </Button>
        }
      />

      <DataTable<Store>
        columns={columns}
        data={stores}
        isLoading={false}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/dashboard/commerce/stores/${row.id}`)}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl text-muted-foreground leading-relaxed">
            <ShoppingBag className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No stores yet</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-3 text-sm text-primary hover:text-primary/80 transition-all duration-200"
            >
              Create your first store
            </button>
          </div>
        }
      />

      {/* Create Store Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Create Store">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="store-name" className="text-sm font-medium text-muted-foreground">
              Store Name
            </label>
            <Input
              id="store-name"
              placeholder="My Store"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="store-desc" className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <Input
              id="store-desc"
              placeholder="Optional description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Store'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
