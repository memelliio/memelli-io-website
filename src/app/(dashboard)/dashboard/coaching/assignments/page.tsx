'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';

interface Assignment {
  id: string;
  student_name?: string;
  contact_name?: string;
  program_name?: string;
  title: string;
  due_date?: string;
  dueAt?: string;
  dueDate?: string;
  submittedAt?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  grade?: string;
  feedback?: string;
  enrollment?: {
    contact?: { id: string; firstName?: string; lastName?: string; email?: string };
    program?: { id: string; name: string };
  };
}

type StatusFilter = 'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED';

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-white/[0.03] border-white/[0.06] text-white/40',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  GRADED: {
    label: 'Graded',
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

function isOverdue(assignment: Assignment): boolean {
  const due = assignment.dueDate ?? assignment.due_date;
  if (!due) return false;
  return new Date(due) < new Date() && assignment.status !== 'GRADED';
}

export default function AssignmentsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Grade modal state
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState('A');
  const [customGrade, setCustomGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['coaching', 'assignments'],
    queryFn: async () => {
      const res = await api.get<any>('/api/coaching/assignments');
      if (res.error) throw new Error(res.error);
      const list = Array.isArray(res.data) ? res.data : (res.data?.assignments ?? res.data?.data ?? []);
      return (list as any[]).map((a: any) => {
        const c = a.enrollment?.contact;
        const contactName = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '' : '';
        const programName = a.enrollment?.program?.name ?? '';
        const status: 'PENDING' | 'SUBMITTED' | 'GRADED' = a.grade ? 'GRADED' : a.submittedAt ? 'SUBMITTED' : 'PENDING';
        return {
          ...a,
          contact_name: a.contact_name ?? contactName,
          program_name: a.program_name ?? programName,
          due_date: a.dueAt ?? a.due_date,
          dueDate: a.dueAt ?? a.dueDate,
          status: a.status ?? status,
        } as Assignment;
      });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, grade, feedback: fb }: { id: string; grade: string; feedback: string }) => {
      const res = await api.post<any>(`/api/coaching/assignments/${id}/grade`, { grade, feedback: fb });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching', 'assignments'] });
      setGradingId(null);
      setFeedback('');
      setCustomGrade('');
      setGradeValue('A');
    },
  });

  const assignments = assignmentsData ?? [];
  const filtered =
    statusFilter === 'ALL'
      ? assignments
      : assignments.filter((a) => a.status === statusFilter);

  const counts = {
    ALL: assignments.length,
    PENDING: assignments.filter((a) => a.status === 'PENDING').length,
    SUBMITTED: assignments.filter((a) => a.status === 'SUBMITTED').length,
    GRADED: assignments.filter((a) => a.status === 'GRADED').length,
  };

  const gradingAssignment = assignments.find((a) => a.id === gradingId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl tracking-tight font-semibold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          All student assignments across programs
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5">
        {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-primary hover:bg-primary rounded-xl text-white backdrop-blur-xl shadow-sm'
                : 'border border-white/[0.06] bg-card backdrop-blur-xl text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_META[s].label}{' '}
            <span
              className={`ml-1 text-xs ${
                statusFilter === s ? 'text-foreground' : 'text-white/20'
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-primary/80">{(error as Error).message}</p>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-left">
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Student</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Program</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Assignment</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Due Date</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground">Grade</th>
                <th className="px-5 py-3.5 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const overdue = isOverdue(a);
                const due = a.dueDate ?? a.due_date;
                const meta = STATUS_META[a.status];
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-white/[0.04] last:border-0 transition-all duration-200 ${
                      overdue
                        ? 'bg-primary/[0.04] hover:bg-primary/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-foreground">
                      {a.contact_name ?? a.student_name ?? '\u2014'}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground leading-relaxed">{a.program_name ?? '\u2014'}</td>
                    <td className="px-5 py-3.5 text-muted-foreground leading-relaxed">{a.title}</td>
                    <td className="px-5 py-3.5">
                      {due ? (
                        <span className={overdue ? 'font-medium text-primary/80' : 'text-white/40'}>
                          {overdue && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                          {new Date(due).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-white/15">{'\u2014'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.grade ? (
                        <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-white/70">
                          {a.grade}
                        </span>
                      ) : (
                        <span className="text-white/15">{'\u2014'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {a.status === 'SUBMITTED' && (
                        <button
                          onClick={() => {
                            setGradingId(a.id);
                            setGradeValue('A');
                            setCustomGrade('');
                            setFeedback('');
                          }}
                          className="rounded-xl bg-primary hover:bg-primary px-3 py-1 text-xs font-medium text-white backdrop-blur-xl transition-all duration-200 shadow-sm"
                        >
                          Grade
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground leading-relaxed">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade modal */}
      {gradingId && gradingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/[0.06] bg-card p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg tracking-tight font-semibold text-foreground">Grade Assignment</h2>
              <button
                onClick={() => setGradingId(null)}
                className="rounded-xl p-1.5 text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <span className="text-muted-foreground leading-relaxed">Student: </span>
                <span className="font-semibold text-foreground">
                  {gradingAssignment.contact_name ?? gradingAssignment.student_name}
                </span>
              </p>
              <p className="mt-0.5">
                <span className="text-muted-foreground leading-relaxed">Assignment: </span>
                {gradingAssignment.title}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Grade</label>
              <div className="flex flex-wrap gap-2">
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGradeValue(g);
                      setCustomGrade('');
                    }}
                    className={`rounded-xl border px-3 py-1.5 font-mono text-sm font-medium transition-all ${
                      gradeValue === g && !customGrade
                        ? 'border-primary/40 bg-primary text-white'
                        : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:border-white/[0.12]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                placeholder="Or enter custom grade..."
                className="w-full rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Feedback{' '}
                <span className="font-normal text-muted-foreground leading-relaxed">(optional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write feedback for the student..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const grade = customGrade.trim() || gradeValue;
                  gradeMutation.mutate({ id: gradingId, grade, feedback });
                }}
                disabled={gradeMutation.isPending}
                className="flex-1 rounded-xl bg-primary hover:bg-primary py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                {gradeMutation.isPending ? 'Submitting...' : 'Submit Grade'}
              </button>
              <button
                onClick={() => setGradingId(null)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground leading-relaxed backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
