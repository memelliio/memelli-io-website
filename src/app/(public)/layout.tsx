'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/auth';
import MobileNavBar from '../../components/mobile-nav-bar';
import { usePWAInstall } from '../../hooks/usePWAInstall';

/* ── Domain detection ─────────────────────────────────────────────── */

function useIsUniverse(): boolean {
  const [isUniverse, setIsUniverse] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsUniverse(window.location.hostname.startsWith('universe.'));
    }
  }, []);
  return isUniverse;
}

/* ── Link data ────────────────────────────────────────────────────── */

// universe.memelli.com header Products dropdown (10 OS products)
const universeHeaderProducts = [
  { label: 'Commerce', href: 'https://store.memelli.com', desc: 'Online store & payments' },
  { label: 'CRM', href: 'https://crm.memelli.com', desc: 'Customer relationship management' },
  { label: 'Coaching', href: 'https://coaching.memelli.com', desc: 'Client coaching platform' },
  { label: 'Phone', href: 'https://phone.memelli.com', desc: 'Business communications' },
  { label: 'LeadPulse', href: 'https://leads.memelli.com', desc: 'AI-powered lead generation' },
  { label: 'SEO', href: 'https://seo.memelli.com', desc: 'Search engine optimization' },
  { label: 'Credit & Prequal', href: 'https://prequal.memelli.com', desc: 'Credit repair & prequalification' },
  { label: 'Approval', href: 'https://approval.memelli.com', desc: 'Approval management' },
  { label: 'Sites', href: 'https://sites.memelli.com', desc: 'Website builder' },
  { label: 'AI Workforce', href: '/dashboard/ai-company', desc: 'Intelligent business automation' },
];

// memelli.com header Products dropdown
const memelliHeaderProducts = [
  { label: 'Credit & Funding', href: '/credit', desc: 'Credit repair, prequalification & business funding' },
  { label: 'Business Formation', href: '/start', desc: 'Launch and structure your business' },
  { label: 'OmniFlow', href: '/dashboard', desc: 'Workflow automation & business orchestration' },
  { label: 'Coaching', href: '/coaching', desc: 'Client coaching & training programs' },
  { label: 'Commerce', href: '/commerce', desc: 'Online stores, products & payments' },
  { label: 'SEO & Content', href: '/seo', desc: 'AI-powered content & search optimization' },
  { label: 'Communications', href: '/communications', desc: 'Omnichannel messaging, calls & chat' },
];

// memelli.com footer sections
const memelliFooterCompany = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/pricing' },
];

const memelliFooterProducts = [
  { label: 'Credit & Funding', href: '/credit' },
  { label: 'Business Formation', href: '/start' },
  { label: 'Coaching', href: '/coaching' },
  { label: 'Commerce', href: '/commerce' },
  { label: 'SEO & Content', href: '/seo' },
  { label: 'Communications', href: '/communications' },
];

const memelliFooterResources = [
  { label: 'Forum', href: '/forum' },
  { label: 'Blog', href: '/blog' },
  { label: 'Infinity Network', href: '/affiliate' },
];

const memelliFooterLegal = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

// universe.memelli.com footer sections
const universeFooterCompany = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/pricing' },
];

const universeFooterProducts = [
  { label: 'Commerce', href: 'https://store.memelli.com' },
  { label: 'CRM', href: 'https://crm.memelli.com' },
  { label: 'Coaching', href: 'https://coaching.memelli.com' },
  { label: 'Communications', href: 'https://phone.memelli.com' },
  { label: 'SEO', href: 'https://seo.memelli.com' },
  { label: 'Credit & Funding', href: 'https://prequal.memelli.com' },
];

const universeFooterResources = [
  { label: 'Forum', href: '/forum' },
  { label: 'Blog', href: '/blog' },
  { label: 'Infinity Network', href: '/affiliate' },
];

const universeFooterLegal = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

/* ── Shared helpers ──────────────────────────────────────────────── */

function FooterLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const cls = className ?? 'text-[13px] text-muted-foreground transition-colors duration-200 hover:text-muted-foreground';
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

/* ── SVG Icons (inline to avoid lucide dependency) ───────────────── */

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-6 w-6'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-6 w-6'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

/* ── Universe Products Dropdown ──────────────────────────────────── */

