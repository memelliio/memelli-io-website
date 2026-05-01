"use client";

// Relationships tab — system-explorer
// Full role_relationships matrix as a filterable table.
// Filter by from-role + can/cannot toggle.

import { useEffect, useMemo, useState } from "react";
import { api, fmtDate, usePolling } from "./fetch";

interface Relationship {
  id: string;
  from_role: string;
  to_role: string;
  can_communicate: boolean;
  scope: string | null;
  notes: string | null;
  authority: string | null;
  locked_at: string | null;
}

export function RelationshipsTab({ initialFromRole }: { initialFromRole?: string | null }) {
  const { data, error, loading } = usePolling<{ relationships: Relationship[] }>(
    () => api("/api/admin/system/relationships"),
    10000
  );

  const all = data?.relationships ?? [];

  const [fromFilter, setFromFilter] = useState<string>(initialFromRole ?? "");
  const [communicableFilter, setCommunicableFilter] = useState<"all" | "can" | "cannot">("all");
  const [search, setSearch] = useState<string>("");

  // Update filter if a parent (Roles tab) jumps in with a role pre-selected.
  useEffect(() => {
    if (initialFromRole && initialFromRole !== fromFilter) setFromFilter(initialFromRole);
  }, [initialFromRole, fromFilter]);

  const distinctFroms = useMemo(() => {
    const s = new Set(all.map((r) => r.from_role));
    return [...s].sort();
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (fromFilter && r.from_role !== fromFilter) return false;
      if (communicableFilter === "can" && !r.can_communicate) return false;
      if (communicableFilter === "cannot" && r.can_communicate) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = `${r.from_role} ${r.to_role} ${r.scope ?? ""} ${r.notes ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [all, fromFilter, communicableFilter, search]);

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden bg-[#F4F6FA] p-3">
      {/* Filter bar — its own floating card */}
      <header className="memelli-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wider text-[#9CA3AF]">From</label>
            <select
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className="rounded-lg border-0 bg-[#F4F6FA] px-3 py-2 text-sm text-[#0F1115] outline-none transition focus:ring-2 focus:ring-[#C41E3A]/30"
            >
              <option value="">All roles</option>
              {distinctFroms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-[#F4F6FA] p-1">
            {(["all", "can", "cannot"] as const).map((v) => {
              const isActive = communicableFilter === v;
              return (
                <button
                  key={v}
                  onClick={() => setCommunicableFilter(v)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#C41E3A] text-white shadow-sm"
                      : "text-[#6B7280] hover:bg-white hover:text-[#C41E3A]"
                  }`}
                >
                  {v === "all" ? "All" : v === "can" ? "Can" : "Cannot"}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Search role / scope / notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border-0 bg-[#F4F6FA] px-3 py-2 text-sm text-[#0F1115] outline-none transition placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#C41E3A]/30"
          />

          <span className="rounded-full bg-[#F4F6FA] px-3 py-1 text-xs text-[#6B7280]">
            {loading && all.length === 0 ? "loading…" : `${filtered.length} / ${all.length}`}
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table — its own floating card */}
      <div className="memelli-card flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-8">
              <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
                No relationships match the current filter.
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F4F4F6] text-xs uppercase tracking-wider text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">→</th>
                  <th className="px-4 py-3 font-medium">To</th>
                  <th className="px-4 py-3 font-medium">Scope</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Locked</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="memelli-row-hover align-top odd:bg-[#FAFAFA]"
                  >
                    <td className="px-4 py-3 font-mono text-[#0F1115]">{r.from_role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.can_communicate
                            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                            : "rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                        }
                      >
                        {r.can_communicate ? "CAN" : "CANNOT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#0F1115]">{r.to_role}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{r.scope ?? "—"}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{r.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">{fmtDate(r.locked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
