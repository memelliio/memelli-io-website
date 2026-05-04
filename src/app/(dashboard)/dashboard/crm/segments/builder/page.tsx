'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  X,
  Users,
  Save,
  Trash2,
  Filter,
  Calendar,
  Hash,
  Mail,
  Tag,
  ShoppingCart,
  Clock,
  Pencil,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  type BadgeVariant,
} from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  filters: any;
  logic?: 'AND' | 'OR';
  contactCount?: number;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FIELDS = [
  { value: 'name', label: 'Name', icon: Users, type: 'text', operators: ['equals', 'contains', 'not_equals', 'not_contains', 'is_empty', 'is_not_empty'] },
  { value: 'email', label: 'Email', icon: Mail, type: 'text', operators: ['equals', 'contains', 'not_equals', 'not_contains', 'is_empty', 'is_not_empty'] },
  { value: 'tag', label: 'Tag', icon: Tag, type: 'text', operators: ['equals', 'contains', 'not_equals', 'not_contains'] },
  { value: 'signup_date', label: 'Signup Date', icon: Calendar, type: 'date', operators: ['equals', 'before', 'after'] },
  { value: 'purchases', label: 'Purchases', icon: ShoppingCart, type: 'number', operators: ['equals', 'greater_than', 'less_than', 'not_equals'] },
  { value: 'last_active', label: 'Last Active', icon: Clock, type: 'date', operators: ['equals', 'before', 'after'] },
] as const;

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  greater_than: 'greater than',
  less_than: 'less than',
  before: 'is before',
  after: 'is after',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getFieldDef(fieldValue: string) {
  return FIELDS.find((f) => f.value === fieldValue);
}

/* ------------------------------------------------------------------ */
/*  Segment Builder Page                                               */
/* ------------------------------------------------------------------ */

