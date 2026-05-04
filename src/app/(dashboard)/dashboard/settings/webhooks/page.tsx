'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Play, Trash2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApi } from '../../../../../hooks/useApi';
import {
  Button,
  Badge,
  Modal,
  Input,
  DataTable,
  Skeleton,
  CopyButton,
  Combobox,
  Toggle,
  PageHeader,
  ConfirmDialog,
} from '@memelli/ui';
import type { DataTableColumn, ComboboxOption } from '@memelli/ui';

/* ---------- Types ---------- */

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  secret?: string;
}

interface WebhooksResponse {
  success: boolean;
  data: WebhookEndpoint[];
}

interface MutateWebhookResponse {
  success: boolean;
  data: WebhookEndpoint;
}

/* ---------- Constants ---------- */

const EVENT_GROUPS = [
  { group: 'Contacts', events: ['contact.created', 'contact.updated', 'contact.deleted'] },
  { group: 'Deals', events: ['deal.created', 'deal.updated', 'deal.stage_changed', 'deal.won', 'deal.lost'] },
  { group: 'Orders', events: ['order.created', 'order.confirmed', 'order.shipped', 'order.delivered'] },
  { group: 'Coaching', events: ['lesson.completed', 'program.completed'] },
  { group: 'SEO', events: ['seo.article.published'] },
  { group: 'System', events: ['webhook.test'] },
] as const;

const ALL_EVENT_OPTIONS: ComboboxOption[] = EVENT_GROUPS.flatMap(({ events }) =>
  events.map((e) => ({ value: e, label: e })),
);

