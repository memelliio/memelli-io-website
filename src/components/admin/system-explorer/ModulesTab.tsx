"use client";

// Modules tab — system-explorer
// Left rail: list of modules from the union of module_* tables.
// Right pane: 14 sections rendered as collapsible cards from the rows.
// Read-only for v1 (per directive). Polls /modules every 10s so newly-seeded
// modules show up without a manual reload.

import { useEffect, useState } from "react";
import { api, fmtDate, usePolling } from "./fetch";

interface SectionData {
  key: string;
  label: string;
  rows: Record<string, unknown>[];
  error?: string;
}

interface ModuleSectionsResponse {
  module: string;
  sections: SectionData[];
}

export function ModulesTab() {
  const { data: list, error: listErr, loading: listLoading } = usePolling<{ modules: string[] }>(
    () => api("/api/admin/system/modules"),
    10000
  );

  const modules = list?.modules ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionData[] | null>(null);
  const [secLoading, setSecLoading] = useState<boolean>(false);
  const [secErr, setSecErr] = useState<string | null>(null);

  // Default-select the first module once the list lands
  useEffect(() => {
    if (!selected && modules.length > 0) setSelected(modules[0]);
  }, [modules, selected]);

  // Load sections whenever the selected module changes; refresh every 10s
  useEffect(() => {
    if (!selected) {
      setSections(null);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const resp = await api<ModuleSectionsResponse>(
          `/api/admin/system/modules/${encodeURIComponent(selected)}/sections`
        );
        if (!alive) return;
        setSections(resp.sections);
        setSecErr(null);
      } catch (e) {
        if (!alive) return;
        setSecErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setSecLoading(false);
      }
    };
    setSecLoading(true);
    void load();
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [selected]);

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden bg-[#F4F6FA] p-3">
      {/* Left rail — module list */}
      <aside className="memelli-card flex w-60 flex-col">
        <div className="memelli-tile-head px-4 py-3 text-xs uppercase tracking-wider text-[#6B7280]">
          Modules <span className="ml-1 text-[#9CA3AF]">({modules.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {listLoading && modules.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#9CA3AF]">Loading…</p>
          ) : modules.length === 0 ? (
            <div className="m-2 rounded-lg bg-[#FAFAFA] p-4 text-center text-xs text-[#9CA3AF]">
              No modules seeded yet. Run module-doctrine seeders to populate.
            </div>
          ) : (
            <ul className="space-y-1">
              {modules.map((m) => {
                const active = m === selected;
                return (
                  <li key={m}>
                    <button
                      onClick={() => setSelected(m)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-[#FCE7EC] font-medium text-[#C41E3A]"
                          : "text-[#6B7280] hover:bg-[#F4F6FA] hover:text-[#0F1115]"
                      }`}
                    >
                      {m}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {listErr && (
          <div className="mx-3 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {listErr}
          </div>
        )}
      </aside>

      {/* Right pane — 14 sections */}
      <main className="memelli-card flex-1 overflow-y-auto">
        {!selected ? (
          <div className="p-8">
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              Pick a module on the left.
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#0F1115]">{selected}</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Module-doctrine sections from module_* DB tables. Read-only.
              </p>
            </div>
            {secLoading && !sections && (
              <p className="text-xs text-[#9CA3AF]">Loading sections…</p>
            )}
            {secErr && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {secErr}
              </div>
            )}
            <div className="space-y-3">
              {sections?.map((sec) => (
                <SectionCard key={sec.key} section={sec} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionCard({ section }: { section: SectionData }) {
  const [open, setOpen] = useState<boolean>(true);
  const empty = section.rows.length === 0;
  return (
    <div className="memelli-tile">
      <button
        onClick={() => setOpen(!open)}
        className="memelli-tile-head flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#0F1115] transition hover:bg-[#FCE7EC]"
      >
        <span className="flex items-center gap-2">
          <span>{section.label}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-normal text-[#6B7280]">
            {empty ? "—" : `${section.rows.length} ${section.rows.length === 1 ? "row" : "rows"}`}
          </span>
        </span>
        <span className="text-[#9CA3AF]">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 py-3">
          {section.error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{section.error}</div>
          ) : empty ? (
            <div className="rounded-lg bg-[#FAFAFA] p-4 text-center text-sm text-[#9CA3AF]">
              No data yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {section.rows.map((row, idx) => (
                <li key={idx} className="rounded-lg bg-[#F4F6FA] px-4 py-3 text-sm">
                  <RowFields row={row} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RowFields({ row }: { row: Record<string, unknown> }) {
  const entries = Object.entries(row);
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-xs uppercase tracking-wide text-[#9CA3AF]">{k}</dt>
          <dd className="text-sm text-[#0F1115]">{renderValue(k, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function renderValue(key: string, v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-[#9CA3AF]">—</span>;
  if (key.endsWith("_at") || key.toLowerCase().includes("date") || key === "loadedAt" || key === "updatedAt") {
    return <span className="text-[#0F1115]">{fmtDate(v as string | Date)}</span>;
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length === 0 ? "[]" : v.map((x) => String(x)).join(", ");
  // Object / JSON
  return (
    <pre className="whitespace-pre-wrap break-words text-xs text-[#0F1115]">{JSON.stringify(v, null, 2)}</pre>
  );
}
