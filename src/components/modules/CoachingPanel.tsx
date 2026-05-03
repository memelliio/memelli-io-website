'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  CheckCircle,
  DollarSign,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Program {
  id: string;
  /** API returns `name`, not `title` */
  name: string;
  description?: string | null;
  price?: number | null;
  /** DB values: DRAFT | PUBLISHED */
  status?: string | null;
  _count?: { modules: number; enrollments: number };
  createdAt?: string;
}

interface Enrollment {
  id: string;
  enrolledAt?: string | null;
  status?: string | null;
  progressPct?: number | null;
  program?: { id: string; name: string } | null;
  contact?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  _count?: { progress: number };
}

interface NewProgramForm {
  title: string;
  slug: string;
  description: string;
  price: string;
  template: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString()}`;
}

function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function enrollmentName(e: Enrollment): string {
  if (!e.contact) return 'Unknown';
  const full = [e.contact.firstName, e.contact.lastName].filter(Boolean).join(' ');
  return full || e.contact.email || 'Unknown';
}

function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-1">
      {children}
    </h3>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; color?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: '#a855f7' }} />
        <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className={`text-2xl font-bold leading-none ${accent ? '' : 'text-white'}`}
        style={accent ? { color: '#a855f7' } : undefined}>
        {value}
      </span>
    </div>
  );
}

function ProgramStatusBadge({ status }: { status?: string | null }) {
  const s = (status || 'DRAFT').toUpperCase();
  if (s === 'PUBLISHED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/40">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-white/[0.06]">
      Draft
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%`, background: '#a855f7' }}
      />
    </div>
  );
}

function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
          <div className="h-3 rounded bg-white/[0.05] flex-1 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/[0.05] animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </>
  );
}

