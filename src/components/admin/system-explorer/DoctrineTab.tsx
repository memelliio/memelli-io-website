"use client";

// Doctrine tab — system-explorer
// Two sources:
//   1. system_operating_rules (locked operating rules) — top section grouped by category
//   2. groq_corpus markdown docs tagged 'critical-law' or matching 6 named doctrine paths
// Click a doc → full content rendered in the right pane.

import { useEffect, useMemo, useState } from "react";
import { api, fmtDate, usePolling } from "./fetch";

interface Rule {
  id: string;
  rule_key: string;
  category: string;
  rule: string;
  why: string | null;
  how_to_apply: string | null;
  authority: string | null;
  locked_at: string | null;
}

interface Doc {
  path: string;
  contentKind: string;
  content: string;
  tags: string[] | null;
  updatedAt: string | null;
}

export function DoctrineTab() {
  const { data, error, loading } = usePolling<{ rules: Rule[]; docs: Doc[] }>(
    () => api("/api/admin/system/doctrine"),
    15000
  );
  const rules = data?.rules ?? [];
  const docs = data?.docs ?? [];

  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  // Default to the first doc once loaded
  useEffect(() => {
    if (!selectedDoc && docs.length > 0) setSelectedDoc(docs[0].path);
  }, [docs, selectedDoc]);

  const rulesByCategory = useMemo(() => {
    const m = new Map<string, Rule[]>();
    for (const r of rules) {
      if (!m.has(r.category)) m.set(r.category, []);
      m.get(r.category)!.push(r);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rules]);

  const activeDoc = docs.find((d) => d.path === selectedDoc) ?? null;

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden bg-[#F4F6FA] p-3">
      {/* Left rail: rules + doc list */}
      <aside className="memelli-card flex w-80 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Operating rules block */}
          <div className="memelli-tile-head px-4 py-3 text-xs uppercase tracking-wider text-[#6B7280]">
            Operating rules <span className="ml-1 text-[#9CA3AF]">({rules.length})</span>
          </div>
          {loading && rules.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[#9CA3AF]">Loading…</p>
          ) : rulesByCategory.length === 0 ? (
            <div className="m-3 rounded-lg bg-[#FAFAFA] p-4 text-center text-xs text-[#9CA3AF]">
              No rules.
            </div>
          ) : (
            <div className="space-y-3 px-3 py-3">
              {rulesByCategory.map(([cat, list]) => (
                <div key={cat} className="memelli-tile">
                  <div className="memelli-tile-head px-3 py-2 text-[11px] uppercase tracking-wider text-[#6B7280]">
                    {cat}
                  </div>
                  <ul className="px-2 py-2">
                    {list.map((r) => (
                      <li
                        key={r.id}
                        className="memelli-row-hover rounded-md px-2 py-2"
                      >
                        <div className="font-mono text-[11px] text-[#0F1115]">
                          {r.rule_key}
                        </div>
                        <div className="mt-0.5 text-xs leading-snug text-[#6B7280]">
                          {r.rule}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Doctrine docs block */}
          <div className="memelli-tile-head mt-2 px-4 py-3 text-xs uppercase tracking-wider text-[#6B7280]">
            Doctrine docs <span className="ml-1 text-[#9CA3AF]">({docs.length})</span>
          </div>
          {docs.length === 0 ? (
            <div className="m-3 rounded-lg bg-[#FAFAFA] p-4 text-center text-xs text-[#9CA3AF]">
              No docs.
            </div>
          ) : (
            <ul className="space-y-1 px-2 py-2">
              {docs.map((d) => {
                const isActive = d.path === selectedDoc;
                return (
                  <li key={d.path}>
                    <button
                      onClick={() => setSelectedDoc(d.path)}
                      className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-[#FCE7EC] text-[#C41E3A]"
                          : "text-[#6B7280] hover:bg-[#F4F6FA] hover:text-[#0F1115]"
                      }`}
                    >
                      <div className="truncate font-mono text-[11px]">{d.path}</div>
                      <div className="mt-0.5 text-[10px] text-[#9CA3AF]">
                        {(d.tags ?? []).join(", ") || d.contentKind}
                      </div>
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

      {/* Right pane: full doc content */}
      <main className="memelli-card flex-1 overflow-y-auto">
        {!activeDoc ? (
          <div className="p-8">
            <div className="rounded-lg bg-[#FAFAFA] p-6 text-center text-sm text-[#9CA3AF]">
              Pick a doctrine doc on the left.
            </div>
          </div>
        ) : (
          <article>
            <header className="memelli-tile-head px-6 py-5">
              <p className="font-mono text-xs text-[#9CA3AF]">{activeDoc.path}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#6B7280]">
                  {activeDoc.contentKind}
                </span>
                <span>updated {fmtDate(activeDoc.updatedAt)}</span>
                {activeDoc.tags && activeDoc.tags.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {activeDoc.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </header>
            <div className="px-6 py-5">
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#0F1115]">
                {activeDoc.content}
              </pre>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
