'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Check,
  Sparkles,
  Palette,
  Layers,
  Crown,
  Building2,
  MessageSquare,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface BrandPackage {
  id: string;
  name: string;
  price: number | null;
  description: string;
  features: string[];
  icon: React.ReactNode;
  highlight?: boolean;
  tag?: string;
  cta: string;
  ctaStyle: 'primary' | 'secondary' | 'outline';
}

interface CartItem {
  productId: string;
  qty: number;
}

/* ── Package Catalog ───────────────────────────────────────────────── */

const PACKAGES: BrandPackage[] = [
  {
    id: 'brand-starter',
    name: 'Starter Brand',
    price: 149,
    description: 'Everything you need to get started with a professional brand identity.',
    features: [
      'Brand name development',
      'Primary & secondary color palette',
      'Tagline creation',
      '2 revision rounds',
      'Digital delivery (PDF)',
    ],
    icon: <Palette className="h-7 w-7" />,
    cta: 'Add to Cart',
    ctaStyle: 'secondary',
  },
  {
    id: 'brand-business',
    name: 'Business Brand',
    price: 299,
    description: 'A complete brand foundation with logo and typography for serious businesses.',
    features: [
      'Everything in Starter',
      'Logo concept (3 options)',
      'Typography selection',
      'Brand guidelines document',
      'Print-ready files',
      '3 revision rounds',
    ],
    icon: <Layers className="h-7 w-7" />,
    tag: 'Popular',
    cta: 'Add to Cart',
    ctaStyle: 'secondary',
  },
  {
    id: 'brand-premium',
    name: 'Premium Brand',
    price: 499,
    description: 'Full brand presence with website mockup, social kit, and email templates.',
    features: [
      'Everything in Business',
      'Website mockup (homepage + 2 pages)',
      'Social media kit (6 platforms)',
      'Email template pack (5 templates)',
      'Brand voice guide',
      'Icon set (12 custom icons)',
      '5 revision rounds',
    ],
    icon: <Crown className="h-7 w-7" />,
    highlight: true,
    tag: 'Best Value',
    cta: 'Add to Cart',
    ctaStyle: 'primary',
  },
  {
    id: 'brand-enterprise',
    name: 'Enterprise Brand',
    price: 999,
    description: 'Complete brand ecosystem with full website build, marketing materials, and SEO content.',
    features: [
      'Everything in Premium',
      'Full website build (up to 10 pages)',
      'Marketing collateral (brochure, flyer, business card)',
      'SEO content package (5 articles)',
      'Brand launch strategy',
      'Animated logo reveal',
      'Presentation deck (15 slides)',
      'Unlimited revisions (30 days)',
    ],
    icon: <Building2 className="h-7 w-7" />,
    cta: 'Add to Cart',
    ctaStyle: 'secondary',
  },
  {
    id: 'brand-custom',
    name: 'Custom Brand',
    price: null,
    description: 'Need something unique? Let us build a brand package tailored to your exact requirements.',
    features: [
      'Fully custom scope',
      'Dedicated brand strategist',
      'Multi-brand systems',
      'Enterprise integrations',
      'Ongoing brand management',
      'Priority support',
    ],
    icon: <MessageSquare className="h-7 w-7" />,
    cta: 'Contact Us',
    ctaStyle: 'outline',
  },
];

/* ── Cart localStorage ─────────────────────────────────────────────── */

