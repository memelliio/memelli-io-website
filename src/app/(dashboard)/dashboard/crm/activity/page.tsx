'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Mail, Phone, Users, FileText, Plus, Search, X, Activity, Filter } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import Link from 'next/link';

type ActivityType = 'NOTE' | 'EMAIL' | 'CALL' | 'SMS' | 'MEETING';

interface ActivityItem {
  id: string;
  type: string;
  subject?: string | null;
  body?: string | null;
  createdAt: string;
  contactId?: string | null;
  contact?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    companyName?: string | null;
  } | null;
}

interface Contact {
  id: string;
  type: 'PERSON' | 'COMPANY';
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
}

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'CALL', label: 'Calls' },
  { value: 'SMS', label: 'SMS' },
  { value: 'MEETING', label: 'Meetings' },
];

const TYPE_ICON: Record<string, typeof Activity> = {
  NOTE: FileText,
  EMAIL: Mail,
  CALL: Phone,
  SMS: MessageSquare,
  MEETING: Users,
};

const TYPE_COLOR: Record<string, string> = {
  NOTE: 'bg-muted text-foreground',
  EMAIL: 'bg-blue-500/10 text-blue-300',
  CALL: 'bg-emerald-500/10 text-emerald-300',
  SMS: 'bg-primary/10 text-primary/80',
  MEETING: 'bg-primary/10 text-primary/80',
};

const TYPE_DOT: Record<string, string> = {
  NOTE: 'bg-muted',
  EMAIL: 'bg-blue-400',
  CALL: 'bg-emerald-400',
  SMS: 'bg-primary/70',
  MEETING: 'bg-primary/70',
};

function getContactName(contact: ActivityItem['contact']) {
  if (!contact) return null;
  if (contact.companyName) return contact.companyName;
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || null;
}

function getSelectContactName(c: Contact) {
  if (c.type === 'COMPANY') return c.companyName ?? '—';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '—';
}

interface LogForm {
  type: ActivityType;
  contactId: string;
  subject: string;
  body: string;
}

const EMPTY_LOG: LogForm = { type: 'NOTE', contactId: '', subject: '', body: '' };

