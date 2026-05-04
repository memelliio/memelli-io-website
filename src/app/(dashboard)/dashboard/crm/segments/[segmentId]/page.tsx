'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  X,
  Users,
  Filter,
  Download,
  Trash2,
  Save,
  Pencil
} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Button } from '../../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  tags?: string[];
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  filters: any;
  contactCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILTER_FIELDS = [
  { value: 'tags', label: 'Tags', operators: ['contains', 'equals'] },
  { value: 'type', label: 'Contact Type', operators: ['equals'] },
  { value: 'source', label: 'Source', operators: ['equals', 'contains'] },
  { value: 'hasDeals', label: 'Has Deals', operators: ['equals'] },
  { value: 'email', label: 'Email', operators: ['contains', 'equals', 'is_empty'] },
  { value: 'phone', label: 'Phone', operators: ['is_empty', 'is_not_empty'] },
  { value: 'createdAfter', label: 'Created After', operators: ['equals'] },
  { value: 'createdBefore', label: 'Created Before', operators: ['equals'] },
];

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  contains: 'contains',
  is_empty: 'is empty',
  is_not_empty: 'is not empty'
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convert the API filters object/array into editable FilterRule[] */
function filtersToRules(filters: any): FilterRule[] {
  if (!filters) return [];
  if (Array.isArray(filters)) {
    return filters.map((f: any) => ({
      field: f.field ?? f.key ?? 'tags',
      operator: f.operator ?? 'equals',
      value: String(f.value ?? '')
    }));
  }
  const rules: FilterRule[] = [];
  if (filters.tags?.length) {
    for (const t of filters.tags) {
      rules.push({ field: 'tags', operator: 'contains', value: t });
    }
  }
  if (filters.type) rules.push({ field: 'type', operator: 'equals', value: filters.type });
  if (filters.source) rules.push({ field: 'source', operator: 'equals', value: filters.source });
  if (filters.hasDeals != null)
    rules.push({ field: 'hasDeals', operator: 'equals', value: String(filters.hasDeals) });
  return rules;
}

