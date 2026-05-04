"use client";

// SystemActivityPanel — live system activity stream rendered alongside the
// operator chat. Polls /api/admin/system-status every 5 seconds.
//
// Sources:
//   1. development_packets (queued/claimed/running/failed dev packets)
//   2. deployment_packets  (queued/claimed/running/failed deploy packets)
//   3. groq_chat_history   (team responses + supervisor outputs only)
//   4. agent-runner /health (per-supervisor heartbeat freshness)
//
// Append-only — no mutation controls. Operator sees what's happening across
// every lane without leaving the chat surface.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const POLL_MS = 5000;
const STALE_HEARTBEAT_MS = 10 * 60 * 1000; // >10 min flagged red

interface DevPacket {
  id: string;
  target_repo: string;
  target_branch: string | null;
  subject: string | null;
  status: string;
  retries: number;
  error_text: string | null;
  enqueued_by: string;
  enqueued_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  result_text: string | null;
}

interface DeployPacket {
  id: string;
  target_repo: string;
  target_env: string;
  dev_sha: string | null;
  main_sha: string | null;
  status: string;
  retries: number;
  error_text: string | null;
  enqueued_by: string;
  enqueued_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  railway_deploy_id: string | null;
}

interface ChatActivity {
  id: string;
  threadId: string;
  threadTitle: string | null;
  direction: string;
  origin: string;
  content: string;
  status: string;
  createdAt: string;
}

interface SupervisorBlock {
  running?: boolean;
  lastHeartbeatAt?: string | null;
  heartbeatsSent?: number;
  lastError?: string | null;
  config?: Record<string, unknown>;
  [k: string]: unknown;
}

interface SystemStatusPayload {
  ts: string;
  developmentPackets: DevPacket[];
  deploymentPackets: DeployPacket[];
  chatActivity: ChatActivity[];
  supervisorHealth:
    | (Record<string, SupervisorBlock> & { service?: string; uptime?: number; status?: string })
    | null;
  errors?: Record<string, string>;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memelli_token");
}

function ageSeconds(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

function formatAge(seconds: number | null): string {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function statusBadge(status: string): { bg: string; text: string; label: string } {
  const s = status.toUpperCase();
  if (s === "FAILED" || s === "DEAD" || s === "DISPATCH_ERROR") {
    return { bg: "bg-red-900/60 border-red-700", text: "text-red-700", label: "FAILED" };
  }
  if (s === "RUNNING" || s === "IN_PROGRESS" || s === "CLAIMED") {
    return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: s };
  }
  if (s === "SUCCESS" || s === "COMPLETED" || s === "ANSWERED") {
    return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: s };
  }
  if (s === "PENDING" || s === "QUEUED") {
    return { bg: "bg-[#ECEFF5] border-[#E8EAF0]", text: "text-[#0F1115]", label: s };
  }
  if (s === "RETIRED" || s === "SKIPPED") {
    return { bg: "bg-[#F4F6FA] border-[#E8EAF0]", text: "text-[#9CA3AF]", label: s };
  }
  return { bg: "bg-[#ECEFF5] border-[#E8EAF0]", text: "text-[#0F1115]", label: s || "?" };
}

const SUPERVISOR_KEYS = [
  "deployLane",
  "routeScan",
  "healExecutor",
  "memoryCompaction",
  "fixRequest",
  "issueScan",
  "repair",
] as const;

function supervisorLabel(key: string): string {
  switch (key) {
    case "deployLane":
      return "deploy-lane";
    case "routeScan":
      return "route-scan";
    case "healExecutor":
      return "heal-executor";
    case "memoryCompaction":
      return "memory-compaction";
    case "fixRequest":
      return "fix-request";
    case "issueScan":
      return "issue-scan";
    case "repair":
      return "repair-loop";
    default:
      return key;
  }
}

