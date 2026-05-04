'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { useApi } from '../../../../../../../hooks/useApi';
import { Button } from '../../../../../../../components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stage {
  id: string;
  name: string;
  color?: string;
  order: number;
  dealsCount?: number;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: Stage[];
}

const PRESET_COLORS = [
  { label: 'Purple', value: '#9333ea' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Pink', value: '#ec4899' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PipelineSettingsPage() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const router = useRouter();
  const api = useApi();

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDesc, setPipelineDesc] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [savingStageId, setSavingStageId] = useState<string | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#9333ea');
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!pipelineId) return;
    setIsLoading(true);
    const res = await api.get<any>(`/api/crm/pipelines/${pipelineId}`);
    const data = res.data?.data ?? res.data;
    if (data) {
      setPipeline(data);
      setPipelineName(data.name);
      setPipelineDesc(data.description ?? '');
      setStages([...(data.stages ?? [])].sort((a: Stage, b: Stage) => a.order - b.order));
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingName(true);
    await api.patch(`/api/crm/pipelines/${pipelineId}`, { name: pipelineName, description: pipelineDesc });
    setIsSavingName(false);
    setSuccess('Pipeline updated.');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleSaveStage(stage: Stage) {
    setSavingStageId(stage.id);
    await api.patch(`/api/crm/pipelines/${pipelineId}/stages/${stage.id}`, {
      name: stage.name,
      color: stage.color,
      order: stage.order,
    });
    setSavingStageId(null);
    setSuccess('Stage updated.');
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleDeleteStage(stage: Stage) {
    setDeleteError(null);
    if ((stage.dealsCount ?? 0) > 0) {
      setDeleteError(`Cannot delete "${stage.name}" -- it has ${stage.dealsCount} deal(s). Move them first.`);
      return;
    }
    setDeletingStageId(stage.id);
    await api.del(`/api/crm/pipelines/${pipelineId}/stages/${stage.id}`);
    setDeletingStageId(null);
    load();
  }

  async function handleAddStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim()) return;
    setIsAddingStage(true);
    const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), -1);
    await api.post(`/api/crm/pipelines/${pipelineId}/stages`, {
      name: newStageName.trim(),
      color: newStageColor,
      order: maxOrder + 1,
    });
    setIsAddingStage(false);
    setNewStageName('');
    setNewStageColor('#9333ea');
    load();
  }

  function moveStage(index: number, direction: 'up' | 'down') {
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    const reordered = newStages.map((s, i) => ({ ...s, order: i }));
    setStages(reordered);
    reordered.filter((_, i) => i === index || i === targetIndex).forEach((s) => {
      api.patch(`/api/crm/pipelines/${pipelineId}/stages/${s.id}`, { order: s.order });
    });
  }

  function updateLocalStage(id: string, field: keyof Stage, value: string | number) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-purple-500" />
      </div>
    );
  }

  if (!pipeline) {
    return <div className="text-center text-muted-foreground py-16">Pipeline not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/crm/pipelines/${pipelineId}`)}
          className="text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pipeline Settings</h1>
          <p className="text-sm text-muted-foreground">{pipeline.name}</p>
        </div>
      </div>

      {success && (
        <div className="bg-card backdrop-blur-xl border border-emerald-500/20 rounded-2xl px-4 py-2 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {deleteError && (
        <div className="flex items-start gap-2 bg-card backdrop-blur-xl border border-amber-500/20 rounded-2xl px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Pipeline Name & Description */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-4">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pipeline Details</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name</label>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={pipelineDesc}
              onChange={(e) => setPipelineDesc(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSavingName}>
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* Stage Management */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-4">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Stages</h2>

        {stages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No stages yet.</p>
        )}

        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl p-3 space-y-3">
              <div className="flex items-center gap-3">
                {/* Color picker */}
                <div className="flex items-center gap-1 shrink-0">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => updateLocalStage(stage.id, 'color', c.value)}
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
                  onChange={(e) => updateLocalStage(stage.id, 'name', e.target.value)}
                  className="flex-1 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />

                {/* Order arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveStage(i, 'up')}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none transition-colors duration-150"
                  >&#x25B2;</button>
                  <button
                    type="button"
                    onClick={() => moveStage(i, 'down')}
                    disabled={i === stages.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none transition-colors duration-150"
                  >&#x25BC;</button>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={savingStageId === stage.id}
                  onClick={() => handleSaveStage(stage)}
                  className="shrink-0"
                >
                  Save
                </Button>

                <button
                  type="button"
                  onClick={() => handleDeleteStage(stage)}
                  disabled={deletingStageId === stage.id}
                  className="text-muted-foreground hover:text-primary transition-all duration-200 disabled:opacity-50 shrink-0"
                  title={stage.dealsCount ? `${stage.dealsCount} deals` : 'Delete stage'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {(stage.dealsCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  {stage.dealsCount} deal{stage.dealsCount !== 1 ? 's' : ''} in this stage
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Stage */}
        <div className="mt-4 rounded-xl border border-dashed border-white/[0.04] p-4 space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Add New Stage</h3>
          <form onSubmit={handleAddStage} className="flex items-center gap-3">
            <div className="flex items-center gap-1 shrink-0">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setNewStageColor(c.value)}
                  className={`h-4 w-4 rounded-full border-2 transition-transform duration-150 hover:scale-110 ${
                    newStageColor === c.value ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Stage name..."
              className="flex-1 rounded-xl border border-white/[0.04] bg-card backdrop-blur-xl px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <Button type="submit" size="sm" isLoading={isAddingStage} disabled={!newStageName.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </form>
        </div>
      </div>

      {/* Automation Rules (Placeholder) */}
      <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Automation Rules</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Zap className="h-8 w-8 mb-3 opacity-30" />
          <p className="text-sm">Automation rules coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">
            Trigger workflows when deals move between stages
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/crm/pipelines/${pipelineId}`)}>
          Back to Pipeline
        </Button>
      </div>
    </div>
  );
}