"use client";

// Lanes tab — system-explorer
// Shows each lane (work_orders.taskType + development_packets) as a card.
// Click a lane → packet list panel slides into view.

import { useEffect, useState } from "react";
import { api, fmtDate, usePolling } from "./fetch";

interface LaneSummary {
  lane: string;
  source: string;
  queued: number;
  inFlight: number;
  succeeded: number;
  failed: number;
  total: number;
  lastFiveOutcomes: { id: string; status: string; createdAt: string; summary: string | null }[];
}

interface Packet {
  id: string;
  status: string;
  taskType?: string;
  goalSummary?: string;
  resultSummary?: string;
  errorSummary?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  // development_packets shape
  target_repo?: string;
  target_branch?: string;
  subject?: string;
  enqueued_at?: string;
  claimed_at?: string;
  retries?: number;
  error_text?: string;
}

export function LanesTab() {
  const { data, error, loading } = usePolling<{ lanes: LaneSummary[] }>(
    () => api("/api/admin/system/lanes"),
    8000
  );
  const lanes = data?.lanes ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [pkErr, setPkErr] = useState<string | null>(null);
  const [pkLoading, setPkLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const load = async () => {
      try {
        const resp = await api<{ packets: Packet[] }>(
          `/api/admin/system/lanes/${encodeURIComponent(selected)}/packets`
        );
        if (alive) {
          setPackets(resp.packets);
          setPkErr(null);
        }
      } catch (e) {
        if (alive) setPkErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setPkLoading(false);
      }
    };
    setPkLoading(true);
    void load();
    const id = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [selected]);

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden bg-[#F4F6FA] p-3">
      {/* Left: lane cards */}
      <section className="memelli-card flex-1 overflow-y-auto">
        <div className="memelli-tile-head flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F1115]">Lanes</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              work_orders.taskType + development_packets queue summary.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs text-[#6B7280]">
            {loading && lanes.length === 0 ? "loading…" : `${lanes.length} lanes`}
          </span>
        </div>

        <div className="px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {lanes.length === 0 && !loading ? (
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              No lanes yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {lanes.map((l) => {
                const isActive = l.lane === selected;
                return (
                  <button
                    key={l.lane}
                    onClick={() => setSelected(l.lane)}
                    className={`memelli-tile p-4 text-left transition ${
                      isActive ? "ring-2 ring-[#C41E3A]" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-sm font-medium text-[#0F1115]">
                        {l.lane}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#F4F6FA] px-2 py-0.5 text-[11px] text-[#6B7280]">
                        {l.source}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <Stat label="queue" value={l.queued} tone="neutral" />
                      <Stat label="in-flight" value={l.inFlight} tone="info" />
                      <Stat label="ok" value={l.succeeded} tone="ok" />
                      <Stat label="fail" value={l.failed} tone="bad" />
                    </div>
                    <div className="mt-3 text-xs text-[#9CA3AF]">total {l.total}</div>
                    {l.lastFiveOutcomes.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {l.lastFiveOutcomes.slice(0, 3).map((o) => (
                          <li
                            key={o.id}
                            className="truncate rounded-md bg-[#FAFAFA] px-2 py-1 text-[11px] text-[#6B7280]"
                          >
                            <span className="font-medium text-[#0F1115]">{o.status}</span>
                            <span className="text-[#9CA3AF]"> · {fmtDate(o.createdAt)}</span>
                            {o.summary ? (
                              <span className="text-[#9CA3AF]"> · {o.summary.slice(0, 60)}</span>
                            ) : (
                              ""
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Right: packet detail panel — its own floating card */}
      <aside className="memelli-card flex w-[480px] flex-col overflow-hidden">
        {!selected ? (
          <div className="p-6">
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              Pick a lane to see recent packets.
            </div>
          </div>
        ) : (
          <>
            <div className="memelli-tile-head px-5 py-4">
              <h3 className="font-mono text-sm font-medium text-[#0F1115]">{selected}</h3>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">Recent packets</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {pkLoading && packets.length === 0 && (
                <p className="px-2 py-2 text-xs text-[#9CA3AF]">Loading packets…</p>
              )}
              {pkErr && (
                <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {pkErr}
                </div>
              )}
              {!pkLoading && packets.length === 0 && (
                <div className="rounded-lg bg-[#FAFAFA] p-4 text-center text-sm text-[#9CA3AF]">
                  No packets yet.
                </div>
              )}
              <ul className="space-y-2">
                {packets.map((p) => (
                  <li key={p.id} className="memelli-tile p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[#0F1115]">{p.id.slice(0, 8)}…</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          p.status === "COMPLETED" || p.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "FAILED" || p.status === "ERROR"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[#0F1115]">
                      {p.subject ?? p.goalSummary ?? p.resultSummary ?? p.errorSummary ?? "—"}
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#9CA3AF]">
                      {fmtDate(p.createdAt ?? p.enqueued_at)}
                      {p.target_repo ? ` · ${p.target_repo}@${p.target_branch ?? "?"}` : ""}
                      {p.retries ? ` · retries ${p.retries}` : ""}
                    </div>
                    {p.errorSummary && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                        {p.errorSummary.slice(0, 200)}
                      </pre>
                    )}
                    {p.error_text && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                        {p.error_text.slice(0, 200)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "neutral" | "info" | "ok" | "bad" }) {
  const cls =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "bad"
      ? "text-red-700"
      : tone === "info"
      ? "text-blue-700"
      : "text-[#0F1115]";
  return (
    <div className="rounded-lg bg-[#FAFAFA] px-2 py-1.5">
      <div className={`text-base font-semibold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">{label}</div>
    </div>
  );
}