function InputField({
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  min,
  step,
}: {
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  step?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      min={min}
      step={step}
      className="w-full rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function CoachingPanel() {
  const api = useApi();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<NewProgramForm>({
    title: '',
    slug: '',
    description: '',
    price: '',
    template: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Data fetching — real endpoints ── */

  // GET /api/coaching/programs — includes _count.enrollments
  const programsQuery = useQuery({
    queryKey: ['coaching-panel-programs'],
    queryFn: () => api.get<Program[]>('/api/coaching/programs'),
    staleTime: 30_000,
    retry: false,
  });

  // GET /api/coaching/enrollments — recent enrollments with contact + program
  const enrollmentsQuery = useQuery({
    queryKey: ['coaching-panel-enrollments'],
    queryFn: () => api.get<Enrollment[]>('/api/coaching/enrollments?perPage=6'),
    staleTime: 30_000,
    retry: false,
  });

  /* ── Derived data ── */
  const programs = unwrapList<Program>(programsQuery.data?.data);
  const enrollments = unwrapList<Enrollment>(enrollmentsQuery.data?.data);

  // Published programs count (DB status is PUBLISHED)
  const publishedPrograms = programs.filter(
    (p) => (p.status || '').toUpperCase() === 'PUBLISHED'
  ).length;

  // Total students = sum of enrollment counts
  const totalStudents = programs.reduce(
    (sum, p) => sum + (p._count?.enrollments ?? 0),
    0
  );

  // Completions = enrollments with COMPLETED status
  const completedEnrollments = enrollments.filter(
    (e) => (e.status || '').toUpperCase() === 'COMPLETED'
  ).length;

  // Revenue = sum(price * enrollments) per program
  const totalRevenue = programs.reduce((sum, p) => {
    return sum + (p.price ?? 0) * (p._count?.enrollments ?? 0);
  }, 0);

  /* ── Form handlers ── */
  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // Auto-generate slug from title if slug hasn't been manually edited
        if (name === 'title' && !prev.slug) {
          next.slug = slugify(value);
        }
        return next;
      });
      setFormError(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.title.trim()) {
        setFormError('Program title is required.');
        return;
      }

      const slug = formData.slug.trim() || slugify(formData.title);
      if (!/^[a-z0-9-]+$/.test(slug)) {
        setFormError('Slug may only contain lowercase letters, numbers, and hyphens.');
        return;
      }

      setSubmitting(true);

      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        slug,
        description: formData.description.trim() || undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        isPublic: false,
      };
      if (formData.template) payload.template = formData.template;

      const res = await api.post('/api/coaching/programs', payload);
      setSubmitting(false);

      if (res.error) {
        setFormError(res.error);
        return;
      }

      setFormSuccess(true);
      setFormData({ title: '', slug: '', description: '', price: '', template: '' });
      qc.invalidateQueries({ queryKey: ['coaching-panel-programs'] });

      setTimeout(() => {
        setFormSuccess(false);
        setFormOpen(false);
      }, 2500);
    },
    [api, formData, qc]
  );

  /* ═════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                   */
  /* ═════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[hsl(var(--foreground))] text-base font-semibold tracking-tight">Coaching</h2>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.25)',
              color: '#a855f7',
            }}
          >
            {programsQuery.isLoading ? '—' : `${publishedPrograms} Published`}
          </span>
        </div>
        <Link
          href="/dashboard/coaching"
          className="flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-white transition-colors font-mono"
        >
          Manage
          <ExternalLink size={10} />
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Programs"
          value={programsQuery.isLoading ? '—' : programs.length}
        />
        <StatCard
          icon={Users}
          label="Students"
          value={programsQuery.isLoading ? '—' : totalStudents.toLocaleString()}
        />
        <StatCard
          icon={CheckCircle}
          label="Completions"
          value={enrollmentsQuery.isLoading ? '—' : completedEnrollments}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={programsQuery.isLoading ? '—' : fmtCurrency(totalRevenue)}
          accent
        />
      </div>

      {/* ── Programs list ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-3 pt-3 pb-2">
          <SectionHeader>Programs</SectionHeader>
        </div>
        <div className="px-3 pb-2">
          {programsQuery.isLoading ? (
            <RowSkeleton count={4} />
          ) : programs.length === 0 ? (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] py-4 text-center font-mono">
              {programsQuery.isError ? 'Could not load programs.' : 'No programs yet.'}
            </p>
          ) : (
            programs.slice(0, 5).map((p) => {
              const enrollCount = p._count?.enrollments ?? 0;
              return (
                <div
                  key={p.id}
                  className="py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-[11px] text-[hsl(var(--foreground))] font-medium truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono shrink-0">
                      {enrollCount} enrolled
                    </span>
                    <ProgramStatusBadge status={p.status} />
                  </div>
                  {p.price != null && p.price > 0 && (
                    <span className="text-[10px] font-mono mt-0.5 block" style={{ color: '#a855f7' }}>
                      ${p.price.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Recent Enrollments ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-3 pt-3 pb-2">
          <SectionHeader>Recent Enrollments</SectionHeader>
        </div>
        <div className="px-3 pb-2">
          {enrollmentsQuery.isLoading ? (
            <RowSkeleton count={4} />
          ) : enrollments.length === 0 ? (
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] py-4 text-center font-mono">
              {enrollmentsQuery.isError ? 'Could not load enrollments.' : 'No enrollments yet.'}
            </p>
          ) : (
            enrollments.map((e) => {
              const pct = e.progressPct ?? 0;
              return (
                <div key={e.id} className="py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[hsl(var(--foreground))] truncate leading-none">
                        {enrollmentName(e)}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-0.5 leading-none font-mono">
                        {e.program?.name ?? '—'}
                      </p>
                    </div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono shrink-0">
                      {fmtDate(e.enrolledAt)}
                    </span>
                    <span
                      className="text-[10px] font-mono shrink-0 min-w-[2.5rem] text-right"
                      style={{ color: pct > 0 ? '#a855f7' : '#52525b' }}
                    >
                      {pct}%
                    </span>
                  </div>
                  {pct > 0 && (
                    <div className="mt-1.5">
                      <ProgressBar value={pct} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Create Program form ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        >
          <div className="flex items-center gap-2">
            <Plus size={12} style={{ color: '#a855f7' }} />
            <SectionHeader>Create Program</SectionHeader>
          </div>
          {formOpen ? (
            <ChevronUp size={13} className="text-[hsl(var(--muted-foreground))]" />
          ) : (
            <ChevronDown size={13} className="text-[hsl(var(--muted-foreground))]" />
          )}
        </button>

        {formOpen && (
          <form onSubmit={handleSubmit} className="px-3 pb-3 flex flex-col gap-2">
            <InputField
              name="title"
              placeholder="Program title"
              value={formData.title}
              onChange={handleFormChange}
            />
            <InputField
              name="slug"
              placeholder="url-slug (auto-generated)"
              value={formData.slug}
              onChange={handleFormChange}
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleFormChange}
              rows={2}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <div className="flex gap-2">
              <InputField
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Price (e.g. 97)"
                value={formData.price}
                onChange={handleFormChange}
              />
              <select
                name="template"
                value={formData.template}
                onChange={handleFormChange}
                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <option value="">No template</option>
                <option value="business">Business</option>
                <option value="funding">Funding</option>
                <option value="credit-repair">Credit Repair</option>
                <option value="real-estate">Real Estate</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            {formError && (
              <p className="text-[10px] text-red-400 font-mono">{formError}</p>
            )}
            {formSuccess && (
              <p className="text-[10px] font-mono" style={{ color: '#a855f7' }}>
                Program created successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: '#a855f7' }}
            >
              {submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {submitting ? 'Creating...' : 'Create Program'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
