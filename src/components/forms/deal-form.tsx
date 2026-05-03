'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
}

export interface DealFormData {
  title: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  expectedAt?: string;
  contactId?: string;
}

interface DealFormProps {
  pipelines: Pipeline[];
  onSubmit: (data: DealFormData) => Promise<void>;
  initialData?: Partial<DealFormData>;
  isLoading?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
];

function inputClass(hasError?: boolean) {
  return cn(
    'memelli-input w-full',
    hasError && 'border-red-500/60'
  );
}

export function DealForm({ pipelines, onSubmit, initialData, isLoading = false }: DealFormProps) {
  const [form, setForm] = useState<DealFormData>({
    title: initialData?.title ?? '',
    pipelineId: initialData?.pipelineId ?? '',
    stageId: initialData?.stageId ?? '',
    value: initialData?.value ?? 0,
    currency: initialData?.currency ?? 'USD',
    expectedAt: initialData?.expectedAt ?? '',
    contactId: initialData?.contactId ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormData, string>>>({});
  const [contactSearch, setContactSearch] = useState('');

  const set = <K extends keyof DealFormData>(key: K, value: DealFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // When pipeline changes, reset stage and auto-select first stage
  useEffect(() => {
    const pipeline = pipelines.find((p) => p.id === form.pipelineId);
    if (pipeline && pipeline.stages.length > 0) {
      set('stageId', pipeline.stages[0].id);
    } else {
      set('stageId', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pipelineId]);

  const currentPipeline = pipelines.find((p) => p.id === form.pipelineId);
  const stageOptions = currentPipeline?.stages.map((s) => ({ value: s.id, label: s.name })) ?? [];
  const pipelineOptions = pipelines.map((p) => ({ value: p.id, label: p.name }));

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Deal title is required';
    if (!form.pipelineId) errs.pipelineId = 'Pipeline is required';
    if (!form.stageId) errs.stageId = 'Stage is required';
    if (form.value < 0) errs.value = 'Value must be 0 or greater';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data: DealFormData = {
      ...form,
      contactId: contactSearch.trim() || form.contactId,
      expectedAt: form.expectedAt || undefined,
    };
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Deal Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Enterprise contract — Acme Corp"
          className={inputClass(!!errors.title)}
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Pipeline + Stage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Select
            label="Pipeline *"
            options={pipelineOptions}
            value={form.pipelineId}
            onChange={(v) => set('pipelineId', v)}
            placeholder="Select pipeline"
            error={errors.pipelineId}
          />
        </div>
        <div>
          <Select
            label="Stage *"
            options={stageOptions}
            value={form.stageId}
            onChange={(v) => set('stageId', v)}
            placeholder={form.pipelineId ? 'Select stage' : 'Pick pipeline first'}
            disabled={!form.pipelineId || stageOptions.length === 0}
            error={errors.stageId}
          />
        </div>
      </div>

      {/* Value + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Value</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.value}
            onChange={(e) => set('value', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={inputClass(!!errors.value)}
          />
          {errors.value && <p className="mt-1 text-xs text-red-400">{errors.value}</p>}
        </div>
        <Select
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={form.currency}
          onChange={(v) => set('currency', v)}
        />
      </div>

      {/* Expected Close Date */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Expected Close Date</label>
        <input
          type="date"
          value={form.expectedAt}
          onChange={(e) => set('expectedAt', e.target.value)}
          className={cn(
            inputClass(),
            'text-[hsl(var(--foreground))] [color-scheme:dark]'
          )}
        />
      </div>

      {/* Contact search */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Contact ID</label>
        <input
          type="text"
          value={contactSearch || form.contactId || ''}
          onChange={(e) => {
            setContactSearch(e.target.value);
            set('contactId', e.target.value);
          }}
          placeholder="Contact ID or search..."
          className={inputClass()}
        />
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Enter the contact ID to associate with this deal.</p>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
          Save Deal
        </Button>
      </div>
    </form>
  );
}
