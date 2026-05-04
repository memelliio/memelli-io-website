'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  FormLabel,
  FormDescription,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface CampaignFormData {
  name: string;
  type: 'email' | 'sms' | 'dm';
  targetCriteria: string;
  messageTemplate: string;
  scheduleType: 'immediate' | 'scheduled';
  scheduledAt?: string;
}

export default function CreateCampaignPage() {
  const api = useApi();
  const router = useRouter();

  const [form, setForm] = useState<CampaignFormData>({
    name: '',
    type: 'email',
    targetCriteria: '',
    messageTemplate: '',
    scheduleType: 'immediate',
    scheduledAt: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/leads/outreach/campaigns', {
        name: form.name,
        type: form.type,
        targetCriteria: form.targetCriteria ? { raw: form.targetCriteria } : {},
        messageTemplate: form.messageTemplate,
        scheduledAt: form.scheduleType === 'scheduled' && form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : undefined,
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Campaign created');
      router.push('/dashboard/leads/outreach');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create campaign');
    },
  });

  const update = (key: keyof CampaignFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = form.name.trim() && form.messageTemplate.trim();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader
        title="Create Campaign"
        subtitle="Set up a new outreach campaign"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Leads', href: '/dashboard/leads' },
          { label: 'Outreach', href: '/dashboard/leads/outreach' },
          { label: 'Create' },
        ]}
        className="mb-8"
      />

      <div className="space-y-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg shadow-black/10">
        {/* Campaign Name */}
        <FormField>
          <FormLabel>Campaign Name</FormLabel>
          <Input
            placeholder="e.g. Credit Repair Atlanta Q1"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </FormField>

        {/* Campaign Type */}
        <FormField>
          <FormLabel>Campaign Type</FormLabel>
          <Select
            value={form.type}
            onChange={(val) => update('type', val)}
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'dm', label: 'Direct Message' },
            ]}
          />
          <FormDescription>
            Choose how you want to reach out to leads.
          </FormDescription>
        </FormField>

        {/* Target Criteria */}
        <FormField>
          <FormLabel>Target Criteria</FormLabel>
          <Textarea
            placeholder="e.g. Score >= 70, Source = Instagram, Location = Atlanta"
            value={form.targetCriteria}
            onChange={(e) => update('targetCriteria', e.target.value)}
            rows={3}
          />
          <FormDescription>
            Describe which leads should receive this campaign. Use natural language or filter syntax.
          </FormDescription>
        </FormField>

        {/* Message Template */}
        <FormField>
          <FormLabel>Message Template</FormLabel>
          <Textarea
            placeholder={`Hi {{first_name}},\n\nI noticed you might benefit from...\n\nBest,\n{{sender_name}}`}
            value={form.messageTemplate}
            onChange={(e) => update('messageTemplate', e.target.value)}
            rows={8}
          />
          <FormDescription>
            Use {'{{variable}}'} syntax for personalization. Available: first_name, last_name, email, company, score.
          </FormDescription>
        </FormField>

        {/* Schedule */}
        <FormField>
          <FormLabel>Schedule</FormLabel>
          <Select
            value={form.scheduleType}
            onChange={(val) => update('scheduleType', val)}
            options={[
              { value: 'immediate', label: 'Send Immediately' },
              { value: 'scheduled', label: 'Schedule for Later' },
            ]}
          />
        </FormField>

        {form.scheduleType === 'scheduled' && (
          <FormField>
            <FormLabel>Scheduled Date & Time</FormLabel>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => update('scheduledAt', e.target.value)}
            />
          </FormField>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
          <Button
            variant="primary"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!canSubmit}
          >
            Create Campaign
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/leads/outreach')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