export default function SegmentBuilderPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  /* -- Builder state ------------------------------------------------ */
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  /* -- Saved segments list ------------------------------------------ */
  const {
    data: segments = [],
    isLoading: segmentsLoading,
  } = useQuery<Segment[]>({
    queryKey: ['crm', 'segments'],
    queryFn: async () => {
      const res = await api.get<any>('/api/crm/segments');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      return raw?.data ?? raw?.items ?? [];
    },
  });

  /* -- Rule management ---------------------------------------------- */
  function addRule() {
    setRules((prev) => [
      ...prev,
      { id: uid(), field: 'name', operator: 'contains', value: '' },
    ]);
  }

  function updateRule(id: string, key: keyof FilterRule, value: string) {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: value };
        if (key === 'field') {
          const fieldDef = getFieldDef(value);
          updated.operator = fieldDef?.operators[0] ?? 'equals';
          updated.value = '';
        }
        return updated;
      })
    );
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function duplicateRule(id: string) {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const clone = { ...prev[idx], id: uid() };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }

  /* -- Preview ------------------------------------------------------ */
  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewCount(null);
    try {
      const filters = rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
      }));
      const res = await api.post<any>('/api/crm/segments/preview', {
        filters,
        logic,
      });
      if (res.data?.count != null) {
        setPreviewCount(res.data.count);
      } else {
        const contactRes = await api.get<any>('/api/contacts?perPage=1');
        setPreviewCount(contactRes.data?.meta?.total ?? contactRes.data?.total ?? 0);
      }
    } catch {
      setPreviewCount(null);
    }
    setPreviewLoading(false);
  }, [api, rules, logic]);

  /* -- Save --------------------------------------------------------- */
  async function handleSave() {
    if (!segmentName.trim()) {
      setError('Segment name is required');
      return;
    }
    setSaving(true);
    setError(null);
    const filters = rules.map((r) => ({
      field: r.field,
      operator: r.operator,
      value: r.value,
    }));
    const payload = {
      name: segmentName.trim(),
      description: segmentDescription.trim() || undefined,
      filters,
      logic,
    };
    const res = editingSegmentId
      ? await api.patch<any>(`/api/crm/segments/${editingSegmentId}`, payload)
      : await api.post<any>('/api/crm/segments', payload);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['crm', 'segments'] });
    resetBuilder();
  }

  /* -- Load segment for editing ------------------------------------- */
  function loadSegment(seg: Segment) {
    setEditingSegmentId(seg.id);
    setSegmentName(seg.name);
    setSegmentDescription('');
    setLogic(seg.logic ?? 'AND');
    if (Array.isArray(seg.filters)) {
      setRules(
        seg.filters.map((f: any) => ({
          id: uid(),
          field: f.field ?? f.key ?? 'name',
          operator: f.operator ?? 'contains',
          value: f.value ?? '',
        }))
      );
    } else {
      setRules([]);
    }
    setPreviewCount(seg.contactCount ?? null);
    setError(null);
  }

  /* -- Reset builder ------------------------------------------------ */
  function resetBuilder() {
    setEditingSegmentId(null);
    setSegmentName('');
    setSegmentDescription('');
    setRules([]);
    setLogic('AND');
    setPreviewCount(null);
    setError(null);
  }

  /* -- Render value input ------------------------------------------- */
  function renderValueInput(rule: FilterRule) {
    if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') {
      return null;
    }
    const fieldDef = getFieldDef(rule.field);
    const inputCls =
      'flex-1 min-w-0 rounded-xl border border-white/[0.06] bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200';

    if (fieldDef?.type === 'date') {
      return (
        <input
          type="date"
          value={rule.value}
          onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
          className={inputCls}
        />
      );
    }
    if (fieldDef?.type === 'number') {
      return (
        <input
          type="number"
          value={rule.value}
          onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
          placeholder="0"
          className={`${inputCls} tabular-nums`}
        />
      );
    }
    return (
      <input
        type="text"
        value={rule.value}
        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
        placeholder={`Enter ${fieldDef?.label.toLowerCase() ?? 'value'}...`}
        className={inputCls}
      />
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="bg-card min-h-screen">
      <div className="p-8 space-y-8">
        {/* Header */}
        <PageHeader
          title="Segment Builder"
          subtitle="Create rule-based audience segments for targeted outreach"
          breadcrumb={[
            { label: 'CRM', href: '/dashboard/crm' },
            { label: 'Segments', href: '/dashboard/crm/segments' },
            { label: 'Builder' },
          ]}
          actions={
            <button
              onClick={() => router.push('/dashboard/crm/segments')}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Segments
            </button>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ============================================================ */}
          {/*  LEFT: Builder Panel                                         */}
          {/* ============================================================ */}
          <div className="xl:col-span-2 space-y-6">
            {/* Segment info */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {editingSegmentId ? 'Edit Segment' : 'New Segment'}
                </h3>
                {editingSegmentId && (
                  <button
                    onClick={resetBuilder}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Clear & start new
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Segment Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => {
                    setSegmentName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. VIP Clients, Recent Signups"
                  className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  rows={2}
                  placeholder="What does this segment represent?"
                  className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter rules */}
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Filter Rules
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contacts must match{' '}
                    <span className="text-red-400 font-medium">
                      {logic === 'AND' ? 'all' : 'any'}
                    </span>{' '}
                    of these conditions
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Logic toggle */}
                  <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
                    <button
                      onClick={() => setLogic('AND')}
                      className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                        logic === 'AND'
                          ? 'bg-red-600/20 text-red-400 border-r border-red-500/20'
                          : 'bg-muted text-muted-foreground hover:text-foreground border-r border-white/[0.06]'
                      }`}
                    >
                      AND
                    </button>
                    <button
                      onClick={() => setLogic('OR')}
                      className={`px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                        logic === 'OR'
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      OR
                    </button>
                  </div>

                  <button
                    onClick={addRule}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-medium text-white transition-all duration-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Rule
                  </button>
                </div>
              </div>

              {/* Rule list */}
              {rules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.06] px-6 py-16 text-center">
                  <Filter className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No filter rules defined
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Segment will include all contacts
                  </p>
                  <button
                    onClick={addRule}
                    className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
                  >
                    Add your first rule
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, idx) => {
                    const fieldDef = getFieldDef(rule.field);
                    const FieldIcon = fieldDef
                      ? FIELDS.find((f) => f.value === rule.field)?.icon ?? Filter
                      : Filter;
                    return (
                      <div key={rule.id}>
                        {/* Logic connector */}
                        {idx > 0 && (
                          <div className="flex items-center gap-2 py-1.5 pl-6">
                            <div className="w-px h-4 bg-red-500/20" />
                            <span className="text-[10px] font-bold tracking-widest text-red-400/50 uppercase">
                              {logic}
                            </span>
                            <div className="flex-1 h-px bg-red-500/10" />
                          </div>
                        )}

                        {/* Rule row */}
                        <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-muted backdrop-blur-xl px-4 py-3 hover:border-white/[0.08] transition-all duration-200">
                          {/* Field icon */}
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                            <FieldIcon className="h-4 w-4" />
                          </div>

                          {/* Field select */}
                          <select
                            value={rule.field}
                            onChange={(e) =>
                              updateRule(rule.id, 'field', e.target.value)
                            }
                            className="rounded-xl border border-white/[0.06] bg-muted px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 min-w-[130px]"
                          >
                            {FIELDS.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>

                          {/* Operator select */}
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              updateRule(rule.id, 'operator', e.target.value)
                            }
                            className="rounded-xl border border-white/[0.06] bg-muted px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 min-w-[150px]"
                          >
                            {(fieldDef?.operators ?? ['equals']).map((op) => (
                              <option key={op} value={op}>
                                {OPERATOR_LABELS[op] ?? op}
                              </option>
                            ))}
                          </select>

                          {/* Value input */}
                          {renderValueInput(rule)}

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => duplicateRule(rule.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200"
                              title="Duplicate rule"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeRule(rule.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                              title="Remove rule"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preview + Save bar */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.04] flex-wrap">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-muted hover:bg-muted px-4 py-2.5 text-sm text-foreground transition-all duration-200 disabled:opacity-50"
                  >
                    {previewLoading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    Preview Count
                  </button>

                  {previewCount !== null && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 px-4 py-2">
                      <Users className="h-4 w-4 text-red-400" />
                      <span className="text-2xl font-bold tabular-nums text-red-400">
                        {previewCount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        matching contacts
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {editingSegmentId && (
                    <button
                      onClick={resetBuilder}
                      className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !segmentName.trim()}
                    className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:text-red-300/50 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200"
                  >
                    {saving ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {editingSegmentId ? 'Update Segment' : 'Save Segment'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/*  RIGHT: Saved Segments List                                   */}
          {/* ============================================================ */}
          <div className="space-y-6">
            <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Saved Segments
                </h3>
                <Badge variant="default">
                  {segments.length}
                </Badge>
              </div>

              {segmentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="line"
                      className="h-20 rounded-xl"
                    />
                  ))}
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No segments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first segment above
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100dvh-320px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {segments.map((seg) => {
                    const isActive = editingSegmentId === seg.id;
                    const ruleCount = Array.isArray(seg.filters)
                      ? seg.filters.length
                      : 0;
                    return (
                      <button
                        key={seg.id}
                        onClick={() => loadSegment(seg)}
                        className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                          isActive
                            ? 'border-red-500/30 bg-red-500/5'
                            : 'border-white/[0.04] bg-muted hover:border-white/[0.08] hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`text-sm font-semibold tracking-tight truncate ${
                              isActive ? 'text-red-400' : 'text-foreground'
                            }`}
                          >
                            {seg.name}
                          </span>
                          {isActive && (
                            <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase text-red-400 bg-red-500/10 rounded-md px-2 py-0.5">
                              Editing
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="font-medium text-foreground tabular-nums">
                              {seg.contactCount ?? 0}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            {ruleCount} rule{ruleCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span>
                            Created{' '}
                            {new Date(seg.createdAt).toLocaleDateString()}
                          </span>
                          {seg.updatedAt && (
                            <span>
                              Updated{' '}
                              {new Date(seg.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
