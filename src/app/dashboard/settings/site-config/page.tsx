'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface ConfigEntry {
  key: string;
  value: string;
  type: 'text' | 'json';
  label: string;
  description?: string;
}

type FieldState = {
  draft: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

/* ─────────────────────────────────────────────────────────────────── */
/*  SVG Icons                                                          */
/* ─────────────────────────────────────────────────────────────────── */

function IconSettings({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconGlobe({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconHome({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconUser({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlertCircle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconSave({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token') || localStorage.getItem('memelli_live_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function isValidJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Groups                                                             */
/* ─────────────────────────────────────────────────────────────────── */

interface Group {
  id: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  keys: string[];
}

const GROUPS: Group[] = [
  {
    id: 'globe',
    label: 'Globe & Voice',
    Icon: IconGlobe,
    keys: [
      'orb_greeting',
      'orb_wake_words',
      'orb_system_prompt_public',
      'orb_system_prompt_authed',
      'orb_quick_prompts',
    ],
  },
  {
    id: 'homepage',
    label: 'Homepage',
    Icon: IconHome,
    keys: ['hero_badge_text', 'hero_description', 'hero_feature_tags'],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    Icon: IconUser,
    keys: ['onboarding_questions', 'onboarding_industries', 'onboarding_goals'],
  },
];

/* ─────────────────────────────────────────────────────────────────── */
/*  Field Component                                                    */
/* ─────────────────────────────────────────────────────────────────── */

interface FieldProps {
  entry: ConfigEntry;
  state: FieldState;
  onChange: (key: string, value: string) => void;
  onSave: (key: string) => void;
}

function ConfigField({ entry, state, onChange, onSave }: FieldProps) {
  const isDirty = state.draft !== (entry.type === 'json' ? prettyJson(entry.value) : entry.value);
  const isJsonInvalid = entry.type === 'json' && !isValidJson(state.draft);

  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#141414] overflow-hidden">
      {/* Field header */}
      <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-white/[0.06]">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white leading-snug">{entry.label}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-gray-600">{entry.key}</span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                entry.type === 'json'
                  ? 'bg-violet-500/15 text-violet-400'
                  : 'bg-blue-500/15 text-blue-400'
              }`}
            >
              {entry.type}
            </span>
          </div>
          {entry.description && (
            <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => onSave(entry.key)}
          disabled={state.saving || !isDirty || isJsonInvalid}
          className={`flex-none flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
            state.saving
              ? 'bg-white/[0.06] text-gray-500 cursor-not-allowed'
              : !isDirty || isJsonInvalid
              ? 'bg-white/[0.04] text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white cursor-pointer'
          }`}
        >
          {state.saving ? (
            <>
              <IconRefresh className="w-3 h-3 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <IconSave className="w-3 h-3" />
              Save
            </>
          )}
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={state.draft}
          onChange={(e) => onChange(entry.key, e.target.value)}
          spellCheck={false}
          rows={entry.type === 'json' ? 10 : 4}
          className={`w-full bg-transparent px-4 py-3 text-sm font-mono text-gray-300 placeholder-gray-700 outline-none resize-y leading-relaxed ${
            isJsonInvalid ? 'text-red-300' : ''
          }`}
          placeholder={
            entry.type === 'json' ? '[\n  ...\n]' : 'Enter value...'
          }
        />
      </div>

      {/* Inline feedback */}
      {(state.saved || state.error || isJsonInvalid) && (
        <div
          className={`flex items-center gap-1.5 px-4 py-2 border-t text-xs ${
            state.error
              ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : isJsonInvalid
              ? 'border-amber-500/20 bg-amber-500/5 text-amber-400'
              : 'border-green-500/20 bg-green-500/5 text-green-400'
          }`}
        >
          {state.error ? (
            <>
              <IconAlertCircle className="w-3.5 h-3.5 flex-none" />
              {state.error}
            </>
          ) : isJsonInvalid ? (
            <>
              <IconAlertCircle className="w-3.5 h-3.5 flex-none" />
              Invalid JSON — fix before saving
            </>
          ) : (
            <>
              <IconCheck className="w-3.5 h-3.5 flex-none" />
              Saved successfully
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main Component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export default function SiteConfigPage() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('globe');

  /* ── Fetch all configs ── */
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/config`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      const data: ConfigEntry[] = await res.json();
      setConfigs(data);

      // Initialise field states
      const states: Record<string, FieldState> = {};
      for (const entry of data) {
        states[entry.key] = {
          draft: entry.type === 'json' ? prettyJson(entry.value) : entry.value,
          saving: false,
          saved: false,
          error: null,
        };
      }
      setFieldStates(states);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /* ── Handle draft change ── */
  function handleChange(key: string, value: string) {
    setFieldStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], draft: value, saved: false, error: null },
    }));
  }

  /* ── Save a single field ── */
  async function handleSave(key: string) {
    const state = fieldStates[key];
    if (!state) return;

    setFieldStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], saving: true, saved: false, error: null },
    }));

    try {
      const entry = configs.find((c) => c.key === key);
      let valueToSend = state.draft;

      // For JSON fields, send minified JSON
      if (entry?.type === 'json') {
        valueToSend = JSON.stringify(JSON.parse(state.draft));
      }

      const res = await fetch(`${getApiBase()}/api/config/${key}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ value: valueToSend }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
      }

      // Update canonical value in configs
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value: valueToSend } : c))
      );

      setFieldStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: false, saved: true, error: null },
      }));

      // Clear success badge after 3s
      setTimeout(() => {
        setFieldStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], saved: false },
        }));
      }, 3000);
    } catch (e) {
      setFieldStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          saving: false,
          saved: false,
          error: e instanceof Error ? e.message : 'Save failed',
        },
      }));
    }
  }

  /* ── Compute active group entries ── */
  const group = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  const groupEntries = group.keys
    .map((k) => configs.find((c) => c.key === k))
    .filter((c): c is ConfigEntry => c !== undefined);

  // Also collect any ungrouped keys for display reference (not shown in UI, but keys may not all exist)
  const allGroupedKeys = new Set(GROUPS.flatMap((g) => g.keys));
  const ungroupedEntries = configs.filter((c) => !allGroupedKeys.has(c.key));

  /* ─────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] text-gray-100 font-sans">
      {/* ═══════════════════════════════════════ SIDEBAR */}
      <aside className="w-[220px] flex-none flex flex-col border-r border-white/[0.06] bg-[#111111] sticky top-0 h-screen">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white">
            <IconSettings className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Site Config</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Content editor</p>
          </div>
        </div>

        {/* Group nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {GROUPS.map(({ id, label, Icon }) => {
            const isActive = activeGroup === id;
            const keys = GROUPS.find((g) => g.id === id)?.keys ?? [];
            const count = keys.filter((k) => configs.some((c) => c.key === k)).length;
            return (
              <button
                key={id}
                onClick={() => setActiveGroup(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 flex-none" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className="flex-none text-[10px] text-gray-600 tabular-nums">{count}</span>
                )}
              </button>
            );
          })}

          {/* Ungrouped section — only show if there are extras */}
          {!loading && ungroupedEntries.length > 0 && (
            <button
              onClick={() => setActiveGroup('__other')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mt-2 ${
                activeGroup === '__other'
                  ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
              }`}
            >
              <IconSettings className="w-4 h-4 flex-none" />
              <span className="flex-1 text-left">Other</span>
              <span className="flex-none text-[10px] text-gray-600 tabular-nums">
                {ungroupedEntries.length}
              </span>
            </button>
          )}
        </nav>

        {/* Reload button */}
        <div className="px-3 pb-4">
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 py-2 rounded-md hover:bg-white/[0.04] transition-colors disabled:opacity-40"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload all
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════ MAIN */}
      <main className="flex-1 px-8 py-8 max-w-3xl">
        {/* Page title */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            {group && <group.Icon className="w-4 h-4 text-indigo-400" />}
            <h1 className="text-lg font-semibold text-white">
              {activeGroup === '__other' ? 'Other Config' : group?.label ?? 'Config'}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Edit live site content. Changes take effect immediately — no deploy needed.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-white/[0.07] bg-[#141414] overflow-hidden animate-pulse">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="h-4 bg-white/[0.08] rounded w-1/3 mb-2" />
                  <div className="h-2.5 bg-white/[0.04] rounded w-1/5" />
                </div>
                <div className="px-4 py-3 space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className={`h-3 bg-white/[0.04] rounded ${j % 2 === 1 ? 'w-4/5' : 'w-full'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load error */}
        {!loading && loadError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-4">
            <IconAlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-none" />
            <div>
              <p className="text-sm font-medium text-red-300 mb-0.5">Failed to load config</p>
              <p className="text-xs text-red-400/80">{loadError}</p>
              <button
                onClick={fetchConfigs}
                className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Fields */}
        {!loading && !loadError && (
          <div className="space-y-5">
            {activeGroup === '__other'
              ? ungroupedEntries.map((entry) => {
                  const state = fieldStates[entry.key];
                  if (!state) return null;
                  return (
                    <ConfigField
                      key={entry.key}
                      entry={entry}
                      state={state}
                      onChange={handleChange}
                      onSave={handleSave}
                    />
                  );
                })
              : groupEntries.length > 0
              ? groupEntries.map((entry) => {
                  const state = fieldStates[entry.key];
                  if (!state) return null;
                  return (
                    <ConfigField
                      key={entry.key}
                      entry={entry}
                      state={state}
                      onChange={handleChange}
                      onSave={handleSave}
                    />
                  );
                })
              : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] text-gray-600 mb-3">
                    <IconSettings className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500">No config keys found for this group.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Keys are created automatically when the API seeds them.
                  </p>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
