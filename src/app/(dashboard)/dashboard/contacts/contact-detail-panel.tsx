'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Pencil,
  Trash2,
  MessageSquare,
  Send,
  Users,
  GitMerge,
  ShoppingBag,
  Sparkles,
  Activity,
  Plus,
  CreditCard,
  StickyNote,
  Globe,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Skeleton,
  EmptyState,
  ConfirmDialog,
} from '@memelli/ui';
import { useApi } from '../../../../hooks/useApi';
import { useWorkspacePanel } from '../../../../hooks/useWorkspacePanel';
import { ContactForm } from './contact-form';

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  tags: string[];
  source?: string | null;
  customFields?: Record<string, unknown>;
  createdAt: string;
  activities?: ActivityItem[];
  deals?: Deal[];
  orders?: Order[];
  creditScore?: number | null;
  creditUpdatedAt?: string | null;
  notes?: Note[];
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  occurredAt: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number | null;
  stage?: { name: string } | null;
  pipeline?: { name: string } | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber?: string | null;
  total?: number | null;
  status: string;
  createdAt: string;
}

interface Note {
  id: string;
  body: string;
  createdAt: string;
  author?: string | null;
}

interface ContactResponse {
  success: boolean;
  data: Contact;
}

function getDisplayName(contact: Contact): string {
  if (contact.type === 'PERSON') {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.email || 'Unknown';
  }
  return contact.companyName ?? contact.email ?? 'Unknown';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TypeIcon = ({ type }: { type: string }) => {
  const props = { className: 'h-4 w-4' };
  switch (type) {
    case 'NOTE': return <MessageSquare {...props} />;
    case 'EMAIL': return <Mail {...props} />;
    case 'CALL': return <Phone {...props} />;
    case 'MEETING': return <Users {...props} />;
    case 'DEAL': return <GitMerge {...props} />;
    case 'ORDER': return <ShoppingBag {...props} />;
    case 'AI': return <Sparkles {...props} />;
    default: return <Activity {...props} />;
  }
};

const statusVariant: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  lead: 'primary',
  customer: 'info',
  churned: 'error',
};

export function ContactDetailPanel() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedRecord, closeRecord } = useWorkspacePanel();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const contactId = selectedRecord?.id;

  const { data, isLoading } = useQuery<ContactResponse>({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const res = await api.get<ContactResponse>(`/api/contacts/${contactId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!contactId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.del(`/api/contacts/${contactId}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      closeRecord();
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  if (!contactId) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const contact = data?.data;
  if (!contact) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        Contact not found.
      </div>
    );
  }

  const displayName = getDisplayName(contact);
  const contactStatus = contact.status ?? 'lead';

  return (
    <div className="space-y-6">
      {/* ── Contact Header ── */}
      <div className="flex items-start gap-4">
        <Avatar name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-100 truncate">{displayName}</h3>
          {contact.email && (
            <p className="text-sm text-zinc-400 truncate mt-0.5">{contact.email}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={contact.type === 'PERSON' ? 'primary' : 'info'}>
              {contact.type.toLowerCase()}
            </Badge>
            <Badge variant={(statusVariant[contactStatus.toLowerCase()] ?? 'default') as any}>
              {contactStatus.toLowerCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() => setShowEditForm(true)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Send className="h-3.5 w-3.5" />}
          onClick={() => {
            if (contact.email) {
              window.location.href = `mailto:${contact.email}`;
            } else {
              toast.error('No email address on file');
            }
          }}
        >
          Email
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => toast.info('Note feature coming soon')}
        >
          Add Note
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </Button>
      </div>

      {/* ── Quick Info Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2 text-zinc-500 mb-1.5">
            <Phone className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">Phone</span>
          </div>
          <p className="text-sm text-zinc-100 truncate">
            {contact.phone || '\u2014'}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2 text-zinc-500 mb-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">Status</span>
          </div>
          <p className="text-sm text-zinc-100 capitalize">
            {contactStatus}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2 text-zinc-500 mb-1.5">
            <Globe className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">Source</span>
          </div>
          <p className="text-sm text-zinc-100 truncate capitalize">
            {contact.source || '\u2014'}
          </p>
        </div>
      </div>

      {/* ── Tags ── */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultTab="timeline">
        <TabList>
          <Tab id="timeline">Timeline</Tab>
          <Tab id="deals">Deals</Tab>
          <Tab id="orders">Orders</Tab>
          <Tab id="credit">Credit</Tab>
          <Tab id="notes">Notes</Tab>
        </TabList>

        <TabPanels>
          {/* Timeline Tab */}
          <TabPanel id="timeline">
            {!contact.activities || contact.activities.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="No activities yet"
                description="Activities will appear here as you interact with this contact."
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="relative mt-2">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />
                <div className="space-y-0">
                  {contact.activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4 pb-5">
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-red-400">
                        <TypeIcon type={activity.type} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-100">{activity.title}</p>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {relativeTime(activity.occurredAt || activity.createdAt)}
                          </span>
                        </div>
                        {activity.body && (
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                            {activity.body}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabPanel>

          {/* Deals Tab */}
          <TabPanel id="deals">
            {!contact.deals || contact.deals.length === 0 ? (
              <EmptyState
                icon={<GitMerge className="h-5 w-5" />}
                title="No deals"
                description="Deals associated with this contact will appear here."
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="space-y-3 mt-2">
                {contact.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{deal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {deal.pipeline?.name && (
                            <span className="text-xs text-zinc-500">{deal.pipeline.name}</span>
                          )}
                          {deal.stage?.name && (
                            <Badge variant="default">{deal.stage.name}</Badge>
                          )}
                        </div>
                      </div>
                      {deal.value != null && (
                        <span className="text-sm font-semibold text-emerald-400">
                          ${deal.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel id="orders">
            {!contact.orders || contact.orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="h-5 w-5" />}
                title="No orders"
                description="Orders placed by this contact will appear here."
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="space-y-3 mt-2">
                {contact.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          {order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.total != null && (
                          <span className="text-sm font-semibold text-zinc-100">
                            ${order.total.toLocaleString()}
                          </span>
                        )}
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'success'
                              : order.status === 'cancelled'
                                ? 'error'
                                : 'default'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Credit Tab */}
          <TabPanel id="credit">
            {contact.creditScore == null ? (
              <EmptyState
                icon={<CreditCard className="h-5 w-5" />}
                title="No credit data"
                description="Credit information for this contact will appear here."
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="mt-2 space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                    Credit Score
                  </p>
                  <p className={`text-4xl font-bold tabular-nums ${
                    contact.creditScore >= 700
                      ? 'text-emerald-400'
                      : contact.creditScore >= 600
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}>
                    {contact.creditScore}
                  </p>
                  {contact.creditUpdatedAt && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Updated {relativeTime(contact.creditUpdatedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabPanel>

          {/* Notes Tab */}
          <TabPanel id="notes">
            {!contact.notes || contact.notes.length === 0 ? (
              <EmptyState
                icon={<StickyNote className="h-5 w-5" />}
                title="No notes"
                description="Add notes to keep track of important details about this contact."
                action={{
                  label: 'Add Note',
                  onClick: () => toast.info('Note feature coming soon'),
                  leftIcon: <Plus className="h-3.5 w-3.5" />,
                }}
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="space-y-3 mt-2">
                {contact.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{note.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {note.author && (
                        <span className="text-xs text-zinc-500">{note.author}</span>
                      )}
                      <span className="text-xs text-zinc-600">
                        {relativeTime(note.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Form */}
      {showEditForm && (
        <ContactForm
          contact={contact}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Contact"
        description={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
