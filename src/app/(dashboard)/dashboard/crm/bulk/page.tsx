'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckSquare, Square, Tag, X, Download, GitMerge, RefreshCw } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  source?: string | null;
  createdAt: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages?: { id: string; name: string }[];
}

type BulkAction = 'add_tag' | 'remove_tag' | 'change_source' | 'export_csv' | 'add_to_pipeline' | null;

function getName(c: Contact) {
  if (c.type === 'COMPANY') return c.companyName ?? '—';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
}

export default function BulkOperationsPage() {
  const api = useApi();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkAction>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  // Modal state
  const [tagInput, setTagInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [applying, setApplying] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ items?: Contact[]; data?: Contact[] } | Contact[]>('/api/contacts?perPage=100');
    const raw = res.data;
    let list: Contact[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && 'items' in raw && Array.isArray(raw.items)) list = raw.items;
    else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;
    setContacts(list);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (action === 'add_to_pipeline') {
      api.get<{ data?: Pipeline[]; items?: Pipeline[] } | Pipeline[]>('/api/crm/pipelines').then((res) => {
        const raw = res.data;
        let list: Pipeline[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;
        else if (raw && 'items' in raw && Array.isArray(raw.items)) list = raw.items;
        setPipelines(list);
        if (list.length > 0) setPipelineId(list[0].id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(contacts.map((c) => c.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function closeAction() {
    setAction(null);
    setTagInput('');
    setSourceInput('');
    setResultMsg(null);
  }

  async function applyAddTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    setApplying(true);
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) => {
        const contact = contacts.find((c) => c.id === id);
        const tags = contact ? [...new Set([...contact.tags, tag])] : [tag];
        return api.patch(`/api/contacts/${id}`, { tags });
      })
    );
    setApplying(false);
    setResultMsg(`Added tag "${tag}" to ${ids.length} contacts.`);
    load();
  }

  async function applyRemoveTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    setApplying(true);
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) => {
        const contact = contacts.find((c) => c.id === id);
        const tags = contact ? contact.tags.filter((t) => t !== tag) : [];
        return api.patch(`/api/contacts/${id}`, { tags });
      })
    );
    setApplying(false);
    setResultMsg(`Removed tag "${tag}" from ${ids.length} contacts.`);
    load();
  }

  async function applyChangeSource() {
    const source = sourceInput.trim();
    if (!source) return;
    setApplying(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => api.patch(`/api/contacts/${id}`, { source })));
    setApplying(false);
    setResultMsg(`Updated source to "${source}" for ${ids.length} contacts.`);
    load();
  }

  function exportCSV() {
    const rows = contacts.filter((c) => selected.has(c.id));
    const headers = ['ID', 'Name', 'Type', 'Email', 'Phone', 'Tags', 'Source', 'Created'];
    const csv = [
      headers.join(','),
      ...rows.map((c) =>
        [
          c.id,
          `"${getName(c).replace(/"/g, '""')}"`,
          c.type,
          c.email ?? '',
          c.phone ?? '',
          `"${c.tags.join(', ')}"`,
          c.source ?? '',
          new Date(c.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    closeAction();
    setResultMsg(`Exported ${rows.length} contacts to CSV.`);
  }

  async function applyAddToPipeline() {
    if (!pipelineId || !stageId) return;
    setApplying(true);
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        api.post('/api/crm/deals', {
          title: `Deal — ${getName(contacts.find((c) => c.id === id)!)}`,
          pipelineId,
          stageId,
          contactId: id,
        })
      )
    );
    setApplying(false);
    setResultMsg(`Created deals for ${ids.length} contacts in the selected stage.`);
    closeAction();
  }

  const selectedCount = selected.size;

  return (
    <div className="space-y-6 p-8 bg-card min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bulk Operations</h1>
          <p className="text-muted-foreground leading-relaxed">Select contacts and apply batch actions</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading} className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-4 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl px-6 py-4">
          <span className="text-sm font-medium text-primary/80 mr-2">{selectedCount} selected</span>
          <button
            onClick={() => setAction('add_tag')}
            className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
          >
            <Tag className="h-4 w-4 text-muted-foreground" /> Add Tag
          </button>
          <button
            onClick={() => setAction('remove_tag')}
            className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
          >
            <X className="h-4 w-4 text-muted-foreground" /> Remove Tag
          </button>
          <button
            onClick={() => setAction('change_source')}
            className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" /> Change Source
          </button>
          <button
            onClick={() => { setAction('export_csv'); exportCSV(); }}
            className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
          >
            <Download className="h-4 w-4 text-muted-foreground" /> Export CSV
          </button>
          <button
            onClick={() => setAction('add_to_pipeline')}
            className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
          >
            <GitMerge className="h-4 w-4 text-muted-foreground" /> Add to Pipeline
          </button>
          <button onClick={deselectAll} className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Deselect all
          </button>
        </div>
      )}

      {resultMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl px-6 py-4 text-sm text-emerald-300">
          {resultMsg}
          <button onClick={() => setResultMsg(null)} className="text-muted-foreground hover:text-foreground transition-colors duration-200"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-purple-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-6 py-4 w-12">
                    <button
                      onClick={selected.size === contacts.length ? deselectAll : selectAll}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {selected.size === contacts.length && contacts.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Source</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tags</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">No contacts found.</td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => toggleSelect(c.id)}
                      className={`cursor-pointer transition-all duration-200 ${
                        selected.has(c.id) ? 'bg-primary/80/[0.08]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {selected.has(c.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{getName(c)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.email ?? '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.source ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {c.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex rounded-lg bg-primary/10 text-primary/80 px-2 py-1 text-xs font-medium">{tag}</span>
                          ))}
                          {c.tags.length > 3 && (
                            <span className="inline-flex rounded-lg bg-primary/10 text-primary/80 px-2 py-1 text-xs font-medium">+{c.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {(action === 'add_tag' || action === 'remove_tag') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {action === 'add_tag' ? 'Add Tag' : 'Remove Tag'} — {selectedCount} contacts
              </h2>
              <button onClick={closeAction} className="text-muted-foreground hover:text-foreground transition-colors duration-200"><X className="h-5 w-5" /></button>
            </div>
            {resultMsg ? (
              <div>
                <p className="text-sm text-emerald-300 mb-4">{resultMsg}</p>
                <Button onClick={closeAction} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">Done</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Tag</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g. vip"
                    className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1 bg-muted hover:bg-muted border border-white/[0.06] rounded-xl" onClick={closeAction}>Cancel</Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl"
                    isLoading={applying}
                    onClick={action === 'add_tag' ? applyAddTag : applyRemoveTag}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {action === 'change_source' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Change Source — {selectedCount} contacts</h2>
              <button onClick={closeAction} className="text-muted-foreground hover:text-foreground transition-colors duration-200"><X className="h-5 w-5" /></button>
            </div>
            {resultMsg ? (
              <div>
                <p className="text-sm text-emerald-300 mb-4">{resultMsg}</p>
                <Button onClick={closeAction} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">Done</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">New Source</label>
                  <input
                    type="text"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="e.g. Referral"
                    className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1 bg-muted hover:bg-muted border border-white/[0.06] rounded-xl" onClick={closeAction}>Cancel</Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" isLoading={applying} onClick={applyChangeSource}>Apply</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {action === 'add_to_pipeline' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Add to Pipeline — {selectedCount} contacts</h2>
              <button onClick={closeAction} className="text-muted-foreground hover:text-foreground transition-colors duration-200"><X className="h-5 w-5" /></button>
            </div>
            {resultMsg ? (
              <div>
                <p className="text-sm text-emerald-300 mb-4">{resultMsg}</p>
                <Button onClick={closeAction} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">Done</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Pipeline</label>
                  <select
                    value={pipelineId}
                    onChange={(e) => { setPipelineId(e.target.value); setStageId(''); }}
                    className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                  >
                    {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {selectedPipeline?.stages && selectedPipeline.stages.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Stage</label>
                    <select
                      value={stageId}
                      onChange={(e) => setStageId(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.06] bg-muted px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                    >
                      <option value="">Select stage...</option>
                      {selectedPipeline.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1 bg-muted hover:bg-muted border border-white/[0.06] rounded-xl" onClick={closeAction}>Cancel</Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" isLoading={applying} onClick={applyAddToPipeline} disabled={!stageId}>
                    Create Deals
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}