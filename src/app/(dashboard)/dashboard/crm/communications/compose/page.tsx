'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, MessageSquare, Search, ArrowLeft, Send } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';
import { Card, CardContent } from '../../../../../../components/ui/card';

type ComposeType = 'EMAIL' | 'SMS';

interface ContactSuggestion {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  type: string;
}

const TEMPLATES: Record<ComposeType, Array<{ label: string; subject: string; body: string }>> = {
  EMAIL: [
    { label: 'None', subject: '', body: '' },
    { label: 'Introduction', subject: 'Introduction from Memelli', body: 'Hi {{name}},\n\nI wanted to introduce myself and share how we can help with your credit repair goals.\n\nLooking forward to connecting.\n\nBest regards' },
    { label: 'Follow Up', subject: 'Following up on our conversation', body: 'Hi {{name}},\n\nI wanted to follow up on our recent conversation. Do you have any questions or would you like to proceed?\n\nBest regards' },
    { label: 'Deal Update', subject: 'Update on your application', body: 'Hi {{name}},\n\nI wanted to provide you with an update on your application status.\n\n[Details here]\n\nPlease let me know if you have any questions.' },
    { label: 'Thank You', subject: 'Thank you!', body: 'Hi {{name}},\n\nThank you for choosing Memelli. We appreciate your trust in us.\n\nIf there is anything else we can help with, please do not hesitate to reach out.\n\nBest regards' },
  ],
  SMS: [
    { label: 'None', subject: '', body: '' },
    { label: 'Quick Check-in', subject: '', body: 'Hi {{name}}, just checking in. How are things going? Let me know if you need anything.' },
    { label: 'Appointment Reminder', subject: '', body: 'Hi {{name}}, this is a reminder about your upcoming appointment. Please confirm your availability.' },
    { label: 'Application Update', subject: '', body: 'Hi {{name}}, your application has been updated. Please check your email for details or reply with any questions.' },
  ],
};

export default function ComposePage() {
  const api = useApi();
  const router = useRouter();
  const [type, setType] = useState<ComposeType>('EMAIL');
  const [contactSearch, setContactSearch] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState<ContactSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Debounced contact search
  useEffect(() => {
    if (!contactSearch.trim() || contactId) {
      setContactSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await api.get<any>(`/api/contacts?search=${encodeURIComponent(contactSearch)}&perPage=8`);
      const raw = res.data;
      let items: ContactSuggestion[] = [];
      if (raw?.items) items = raw.items;
      else if (raw?.data && Array.isArray(raw.data)) items = raw.data;
      setContactSuggestions(items);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactSearch]);

  function getContactDisplayName(c: ContactSuggestion) {
    if (c.type === 'COMPANY') return c.companyName ?? '';
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || '';
  }

  function selectContact(c: ContactSuggestion) {
    const name = getContactDisplayName(c);
    setContactId(c.id);
    setContactName(name);
    setContactSearch(name);
    setContactSuggestions([]);
  }

  function applyTemplate(idx: number) {
    setSelectedTemplate(idx);
    const tmpl = TEMPLATES[type][idx];
    if (tmpl) {
      setSubject(tmpl.subject.replace('{{name}}', contactName || 'there'));
      setBody(tmpl.body.replace(/\{\{name\}\}/g, contactName || 'there'));
    }
  }

  async function handleSend() {
    if (!contactId) return;
    setIsSending(true);
    await api.post('/api/crm/communications', {
      channel: type,
      contactId,
      subject: subject || undefined,
      body: body || undefined,
      direction: 'outbound',
    });
    setIsSending(false);
    setSent(true);
    setTimeout(() => {
      router.push('/dashboard/crm/communications');
    }, 1500);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card">
        <div className="rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 p-6 mb-6">
          <Send className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Message Sent</h2>
        <p className="text-muted-foreground leading-relaxed">Redirecting to communications...</p>
      </div>
    );
  }

  return (
    <div className="bg-card space-y-8 max-w-2xl p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/crm/communications')}
          className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compose Message</h1>
          <p className="text-muted-foreground leading-relaxed mt-1">Send an email or SMS to a contact</p>
        </div>
      </div>

      {/* Type Selector */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Message Type</label>
        <div className="flex gap-3">
          <button
            onClick={() => { setType('EMAIL'); setSelectedTemplate(0); }}
            className={`flex items-center gap-3 rounded-xl border px-6 py-4 text-sm font-medium transition-all duration-200 ${
              type === 'EMAIL'
                ? 'border-primary/30 bg-primary/80/[0.08] text-primary/80'
                : 'border-white/[0.04] bg-muted text-muted-foreground hover:bg-muted hover:border-white/[0.08]'
            }`}
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            onClick={() => { setType('SMS'); setSelectedTemplate(0); }}
            className={`flex items-center gap-3 rounded-xl border px-6 py-4 text-sm font-medium transition-all duration-200 ${
              type === 'SMS'
                ? 'border-primary/30 bg-primary/80/[0.08] text-primary/80'
                : 'border-white/[0.04] bg-muted text-muted-foreground hover:bg-muted hover:border-white/[0.08]'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> SMS
          </button>
        </div>
      </div>

      {/* To: Contact Search */}
      <div className="relative">
        <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">To <span className="text-primary">*</span></label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => { setContactSearch(e.target.value); setContactId(''); setContactName(''); }}
            placeholder="Search for a contact..."
            className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl py-3 pl-10 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/[0.1] border-t-purple-400" />
            </div>
          )}
        </div>
        {contactId && (
          <div className="mt-3 flex items-center gap-3">
            <Badge variant="success">{contactName}</Badge>
            <button
              onClick={() => { setContactId(''); setContactName(''); setContactSearch(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              Change
            </button>
          </div>
        )}
        {contactSuggestions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/[0.06] bg-card backdrop-blur-2xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto">
            {contactSuggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => selectContact(c)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/[0.04] transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
              >
                <div>
                  <span className="font-medium text-foreground">{getContactDisplayName(c)}</span>
                  {c.email && <span className="ml-2 text-muted-foreground text-xs">{c.email}</span>}
                </div>
                {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => applyTemplate(Number(e.target.value))}
          className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        >
          {TEMPLATES[type].map((tmpl, i) => (
            <option key={i} value={i}>{tmpl.label}</option>
          ))}
        </select>
      </div>

      {/* Subject (email only) */}
      {type === 'EMAIL' && (
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
      )}

      {/* Body */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
          {type === 'EMAIL' ? 'Email Body' : 'Message'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={type === 'EMAIL' ? 10 : 4}
          placeholder={type === 'EMAIL' ? 'Write your email...' : 'Type your message...'}
          className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
        />
        {type === 'SMS' && (
          <p className="mt-2 text-xs text-muted-foreground">{body.length}/160 characters</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/crm/communications')}
          className="rounded-xl bg-muted hover:bg-muted border border-white/[0.06]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          isLoading={isSending}
          disabled={!contactId || (!body.trim() && !subject.trim())}
          className="rounded-xl bg-primary hover:bg-primary/90 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          {type === 'EMAIL' ? 'Send Email' : 'Send SMS'}
        </Button>
      </div>
    </div>
  );
}