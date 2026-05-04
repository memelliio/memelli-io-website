'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Filter, ShoppingCart } from 'lucide-react';
import { API_URL as API } from '@/lib/config';
async function publicApi(path: string) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  comparePrice?: number;
  imageUrls?: string[];
  status: string;
  type?: string;
  store?: { id: string; name: string };
}

const CART_KEY = 'memelli_cart';

function getCart(): { productId: string; qty: number }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

function addToCart(productId: string) {
  const cart = getCart();
  const existing = cart.find((c) => c.productId === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi('/api/commerce/products/public');
      setProducts(data.data ?? data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const types = ['ALL', ...new Set(products.map((p) => p.type ?? 'PHYSICAL').filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || (p.type ?? 'PHYSICAL') === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product.id);
    showToast(`Added "${product.name}" to cart`);
  };

  const cartCount = getCart().reduce((s, c) => s + c.qty, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 rounded-2xl bg-card backdrop-blur-2xl border border-border px-5 py-3.5 text-sm text-foreground shadow-2xl shadow-black/40">
          {toast}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-b from-red-900/10 via-zinc-950 to-zinc-950 px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-white/90 mb-4">Store</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto font-light">
          Browse our products and find exactly what you need
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-border bg-card backdrop-blur-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
              />
            </div>
            {/* Category filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-border bg-card backdrop-blur-xl pl-10 pr-8 py-3 text-sm text-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 appearance-none cursor-pointer transition-all duration-200"
              >
                {types.map((t) => (
                  <option key={t} value={t} className="bg-card">
                    {t === 'ALL' ? 'All Types' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Cart */}
          <Link
            href="/store/cart"
            className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card backdrop-blur-xl px-5 py-3 text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-200"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs text-white font-medium">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-5 text-sm text-red-300 mb-10">{error}</div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <ShoppingBag className="h-14 w-14 mb-5 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">No products found</p>
            <p className="text-sm mt-1.5">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden hover:border-border hover:bg-card transition-all duration-250"
              >
                {/* Image */}
                <Link href={`/store/${product.id}`}>
                  <div className="aspect-square bg-card relative overflow-hidden">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-zinc-800" />
                      </div>
                    )}
                    {product.comparePrice && product.comparePrice > product.basePrice && (
                      <div className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        Sale
                      </div>
                    )}
                  </div>
                </Link>
                {/* Info */}
                <div className="p-5">
                  <Link href={`/store/${product.id}`}>
                    <h3 className="font-medium text-foreground group-hover:text-red-400 transition-colors duration-200 line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-lg font-semibold text-foreground">
                      ${Number(product.basePrice).toFixed(2)}
                    </span>
                    {product.comparePrice && product.comparePrice > product.basePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${Number(product.comparePrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors duration-200"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
