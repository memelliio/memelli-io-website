'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth';

/* SVG Icons (inline to avoid an external dep) */

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

/* Products dropdown data */

const memelliHeaderProducts = [
  { label: 'Credit Repair', href: '/credit', desc: 'Fix & optimize your credit profile' },
  { label: 'Prequalification', href: '/credit', desc: 'See what you qualify for instantly' },
  { label: 'Business Funding', href: '/credit', desc: 'Lines of credit & business cards' },
  { label: 'Primary Tradelines', href: '/credit', desc: 'Build credit history fast' },
  { label: 'Lender Matching', href: '/credit', desc: 'Get matched with the right lenders' },
  { label: 'AI Workforce', href: '/dashboard/ai-company', desc: 'Intelligent automation for your business' },
];

function MemelliProductsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex items-center gap-1 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]"
        onClick={() => setOpen((v) => !v)}
      >
        Products
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="memelli-card absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 p-2">
          {memelliHeaderProducts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="memelli-row-hover block rounded-xl px-3 py-2.5 transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              <span className="block text-[13px] font-medium text-[hsl(var(--foreground))]">{item.label}</span>
              <span className="block text-[11px] text-[hsl(var(--muted-foreground))]">{item.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* MemelliHeader */

function MemelliHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isLoading: authLoading, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.firstName ?? user?.email?.split('@')[0] ?? '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

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
    <header className="sticky top-0 z-50 bg-[hsl(var(--card))]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] flex h-[88px] items-center justify-between px-8">
        {/* Zone 1: Brand (left) */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/memelli-logo.png"
            alt="Memelli"
            className="h-10 w-auto"
          />
        </Link>

        {/* Zone 2: Nav (center) */}
        <nav className="hidden items-center gap-8 md:flex">
          <MemelliProductsDropdown />
          <Link href="/affiliate" className="text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]">
            Infinity Network
          </Link>
          <Link href="/pricing" className="text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]">
            Pricing
          </Link>
          <Link href="/forum" className="text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]">
            Forum
          </Link>
        </nav>

        {/* Zone 3: Action (right) */}
        {!authLoading && (
          <div className="hidden items-center gap-3 md:flex flex-shrink-0">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="memelli-row-hover flex items-center gap-2 rounded-xl px-3 py-2 transition-colors duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[13px] font-bold text-white">
                    {initials}
                  </div>
                  <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{displayName}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`memelli-card absolute right-0 mt-2 w-56 origin-top-right py-2 transition-all duration-200 ${
                    userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                  }`}
                >
                  <div className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{displayName}</p>
                    <p className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="memelli-row-hover flex items-center gap-3 px-4 py-2.5 text-[13px] text-[hsl(var(--foreground))] transition-colors duration-150"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <DashboardIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings/profile"
                    className="memelli-row-hover flex items-center gap-3 px-4 py-2.5 text-[13px] text-[hsl(var(--foreground))] transition-colors duration-150"
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
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-[hsl(var(--primary))] transition-colors duration-150 hover:bg-[hsl(var(--accent))]"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-200 hover:bg-[hsl(var(--muted))]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[hsl(var(--primary))] px-5 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="bg-[hsl(var(--card))] px-8 pb-8 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {memelliHeaderProducts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="memelli-row-hover rounded-xl px-4 py-3 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-150"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/affiliate"
              className="memelli-row-hover rounded-xl px-4 py-3 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-150"
              onClick={() => setMobileOpen(false)}
            >
              Infinity Network
            </Link>
            <Link
              href="/pricing"
              className="memelli-row-hover rounded-xl px-4 py-3 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-150"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/forum"
              className="memelli-row-hover rounded-xl px-4 py-3 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-150"
              onClick={() => setMobileOpen(false)}
            >
              Forum
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-3 text-center text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors duration-200 hover:bg-[hsl(var(--muted))]"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-center text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* Footer */

function MemelliFooter() {
  return (
    <footer className="bg-[hsl(var(--card))] py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">&copy; 2026 Memelli. All rights reserved.</p>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="text-[11px] text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]">Privacy</Link>
          <Link href="/terms" className="text-[11px] text-[hsl(var(--muted-foreground))] transition-colors duration-200 hover:text-[hsl(var(--foreground))]">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

/* Auth Layout */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRegister = pathname === '/register';

  useEffect(() => {
    if (!isLoading && user) {
      // Stay on memelli.io/ — workspace renders there
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col">
      <MemelliHeader />
      <main className="flex flex-1 items-center justify-center py-12 px-4">
        <div className="relative w-full max-w-md">{children}</div>
      </main>
      <MemelliFooter />
    </div>
  );
}