function truncateUrl(url: string, max = 50): string {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ---------- Component ---------- */

export default function WebhooksSettingsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);

  // Secret display after creation
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ---- Helpers ---- */

  function resetForm() {
    setFormUrl('');
    setFormDescription('');
    setFormEvents([]);
    setFormActive(true);
    setEditingWebhook(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(webhook: WebhookEndpoint) {
    setEditingWebhook(webhook);
    setFormUrl(webhook.url);
    setFormDescription(webhook.description ?? '');
    setFormEvents([...webhook.events]);
    setFormActive(webhook.isActive);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  /* ---- Queries ---- */

  const { data: webhooksData, isLoading } = useQuery<WebhooksResponse>({
    queryKey: ['webhook-endpoints'],
    queryFn: async () => {
      const res = await api.get<WebhooksResponse>('/api/webhook-endpoints');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load webhooks');
      return res.data;
    },
  });

  const webhooks: WebhookEndpoint[] = (() => {
    if (!webhooksData) return [];
    const d: any = webhooksData.data ?? webhooksData;
    return Array.isArray(d) ? d : d.items ?? d.webhooks ?? [];
  })();

  /* ---- Mutations ---- */

  const createMutation = useMutation({
    mutationFn: async () => {
      if (formEvents.length === 0) throw new Error('Select at least one event');
      const res = await api.post<MutateWebhookResponse>('/api/webhook-endpoints', {
        url: formUrl,
        events: formEvents,
        description: formDescription || undefined,
        isActive: formActive,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data: any) => {
      toast.success('Webhook endpoint created');
      const created = data?.data ?? data;
      if (created?.secret) {
        setNewSecret(created.secret);
        setShowSecretModal(true);
      }
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create webhook'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingWebhook) throw new Error('No webhook selected');
      if (formEvents.length === 0) throw new Error('Select at least one event');
      const res = await api.patch<MutateWebhookResponse>(
        `/api/webhook-endpoints/${editingWebhook.id}`,
        {
          url: formUrl,
          events: formEvents,
          description: formDescription || undefined,
          isActive: formActive,
        },
      );
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Webhook endpoint updated');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update webhook'),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/webhook-endpoints/${id}/test`, {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => toast.success('Test payload sent successfully'),
    onError: (err: Error) => toast.error(err.message || 'Test delivery failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/webhook-endpoints/${id}`);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Webhook endpoint deleted');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete webhook'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch<MutateWebhookResponse>(`/api/webhook-endpoints/${id}`, {
        isActive,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.isActive ? 'Webhook enabled' : 'Webhook disabled');
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to toggle webhook'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingWebhook) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /* ---- Columns ---- */

  const columns: DataTableColumn<WebhookEndpoint>[] = [
    {
      header: 'Endpoint',
      accessor: 'url',
      render: (row) => (
        <div>
          <p className="font-mono text-xs text-white/60">{truncateUrl(row.url)}</p>
          {row.description && (
            <p className="text-[10px] text-white/25 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Events',
      accessor: 'events',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.events.slice(0, 3).map((ev) => (
            <Badge key={ev} variant="default" className="text-[10px] font-mono">
              {ev}
            </Badge>
          ))}
          {row.events.length > 3 && (
            <Badge variant="default" className="text-[10px]">
              +{row.events.length - 3} more
            </Badge>
          )}
        </div>
      ),
      className: 'hidden md:table-cell',
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <Toggle
          checked={row.isActive}
          size="sm"
          onChange={(checked) =>
            toggleActiveMutation.mutate({ id: row.id, isActive: checked })
          }
        />
      ),
    },
    {
      header: 'Last Triggered',
      accessor: 'lastTriggeredAt',
      render: (row) => (
        <span className="text-xs text-white/30">
          {row.lastTriggeredAt ? relativeTime(row.lastTriggeredAt) : 'Never'}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      header: '',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            title="Edit webhook"
            className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              testMutation.mutate(row.id);
            }}
            disabled={testMutation.isPending}
            title="Send test payload"
            className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingId(row.id);
              setShowDeleteConfirm(true);
            }}
            title="Delete webhook"
            className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  /* ---- Loading skeleton ---- */

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton variant="line" className="h-8 w-48" />
        <Skeleton variant="line" className="h-4 w-72" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <PageHeader
        title="Webhooks"
        subtitle="Receive real-time HTTP callbacks for events in your workspace."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openCreateModal}>
            Add Webhook
          </Button>
        }
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Webhooks' },
        ]}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={webhooks}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        pageSize={15}
        emptyState={
          <div className="bg-card border border-white/[0.04] rounded-2xl p-10 text-center backdrop-blur-xl">
            <p className="text-sm text-white/40 mb-1">No webhooks configured</p>
            <p className="text-xs text-white/20 mb-4">
              Add a webhook to receive real-time event notifications.
            </p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openCreateModal}>
              Add Webhook
            </Button>
          </div>
        }
      />

      {/* Security note */}
      <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl backdrop-blur-xl">
        <p className="text-xs text-white/30">
          <span className="text-white/50 font-medium">Security:</span> All webhook payloads are
          signed with HMAC-SHA256 using your endpoint secret. Verify the{' '}
          <span className="font-mono text-white/50">X-Memelli-Signature</span> header to
          authenticate requests.
        </p>
      </div>

      {/* Create / Edit Webhook Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Endpoint URL"
            type="url"
            placeholder="https://your-server.com/webhook"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            required
          />

          <Input
            label="Description (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="What this webhook is for..."
          />

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Events to subscribe
            </label>
            <Combobox
              options={ALL_EVENT_OPTIONS}
              values={formEvents}
              onChange={setFormEvents}
              placeholder="Select events..."
              searchable
            />
            {formEvents.length > 0 && (
              <p className="mt-2 text-xs text-white/30">
                {formEvents.length} event{formEvents.length !== 1 ? 's' : ''} selected
              </p>
            )}

            {/* Grouped quick-select checkboxes */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mt-3">
              {EVENT_GROUPS.map(({ group, events }) => {
                const allSelected = events.every((e) => formEvents.includes(e));
                const someSelected = events.some((e) => formEvents.includes(e));
                return (
                  <div key={group} className="bg-card rounded-xl p-3 border border-white/[0.04]">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => {
                          if (allSelected) {
                            setFormEvents((prev) => prev.filter((e) => !(events as readonly string[]).includes(e)));
                          } else {
                            setFormEvents((prev) => [...new Set([...prev, ...events])]);
                          }
                        }}
                        className="accent-red-500"
                      />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                        {group}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 ml-5">
                      {events.map((event) => (
                        <label key={event} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formEvents.includes(event)}
                            onChange={() =>
                              setFormEvents((prev) =>
                                prev.includes(event)
                                  ? prev.filter((e) => e !== event)
                                  : [...prev, event],
                              )
                            }
                            className="accent-red-500"
                          />
                          <span className="text-xs text-white/40 font-mono">{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {editingWebhook && (
            <Toggle
              checked={formActive}
              onChange={setFormActive}
              label="Enabled"
              size="sm"
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              {editingWebhook ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secret Display Modal (shown after creation) */}
      <Modal
        isOpen={showSecretModal}
        onClose={() => {
          setShowSecretModal(false);
          setNewSecret(null);
        }}
        title="Webhook Secret"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/40">
            Save this secret now. It will not be shown again.
          </p>
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2">
            <code className="text-xs text-white/60 font-mono flex-1 break-all">{newSecret}</code>
            <CopyButton
              text={newSecret ?? ''}
              size="sm"
              onCopy={() => toast.success('Secret copied to clipboard')}
            />
          </div>
          <Button
            onClick={() => {
              setShowSecretModal(false);
              setNewSecret(null);
            }}
            className="w-full"
          >
            I have saved the secret
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={() => {
          if (deletingId) deleteMutation.mutate(deletingId);
        }}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook endpoint? This action cannot be undone and any integrations relying on it will stop receiving events."
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
