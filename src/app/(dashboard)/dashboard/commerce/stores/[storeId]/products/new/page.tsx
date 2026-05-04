'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useApi } from '../../../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';

const PRODUCT_TYPES = ['DIGITAL', 'PHYSICAL', 'SERVICE', 'SUBSCRIPTION'];

export default function NewProductPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const api = useApi();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DIGITAL');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [inventory, setInventory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImage = () => {
    if (imageUrl.trim()) { setImages((prev) => [...prev, imageUrl.trim()]); setImageUrl(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await api.post<any>(`/api/commerce/stores/${storeId}/products`, {
      name, description: description || undefined, type,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      sku: sku || undefined,
      inventory: inventory ? parseInt(inventory) : undefined,
      images: images.length > 0 ? images : undefined,
    });
    if (res.error) { setError(res.error); setSubmitting(false); return; }
    router.push(`/dashboard/commerce/stores/${storeId}`);
  };

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/commerce/stores/${storeId}`} className="rounded-xl p-2.5 text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-200">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Add Product</h1>
          <p className="text-sm text-white/40 mt-0.5">Add a new product to your store</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/[0.12] backdrop-blur-xl p-4 text-sm text-red-300">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="font-semibold text-white/90">Basic Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Product Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your product..."
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 resize-none transition-all duration-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/60">Product Type</label>
              <div className="flex gap-2 flex-wrap">
                {PRODUCT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${type === t ? 'bg-red-500/80 text-white' : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:border-white/[0.1] hover:text-white/60'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="font-semibold text-white/90">Pricing</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                  <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl pl-8 pr-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">Compare at Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="0.00"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl pl-8 pr-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="font-semibold text-white/90">Inventory</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">SKU</label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="PROD-001"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 font-mono placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/60">Quantity</label>
                <input type="number" min="0" value={inventory} onChange={(e) => setInventory(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="font-semibold text-white/90">Images</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex gap-2">
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all duration-200" />
              <button type="button" onClick={addImage} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-200">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {images.map((img, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.04] px-4 py-2.5">
                <span className="text-xs text-white/40 font-mono truncate flex-1 mr-2">{img}</span>
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-300 transition-colors duration-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/dashboard/commerce/stores/${storeId}`} className="rounded-xl border border-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.04] transition-all duration-200">
            Cancel
          </Link>
          <Button type="submit" isLoading={submitting} disabled={!name || !price}>Add Product</Button>
        </div>
      </form>
    </div>
  );
}