/** Convert FilterRule[] back to the API filters payload */
function rulesToFilters(rules: FilterRule[]): Record<string, any> {
  const filters: Record<string, any> = {};
  for (const rule of rules) {
    if (rule.field === 'tags' && rule.value) {
      if (!filters.tags) filters.tags = [];
      filters.tags.push(rule.value);
    } else if (rule.field === 'type' && rule.value) {
      filters.type = rule.value;
    } else if (rule.field === 'source' && rule.value) {
      filters.source = rule.value;
    } else if (rule.field === 'hasDeals') {
      filters.hasDeals = rule.value === 'true';
    }
  }
  return filters;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SegmentDetailPage() {
  const api = useApi();
  const router = useRouter();
  const { segmentId } = useParams<{ segmentId: string }>();

  // Segment data
  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

  // Edit mode
  const [editingRules, setEditingRules] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  // Contacts preview
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactCount, setContactCount] = useState<number>(0);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Actions
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Load segment ---------- */

  const loadSegment = useCallback(async () => {
    setLoading(true);
    const res = await api.get<any>(`/api/crm/segments/${segmentId}`);
    const seg: Segment | null = res.data?.data ?? res.data ?? null;
    if (seg) {
      setSegment(seg);
      setName(seg.name);
      setDescription(seg.description ?? '');
      setRules(filtersToRules(seg.filters));
      setContactCount(seg.contactCount ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentId]);

  useEffect(() => {
    loadSegment();
  }, [loadSegment]);

  /* ---------- Load matching contacts ---------- */

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    const res = await api.get<any>(`/api/crm/contacts?segmentId=${segmentId}&perPage=25`);
    const raw = res.data;
    let list: Contact[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
    else if (raw?.items && Array.isArray(raw.items)) list = raw.items;
    setContacts(list);
    if (raw?.meta?.total != null) setContactCount(raw.meta.total);
    else if (raw?.total != null) setContactCount(raw.total);
    setContactsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentId]);

  useEffect(() => {
    if (!loading && segment) loadContacts();
  }, [loading, segment, loadContacts]);

  /* ---------- Rule helpers ---------- */

  function addRule() {
    setRules((prev) => [...prev, { field: 'tags', operator: 'contains', value: '' }]);
  }

  function updateRule(idx: number, key: keyof FilterRule, value: string) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [key]: value };
        if (key === 'field') {
          const fieldDef = FILTER_FIELDS.find((f) => f.value === value);
          updated.operator = fieldDef?.operators[0] ?? 'equals';
          updated.value = '';
        }
        return updated;
      }),
    );
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  function getFieldDef(fieldValue: string) {
    return FILTER_FIELDS.find((f) => f.value === fieldValue);
  }

  /* ---------- Save ---------- */

  async function handleSave() {
    if (!name.trim()) {
      setError('Segment name is required');
      return;
    }
    setSaving(true);
    setError(null);
    const filters = rulesToFilters(rules);
    const res = await api.patch<any>(`/api/crm/segments/${segmentId}`, {
      name,
      description,
      filters
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingRules(false);
    setEditingInfo(false);
    loadSegment();
  }

  /* ---------- Delete ---------- */

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this segment? This action cannot be undone.'))
      return;
    setDeleting(true);
    await api.del(`/api/crm/segments/${segmentId}`);
    setDeleting(false);
    router.push('/dashboard/crm/segments');
  }

  /* ---------- Export ---------- */

  async function handleExport() {
    const rows = contacts.map((c) => ({
      Name: c.name ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
      Email: c.email ?? '',
      Phone: c.phone ?? '',
      Type: c.type ?? ''
    }));
    const header = Object.keys(rows[0] ?? {}).join(',');
    const csv =
      header +
      '\n' +
      rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment-${segment?.name ?? segmentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- Value input (mirrors create page) ---------- */

  function renderValueInput(rule: FilterRule, idx: number) {
    if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') return null;
    const cls =
      'flex-1 rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200';
    if (rule.field === 'type') {
      return (
        <select value={rule.value} onChange={(e) => updateRule(idx, 'value', e.target.value)} className={cls}>
          <option value="">Select...</option>
          <option value="PERSON">Person</option>
          <option value="COMPANY">Company</option>
        </select>
      );
    }
    if (rule.field === 'hasDeals') {
      return (
        <select value={rule.value} onChange={(e) => updateRule(idx, 'value', e.target.value)} className={cls}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    if (rule.field === 'createdAfter' || rule.field === 'createdBefore') {
      return (
        <input type="date" value={rule.value} onChange={(e) => updateRule(idx, 'value', e.target.value)} className={cls} />
      );
    }
    return (
      <input
        type="text"
        value={rule.value}
        onChange={(e) => updateRule(idx, 'value', e.target.value)}
        placeholder={rule.field === 'tags' ? 'e.g. vip' : 'Value...'}
        className={`${cls} placeholder-muted-foreground`}
      />
    );
  }

  /* ---------- Contact display name ---------- */

  function contactName(c: Contact) {
    if (c.name) return c.name;
    const full = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    return full || c.email || 'Unnamed';
  }

  /* ---------- Filter summary (read-only) ---------- */

  function filterSummary(filters: any) {
    if (!filters) return 'All contacts';
    if (Array.isArray(filters)) {
      return filters.length === 0
        ? 'All contacts'
        : filters.map((f: any) => `${f.field ?? f.key}: ${f.value}`).join(', ');
    }
    const parts: string[] = [];
    if (filters.tags?.length) parts.push(`Tags: ${filters.tags.join(', ')}`);
    if (filters.type) parts.push(`Type: ${filters.type}`);
    if (filters.source) parts.push(`Source: ${filters.source}`);
    if (filters.hasDeals != null) parts.push(`Has Deals: ${filters.hasDeals ? 'Yes' : 'No'}`);
    return parts.length > 0 ? parts.join(' | ') : 'All contacts';
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-purple-500" />
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="space-y-6 p-8">
        <Link
          href="/dashboard/crm/segments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Segments
        </Link>
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Filter className="h-8 w-8 mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Segment not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/crm/segments"
            className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{segment.name}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Created {new Date(segment.createdAt).toLocaleDateString()}
              {segment.updatedAt && ` · Updated ${new Date(segment.updatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={contacts.length === 0} className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            variant="secondary"
            onClick={handleDelete}
            isLoading={deleting}
            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-primary hover:text-primary/80 hover:bg-primary/80/[0.08]"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Match count stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Matching Contacts</p>
              <p className="text-lg font-semibold text-foreground">{contactCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Name & Description (editable) */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Segment Info</h3>
          {!editingInfo ? (
            <button
              onClick={() => setEditingInfo(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors duration-200"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setName(segment.name);
                  setDescription(segment.description ?? '');
                  setEditingInfo(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Cancel
              </button>
              <Button size="sm" onClick={handleSave} isLoading={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          )}
        </div>

        {editingInfo ? (
          <>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                Segment Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What does this segment represent?"
                className="w-full rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Name</p>
              <p className="text-sm text-foreground">{segment.name}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {segment.description || <span className="italic text-muted-foreground">No description</span>}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter Rules */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Filter Rules</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {editingRules
                ? `Contacts must match ${logic === 'AND' ? 'all' : 'any'} of these conditions`
                : filterSummary(segment.filters)}
            </p>
          </div>
          {!editingRules ? (
            <button
              onClick={() => setEditingRules(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors duration-200"
            >
              <Pencil className="h-3 w-3" /> Edit Rules
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Logic toggle */}
              <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => setLogic('AND')}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    logic === 'AND'
                      ? 'bg-primary/80/[0.08] text-primary/80'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => setLogic('OR')}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    logic === 'OR'
                      ? 'bg-primary/80/[0.08] text-primary/80'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  OR
                </button>
              </div>
              <button
                onClick={addRule}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors duration-200"
              >
                <Plus className="h-3 w-3" /> Add Rule
              </button>
            </div>
          )}
        </div>

        {editingRules ? (
          <>
            {rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.04] px-6 py-8 text-center text-xs text-muted-foreground">
                No filter rules — segment will include all contacts.
                <button onClick={addRule} className="block mx-auto mt-2 text-primary hover:text-primary/80 transition-colors duration-200">
                  Add your first rule
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => {
                  const fieldDef = getFieldDef(rule.field);
                  return (
                    <div key={idx} className="relative">
                      {/* Connecting line */}
                      {idx > 0 && (
                        <div className="absolute left-4 -top-1 w-px h-1 bg-primary/20" />
                      )}
                      <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2">
                        {idx > 0 && (
                          <span className="text-[10px] font-semibold text-primary/60 w-8 text-center">
                            {logic}
                          </span>
                        )}
                        {idx === 0 && <span className="w-8" />}
                        <select
                          value={rule.field}
                          onChange={(e) => updateRule(idx, 'field', e.target.value)}
                          className="rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                          {FILTER_FIELDS.map((ff) => (
                            <option key={ff.value} value={ff.value}>
                              {ff.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                          className="rounded-xl border border-white/[0.06] bg-card backdrop-blur-xl px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        >
                          {(fieldDef?.operators ?? ['equals']).map((op) => (
                            <option key={op} value={op}>
                              {OPERATOR_LABELS[op] ?? op}
                            </option>
                          ))}
                        </select>
                        {renderValueInput(rule, idx)}
                        <button
                          onClick={() => removeRule(idx)}
                          className="text-muted-foreground hover:text-primary transition-colors duration-200 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04]">
              <button
                onClick={() => {
                  setRules(filtersToRules(segment.filters));
                  setEditingRules(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Cancel
              </button>
              <Button size="sm" onClick={handleSave} isLoading={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                <Save className="h-3 w-3 mr-1" /> Save Rules
              </Button>
            </div>
          </>
        ) : (
          /* Read-only rule badges */
          <div className="flex flex-wrap gap-2">
            {rules.length === 0 ? (
              <span className="text-xs text-muted-foreground leading-relaxed italic">No filter rules (all contacts)</span>
            ) : (
              rules.map((rule, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-xl bg-primary/80/[0.08] text-primary/80 px-2.5 py-1 text-xs font-medium">
                  {FILTER_FIELDS.find((f) => f.value === rule.field)?.label ?? rule.field}{' '}
                  {OPERATOR_LABELS[rule.operator] ?? rule.operator}{' '}
                  {rule.value && <span className="font-semibold text-primary/80">{rule.value}</span>}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-card backdrop-blur-xl border border-primary/20 rounded-2xl p-4 text-sm text-primary/80">{error}</div>
      )}

      {/* Contact list preview */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Contacts Preview{' '}
            <span className="text-muted-foreground font-normal">
              (showing {contacts.length} of {contactCount})
            </span>
          </h3>
          <Link
            href={`/dashboard/crm/contacts?segmentId=${segmentId}`}
            className="text-xs text-primary hover:text-primary/80 transition-colors duration-200"
          >
            View All
          </Link>
        </div>

        {contactsLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingGlobe size="sm" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-6 w-6 mb-2 opacity-20" />
            <p className="text-xs text-muted-foreground">No contacts match this segment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/crm/contacts/${c.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors duration-200"
                      >
                        {contactName(c)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3">
                      {c.type ? (
                        <span className="inline-flex rounded-xl bg-primary/80/[0.08] text-primary/80 px-2 py-0.5 text-xs font-medium">{c.type}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.length ? (
                          c.tags.map((t) => (
                            <span key={t} className="inline-flex rounded-xl bg-primary/80/[0.08] text-primary/80 px-2 py-0.5 text-xs font-medium">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}