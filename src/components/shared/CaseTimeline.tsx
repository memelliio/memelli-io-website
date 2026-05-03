'use client';

import { useEffect, useState, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge, type BadgeVariant } from '@memelli/ui';
import { useApi } from '../../hooks/useApi';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  summary?: string | null;
  sourceEngine?: string | null;
  agentRole?: string | null;
  relatedRecordId?: string | null;
  relatedRecordType?: string | null;
  relatedRecordUrl?: string | null;
  occurredAt: string;
  createdAt: string;
}

interface CaseTimelineProps {
  clientId: string;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Badge variant mapping                                              */
/* ------------------------------------------------------------------ */

const EVENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  DISPUTE_SENT: 'info',
  DISPUTE_RESPONSE: 'warning',
  LETTER_GENERATED: 'default',
  CREDIT_PULL: 'primary',
  SCORE_UPDATE: 'success',
  DOCUMENT_UPLOADED: 'default',
  PAYMENT_RECEIVED: 'success',
  STATUS_CHANGE: 'warning',
  NOTE: 'default',
  SYSTEM: 'default',
  CALL: 'success',
  EMAIL: 'info',
  SMS: 'info',
  TASK: 'warning'
};

const SOURCE_VARIANT: Record<string, BadgeVariant> = {
  dispute_engine: 'info',
  credit_engine: 'primary',
  coaching_engine: 'warning',
  billing_engine: 'success',
  intake_engine: 'default',
  system: 'default'
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

function humanizeType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase();
}

function humanizeSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/engine$/i, '').trim();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CaseTimeline({ clientId, limit }: CaseTimelineProps) {
  const api = useApi();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = limit ?? 20;

  const fetchEvents = useCallback(
    async (pageNum: number, append: boolean) => {
      const params = new URLSearchParams({
        page: String(pageNum),
        perPage: String(perPage)
      });
      const path = `/api/events/client/${clientId}/timeline?${params}`;

      const res = await api.get<
        { data: TimelineEvent[]; hasMore?: boolean } | TimelineEvent[]
      >(path);

      if (res.error) {
        setError(res.error);
        return;
      }

      const raw = res.data;
      let list: TimelineEvent[];
      let more = true;

      if (Array.isArray(raw)) {
        list = raw;
        more = raw.length >= perPage;
      } else {
        list = raw?.data ?? [];
        more = raw?.hasMore ?? list.length >= perPage;
      }

      setEvents((prev) => (append ? [...prev, ...list] : list));
      setHasMore(more);
      setError(null);
    },
    [api, clientId, perPage],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setPage(1);

    fetchEvents(1, false).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [fetchEvents]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchEvents(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header */}
      <h3 className="mb-5 text-sm font-semibold text-zinc-100">Case Timeline</h3>

      {/* Loading state */}
      {loading && events.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <LoadingGlobe size="sm" />
        </div>
      )}

      {/* Error state */}
      {error && events.length === 0 && !loading && (
        <p className="py-6 text-center text-xs text-red-400">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <p className="py-6 text-center text-xs text-zinc-500">
          No timeline events found.
        </p>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="relative ml-3">
          {/* Vertical timeline line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-700" />

          <div className="space-y-0">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 pb-6">
                {/* Timeline dot */}
                <div className="relative z-10 mt-2 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-zinc-600 bg-zinc-900" />

                {/* Event card */}
                <div className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3.5 transition-colors hover:border-zinc-700">
                  {/* Timestamp */}
                  <p className="mb-1.5 text-[11px] text-zinc-500">
                    {formatTimestamp(event.occurredAt ?? event.createdAt)}
                  </p>

                  {/* Title + badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-100">
                      {event.title}
                    </p>
                    <Badge
                      variant={EVENT_TYPE_VARIANT[event.eventType] ?? 'default'}
                      className="capitalize text-[10px]"
                    >
                      {humanizeType(event.eventType)}
                    </Badge>
                  </div>

                  {/* Summary */}
                  {event.summary && (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {event.summary}
                    </p>
                  )}

                  {/* Metadata row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* Source engine */}
                    {event.sourceEngine && (
                      <Badge
                        variant={SOURCE_VARIANT[event.sourceEngine] ?? 'default'}
                        className="capitalize text-[10px]"
                      >
                        {humanizeSource(event.sourceEngine)}
                      </Badge>
                    )}

                    {/* Agent role */}
                    {event.agentRole && (
                      <span className="text-[10px] text-zinc-500">
                        Agent: <span className="text-zinc-400">{event.agentRole}</span>
                      </span>
                    )}

                    {/* Related record link */}
                    {event.relatedRecordId && (
                      <a
                        href={
                          event.relatedRecordUrl ??
                          `/dashboard/${event.relatedRecordType ?? 'records'}/${event.relatedRecordId}`
                        }
                        className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 hover:underline"
                      >
                        {event.relatedRecordType
                          ? humanizeType(event.relatedRecordType)
                          : 'Related record'}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load more */}
      {hasMore && events.length > 0 && !loading && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <LoadingGlobe size="sm" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
