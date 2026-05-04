'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  SearchInput,
  Avatar,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface ContactResult {
  id: string;
  name: string;
  phone: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
}

export default function SmsComposePage() {
  const api = useApi();
  const router = useRouter();
  const [to, setTo] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null);
  const [templateId, setTemplateId] = useState('');
  const [body, setBody] = useState('');

  const { data: contactResults } = useQuery<ContactResult[]>({
    queryKey: ['contact-search-sms', contactSearch],
    queryFn: async () => {
      const res = await api.get<ContactResult[]>(
        `/api/contacts/search?q=${encodeURIComponent(contactSearch)}&hasPhone=true`
      );
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
    },
    enabled: contactSearch.length >= 2,
  });

  const { data: templates } = useQuery<SmsTemplate[]>({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const res = await api.get<SmsTemplate[]>('/api/comms/sms/templates');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const phoneNumber = selectedContact?.phone ?? to;
      const res = await api.post('/api/comms/sms/send', {
        to: phoneNumber,
        body,
        contactId: selectedContact?.id,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Message sent');
      router.push('/dashboard/communications/sms');
    },
    onError: (err) => {
      toast.error(`Failed to send: ${err.message}`);
    },
  });

  const handleContactSelect = (contact: ContactResult) => {
    setSelectedContact(contact);
    setTo(contact.phone);
    setContactSearch('');
  };

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    const template = templates?.find((t) => t.id === id);
    if (template) {
      setBody(template.body);
    }
  };

  const handleSend = () => {
    const phoneNumber = selectedContact?.phone ?? to;
    if (!phoneNumber.trim()) {
      toast.error('Enter a recipient phone number');
      return;
    }
    if (!body.trim()) {
      toast.error('Enter a message');
      return;
    }
    sendMutation.mutate();
  };

  const templateOptions = [
    { value: '', label: 'Select template...' },
    ...(templates?.map((t) => ({ value: t.id, label: t.name })) ?? []),
  ];

  const charCount = body.length;
  const segmentCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 bg-card min-h-screen">
      <PageHeader
        title="Compose SMS"
        subtitle="Send a new text message"
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'SMS', href: '/dashboard/communications/sms' },
          { label: 'Compose' },
        ]}
        className="mb-8"
      />

      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 space-y-6">
        {/* To field */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">To</label>
          {selectedContact ? (
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-card px-6 py-4 transition-all duration-200">
              <Avatar name={selectedContact.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedContact.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedContact(null);
                  setTo('');
                }}
                className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Phone number or search contacts..."
                className="bg-card border-white/[0.04] rounded-xl text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts by name..."
                className="bg-card border-white/[0.04] rounded-xl text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              {contactResults && contactResults.length > 0 && (
                <div className="divide-y divide-white/[0.04] max-h-40 overflow-y-auto bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                  {contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      className="flex items-center justify-between w-full px-6 py-4 hover:bg-white/[0.04] transition-all duration-200 text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{contact.name}</span>
                      <span className="text-sm text-muted-foreground font-mono">{contact.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template select */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Template</label>
          <Select
            value={templateId}
            onChange={handleTemplateSelect}
            options={templateOptions}
            className="bg-card border-white/[0.04] rounded-xl text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Message body */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="bg-card border-white/[0.04] rounded-xl text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {charCount} character{charCount !== 1 ? 's' : ''} / {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
            </span>
            {charCount > 1600 && (
              <span className="text-xs text-amber-400">Message is very long</span>
            )}
          </div>
        </div>

        {/* Send button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/communications/sms')}
            className="bg-muted hover:bg-muted border border-white/[0.06] rounded-xl text-foreground transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            onClick={handleSend}
            disabled={sendMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
}