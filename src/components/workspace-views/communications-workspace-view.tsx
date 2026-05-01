'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Phone,
  MessageSquare,
  Mail,
  Headphones,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
} from 'lucide-react';
import {
  MetricTile,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LineChart,
  Badge,
  Skeleton,
} from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CommsAnalytics {
  totalCalls: number;
  callsTrend: number;
  messagesSent: number;
  messagesTrend: number;
  openTickets: number;
  ticketsTrend: number;
  avgResponseTime: string;
  responseTrend: number;
  callVolume: { date: string; calls: number }[];
  recentCalls: RecentCall[];
  recentMessages: RecentMessage[];
}

interface RecentCall {
  id: string;
  direction: 'inbound' | 'outbound';
  contact: string;
  number: string;
  duration: string;
  status: 'completed' | 'missed' | 'voicemail';
  timestamp: string;
}

interface RecentMessage {
  id: string;
  channel: 'sms' | 'email';
  contact: string;
  preview: string;
  status: 'delivered' | 'read' | 'pending' | 'failed';
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CommunicationsWorkspaceViewProps {
  compact?: boolean;
  context?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function trendDirection(v: number): 'up' | 'down' | 'flat' {
  if (v > 0) return 'up';
  if (v < 0) return 'down';
  return 'flat';
}

const statusColors: Record<string, string> = {
  completed: 'success',
  missed: 'destructive',
  voicemail: 'warning',
  delivered: 'success',
  read: 'info',
  pending: 'warning',
  failed: 'destructive',
};

const directionIcons = {
  inbound: PhoneIncoming,
  outbound: PhoneOutgoing,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CommunicationsWorkspaceView({ compact = false }: CommunicationsWorkspaceViewProps) {
  const api = useApi();

  const { data, isLoading } = useQuery<CommsAnalytics>({
    queryKey: ['comms-analytics'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: CommsAnalytics }>('/api/comms/analytics');
      if (res.error) throw new Error(res.error);
      return res.data!.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[260px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Total Calls"
          value={data?.totalCalls?.toLocaleString() ?? '0'}
          icon={<Phone className="h-4 w-4 text-red-400" />}
          trend={trendDirection(data?.callsTrend ?? 0)}
          change={data?.callsTrend ?? 0}
        />
        <MetricTile
          label="Messages Sent"
          value={data?.messagesSent?.toLocaleString() ?? '0'}
          icon={<MessageSquare className="h-4 w-4 text-red-300" />}
          trend={trendDirection(data?.messagesTrend ?? 0)}
          change={data?.messagesTrend ?? 0}
        />
        <MetricTile
          label="Open Tickets"
          value={data?.openTickets?.toLocaleString() ?? '0'}
          icon={<Headphones className="h-4 w-4 text-red-300" />}
          trend={trendDirection(data?.ticketsTrend ?? 0)}
          change={data?.ticketsTrend ?? 0}
        />
        <MetricTile
          label="Avg Response Time"
          value={data?.avgResponseTime ?? '--'}
          icon={<Clock className="h-4 w-4 text-red-300" />}
          trend={trendDirection(data?.responseTrend ?? 0)}
          change={data?.responseTrend ?? 0}
        />
      </div>

      {/* Call Volume Chart */}
      {!compact && (
        <Card className="border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))] tracking-tight text-base">
              <Phone className="h-4 w-4 text-red-400" />
              Call Volume (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {data?.callVolume && data.callVolume.length > 0 ? (
              <LineChart data={data.callVolume} xKey="date" yKey="calls" color="#E11D2E" height={240} />
            ) : (
              <div className="flex items-center justify-center h-[240px] text-[hsl(var(--muted-foreground))] text-sm">
                No call volume data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Calls + Messages */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Calls */}
        <Card className="border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))] text-sm tracking-tight">
              <Phone className="h-4 w-4 text-red-400" /> Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.recentCalls || data.recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[hsl(var(--muted-foreground))]">
                <Phone className="h-6 w-6 mb-2 text-[hsl(var(--muted-foreground))]" />
                <p className="text-sm">No recent calls</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {data.recentCalls.slice(0, compact ? 5 : 10).map((call) => {
                  const DirIcon = directionIcons[call.direction];
                  return (
                    <div key={call.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors duration-150">
                      <div className="rounded-xl bg-white/[0.04] p-2 text-[hsl(var(--muted-foreground))]">
                        <DirIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{call.contact}</span>
                          <Badge variant={(statusColors[call.status] as any) ?? 'default'}>{call.status}</Badge>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{call.number} &middot; {call.duration}</p>
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{relativeTime(call.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="border-white/[0.04] bg-[hsl(var(--card))] backdrop-blur-xl rounded-2xl">
          <CardHeader className="p-5">
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))] text-sm tracking-tight">
              <MessageSquare className="h-4 w-4 text-red-400" /> Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.recentMessages || data.recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[hsl(var(--muted-foreground))]">
                <MessageSquare className="h-6 w-6 mb-2 text-[hsl(var(--muted-foreground))]" />
                <p className="text-sm">No recent messages</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {data.recentMessages.slice(0, compact ? 5 : 10).map((msg) => {
                  const ChannelIcon = msg.channel === 'sms' ? MessageSquare : Mail;
                  return (
                    <div key={msg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors duration-150">
                      <div className="rounded-xl bg-white/[0.04] p-2 text-[hsl(var(--muted-foreground))]">
                        <ChannelIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{msg.contact}</span>
                          <Badge variant={(statusColors[msg.status] as any) ?? 'default'}>{msg.status}</Badge>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">{msg.preview}</p>
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{relativeTime(msg.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
