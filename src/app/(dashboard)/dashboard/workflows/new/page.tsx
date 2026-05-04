'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronUp, ChevronDown, Zap, ArrowLeft } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Select } from '../../../../../components/ui/select';

type StepType = 'notify' | 'create_task' | 'wait' | 'ai_command';

interface StepBase {
  id: string;
  type: StepType;
}

interface NotifyStep extends StepBase {
  type: 'notify';
  title: string;
  body: string;
}

interface CreateTaskStep extends StepBase {
  type: 'create_task';
  title: string;
  priority: string;
  dueDays: number;
}

interface WaitStep extends StepBase {
  type: 'wait';
  delay: number;
  unit: 'minutes' | 'hours' | 'days';
}

interface AiCommandStep extends StepBase {
  type: 'ai_command';
  text: string;
  engine: string;
}

type Step = NotifyStep | CreateTaskStep | WaitStep | AiCommandStep;

const TRIGGER_OPTIONS = [
  { value: 'contact.created', label: 'Contact Created' },
  { value: 'deal.stage_changed', label: 'Deal Stage Changed' },
  { value: 'order.created', label: 'Order Created' },
  { value: 'lesson.completed', label: 'Lesson Completed' },
  { value: 'manual', label: 'Manual' },
];

const STEP_TYPE_OPTIONS = [
  { value: 'notify', label: 'Send Notification' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'wait', label: 'Wait / Delay' },
  { value: 'ai_command', label: 'AI Command' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const ENGINE_OPTIONS = [
  { value: 'crm', label: 'CRM' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'seo', label: 'SEO' },
];

const WAIT_UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultStep(type: StepType): Step {
  if (type === 'notify') return { id: uid(), type, title: '', body: '' };
  if (type === 'create_task') return { id: uid(), type, title: '', priority: 'MEDIUM', dueDays: 1 };
  if (type === 'wait') return { id: uid(), type, delay: 30, unit: 'minutes' };
  return { id: uid(), type: 'ai_command', text: '', engine: 'crm' };
}

export default function NewWorkflowPage() {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [addType, setAddType] = useState<StepType>('notify');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addStep() {
    setSteps((prev) => [...prev, defaultStep(addType)]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function updateStep(id: string, updates: Partial<Step>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...updates } as Step) : s)));
  }

  async function save() {
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    if (!trigger) { setError('Please select a trigger.'); return; }
    setSaving(true);
    setError('');
    const res = await api.post('/api/workflows', { name: name.trim(), triggerType: trigger, steps });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    router.push('/dashboard/workflows');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/workflows')}
          className="rounded-xl p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/95">New Workflow</h1>
          <p className="mt-0.5 text-sm text-white/40">Define a trigger and build your automation steps</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Basic info */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white/90">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Workflow Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome new contacts"
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/20"
            />
          </div>
          <Select
            label="Trigger"
            options={TRIGGER_OPTIONS}
            value={trigger}
            onChange={setTrigger}
            placeholder="Select a trigger event"
          />
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white/90">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 && (
            <p className="text-sm text-white/30">No steps yet. Add your first step below.</p>
          )}

          {steps.map((step, idx) => (
            <div key={step.id} className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Step {idx + 1} — {step.type.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveStep(step.id, -1)}
                    disabled={idx === 0}
                    className="rounded-lg p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveStep(step.id, 1)}
                    disabled={idx === steps.length - 1}
                    className="rounded-lg p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="rounded-lg p-1 text-white/30 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {step.type === 'notify' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder="Notification title"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none"
                  />
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(step.id, { body: e.target.value })}
                    placeholder="Notification body"
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none resize-none"
                  />
                </div>
              )}

              {step.type === 'create_task' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder="Task title"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        options={PRIORITY_OPTIONS}
                        value={step.priority}
                        onChange={(v) => updateStep(step.id, { priority: v })}
                        placeholder="Priority"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-white/30">Due in (days)</label>
                      <input
                        type="number"
                        min={0}
                        value={step.dueDays}
                        onChange={(e) => updateStep(step.id, { dueDays: Number(e.target.value) })}
                        className="w-24 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-2 py-2 text-sm text-white/90 focus:border-red-500/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step.type === 'wait' && (
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/30">Delay</label>
                    <input
                      type="number"
                      min={1}
                      value={step.delay}
                      onChange={(e) => updateStep(step.id, { delay: Number(e.target.value) })}
                      className="w-24 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-2 py-2 text-sm text-white/90 focus:border-red-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      options={WAIT_UNIT_OPTIONS}
                      value={step.unit}
                      onChange={(v) => updateStep(step.id, { unit: v as WaitStep['unit'] })}
                      placeholder="Unit"
                    />
                  </div>
                </div>
              )}

              {step.type === 'ai_command' && (
                <div className="space-y-2">
                  <textarea
                    value={step.text}
                    onChange={(e) => updateStep(step.id, { text: e.target.value })}
                    placeholder="AI command text (e.g. Summarize recent activity for this contact)"
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-red-500/40 focus:outline-none resize-none"
                  />
                  <Select
                    options={ENGINE_OPTIONS}
                    value={step.engine}
                    onChange={(v) => updateStep(step.id, { engine: v })}
                    placeholder="Engine"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add step */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1">
              <Select
                options={STEP_TYPE_OPTIONS}
                value={addType}
                onChange={(v) => setAddType(v as StepType)}
                placeholder="Step type"
              />
            </div>
            <Button variant="secondary" size="md" onClick={addStep}>
              <Plus className="h-4 w-4" /> Add Step
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push('/dashboard/workflows')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} isLoading={saving}>
          <Zap className="h-4 w-4" /> Save Workflow
        </Button>
      </div>
    </div>
  );
}
