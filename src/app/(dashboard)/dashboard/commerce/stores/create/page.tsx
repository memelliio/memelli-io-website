'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@memelli/ui';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TEMPLATES = [
  { label: 'General', value: 'general' },
  { label: 'Electronics', value: 'electronics' },
  { label: "Men's Fashion", value: 'mens-fashion' },
  { label: "Women's Fashion", value: 'womens-fashion' },
  { label: 'Beauty', value: 'beauty' },
  { label: 'Pet', value: 'pet' },
  { label: 'Household', value: 'household' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Digital', value: 'digital' },
  { label: 'Coaching', value: 'coaching' },
];

const CURRENCIES = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'CAD', value: 'CAD' },
  { label: 'AUD', value: 'AUD' },
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CreateStorePage() {
  const router = useRouter();
  const api = useApi();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('general');
  const [currency, setCurrency] = useState('USD');
  const [domain, setDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: Record<string, any> = {
      name,
      slug,
      template,
      currency,
    };
    if (description) body.description = description;
    if (domain) body.email = domain; // domain mapped to store field

    const res = await api.post<any>('/api/commerce/stores', body);
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
      return;
    }

    const storeId = res.data?.data?.id ?? res.data?.id;
    router.push(`/dashboard/commerce/stores/${storeId}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/commerce/stores"
          className="rounded-2xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground backdrop-blur-xl transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Create Store</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">Set up a new storefront</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-primary/[0.06] border border-primary/[0.12] p-4 text-sm text-primary">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Store Name</label>
              <Input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Store"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Slug</label>
              <Input
                required
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="my-awesome-store"
                className="font-mono"
              />
              <p className="text-xs text-white/30">URL-friendly identifier</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your store..."
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder-white/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">Template</label>
                <Select
                  value={template}
                  onChange={(val) => setTemplate(val)}
                  options={TEMPLATES}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">Currency</label>
                <Select
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  options={CURRENCIES}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Custom Domain</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="shop.yourdomain.com"
              />
              <p className="text-xs text-white/30">Optional custom domain for this store</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/commerce/stores"
            className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={submitting} disabled={!name || !slug}>
            Create Store
          </Button>
        </div>
      </form>
    </div>
  );
}
