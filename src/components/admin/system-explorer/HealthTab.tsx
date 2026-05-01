"use client";

// Health tab — system-explorer
// Cards for each upstream service (agent-runner, api, groq-service) plus a
// recent-supervisor-heartbeats panel from agent_registrations.

import { api, fmtDate, usePolling } from "./fetch";

interface ServiceCheck {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  body: unknown;
  error?: string;
}

interface Heartbeat {
  agent_id: string | null;
  name: string | null;
  health: string | null;
  last_heartbeat: string | null;
  age_seconds: number | null;
}

interface HealthSnapshot {
  services: ServiceCheck[];
  heartbeats: Heartbeat[];
  fetchedAt: string;
}

export function HealthTab() {
  const { data, error, loading } = usePolling<HealthSnapshot>(
    () => api("/api/admin/system/health"),
    8000
  );

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-[#F4F6FA] p-3">
      {/* Header card */}
      <div className="memelli-card px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F1115]">Health</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Live snapshot of upstream services and supervisor heartbeats.
            </p>
          </div>
          <span className="rounded-full bg-[#F4F6FA] px-3 py-1 text-xs text-[#6B7280]">
            {loading && !data
              ? "loading…"
              : data
              ? `last fetched ${fmtDate(data.fetchedAt)}`
              : "—"}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Service cards */}
      <section className="memelli-card overflow-hidden">
        <div className="memelli-tile-head px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Services
        </div>
        <div className="px-5 py-4">
          {!data && !loading ? (
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              No data.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(data?.services ?? []).map((s) => (
                <ServiceCard key={s.name} svc={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Heartbeats */}
      <section className="memelli-card overflow-hidden">
        <div className="memelli-tile-head px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Recent agent heartbeats{" "}
          <span className="ml-1 text-[#9CA3AF]">({data?.heartbeats.length ?? 0})</span>
        </div>
        <div className="overflow-x-auto">
          {!data || data.heartbeats.length === 0 ? (
            <div className="m-5 rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              No heartbeats recorded.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F4F6] text-xs uppercase tracking-wider text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Last beat</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {data.heartbeats.map((h, i) => (
                  <tr
                    key={`${h.agent_id ?? i}-${i}`}
                    className="memelli-row-hover odd:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#0F1115]">
                      {h.agent_id ? h.agent_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#0F1115]">{h.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          h.health === "HEALTHY"
                            ? "bg-emerald-50 text-emerald-700"
                            : h.health === "STALE"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {h.health ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {fmtDate(h.last_heartbeat)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                      {h.age_seconds == null ? "—" : `${h.age_seconds}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ svc }: { svc: ServiceCheck }) {
  return (
    <div className="memelli-tile p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-[#0F1115]">{svc.name}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
            svc.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {svc.ok ? "UP" : "DOWN"}
        </span>
      </div>
      <p className="mt-1.5 break-all rounded-md bg-[#FAFAFA] px-2 py-1 font-mono text-[11px] text-[#6B7280]">
        {svc.url}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#FAFAFA] px-3 py-2">
          <div className="text-sm font-semibold text-[#0F1115]">{svc.status || "—"}</div>
          <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">status</div>
        </div>
        <div className="rounded-lg bg-[#FAFAFA] px-3 py-2">
          <div className="text-sm font-semibold text-[#0F1115]">{svc.latencyMs}ms</div>
          <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">latency</div>
        </div>
      </div>
      {svc.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {svc.error}
        </p>
      )}
      {Boolean(svc.body) && typeof svc.body === "object" && (
        <details className="mt-2">
          <summary className="cursor-pointer rounded-md bg-[#F4F6FA] px-2 py-1 text-[11px] text-[#6B7280] transition hover:bg-[#FCE7EC] hover:text-[#C41E3A]">
            body
          </summary>
          <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#FAFAFA] px-2 py-1.5 text-[11px] text-[#6B7280]">
            {JSON.stringify(svc.body, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
