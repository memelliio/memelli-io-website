'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Mail, Phone, MessageSquare, Users, FileText, Search, Send, ArrowUpDown } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardContent } from '../../../../../components/ui/card';
import { StatCard } from '../../../../../components/ui/stat-card';

type CommChannel = 'EMAIL' | 'CALL' | 'SMS' | 'MEETING' | 'NOTE' | 'LINKEDIN' | 'OTHER';

interface Communication {
  id: string;
  channel: CommChannel;
  direction?: string;
  subject?: string | null;
  body?: string | null;
  outcome?: string | null;
  duration?: number | null;
  contactId?: string | null;
  contactName?: string | null;
  dealId?: string | null;
  dealTitle?: string | null;
  occurredAt?: string;
  createdAt: string;
}

interface ContactSuggestion {
  id: string;
  name: string;
  email?: string | null;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  CALL: <Phone className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  MEETING: <Users className="h-3.5 w-3.5" />,
  NOTE: <FileText className="h-3.5 w-3.5" />,
  LINKEDIN: <Users className="h-3.5 w-3.5" />,
  OTHER: <FileText className="h-3.5 w-3.5" />,
};

const CHANNEL_BADGE: Record<string, string> = {
  EMAIL: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  CALL: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  SMS: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  MEETING: 'bg-primary/10 text-primary/80 border border-primary/20',
  NOTE: 'bg-card text-foreground border border-white/[0.04]',
  LINKEDIN: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  OTHER: 'bg-card text-foreground border border-white/[0.04]',
};

const CHANNELS: CommChannel[] = ['EMAIL', 'CALL', 'SMS', 'MEETING', 'NOTE'];

