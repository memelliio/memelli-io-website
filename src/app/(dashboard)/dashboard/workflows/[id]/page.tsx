'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Play,
  ToggleLeft, ToggleRight, AlertCircle, GitBranch, Zap,
  Bell, Clock, CheckCircle, Filter as FilterIcon, GripVertical, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Select } from '../../../../../components/ui/select';

type StepType = 'condition' | 'action' | 'delay' | 'notify';

interface WorkflowStep {
  id: string;
  type: StepType;
  config: Record<string, string | number | boolean>;
  order: number;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  triggerType: string;
  steps: WorkflowStep[];
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
}

const STEP_TYPE_OPTIONS = [
  { value: 'condition', label: 'Condition (Branch)' },
  { value: 'action', label: 'Action' },
  { value: 'delay', label: 'Delay / Wait' },
  { value: 'notify', label: 'Notify' },
];

const STEP_ICONS: Record<StepType, React.ComponentType<{className?: string}>> = {
  condition: GitBranch,
  action: Zap,
  delay: Clock,
  notify: Bell,
};

const STEP_COLORS: Record<StepType, string> = {
  condition: 'border-l-4 border-l-amber-500/60 border-white/[0.04] bg-white/[0.02] backdrop-blur-xl',
  action: 'border-l-4 border-l-primary/60 border-white/[0.04] bg-white/[0.02] backdrop-blur-xl',
  delay: 'border-l-4 border-l-orange-500/60 border-white/[0.04] bg-white/[0.02] backdrop-blur-xl',
  notify: 'border-l-4 border-l-emerald-500/60 border-white/[0.04] bg-white/[0.02] backdrop-blur-xl',
};

