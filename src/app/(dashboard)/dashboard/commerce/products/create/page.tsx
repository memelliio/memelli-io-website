'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Plus, Trash2, Upload } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';

interface Store {
  id: string;
  name: string;
}

interface VariantInput {
  name: string;
  price: number;
  inventory: number;
  sku: string;
  attributes: Record<string, string>;
}

const STEPS = ['Basic Info', 'Pricing', 'Variants', 'Images'];

export default function CreateProductPage() {
  const api = useApi();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PHYSICAL' | 'DIGITAL' | 'SERVICE' | 'SUBSCRIPTION'>('PHYSICAL');
  const [storeId, setStoreId] = useState('');

  // Step 2: Pricing
  const [basePrice, setBasePrice] = useState<number>(0);
  const [comparePrice, setComparePrice] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [inventory, setInventory] = useState<number>(0);

  // Step 3: Variants
  const [variants, setVariants] = useState<VariantInput[]>([]);

  // Step 4: Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    api.get<{ data: Store[] } | Store[]>('/api/commerce/stores').then((res) => {
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as { data: Store[] }).data ?? [];
        setStores(list);
        if (list.length > 0 && !storeId) setStoreId(list[0].id);
      }
    });
  }, []);

  const addVariant = () => {
    setVariants([...variants, { name: '', price: basePrice, inventory: 0, sku: '', attributes: {} }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, data: Partial<VariantInput>) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, ...data } : v)));
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setImageUrls([...imageUrls, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === 0) return name.trim() && storeId;
    if (step === 1) return basePrice >= 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const body = {
      storeId,
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      basePrice,
      comparePrice: comparePrice !== '' ? Number(comparePrice) : undefined,
      sku: sku.trim() || undefined,
      inventory,
      imageUrls,
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          price: v.price,
          inventory: v.inventory,
          sku: v.sku.trim() || undefined,
          attributes: v.attributes,
        })),
    };

    const res = await api.post<{ data: any }>('/api/commerce/products', body);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/dashboard/commerce/products');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/commerce/products"
          className="rounded-xl p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create Product</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">Add a new product to your store</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                i === step
                  ? 'text-primary'
                  : i < step
                  ? 'text-foreground hover:text-foreground cursor-pointer'
                  : 'text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${
                  i === step
                    ? 'bg-primary text-white shadow-sm'
                    : i < step
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06]'
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-emerald-500/30' : 'bg-white/[0.04]'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-card backdrop-blur-xl border border-primary/20 p-4 text-sm text-primary/80">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Widget"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your product..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none backdrop-blur-xl transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
              >
                <option value="PHYSICAL">Physical</option>
                <option value="DIGITAL">Digital</option>
                <option value="SERVICE">Service</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Store *</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
              >
                {stores.length === 0 && <option value="">No stores available</option>}
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 1 && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-7 pr-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Compare-at Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. WDG-001"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={inventory}
                onChange={(e) => setInventory(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Variants */}
      {step === 2 && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Product Variants</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Add size, color, or other options</p>
            </div>
            <button
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <p className="text-sm">No variants added</p>
              <p className="text-xs mt-1 text-muted-foreground leading-relaxed">Variants are optional. Skip this step if your product has no options.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {variants.map((variant, i) => (
                <div key={i} className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Variant {i + 1}</p>
                    <button
                      onClick={() => removeVariant(i)}
                      className="rounded-xl p-1 text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Name *</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(i, { name: e.target.value })}
                        placeholder="e.g. Large / Blue"
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        placeholder="Optional"
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(i, { price: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.inventory}
                        onChange={(e) => updateVariant(i, { inventory: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Images */}
      {step === 3 && (
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold tracking-tight text-foreground">Product Images</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Add image URLs for your product</p>

          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              placeholder="https://example.com/image.jpg"
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all duration-200"
            />
            <button
              onClick={addImage}
              disabled={!imageInput.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-40 shadow-sm transition-all duration-200"
            >
              Add
            </button>
          </div>

          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="group relative rounded-2xl border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all duration-200">
                  <img src={url} alt="" className="h-28 w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 rounded-xl bg-background backdrop-blur-sm p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-lg bg-primary/80 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.06] py-12 text-muted-foreground">
              <Upload className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No images added yet</p>
              <p className="text-xs mt-1 text-muted-foreground leading-relaxed">Paste image URLs above to add product photos</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-foreground hover:bg-white/[0.04] disabled:opacity-30 transition-all duration-200"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-40 shadow-sm transition-all duration-200"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50 shadow-sm transition-all duration-200"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Create Product
          </button>
        )}
      </div>
    </div>
  );
}