function ProductsDropdown({ items }: { items: typeof universeHeaderProducts }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        Products
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {items.map((item) => {
            const isExternal = item.href.startsWith('http');
            const Tag = isExternal ? 'a' : Link;
            const extraProps = isExternal ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};
            return (
              <Tag
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-muted"
                onClick={() => setOpen(false)}
                {...extraProps}
              >
                <span className="block text-[13px] font-medium text-foreground">{item.label}</span>
                <span className="block text-[11px] text-muted-foreground">{item.desc}</span>
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MEMELLI.COM HEADER — Glass nav on zinc-950
   ══════════════════════════════════════════════════════════════════════ */

function MemelliProductsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        Products
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {memelliHeaderProducts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <span className="block text-[13px] font-medium text-foreground">{item.label}</span>
              <span className="block text-[11px] text-muted-foreground">{item.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileInstallButton() {
  const { canInstall, platform, installed, install } = usePWAInstall();
  const [done, setDone] = useState(false);

  const handleInstall = useCallback(async () => {
    if (canInstall) {
      const result = await install();
      if (result === 'accepted') { setDone(true); return; }
    }
    // Guide users to install manually
    alert(
      platform === 'ios'
        ? 'Tap the Share button in Safari → "Add to Home Screen" → Add'
        : 'Open Chrome/Edge → tap the install icon (⊕) in the address bar → Install'
    );
  }, [canInstall, platform, install]);

  if (installed || done) return null;
  const showable = canInstall || platform === 'ios' || platform === 'android' || platform === 'samsung' || platform === 'desktop-chrome' || platform === 'desktop-edge';
  if (!showable) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-semibold text-red-400 transition-all hover:bg-red-500/20"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Install Memelli App
    </button>
  );
}

function InstallHeaderButton() {
  const { canInstall, platform, installed, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const handleInstall = useCallback(async () => {
    if (canInstall) {
      const result = await install();
      if (result === 'accepted') return;
    }
    setShowGuide(true);
  }, [canInstall, install]);

  if (installed) return null;

  // Only show on platforms where install makes sense
  const showable = canInstall || platform === 'ios' || platform === 'android' || platform === 'samsung' || platform === 'desktop-chrome' || platform === 'desktop-edge';
  if (!showable) return null;

  if (showGuide) {
    const steps: Record<string, string[]> = {
      ios: ['Tap the Share button (box with arrow) in Safari', 'Scroll down → tap "Add to Home Screen"', 'Tap "Add" — done!'],
      android: ['Tap the 3-dot menu (⋮) in Chrome', 'Tap "Add to Home screen" or "Install app"', 'Tap "Add" to confirm'],
      samsung: ['Tap the menu icon in Samsung Internet', 'Tap "Add page to" → "Home screen"', 'Tap "Add" to confirm'],
      'desktop-chrome': ['Click the install icon (⊕) in Chrome\'s address bar (far right)', 'Click "Install" in the popup', 'Memelli opens as a native desktop app'],
      'desktop-edge': ['Click the install icon (⊕) in Edge\'s address bar', 'Click "Install" in the popup', 'Memelli opens as a native desktop app'],
    };
    const platformSteps = steps[platform] ?? steps['desktop-chrome'];

    return (
      <div className="absolute right-0 top-full mt-3 z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
        <p className="mb-3 text-[13px] font-semibold text-foreground">Install Memelli App</p>
        <ol className="space-y-2">
          {platformSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl bg-muted px-3 py-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">{i + 1}</span>
              <span className="text-[12px] text-muted-foreground leading-snug">{step}</span>
            </li>
          ))}
        </ol>
        <button onClick={() => setShowGuide(false)} className="mt-3 text-[11px] text-muted-foreground hover:text-muted-foreground transition-colors">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-[12px] font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
        title="Install Memelli as an app"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Install App
      </button>
    </div>
  );
}

function MemelliHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.firstName ?? user?.email?.split('@')[0] ?? '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border" style={{ background: 'rgba(5,5,7,0.72)' }}>
      <div className="mx-auto max-w-[1440px] flex h-16 md:h-[136px] items-center justify-between px-4 md:px-8">
        {/* Zone 1: Brand (left) */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/memelli-logo-white.png"
            alt="Memelli"
            className="h-10 md:h-[120px] w-auto opacity-90"
          />
        </Link>

        {/* Zone 2+3: 4 action buttons (center-right) */}
        {!isLoading && (
          <div className="hidden items-center gap-2 md:flex flex-shrink-0">
            <InstallHeaderButton />
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-[13px] font-bold text-white">
                    {initials}
                  </div>
                  <span className="text-[13px] font-medium text-muted-foreground">{displayName}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-card py-2 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all duration-200 ${
                    userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                  }`}
                >
                  <div className="border-b border-border px-4 py-2.5">
                    <p className="text-[13px] font-medium text-foreground">{displayName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <DashboardIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-red-400 transition-colors duration-150 hover:bg-muted hover:text-red-300"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-white"
                >
                  Pricing
                </Link>
                <Link
                  href="/affiliate"
                  className="rounded-xl border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  Infinity Partner
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-white"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    const onboard = (window as any).__memelliOnboard;
                    if (typeof onboard === 'function') { onboard(); }
                    else { window.location.href = '/register'; }
                  }}
                  className="rounded-xl bg-red-600 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-[hsl(var(--background))] px-4 md:px-8 pb-6 md:pb-8 pt-4 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-1">
            <Link href="/pricing" className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link href="/affiliate" className="rounded-xl px-4 py-3 text-[13px] font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/[0.06]" onClick={() => setMobileOpen(false)}>
              Become Infinity Partner
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <MobileInstallButton />
            {!isLoading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-red-600 px-4 py-3 text-center text-[13px] font-semibold text-white transition-all duration-200 hover:bg-red-500"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="rounded-xl border border-border px-4 py-3 text-center text-[13px] font-medium text-red-400 transition-colors duration-200 hover:bg-muted"
                >
                  Sign Out
                </button>
              </>
            ) : !isLoading ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-border px-4 py-3 text-center text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    const onboard = (window as any).__memelliOnboard;
                    if (typeof onboard === 'function') { onboard(); }
                    else { window.location.href = '/register'; }
                  }}
                  className="rounded-xl bg-red-600 px-4 py-3 text-center text-[13px] font-semibold text-white transition-all duration-200 hover:bg-red-500"
                >
                  Get Started
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   UNIVERSE.MEMELLI.COM HEADER — Glass nav on zinc-950
   ══════════════════════════════════════════════════════════════════════ */

function UniverseHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--background))] backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-[1440px] flex h-16 md:h-[136px] items-center justify-between px-4 md:px-8">
        {/* Zone 1: Brand (left) */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/memelli-logo-white.png"
            alt="Memelli"
            className="h-10 md:h-[120px] w-auto opacity-90"
          />
        </Link>

        {/* Zone 2: Nav (center) */}
        <nav className="hidden items-center gap-8 md:flex">
          <ProductsDropdown items={universeHeaderProducts} />
          <Link href="/affiliate" className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-white">
            Infinity Network
          </Link>
          <Link href="/pricing" className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-white">
            Pricing
          </Link>
          <Link href="/forum" className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-white">
            Forum
          </Link>
        </nav>

        {/* Zone 3: Action (right — Login + Get Started) */}
        <div className="hidden items-center gap-4 md:flex flex-shrink-0">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-red-600 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
              >
                Dashboard
              </Link>
              <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-[13px] font-bold text-white">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-red-600 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-red-600/20 transition-all duration-200 hover:bg-red-500 hover:shadow-red-500/30"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-[hsl(var(--background))] px-4 md:px-8 pb-6 md:pb-8 pt-4 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-1">
            {universeHeaderProducts.map((item) => {
              const isExternal = item.href.startsWith('http');
              return isExternal ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/affiliate"
              className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Infinity Network
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/forum"
              className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Forum
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-red-600 px-4 py-3 text-center text-[13px] font-semibold text-white transition-all duration-200 hover:bg-red-500"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-border px-4 py-3 text-center text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    const onboard = (window as any).__memelliOnboard;
                    if (typeof onboard === 'function') { onboard(); }
                    else { window.location.href = '/register'; }
                  }}
                  className="rounded-xl bg-red-600 px-4 py-3 text-center text-[13px] font-semibold text-white transition-all duration-200 hover:bg-red-500"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MEMELLI.COM FOOTER
   ══════════════════════════════════════════════════════════════════════ */

function MemelliFooter() {
  return (
    <footer className="border-t border-border bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <img src="/memelli-logo-white.png" alt="Memelli" className="h-16 w-auto opacity-80" />
            </Link>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              AI-powered business operating system. One platform, every engine.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Company</h4>
            <nav className="flex flex-col gap-2.5">
              {memelliFooterCompany.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Products</h4>
            <nav className="flex flex-col gap-2.5">
              {memelliFooterProducts.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Resources</h4>
            <nav className="flex flex-col gap-2.5">
              {memelliFooterResources.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              {memelliFooterLegal.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-[11px] text-muted-foreground">&copy; 2026 Memelli. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/forum" className="text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:text-muted-foreground">
              Community Forum
            </Link>
            <Link href="/affiliate" className="text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:text-muted-foreground">
              Infinity Network
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   UNIVERSE.MEMELLI.COM FOOTER
   ══════════════════════════════════════════════════════════════════════ */

function UniverseFooter() {
  return (
    <footer className="border-t border-border bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <img src="/memelli-logo-white.png" alt="Memelli" className="h-16 w-auto opacity-80" />
            </Link>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              The Memelli Universe. AI-powered business operating system.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Company</h4>
            <nav className="flex flex-col gap-2.5">
              {universeFooterCompany.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Products</h4>
            <nav className="flex flex-col gap-2.5">
              {universeFooterProducts.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Resources</h4>
            <nav className="flex flex-col gap-2.5">
              {universeFooterResources.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              {universeFooterLegal.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-[11px] text-muted-foreground">&copy; 2026 Memelli. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/forum" className="text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:text-muted-foreground">
              Community Forum
            </Link>
            <Link href="/affiliate" className="text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:text-muted-foreground">
              Infinity Network
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LAYOUT — switches header/footer/styling by domain
   ══════════════════════════════════════════════════════════════════════ */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const isUniverse = useIsUniverse();
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const { user } = useAuth();

  if (isUniverse) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-foreground pb-14 md:pb-0">
        <UniverseHeader />
        <div className="h-0" aria-hidden="true" />
        <main>{children}</main>
        <UniverseFooter />
        <MobileNavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground pb-14 md:pb-0">
      <MemelliHeader />
      <div className="h-0" aria-hidden="true" />
      <main>{children}</main>
      {!isHomepage && <MemelliFooter />}
      <MobileNavBar />
    </div>
  );
}
