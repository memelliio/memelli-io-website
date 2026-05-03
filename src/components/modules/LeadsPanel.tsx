'use client';

import { useState, useEffect, useCallback } from 'react';

/* =========================================================================== */
/*  Config                                                                      */
/* =========================================================================== */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

/* =========================================================================== */
/*  Types                                                                       */
/* =========================================================================== */

interface LeadProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  score: number;
  stage: string;
  createdAt: string;
}

interface PipelineStage {
  name: string;
  slug: string;
  count: number;
  value: number;
}

interface AnalyticsOverview {
  total: number;
  conversionRate: number;
  topSource: string;
}

interface SourceBreakdown {
  source: string;
  count: number;
  pct: number;
}

/* =========================================================================== */
/*  Helpers                                                                     */
/* =========================================================================== */

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#71717a';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'rgba(34,197,94,0.15)';
  if (score >= 50) return 'rgba(245,158,11,0.15)';
  return 'rgba(113,113,122,0.15)';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
};

/* =========================================================================== */
/*  Sub-components                                                              */
/* =========================================================================== */

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[11px] font-bold tabular-nums shrink-0"
      style={{
        width: 30,
        height: 30,
        minWidth: 30,
        background: scoreBg(score),
        color: scoreColor(score),
        border: `1px solid ${scoreColor(score)}33`,
      }}
    >
      {score}
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-4" style={CARD_STYLE}>
      <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: accent || '#f4f4f5' }}>
        {value}
      </span>
    </div>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      ))}
    </div>
  );
}

/* =========================================================================== */
/*  Main Component                                                              */
/* =========================================================================== */

