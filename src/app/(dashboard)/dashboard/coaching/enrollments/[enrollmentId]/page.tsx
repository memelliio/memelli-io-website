'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Circle, Award, UserX, Plus, X } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';

function useRawApi() {
  const { get, post, patch } = useApi();
  return {
    get: async (path: string) => {
      const res = await get<any>(path);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    post: async (path: string, body: unknown) => {
      const res = await post<any>(path, body);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    patch: async (path: string, body: unknown) => {
      const res = await patch<any>(path, body);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
  };
}

interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  module_title?: string;
  module_id?: string;
  completed: boolean;
  completed_at?: string;
  completedAt?: string;
  order?: number;
}

interface Assignment {
  id: string;
  title: string;
  due_date?: string;
  submitted_at?: string;
  submittedAt?: string;
  status?: string;
  grade?: number;
}

interface Enrollment {
  id: string;
  contact_id?: string;
  contact_name: string;
  contact_email?: string;
  program_id?: string;
  program_name: string;
  enrolled_at?: string;
  enrolledAt?: string;
  progressPct?: number;
  progress?: number;
  status: string;
  certificate_issued?: boolean;
  certificateId?: string;
  certificate?: { id: string; issuedAt: string } | null;
  lesson_progress?: LessonProgress[];
  lessonProgress?: LessonProgress[];
  assignments?: Assignment[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  DROPPED: 'bg-primary/10 text-primary/80 border border-primary/20',
  PAUSED: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-white/[0.03] text-white/40 border border-white/[0.06]',
  SUBMITTED: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  GRADED: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  LATE: 'bg-primary/10 text-primary/80 border border-primary/20',
};

function StatusBadge({ status, colors }: { status: string; colors?: Record<string, string> }) {
  const c = colors ?? STATUS_COLORS;
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${c[status] ?? 'bg-white/[0.03] text-white/40 border border-white/[0.06]'}`}>
      {status}
    </span>
  );
}

export default function EnrollmentDetailPage() {
  const params = useParams();
  const enrollmentId = params.enrollmentId as string;
  const api = useRawApi();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completing, setCompleting] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', due_date: '' });
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // useRawApi auto-unwraps { success, data } envelope, so enrRaw is the enrollment object directly
      const enrRaw = await api.get(`/api/coaching/enrollments/${enrollmentId}`);
      const enr: Enrollment = enrRaw as Enrollment;
      setEnrollment(enr);

      // Build lesson progress from the embedded program -> modules -> lessons + progress records
      const program = (enr as any).program;
      const progressRecords: { lessonId: string; completedAt?: string }[] = (enr as any).progress ?? [];
      const completedSet = new Set(progressRecords.map((p: any) => p.lessonId));

      if (program?.modules) {
        const lessonProg: LessonProgress[] = [];
        for (const mod of program.modules) {
          for (const lesson of (mod.lessons ?? [])) {
            const progressRecord = progressRecords.find((p: any) => p.lessonId === lesson.id);
            lessonProg.push({
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              module_id: mod.id,
              module_title: mod.title,
              completed: completedSet.has(lesson.id),
              completed_at: progressRecord?.completedAt,
              order: lesson.order ?? 0,
            });
          }
        }
        setLessonProgress(lessonProg);
      } else {
        // Fallback: load lesson progress from separate endpoint (auto-unwrapped by useRawApi)
        const progressData = await api.get(`/api/coaching/progress?enrollmentId=${enrollmentId}`).catch(() => []);
        const lessonProg = enr.lessonProgress ?? enr.lesson_progress ?? (Array.isArray(progressData) ? progressData : []);
        setLessonProgress(Array.isArray(lessonProg) ? lessonProg : []);
      }

      // Use embedded assignments from the detail response
      const embeddedAssignments = (enr as any).assignments ?? [];
      if (Array.isArray(embeddedAssignments) && embeddedAssignments.length > 0) {
        setAssignments(embeddedAssignments.map((a: any) => ({
          id: a.id,
          title: a.title,
          due_date: a.dueAt ?? a.due_date,
          submitted_at: a.submittedAt ?? a.submitted_at,
          status: a.submittedAt ? (a.grade ? 'GRADED' : 'SUBMITTED') : 'PENDING',
          grade: a.grade != null ? Number(a.grade) : undefined,
        })));
      } else {
        // Fallback: load assignments from separate endpoint (auto-unwrapped by useRawApi)
        const assignData = await api.get(`/api/coaching/assignments?enrollmentId=${enrollmentId}`).catch(() => []);
        const asgn = Array.isArray(assignData) ? assignData : [];
        const assignList = Array.isArray(asgn) ? asgn.map((a: any) => ({
          id: a.id,
          title: a.title,
          due_date: a.dueAt ?? a.due_date,
          submitted_at: a.submittedAt ?? a.submitted_at,
          status: a.submittedAt ? (a.grade ? 'GRADED' : 'SUBMITTED') : 'PENDING',
          grade: a.grade != null ? Number(a.grade) : undefined,
        })) : [];
        setAssignments(assignList);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function markLessonComplete(lessonId: string) {
    setCompleting(lessonId);
    try {
      await api.post('/api/coaching/progress/complete', { enrollmentId, lessonId });
      const updated = lessonProgress.map((lp) =>
        lp.lesson_id === lessonId
          ? { ...lp, completed: true, completed_at: new Date().toISOString() }
          : lp
      );
      setLessonProgress(updated);
      const done = updated.filter((lp) => lp.completed).length;
      const pct = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
      setEnrollment((prev) => prev ? { ...prev, progressPct: pct, progress: pct } : prev);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to mark complete');
    } finally {
      setCompleting(null);
    }
  }

  async function markDropped() {
    if (!confirm('Mark this enrollment as Dropped?')) return;
    setActionLoading(true);
    try {
      const updated = await api.patch(`/api/coaching/enrollments/${enrollmentId}`, { status: 'DROPPED' });
      setEnrollment((prev) => ({ ...(prev ?? {}), ...(updated as any) } as Enrollment));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  async function issueCertificate() {
    if (!confirm('Issue a certificate for this enrollment?')) return;
    setActionLoading(true);
    try {
      await api.post('/api/coaching/certificates', { enrollmentId });
      setEnrollment((prev) => prev ? { ...prev, certificate_issued: true, certificate: { id: 'pending', issuedAt: new Date().toISOString() } } : prev);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to issue certificate');
    } finally {
      setActionLoading(false);
    }
  }

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!assignmentForm.title.trim()) return;
    setAddingAssignment(true);
    setAssignmentError(null);
    try {
      const resp: any = await api.post('/api/coaching/assignments', {
        enrollmentId,
        title: assignmentForm.title,
        dueAt: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : undefined,
      });
      const newAsgn: Assignment = {
        id: resp.id,
        title: resp.title,
        due_date: resp.dueAt,
        status: 'PENDING',
      };
      setAssignments((prev) => [...prev, newAsgn]);
      setAssignmentForm({ title: '', due_date: '' });
      setShowAssignmentModal(false);
    } catch (e: unknown) {
      setAssignmentError(e instanceof Error ? e.message : 'Failed to add assignment');
    } finally {
      setAddingAssignment(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-card p-6">
        <p className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-muted-foreground leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!enrollment) return null;

  // Group lessons by module
  const moduleMap = new Map<string, { title: string; lessons: LessonProgress[] }>();
  for (const lp of lessonProgress) {
    const key = lp.module_id ?? 'ungrouped';
    const title = lp.module_title ?? 'Lessons';
    if (!moduleMap.has(key)) moduleMap.set(key, { title, lessons: [] });
    moduleMap.get(key)!.lessons.push(lp);
  }
  const groupedModules = Array.from(moduleMap.entries());

  const completedCount = lessonProgress.filter((lp) => lp.completed).length;
  const pct = Math.min(100, Math.max(0, enrollment.progressPct ?? enrollment.progress ?? 0));
  const enrolledDate = enrollment.enrolledAt ?? enrollment.enrolled_at;

  return (
    <div className="min-h-screen bg-card p-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-white/30">
          <a href="/dashboard/coaching" className="transition-all duration-200 hover:text-white/60">Coaching</a>
          <span>/</span>
          <a href="/dashboard/coaching/enrollments" className="transition-all duration-200 hover:text-white/60">Enrollments</a>
          <span>/</span>
          <span className="text-white/60">{enrollment.contact_name}</span>
        </nav>

        {/* Header Card */}
        <div className="mb-6 rounded-2xl border border-white/[0.04] bg-card p-6 backdrop-blur-xl transition-all duration-200">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h1 className="text-2xl tracking-tight font-semibold text-foreground">{enrollment.contact_name}</h1>
              {enrollment.contact_email && (
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{enrollment.contact_email}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Program: <span className="font-medium text-white/70">{enrollment.program_name}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                Enrolled:{' '}
                <span className="text-white/70">
                  {enrolledDate ? new Date(enrolledDate).toLocaleDateString() : '—'}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={enrollment.status} />
              {enrollment.status === 'ACTIVE' && (
                <button
                  onClick={markDropped}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary/80 transition-all duration-200 hover:bg-primary/10 disabled:opacity-50"
                >
                  <UserX className="h-3.5 w-3.5" /> Mark Dropped
                </button>
              )}
              {enrollment.status === 'COMPLETED' && !enrollment.certificate_issued && !enrollment.certificate && (
                <button
                  onClick={issueCertificate}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-300 transition-all duration-200 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  <Award className="h-3.5 w-3.5" /> Issue Certificate
                </button>
              )}
              {(enrollment.certificate_issued || enrollment.certificate) && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Award className="h-3.5 w-3.5" /> Certificate Issued
                </span>
              )}
            </div>
          </div>

          {/* Big Progress Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground leading-relaxed">Overall Progress</span>
              <span className="text-lg tracking-tight font-semibold text-primary">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-purple-600 to-purple-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {completedCount} of {lessonProgress.length} lessons completed
            </p>
          </div>
        </div>

        {/* Modules / Lessons Checklist */}
        {groupedModules.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl transition-all duration-200">
            <div className="border-b border-white/[0.04] px-5 py-4">
              <h2 className="tracking-tight font-semibold text-foreground">Lessons</h2>
            </div>
            {groupedModules.map(([moduleKey, { title: modTitle, lessons }]) => (
              <div key={moduleKey}>
                {groupedModules.length > 1 && (
                  <div className="border-b border-white/[0.04] bg-card px-5 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{modTitle}</p>
                  </div>
                )}
                <div className="divide-y divide-white/[0.04]">
                  {lessons
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((lp) => {
                      const completedDate = lp.completed_at ?? lp.completedAt;
                      return (
                        <div
                          key={lp.lesson_id}
                          className="flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-3">
                            {lp.completed ? (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4 flex-shrink-0 text-white/15" />
                            )}
                            <span
                              className={`text-sm ${
                                lp.completed
                                  ? 'text-white/40 line-through decoration-white/10'
                                  : 'text-white/70'
                              }`}
                            >
                              {lp.lesson_title}
                            </span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3">
                            {lp.completed && completedDate && (
                              <span className="text-xs text-white/20">
                                {new Date(completedDate).toLocaleDateString()}
                              </span>
                            )}
                            {!lp.completed && (
                              <button
                                onClick={() => markLessonComplete(lp.lesson_id)}
                                disabled={completing === lp.lesson_id}
                                className="rounded-xl bg-primary px-3 py-1 text-xs font-medium text-white backdrop-blur-xl transition-all duration-200 hover:bg-primary/80 shadow-sm disabled:opacity-50"
                              >
                                {completing === lp.lesson_id ? '...' : 'Mark Complete'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assignments Section */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl transition-all duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h2 className="tracking-tight font-semibold text-foreground">Assignments</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/[0.04]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground leading-relaxed">
              No assignments yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Assignment</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Grade</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const submittedDate = a.submittedAt ?? a.submitted_at;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-white/[0.04] transition-all duration-200 last:border-0 hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-3 text-foreground">{a.title}</td>
                      <td className="px-5 py-3 text-muted-foreground leading-relaxed">
                        {a.due_date
                          ? new Date(a.due_date).toLocaleDateString()
                          : submittedDate
                          ? new Date(submittedDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={a.status ?? 'PENDING'}
                          colors={ASSIGNMENT_STATUS_COLORS}
                        />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground leading-relaxed">
                        {a.grade != null ? (
                          <span
                            className={
                              a.grade >= 70 ? 'font-medium text-emerald-400' : 'font-medium text-primary'
                            }
                          >
                            {a.grade}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.04] bg-card shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <h2 className="tracking-tight font-semibold text-foreground">Add Assignment</h2>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setAssignmentError(null);
                }}
                className="text-white/30 transition-all duration-200 hover:text-white/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={addAssignment} className="space-y-4 p-6">
              {assignmentError && (
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground leading-relaxed">
                  {assignmentError}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Title
                </label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Dispute Letter Draft"
                  required
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder-white/20 backdrop-blur-xl transition-all duration-200 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Due Date
                </label>
                <input
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl transition-all duration-200 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={addingAssignment}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-200 hover:bg-primary/80 shadow-sm disabled:opacity-50"
                >
                  {addingAssignment ? 'Adding...' : 'Add Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentError(null);
                  }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
