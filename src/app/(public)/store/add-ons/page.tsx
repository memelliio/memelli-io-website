'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  BookOpen,
  Presentation,
  Image,
  Mail,
  Share2,
  Globe,
  BarChart3,
  Users,
  SearchCheck,
  Zap,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type ProductCategory = 'all' | 'digital' | 'service' | 'addon';
type TagType = 'popular' | 'new' | 'best-value';

interface AddOnProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  icon: React.ReactNode;
  features: string[];
  tags: TagType[];
  quantityAllowed: boolean;
}

interface CartItem {
  productId: string;
  qty: number;
}

/* ── Product Catalog ───────────────────────────────────────────────── */

const PRODUCTS: AddOnProduct[] = [
  {
    id: 'addon-ebook-template',
    name: 'Marketing Ebook Template',
    description: '9-chapter animated ebook with custom branding, scroll animations, and mobile responsive design.',
    price: 79,
    category: 'digital',
    icon: <BookOpen className="h-7 w-7" />,
    features: ['9-chapter animated ebook', 'Custom branding', 'Scroll animations', 'Mobile responsive'],
    tags: ['popular'],
    quantityAllowed: true,
  },
  {
    id: 'addon-presentation-deck',
    name: 'Presentation Deck (17 slides)',
    description: 'Speaker-ready presentation with keyboard navigation, animated charts, and custom content.',
    price: 99,
    category: 'digital',
    icon: <Presentation className="h-7 w-7" />,
    features: ['Keyboard navigation', 'Animated charts', 'Custom content', 'Speaker-ready'],
    tags: ['new'],
    quantityAllowed: true,
  },
  {
    id: 'addon-banner-pack',
    name: 'Web Banner Pack (5 sizes)',
    description: 'Leaderboard, Rectangle, Skyscraper, Billboard, and Large Rect animated HTML5 banners.',
    price: 49,
    category: 'digital',
    icon: <Image className="h-7 w-7" />,
    features: ['Leaderboard, Rectangle, Skyscraper, Billboard, Large Rect', 'Animated HTML5', 'Ad-network ready'],
    tags: ['best-value'],
    quantityAllowed: true,
  },
  {
    id: 'addon-email-templates',
    name: 'Email Template Pack (10 templates)',
    description: 'Welcome, onboarding, promotional, transactional, and more. SMTP ready and mobile responsive.',
    price: 89,
    category: 'digital',
    icon: <Mail className="h-7 w-7" />,
    features: ['Welcome, onboarding, promotional, transactional, etc.', 'SMTP ready', 'Mobile responsive'],
    tags: ['popular'],
    quantityAllowed: true,
  },
  {
    id: 'addon-social-media-kit',
    name: 'Social Media Kit',
    description: 'Profile banners for Twitter, LinkedIn, Facebook, YouTube plus post and story templates.',
    price: 59,
    category: 'digital',
    icon: <Share2 className="h-7 w-7" />,
    features: ['Profile banners (Twitter, LinkedIn, Facebook, YouTube)', 'Post templates (10)', 'Story templates (5)'],
    tags: ['new'],
    quantityAllowed: true,
  },
  {
    id: 'addon-landing-page',
    name: 'Custom Landing Page',
    description: 'Full page design and build with animations, lead capture form, and SEO optimization.',
    price: 149,
    category: 'service',
    icon: <Globe className="h-7 w-7" />,
    features: ['Full page design + build', 'Animations', 'Lead capture form', 'SEO optimized'],
    tags: ['popular'],
    quantityAllowed: false,
  },
  {
    id: 'addon-dashboard-build',
    name: 'Dashboard Build',
    description: 'Analytics dashboard with charts, counters, data integration, and real-time updates.',
    price: 299,
    category: 'service',
    icon: <BarChart3 className="h-7 w-7" />,
    features: ['Analytics dashboard', 'Charts + counters', 'Data integration', 'Real-time updates'],
    tags: [],
    quantityAllowed: false,
  },
  {
    id: 'addon-client-portal',
    name: 'Client Portal',
    description: 'Login system with document management, status tracking, and built-in messaging.',
    price: 399,
    category: 'service',
    icon: <Users className="h-7 w-7" />,
    features: ['Login system', 'Document management', 'Status tracking', 'Messaging'],
    tags: ['best-value'],
    quantityAllowed: false,
  },
  {
    id: 'addon-seo-audit',
    name: 'SEO Audit + Fix',
    description: 'Full site audit with meta tags, sitemap, robots, speed optimization, and IndexNow submission.',
    price: 199,
    category: 'service',
    icon: <SearchCheck className="h-7 w-7" />,
    features: ['Full site audit', 'Meta tags, sitemap, robots', 'Speed optimization', 'IndexNow submission'],
    tags: ['new'],
    quantityAllowed: false,
  },
  {
    id: 'addon-priority-build',
    name: 'Priority Build (same day)',
    description: 'Rush delivery add-on for any product or service. Guaranteed same-day completion.',
    price: 99,
    category: 'addon',
    icon: <Zap className="h-7 w-7" />,
    features: ['Rush delivery add-on', 'Any product/service', 'Guaranteed same day'],
    tags: ['popular'],
    quantityAllowed: true,
  },
];

/* ── Filter tabs ───────────────────────────────────────────────────── */

const FILTER_TABS: { label: string; value: ProductCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Digital Products', value: 'digital' },
  { label: 'Services', value: 'service' },
  { label: 'Add-ons', value: 'addon' },
];

/* ── Tag config ────────────────────────────────────────────────────── */