export default function CRMActivityPage() {
  const api = useApi();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [contactSearch, setContactSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [logForm, setLogForm] = useState<LogForm>(EMPTY_LOG);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactQuery, setContactQuery] = useState('');
  const [showContactDrop, setShowContactDrop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: '25' });
    if (typeFilter !== 'ALL') params.set('type', typeFilter);
    const res = await api.get<{ items?: ActivityItem[]; data?: ActivityItem[] } | ActivityItem[]>(
      `/api/activities?${params}`
    );
    const raw = res.data;
    let list: ActivityItem[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && 'items' in raw && Array.isArray(raw.items)) list = raw.items;
    else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;
    setActivities(list);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<{ items?: Contact[]; data?: Contact[] } | Contact[]>('/api/contacts?perPage=100').then((res) => {
      const raw = res.data;
      let list: Contact[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && 'items' in raw && Array.isArray(raw.items)) list = raw.items;
      else if (raw && 'data' in raw && Array.isArray(raw.data)) list = raw.data;
      setContacts(list);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (contactSearch) {
      const name = getContactName(a.contact) ?? '';
      if (!name.toLowerCase().includes(contactSearch.toLowerCase())) return false;
    }
    if (dateFrom && new Date(a.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const filteredContactsForModal = contacts
    .filter((c) => {
      const name = getSelectContactName(c).toLowerCase();
      return name.includes(contactQuery.toLowerCase()) || (c.email ?? '').toLowerCase().includes(contactQuery.toLowerCase());
    })
    .slice(0, 8);

  const selectedModalContact = contacts.find((c) => c.id === logForm.contactId);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      type: logForm.type,
      subject: logForm.subject || undefined,
      body: logForm.body || undefined,
    };
    if (logForm.contactId) payload.contactId = logForm.contactId;
    const res = await api.post('/api/activities', payload);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setShowModal(false);
    setLogForm(EMPTY_LOG);
    load();
  }

  function openModal() {
    setLogForm(EMPTY_LOG);
    setContactQuery('');
    setError(null);
    setShowModal(true);
  }

  const hasFilters = contactSearch || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-card">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity Feed</h1>
            <p className="text-muted-foreground leading-relaxed mt-1">CRM interactions timeline</p>
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 border-b border-white/[0.04] overflow-x-auto">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                typeFilter === f.value
                  ? 'border-b-2 border-primary text-primary/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Filter by contact..."
              className="w-64 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <span className="text-xs font-medium text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => { setContactSearch(''); setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl transition-all duration-200"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.04] border-t-purple-500" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground leading-relaxed">No activities found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative ml-6">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-primary/20" />
            <div className="space-y-6">
              {filteredActivities.map((a) => {
                const Icon = TYPE_ICON[a.type] ?? Activity;
                const dot = TYPE_DOT[a.type] ?? 'bg-muted';
                const contactName = getContactName(a.contact);
                return (
                  <div key={a.id} className="relative flex items-start gap-6">
                    {/* Dot */}
                    <div className={`relative z-10 mt-2 h-3 w-3 shrink-0 rounded-full ring-4 ring-zinc-950 ${dot} shadow-lg shadow-current/20`} />
                    {/* Card */}
                    <div className="flex-1 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 hover:border-white/[0.08] hover:bg-card transition-all duration-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${TYPE_COLOR[a.type] ?? 'bg-white/[0.04] text-foreground'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {a.subject ?? a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium tracking-wider text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' '}
                          {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {a.body && (
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{a.body}</p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Badge variant="muted" className="bg-muted border-white/[0.06] text-foreground text-[11px] uppercase tracking-wider font-medium">
                          {a.type.toLowerCase()}
                        </Badge>
                        {contactName && a.contact?.id && (
                          <Link
                            href={`/dashboard/crm/contacts/${a.contact.id}`}
                            className="text-xs text-primary hover:text-primary/80 hover:underline transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contactName}
                          </Link>
                        )}
                        {contactName && !a.contact?.id && (
                          <span className="text-xs text-muted-foreground">{contactName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Log Activity button */}
        <button
          onClick={openModal}
          className="fixed bottom-8 right-8 z-30 flex items-center gap-2.5 rounded-2xl bg-primary hover:bg-primary/90 px-6 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-purple-900/30 backdrop-blur-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Log Activity
        </button>

        {/* Log Activity Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-md">
            <div className="w-full max-w-lg bg-card backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/40 mx-4">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Log Activity</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleLog} className="space-y-6">
                {/* Type */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Activity Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(['NOTE', 'EMAIL', 'CALL', 'SMS', 'MEETING'] as ActivityType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLogForm((f) => ({ ...f, type: t }))}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          logForm.type === t
                            ? 'border-primary/50 bg-primary/10 text-primary/80 shadow-sm shadow-purple-900/10'
                            : 'border-white/[0.06] bg-muted text-muted-foreground hover:border-white/[0.08] hover:text-foreground'
                        }`}
                      >
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="relative">
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Contact (optional)</label>
                  {selectedModalContact ? (
                    <div className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl px-4 py-3">
                      <span className="text-sm text-foreground">{getSelectContactName(selectedModalContact)}</span>
                      <button type="button" onClick={() => setLogForm((f) => ({ ...f, contactId: '' }))} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={contactQuery}
                          onChange={(e) => setContactQuery(e.target.value)}
                          onFocus={() => setShowContactDrop(true)}
                          placeholder="Search contacts..."
                          className="w-full bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl py-3 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                      </div>
                      {showContactDrop && filteredContactsForModal.length > 0 && (
                        <div className="absolute z-20 w-full mt-2 bg-card backdrop-blur-2xl border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 max-h-48 overflow-y-auto">
                          {filteredContactsForModal.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setLogForm((f) => ({ ...f, contactId: c.id }));
                                setContactQuery('');
                                setShowContactDrop(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-white/[0.04] transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                            >
                              {getSelectContactName(c)}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Title / Subject</label>
                  <input
                    type="text"
                    value={logForm.subject}
                    onChange={(e) => setLogForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Follow-up call"
                    className="w-full bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Notes / Body</label>
                  <textarea
                    value={logForm.body}
                    onChange={(e) => setLogForm((f) => ({ ...f, body: e.target.value }))}
                    rows={4}
                    placeholder="Details..."
                    className="w-full bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
                  />
                </div>

                {error && <p className="text-sm text-primary">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 bg-muted hover:bg-muted border border-white/[0.06] rounded-xl" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" isLoading={saving}>
                    Log Activity
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