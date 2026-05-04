'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Activity,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Send,
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Globe,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  Input,
  Skeleton,
  ConfirmDialog,
  CopyButton,
} from '@memelli/ui';

/* ---------- Types ---------- */

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: 'active' | 'revoked';
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  requestsToday: number;
  totalRequests: number;
  rateLimit: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  failureCount: number;
  successCount: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'success' | 'failed';
  statusCode: number | null;
  timestamp: string;
  duration: number | null;
}

/* ---------- Constants ---------- */

const AVAILABLE_SCOPES = [
  { id: 'contacts:read', label: 'Contacts Read', group: 'CRM' },
  { id: 'contacts:write', label: 'Contacts Write', group: 'CRM' },
  { id: 'deals:read', label: 'Deals Read', group: 'CRM' },
  { id: 'deals:write', label: 'Deals Write', group: 'CRM' },
  { id: 'orders:read', label: 'Orders Read', group: 'Commerce' },
  { id: 'orders:write', label: 'Orders Write', group: 'Commerce' },
  { id: 'products:read', label: 'Products Read', group: 'Commerce' },
  { id: 'products:write', label: 'Products Write', group: 'Commerce' },
  { id: 'coaching:read', label: 'Coaching Read', group: 'Coaching' },
  { id: 'coaching:write', label: 'Coaching Write', group: 'Coaching' },
  { id: 'seo:read', label: 'SEO Read', group: 'SEO' },
  { id: 'seo:write', label: 'SEO Write', group: 'SEO' },
  { id: 'analytics:read', label: 'Analytics Read', group: 'System' },
  { id: 'webhooks:manage', label: 'Webhooks Manage', group: 'System' },
];

const SCOPE_GROUPS = [...new Set(AVAILABLE_SCOPES.map((s) => s.group))];

const EXPIRATION_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
  { value: 'never', label: 'Never expires' },
];

const WEBHOOK_EVENTS = [
  { id: 'contact.created', label: 'Contact Created', group: 'CRM' },
  { id: 'contact.updated', label: 'Contact Updated', group: 'CRM' },
  { id: 'deal.created', label: 'Deal Created', group: 'CRM' },
  { id: 'deal.stage_changed', label: 'Deal Stage Changed', group: 'CRM' },
  { id: 'deal.won', label: 'Deal Won', group: 'CRM' },
  { id: 'order.created', label: 'Order Created', group: 'Commerce' },
  { id: 'order.confirmed', label: 'Order Confirmed', group: 'Commerce' },
  { id: 'lesson.completed', label: 'Lesson Completed', group: 'Coaching' },
  { id: 'program.completed', label: 'Program Completed', group: 'Coaching' },
  { id: 'seo.article.published', label: 'Article Published', group: 'SEO' },
];

const WEBHOOK_EVENT_GROUPS = [...new Set(WEBHOOK_EVENTS.map((e) => e.group))];

/* ---------- Helpers ---------- */

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/* ---------- Mock data for demo ---------- */

const MOCK_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production Integration',
    keyPrefix: 'sk_live_...x4Kf',
    scopes: ['contacts:read', 'contacts:write', 'deals:read', 'orders:read'],
    status: 'active',
    expiresAt: '2027-03-15T00:00:00Z',
    createdAt: '2026-03-01T10:00:00Z',
    lastUsedAt: '2026-03-15T08:30:00Z',
    requestsToday: 1247,
    totalRequests: 45892,
    rateLimit: 1000,
  },
  {
    id: '2',
    name: 'Zapier Connector',
    keyPrefix: 'sk_live_...m9Qp',
    scopes: ['contacts:read', 'deals:read', 'deals:write'],
    status: 'active',
    expiresAt: null,
    createdAt: '2026-02-14T15:30:00Z',
    lastUsedAt: '2026-03-14T22:15:00Z',
    requestsToday: 342,
    totalRequests: 12450,
    rateLimit: 500,
  },
  {
    id: '3',
    name: 'Old Test Key',
    keyPrefix: 'sk_test_...bR2w',
    scopes: ['contacts:read'],
    status: 'revoked',
    expiresAt: '2026-02-01T00:00:00Z',
    createdAt: '2026-01-01T09:00:00Z',
    lastUsedAt: '2026-01-28T16:45:00Z',
    requestsToday: 0,
    totalRequests: 890,
    rateLimit: 100,
  },
];

