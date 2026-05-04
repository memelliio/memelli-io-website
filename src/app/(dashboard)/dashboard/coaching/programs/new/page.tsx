'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, DollarSign, Briefcase, FileText } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';

const TEMPLATES = [
  {
    id: 'credit-repair',
    label: 'Credit Repair',
    description: 'Dispute letters, score improvement, credit monitoring',
    icon: CreditCard,
  },
  {
    id: 'funding',
    label: 'Business Funding',
    description: 'SBA loans, business credit, funding strategies',
    icon: DollarSign,
  },
  {
    id: 'business',
    label: 'Business Launch',
    description: 'Entity formation, EIN, business setup',
    icon: Briefcase,
  },
  {
    id: '',
    label: 'Custom',
    description: 'Start from scratch with a blank program',
    icon: FileText,
  },
];

interface CreateProgramResponse {
  id?: string;
  program?: { id: string };
}

export default function NewProgramPage() {
  const router = useRouter();
  const api = useApi();
  const [form, setForm] = useState({ name: '', description: '', price: '', currency: 'USD', template: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    const res = await api.post<CreateProgramResponse>('/api/coaching/programs', {
      title: form.name,
      slug,
      description: form.description || undefined,
      template: form.template || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
    });
    if (res.error) { setError(res.error); setSubmitting(false); return; }
    const id = res.data?.id ?? res.data?.program?.id;
    if (id) router.push(`/dashboard/coaching/programs/${id}`);
    else router.push('/dashboard/coaching/programs');
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl tracking-tight font-semibold text-foreground">Create Program</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Set up a new coaching program</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>}

        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader><CardTitle className="text-[15px] tracking-tight font-semibold text-foreground">Program Details</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Program Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Credit Repair Mastery"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what clients will learn..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl">
          <CardHeader><CardTitle className="text-[15px] tracking-tight font-semibold text-foreground">Template</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <p className="mb-4 text-sm text-muted-foreground leading-relaxed">Start from a template or build from scratch.</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const selected = form.template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, template: t.id })}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? 'border-primary/20 bg-primary/5 shadow-lg shadow-primary/5'
                        : 'border-white/[0.04] bg-card backdrop-blur-xl hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`mb-2 h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className={`text-sm tracking-tight font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{t.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={submitting}>{submitting ? 'Creating...' : 'Create Program'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
