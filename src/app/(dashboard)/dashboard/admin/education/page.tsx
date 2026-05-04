'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  RefreshCw,
  Zap,
  AlertTriangle,
  BookOpen,
  Target,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import { Badge } from '../../../../../components/ui/badge';

interface DomainInfo {
  id: string;
  name: string;
  slug: string;
  completeness: number;
  subjects: number;
  totalSubjects: number;
  capacitorCharge: number;
  lastLearned?: string;
}

interface GapInfo {
  domain: string;
  subject: string;
  severity: 'critical' | 'moderate' | 'low';
  description: string;
}

interface LearningEvent {
  id: string;
  domain: string;
  subject: string;
  action: string;
  timestamp: string;
  confidence?: number;
}

export default function EducationPage() {
  const api = useApi();
  const [score, setScore] = useState<number>(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({});
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [gaps, setGaps] = useState<GapInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<LearningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chargingDomain, setChargingDomain] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [scoreRes, domainsRes, gapsRes] = await Promise.all([
        api.get<{ score: number; breakdown: Record<string, number>; recentActivity?: LearningEvent[] }>(
          '/api/admin/education/score'
        ),
        api.get<{ domains: DomainInfo[] }>('/api/admin/education/domains'),
        api.get<{ gaps: GapInfo[] }>('/api/admin/education/gaps'),
      ]);

      if (scoreRes.data) {
        setScore(scoreRes.data.score ?? 0);
        setScoreBreakdown(scoreRes.data.breakdown ?? {});
        setRecentActivity(scoreRes.data.recentActivity ?? []);
      }
      if (domainsRes.data) {
        setDomains(domainsRes.data.domains ?? []);
      }
      if (gapsRes.data) {
        setGaps(gapsRes.data.gaps ?? []);
      }

      setLastRefresh(new Date());
    } catch {
      toast.error('Failed to load education data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleCharge(domain: string) {
    setChargingDomain(domain);
    try {
      const { error } = await api.post(`/api/admin/education/charge/${domain}`, { intensity: 1 });
      if (error) throw new Error(error);
      toast.success(`Capacitor charged for ${domain}`);
      fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to charge capacitor');
    } finally {
      setChargingDomain(null);
    }
  }

  function getScoreColor(s: number) {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-amber-400';
    if (s >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  function getScoreBorderColor(s: number) {
    if (s >= 80) return 'border-emerald-500/30';
    if (s >= 60) return 'border-amber-500/30';
    if (s >= 40) return 'border-orange-500/30';
    return 'border-red-500/30';
  }

  function getBarColor(pct: number) {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  function getBarBg(pct: number) {
    if (pct >= 80) return 'bg-emerald-500/10';
    if (pct >= 60) return 'bg-amber-500/10';
    if (pct >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  }

  function getSeverityStyle(severity: string) {
    if (severity === 'critical') return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (severity === 'moderate') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-muted text-muted-foreground border-white/[0.06]';
  }

  return (
    <div className="min-h-screen bg-card p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20">
            <Brain className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hyper-Education Engine
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Brain knowledge state and learning control
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground border border-white/[0.06] transition-all duration-200 text-[11px] uppercase tracking-wider font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Brain Health Score */}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      ) : (
        <div
          className={`bg-card backdrop-blur-xl border rounded-2xl ${getScoreBorderColor(score)}`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Score Circle */}
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-muted-foreground"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${score * 2.64} 264`}
                      className={getScoreColor(score)}
                    />
                  </svg>
                  <div className="text-center">
                    <span className={`text-3xl font-bold tracking-tight ${getScoreColor(score)}`}>
                      {score}
                    </span>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      / 100
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Brain Education Score
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                    {score >= 80
                      ? 'Exceptional knowledge state. The brain is operating at peak capacity.'
                      : score >= 60
                        ? 'Good knowledge coverage with room for deeper learning.'
                        : score >= 40
                          ? 'Moderate coverage. Several domains need attention.'
                          : 'Low education score. Significant knowledge gaps detected.'}
                  </p>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="rounded-2xl border-white/[0.04] bg-card p-4 border text-center">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {domains.length}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Domains
                  </p>
                </div>
                <div className="rounded-2xl border-white/[0.04] bg-card p-4 border text-center">
                  <p className="text-2xl font-semibold tracking-tight text-red-400">
                    {gaps.filter((g) => g.severity === 'critical').length}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Critical Gaps
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Cards */}
      <div>
        <h2 className="mb-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Knowledge Domains ({domains.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <div className="py-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground leading-relaxed">No domains registered yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                The education engine will populate domains as it learns.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {domains.map((d) => {
              const isGap = gaps.some(
                (g) => g.domain === d.slug && g.severity === 'critical'
              );
              const isCharging = chargingDomain === d.slug;

              return (
                <div
                  key={d.id || d.slug}
                  className={`bg-card backdrop-blur-xl border rounded-2xl hover:border-white/[0.08] transition-all duration-200 ${
                    isGap
                      ? 'border-red-500/20'
                      : d.completeness >= 80
                        ? 'border-emerald-500/10'
                        : 'border-white/[0.04]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-lg font-semibold tracking-tight truncate">
                          {d.name}
                        </span>
                        {isGap && (
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(d.completeness)}`}>
                        {d.completeness}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className={`mt-3 h-2 rounded-full ${getBarBg(d.completeness)}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(d.completeness)}`}
                        style={{ width: `${Math.min(d.completeness, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 pb-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-foreground">
                          {d.subjects}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Learned
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-muted-foreground">
                          {d.totalSubjects}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Total
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <p className="text-lg font-semibold tracking-tight text-amber-400">
                            {d.capacitorCharge ?? 0}
                          </p>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          Charge
                        </p>
                      </div>
                    </div>

                    {d.lastLearned && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        Last learned:{' '}
                        {new Date(d.lastLearned).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 pb-6 flex gap-2">
                    <button
                      onClick={() => handleCharge(d.slug)}
                      disabled={isCharging}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2.5 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                    >
                      {isCharging ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      Charge Capacitor
                    </button>
                    <button
                      onClick={() =>
                        setExpandedDomain(expandedDomain === d.slug ? null : d.slug)
                      }
                      className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-muted px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 text-sm"
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          expandedDomain === d.slug ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Detail */}
                  {expandedDomain === d.slug && (
                    <div className="border-t border-white/[0.04] px-6 py-4">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                        Score Breakdown
                      </p>
                      {scoreBreakdown[d.slug] !== undefined ? (
                        <p className="text-foreground text-sm">
                          Domain score: {scoreBreakdown[d.slug]}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No detailed breakdown available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Knowledge Gaps */}
      {gaps.length > 0 && (
        <div>
          <h2 className="mb-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            Knowledge Gaps ({gaps.length})
          </h2>
          <div className="bg-card backdrop-blur-xl border border-red-500/10 rounded-2xl divide-y divide-white/[0.04]">
            {gaps.map((gap, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {gap.severity === 'critical' ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : gap.severity === 'moderate' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">
                      {gap.domain} / {gap.subject}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">{gap.description}</p>
                  </div>
                </div>
                <Badge
                  className={`text-[10px] px-1.5 py-0 rounded-xl border shrink-0 ${getSeverityStyle(gap.severity)}`}
                >
                  {gap.severity.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Learning Activity */}
      <div>
        <h2 className="mb-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Recent Learning Activity
        </h2>
        {recentActivity.length === 0 ? (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <div className="py-10 text-center">
              <TrendingUp className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No recent learning activity</p>
            </div>
          </div>
        ) : (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl divide-y divide-white/[0.04]">
            {recentActivity.slice(0, 20).map((event, i) => (
              <div key={event.id || i} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground text-sm truncate">
                      <span className="text-foreground font-medium">{event.action}</span>{' '}
                      {event.domain} / {event.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {event.confidence !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      {Math.round(event.confidence * 100)}% conf
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