const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh1',
    url: 'https://hooks.zapier.com/hooks/catch/12345/abcdef/',
    events: ['contact.created', 'deal.won'],
    isActive: true,
    lastTriggeredAt: '2026-03-15T07:22:00Z',
    createdAt: '2026-02-20T10:00:00Z',
    failureCount: 2,
    successCount: 347,
  },
];

const MOCK_DELIVERIES: WebhookDelivery[] = [
  { id: 'd1', event: 'contact.created', status: 'success', statusCode: 200, timestamp: '2026-03-15T07:22:00Z', duration: 245 },
  { id: 'd2', event: 'deal.won', status: 'success', statusCode: 200, timestamp: '2026-03-14T18:10:00Z', duration: 180 },
  { id: 'd3', event: 'contact.created', status: 'failed', statusCode: 500, timestamp: '2026-03-14T12:05:00Z', duration: 1200 },
  { id: 'd4', event: 'deal.won', status: 'success', statusCode: 200, timestamp: '2026-03-13T09:30:00Z', duration: 210 },
];

/* ---------- Component ---------- */

export default function ApiKeysPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  // API Key state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKeyModal, setShowGeneratedKeyModal] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formScopes, setFormScopes] = useState<string[]>([]);
  const [formExpiration, setFormExpiration] = useState('90');

  // Webhook state
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [showDeliveryLog, setShowDeliveryLog] = useState(false);

  // Copy state
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  /* ---- Queries ---- */

  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: ApiKey[] }>('/api/admin/api-keys');
        if (res.error || !res.data) return MOCK_KEYS;
        const d: any = res.data;
        return Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : MOCK_KEYS;
      } catch {
        return MOCK_KEYS;
      }
    },
  });

  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['api-key-webhooks'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: WebhookEndpoint[] }>('/api/webhook-endpoints');
        if (res.error || !res.data) return MOCK_WEBHOOKS;
        const d: any = res.data;
        return Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : MOCK_WEBHOOKS;
      } catch {
        return MOCK_WEBHOOKS;
      }
    },
  });

  const keys: ApiKey[] = keysData ?? MOCK_KEYS;
  const webhooks: WebhookEndpoint[] = webhooksData ?? MOCK_WEBHOOKS;

  /* ---- Mutations ---- */

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      if (!formName.trim()) throw new Error('Name is required');
      if (formScopes.length === 0) throw new Error('Select at least one scope');
      const res = await api.post<{ data: { key: string; apiKey: ApiKey } }>('/api/admin/api-keys', {
        name: formName,
        scopes: formScopes,
        expiresInDays: formExpiration === 'never' ? null : parseInt(formExpiration),
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data: any) => {
      const result = data?.data ?? data;
      setGeneratedKey(result?.key ?? `sk_live_${crypto.randomUUID().replace(/-/g, '')}`);
      setShowCreateModal(false);
      setShowGeneratedKeyModal(true);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key created');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create API key'),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/admin/api-keys/${id}`, { status: 'revoked' });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('API key revoked');
      setRevokeConfirmOpen(false);
      setRevokingKeyId(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to revoke key'),
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!webhookUrl.trim()) throw new Error('URL is required');
      if (webhookEvents.length === 0) throw new Error('Select at least one event');
      const res = await api.post('/api/webhook-endpoints', {
        url: webhookUrl,
        events: webhookEvents,
        isActive: true,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Webhook endpoint created');
      setShowWebhookModal(false);
      setWebhookUrl('');
      setWebhookEvents([]);
      queryClient.invalidateQueries({ queryKey: ['api-key-webhooks'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create webhook'),
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/webhook-endpoints/${id}/test`, {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => toast.success('Test payload delivered successfully'),
    onError: (err: Error) => toast.error(err.message || 'Test delivery failed'),
  });

  /* ---- Helpers ---- */

  function resetCreateForm() {
    setFormName('');
    setFormScopes([]);
    setFormExpiration('90');
  }

  function toggleScope(scope: string) {
    setFormScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  function toggleScopeGroup(group: string) {
    const groupScopes = AVAILABLE_SCOPES.filter((s) => s.group === group).map((s) => s.id);
    const allSelected = groupScopes.every((s) => formScopes.includes(s));
    if (allSelected) {
      setFormScopes((prev) => prev.filter((s) => !groupScopes.includes(s)));
    } else {
      setFormScopes((prev) => [...new Set([...prev, ...groupScopes])]);
    }
  }

  function toggleWebhookEvent(eventId: string) {
    setWebhookEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId],
    );
  }

  async function handleCopyPrefix(keyPrefix: string, keyId: string) {
    try {
      await navigator.clipboard.writeText(keyPrefix);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  const activeKeys = keys.filter((k) => k.status === 'active');
  const revokedKeys = keys.filter((k) => k.status === 'revoked');
  const totalRequestsToday = keys.reduce((sum, k) => sum + k.requestsToday, 0);

  /* ---- Loading ---- */

  if (keysLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-5 w-80 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="API Keys"
        subtitle="Manage API keys for external integrations and webhook endpoints."
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create API Key
          </Button>
        }
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'API Keys' },
        ]}
      />

      {/* ---- Overview Stats ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Key className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Active Keys</span>
          </div>
          <p className="text-2xl font-bold text-white/90">{activeKeys.length}</p>
          <p className="text-[10px] text-white/20 mt-1">{revokedKeys.length} revoked</p>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Requests Today</span>
          </div>
          <p className="text-2xl font-bold text-white/90">{totalRequestsToday.toLocaleString()}</p>
          <p className="text-[10px] text-white/20 mt-1">Across all active keys</p>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Rate Limit</span>
          </div>
          <p className="text-2xl font-bold text-white/90">1,000</p>
          <p className="text-[10px] text-white/20 mt-1">Requests per minute</p>
        </div>
      </div>

      {/* ---- API Key List ---- */}
      <div className="mt-8">
        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
          API Keys
        </h3>

        {keys.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl p-10 text-center backdrop-blur-xl">
            <Key className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 mb-1">No API keys yet</p>
            <p className="text-xs text-white/20 mb-4">
              Create an API key to start integrating with external services.
            </p>
            <Button
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => {
              const expired = isExpired(key.expiresAt);
              const isRevoked = key.status === 'revoked';
              const isExpanded = expandedKeyId === key.id;

              return (
                <div
                  key={key.id}
                  className={`rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
                    isRevoked
                      ? 'border-white/[0.03] bg-white/[0.015] opacity-60'
                      : expired
                        ? 'border-amber-500/20 bg-amber-500/[0.03]'
                        : 'border-white/[0.04] bg-white/[0.03] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Key Header Row */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        isRevoked
                          ? 'bg-white/[0.03] border-white/[0.06]'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <Key className={`h-5 w-5 ${isRevoked ? 'text-white/20' : 'text-red-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white/85 truncate">
                          {key.name}
                        </span>
                        {isRevoked && (
                          <Badge variant="error" className="text-[10px]">Revoked</Badge>
                        )}
                        {!isRevoked && expired && (
                          <Badge variant="warning" className="text-[10px]">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            Expired
                          </Badge>
                        )}
                        {!isRevoked && !expired && (
                          <Badge variant="success" className="text-[10px]">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyPrefix(key.keyPrefix, key.id)}
                          className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/60 transition-colors duration-200"
                          title="Copy key prefix"
                        >
                          {key.keyPrefix}
                          {copiedKeyId === key.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-[10px] text-white/20">
                          Created {formatDate(key.createdAt)}
                        </span>
                        {key.lastUsedAt && (
                          <span className="text-[10px] text-white/20 hidden sm:inline">
                            Last used {relativeTime(key.lastUsedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedKeyId(isExpanded ? null : key.id)}
                        className="p-2 text-white/25 hover:text-white/50 hover:bg-white/[0.04] rounded-lg transition-all duration-200"
                        title="View details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {!isRevoked && (
                        <button
                          onClick={() => {
                            setRevokingKeyId(key.id);
                            setRevokeConfirmOpen(true);
                          }}
                          className="p-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          title="Revoke key"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
                      {/* Usage Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">
                            Requests Today
                          </p>
                          <p className="text-lg font-semibold text-white/80">
                            {key.requestsToday.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">
                            Total Requests
                          </p>
                          <p className="text-lg font-semibold text-white/80">
                            {key.totalRequests.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">
                            Rate Limit
                          </p>
                          <p className="text-lg font-semibold text-white/80">
                            {key.rateLimit.toLocaleString()}/min
                          </p>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">
                            Expires
                          </p>
                          <p className="text-lg font-semibold text-white/80">
                            {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                          </p>
                        </div>
                      </div>

                      {/* Rate Limit Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-white/25 uppercase tracking-wider">
                            Rate Usage
                          </span>
                          <span className="text-[10px] text-white/30">
                            {key.requestsToday} / {key.rateLimit} per minute
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((key.requestsToday / key.rateLimit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Scopes */}
                      <div>
                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">
                          Scopes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="default" className="text-[10px] font-mono">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Webhook Management Section ---- */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
            Webhook Endpoints
          </h3>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={() => setShowWebhookModal(true)}
          >
            Add Endpoint
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl p-8 text-center backdrop-blur-xl">
            <Globe className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 mb-1">No webhook endpoints</p>
            <p className="text-xs text-white/20">
              Configure endpoints to receive real-time event notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-white/60 truncate">{wh.url}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant={wh.isActive ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {wh.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-[10px] text-white/20">
                        {wh.successCount} delivered, {wh.failureCount} failed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => testWebhookMutation.mutate(wh.id)}
                      disabled={testWebhookMutation.isPending}
                      className="p-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Send test payload"
                    >
                      <Play className={`h-3.5 w-3.5 ${testWebhookMutation.isPending ? 'animate-pulse' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowDeliveryLog(!showDeliveryLog)}
                      className="p-2 text-white/25 hover:text-white/50 hover:bg-white/[0.04] rounded-lg transition-all duration-200"
                      title="View delivery log"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {wh.events.map((ev) => (
                    <Badge key={ev} variant="default" className="text-[10px] font-mono">
                      {ev}
                    </Badge>
                  ))}
                </div>

                {/* Last triggered */}
                {wh.lastTriggeredAt && (
                  <p className="text-[10px] text-white/20">
                    Last triggered {relativeTime(wh.lastTriggeredAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delivery Log */}
        {showDeliveryLog && (
          <div className="mt-4 rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Recent Deliveries
              </span>
              <button
                onClick={() => setShowDeliveryLog(false)}
                className="text-[10px] text-white/25 hover:text-white/50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {MOCK_DELIVERIES.map((delivery) => (
                <div key={delivery.id} className="px-4 py-3 flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      delivery.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-xs font-mono text-white/50 flex-1">{delivery.event}</span>
                  <span className="text-[10px] text-white/25 hidden sm:inline">
                    {delivery.statusCode ?? '--'}
                  </span>
                  <span className="text-[10px] text-white/20 hidden sm:inline">
                    {delivery.duration ? `${delivery.duration}ms` : '--'}
                  </span>
                  <span className="text-[10px] text-white/20">{relativeTime(delivery.timestamp)}</span>
                  <Badge
                    variant={delivery.status === 'success' ? 'success' : 'error'}
                    className="text-[10px]"
                  >
                    {delivery.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl backdrop-blur-xl">
        <p className="text-xs text-white/30">
          <span className="text-white/50 font-medium">Security:</span> API keys provide full access
          to the scopes you grant. Store them securely and never expose them in client-side code.
          All API requests are logged and rate-limited. Webhook payloads are signed with
          HMAC-SHA256 via the{' '}
          <span className="font-mono text-white/50">X-Memelli-Signature</span> header.
        </p>
      </div>

      {/* ---- Create API Key Modal ---- */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create API Key"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createKeyMutation.mutate();
          }}
          className="space-y-5"
        >
          <Input
            label="Key Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g., Production Integration"
            required
          />

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Expiration</label>
            <div className="flex flex-wrap gap-2">
              {EXPIRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormExpiration(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    formExpiration === opt.value
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/[0.1]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Scopes</label>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {SCOPE_GROUPS.map((group) => {
                const groupScopes = AVAILABLE_SCOPES.filter((s) => s.group === group);
                const allSelected = groupScopes.every((s) => formScopes.includes(s.id));
                const someSelected = groupScopes.some((s) => formScopes.includes(s.id));

                return (
                  <div
                    key={group}
                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                  >
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleScopeGroup(group)}
                        className="accent-red-500 rounded"
                      />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                        {group}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 ml-5">
                      {groupScopes.map((scope) => (
                        <label key={scope.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                            className="accent-red-500 rounded"
                          />
                          <span className="text-xs text-white/40">{scope.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {formScopes.length > 0 && (
              <p className="mt-2 text-xs text-white/30">
                {formScopes.length} scope{formScopes.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createKeyMutation.isPending} className="flex-1">
              Create Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Generated Key Display Modal ---- */}
      <Modal
        isOpen={showGeneratedKeyModal}
        onClose={() => {
          setShowGeneratedKeyModal(false);
          setGeneratedKey(null);
        }}
        title="API Key Created"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80">
              Copy this key now. It will not be shown again.
            </p>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Your API Key</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white/70 font-mono flex-1 break-all select-all">
                {generatedKey}
              </code>
              <CopyButton
                text={generatedKey ?? ''}
                size="sm"
                onCopy={() => toast.success('API key copied to clipboard')}
              />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
            <p className="text-xs text-white/30">
              Use this key in the <span className="font-mono text-white/50">X-API-Key</span> header
              for all API requests.
            </p>
            <pre className="mt-2 text-[11px] text-white/40 font-mono bg-white/[0.03] rounded-lg p-2 overflow-x-auto">
              {`curl -H "X-API-Key: ${generatedKey?.slice(0, 20)}..." \\
  ${process.env.NEXT_PUBLIC_API_URL || 'https://api.memelli.com'}/api/contacts`}
            </pre>
          </div>

          <Button
            onClick={() => {
              setShowGeneratedKeyModal(false);
              setGeneratedKey(null);
            }}
            className="w-full"
          >
            I have saved the key
          </Button>
        </div>
      </Modal>

      {/* ---- Add Webhook Modal ---- */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => {
          setShowWebhookModal(false);
          setWebhookUrl('');
          setWebhookEvents([]);
        }}
        title="Add Webhook Endpoint"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createWebhookMutation.mutate();
          }}
          className="space-y-5"
        >
          <Input
            label="Endpoint URL"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            required
          />

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Events</label>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {WEBHOOK_EVENT_GROUPS.map((group) => {
                const groupEvents = WEBHOOK_EVENTS.filter((e) => e.group === group);
                return (
                  <div
                    key={group}
                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
                  >
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wide block mb-2">
                      {group}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {groupEvents.map((ev) => (
                        <label key={ev.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes(ev.id)}
                            onChange={() => toggleWebhookEvent(ev.id)}
                            className="accent-red-500 rounded"
                          />
                          <span className="text-xs text-white/40">{ev.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {webhookEvents.length > 0 && (
              <p className="mt-2 text-xs text-white/30">
                {webhookEvents.length} event{webhookEvents.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowWebhookModal(false);
                setWebhookUrl('');
                setWebhookEvents([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createWebhookMutation.isPending} className="flex-1">
              Create Endpoint
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Revoke Confirmation ---- */}
      <ConfirmDialog
        open={revokeConfirmOpen}
        onCancel={() => {
          setRevokeConfirmOpen(false);
          setRevokingKeyId(null);
        }}
        onConfirm={() => {
          if (revokingKeyId) revokeKeyMutation.mutate(revokingKeyId);
        }}
        title="Revoke API Key"
        description="Are you sure you want to revoke this API key? Any integrations using this key will immediately lose access. This action cannot be undone."
        variant="destructive"
        confirmLabel="Revoke Key"
        loading={revokeKeyMutation.isPending}
      />
    </div>
  );
}