export default function SystemActivityPanel({ visible }: { visible: boolean }) {
  const [data, setData] = useState<SystemStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [section, setSection] = useState<"all" | "dev" | "deploy" | "chat" | "supervisors">("all");
  const lastPollOk = useRef<number>(0);

  const fetchStatus = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/admin/system-status", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}: ${txt.slice(0, 200)}`);
      }
      const payload = (await res.json()) as SystemStatusPayload;
      setData(payload);
      setError(null);
      lastPollOk.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Poll loop — only when visible to avoid background work in collapsed state.
  useEffect(() => {
    if (!visible) return;
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_MS);
    return () => clearInterval(id);
  }, [visible, fetchStatus]);

  // Rerender every 5s so "age" labels keep ticking even when no new poll lands.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const supervisorRows = useMemo(() => {
    const h = data?.supervisorHealth;
    if (!h) return [] as Array<{ key: string; label: string; running: boolean; ageSec: number | null; stale: boolean; lastError: string | null }>;
    return SUPERVISOR_KEYS.map((key) => {
      const block = (h[key] as SupervisorBlock | undefined) || undefined;
      const heartbeat = (block?.lastHeartbeatAt as string | null | undefined) ?? null;
      const ageSec = ageSeconds(heartbeat);
      const running = !!block?.running;
      const stale = ageSec != null && ageSec * 1000 > STALE_HEARTBEAT_MS;
      return {
        key,
        label: supervisorLabel(key),
        running,
        ageSec,
        stale,
        lastError: (block?.lastError as string | null | undefined) ?? null,
      };
    }).filter((r) => r.running || r.ageSec != null || r.lastError); // hide truly-absent supervisors
  }, [data?.supervisorHealth]);

  if (!visible) return null;

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      {/* Panel header */}
      <div className="border-b border-[#E8EAF0] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0F1115]">System Activity</h2>
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
              Polling every {POLL_MS / 1000}s
              {data?.ts && (
                <>
                  {" · last "}
                  {formatAge(ageSeconds(data.ts))} ago
                </>
              )}
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="rounded border border-[#E8EAF0] px-2 py-1 text-[11px] text-[#0F1115] hover:bg-[#ECEFF5]"
            title="Force refresh"
          >
            Refresh
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
          {(["all", "dev", "deploy", "chat", "supervisors"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`rounded px-2 py-1 transition ${
                section === k
                  ? "bg-[#C41E3A] text-white"
                  : "bg-[#F4F6FA] text-[#6B7280] hover:bg-[#ECEFF5] hover:text-[#0F1115]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* SUPERVISORS — always at the top of "all" so the first thing the
            operator sees is whether the loop is breathing. */}
        {(section === "all" || section === "supervisors") && (
          <Section title="Supervisors" subtitle="agent-runner heartbeats">
            {supervisorRows.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[#9CA3AF]">No supervisor data.</p>
            ) : (
              supervisorRows.map((r) => (
                <div
                  key={r.key}
                  className={`flex items-center justify-between gap-2 border-b border-[#F0F0F2] px-3 py-2 text-[11px] ${
                    r.stale || !r.running ? "bg-red-950/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        r.stale
                          ? "bg-red-500"
                          : r.running
                            ? "bg-emerald-500"
                            : "bg-[#9CA3AF]"
                      }`}
                    />
                    <span className="font-mono text-[#0F1115]">{r.label}</span>
                  </div>
                  <div
                    className={`text-[11px] ${r.stale ? "text-red-600" : "text-[#6B7280]"}`}
                    title={r.lastError ?? undefined}
                  >
                    {r.running ? "running" : "down"} · hb {formatAge(r.ageSec)}
                  </div>
                </div>
              ))
            )}
          </Section>
        )}

        {(section === "all" || section === "deploy") && (
          <Section title="deployment_packets" subtitle="newest 25">
            {data?.deploymentPackets?.length ? (
              data.deploymentPackets.map((p) => {
                const isOpen = !!expanded[`deploy:${p.id}`];
                const badge = statusBadge(p.status);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleExpanded(`deploy:${p.id}`)}
                    className="block w-full border-b border-[#F0F0F2] px-3 py-2 text-left hover:bg-[#FAFAFA]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span className="truncate font-mono text-[11px] text-[#0F1115]">
                            {p.target_repo}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">→{p.target_env}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-[#9CA3AF]">
                          {p.error_text
                            ? p.error_text.slice(0, 90)
                            : p.dev_sha
                              ? `${p.dev_sha.slice(0, 7)}${p.main_sha ? "→" + p.main_sha.slice(0, 7) : ""}`
                              : "—"}
                          {p.retries > 0 ? ` · ${p.retries} retries` : ""}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#9CA3AF]">
                        {formatAge(ageSeconds(p.enqueued_at))} ago
                      </div>
                    </div>
                    {isOpen && (
                      <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[10px] text-[#6B7280]">
{JSON.stringify(p, null, 2)}
                      </pre>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-[11px] text-[#9CA3AF]">No deployment packets yet.</p>
            )}
          </Section>
        )}

        {(section === "all" || section === "dev") && (
          <Section title="development_packets" subtitle="newest 25">
            {data?.developmentPackets?.length ? (
              data.developmentPackets.map((p) => {
                const isOpen = !!expanded[`dev:${p.id}`];
                const badge = statusBadge(p.status);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleExpanded(`dev:${p.id}`)}
                    className="block w-full border-b border-[#F0F0F2] px-3 py-2 text-left hover:bg-[#FAFAFA]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span className="truncate font-mono text-[11px] text-[#0F1115]">
                            {p.target_repo}
                          </span>
                          {p.target_branch && (
                            <span className="text-[10px] text-[#9CA3AF]">@{p.target_branch}</span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-[#9CA3AF]">
                          {p.subject ?? p.error_text ?? "—"}
                          {p.retries > 0 ? ` · ${p.retries} retries` : ""}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#9CA3AF]">
                        {formatAge(ageSeconds(p.enqueued_at))} ago
                      </div>
                    </div>
                    {isOpen && (
                      <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[10px] text-[#6B7280]">
{JSON.stringify(p, null, 2)}
                      </pre>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-[11px] text-[#9CA3AF]">No development packets yet.</p>
            )}
          </Section>
        )}

        {(section === "all" || section === "chat") && (
          <Section title="Team voices" subtitle="groq_chat_history (non-operator)">
            {data?.chatActivity?.length ? (
              data.chatActivity.map((m) => {
                const isOpen = !!expanded[`chat:${m.id}`];
                const preview =
                  m.content.length > 140 ? m.content.slice(0, 140).trim() + "…" : m.content;
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleExpanded(`chat:${m.id}`)}
                    className="block w-full border-b border-[#F0F0F2] px-3 py-2 text-left hover:bg-[#FAFAFA]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-[#6B7280]">{m.direction}</span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {formatAge(ageSeconds(m.createdAt))} ago
                      </span>
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap text-[11px] text-[#0F1115]">
                      {isOpen ? m.content : preview}
                    </div>
                    {m.threadTitle && (
                      <div className="mt-0.5 truncate text-[10px] text-[#9CA3AF]">
                        thread: {m.threadTitle}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-[11px] text-[#9CA3AF]">No team voice activity yet.</p>
            )}
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="sticky top-0 z-10 border-b border-[#E8EAF0] bg-white/95 px-3 py-1.5 backdrop-blur">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#0F1115]">
          {title}
        </h3>
        {subtitle && <p className="text-[10px] text-[#9CA3AF]">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
