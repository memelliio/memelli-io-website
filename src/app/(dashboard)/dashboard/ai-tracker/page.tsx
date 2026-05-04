'use client';

import { useEffect, useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AICallRecord {
  id: string;
  time: string;
  model: string;
  domain: string;
  action: string;
  path: string[];
  success: boolean;
  tokens: number;
}

interface UsageStats {
  total: number;
  byModel: Record<string, number>;
  recentCalls: AICallRecord[];
}

// ── Model color map ──────────────────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  'llama-70b': 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-300',
  'llama-8b': 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300',
  'mixtral': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  'gemma': 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
};

const MODEL_DOT_COLORS: Record<string, string> = {
  'llama-70b': 'bg-violet-400',
  'llama-8b': 'bg-blue-400',
  'mixtral': 'bg-emerald-400',
  'gemma': 'bg-amber-400',
};

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  count,
  colorClass,
  dotColor,
}: {
  label: string;
  count: number;
  colorClass: string;
  dotColor: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 transition-all duration-300 ${colorClass}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{count.toLocaleString()}</p>
    </div>
  );
}

// ── Breadcrumb Path ──────────────────────────────────────────────────────────

function BreadcrumbPath({ segments }: { segments: string[] }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">/</span>}
          <span className="text-muted-foreground">{seg}</span>
        </span>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AITrackerPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchUsage = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
      const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const res = await fetch(`${apiUrl}/api/admin/open-ai-models/usage`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // If API not ready yet, show empty state
        setStats({
          total: 0,
          byModel: { 'llama-70b': 0, 'llama-8b': 0, mixtral: 0, gemma: 0 },
          recentCalls: [],
        });
        return;
      }

      const data = await res.json();
      setStats(data);
      setError(null);
      setLastUpdate(new Date());
    } catch {
      // On network error, show empty state instead of crashing
      if (!stats) {
        setStats({
          total: 0,
          byModel: { 'llama-70b': 0, 'llama-8b': 0, mixtral: 0, gemma: 0 },
          recentCalls: [],
        });
      }
      setError('Waiting for API connection...');
    }
  }, [stats]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const models = ['llama-70b', 'llama-8b', 'mixtral', 'gemma'] as const;

  return (
    <div className="min-h-screen bg-card p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            AI Path Tracker
          </h1>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
          {error}
        </div>
      )}

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Calls"
          count={stats?.total ?? 0}
          colorClass="from-zinc-800/60 to-zinc-900/40 border-border text-foreground"
          dotColor="bg-muted"
        />
        {models.map((model) => (
          <StatCard
            key={model}
            label={model.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            count={stats?.byModel[model] ?? 0}
            colorClass={MODEL_COLORS[model] ?? 'from-zinc-800/60 to-zinc-900/40 border-border text-foreground'}
            dotColor={MODEL_DOT_COLORS[model] ?? 'bg-muted'}
          />
        ))}
      </div>

      {/* ── Live Feed Table ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent AI Calls
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            Polling every 5s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Path</th>
                <th className="px-5 py-3 font-medium text-center">Result</th>
                <th className="px-5 py-3 font-medium text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {(!stats?.recentCalls || stats.recentCalls.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500/40" />
                      </div>
                      <span>Waiting for AI calls...</span>
                      <span className="text-xs text-muted-foreground">
                        Data will appear as models process requests
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {stats?.recentCalls.map((call, i) => (
                <tr
                  key={call.id ?? i}
                  className="border-b border-border transition-colors duration-150 hover:bg-muted"
                >
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                    {call.time}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        MODEL_COLORS[call.model]
                          ? MODEL_COLORS[call.model]
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          MODEL_DOT_COLORS[call.model] ?? 'bg-muted'
                        }`}
                      />
                      {call.model}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{call.domain}</td>
                  <td className="px-5 py-3 text-xs text-foreground font-medium">{call.action}</td>
                  <td className="px-5 py-3">
                    <BreadcrumbPath segments={call.path ?? []} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        call.success ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'
                      }`}
                    />
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                    {(call.tokens ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
