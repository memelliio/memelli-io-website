'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  UserPlus,
  FileText,
  GitMerge,
  CheckCircle2,
  AlertCircle,
  Settings,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProNotification {
  id: string;
  type: 'new_client' | 'document_submission' | 'stage_change' | 'conversion' | 'system';
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  link?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const typeIcons: Record<string, React.ComponentType<any>> = {
  new_client: UserPlus,
  document_submission: FileText,
  stage_change: GitMerge,
  conversion: CheckCircle2,
  system: Settings,
};

const typeColors: Record<string, string> = {
  new_client: 'bg-blue-500/10 text-blue-400',
  document_submission: 'bg-amber-500/10 text-amber-400',
  stage_change: 'bg-red-500/10 text-red-400',
  conversion: 'bg-emerald-500/10 text-emerald-400',
  system: 'bg-white/[0.04] text-zinc-400',
};

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low: 'bg-white/[0.04] text-zinc-400',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProNotificationsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<ProNotification[]>({
    queryKey: ['pro-notifications'],
    queryFn: async () => {
      const res = await api.get<ProNotification[]>('/api/pro/notifications');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 15_000,
  });

  // Toggle read
  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const res = await api.patch(`/api/pro/notifications/${id}`, { read });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-notifications'] });
    },
  });

  // Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/pro/notifications/mark-all-read', {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['pro-notifications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  function handleClick(notif: ProNotification) {
    if (!notif.read) {
      toggleReadMutation.mutate({ id: notif.id, read: true });
    }
    if (notif.link) {
      router.push(notif.link);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.06]"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex h-20 animate-pulse border-b border-white/[0.04] bg-zinc-900/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Bell className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/30">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {items.map((notif) => {
              const Icon = typeIcons[notif.type] ?? AlertCircle;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-white/[0.04] ${
                    !notif.read ? 'bg-white/[0.015]' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${typeColors[notif.type] ?? 'bg-white/[0.04] text-zinc-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <p className={`text-sm font-medium ${notif.read ? 'text-white/50' : 'text-white/80'}`}>
                        {notif.title}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-white/30 line-clamp-2">{notif.body}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[10px] text-white/20">{timeAgo(notif.createdAt)}</span>
                    <span className={`rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase ${priorityColors[notif.priority] ?? ''}`}>
                      {notif.priority}
                    </span>
                  </div>

                  {/* Toggle read button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReadMutation.mutate({ id: notif.id, read: !notif.read });
                    }}
                    className="mt-1 shrink-0 rounded-lg p-1 text-white/15 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
                    title={notif.read ? 'Mark unread' : 'Mark read'}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
