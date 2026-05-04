'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, ShoppingCart, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL as API } from '@/lib/config';
async function publicApi(path: string) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Variant {
  id: string;
  name: string;
  price: number;
  inventory: number;
  sku?: string;
  attributes?: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  comparePrice?: number;
  imageUrls?: string[];
  type?: string;
  status: string;
  inventory?: number;
  sku?: string;
  variants?: Variant[];
  store?: { id: string; name: string };
}

const CART_KEY = 'memelli_cart';

function getCart(): { productId: string; variantId?: string; qty: number }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

function addToCart(productId: string, variantId?: string) {
  const cart = getCart();
  const key = variantId ? `${productId}:${variantId}` : productId;
  const existing = cart.find((c) => {
    const ck = c.variantId ? `${c.productId}:${c.variantId}` : c.productId;
    return ck === key;
  });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, variantId, qty: 1 });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi(`/api/commerce/products/public/${id}`);
      const p = data.data ?? data;
      setProduct(p);
      if (p.variants && p.variants.length > 0) {
        setSelectedVariant(p.variants[0]);
      }
      // Load related products from same store
      if (p.store?.id || p.storeId) {
        try {
          const storeId = p.store?.id ?? p.storeId;
          const relData = await publicApi(`/api/commerce/products/public?storeId=${storeId}&perPage=5`);
          const all = relData.data ?? relData ?? [];
          setRelatedProducts(all.filter((rp: Product) => rp.id !== id).slice(0, 4));
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, selectedVariant?.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const images = product?.imageUrls ?? [];
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.basePrice ?? 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Product not found'}</p>
        <Link href="/store" className="text-red-400 text-sm hover:underline">Back to store</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <Link href="/store" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-muted-foreground transition-colors duration-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-card backdrop-blur-xl rounded-2xl border border-border overflow-hidden relative">
            {images.length > 0 ? (
              <img
                src={images[imageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-zinc-800" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-[hsl(var(--background))]/70 backdrop-blur-xl rounded-full p-2.5 text-muted-foreground hover:bg-[hsl(var(--background))] transition-all duration-200 border border-border"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-[hsl(var(--background))]/70 backdrop-blur-xl rounded-full p-2.5 text-muted-foreground hover:bg-[hsl(var(--background))] transition-all duration-200 border border-border"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2.5 mt-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    i === imageIndex ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-border hover:border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          {product.store?.name && (
            <p className="text-xs text-red-400 uppercase tracking-widest font-medium">
              {product.store.name}
            </p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-white/90">{product.name}</h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold text-white/90">
              ${Number(currentPrice).toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > currentPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${Number(product.comparePrice).toFixed(2)}
              </span>
            )}
            {product.comparePrice && product.comparePrice > currentPrice && (
              <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
                {Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100)}% off
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          )}

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      selectedVariant?.id === v.id
                        ? 'border-red-500/50 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/10'
                        : 'border-border text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    {v.name}
                    <span className="ml-2 text-xs text-muted-foreground">${Number(v.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type badge + SKU */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {product.type && (
              <span className="rounded-full bg-card backdrop-blur-xl border border-border px-3 py-1">
                {product.type}
              </span>
            )}
            {(selectedVariant?.sku ?? product.sku) && (
              <span>SKU: {selectedVariant?.sku ?? product.sku}</span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium text-white transition-all duration-200 ${
              added
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </button>

          {/* Cart link */}
          <Link
            href="/store/cart"
            className="text-sm text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            View cart and checkout
          </Link>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-20">
          <h2 className="text-xl font-semibold tracking-tight text-white/90 mb-8">Related Products</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/store/${rp.id}`}
                className="group rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden hover:border-border hover:bg-card transition-all duration-250"
              >
                <div className="aspect-square bg-card overflow-hidden">
                  {rp.imageUrls && rp.imageUrls.length > 0 ? (
                    <img src={rp.imageUrls[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-zinc-800" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-medium text-foreground group-hover:text-red-400 transition-colors duration-200 line-clamp-1">{rp.name}</h3>
                  <p className="text-sm font-semibold text-foreground mt-1.5">${Number(rp.basePrice).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
