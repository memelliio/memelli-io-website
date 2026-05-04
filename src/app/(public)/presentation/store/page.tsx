'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Truck,
  Shield,
  CreditCard,
  ChevronRight,
  Printer,
  Flame,
  Package,
  Star,
  Check,
} from 'lucide-react';

/* ──────────────────────────── TYPES ──────────────────────────── */

type Category = 'all' | 'printers' | 'presses' | 'bundles';

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  specs: string[];
  gradient: string;
  icon: typeof Printer;
  badge?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

/* ──────────────────────────── DATA ──────────────────────────── */

const products: Product[] = [
  {
    id: 'fp-pro-400',
    name: 'ForgePress Pro 400',
    category: 'printers',
    price: 4999,
    specs: ['400mm print width', '1200 DPI resolution', 'CMYK + White ink', '8 sq ft/min speed'],
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    icon: Printer,
  },
  {
    id: 'fp-xl-600',
    name: 'ForgePress XL 600',
    category: 'printers',
    price: 7999,
    specs: ['600mm print width', '1440 DPI resolution', 'CMYK + White + Varnish', '12 sq ft/min speed'],
    gradient: 'from-orange-600 via-red-500 to-orange-400',
    icon: Printer,
    badge: 'Best Seller',
  },
  {
    id: 'fp-max-1200',
    name: 'ForgePress Max 1200',
    category: 'printers',
    price: 12999,
    specs: ['1200mm print width', '2400 DPI resolution', 'Full spectrum + Gloss', '20 sq ft/min speed'],
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    icon: Printer,
    badge: 'Enterprise',
  },
  {
    id: 'hf-16x20',
    name: 'HeatForge 16x20',
    category: 'presses',
    price: 2499,
    specs: ['16" x 20" platen', 'Digital temp control', 'Even pressure distribution', 'Auto-open timer'],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: Flame,
  },
  {
    id: 'hf-24x32',
    name: 'HeatForge 24x32',
    category: 'presses',
    price: 3999,
    specs: ['24" x 32" platen', 'Dual-zone heating', 'Programmable presets', 'Slide-out drawer'],
    gradient: 'from-teal-600 via-emerald-500 to-green-400',
    icon: Flame,
    badge: 'Popular',
  },
  {
    id: 'hf-auto-swing',
    name: 'HeatForge Auto Swing',
    category: 'presses',
    price: 5499,
    specs: ['20" x 24" platen', 'Auto swing-away arm', 'Touchscreen interface', 'Production counter'],
    gradient: 'from-blue-600 via-indigo-500 to-violet-500',
    icon: Flame,
  },
  {
    id: 'starter-kit',
    name: 'Starter Kit',
    category: 'bundles',
    price: 6999,
    specs: ['ForgePress Pro 400', 'HeatForge 16x20', 'Starter ink set', '100 transfer sheets', '1-year warranty'],
    gradient: 'from-orange-500 via-rose-500 to-pink-500',
    icon: Package,
    badge: 'Save $499',
  },
  {
    id: 'pro-bundle',
    name: 'Pro Bundle',
    category: 'bundles',
    price: 14999,
    specs: ['ForgePress XL 600', 'HeatForge Auto Swing', 'Premium ink set', '500 transfer sheets', '3-year warranty', 'On-site training'],
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Package,
    badge: 'Best Value',
  },
];

const filters: { label: string; value: Category }[] = [
  { label: 'All Products', value: 'all' },
  { label: 'DTF Printers', value: 'printers' },
  { label: 'Heat Presses', value: 'presses' },
  { label: 'Bundles', value: 'bundles' },
];

const trustBadges = [
  { icon: CreditCard, text: 'B2B Financing Available' },
  { icon: Shield, text: 'Net 30/60/90 Terms' },
  { icon: Truck, text: 'Free Shipping on Orders $5K+' },
];

/* ──────────────────────────── HELPERS ──────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function StorefrontPage() {
  const [filter, setFilter] = useState<Category>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* ── HEADER ── */}
      <header className="border-b border-white/10 bg-[#0F172A]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">DTF ForgePress</h1>
              <p className="text-xs text-slate-400">Professional Print Equipment</p>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── TRUST BAR ── */}
      <div className="border-b border-white/5 bg-gradient-to-r from-orange-500/5 via-transparent to-emerald-500/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-8 flex-wrap">
          {trustBadges.map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-sm text-slate-300">
              <b.icon className="w-4 h-4 text-orange-400" />
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Professional DTF Equipment
        </h2>
        <p className="mt-2 text-slate-400 text-lg max-w-2xl">
          Industrial-grade DTF printers and heat presses built for production. B2B financing and net terms available on all orders.
        </p>
      </section>

      {/* ── FILTERS ── */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl bg-muted border border-white/10 hover:border-orange-500/30 transition-all overflow-hidden flex flex-col"
            >
              {/* Image placeholder */}
              <div className={`relative h-48 bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
                <product.icon className="w-16 h-16 text-white/80" />
                {product.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-foreground/30 backdrop-blur-sm text-xs font-semibold text-white border border-white/20">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold tracking-tight">{product.name}</h3>

                <ul className="mt-3 space-y-1.5 flex-1">
                  {product.specs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-2xl font-bold text-white">{fmt(product.price)}</span>
                    {product.category === 'bundles' && (
                      <span className="text-xs text-emerald-400 font-medium">Bundle Price</span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>

                  <Link
                    href="/presentation/net-terms"
                    className="mt-2 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Apply for Net Terms
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CART SIDEBAR ── */}
      {/* Overlay */}
      {cartOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setCartOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0F172A] border-l border-white/10 z-50 transform transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Cart header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-bold">Your Cart</h3>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                  {cartCount} item{cartCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Your cart is empty</p>
                <p className="text-slate-500 text-sm mt-1">Add products to get started</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-3 rounded-xl bg-muted border border-white/5">
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${item.product.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <item.product.icon className="w-6 h-6 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{item.product.name}</h4>
                    <p className="text-sm text-orange-400 font-medium">{fmt(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ml-auto text-xs text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart footer */}
          {cart.length > 0 && (
            <div className="border-t border-white/10 px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-xl font-bold">{fmt(cartTotal)}</span>
              </div>
              {cartTotal >= 5000 && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Truck className="w-4 h-4" />
                  <span>Free shipping applied</span>
                </div>
              )}
              <Link
                href="/presentation/checkout"
                onClick={() => setCartOpen(false)}
                className="block w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-center transition-all"
              >
                Checkout
              </Link>
              <Link
                href="/presentation/net-terms"
                className="block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium text-center transition-all"
              >
                Apply for Net Terms Instead
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
