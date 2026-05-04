'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Send, Mail } from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function EmailComposePage() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [to, setTo] = useState(searchParams.get('to') ?? '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') ?? '');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('');

  const replyTo = searchParams.get('replyTo');
  const forwardId = searchParams.get('forward');

  // Load original email for reply/forward
  const { data: originalEmail } = useQuery({
    queryKey: ['email-original', replyTo ?? forwardId],
    queryFn: async () => {
      const id = replyTo ?? forwardId;
      const res = await api.get<{ body: string; from: string; subject: string; createdAt: string }>(
        `/api/comms/email/${id}`
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!(replyTo || forwardId),
  });

  useEffect(() => {
    if (originalEmail) {
      const prefix = replyTo ? '\n\n---\nOn ' : '\n\n--- Forwarded message ---\nFrom: ';
      const context = replyTo
        ? `${new Date(originalEmail.createdAt).toLocaleString()}, ${originalEmail.from} wrote:\n${originalEmail.body}`
        : `${originalEmail.from}\nDate: ${new Date(originalEmail.createdAt).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body}`;
      setBody(prefix + context);
    }
  }, [originalEmail, replyTo]);

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const res = await api.get<EmailTemplate[]>('/api/comms/email/templates');
      if (res.error) throw new Error(res.error);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw as any)?.data ?? [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/comms/email/send', {
        to,
        cc: cc || undefined,
        subject,
        body,
        replyTo: replyTo || undefined,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Email sent');
      router.push('/dashboard/communications/email');
    },
    onError: (err) => {
      toast.error(`Failed to send: ${err.message}`);
    },
  });

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    const template = templates?.find((t) => t.id === id);
    if (template) {
      if (!subject) setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSend = () => {
    if (!to.trim()) {
      toast.error('Enter a recipient email address');
      return;
    }
    if (!subject.trim()) {
      toast.error('Enter a subject');
      return;
    }
    if (!body.trim()) {
      toast.error('Enter a message body');
      return;
    }
    sendMutation.mutate();
  };

  const templateOptions = [
    { value: '', label: 'Select template...' },
    ...(templates?.map((t) => ({ value: t.id, label: t.name })) ?? []),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 min-h-screen bg-card">
      <PageHeader
        title={replyTo ? 'Reply' : forwardId ? 'Forward' : 'Compose Email'}
        subtitle="Send a new email"
        breadcrumb={[
          { label: 'Communications', href: '/dashboard/communications' },
          { label: 'Email', href: '/dashboard/communications/email' },
          { label: replyTo ? 'Reply' : forwardId ? 'Forward' : 'Compose' },
        ]}
        className="mb-8"
      />

      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-8 space-y-6">
        {/* To */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">To</label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            type="email"
            className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* CC */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">CC</label>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@example.com"
            type="email"
            className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="bg-muted border-white/[0.06] rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Template */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Template</label>
          <Select
            value={templateId}
            onChange={handleTemplateSelect}
            options={templateOptions}
            className="bg-muted border-white/[0.06] rounded-xl text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email..."
            rows={12}
            className="font-sans bg-muted border-white/[0.06] rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.04]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/communications/email')}
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
            {sendMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </div>
  );
}