const STEP_ICON_COLORS: Record<StepType, string> = {
  condition: 'text-amber-400',
  action: 'text-primary',
  delay: 'text-orange-400',
  notify: 'text-emerald-400',
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultStepConfig(type: StepType): Record<string, string | number | boolean> {
  switch (type) {
    case 'condition': return { field: '', operator: 'equals', value: '', trueBranch: 'continue', falseBranch: 'stop' };
    case 'action': return { actionType: 'create_task', title: '', engine: 'crm' };
    case 'delay': return { duration: 30, unit: 'minutes' };
    case 'notify': return { title: '', body: '', channel: 'in_app' };
  }
}

const TRIGGER_LABELS: Record<string, string> = {
  'contact.created': 'Contact Created',
  'deal.stage_changed': 'Deal Stage Changed',
  'order.created': 'Order Created',
  'lesson.completed': 'Lesson Completed',
  'ticket.created': 'Ticket Created',
  'schedule.daily': 'Daily Schedule',
  'schedule.weekly': 'Weekly Schedule',
  'schedule.hourly': 'Hourly Schedule',
  manual: 'Manual',
};

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [addType, setAddType] = useState<StepType>('action');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadWorkflow() {
    const res = await api.get<Workflow>(`/api/workflows/${id}`);
    if (res.data) {
      setWorkflow(res.data);
      setSteps(res.data.steps.sort((a, b) => a.order - b.order));
    }
    setLoading(false);
  }

  function addStep() {
    const newStep: WorkflowStep = {
      id: uid(),
      type: addType,
      config: defaultStepConfig(addType),
      order: steps.length,
    };
    setSteps((prev) => [...prev, newStep]);
    setHasChanges(true);
  }

  function removeStep(stepId: string) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i })));
    setHasChanges(true);
  }

  function moveStep(stepId: string, dir: -1 | 1) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setHasChanges(true);
  }

  function updateStepConfig(stepId: string, key: string, value: string | number | boolean) {
    setSteps((prev) => prev.map((s) =>
      s.id === stepId ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
    setHasChanges(true);
  }

  async function saveSteps() {
    if (!workflow) return;
    setSaving(true);
    const res = await api.patch<Workflow>(`/api/workflows/${workflow.id}`, { steps });
    if (res.data) setWorkflow(res.data);
    setHasChanges(false);
    setSaving(false);
    toast.success('Workflow saved');
  }

  async function toggleStatus() {
    if (!workflow) return;
    setToggling(true);
    const newStatus = workflow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await api.patch<Workflow>(`/api/workflows/${workflow.id}`, { status: newStatus });
    if (res.data) setWorkflow(res.data);
    else setWorkflow((prev) => prev ? { ...prev, status: newStatus } : prev);
    setToggling(false);
  }

  async function triggerNow() {
    if (!workflow) return;
    setTriggering(true);
    await api.post(`/api/workflows/${workflow.id}/trigger`, {});
    await loadWorkflow();
    setTriggering(false);
    toast.success('Workflow triggered');
  }

  // Drag handlers
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setDragIdx(idx);
    setHasChanges(true);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">Workflow not found.</p>
        <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/workflows')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="rounded-xl p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/95">{workflow.name}</h1>
            <p className="mt-1 text-sm text-white/40">
              Trigger: {TRIGGER_LABELS[workflow.triggerType] ?? workflow.triggerType}
              {workflow.description && ` · ${workflow.description}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleStatus}
            disabled={toggling}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-sm text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            {workflow.status === 'ACTIVE' ? (
              <><ToggleRight className="h-4 w-4 text-emerald-400" /> Active</>
            ) : (
              <><ToggleLeft className="h-4 w-4" /> Inactive</>
            )}
          </button>
          <Button variant="secondary" onClick={triggerNow} isLoading={triggering} size="md">
            <Play className="h-4 w-4" /> Run Now
          </Button>
          <Button onClick={saveSteps} isLoading={saving} size="md" disabled={!hasChanges}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl px-4 py-2 text-sm text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          You have unsaved changes.
        </div>
      )}

      {/* Visual Step Builder */}
      <Card className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <GitBranch className="h-4 w-4 text-primary" />
            Workflow Steps ({steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual flow */}
          <div className="space-y-0">
            {/* Trigger node */}
            <div className="flex items-center gap-3 rounded-2xl border border-l-4 border-l-primary/60 border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-3 mb-0">
              <div className="shrink-0 rounded-xl bg-primary/10 p-2">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary/80">Trigger</p>
                <p className="text-xs text-white/30">{TRIGGER_LABELS[workflow.triggerType] ?? workflow.triggerType}</p>
              </div>
            </div>

            {steps.map((step, idx) => {
              const Icon = STEP_ICONS[step.type];
              return (
                <div key={step.id}>
                  {/* Connector line */}
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-6 bg-white/[0.06]" />
                  </div>

                  {/* Step card */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-2xl border p-4 transition-colors ${STEP_COLORS[step.type]} ${
                      dragIdx === idx ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-white/20 cursor-grab" />
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/60">
                          {idx + 1}
                        </span>
                        <Icon className={`h-4 w-4 ${STEP_ICON_COLORS[step.type]}`} />
                        <span className="text-sm font-semibold text-white/80 capitalize">
                          {step.type}
                        </span>
                      </div>
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
                          className="rounded-lg p-1 text-white/30 hover:bg-primary/10 hover:text-primary/80 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Step config fields */}
                    {step.type === 'condition' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={String(step.config.field ?? '')}
                            onChange={(e) => updateStepConfig(step.id, 'field', e.target.value)}
                            placeholder="Field name"
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                          />
                          <select
                            value={String(step.config.operator ?? 'equals')}
                            onChange={(e) => updateStepConfig(step.id, 'operator', e.target.value)}
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                          >
                            <option value="equals">equals</option>
                            <option value="not_equals">not equals</option>
                            <option value="contains">contains</option>
                            <option value="greater_than">greater than</option>
                            <option value="less_than">less than</option>
                          </select>
                          <input
                            type="text"
                            value={String(step.config.value ?? '')}
                            onChange={(e) => updateStepConfig(step.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-400" /> True: continue
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-primary" /> False: stop
                          </span>
                        </div>
                      </div>
                    )}

                    {step.type === 'action' && (
                      <div className="space-y-2">
                        <select
                          value={String(step.config.actionType ?? 'create_task')}
                          onChange={(e) => updateStepConfig(step.id, 'actionType', e.target.value)}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                        >
                          <option value="create_task">Create Task</option>
                          <option value="update_record">Update Record</option>
                          <option value="send_email">Send Email</option>
                          <option value="ai_command">AI Command</option>
                          <option value="webhook">Call Webhook</option>
                        </select>
                        <input
                          type="text"
                          value={String(step.config.title ?? '')}
                          onChange={(e) => updateStepConfig(step.id, 'title', e.target.value)}
                          placeholder="Action details / title"
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                        />
                      </div>
                    )}

                    {step.type === 'delay' && (
                      <div className="flex gap-2 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-white/30">Duration</label>
                          <input
                            type="number"
                            min={1}
                            value={Number(step.config.duration ?? 30)}
                            onChange={(e) => updateStepConfig(step.id, 'duration', Number(e.target.value))}
                            className="w-24 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                          />
                        </div>
                        <select
                          value={String(step.config.unit ?? 'minutes')}
                          onChange={(e) => updateStepConfig(step.id, 'unit', e.target.value)}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    )}

                    {step.type === 'notify' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={String(step.config.title ?? '')}
                          onChange={(e) => updateStepConfig(step.id, 'title', e.target.value)}
                          placeholder="Notification title"
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                        />
                        <textarea
                          value={String(step.config.body ?? '')}
                          onChange={(e) => updateStepConfig(step.id, 'body', e.target.value)}
                          placeholder="Notification body"
                          rows={2}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 placeholder-white/20 focus:border-primary/40 focus:outline-none resize-none backdrop-blur-xl"
                        />
                        <select
                          value={String(step.config.channel ?? 'in_app')}
                          onChange={(e) => updateStepConfig(step.id, 'channel', e.target.value)}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-sm text-white/90 focus:border-primary/40 focus:outline-none backdrop-blur-xl"
                        >
                          <option value="in_app">In-App</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Connector to add */}
            {steps.length > 0 && (
              <div className="flex justify-center py-1">
                <div className="w-0.5 h-6 bg-white/[0.06]" />
              </div>
            )}
          </div>

          {/* Add step */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.04]">
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
    </div>
  );
}
