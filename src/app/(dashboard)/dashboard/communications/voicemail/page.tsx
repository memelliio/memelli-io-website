'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Voicemail, Phone, Clock, Circle, Trash2, CheckCheck, Search,
  Play, Pause, X,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  Card,
  CardContent,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VoicemailItem {
  id: string;
  fromNumber: string;
  fromName?: string | null;
  duration: number;
  createdAt: string;
  isRead: boolean;
  transcription?: string | null;
  audioUrl?: string | null;
}

interface PaginatedVoicemails {
  data: VoicemailItem[];
  meta: { total: number; page: number; perPage: number };
}

type FilterMode = 'all' | 'unread' | 'read';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / 3600000;

  if (diffHrs < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
  if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
  if (diffHrs < 48) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trimEnd() + '...';
}

/* ------------------------------------------------------------------ */
/*  Audio Player                                                       */
/* ------------------------------------------------------------------ */

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card backdrop-blur-xl border border-white/[0.04] px-4 py-3">
      <button
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/80 transition-all duration-200"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/80 transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function VoicemailPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  /* ---- Data fetching ---- */

  // The API returns { success, data: [...], meta: { total, page, perPage } }.
  // useApi unwraps the envelope: when meta is present it returns { data, meta } as T.
  const { data: paginatedResult, isLoading, isError } = useQuery<PaginatedVoicemails>({
    queryKey: ['voicemails'],
    queryFn: async () => {
      const res = await api.get<PaginatedVoicemails>('/api/comms/voicemail');
      if (res.error) throw new Error(res.error);
      return res.data ?? { data: [], meta: { total: 0, page: 1, perPage: 25 } };
    },
  });

  const voicemails: VoicemailItem[] = paginatedResult?.data ?? [];

  /* ---- Mutations ---- */

  // Uses the dedicated PATCH /api/comms/voicemail/:id/read endpoint.
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/comms/voicemail/${id}/read`, {});
      if (res.error) throw new Error(res.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['voicemails'] });
      const prev = queryClient.getQueryData<PaginatedVoicemails>(['voicemails']);
      queryClient.setQueryData<PaginatedVoicemails>(['voicemails'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((vm) => (vm.id === id ? { ...vm, isRead: true } : vm)),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['voicemails'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['voicemails'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.del(`/api/comms/voicemail/${id}`);
      if (res.error) throw new Error(res.error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['voicemails'] });
      const prev = queryClient.getQueryData<PaginatedVoicemails>(['voicemails']);
      queryClient.setQueryData<PaginatedVoicemails>(['voicemails'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((vm) => vm.id !== id),
          meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
        };
      });
      if (expandedId === id) setExpandedId(null);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['voicemails'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['voicemails'] }),
  });

  /* ---- Derived state ---- */

  const unreadCount = voicemails.filter((vm) => !vm.isRead).length;

  const filtered = voicemails.filter((vm) => {
    if (filter === 'unread' && vm.isRead) return false;
    if (filter === 'read' && !vm.isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        vm.fromNumber.toLowerCase().includes(q) ||
        vm.fromName?.toLowerCase().includes(q) ||
        vm.transcription?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ---- Handlers ---- */

  function handleCardClick(vm: VoicemailItem) {
    setExpandedId(expandedId === vm.id ? null : vm.id);
    if (!vm.isRead) markReadMutation.mutate(vm.id);
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        title="Voicemail"
        subtitle={
          isLoading
            ? 'Loading...'
            : `${voicemails.length} message${voicemails.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` \u00b7 ${unreadCount} unread` : ''}`
        }
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Voicemail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {(['all', 'unread', 'read'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-all duration-200 ${
                  filter === mode
                    ? 'border-primary/50 bg-primary/80/[0.08] text-primary/80'
                    : 'border-white/[0.06] bg-muted text-muted-foreground hover:bg-muted hover:border-white/[0.08]'
                }`}
              >
                {mode === 'all' ? 'All' : mode === 'unread' ? 'Unread' : 'Read'}
              </button>
            ))}
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search voicemails..."
          className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="card" height={88} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <EmptyState
          icon={<Voicemail className="h-6 w-6" />}
          title="Failed to load voicemails"
          description="There was an error fetching your voicemails. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['voicemails'] }),
          }}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Voicemail className="h-6 w-6" />}
          title={searchQuery || filter !== 'all' ? 'No matching voicemails' : 'No voicemails yet'}
          description={
            searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'When callers leave a voicemail, it will appear here.'
          }
        />
      )}

      {/* Voicemail list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((vm) => {
            const isExpanded = expandedId === vm.id;
            return (
              <Card
                key={vm.id}
                className={`transition-all duration-200 border bg-card backdrop-blur-xl rounded-2xl ${
                  !vm.isRead
                    ? 'border-primary/20'
                    : 'border-white/[0.04]'
                } ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}
              >
                <CardContent className="p-0">
                  {/* Clickable summary row */}
                  <button
                    onClick={() => handleCardClick(vm)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-white/[0.04] transition-all duration-200 rounded-2xl"
                  >
                    {/* Unread dot */}
                    <div className="w-2.5 shrink-0 flex justify-center">
                      {!vm.isRead && (
                        <Circle className="h-2.5 w-2.5 fill-purple-400 text-primary" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                        !vm.isRead
                          ? 'bg-primary/80/[0.08] border border-primary/20'
                          : 'bg-muted border border-white/[0.04]'
                      }`}
                    >
                      <Voicemail
                        className={`h-5 w-5 ${!vm.isRead ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm truncate ${
                            !vm.isRead
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-muted-foreground'
                          }`}
                        >
                          {vm.fromName ?? vm.fromNumber}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
                          {formatDate(vm.createdAt)}
                        </span>
                      </div>
                      {vm.fromName && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">{vm.fromNumber}</span>
                        </div>
                      )}
                      {vm.transcription && (
                        <p className="text-xs text-muted-foreground leading-relaxed truncate mt-1">
                          {truncate(vm.transcription, 100)}
                        </p>
                      )}
                    </div>

                    {/* Duration badge */}
                    <Badge variant="muted" className="shrink-0 font-mono text-[11px] bg-muted border border-white/[0.04] text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(vm.duration)}
                    </Badge>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] px-6 py-4 space-y-4">
                      {/* Audio player */}
                      {vm.audioUrl && <AudioPlayer src={vm.audioUrl} />}

                      {/* Full transcription */}
                      {vm.transcription && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                            Transcription
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {vm.transcription}
                          </p>
                        </div>
                      )}

                      {/* No audio or transcript fallback */}
                      {!vm.audioUrl && !vm.transcription && (
                        <p className="text-xs text-muted-foreground italic">
                          No audio or transcription available for this voicemail.
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {!vm.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markReadMutation.mutate(vm.id)}
                            disabled={markReadMutation.isPending}
                            className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                          >
                            <CheckCheck className="h-4 w-4 mr-1.5" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(vm.id)}
                          disabled={deleteMutation.isPending}
                          className="text-primary hover:text-primary/80 hover:bg-primary/80/[0.08] rounded-xl"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(null)}
                          className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
