'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Zap, Wrench, RefreshCw, Gavel } from 'lucide-react';
import Link from 'next/link';
import { useApi } from '../../../../../../hooks/useApi';
import { Button } from '../../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';

const STORE_TYPES = [
  { type: 'DIGITAL', label: 'Digital', icon: Zap, description: 'Sell digital products, downloads, and licenses' },
  { type: 'PHYSICAL', label: 'Physical', icon: ShoppingBag, description: 'Sell physical goods with inventory tracking' },
  { type: 'SERVICE', label: 'Service', icon: Wrench, description: 'Sell services, bookings, and consulting' },
  { type: 'SUBSCRIPTION', label: 'Subscription', icon: RefreshCw, description: 'Recurring billing and membership plans' },
  { type: 'AUCTION', label: 'Auction', icon: Gavel, description: 'Time-based bidding and auction listings' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

interface StoreResponse {
  id: string;
  data?: { id: string };
}

export default function NewStorePage() {
  const router = useRouter();
  const api = useApi();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [type, setType] = useState('DIGITAL');
  const [currency, setCurrency] = useState('USD');
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
    const res = await api.post<StoreResponse>('/api/commerce/stores', { name, slug, type, currency });
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    const storeId = (res.data as any)?.data?.id ?? (res.data as any)?.id;
    router.push(`/dashboard/commerce/stores/${storeId}`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/commerce/stores" className="rounded-2xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground backdrop-blur-xl transition-all duration-200">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl tracking-tight font-semibold text-foreground">Create Store</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">Set up a new storefront</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-primary/[0.06] border border-primary/[0.12] p-4 text-sm text-primary">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Store Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Store Name</label>
              <input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Store"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder-white/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Slug</label>
              <input
                required
                value={slug}
                onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
                placeholder="my-awesome-store"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground font-mono placeholder-white/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              <p className="text-xs text-white/30">URL-friendly identifier (auto-generated from name)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Store Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STORE_TYPES.map(({ type: t, label, icon: Icon, description }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    type === t ? 'border-primary/40 bg-primary/[0.06] shadow-[0_0_20px_-6px_rgba(239,68,68,0.15)]' : 'border-white/[0.04] bg-white/[0.03] hover:border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${type === t ? 'bg-primary/20' : 'bg-white/[0.06]'}`}>
                    <Icon className={`h-5 w-5 ${type === t ? 'text-primary' : 'text-white/40'}`} />
                  </div>
                  <p className={`font-medium text-sm ${type === t ? 'text-primary' : 'text-white/80'}`}>{label}</p>
                  <p className="text-xs text-white/30 leading-relaxed">{description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/commerce/stores" className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.04] transition-all duration-200">
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
