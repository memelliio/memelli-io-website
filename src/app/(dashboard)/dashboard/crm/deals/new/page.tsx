'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, DollarSign } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';

interface Pipeline {
  id: string;
  name: string;
  stages?: Stage[];
}

interface Stage {
  id: string;
  name: string;
  order?: number;
}

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
}

interface NewDealForm {
  title: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  value: string;
  currency: string;
  expectedAt: string;
  notes: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN'];

function getContactName(c: Contact) {
  if (c.type === 'COMPANY') return c.companyName ?? '\u2014';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '\u2014';
}

export default function NewDealPage() {
  const api = useApi();
  const router = useRouter();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<NewDealForm>({
    title: '',
    pipelineId: '',
    stageId: '',
    contactId: '',
    value: '',
    currency: 'USD',
    expectedAt: '',
    notes: '',
  });

  const selectedContact = contacts.find((c) => c.id === form.contactId);

  useEffect(() => {
    async function loadData() {
      const [plRes, ctRes] = await Promise.all([
        api.get<{ data?: Pipeline[]; items?: Pipeline[] } | Pipeline[]>('/api/crm/pipelines'),
        api.get<{ items?: Contact[]; data?: Contact[] } | Contact[]>('/api/contacts?perPage=100'),
      ]);

      const plRaw = plRes.data;
      let plList: Pipeline[] = [];
      if (Array.isArray(plRaw)) plList = plRaw;
      else if (plRaw && 'data' in plRaw && Array.isArray(plRaw.data)) plList = plRaw.data;
      else if (plRaw && 'items' in plRaw && Array.isArray(plRaw.items)) plList = plRaw.items;
      setPipelines(plList);
      if (plList.length > 0) {
        const first = plList[0];
        const stageList = first.stages ?? [];
        setStages(stageList);
        setForm((f) => ({
          ...f,
          pipelineId: first.id,
          stageId: stageList.length > 0 ? stageList[0].id : '',
        }));
      }
      setLoadingPipelines(false);

      const ctRaw = ctRes.data;
      let ctList: Contact[] = [];
      if (Array.isArray(ctRaw)) ctList = ctRaw;
      else if (ctRaw && 'items' in ctRaw && Array.isArray(ctRaw.items)) ctList = ctRaw.items;
      else if (ctRaw && 'data' in ctRaw && Array.isArray(ctRaw.data)) ctList = ctRaw.data;
      setContacts(ctList);
      setFilteredContacts(ctList.slice(0, 10));
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePipelineChange = useCallback(
    async (pipelineId: string) => {
      setForm((f) => ({ ...f, pipelineId, stageId: '' }));
      // Try to load stages for this pipeline
      const res = await api.get<{ stages?: Stage[]; data?: { stages?: Stage[] } }>(`/api/crm/pipelines/${pipelineId}`);
      const st = res.data?.stages ?? (res.data as any)?.data?.stages ?? [];
      setStages(st);
      if (st.length > 0) setForm((f) => ({ ...f, stageId: st[0].id }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const q = contactSearch.toLowerCase();
    if (!q) {
      setFilteredContacts(contacts.slice(0, 10));
    } else {
      setFilteredContacts(
        contacts
          .filter((c) => getContactName(c).toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q))
          .slice(0, 10)
      );
    }
  }, [contactSearch, contacts]);

  function setField<K extends keyof NewDealForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.pipelineId || !form.stageId) return;
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      title: form.title,
      pipelineId: form.pipelineId,
      stageId: form.stageId,
      currency: form.currency,
    };
    if (form.contactId) payload.contactId = form.contactId;
    if (form.value) payload.value = parseFloat(form.value);
    if (form.expectedAt) payload.expectedAt = form.expectedAt;
    if (form.notes) payload.notes = form.notes;

    const res = await api.post<{ id: string }>('/api/crm/deals', payload);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    if (res.data?.id) {
      router.push(`/dashboard/crm/deals/${res.data.id}`);
    } else {
      router.push('/dashboard/crm/deals');
    }
  }

  return (
    <div className="bg-card min-h-screen">
      <div className="space-y-6 max-w-2xl p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Deal</h1>
          <p className="text-muted-foreground leading-relaxed">Create a new deal and add it to your pipeline</p>
        </div>

        {error && (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4 text-sm text-primary/80">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="tracking-tight font-semibold text-foreground">Deal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Title */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Deal Title <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  required
                  placeholder="e.g. Enterprise License — Acme Corp"
                  className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {/* Pipeline & Stage */}
              {loadingPipelines ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 animate-spin rounded-full border border-border border-t-purple-500" />
                  Loading pipelines...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      Pipeline <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.pipelineId}
                        onChange={(e) => handlePipelineChange(e.target.value)}
                        required
                        className="w-full appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl pl-4 pr-10 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      >
                        <option value="">Select pipeline...</option>
                        {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      Stage <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.stageId}
                        onChange={(e) => setField('stageId', e.target.value)}
                        required
                        disabled={stages.length === 0}
                        className="w-full appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl pl-4 pr-10 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
                      >
                        <option value="">Select stage...</option>
                        {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact (searchable) */}
              <div className="relative">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Contact (optional)</label>
                {selectedContact ? (
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3">
                    <span className="text-sm text-foreground">{getContactName(selectedContact)}</span>
                    <button
                      type="button"
                      onClick={() => { setField('contactId', ''); setContactSearch(''); }}
                      className="text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      &#x2715;
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        onFocus={() => setShowContactDropdown(true)}
                        placeholder="Search contacts..."
                        className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      />
                    </div>
                    {showContactDropdown && filteredContacts.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 rounded-xl border border-white/[0.06] bg-card backdrop-blur-2xl shadow-2xl shadow-black/40 max-h-52 overflow-y-auto">
                        {filteredContacts.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setField('contactId', c.id);
                              setContactSearch('');
                              setShowContactDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-white/[0.04] flex items-center justify-between transition-all duration-200"
                          >
                            <span>{getContactName(c)}</span>
                            {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Value & Currency */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Deal Value</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.value}
                      onChange={(e) => setField('value', e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Currency</label>
                  <div className="relative">
                    <select
                      value={form.currency}
                      onChange={(e) => setField('currency', e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl pl-4 pr-10 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Expected Close Date */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Expected Close Date</label>
                <input
                  type="date"
                  value={form.expectedAt}
                  onChange={(e) => setField('expectedAt', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={4}
                  placeholder="Any additional context about this deal..."
                  className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving} className="bg-primary hover:bg-primary/90 rounded-xl">
                  Create Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}