const TAG_CONFIG: Record<TagType, { label: string; bg: string; text: string }> = {
  popular: { label: 'Popular', bg: 'bg-red-500/15 border-red-500/20', text: 'text-red-400' },
  new: { label: 'New', bg: 'bg-emerald-500/15 border-emerald-500/20', text: 'text-emerald-400' },
  'best-value': { label: 'Best Value', bg: 'bg-amber-500/15 border-amber-500/20', text: 'text-amber-400' },
};

/* ── Cart localStorage ─────────────────────────────────────────────── */

const CART_KEY = 'memelli_addons_cart';

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

/* ── Fly-to-cart animation helper ──────────────────────────────────── */

function createFlyElement(startRect: DOMRect, endRect: DOMRect) {
  const el = document.createElement('div');
  el.className = 'fixed z-[9999] pointer-events-none';
  el.style.left = `${startRect.left + startRect.width / 2}px`;
  el.style.top = `${startRect.top + startRect.height / 2}px`;
  el.style.width = '12px';
  el.style.height = '12px';
  el.style.borderRadius = '50%';
  el.style.background = '#E11D2E';
  el.style.boxShadow = '0 0 12px #E11D2E';
  el.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.left = `${endRect.left + endRect.width / 2}px`;
    el.style.top = `${endRect.top + endRect.height / 2}px`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.3)';
  });

  setTimeout(() => el.remove(), 700);
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function StoreAddOnsPage() {
  const [activeFilter, setActiveFilter] = useState<ProductCategory>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // Load cart from localStorage
  useEffect(() => {
    setCart(getCart());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* ── Cart operations ─────────────────────────────────────────────── */

  const addToCart = useCallback(
    (productId: string, buttonEl?: HTMLButtonElement | null) => {
      setCart((prev) => {
        const product = PRODUCTS.find((p) => p.id === productId);
        const next = [...prev];
        const existing = next.find((c) => c.productId === productId);
        if (existing) {
          if (product?.quantityAllowed) {
            existing.qty += 1;
          } else {
            showToast('Already in cart');
            return prev;
          }
        } else {
          next.push({ productId, qty: 1 });
        }
        saveCart(next);
        return next;
      });

      // Fly animation
      if (buttonEl && cartButtonRef.current) {
        const startRect = buttonEl.getBoundingClientRect();
        const endRect = cartButtonRef.current.getBoundingClientRect();
        createFlyElement(startRect, endRect);
      }

      setAddedId(productId);
      setTimeout(() => setAddedId(null), 600);

      const product = PRODUCTS.find((p) => p.id === productId);
      if (product) showToast(`Added "${product.name}" to cart`);
    },
    [showToast],
  );

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) => (item.productId === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  /* ── Filtering ───────────────────────────────────────────────────── */

  const filtered = PRODUCTS.filter((p) => {
    const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  /* ── Cart calculations ───────────────────────────────────────────── */

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartSubtotal = cart.reduce((s, c) => {
    const product = PRODUCTS.find((p) => p.id === c.productId);
    return s + (product ? product.price * c.qty : 0);
  }, 0);

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
                <p className="text-xs mt-1 text-muted-foreground">Browse add-ons to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const product = PRODUCTS.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.productId}
                      className="rounded-xl border border-border bg-card p-4 hover:border-border transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">${product.price} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-red-400 transition-colors duration-200 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {product.quantityAllowed ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.productId, -1)}
                              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium text-foreground w-6 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.productId, 1)}
                              className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Qty: 1</span>
                        )}
                        <p className="text-sm font-semibold text-foreground">
                          ${(product.price * item.qty).toFixed(2)}
                        </p>
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
          AI-Built Digital Products & Services
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white/90 mb-4">Store Add-Ons</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light">
          Extend your platform with premium digital products and professional services, built by AI in hours, not weeks.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-10">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.value
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search add-ons..."
                className="w-full rounded-xl border border-border bg-card backdrop-blur-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
              />
            </div>

            {/* Cart button */}
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

        {/* ── Product Grid ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="h-14 w-14 mb-5 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">No add-ons found</p>
            <p className="text-sm mt-1.5">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className={`group relative rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden hover:border-border hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 ${
                  addedId === product.id ? 'ring-2 ring-red-500/40' : ''
                }`}
              >
                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                    {product.tags.map((tag) => {
                      const config = TAG_CONFIG[tag];
                      return (
                        <span
                          key={tag}
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Icon area */}
                <div className="px-6 pt-7 pb-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/10 text-red-400 group-hover:from-red-500/20 group-hover:to-red-600/10 group-hover:border-red-500/20 transition-all duration-300">
                    {product.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-white transition-colors duration-200 mt-3">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{product.description}</p>

                  {/* Features */}
                  <ul className="mt-3 space-y-1">
                    {product.features.slice(0, 3).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-500/50" />
                        {feat}
                      </li>
                    ))}
                    {product.features.length > 3 && (
                      <li className="text-[11px] text-muted-foreground">+{product.features.length - 3} more</li>
                    )}
                  </ul>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between mt-5">
                    <div className="rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/15 px-4 py-1.5">
                      <span className="text-lg font-bold text-white">${product.price}</span>
                    </div>
                    <button
                      onClick={(e) => addToCart(product.id, e.currentTarget)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 active:scale-95 transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ── Custom Request Card ────────────────────────────────── */}
            <Link
              href="/services/ai-build"
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card backdrop-blur-xl overflow-hidden hover:border-red-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 min-h-[320px] px-6"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-border text-muted-foreground group-hover:text-red-400 group-hover:border-red-500/20 transition-all duration-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-muted-foreground group-hover:text-white mt-5 transition-colors duration-200">
                Custom Request
              </h3>
              <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed max-w-[220px]">
                Need something specific? Tell us what you need and our AI builds it.
              </p>
              <div className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors duration-200">
                Start a Build
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
