'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MessageSquare, Phone, Mail, Users, FileText, Calendar, X } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

type CommType = 'EMAIL' | 'CALL' | 'SMS' | 'MEETING' | 'NOTE';

interface ContactDetail {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags: string[];
  source?: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
}

interface TimelineItem {
  id: string;
  type: string;
  subtype?: string;
  subject?: string;
  body?: string;
  outcome?: string;
  dealTitle?: string;
  dealId?: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage?: string;
  status: string;
  pipeline?: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

const COMM_ICONS: Record<CommType, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  CALL: <Phone className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  MEETING: <Users className="h-3.5 w-3.5" />,
  NOTE: <FileText className="h-3.5 w-3.5" />,
};

const COMM_COLORS: Record<CommType, string> = {
  EMAIL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CALL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SMS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEETING: 'bg-primary/10 text-primary border-primary/20',
  NOTE: 'bg-white/[0.04] text-muted-foreground border-white/[0.04]',
};

export default function CRMContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const router = useRouter();
  const api = useApi();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Comm modal
  const [showCommModal, setShowCommModal] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'NOTE' as CommType,
    subject: '',
    body: '',
  });
  const [isSavingComm, setIsSavingComm] = useState(false);

  // Deal modal
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: '',
    pipelineId: '',
    stageId: '',
    value: '',
  });
  const [isSavingDeal, setIsSavingDeal] = useState(false);

  const load = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    const [cRes, tlRes, dRes, pRes] = await Promise.all([
      api.get<ContactDetail>(`/api/contacts/${contactId}`),
      api.get<{ items: TimelineItem[] }>(`/api/crm/contacts/${contactId}/timeline`),
      api.get<{ items: Deal[] }>(`/api/crm/contacts/${contactId}/deals`),
      api.get<{ items: Pipeline[] }>('/api/crm/pipelines'),
    ]);
    setContact(cRes.data);
    setTimeline(tlRes.data?.items ?? []);
    setDeals(dRes.data?.items ?? []);
    setPipelines(pRes.data?.items ?? []);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  useEffect(() => { load(); }, [load]);

  function getName(c: ContactDetail) {
    if (c.type === 'COMPANY') return c.companyName ?? '—';
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
  }

  async function handleLogComm(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingComm(true);
    await api.post(`/api/crm/contacts/${contactId}/notes`, {
      type: commForm.type,
      subject: commForm.subject,
      body: commForm.body,
    });
    setIsSavingComm(false);
    setShowCommModal(false);
    setCommForm({ type: 'NOTE', subject: '', body: '' });
    load();
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingDeal(true);
    await api.post('/api/crm/deals', {
      title: dealForm.title,
      pipelineId: dealForm.pipelineId || undefined,
      stageId: dealForm.stageId || undefined,
      value: dealForm.value ? parseFloat(dealForm.value) : undefined,
      contactId,
    });
    setIsSavingDeal(false);
    setShowDealModal(false);
    setDealForm({ title: '', pipelineId: '', stageId: '', value: '' });
    load();
  }

  async function handleQuickNote(e: React.FormEvent) {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setIsSavingNote(true);
    await api.post(`/api/crm/contacts/${contactId}/notes`, { type: 'NOTE', body: quickNote });
    setIsSavingNote(false);
    setQuickNote('');
    load();
  }

  async function handleRemoveTag(tag: string) {
    if (!contact) return;
    const newTags = contact.tags.filter((t) => t !== tag);
    const res = await api.patch<ContactDetail>(`/api/contacts/${contactId}`, { tags: newTags });
    if (res.data) setContact(res.data);
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!contact || !tagInput.trim()) return;
    const newTags = [...contact.tags, tagInput.trim()];
    const res = await api.patch<ContactDetail>(`/api/contacts/${contactId}`, { tags: newTags });
    if (res.data) setContact(res.data);
    setTagInput('');
    setEditingTags(false);
  }

  const selectedPipeline = pipelines.find((p) => p.id === dealForm.pipelineId);

  if (isLoading) {
    return (
      <div className="bg-card min-h-screen">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.08] border-t-purple-500" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="bg-card min-h-screen">
        <div className="text-center text-muted-foreground py-20">Contact not found.</div>
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-6">
          <button
            onClick={() => router.back()}
            className="mt-2 text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/80/[0.08] backdrop-blur-xl border border-primary/20 text-primary font-bold text-sm">
                {getName(contact).charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{getName(contact)}</h1>
              <Badge variant={contact.type === 'PERSON' ? 'primary' : 'muted'} className="capitalize rounded-xl bg-muted text-foreground border-white/[0.06]">
                {contact.type.toLowerCase()}
              </Badge>
            </div>
            {contact.type === 'PERSON' && contact.companyName && (
              <p className="text-muted-foreground leading-relaxed mt-2 ml-16">{contact.companyName}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 ml-16">
              {contact.email && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {contact.phone}
                </span>
              )}
            </div>
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-3 mt-4 ml-16">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-1.5 text-xs text-foreground"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {editingTags ? (
                <form onSubmit={handleAddTag} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="New tag"
                    className="w-28 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-1.5 text-xs text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                  <button type="submit" className="text-xs text-primary hover:text-primary/80 transition-all duration-200">Add</button>
                  <button type="button" onClick={() => setEditingTags(false)} className="text-xs text-muted-foreground hover:text-foreground transition-all duration-200">Cancel</button>
                </form>
              ) : (
                <button
                  onClick={() => setEditingTags(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  <Plus className="h-3 w-3" /> tag
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => setShowCommModal(true)} className="rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground">
              <MessageSquare className="h-4 w-4 mr-2" /> Log Comm
            </Button>
            <Button size="sm" onClick={() => setShowDealModal(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Deal
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-primary transition-all duration-200">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:text-primary transition-all duration-200">{contact.phone}</a>
                  </div>
                )}
                {contact.source && (
                  <div className="text-muted-foreground leading-relaxed">
                    <span className="text-muted-foreground">Source: </span>{contact.source}
                  </div>
                )}
                <div className="text-muted-foreground leading-relaxed">
                  <span className="text-muted-foreground">Added: </span>
                  {new Date(contact.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Deals */}
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center justify-between">
                  Deals
                  <span className="text-primary font-bold text-base">{deals.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {deals.length === 0 ? (
                  <div className="px-6 pb-6 text-muted-foreground text-center leading-relaxed">No deals yet.</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {deals.map((d) => (
                      <div key={d.id} className="px-6 py-4 hover:bg-white/[0.04] transition-all duration-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{d.pipeline} {d.stage ? `— ${d.stage}` : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {d.value != null && (
                              <p className="text-sm font-semibold text-primary">${d.value.toLocaleString()}</p>
                            )}
                            <Badge
                              variant={d.status === 'WON' ? 'success' : d.status === 'LOST' ? 'destructive' : 'muted'}
                              className="mt-1 capitalize text-xs rounded-xl"
                            >
                              {d.status.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — Timeline */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {timeline.length === 0 ? (
                  <div className="px-6 pb-6 text-center text-muted-foreground leading-relaxed">No activity yet.</div>
                ) : (
                  <div className="relative ml-8">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/20" />
                    <div className="divide-y divide-white/[0.04]">
                      {timeline.map((item) => {
                        const commType = (item.subtype || item.type) as CommType;
                        const colorClass = COMM_COLORS[commType] ?? COMM_COLORS.NOTE;
                        const icon = COMM_ICONS[commType] ?? <Calendar className="h-3.5 w-3.5" />;
                        return (
                          <div key={item.id} className="flex gap-4 pl-6 pr-6 py-4">
                            <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border ${colorClass}`}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              {item.subject && (
                                <p className="text-sm font-medium text-foreground truncate">{item.subject}</p>
                              )}
                              {item.body && (
                                <p className="text-muted-foreground leading-relaxed mt-1 line-clamp-2">{item.body}</p>
                              )}
                              {item.dealTitle && (
                                <p className="text-xs text-primary/80 mt-1">Deal: {item.dealTitle}</p>
                              )}
                              {item.outcome && (
                                <p className="text-xs text-muted-foreground mt-1">Outcome: {item.outcome}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground mt-1">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Note */}
            <form onSubmit={handleQuickNote} className="space-y-3">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Add a quick note..."
                rows={3}
                className="w-full rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={isSavingNote} disabled={!quickNote.trim()} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
                  Save Note
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Log Communication Modal */}
        {showCommModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl shadow-black/40">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Log Communication</h2>
                <button onClick={() => setShowCommModal(false)} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleLogComm} className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'] as CommType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCommForm((f) => ({ ...f, type: t }))}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          commForm.type === t
                            ? COMM_COLORS[t]
                            : 'border-white/[0.04] bg-muted text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.04]'
                        }`}
                      >
                        {COMM_ICONS[t]} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    value={commForm.subject}
                    onChange={(e) => setCommForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Body / Notes</label>
                  <textarea
                    value={commForm.body}
                    onChange={(e) => setCommForm((f) => ({ ...f, body: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground" onClick={() => setShowCommModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white" isLoading={isSavingComm}>
                    Log
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Deal Modal */}
        {showDealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-card backdrop-blur-2xl p-6 shadow-2xl shadow-black/40">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">New Deal</h2>
                <button onClick={() => setShowDealModal(false)} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddDeal} className="space-y-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Title <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    value={dealForm.title}
                    onChange={(e) => setDealForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Pipeline</label>
                  <select
                    value={dealForm.pipelineId}
                    onChange={(e) => setDealForm((f) => ({ ...f, pipelineId: e.target.value, stageId: '' }))}
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  >
                    <option value="">Select pipeline...</option>
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {selectedPipeline && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Stage</label>
                    <select
                      value={dealForm.stageId}
                      onChange={(e) => setDealForm((f) => ({ ...f, stageId: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    >
                      <option value="">Select stage...</option>
                      {selectedPipeline.stages.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dealForm.value}
                    onChange={(e) => setDealForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/[0.04] bg-muted backdrop-blur-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 rounded-xl bg-muted border border-white/[0.06] hover:bg-muted text-foreground" onClick={() => setShowDealModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white" isLoading={isSavingDeal}>
                    Create Deal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}