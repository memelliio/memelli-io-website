'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Zap, Calendar, MousePointer, Bell, GitBranch,
  Mail, Clock, Sparkles,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

interface TriggerOption {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{className?: string}>;
  category: 'event' | 'schedule' | 'manual';
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  { value: 'contact.created', label: 'Contact Created', description: 'When a new contact is added to the system', icon: Bell, category: 'event' },
  { value: 'deal.stage_changed', label: 'Deal Stage Changed', description: 'When a deal moves to a different pipeline stage', icon: GitBranch, category: 'event' },
  { value: 'order.created', label: 'Order Created', description: 'When a new order is placed in commerce', icon: Zap, category: 'event' },
  { value: 'lesson.completed', label: 'Lesson Completed', description: 'When a student completes a coaching lesson', icon: Sparkles, category: 'event' },
  { value: 'ticket.created', label: 'Ticket Created', description: 'When a support ticket is opened', icon: Mail, category: 'event' },
  { value: 'schedule.daily', label: 'Daily Schedule', description: 'Run once every day at a specified time', icon: Calendar, category: 'schedule' },
  { value: 'schedule.weekly', label: 'Weekly Schedule', description: 'Run once every week on a specified day', icon: Calendar, category: 'schedule' },
  { value: 'schedule.hourly', label: 'Hourly Schedule', description: 'Run every hour', icon: Clock, category: 'schedule' },
  { value: 'manual', label: 'Manual Trigger', description: 'Run only when manually triggered', icon: MousePointer, category: 'manual' },
];

const CATEGORIES = [
  { key: 'event' as const, label: 'Event-Based', description: 'Triggered by system events' },
  { key: 'schedule' as const, label: 'Scheduled', description: 'Run on a time-based schedule' },
  { key: 'manual' as const, label: 'Manual', description: 'Triggered on demand' },
];

export default function WorkflowCreatePage() {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    if (!selectedTrigger) { setError('Please select a trigger.'); return; }
    setSaving(true);
    setError('');
    const res = await api.post('/api/workflows', {
      name: name.trim(),
      description: description.trim(),
      triggerType: selectedTrigger,
      steps: [],
    });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    const newId = (res.data as { id?: string })?.id;
    router.push(newId ? `/dashboard/workflows/${newId}` : '/dashboard/workflows');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/workflows')}
          className="rounded-xl p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/95">Create Workflow</h1>
          <p className="mt-0.5 text-sm text-white/40">Choose a trigger and give your workflow a name</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Name & Description */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white/90">Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome new contacts"
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={3}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger Selection */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white/90">Select Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {CATEGORIES.map((cat) => {
            const options = TRIGGER_OPTIONS.filter((t) => t.category === cat.key);
            return (
              <div key={cat.key}>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white/80">{cat.label}</h3>
                  <p className="text-xs text-white/30">{cat.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {options.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedTrigger === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedTrigger(opt.value)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-red-500/30 bg-red-500/10 ring-1 ring-red-500/20 backdrop-blur-xl'
                            : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04] backdrop-blur-xl'
                        }`}
                      >
                        <div className={`shrink-0 rounded-xl p-2 ${isSelected ? 'bg-red-500/15' : 'bg-white/[0.04]'}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-red-400' : 'text-white/40'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-red-300' : 'text-white/80'}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/workflows')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleCreate} isLoading={saving}>
          <Zap className="h-4 w-4" /> Create Workflow
        </Button>
      </div>
    </div>
  );
}