export function LeadsPanel() {
  /* --- pipeline state --- */
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [stageLeads, setStageLeads] = useState<LeadProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  /* --- analytics state --- */
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [sources, setSources] = useState<SourceBreakdown[]>([]);

  /* --- loading/error --- */
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --- add lead form --- */
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    source: 'organic',
    stage: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  /* --- action feedback --- */
  const [actionPending, setActionPending] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Fetch pipeline summary                                              */
  /* ------------------------------------------------------------------ */

  const fetchPipelineSummary = useCallback(async () => {
    setLoadingPipeline(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/leads/pipeline/summary`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Pipeline summary error ${res.status}`);
      const json = await res.json();
      const list: PipelineStage[] = json?.stages ?? [];
      setStages(list);
      const total = list.reduce((acc, s) => acc + (s.count ?? 0), 0);
      setTotalCount(total);
      // Auto-select first stage
      if (list.length > 0 && !activeStage) {
        setActiveStage(list[0].slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline.');
    } finally {
      setLoadingPipeline(false);
    }
  }, [activeStage]);

  /* ------------------------------------------------------------------ */
  /*  Fetch leads in active stage                                         */
  /* ------------------------------------------------------------------ */

  const fetchStageLeads = useCallback(async (slug: string) => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`${API}/api/leads/pipeline/stage/${slug}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Stage leads error ${res.status}`);
      const json = await res.json();
      const list: LeadProfile[] = Array.isArray(json) ? json : (json.leads ?? json.data ?? []);
      setStageLeads(list);
    } catch {
      setStageLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Fetch analytics                                                     */
  /* ------------------------------------------------------------------ */

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const [overviewRes, sourcesRes] = await Promise.all([
        fetch(`${API}/api/leads/analytics`, { headers: authHeaders() }),
        fetch(`${API}/api/leads/analytics/sources`, { headers: authHeaders() }),
      ]);

      if (overviewRes.ok) {
        const json = await overviewRes.json();
        setAnalytics({
          total: json.total ?? json.totalLeads ?? 0,
          conversionRate: json.conversionRate ?? json.conversion ?? 0,
          topSource: json.topSource ?? json.top_source ?? '—',
        });
      }

      if (sourcesRes.ok) {
        const json = await sourcesRes.json();
        const raw: { source: string; count: number }[] = Array.isArray(json)
          ? json
          : (json.sources ?? json.data ?? []);
        const grandTotal = raw.reduce((a, b) => a + (b.count ?? 0), 0) || 1;
        setSources(
          raw.map((s) => ({
            source: s.source,
            count: s.count,
            pct: Math.round((s.count / grandTotal) * 100),
          })),
        );
      }
    } catch {
      // graceful
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Effects                                                             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    fetchPipelineSummary();
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeStage) fetchStageLeads(activeStage);
  }, [activeStage, fetchStageLeads]);

  // Keep form stage in sync with first available stage
  useEffect(() => {
    if (stages.length > 0 && !form.stage) {
      setForm((f) => ({ ...f, stage: stages[0].slug }));
    }
  }, [stages, form.stage]);

  /* ------------------------------------------------------------------ */
  /*  Actions: advance / reject / score                                  */
  /* ------------------------------------------------------------------ */

  async function handleAdvance(profileId: string) {
    setActionPending(profileId);
    try {
      const res = await fetch(`${API}/api/leads/pipeline/${profileId}/advance`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        await Promise.all([fetchPipelineSummary(), activeStage ? fetchStageLeads(activeStage) : Promise.resolve()]);
      }
    } catch {
      // graceful
    } finally {
      setActionPending(null);
    }
  }

  async function handleReject(profileId: string) {
    setActionPending(profileId);
    try {
      const res = await fetch(`${API}/api/leads/pipeline/${profileId}/reject`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        await Promise.all([fetchPipelineSummary(), activeStage ? fetchStageLeads(activeStage) : Promise.resolve()]);
      }
    } catch {
      // graceful
    } finally {
      setActionPending(null);
    }
  }

  async function handleScore(profileId: string) {
    setActionPending(`score-${profileId}`);
    try {
      const res = await fetch(`${API}/api/leads/scoring/${profileId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok && activeStage) {
        await fetchStageLeads(activeStage);
      }
    } catch {
      // graceful
    } finally {
      setActionPending(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Add Lead form                                                       */
  /* ------------------------------------------------------------------ */

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    if (!form.firstName.trim()) { setFormError('First name is required.'); return; }
    if (!form.lastName.trim()) { setFormError('Last name is required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/leads/pipeline`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          source: form.source,
          stage: form.stage || undefined,
        }),
      });
      if (res.ok || res.status === 201) {
        setFormSuccess(true);
        setForm((f) => ({ ...f, firstName: '', lastName: '', email: '', phone: '', company: '' }));
        await Promise.all([fetchPipelineSummary(), fetchAnalytics()]);
        if (activeStage) await fetchStageLeads(activeStage);
        setTimeout(() => setFormSuccess(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err?.message ?? `Error ${res.status}`);
      }
    } catch {
      setFormError('Network error — check connection.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Derived values                                                      */
  /* ------------------------------------------------------------------ */

  const activeStageLabel = stages.find((s) => s.slug === activeStage)?.name ?? activeStage ?? '';

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex flex-col gap-5 p-4 text-zinc-100 h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">Lead Pulse</h2>
          {totalCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              {totalCount} total
            </span>
          )}
          {sources.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              top: {sources[0]?.source ?? '—'}
            </span>
          )}
        </div>
        <a
          href="/dashboard/leads"
          className="text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Full View &rarr;
        </a>
      </div>

      {error && (
        <p className="text-[12px] text-red-400 rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      {/* ── Pipeline Stage Rail ── */}
      <section>
        <SectionHeader>Pipeline</SectionHeader>
        {loadingPipeline ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 h-14 w-28 rounded-xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <p className="text-zinc-600 text-sm">No pipeline stages configured.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stages.map((stage) => {
              const isActive = activeStage === stage.slug;
              return (
                <button
                  key={stage.slug}
                  onClick={() => setActiveStage(stage.slug)}
                  className="shrink-0 flex flex-col items-start gap-1 rounded-xl p-3 transition-all text-left"
                  style={{
                    background: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isActive
                      ? '1px solid rgba(239,68,68,0.35)'
                      : '1px solid rgba(255,255,255,0.07)',
                    minWidth: 100,
                  }}
                >
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide truncate w-full">
                    {stage.name}
                  </span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: isActive ? '#ef4444' : '#f4f4f5' }}
                  >
                    {stage.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Lead List for Active Stage ── */}
      <section>
        <SectionHeader>
          {activeStageLabel ? `${activeStageLabel} Leads` : 'Leads'}
        </SectionHeader>
        {loadingLeads ? (
          <Skeleton rows={3} />
        ) : stageLeads.length === 0 ? (
          <p className="text-zinc-600 text-sm">No leads in this stage.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stageLeads.map((lead) => {
              const isPending = actionPending === lead.id;
              const isScoring = actionPending === `score-${lead.id}`;
              const fullName = `${lead.firstName} ${lead.lastName}`.trim();
              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={CARD_STYLE}
                >
                  <ScoreBadge score={lead.score ?? 0} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-100 truncate">{fullName}</span>
                      {lead.company && (
                        <span className="text-[11px] text-zinc-500 truncate">{lead.company}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {lead.source && (
                        <span
                          className="text-[10px] font-mono rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}
                        >
                          {lead.source}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600">{relativeTime(lead.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleScore(lead.id)}
                      disabled={!!actionPending}
                      className="rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-opacity disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)' }}
                      title="Re-score"
                    >
                      {isScoring ? '...' : 'Score'}
                    </button>
                    <button
                      onClick={() => handleAdvance(lead.id)}
                      disabled={!!actionPending}
                      className="rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-opacity disabled:opacity-40"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                      title="Advance to next stage"
                    >
                      {isPending ? '...' : 'Advance'}
                    </button>
                    <button
                      onClick={() => handleReject(lead.id)}
                      disabled={!!actionPending}
                      className="rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-opacity disabled:opacity-40"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      title="Reject lead"
                    >
                      {isPending ? '...' : 'Reject'}
                    </button>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Contact
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Analytics Row ── */}
      <section>
        <SectionHeader>Analytics</SectionHeader>
        {loadingAnalytics ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total Leads" value={analytics?.total ?? totalCount} />
            <StatCard
              label="Conversion"
              value={analytics ? `${analytics.conversionRate}%` : '—'}
              accent="#22c55e"
            />
            <StatCard label="Top Source" value={analytics?.topSource ?? '—'} accent="#ef4444" />
          </div>
        )}
      </section>

      {/* ── Source Breakdown ── */}
      {sources.length > 0 && (
        <section>
          <SectionHeader>Lead Sources</SectionHeader>
          <div className="flex flex-col gap-2">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400 w-16 shrink-0 capitalize truncate">{s.source}</span>
                <div
                  className="flex-1 rounded-full overflow-hidden"
                  style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.pct}%`,
                      background: s.pct >= 30 ? '#ef4444' : s.pct >= 15 ? '#f59e0b' : '#71717a',
                    }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500 tabular-nums w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Add Lead Form ── */}
      <section>
        <SectionHeader>Add Lead</SectionHeader>
        <form
          onSubmit={handleAddLead}
          className="flex flex-col gap-2 rounded-xl p-4"
          style={CARD_STYLE}
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="First name *"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            />
            <input
              type="text"
              placeholder="Last name *"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            />
          </div>
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-500"
            style={INPUT_STYLE}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            />
            <input
              type="text"
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            >
              <option value="organic">Organic</option>
              <option value="paid">Paid</option>
              <option value="referral">Referral</option>
              <option value="social">Social</option>
              <option value="direct">Direct</option>
            </select>
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-red-500"
              style={INPUT_STYLE}
            >
              {stages.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>

          {formError && (
            <p className="text-[12px] text-red-400">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-[12px] text-green-400">Lead added successfully.</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {submitting ? 'Adding...' : 'Add Lead'}
          </button>
        </form>
      </section>
    </div>
  );
}
