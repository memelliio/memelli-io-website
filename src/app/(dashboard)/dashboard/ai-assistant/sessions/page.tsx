'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Clock, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  Badge,
  Skeleton,
  EmptyState,
  SearchInput,
  ConfirmDialog,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Session {
  id: string;
  title: string;
  agentType?: string;
  preview?: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SessionsResponse {
  items: Session[];
  total?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string) {
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

function formatDuration(createdAt: string, lastMessageAt?: string) {
  if (!lastMessageAt) return '--';
  const start = new Date(createdAt).getTime();
  const end = new Date(lastMessageAt).getTime();
  const diffMs = Math.max(0, end - start);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function AISessionsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);

  /* ---------- Fetch sessions ---------- */

  const {
    data: sessions = [],
    isLoading,
  } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: async () => {
      const res = await api.get<SessionsResponse>('/api/ai/sessions?perPage=100');
      return res.data?.items ?? [];
    },
  });

  /* ---------- Delete mutation ---------- */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/ai/sessions/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
      toast.success('Session deleted');
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete session');
    },
  });

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }, [deleteTarget, deleteMutation]);

  /* ---------- Search filter ---------- */

  const filtered = useMemo(() => {
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.agentType?.toLowerCase().includes(q) ||
        s.preview?.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  /* ---------- Group by date ---------- */

  const grouped = useMemo(() => {
    const map: Record<string, Session[]> = {};
    filtered.forEach((s) => {
      const date = new Date(s.createdAt).toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!map[date]) map[date] = [];
      map[date].push(s);
    });
    return map;
  }, [filtered]);

  /* ---------- Render ---------- */

  return (
    <div className="space-y-8 bg-card min-h-screen">
      {/* Header */}
      <PageHeader
        title="AI Sessions"
        subtitle="Manage your AI conversation history"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Assistant', href: '/dashboard/ai-assistant' },
          { label: 'Sessions' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/ai-assistant')}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
          >
            <MessageSquare className="h-4 w-4 text-foreground" />
            New Chat
          </Button>
        }
      />

      {/* Search */}
      <div className="p-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sessions by title, agent, or content..."
          className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-6 p-8">
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
          <Skeleton variant="card" count={1} height={80} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
            title={search ? 'No sessions match your search' : 'No sessions yet'}
            description={
              search
                ? 'Try adjusting your search terms.'
                : 'Start a conversation with the AI assistant to see your sessions here.'
            }
            action={
              !search
                ? {
                    label: 'Start chatting',
                    onClick: () => router.push('/dashboard/ai-assistant'),
                  }
                : undefined
            }
            className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl"
          />
        </div>
      ) : (
        /* Grouped session cards */
        <div className="space-y-8 p-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="space-y-6">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {date}
              </h3>
              <div className="space-y-3">
                {items.map((s) => (
                  <Card
                    key={s.id}
                    className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        {/* Session info - clickable area */}
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/ai-assistant?session=${s.id}`)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <p className="text-2xl font-semibold tracking-tight text-foreground truncate">
                              {s.title || 'Untitled Session'}
                            </p>
                            {s.agentType && (
                              <Badge variant="primary" className="text-[10px] bg-primary/80/[0.08] text-primary/80 border border-white/[0.04] rounded-xl shrink-0">
                                {s.agentType}
                              </Badge>
                            )}
                          </div>

                          {s.preview && (
                            <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-1">
                              {s.preview}
                            </p>
                          )}

                          {/* Meta row: message count, last active, duration */}
                          <div className="mt-4 flex items-center gap-6 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              {s.messageCount} message{s.messageCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {timeAgo(s.lastMessageAt ?? s.createdAt)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDuration(s.createdAt, s.lastMessageAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/ai-assistant?session=${s.id}`)
                            }
                            className="bg-muted hover:bg-muted border border-white/[0.06] hover:border-white/[0.08] rounded-xl p-3 text-muted-foreground hover:text-primary transition-all duration-200"
                            title="Continue session"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(s);
                            }}
                            className="bg-muted hover:bg-primary/80/[0.08] border border-white/[0.06] hover:border-primary/50 rounded-xl p-3 text-muted-foreground hover:text-primary/80 transition-all duration-200"
                            title="Delete session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Session"
        description={`Are you sure you want to delete "${deleteTarget?.title || 'Untitled'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}