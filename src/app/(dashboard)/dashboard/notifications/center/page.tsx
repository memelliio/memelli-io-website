'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Zap,
  Activity,
  AlertTriangle,
  Search,
  Settings2,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  ShoppingCart,
  Users,
  Megaphone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  TrendingUp,
  Clock,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  type BadgeVariant,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Notification {
  id: string;
  title: string;
  body: string;
  channel: string;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type TabFilter = 'all' | 'unread' | 'system' | 'marketing' | 'crm' | 'commerce';
type PriorityLevel = 'low' | 'normal' | 'high' | 'critical';

interface NotificationPrefs {
  system: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
  marketing: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
  crm: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
  commerce: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
  alerts: { email: boolean; sms: boolean; push: boolean; inApp: boolean };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS: { value: TabFilter; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'unread', label: 'Unread', icon: BellOff },
  { value: 'system', label: 'System', icon: Zap },
  { value: 'marketing', label: 'Marketing', icon: Megaphone },
  { value: 'crm', label: 'CRM', icon: Users },
  { value: 'commerce', label: 'Commerce', icon: ShoppingCart },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  system: ['system', 'account', 'security', 'update', 'maintenance', 'deploy', 'server', 'backup', 'config'],
  marketing: ['marketing', 'campaign', 'email', 'newsletter', 'promotion', 'seo', 'traffic', 'content', 'social'],
  crm: ['crm', 'contact', 'deal', 'pipeline', 'lead', 'client', 'customer', 'followup', 'meeting'],
  commerce: ['commerce', 'order', 'payment', 'product', 'store', 'subscription', 'refund', 'checkout', 'cart', 'auction'],
};

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  system: Zap,
  marketing: Megaphone,
  crm: Users,
  commerce: ShoppingCart,
};

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; badgeVariant: BadgeVariant }> = {
  low: { label: 'Low', color: 'text-muted-foreground', badgeVariant: 'default' },
  normal: { label: 'Normal', color: 'text-muted-foreground', badgeVariant: 'info' },
  high: { label: 'High', color: 'text-amber-400', badgeVariant: 'warning' },
  critical: { label: 'Critical', color: 'text-red-400', badgeVariant: 'destructive' },
};

const CHANNEL_ICONS: Record<string, React.ComponentType<any>> = {
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
  inApp: Monitor,
};

