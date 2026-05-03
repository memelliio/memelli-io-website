'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProgressItem {
  id: string;
  title: string;
  status: 'completed' | 'pending';
  completedAt?: string | null;
  createdAt: string;
}

interface ProgressStackProps {
  clientId: string;
  sessionId?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProgressStack({ clientId, sessionId }: ProgressStackProps) {
  const api = useApi();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    const qs = params.toString();
    const path = `/api/events/client/${clientId}/progress${qs ? `?${qs}` : ''}`;

    const res = await api.get<{ data: ProgressItem[] } | ProgressItem[]>(path);
    if (res.error) {
      setError(res.error);
      return;
    }
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : raw?.data ?? [];
    setItems(list);
    setError(null);
  }, [api, clientId, sessionId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchProgress().finally(() => {
      if (mounted) setLoading(false);
    });

    const interval = setInterval(fetchProgress, 10_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchProgress]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Header */}
      <h3 className="mb-4 text-sm font-semibold text-zinc-100">
        {sessionId ? 'Session Progress' : "Today's Progress"}
      </h3>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <LoadingGlobe size="sm" />
        </div>
      )}

      {/* Error state */}
      {error && items.length === 0 && !loading && (
        <p className="py-4 text-center text-xs text-red-400">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <p className="py-4 text-center text-xs text-zinc-500">
          No progress items yet.
        </p>
      )}

      {/* Progress items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="animate-slide-in-left flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status icon */}
              {item.status === 'completed' ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              ) : (
                <LoadingGlobe size="sm" />
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm leading-tight ${
                    item.status === 'completed' ? 'text-zinc-200' : 'text-zinc-400'
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {relativeTime(item.completedAt ?? item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline keyframes for slide-in animation */}
      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
}
