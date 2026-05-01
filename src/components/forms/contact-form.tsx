'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export interface ContactFormData {
  type: 'PERSON' | 'COMPANY';
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone?: string;
  tags: string[];
  source?: string;
}

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
  isLoading?: boolean;
}

const SOURCE_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL', label: 'Social Media' },
  { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

function inputClass(hasError?: boolean) {
  return cn(
    'memelli-input w-full',
    hasError && 'border-red-500/60'
  );
}

export function ContactForm({ onSubmit, initialData, isLoading = false }: ContactFormProps) {
  const [form, setForm] = useState<ContactFormData>({
    type: initialData?.type ?? 'PERSON',
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    companyName: initialData?.companyName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    tags: initialData?.tags ?? [],
    source: initialData?.source ?? '',
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const set = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    set('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (form.type === 'PERSON' && !form.firstName) errs.firstName = 'First name is required';
    if (form.type === 'COMPANY' && !form.companyName) errs.companyName = 'Company name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        {(['PERSON', 'COMPANY'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set('type', t)}
            className={cn(
              'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
              form.type === t
                ? 'border-red-500/60 bg-red-500/15 text-red-300'
                : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            {t === 'PERSON' ? 'Person' : 'Company'}
          </button>
        ))}
      </div>

      {/* Name fields */}
      {form.type === 'PERSON' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">First Name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="John"
              className={inputClass(!!errors.firstName)}
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Smith"
              className={inputClass()}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Company Name *</label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="Acme Corp"
            className={inputClass(!!errors.companyName)}
          />
          {errors.companyName && <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="john@example.com"
          className={inputClass(!!errors.email)}
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={inputClass()}
        />
      </div>

      {/* Source */}
      <Select
        label="Source"
        options={SOURCE_OPTIONS}
        value={form.source ?? ''}
        onChange={(v) => set('source', v)}
        placeholder="Select source"
      />

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type tag and press Enter"
            className={cn(inputClass(), 'flex-1')}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addTag}>
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs text-[hsl(var(--foreground))]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
          Save Contact
        </Button>
      </div>
    </form>
  );
}
