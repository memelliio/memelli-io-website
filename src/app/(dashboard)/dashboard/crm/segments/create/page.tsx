'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Users} from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Button } from '../../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../../components/ui/card';

import { LoadingGlobe } from '@/components/ui/loading-globe';
interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

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

export default function CreateSegmentPage() {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRule() {
    setRules((prev) => [...prev, { field: 'tags', operator: 'contains', value: '' }]);
  }

  function updateRule(idx: number, key: keyof FilterRule, value: string) {
    setRules((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [key]: value };
      // Reset operator when field changes
      if (key === 'field') {
        const fieldDef = FILTER_FIELDS.find((f) => f.value === value);
        updated.operator = fieldDef?.operators[0] ?? 'equals';
        updated.value = '';
      }
      return updated;
    }));
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  function getFieldDef(fieldValue: string) {
    return FILTER_FIELDS.find((f) => f.value === fieldValue);
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewCount(null);
    // Build filters object for the API
    const filters = buildFiltersPayload();
    const res = await api.post<any>('/api/crm/segments/preview', { filters });
    if (res.data?.count != null) {
      setPreviewCount(res.data.count);
    } else {
      // Estimate from contacts endpoint
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.source) params.set('source', filters.source);
      const contactRes = await api.get<any>(`/api/contacts?${params}&perPage=1`);
      setPreviewCount(contactRes.data?.meta?.total ?? contactRes.data?.total ?? 0);
    }
    setPreviewLoading(false);
  }

  function buildFiltersPayload() {
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

  async function handleSave() {
    if (!name.trim()) { setError('Segment name is required'); return; }
    setSaving(true);
    setError(null);
    const filters = buildFiltersPayload();
    const res = await api.post<any>('/api/crm/segments', { name, filters });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    router.push('/dashboard/crm/segments');
  }

  function renderValueInput(rule: FilterRule, idx: number) {
    if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') {
      return null;
    }
    const cls = 'flex-1 rounded-xl border border-white/[0.04] bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200';
    if (rule.field === 'type') {
      return (
        <select
          value={rule.value}
          onChange={(e) => updateRule(idx, 'value', e.target.value)}
          className={cls}
        >
          <option value="">Select...</option>
          <option value="PERSON">Person</option>
          <option value="COMPANY">Company</option>
        </select>
      );
    }
    if (rule.field === 'hasDeals') {
      return (
        <select
          value={rule.value}
          onChange={(e) => updateRule(idx, 'value', e.target.value)}
          className={cls}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    if (rule.field === 'createdAfter' || rule.field === 'createdBefore') {
      return (
        <input
          type="date"
          value={rule.value}
          onChange={(e) => updateRule(idx, 'value', e.target.value)}
          className={cls}
        />
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

  return (
    <div className="bg-card min-h-screen p-8">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/crm/segments')}
            className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create Segment</h1>
            <p className="text-muted-foreground leading-relaxed">Define filter rules to group contacts</p>
          </div>
        </div>

        {/* Name + Description */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Segment Name <span className="text-primary">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Clients, Cold Leads"
              className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this segment represent?"
              className="w-full rounded-xl border border-white/[0.04] bg-card px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl resize-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Filter Rules */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">Filter Rules</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">Contacts must match {logic === 'AND' ? 'all' : 'any'} of these conditions</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Logic toggle */}
              <div className="flex rounded-xl border border-white/[0.04] overflow-hidden">
                <button
                  onClick={() => setLogic('AND')}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    logic === 'AND' ? 'bg-primary/80/[0.08] text-primary/80' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => setLogic('OR')}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    logic === 'OR' ? 'bg-primary/80/[0.08] text-primary/80' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  OR
                </button>
              </div>
              <button
                onClick={addRule}
                className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-all duration-200"
              >
                <Plus className="h-4 w-4" /> Add Rule
              </button>
            </div>
          </div>

          {rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.04] px-6 py-12 text-center text-muted-foreground">
              No filter rules — segment will include all contacts.
              <button onClick={addRule} className="block mx-auto mt-3 text-primary hover:text-primary/80 transition-all duration-200">
                Add your first rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const fieldDef = getFieldDef(rule.field);
                return (
                  <div key={idx} className="relative">
                    {/* Connecting line */}
                    {idx > 0 && (
                      <div className="absolute left-4 -top-1.5 w-px h-3 bg-primary/20" />
                    )}
                    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-muted backdrop-blur-xl px-4 py-3">
                      {idx > 0 && (
                        <span className="text-[10px] font-semibold text-primary/60 w-10 text-center">{logic}</span>
                      )}
                      {idx === 0 && <span className="w-10" />}
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(idx, 'field', e.target.value)}
                        className="rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      >
                        {FILTER_FIELDS.map((ff) => (
                          <option key={ff.value} value={ff.value}>{ff.label}</option>
                        ))}
                      </select>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                        className="rounded-xl border border-white/[0.04] bg-card px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      >
                        {(fieldDef?.operators ?? ['equals']).map((op) => (
                          <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                        ))}
                      </select>
                      {renderValueInput(rule, idx)}
                      <button
                        onClick={() => removeRule(idx)}
                        className="text-muted-foreground hover:text-primary transition-all duration-200 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/[0.04]">
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-muted hover:bg-muted px-4 py-2.5 text-xs text-foreground transition-all duration-200 disabled:opacity-50 backdrop-blur-xl"
            >
              {previewLoading ? <LoadingGlobe size="sm" /> : <Users className="h-4 w-4" />}
              Preview count
            </button>
            {previewCount != null && (
              <span className="text-sm text-muted-foreground">
                ~<span className="font-semibold text-primary">{previewCount}</span> contacts match
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-card backdrop-blur-xl border border-primary/20 rounded-2xl p-4 text-sm text-primary/80">{error}</div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => router.push('/dashboard/crm/segments')}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving} className="bg-primary hover:bg-primary/90 rounded-xl transition-all duration-200">
            Save Segment
          </Button>
        </div>
      </div>
    </div>
  );
}