export default function CommunicationsPage() {
  const api = useApi();
  const router = useRouter();
  const [comms, setComms] = useState<Communication[]>([]);
  const [total, setTotal] = useState(0);
  const [channelFilter, setChannelFilter] = useState<CommChannel | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    channel: 'NOTE' as CommChannel,
    contactSearch: '',
    contactId: '',
    contactName: '',
    dealId: '',
    subject: '',
    body: '',
    outcome: '',
    duration: '',
  });
  const [contactSuggestions, setContactSuggestions] = useState<ContactSuggestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      ...(channelFilter ? { channel: channelFilter } : {}),
    });
    const res = await api.get<any>(`/api/crm/communications?${params}`);
    const raw = res.data;
    let items: Communication[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (raw?.data && Array.isArray(raw.data)) items = raw.data;
    else if (raw?.items && Array.isArray(raw.items)) items = raw.items;
    setComms(items);
    setTotal(raw?.total ?? items.length);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounced contact search
  useEffect(() => {
    if (!form.contactSearch.trim() || form.contactId) {
      setContactSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingContacts(true);
      const res = await api.get<any>(
        `/api/contacts?search=${encodeURIComponent(form.contactSearch)}&perPage=5`
      );
      const raw = res.data;
      let items: ContactSuggestion[] = [];
      if (raw?.items) items = raw.items;
      else if (raw?.data) items = raw.data;
      setContactSuggestions(items);
      setIsSearchingContacts(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contactSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    await api.post('/api/crm/communications', {
      channel: form.channel,
      contactId: form.contactId || undefined,
      dealId: form.dealId || undefined,
      subject: form.subject || undefined,
      body: form.body || undefined,
      outcome: form.outcome || undefined,
      duration: form.duration ? parseInt(form.duration) : undefined,
    });
    setIsSaving(false);
    setShowModal(false);
    setForm({ channel: 'NOTE', contactSearch: '', contactId: '', contactName: '', dealId: '', subject: '', body: '', outcome: '', duration: '' });
    load();
  }

  function selectContact(c: ContactSuggestion) {
    setForm((f) => ({ ...f, contactId: c.id, contactName: c.name, contactSearch: c.name }));
    setContactSuggestions([]);
  }

  function formatDuration(seconds?: number | null) {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  // Filter by search
  const filteredComms = searchQuery
    ? comms.filter((c) =>
        (c.subject ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.contactName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.body ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : comms;

  // Stats
  const emailCount = comms.filter((c) => c.channel === 'EMAIL').length;
  const callCount = comms.filter((c) => c.channel === 'CALL').length;
  const smsCount = comms.filter((c) => c.channel === 'SMS').length;

  return (
    <div className="min-h-screen bg-card space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Communications</h1>
          <p className="text-muted-foreground leading-relaxed mt-1">{total} logged across all channels</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/dashboard/crm/communications/compose')} className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200">
            <Send className="h-4 w-4 mr-1.5 text-muted-foreground" /> Compose
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200">
            <Plus className="h-4 w-4 mr-1.5" /> Log Communication
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <StatCard label="Total" value={total} icon={MessageSquare} />
        <StatCard label="Emails" value={emailCount} icon={Mail} />
        <StatCard label="Calls" value={callCount} icon={Phone} />
        <StatCard label="SMS" value={smsCount} icon={MessageSquare} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search communications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-2 pl-9 pr-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setChannelFilter('')}
            className={`rounded-xl px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border transition-all duration-200 ${
              channelFilter === ''
                ? 'bg-primary/80/[0.08] text-primary/80 border-primary/20'
                : 'border-white/[0.04] bg-card hover:bg-white/[0.04] hover:border-white/[0.08]'
            }`}
          >
            All
          </button>
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(channelFilter === ch ? '' : ch)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium border transition-all duration-200 ${
                channelFilter === ch
                  ? CHANNEL_BADGE[ch]
                  : 'border-white/[0.04] bg-card text-muted-foreground hover:bg-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              <span className="text-muted-foreground">{CHANNEL_ICONS[ch]}</span> {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Subject / Preview</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Contact</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.04] border-t-purple-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredComms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                      No communications found.
                    </td>
                  </tr>
                ) : (
                  filteredComms.map((comm) => (
                    <tr key={comm.id} className="hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium ${CHANNEL_BADGE[comm.channel] ?? CHANNEL_BADGE.OTHER}`}>
                          <span className="text-muted-foreground">{CHANNEL_ICONS[comm.channel] ?? CHANNEL_ICONS.OTHER}</span> {comm.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-foreground font-medium truncate">{comm.subject || '(no subject)'}</p>
                        {comm.body && (
                          <p className="text-muted-foreground leading-relaxed text-sm truncate mt-1">{comm.body}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {comm.contactId ? (
                          <a
                            href={`/dashboard/crm/contacts/${comm.contactId}`}
                            className="text-primary hover:text-primary/80 transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {comm.contactName ?? 'View'}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground leading-relaxed whitespace-nowrap">
                        {new Date(comm.occurredAt ?? comm.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={comm.direction === 'inbound' ? 'success' : 'muted'}>
                          {comm.direction ?? 'outbound'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Communication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-xl">
          <div className="w-full max-w-lg bg-card backdrop-blur-2xl border border-white/[0.06] rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Log Communication</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-all duration-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Channel</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] uppercase tracking-wider font-medium transition-all duration-200 ${
                        form.channel === ch ? CHANNEL_BADGE[ch] : 'border-white/[0.04] bg-card text-muted-foreground hover:bg-white/[0.04] hover:border-white/[0.08]'
                      }`}
                    >
                      <span className="text-muted-foreground">{CHANNEL_ICONS[ch]}</span> {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Contact</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.contactSearch}
                    onChange={(e) => setForm((f) => ({ ...f, contactSearch: e.target.value, contactId: '', contactName: '' }))}
                    placeholder="Search contact name..."
                    className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-2 pl-9 pr-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                  {isSearchingContacts && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/[0.04] border-t-purple-400" />
                    </div>
                  )}
                </div>
                {form.contactId && <Badge variant="success" className="mt-2">Selected: {form.contactName}</Badge>}
                {contactSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-card backdrop-blur-2xl border border-white/[0.06] rounded-xl overflow-hidden">
                    {contactSuggestions.map((c) => (
                      <button key={c.id} type="button" onClick={() => selectContact(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-all duration-200">
                        <span className="text-foreground font-medium">{c.name}</span>
                        {c.email && <span className="text-muted-foreground leading-relaxed">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2 text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200" />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Body / Notes</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2 text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none transition-all duration-200" />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Outcome</label>
                <input type="text" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))} placeholder="e.g. Interested, Follow up" className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200" />
              </div>

              {form.channel === 'CALL' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Duration (seconds)</label>
                  <input type="number" min="0" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2 text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1 bg-muted hover:bg-muted border border-white/[0.06] rounded-xl transition-all duration-200" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200" isLoading={isSaving}>Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}