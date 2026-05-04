'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Share2,
  Mail,
  FileText,
  Video,
  Crown,
  Check,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  Eye,
  ChevronRight,
  Hash,
  MessageSquare,
  Search as SearchIcon,
  Layers,
  ArrowLeft,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type TagType = 'popular' | 'best-seller' | 'best-value' | 'complete';

interface MarketingKit {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  comparePrice?: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  borderColor: string;
  tags: TagType[];
  includes: string[];
  preview: string[];
  featured?: boolean;
}

interface CartItem {
  productId: string;
  qty: number;
}

/* ── Product Catalog ───────────────────────────────────────────────── */

const KITS: MarketingKit[] = [
  {
    id: 'kit-social-media',
    name: 'Social Media Kit',
    tagline: '30 ready-to-post designs',
    description:
      'Complete social media content package with platform-optimized posts, engaging captions, and trending hashtag sets. Ready to schedule and publish across all major platforms.',
    price: 99,
    icon: <Share2 className="h-7 w-7" />,
    color: 'text-sky-400',
    gradient: 'from-sky-500/15 to-sky-600/5',
    borderColor: 'border-sky-500/15',
    tags: ['popular'],
    includes: [
      '30 designed social media posts',
      'Platform-optimized sizes (IG, FB, LinkedIn, X)',
      'Engaging captions for each post',
      'Trending hashtag sets per niche',
      'Content calendar template',
      'Brand voice guide',
    ],
    preview: [
      'Instagram carousel templates',
      'LinkedIn thought leadership posts',
      'Twitter/X thread starters',
      'Facebook engagement posts',
      'Story templates (10)',
    ],
  },
  {
    id: 'kit-email-campaign',
    name: 'Email Campaign Pack',
    tagline: '10 templates + sequences',
    description:
      'Professional email templates with pre-built automation sequences. Welcome series, nurture campaigns, promotional blasts, and re-engagement flows included.',
    price: 149,
    icon: <Mail className="h-7 w-7" />,
    color: 'text-violet-400',
    gradient: 'from-violet-500/15 to-violet-600/5',
    borderColor: 'border-violet-500/15',
    tags: ['best-seller'],
    includes: [
      '10 responsive email templates',
      'Welcome series (5 emails)',
      'Nurture sequence (7 emails)',
      'Promotional campaign templates',
      'Re-engagement flow',
      'Subject line swipe file (50+)',
      'A/B testing variants',
    ],
    preview: [
      'Welcome email with dynamic greeting',
      'Product showcase template',
      'Newsletter layout',
      'Abandoned cart recovery',
      'Testimonial spotlight',
    ],
  },
  {
    id: 'kit-seo-content',
    name: 'SEO Content Bundle',
    tagline: '20 articles + full keyword strategy',
    description:
      'Authority-building content package with keyword-researched articles, optimized meta descriptions, internal linking strategy, and content cluster mapping.',
    price: 249,
    icon: <FileText className="h-7 w-7" />,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/15 to-emerald-600/5',
    borderColor: 'border-emerald-500/15',
    tags: ['best-value'],
    includes: [
      '20 SEO-optimized articles (1,500+ words)',
      'Keyword research report',
      'Meta titles & descriptions',
      'Internal linking map',
      'Content cluster strategy',
      'Image alt-text recommendations',
      'Schema markup suggestions',
    ],
    preview: [
      'Pillar article (3,000+ words)',
      'How-to guide with steps',
      'Listicle with CTAs',
      'Comparison article',
      'FAQ-rich content piece',
    ],
    featured: true,
  },
  {
    id: 'kit-video-marketing',
    name: 'Video Marketing Pack',
    tagline: '5 scripts + thumbnails + captions',
    description:
      'Complete video content production kit with scripted outlines, attention-grabbing thumbnail designs, closed captions, and platform-specific formatting.',
    price: 399,
    icon: <Video className="h-7 w-7" />,
    color: 'text-amber-400',
    gradient: 'from-amber-500/15 to-amber-600/5',
    borderColor: 'border-amber-500/15',
    tags: [],
    includes: [
      '5 full video scripts (with hooks & CTAs)',
      'Custom thumbnail designs (3 per video)',
      'Closed caption files (SRT)',
      'Video description templates',
      'End screen & card suggestions',
      'Platform formatting guide (YT, TikTok, Reels)',
    ],
    preview: [
      'Explainer video script',
      'Product demo outline',
      'Testimonial interview framework',
      'Behind-the-scenes format',
      'Quick tip / short-form script',
    ],
  },
  {
    id: 'kit-full-suite',
    name: 'Full Marketing Suite',
    tagline: 'Everything in one package',
    description:
      'The complete marketing arsenal. Every kit included at a significant discount. Social, email, SEO, and video — unified brand voice, cross-channel strategy, and maximum impact.',
    price: 699,
    comparePrice: 896,
    icon: <Crown className="h-7 w-7" />,
    color: 'text-red-400',
    gradient: 'from-red-500/15 to-red-600/5',
    borderColor: 'border-red-500/15',
    tags: ['complete'],
    includes: [
      'Social Media Kit (30 posts + captions + hashtags)',
      'Email Campaign Pack (10 templates + sequences)',
      'SEO Content Bundle (20 articles + keywords + meta)',
      'Video Marketing Pack (5 scripts + thumbnails + captions)',
      'Cross-channel content calendar',
      'Unified brand voice document',
      'Marketing strategy playbook',
      'Priority support',
    ],
    preview: [
      '80+ content pieces total',
      'Unified brand messaging',
      'Cross-platform strategy',
      '12-month content roadmap',
      'Performance tracking templates',
    ],
    featured: true,
  },
];

