'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  BookOpen,
  Users,
  Award,
  FileText,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CoachingStats {
  activePrograms: number;
  totalEnrollments: number;
  completionsThisMonth: number;
  certificatesIssued: number;
  avgCompletionRate: number;
  programs: Program[];
  recentEnrollments: Enrollment[];
  completionTrends: WeeklyCompletion[];
  topPrograms: TopProgram[];
  aiCoachActivity: AiCoachActivity;
}

interface Program {
  id: string;
  name: string;
  tenant: string;
  type: 'Credit Repair' | 'Funding' | 'Business Building';
  enrollments: number;
  completionRate: number;
  status: 'active' | 'draft' | 'archived';
}

interface Enrollment {
  id: string;
  studentName: string;
  program: string;
  tenant: string;
  enrolledDate: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'paused' | 'dropped';
}

interface WeeklyCompletion {
  week: string;
  completions: number;
}

interface TopProgram {
  name: string;
  tenant: string;
  enrollments: number;
  rating: number;
  completionRate: number;
}

interface AiCoachActivity {
  sessionsToday: number;
  topicsCovered: string[];
  studentSatisfaction: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<Program['type'], string> = {
  'Credit Repair': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Funding: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Business Building': 'bg-amber-500/15 text-amber-400 border-amber-500/30'
};

const STATUS_COLORS: Record<Program['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  draft: 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  archived: 'bg-red-500/15 text-red-400 border-red-500/30'
};

const ENROLLMENT_STATUS_COLORS: Record<Enrollment['status'], string> = {
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  dropped: 'bg-red-500/15 text-red-400 border-red-500/30'
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
}

function formatEnrollmentStatus(status: Enrollment['status']): string {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'paused':
      return 'Paused';
    case 'dropped':
      return 'Dropped';
    default:
      return status;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CoachingPage() {
  const api = useApi();

  const [stats, setStats] = useState<CoachingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<CoachingStats>('/api/admin/coaching/stats');
    if (res.error) {
      setError(res.error);
    } else {
      setStats(res.data ?? null);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Loading / Error states                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
        <div className="flex flex-col items-center gap-3">
          <LoadingGlobe size="lg" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading coaching data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="rounded-xl bg-[hsl(var(--muted))] px-5 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-white/[0.1] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxCompletion = Math.max(...stats.completionTrends.map((w) => w.completions), 1);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* ---- Header ---- */}
        <div className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-red-400" />
          <h1 className="text-2xl font-bold tracking-tight">Coaching &amp; Learning</h1>
        </div>

        {/* ---- Stats Row ---- */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-blue-400" />}
            label="Active Programs"
            value={stats.activePrograms}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-violet-400" />}
            label="Total Enrollments"
            value={stats.totalEnrollments}
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-amber-400" />}
            label="Completions This Month"
            value={stats.completionsThisMonth}
          />
          <StatCard
            icon={<FileText className="h-5 w-5 text-emerald-400" />}
            label="Certificates Issued"
            value={stats.certificatesIssued}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-sky-400" />}
            label="Avg Completion Rate"
            value={`${stats.avgCompletionRate}%`}
          />
        </div>

        {/* ---- Program Table ---- */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Programs</h2>
          <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Program</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Enrollments</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Completion Rate</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.programs.map((p) => (
                  <tr key={p.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="font-medium text-[hsl(var(--foreground))]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{p.tenant}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[p.type]}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{p.enrollments}</td>
                    <td className="px-4 py-3 text-center text-[hsl(var(--foreground))]">{p.completionRate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.programs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
                      No programs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- Recent Enrollments ---- */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Recent Enrollments</h2>
          <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] backdrop-blur-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Program</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Enrolled</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">Progress</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEnrollments.map((e) => (
                  <tr key={e.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="font-medium text-[hsl(var(--foreground))]">{e.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{e.program}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{e.tenant}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{formatDate(e.enrolledDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-[hsl(var(--muted))]">
                          <div
                            className="h-1.5 rounded-full bg-red-500 transition-all"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{e.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${ENROLLMENT_STATUS_COLORS[e.status]}`}>
                        {formatEnrollmentStatus(e.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recentEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
                      No recent enrollments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- Bottom Grid: Trends + Top Programs + AI Coach ---- */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Completion Trends */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))] mb-4">Completion Trends</h3>
            <div className="flex items-end gap-2 h-40">
              {stats.completionTrends.map((w, i) => {
                const height = Math.max((w.completions / maxCompletion) * 100, 4);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{w.completions}</span>
                    <div
                      className="w-full rounded-t bg-red-500/80 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate w-full text-center">{w.week}</span>
                  </div>
                );
              })}
              {stats.completionTrends.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] m-auto">No data yet</p>
              )}
            </div>
          </div>

          {/* Top Programs */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))] mb-4">Top Programs</h3>
            <div className="space-y-3">
              {stats.topPrograms.map((tp, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{tp.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{tp.tenant}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{tp.enrollments}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-amber-400">{tp.rating}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-emerald-400">{tp.completionRate}%</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">complete</p>
                    </div>
                  </div>
                </div>
              ))}
              {stats.topPrograms.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">No data yet</p>
              )}
            </div>
          </div>

          {/* AI Coach Activity */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-5">
            <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))] mb-4">AI Coach Activity</h3>
            <div className="space-y-4">
              {/* Sessions today */}
              <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-3">
                <MessageSquare className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">{stats.aiCoachActivity.sessionsToday}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Sessions Today</p>
                </div>
              </div>

              {/* Topics covered */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Topics Covered</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stats.aiCoachActivity.topicsCovered.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-0.5 text-xs text-[hsl(var(--foreground))]"
                    >
                      {topic}
                    </span>
                  ))}
                  {stats.aiCoachActivity.topicsCovered.length === 0 && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">None yet</span>
                  )}
                </div>
              </div>

              {/* Satisfaction */}
              <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-3">
                <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">{stats.aiCoachActivity.studentSatisfaction}%</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Student Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 transition-colors hover:bg-[hsl(var(--muted))]">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{value}</p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}
