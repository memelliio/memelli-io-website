"use client";

// Activity tab — FALLBACK placeholder.
// The dedicated activity-stream sub-agent (a76bcee0...) is wiring the real
// feed in parallel on this same page.tsx file. To stay out of its way:
//   - we DO NOT define the live event poll here — the parallel agent owns that
//   - we DO render a tab so the operator can see the surface even before the
//     parallel agent lands its component
//   - when their component arrives, swap this stub for it (or import theirs).
//
// The fallback shows recent groq_chat_history rows as a thin proof-of-life so
// the tab doesn't read "empty" while the real wiring is in flight.

import { api, fmtDate, usePolling } from "./fetch";

interface ChatHistoryRow {
  id: string;
  threadId: string;
  direction: string;
  origin: string;
  status: string;
  createdAt: string;
}

interface FallbackResp {
  recent: ChatHistoryRow[];
}

// Until a dedicated /api/admin/system/activity exists, fall back to threads.
// We re-use /api/admin/chat/threads which any SUPER_ADMIN already has access to.
async function loadFallback(): Promise<FallbackResp> {
  // Lightweight proof-of-life — list recent operator threads ordered by updatedAt.
  const t = await api<{ threads: { id: string; title: string; target: string; updatedAt: string }[] }>(
    "/api/admin/chat/threads"
  );
  return {
    recent: (t.threads ?? []).slice(0, 20).map((x) => ({
      id: x.id,
      threadId: x.id,
      direction: `thread:${x.target}`,
      origin: "groq_chat_threads",
      status: "—",
      createdAt: x.updatedAt,
    })),
  };
}

export function ActivityTabFallback() {
  const { data, error, loading } = usePolling<FallbackResp>(loadFallback, 8000);

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Activity</h2>
        <p className="text-xs text-[#9CA3AF]">
          Live system event stream. The dedicated activity-stream worker is being wired in parallel —
          this fallback shows recent operator threads so the surface isn&apos;t blank.
        </p>
      </div>
      {error && <div className="mb-3 text-xs text-red-600">{error}</div>}
      {loading && !data ? (
        <p className="text-xs text-[#9CA3AF]">Loading…</p>
      ) : !data || data.recent.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">No recent activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.recent.map((r) => (
            <li key={r.id} className="memelli-tile px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#0F1115]">{r.direction}</span>
                <span className="text-[#9CA3AF]">{fmtDate(r.createdAt)}</span>
              </div>
              <div className="mt-1 text-[#9CA3AF]">
                origin: {r.origin} · id: {r.id.slice(0, 8)}…
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
