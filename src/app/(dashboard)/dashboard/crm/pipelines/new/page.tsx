'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Button } from '../../../../../../components/ui/button';

interface Stage {
  id: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  { label: 'Purple', value: '#9333ea' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
];

const DEFAULT_STAGES: Stage[] = [
  { id: 'stage-1', name: 'Lead', color: '#3b82f6' },
  { id: 'stage-2', name: 'Qualified', color: '#9333ea' },
  { id: 'stage-3', name: 'Proposal', color: '#f97316' },
];

let stageCounter = 4;

export default function NewPipelinePage() {
  const api = useApi();
  const router = useRouter();
  const [pipelineName, setPipelineName] = useState('');
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function addStage() {
    setStages((prev) => [
      ...prev,
      { id: `stage-${stageCounter++}`, name: '', color: '#9333ea' },
    ]);
  }

  function removeStage(id: string) {
    setStages((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStage(id: string, field: keyof Stage, value: string) {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function moveStage(index: number, direction: 'up' | 'down') {
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    setStages(newStages);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!pipelineName.trim()) {
      setError('Pipeline name is required.');
      return;
    }
    const validStages = stages.filter((s) => s.name.trim());
    if (validStages.length === 0) {
      setError('At least one stage is required.');
      return;
    }
    setIsSaving(true);
    const res = await api.post<{ id: string }>('/api/crm/pipelines', {
      name: pipelineName.trim(),
      stages: validStages.map((s, i) => ({
        name: s.name.trim(),
        order: i,
        color: s.color,
      })),
    });
    setIsSaving(false);
    if (res.data?.id) {
      router.push(`/dashboard/crm/pipelines/${res.data.id}`);
    } else {
      setError(res.error ?? 'Failed to create pipeline.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Pipeline</h1>
          <p className="text-sm text-muted-foreground">Create a pipeline with custom stages</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pipeline Name */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-4">
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pipeline Details</h2>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Pipeline Name <span className="text-primary">*</span></label>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="e.g. Sales Pipeline, Onboarding..."
              autoFocus
              className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Stage Builder */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Stages</h2>
            <button
              type="button"
              onClick={addStage}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.04] bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/[0.04] hover:text-primary/80 transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" /> Add Stage
            </button>
          </div>

          {stages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No stages yet. Add one above.</p>
          )}

          <div className="space-y-2">
            {stages.map((stage, i) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-2.5"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Color picker */}
                <div className="flex items-center gap-1 shrink-0">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => updateStage(stage.id, 'color', c.value)}
                      className={`h-4 w-4 rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
                        stage.color === c.value ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                  placeholder="Stage name..."
                  className="flex-1 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />

                {/* Order controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveStage(i, 'up')}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed leading-none transition-colors duration-150"
                    title="Move up"
                  >
                    &#x25B2;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(i, 'down')}
                    disabled={i === stages.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed leading-none transition-colors duration-150"
                    title="Move down"
                  >
                    &#x25BC;
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeStage(stage.id)}
                  className="text-muted-foreground hover:text-primary transition-all duration-200 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Preview */}
          {stages.filter((s) => s.name.trim()).length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Preview</p>
              <div className="flex items-center gap-2 flex-wrap">
                {stages.filter((s) => s.name.trim()).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: s.color + '33', border: `1px solid ${s.color}66`, color: s.color }}
                    >
                      {s.name}
                    </span>
                    {i < stages.filter((s2) => s2.name.trim()).length - 1 && (
                      <span className="text-muted-foreground text-xs">&rarr;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-primary/80 bg-primary/80/[0.08] border border-primary/20 rounded-2xl backdrop-blur-xl px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSaving}>
            Create Pipeline
          </Button>
        </div>
      </form>
    </div>
  );
}