/* ── Tag config ────────────────────────────────────────────────────── */

const TAG_CONFIG: Record<TagType, { label: string; bg: string; text: string }> = {
  popular: { label: 'Popular', bg: 'bg-sky-500/15 border-sky-500/20', text: 'text-sky-400' },
  'best-seller': { label: 'Best Seller', bg: 'bg-violet-500/15 border-violet-500/20', text: 'text-violet-400' },
  'best-value': { label: 'Best Value', bg: 'bg-emerald-500/15 border-emerald-500/20', text: 'text-emerald-400' },
  complete: { label: 'Complete Package', bg: 'bg-red-500/15 border-red-500/20', text: 'text-red-400' },
};

/* ── Cart localStorage ─────────────────────────────────────────────── */

const CART_KEY = 'memelli_marketing_kits_cart';

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

/* ── Fly-to-cart animation ─────────────────────────────────────────── */

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

export default function MarketingKitsPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [previewKit, setPreviewKit] = useState<MarketingKit | null>(null);
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
    (productId: string, buttonEl?: HTMLButtonElement | null) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.productId === productId);
        if (existing) {
          showToast('Already in cart');
          return prev;
        }
        const next = [...prev, { productId, qty: 1 }];
        saveCart(next);
        return next;
      });

      if (buttonEl && cartButtonRef.current) {
        const startRect = buttonEl.getBoundingClientRect();
        const endRect = cartButtonRef.current.getBoundingClientRect();
        createFlyElement(startRect, endRect);
      }

      setAddedId(productId);
      setTimeout(() => setAddedId(null), 600);

      const kit = KITS.find((k) => k.id === productId);
      if (kit) showToast(`Added "${kit.name}" to cart`);
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

  const isInCart = useCallback(
    (productId: string) => cart.some((c) => c.productId === productId),
    [cart],
  );

  /* ── Cart calculations ───────────────────────────────────────────── */

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartSubtotal = cart.reduce((s, c) => {
    const kit = KITS.find((k) => k.id === c.productId);
    return s + (kit ? kit.price * c.qty : 0);
  }, 0);

  const savings = KITS.reduce((s, k) => {
    if (k.comparePrice && k.comparePrice > k.price) {
      const inCart = cart.find((c) => c.productId === k.id);
      if (inCart) return s + (k.comparePrice - k.price) * inCart.qty;
    }
    return s;
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

      {/* ── Preview Modal ──────────────────────────────────────────── */}
      {previewKit && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-foreground/40 backdrop-blur-sm"
            onClick={() => setPreviewKit(null)}
          />
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-[hsl(var(--background))] shadow-2xl shadow-black/60">
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[hsl(var(--background))] backdrop-blur-xl px-6 py-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${previewKit.gradient} border ${previewKit.borderColor} ${previewKit.color}`}
                  >
                    {previewKit.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{previewKit.name}</h2>
                    <p className="text-xs text-muted-foreground">{previewKit.tagline}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewKit(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">{previewKit.description}</p>

                {/* What's included */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">What&apos;s Included</h3>
                  <div className="space-y-2">
                    {previewKit.includes.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview samples */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Preview Samples</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewKit.preview.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${previewKit.color.replace('text-', 'bg-')}`}
                        />
                        <span className="text-xs text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between border-t border-border pt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">${previewKit.price}</span>
                    {previewKit.comparePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${previewKit.comparePrice}
                      </span>
                    )}
                  </div>
                  {isInCart(previewKit.id) ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400">
                      <Check className="h-4 w-4" />
                      In Cart
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        addToCart(previewKit.id, e.currentTarget);
                        setPreviewKit(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 active:scale-95 transition-all duration-200 shadow-lg shadow-red-600/20"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Cart Sidebar Overlay ───────────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[90] bg-foreground/40 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 z-[95] h-full w-full max-w-md bg-[hsl(var(--background))] border-l border-border shadow-2xl shadow-black/60 transition-transform duration-300 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
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

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium text-muted-foreground">Your cart is empty</p>
                <p className="text-xs mt-1 text-muted-foreground">Browse marketing kits to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const kit = KITS.find((k) => k.id === item.productId);
                  if (!kit) return null;
                  return (
                    <div
                      key={item.productId}
                      className="rounded-xl border border-border bg-card p-4 hover:border-border transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${kit.gradient} border ${kit.borderColor} ${kit.color}`}
                          >
                            {kit.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {kit.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{kit.tagline}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-red-400 transition-colors duration-200 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">Qty: 1</span>
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-semibold text-foreground">${kit.price}</p>
                          {kit.comparePrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              ${kit.comparePrice}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-border px-6 py-5">
              {savings > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-400">You save</span>
                  <span className="text-xs font-medium text-emerald-400">-${savings}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold text-foreground">
                  ${cartSubtotal.toFixed(2)}
                </span>
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
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-muted-foreground transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 mb-6 mx-auto block w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          Ready-to-Sell Marketing Kits
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white/90 mb-4">
          Marketing Kits
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-light">
          Complete, professionally crafted marketing packages. Buy once, deploy everywhere.
          Content that converts.
        </p>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-8 mt-10">
          {[
            { label: 'Posts & Articles', value: '50+', icon: <MessageSquare className="h-4 w-4" /> },
            { label: 'Email Templates', value: '10', icon: <Mail className="h-4 w-4" /> },
            { label: 'Video Scripts', value: '5', icon: <Video className="h-4 w-4" /> },
            { label: 'Hashtag Sets', value: '30', icon: <Hash className="h-4 w-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                {stat.icon}
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <p className="text-sm text-muted-foreground">
            {KITS.length} kits available
          </p>
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

        {/* ── Featured Kit (Full Marketing Suite) ────────────────────── */}
        {(() => {
          const suite = KITS.find((k) => k.id === 'kit-full-suite')!;
          return (
            <div
              className={`relative rounded-2xl border border-red-500/10 bg-gradient-to-br from-red-500/[0.04] via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl overflow-hidden mb-8 hover:border-red-500/20 transition-all duration-300 ${
                addedId === suite.id ? 'ring-2 ring-red-500/40' : ''
              }`}
            >
              {/* Discount badge */}
              <div className="absolute top-5 right-5 z-10">
                <div className="rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold text-white shadow-lg shadow-red-600/30">
                  SAVE ${(suite.comparePrice ?? 0) - suite.price}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Left side: info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${suite.gradient} border ${suite.borderColor} ${suite.color}`}
                    >
                      {suite.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">{suite.name}</h2>
                        {suite.tags.map((tag) => {
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
                      <p className="text-sm text-muted-foreground mt-0.5">{suite.tagline}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {suite.description}
                  </p>

                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-bold text-white">${suite.price}</span>
                    {suite.comparePrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${suite.comparePrice}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">one-time</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isInCart(suite.id) ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-400">
                        <Check className="h-4 w-4" />
                        Added to Cart
                      </div>
                    ) : (
                      <button
                        onClick={(e) => addToCart(suite.id, e.currentTarget)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-500 active:scale-95 transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewKit(suite)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Right side: includes list */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-red-400" />
                    Everything Included
                  </h3>
                  <div className="space-y-2.5">
                    {suite.includes.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Individual Kits Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {KITS.filter((k) => k.id !== 'kit-full-suite').map((kit) => (
            <div
              key={kit.id}
              className={`group relative rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden hover:border-border hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 ${
                addedId === kit.id ? 'ring-2 ring-red-500/40' : ''
              }`}
            >
              {/* Tags */}
              {kit.tags.length > 0 && (
                <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                  {kit.tags.map((tag) => {
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

              <div className="p-6">
                {/* Icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${kit.gradient} border ${kit.borderColor} ${kit.color} group-hover:scale-105 transition-transform duration-300`}
                  >
                    {kit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors duration-200">
                      {kit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{kit.tagline}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                  {kit.description}
                </p>

                {/* Includes preview */}
                <div className="space-y-1.5 mb-5">
                  {kit.includes.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400/70" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                  {kit.includes.length > 4 && (
                    <button
                      onClick={() => setPreviewKit(kit)}
                      className="text-xs text-muted-foreground hover:text-red-400 transition-colors duration-200 ml-5"
                    >
                      +{kit.includes.length - 4} more items
                    </button>
                  )}
                </div>

                {/* Price + actions */}
                <div className="flex items-center justify-between border-t border-border pt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">${kit.price}</span>
                    {kit.comparePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${kit.comparePrice}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">one-time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewKit(kit)}
                      className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isInCart(kit.id) ? (
                      <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        In Cart
                      </div>
                    ) : (
                      <button
                        onClick={(e) => addToCart(kit.id, e.currentTarget)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 active:scale-95 transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Comparison Strip ─────────────────────────────────────────── */}
        <div className="mt-16 rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Compare Kits</h2>
            <p className="text-xs text-muted-foreground mt-1">
              See what&apos;s in each package at a glance
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 w-1/3">
                    Feature
                  </th>
                  {KITS.filter((k) => k.id !== 'kit-full-suite').map((kit) => (
                    <th
                      key={kit.id}
                      className={`text-center text-xs font-medium px-4 py-4 ${kit.color}`}
                    >
                      {kit.name.replace(' Kit', '').replace(' Pack', '').replace(' Bundle', '')}
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium text-red-400 px-4 py-4 bg-red-500/[0.03]">
                    Full Suite
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Social media posts', values: ['30', '--', '--', '--', '30'] },
                  { feature: 'Captions & hashtags', values: ['Yes', '--', '--', '--', 'Yes'] },
                  { feature: 'Email templates', values: ['--', '10', '--', '--', '10'] },
                  { feature: 'Email sequences', values: ['--', 'Yes', '--', '--', 'Yes'] },
                  { feature: 'SEO articles', values: ['--', '--', '20', '--', '20'] },
                  { feature: 'Keyword research', values: ['--', '--', 'Yes', '--', 'Yes'] },
                  { feature: 'Video scripts', values: ['--', '--', '--', '5', '5'] },
                  { feature: 'Thumbnails', values: ['--', '--', '--', '15', '15'] },
                  { feature: 'Brand voice guide', values: ['Yes', '--', '--', '--', 'Yes'] },
                  { feature: 'Strategy playbook', values: ['--', '--', '--', '--', 'Yes'] },
                ].map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/[0.02] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                  >
                    <td className="text-xs text-muted-foreground px-6 py-3">{row.feature}</td>
                    {row.values.map((val, j) => (
                      <td
                        key={j}
                        className={`text-center text-xs px-4 py-3 ${
                          j === 4 ? 'bg-red-500/[0.03]' : ''
                        } ${val === '--' ? 'text-zinc-800' : 'text-muted-foreground'}`}
                      >
                        {val === 'Yes' ? (
                          <Check className="h-3.5 w-3.5 mx-auto text-emerald-400" />
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Price row */}
                <tr className="border-t border-border">
                  <td className="text-xs font-medium text-muted-foreground px-6 py-4">Price</td>
                  {KITS.filter((k) => k.id !== 'kit-full-suite').map((kit) => (
                    <td key={kit.id} className="text-center px-4 py-4">
                      <span className="text-sm font-bold text-white">${kit.price}</span>
                    </td>
                  ))}
                  <td className="text-center px-4 py-4 bg-red-500/[0.03]">
                    <span className="text-sm font-bold text-red-400">$699</span>
                    <span className="block text-[10px] text-muted-foreground line-through">$896</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-white/90 mb-3">
            Need a custom marketing package?
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Tell us what you need and our AI builds a tailored marketing kit for your exact brand
            and audience.
          </p>
          <Link
            href="/services/ai-build"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 text-red-400" />
            Request Custom Build
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