const CART_KEY = 'memelli_cart';

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function BrandPackagesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* ── Cart operations ─────────────────────────────────────────────── */

  const addToCart = useCallback(
    (pkg: BrandPackage) => {
      if (pkg.price === null) return;

      setCart((prev) => {
        const next = [...prev];
        const existing = next.find((c) => c.productId === pkg.id);
        if (existing) {
          showToast(`"${pkg.name}" is already in your cart`);
          return prev;
        }
        next.push({ productId: pkg.id, qty: 1 });
        saveCart(next);
        return next;
      });

      setAddedId(pkg.id);
      setTimeout(() => setAddedId(null), 600);
      showToast(`Added "${pkg.name}" to cart`);
    },
    [showToast],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  /* ── Cart calculations ───────────────────────────────────────────── */

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartSubtotal = cart.reduce((s, c) => {
    const pkg = PACKAGES.find((p) => p.id === c.productId);
    return s + (pkg?.price ? pkg.price * c.qty : 0);
  }, 0);

  const isInCart = (id: string) => cart.some((c) => c.productId === id);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ── Toast ──────────────────────────────────────────────────── */}
      <div
        className={`fixed top-20 right-4 z-[100] rounded-2xl bg-card backdrop-blur-2xl border border-border px-5 py-3.5 text-sm text-foreground shadow-2xl shadow-black/40 transition-all duration-300 ${
          toast ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'
        }`}
      >
        {toast}
      </div>

      {/* ── Cart Sidebar Overlay ───────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-[90] bg-foreground/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      )}
      <div
        className={`fixed top-0 right-0 z-[95] h-full w-full max-w-md bg-[hsl(var(--background))] border-l border-border shadow-2xl shadow-black/60 transition-transform duration-300 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-semibold text-foreground">Cart</h2>
              {cartCount > 0 && (
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">
                  {cartCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium text-muted-foreground">Your cart is empty</p>
                <p className="text-xs mt-1 text-muted-foreground">Choose a brand package to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const pkg = PACKAGES.find((p) => p.id === item.productId);
                  if (!pkg || !pkg.price) return null;
                  return (
                    <div
                      key={item.productId}
                      className="rounded-xl border border-border bg-card p-4 hover:border-border transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">${pkg.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-red-400 transition-colors duration-200 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold text-foreground">${cartSubtotal.toFixed(2)}</span>
              </div>
              <Link
                href="/store/cart"
                className="block w-full rounded-xl bg-red-600 px-6 py-3.5 text-center text-sm font-medium text-white hover:bg-red-500 transition-colors duration-200 shadow-lg shadow-red-600/20"
                onClick={() => setCartOpen(false)}
              >
                Checkout
              </Link>
              <button
                onClick={() => setCartOpen(false)}
                className="block w-full mt-2 rounded-xl border border-border px-6 py-3 text-center text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-red-900/10 via-zinc-950 to-zinc-950 px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Brand Building
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white/90 mb-4">Brand Packages</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light">
          Professional brand identity packages built by AI. From starter kits to full enterprise branding systems.
        </p>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex items-center justify-between">
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Back to Store
          </Link>
          <button
            ref={cartButtonRef}
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2.5 rounded-xl border border-border bg-card backdrop-blur-xl px-5 py-3 text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-200"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg shadow-red-600/30">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Package Grid ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PACKAGES.map((pkg) => {
            const inCart = isInCart(pkg.id);
            const isCustom = pkg.price === null;

            return (
              <div
                key={pkg.id}
                className={`group relative flex flex-col rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${
                  pkg.highlight
                    ? 'border-red-500/20 bg-gradient-to-b from-red-500/[0.06] to-zinc-900/60 hover:border-red-500/40'
                    : isCustom
                      ? 'border-dashed border-border bg-card hover:border-red-500/30'
                      : 'border-border bg-card hover:border-border'
                } ${addedId === pkg.id ? 'ring-2 ring-red-500/40' : ''}`}
              >
                {/* Tag */}
                {pkg.tag && (
                  <div className="absolute top-4 right-4 z-10">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                        pkg.tag === 'Best Value'
                          ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/15 border-red-500/20 text-red-400'
                      }`}
                    >
                      {pkg.tag}
                    </span>
                  </div>
                )}

                {/* Icon + Name + Price */}
                <div className="px-6 pt-7 pb-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      pkg.highlight
                        ? 'bg-gradient-to-br from-red-500/15 to-red-600/10 border-red-500/15 text-red-400 group-hover:from-red-500/25 group-hover:to-red-600/15'
                        : isCustom
                          ? 'bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-border text-muted-foreground group-hover:text-red-400 group-hover:border-red-500/20'
                          : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/10 text-red-400 group-hover:from-red-500/20 group-hover:to-red-600/10'
                    }`}
                  >
                    {pkg.icon}
                  </div>

                  <h3 className="text-base font-semibold text-foreground group-hover:text-white transition-colors duration-200 mt-4">
                    {pkg.name}
                  </h3>

                  {pkg.price !== null ? (
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">${pkg.price}</span>
                      <span className="text-xs text-muted-foreground">one-time</span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-muted-foreground">Custom Pricing</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{pkg.description}</p>
                </div>

                {/* Features Checklist */}
                <div className="px-6 pt-4 pb-2 flex-1">
                  <ul className="space-y-2">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[12px] text-muted-foreground">
                        <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400/70" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 pt-4">
                  {isCustom ? (
                    <Link
                      href="/contact"
                      className="block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-medium text-muted-foreground hover:bg-muted hover:border-border hover:text-white transition-all duration-200"
                    >
                      Contact Us
                    </Link>
                  ) : inCart ? (
                    <button
                      onClick={() => setCartOpen(true)}
                      className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 transition-all duration-200 cursor-pointer hover:bg-emerald-500/15"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        In Cart — View
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => addToCart(pkg)}
                      className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                        pkg.highlight
                          ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 hover:shadow-red-500/30'
                          : 'bg-muted border border-border text-foreground hover:bg-muted/80 hover:border-border'
                      }`}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Comparison Note ──────────────────────────────────────── */}
        <div className="mt-16 rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Not sure which package is right for you?</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Every package builds on the one before it. Start with Starter and upgrade anytime — we will credit your
            previous purchase toward the next tier.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            Talk to our team
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