const DEFAULT_PREFS: NotificationPrefs = {
  system: { email: true, sms: false, push: true, inApp: true },
  marketing: { email: true, sms: false, push: false, inApp: true },
  crm: { email: true, sms: true, push: true, inApp: true },
  commerce: { email: true, sms: true, push: true, inApp: true },
  alerts: { email: true, sms: true, push: true, inApp: true },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function detectCategory(n: Notification): string {
  const type = (n.metadata?.type as string) ?? '';
  const category = (n.metadata?.category as string) ?? '';
  const combined = `${type} ${category} ${n.title} ${n.body}`.toLowerCase();

  for (const cat of ['commerce', 'crm', 'marketing', 'system']) {
    if (CATEGORY_KEYWORDS[cat].some((kw) => combined.includes(kw))) return cat;
  }
  return 'system';
}

function detectPriority(n: Notification): PriorityLevel {
  if (n.priority) return n.priority;
  const combined = `${n.title} ${n.body}`.toLowerCase();
  if (combined.includes('critical') || combined.includes('urgent') || combined.includes('emergency')) return 'critical';
  if (combined.includes('important') || combined.includes('warning') || combined.includes('alert')) return 'high';
  if (combined.includes('info') || combined.includes('update')) return 'low';
  return 'normal';
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Older';
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  const order = ['Today', 'Yesterday', 'This Week', 'Older'];

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  }

  return order.filter((label) => groups[label]?.length).map((label) => ({ label, items: groups[label] }));
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-white/[0.04]">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-start gap-4 px-6 py-5">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2.5">
            <Skeleton variant="line" width="55%" height={16} />
            <Skeleton variant="line" width="85%" height={14} />
            <Skeleton variant="line" width="25%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preferences Panel                                                  */
/* ------------------------------------------------------------------ */

function PreferencesPanel({
  prefs,
  onUpdate,
  onClose,
}: {
  prefs: NotificationPrefs;
  onUpdate: (prefs: NotificationPrefs) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<NotificationPrefs>(prefs);

  const categories = [
    { key: 'system' as const, label: 'System', icon: Zap, desc: 'Server, deployment, security alerts' },
    { key: 'marketing' as const, label: 'Marketing', icon: Megaphone, desc: 'Campaigns, content, SEO updates' },
    { key: 'crm' as const, label: 'CRM', icon: Users, desc: 'Contacts, deals, pipeline activity' },
    { key: 'commerce' as const, label: 'Commerce', icon: ShoppingCart, desc: 'Orders, payments, store events' },
    { key: 'alerts' as const, label: 'Alerts', icon: AlertTriangle, desc: 'Critical and high-priority alerts' },
  ];

  const channels = [
    { key: 'email' as const, label: 'Email', icon: Mail },
    { key: 'sms' as const, label: 'SMS', icon: MessageSquare },
    { key: 'push' as const, label: 'Push', icon: Smartphone },
    { key: 'inApp' as const, label: 'In-App', icon: Monitor },
  ];

  function toggle(category: keyof NotificationPrefs, channel: keyof NotificationPrefs['system']) {
    setLocal((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-red-400" />
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="px-6 py-4">
        {/* Channel headers */}
        <div className="mb-4 grid grid-cols-[1fr_repeat(4,64px)] items-center gap-2">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</div>
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.key} className="flex flex-col items-center gap-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">{ch.label}</span>
              </div>
            );
          })}
        </div>

        {/* Category rows */}
        <div className="space-y-1">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div
                key={cat.key}
                className="grid grid-cols-[1fr_repeat(4,64px)] items-center gap-2 rounded-xl px-3 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                    <CatIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
                  </div>
                </div>
                {channels.map((ch) => (
                  <div key={ch.key} className="flex justify-center">
                    <button
                      onClick={() => toggle(cat.key, ch.key)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        local[cat.key][ch.key]
                          ? 'bg-red-500/80'
                          : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          local[cat.key][ch.key] ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-white/[0.04] px-6 py-4">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            onUpdate(local);
            toast.success('Notification preferences saved');
            onClose();
          }}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification Row                                                   */
/* ------------------------------------------------------------------ */

function NotificationRow({
  notification: n,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const category = detectCategory(n);
  const priority = detectPriority(n);
  const CatIcon = CATEGORY_ICON_MAP[category] ?? Bell;
  const priorityConfig = PRIORITY_CONFIG[priority];

  return (
    <li
      onClick={() => {
        if (!n.isRead) onMarkRead(n.id);
      }}
      className={`group relative flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-white/[0.02] ${
        !n.isRead
          ? 'border-l-[3px] border-l-red-500 bg-red-500/[0.03]'
          : 'border-l-[3px] border-l-transparent'
      }`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          !n.isRead
            ? 'bg-red-500/15 text-red-400'
            : 'bg-white/[0.04] text-muted-foreground'
        }`}
      >
        <CatIcon className="h-4.5 w-4.5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm leading-snug ${
                  n.isRead ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground'
                }`}
              >
                {n.title}
              </p>
              {!n.isRead && (
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
              )}
              {priority !== 'normal' && (
                <Badge variant={priorityConfig.badgeVariant} className="text-[10px] uppercase tracking-wider">
                  {priorityConfig.label}
                </Badge>
              )}
            </div>
            {n.body && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {n.body}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="default" className="text-[10px] capitalize bg-white/[0.04] text-muted-foreground">
                {category}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(n.createdAt)}
              </span>
              {n.actionUrl && (
                <a
                  href={n.actionUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  View
                </a>
              )}
            </div>
          </div>

          {/* Hover actions */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!n.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(n.id);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                title="Mark as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {n.actionUrl && (
              <a
                href={n.actionUrl}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                title="Open"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function NotificationCenterPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [page, setPage] = useState(1);
  const perPage = 30;

  /* ---- Real-time unread counter ---- */
  const { data: counterData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { unread: number } }>(
        '/api/notifications?isRead=false&perPage=1'
      );
      if (res.error) return { unread: 0 };
      const raw = res.data;
      if (raw && 'meta' in (raw as Record<string, unknown>)) {
        return { unread: ((raw as Record<string, unknown>).meta as { total?: number })?.total ?? 0 };
      }
      if (raw && 'data' in raw && Array.isArray(raw.data)) {
        return { unread: raw.data.length };
      }
      return { unread: 0 };
    },
    refetchInterval: 15000,
  });

  const globalUnread = counterData?.unread ?? 0;

  /* ---- Fetch notifications ---- */
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-center', activeTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (activeTab === 'unread') params.set('isRead', 'false');

      const res = await api.get<{
        success: boolean;
        data: Notification[];
        meta?: { total: number; page: number; perPage: number };
      }>(`/api/notifications?${params}`);

      if (res.error) throw new Error(res.error);
      const raw = res.data;
      let list: Notification[] = [];
      let total = 0;

      if (raw && 'data' in raw && Array.isArray(raw.data)) {
        list = raw.data;
        total = raw.meta?.total ?? list.length;
      } else if (Array.isArray(raw)) {
        list = raw as unknown as Notification[];
        total = list.length;
      }

      return { notifications: list, total };
    },
  });

  const allNotifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  /* ---- Filtering ---- */
  const filtered = useMemo(() => {
    let items = allNotifications;

    // Category filter
    if (activeTab !== 'all' && activeTab !== 'unread') {
      items = items.filter((n) => detectCategory(n) === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      );
    }

    return items;
  }, [allNotifications, activeTab, searchQuery]);

  const unreadInView = filtered.filter((n) => !n.isRead).length;
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  /* ---- Tab counts ---- */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, unread: 0, system: 0, marketing: 0, crm: 0, commerce: 0 };
    for (const n of allNotifications) {
      counts.all++;
      if (!n.isRead) counts.unread++;
      const cat = detectCategory(n);
      if (cat in counts) counts[cat]++;
    }
    return counts;
  }, [allNotifications]);

  /* ---- Mutations ---- */
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/notifications/${id}/read`, {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/notifications/read-all', {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/notifications/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications-center'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  /* ---- Pagination ---- */
  const pageStart = (page - 1) * perPage + 1;
  const pageEnd = Math.min(page * perPage, total);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <PageHeader
        title="Notification Center"
        subtitle={
          globalUnread > 0
            ? `${globalUnread} unread notification${globalUnread !== 1 ? 's' : ''}`
            : 'All caught up'
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Real-time counter badge */}
            {globalUnread > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                <Bell className="h-4 w-4 text-red-400 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">{globalUnread}</span>
              </div>
            )}
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => setShowPrefs(!showPrefs)}
            >
              Preferences
            </Button>
            {unreadInView > 0 && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<CheckCheck className="h-4 w-4" />}
                onClick={() => markAllReadMutation.mutate()}
                isLoading={markAllReadMutation.isPending}
              >
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* Preferences panel */}
      {showPrefs && (
        <PreferencesPanel
          prefs={prefs}
          onUpdate={setPrefs}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tabCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-red-500/15 text-red-400 shadow-sm shadow-red-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      activeTab === tab.value
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-white/[0.06] text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-xl focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors sm:w-72"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: total, icon: Bell, color: 'text-muted-foreground' },
          { label: 'Unread', value: globalUnread, icon: BellOff, color: 'text-red-400' },
          { label: 'High Priority', value: allNotifications.filter((n) => ['high', 'critical'].includes(detectPriority(n))).length, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Today', value: allNotifications.filter((n) => getDateGroup(n.createdAt) === 'Today').length, icon: Clock, color: 'text-emerald-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`mt-1 text-xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Notification list grouped by date */}
      <div className="rounded-2xl border border-white/[0.06] bg-card backdrop-blur-xl overflow-hidden">
        {isLoading ? (
          <NotificationSkeleton />
        ) : filtered.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title={searchQuery ? 'No matching notifications' : 'No notifications'}
              description={
                searchQuery
                  ? `No notifications match "${searchQuery}". Try a different search.`
                  : activeTab === 'unread'
                    ? 'You are all caught up.'
                    : activeTab !== 'all'
                      ? `No ${activeTab} notifications found.`
                      : 'Notifications will appear here as activity occurs.'
              }
            />
          </div>
        ) : (
          <div>
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date group header */}
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.04] bg-card backdrop-blur-md px-6 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.items.length} notification{group.items.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 border-t border-white/[0.04]" />
                </div>

                {/* Items */}
                <ul className="divide-y divide-white/[0.03]">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onMarkRead={(id) => markReadMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl px-5 py-3.5">
          <p className="text-sm text-muted-foreground">
            Showing {pageStart}&ndash;{pageEnd} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-xl text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-red-600 text-white'
                      : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
