'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Terminal, Menu, X } from 'lucide-react';

/* ─────────────────────────── Tab Config ─────────────────────────── */

interface TabConfig {
  label: string;
  icon: typeof Home;
  href?: string;
  action?: 'menu';
}

const TABS: TabConfig[] = [
  { label: 'Home',      icon: Home,            href: '/' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Claude',    icon: Terminal,        href: '/universe/terminal-workspace' },
  { label: 'Menu',      icon: Menu,            action: 'menu' },
];

// Map tab hrefs to hero module IDs (loaded inline on homepage for authed users)
const TAB_HERO_MODULE: Record<string, string | null> = {
  '/':                             null,          // clear — show workspace
  '/dashboard':                    'crm',         // open CRM as default workspace tab
  '/universe/terminal-workspace':  'agents',      // AI agents terminal
};

/* ─────────────────────────── Mobile Menu Drawer ─────────────────── */

function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Credit & Funding', href: '/credit' },
    { label: 'Business Formation', href: '/start' },
    { label: 'Coaching', href: '/coaching' },
    { label: 'Commerce', href: '/commerce' },
    { label: 'SEO & Content', href: '/seo' },
    { label: 'Infinity Network', href: '/affiliate' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Login', href: '/login' },
    { label: 'Register', href: '/register' },
  ];

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="absolute bottom-14 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-white/[0.06] bg-zinc-900/95 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
          <span className="text-sm font-semibold text-zinc-100">Menu</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-3 space-y-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ─────────────────────────── Mobile Nav Bar ──────────────────────── */

export default function MobileNavBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY > lastScrollY.current + 10 && currentY > 80) {
      setVisible(false);
    } else if (currentY < lastScrollY.current - 5) {
      setVisible(true);
    }
    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleTab = (tab: TabConfig) => {
    if (tab.action === 'menu') { setMenuOpen(true); return; }

    // On homepage, intercept and load module inline instead of navigating
    if (tab.href && pathname === '/' && typeof window !== 'undefined') {
      const loadHero = (window as any).__memelliLoadHero;
      if (typeof loadHero === 'function') {
        const moduleId = TAB_HERO_MODULE[tab.href];
        loadHero(moduleId ?? null);
        return;
      }
    }
  };

  return (
    <>
      {/* Bottom nav bar — only on screens < 768px */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: 60 }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom" />

        <div className="relative flex h-full items-stretch">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;

            const isClaude = tab.label === 'Claude';
            const activeColor = isClaude ? 'text-blue-400' : 'text-red-400';
            const indicatorColor = isClaude ? 'bg-blue-500' : 'bg-red-500';

            const content = (
              <div className="flex flex-col items-center justify-center gap-0.5 relative">
                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    active ? activeColor : 'text-zinc-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    active ? activeColor : 'text-zinc-500'
                  }`}
                >
                  {tab.label}
                </span>
                {active && (
                  <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${indicatorColor}`} />
                )}
              </div>
            );

            if (tab.href && !tab.action) {
              // Always render as button on homepage — intercept check happens at click time
              if (pathname === '/') {
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleTab(tab)}
                    className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
                  >
                    {content}
                  </button>
                );
              }
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
              >
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Menu drawer */}
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
