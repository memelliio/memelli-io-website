"use client";

// Roles tab — system-explorer
// Lists the 8 role_identity rows ordered by layer_num. Click one to see the full
// identity message + the relationships that role can speak into.

import { useEffect, useState } from "react";
import { api, fmtDate, usePolling } from "./fetch";

interface Role {
  id: string;
  role_name: string;
  layer_num: number;
  identity: string;
  full_message: string | null;
  authority: string | null;
  locked_at: string | null;
}

interface Relationship {
  id: string;
  from_role: string;
  to_role: string;
  can_communicate: boolean;
  scope: string | null;
  notes: string | null;
}

export function RolesTab({ onJumpToRelationships }: { onJumpToRelationships: (role: string) => void }) {
  const { data, error, loading } = usePolling<{ roles: Role[] }>(
    () => api("/api/admin/system/roles"),
    10000
  );
  const roles = data?.roles ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [relErr, setRelErr] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && roles.length > 0) setSelected(roles[0].role_name);
  }, [roles, selected]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const load = async () => {
      try {
        const resp = await api<{ relationships: Relationship[] }>(
          `/api/admin/system/roles/${encodeURIComponent(selected)}/relationships`
        );
        if (alive) {
          setRels(resp.relationships);
          setRelErr(null);
        }
      } catch (e) {
        if (alive) setRelErr(e instanceof Error ? e.message : String(e));
      }
    };
    void load();
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [selected]);

  const active = roles.find((r) => r.role_name === selected) ?? null;
  const canTalkTo = rels.filter((r) => r.can_communicate);
  const cannotTalkTo = rels.filter((r) => !r.can_communicate);

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden bg-[#F4F6FA] p-3">
      <aside className="memelli-card flex w-60 flex-col">
        <div className="memelli-tile-head px-4 py-3 text-xs uppercase tracking-wider text-[#6B7280]">
          Roles <span className="ml-1 text-[#9CA3AF]">({roles.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && roles.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#9CA3AF]">Loading…</p>
          ) : roles.length === 0 ? (
            <div className="m-2 rounded-lg bg-[#FAFAFA] p-4 text-center text-xs text-[#9CA3AF]">
              No roles defined.
            </div>
          ) : (
            <ul className="space-y-1">
              {roles.map((r) => {
                const isActive = r.role_name === selected;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r.role_name)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "bg-[#FCE7EC] font-medium text-[#C41E3A]"
                          : "text-[#6B7280] hover:bg-[#F4F6FA] hover:text-[#0F1115]"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium ${
                          isActive
                            ? "bg-white text-[#C41E3A]"
                            : "bg-[#F4F6FA] text-[#9CA3AF]"
                        }`}
                      >
                        L{r.layer_num}
                      </span>
                      <span className="truncate">{r.role_name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && (
          <div className="mx-3 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </aside>

      <main className="memelli-card flex-1 overflow-y-auto">
        {!active ? (
          <div className="p-8">
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              Pick a role on the left.
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-[#9CA3AF]">
                Layer {active.layer_num}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#0F1115]">{active.role_name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#0F1115]">{active.identity}</p>
              {active.locked_at && (
                <p className="mt-2 text-xs text-[#9CA3AF]">Locked {fmtDate(active.locked_at)}</p>
              )}
            </div>

            <div className="space-y-3">
              {active.full_message && (
                <section className="memelli-tile">
                  <div className="memelli-tile-head px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Identity message
                  </div>
                  <div className="px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F1115]">
                      {active.full_message}
                    </p>
                  </div>
                </section>
              )}

              {active.authority && (
                <section className="memelli-tile">
                  <div className="memelli-tile-head px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Authority
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#6B7280]">{active.authority}</p>
                  </div>
                </section>
              )}

              <section className="memelli-tile">
                <div className="memelli-tile-head flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  <span>
                    Can communicate with{" "}
                    <span className="text-[#9CA3AF]">({canTalkTo.length})</span>
                  </span>
                  <button
                    onClick={() => onJumpToRelationships(active.role_name)}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-medium normal-case tracking-normal text-[#C41E3A] transition hover:bg-[#FCE7EC]"
                  >
                    Open in Relationships →
                  </button>
                </div>
                <div className="px-4 py-3">
                  {relErr && (
                    <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      {relErr}
                    </div>
                  )}
                  {canTalkTo.length === 0 ? (
                    <div className="rounded-lg bg-[#FAFAFA] p-4 text-center text-sm text-[#9CA3AF]">
                      None.
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {canTalkTo.map((r) => (
                        <li
                          key={r.id}
                          className="memelli-row-hover rounded-lg px-3 py-2 text-sm"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-[#0F1115]">{r.to_role}</span>
                            {r.scope && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                                {r.scope}
                              </span>
                            )}
                          </div>
                          {r.notes && (
                            <p className="mt-1 text-xs text-[#9CA3AF]">{r.notes}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="memelli-tile">
                <div className="memelli-tile-head px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Cannot communicate with{" "}
                  <span className="text-[#9CA3AF]">({cannotTalkTo.length})</span>
                </div>
                <div className="px-4 py-3">
                  {cannotTalkTo.length === 0 ? (
                    <div className="rounded-lg bg-[#FAFAFA] p-4 text-center text-sm text-[#9CA3AF]">
                      None.
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {cannotTalkTo.map((r) => (
                        <li
                          key={r.id}
                          className="memelli-row-hover rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="font-mono text-[#6B7280]">{r.to_role}</span>
                          {r.notes && (
                            <span className="ml-2 text-xs text-[#9CA3AF]">— {r.notes}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
