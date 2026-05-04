'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { API_URL as API } from '@/lib/config';
import { LoadingGlobe } from '@/components/ui/loading-globe';
async function publicApi(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const CART_KEY = 'memelli_cart';

interface CartItem {
  productId: string;
  variantId?: string;
  qty: number;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  imageUrls?: string[];
  storeId?: string;
  variants?: { id: string; name: string; price: number }[];
}

interface EnrichedItem {
  productId: string;
  variantId?: string;
  qty: number;
  product: Product;
  variant?: { id: string; name: string; price: number };
  unitPrice: number;
}

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export default function CartPage() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Checkout form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [couponCode, setCouponCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const cart = getCart();
    if (cart.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const uniqueProductIds = [...new Set(cart.map((c) => c.productId))];
      const products: Product[] = [];

      for (const pid of uniqueProductIds) {
        try {
          const data = await publicApi(`/api/commerce/products/public/${pid}`);
          products.push(data.data ?? data);
        } catch {
          // skip unavailable products
        }
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      const enriched: EnrichedItem[] = cart
        .map((ci) => {
          const product = productMap.get(ci.productId);
          if (!product) return null;
          const variant = ci.variantId
            ? product.variants?.find((v) => v.id === ci.variantId)
            : undefined;
          return {
            ...ci,
            product,
            variant,
            unitPrice: variant ? variant.price : product.basePrice
          };
        })
        .filter(Boolean) as EnrichedItem[];

      setItems(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateQty = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qty: Math.max(1, next[index].qty + delta) };
      const cart = next.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }));
      saveCart(cart);
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const cart = next.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty }));
      saveCart(cart);
      return next;
    });
  };

  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * i.qty, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    // Group items by store
    const storeGroups = new Map<string, EnrichedItem[]>();
    for (const item of items) {
      const storeId = item.product.storeId ?? 'unknown';
      if (!storeGroups.has(storeId)) storeGroups.set(storeId, []);
      storeGroups.get(storeId)!.push(item);
    }

    try {
      for (const [storeId, storeItems] of storeGroups) {
        await publicApi('/api/commerce/orders/public', {
          method: 'POST',
          body: JSON.stringify({
            storeId,
            items: storeItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.qty,
              unitPrice: Number(i.unitPrice)
            })),
            shippingAddress: {
              name,
              address,
              city,
              state,
              zip
            },
            couponCode: couponCode || undefined,
            notes: `Customer: ${name}, Email: ${email}`
          })
        });
      }

      // Clear cart
      saveCart([]);
      setItems([]);
      setOrderPlaced(true);
    } catch (e: any) {
      setSubmitError(`Order failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 shadow-lg shadow-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/90 mb-3">Order Placed!</h1>
          <p className="text-muted-foreground mb-8 font-light">
            Thank you for your order. You will receive a confirmation shortly.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-sm font-medium text-white hover:bg-red-500 transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="max-w-5xl mx-auto px-6 pt-10">
        <Link href="/store" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-muted-foreground transition-colors duration-200 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-white/90 mb-10">Shopping Cart</h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <ShoppingCart className="h-14 w-14 mb-5 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">Your cart is empty</p>
            <Link href="/store" className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors duration-200">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId ?? ''}`}
                  className="flex gap-4 rounded-2xl border border-border bg-card backdrop-blur-xl p-5 hover:border-border transition-all duration-200"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-card overflow-hidden shrink-0 border border-border">
                    {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                      <img src={item.product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-zinc-800" />
                      </div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/store/${item.productId}`} className="font-medium text-foreground hover:text-red-400 transition-colors duration-200 line-clamp-1">
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variant.name}</p>
                    )}
                    <p className="text-sm font-medium text-muted-foreground mt-1.5">
                      ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(idx, -1)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-medium text-foreground w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(idx, 1)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Subtotal + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <p className="font-medium text-foreground">
                      ${(Number(item.unitPrice) * item.qty).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-6 h-fit">
              <h2 className="font-semibold text-foreground mb-5">Checkout</h2>

              {submitError && (
                <div className="mb-4 rounded-xl bg-red-500/5 border border-red-500/10 p-3.5 text-sm text-red-300">
                  {submitError}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Address</label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">City</label>
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">State</label>
                    <input
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">ZIP</label>
                    <input
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Coupon Code <span className="text-muted-foreground">(optional)</span></label>
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-border bg-card backdrop-blur-xl px-3.5 py-2.5 text-sm text-foreground font-mono placeholder-zinc-700 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 mt-1.5 transition-all duration-200"
                    placeholder="SAVE20"
                  />
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2.5">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground text-xs">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <LoadingGlobe size="sm" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
