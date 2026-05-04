'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap, CreditCard, Building2, Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';

const TEMPLATES = [
  {
    id: 'credit-repair',
    name: 'Credit Repair',
    description: 'Help clients understand, dispute, and rebuild their credit scores.',
    icon: CreditCard,
    color: 'emerald',
  },
  {
    id: 'funding',
    name: 'Funding Readiness',
    description: 'Prepare clients for funding applications and lending approval.',
    icon: Building2,
    color: 'blue',
  },
  {
    id: 'business',
    name: 'Business Building',
    description: 'Guide clients through starting and growing a business.',
    icon: Rocket,
    color: 'primary',
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CreateProgramPage() {
  const router = useRouter();
  const api = useApi();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        title,
        slug: slug || slugify(title),
        description: description || undefined,
        isPublic,
      };
      if (template) body.template = template;
      if (price) body.price = parseFloat(price);
      const res = await api.post<any>('/api/coaching/programs', body);
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      router.push(`/dashboard/coaching/programs/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/coaching/programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Create Program</h1>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">Start from a template or build from scratch</p>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium text-muted-foreground">Choose a Template (optional)</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTemplate(template === t.id ? null : t.id);
                if (!title) setTitle(t.name);
                if (!slug) setSlug(slugify(t.name));
              }}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                template === t.id
                  ? 'border-primary/20 bg-primary/5 shadow-lg shadow-primary/5'
                  : 'border-white/[0.04] bg-card backdrop-blur-xl hover:bg-white/[0.04]'
              }`}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                <t.icon className={`h-4 w-4 ${template === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-sm tracking-tight font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground leading-relaxed">{error}</div>
      )}

      {/* Form */}
      <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-[15px] tracking-tight font-semibold text-foreground">Program Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Program Name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug || slug === slugify(title)) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Credit Repair Mastery"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">URL Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="credit-repair-mastery"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What will students learn in this program?"
              className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00 (free)"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-white/[0.1] bg-white/[0.03] text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Public listing</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  {template ? 'Create from Template' : 'Create Program'}
                </>
              )}
            </Button>
            <Link href="/dashboard/coaching/programs">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
