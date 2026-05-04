'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  UserPlus,
  ArrowRightLeft,
  DollarSign,
  CheckCircle2,
  Download,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LiteNotification {
  id: string;
  type: 'referral' | 'conversion' | 'earning' | 'payout' | 'asset' | 'system';
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

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
  return new Date(dateStr).toLocaleDateString();
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  referral: UserPlus,
  conversion: ArrowRightLeft,
  earning: DollarSign,
  payout: CheckCircle2,
  asset: Download,
  system: Bell,
};

const typeColors: Record<string, string> = {
  referral: 'text-blue-400/70 bg-blue-500/10',
  conversion: 'text-red-400/70 bg-red-500/10',
  earning: 'text-emerald-400/70 bg-emerald-500/10',
  payout: 'text-emerald-400/70 bg-emerald-500/10',
  asset: 'text-amber-400/70 bg-amber-500/10',
  system: 'text-white/30 bg-white/[0.04]',
};

const typeRoutes: Record<string, string> = {
  referral: '/lite/referrals',
  conversion: '/lite/referrals',
  earning: '/lite/payouts',
  payout: '/lite/payouts',
  asset: '/lite/marketing',
  system: '/lite',
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function NotificationsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const router = useRouter();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<LiteNotification[]>({
    queryKey: ['lite-notifications'],
    queryFn: async () => {
      const res = await api.get<LiteNotification[]>('/api/lite/notifications');
      if (res.error || !res.data) return [];
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 15_000,
  });

  // Mark single read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/lite/notifications/${id}`, { read: true });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lite-notifications'] }),
  });

  // Mark all read
  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/lite/notifications/mark-all-read', {});
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      qc.invalidateQueries({ queryKey: ['lite-notifications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  function handleClick(notif: LiteNotification) {
    if (!notif.read) {
      markRead.mutate(notif.id);
    }
    const target = notif.href ?? typeRoutes[notif.type] ?? '/lite';
    router.push(target);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-white/[0.04] bg-zinc-900/60 backdrop-blur-xl">
        {isLoading ? (
          <div className="divide-y divide-white/[0.03]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-5 animate-pulse rounded-lg bg-white/[0.03]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-zinc-400">No notifications yet.</p>
            <p className="mt-1 text-xs text-zinc-400/60">
              You will be notified about new referrals, conversions, earnings, and more.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {items.map((notif) => {
              const Icon = typeIcons[notif.type] ?? Bell;
              const colorClass = typeColors[notif.type] ?? 'text-zinc-400 bg-white/[0.04]';
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-white/[0.04] ${
                    !notif.read ? 'bg-white/[0.015]' : ''
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {!notif.read ? (
                      <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                    ) : (
                      <div className="h-2.5 w-2.5" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${colorClass.split(' ')[1]}`}>
                    <Icon className={`h-4 w-4 ${colorClass.split(' ')[0]}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${!notif.read ? 'text-white/80' : 'text-zinc-400'}`}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{notif.body}</p>
                  </div>

                  {/* Time */}
                  <span className="shrink-0 text-xs text-zinc-400/60">{timeAgo(notif.createdAt)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
