'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { useUIStore } from '../stores/ui';
import { useNotificationStore } from '../stores/notifications';

/* ─────────────────────────── Breadcrumb ─────────────────────────── */

const PATH_LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  analytics: 'Analytics',
  settings: 'Settings',
  universe: 'Command Center', // legacy path key (universe), display = Command Center / cockpit — CLAUDE.md
  coaching: 'Coaching',
  seo: 'SEO Traffic',
  prequal: 'PrequalHub',
  activities: 'Activities',
  ai: 'AI',
  tenants: 'Tenants',
  profile: 'Profile',
  login: 'Login',
  register: 'Register',
};

function pathToLabel(segment: string): string {
  return (
    PATH_LABEL_MAP[segment.toLowerCase()] ??
    segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function HeaderBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 3); // max depth: keep it tight

  if (segments.length === 0) {
    return (
      <span className="text-[13px] text-zinc-500 select-none">Home</span>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-[13px]" aria-label="Breadcrumb">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const href = '/' + segments.slice(0, i + 1).join('/');
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-zinc-700 select-none mx-0.5">/</span>
            )}
            {isLast ? (
              <span className="font-medium text-zinc-200 capitalize">
                {pathToLabel(seg)}
              </span>
            ) : (
              <Link
                href={href}
                className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150 capitalize"
              >
                {pathToLabel(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ─────────────────────────── Universal Header ─────────────────────────── */

export default function UniversalHeader() {
  const { user, isLoading, logout } = useAuth();
  const toggleNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const displayName = user
    ? [
        (user as { firstName?: string }).firstName,
        (user as { lastName?: string }).lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      user.email?.split('@')[0] ||
      'User'
    : '';

  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center border-b border-white/[0.04] bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">

        {/* ══ Left — Logo ══ */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Melli OS home"
        >
          <Sparkles className="h-4 w-4 text-red-500 group-hover:text-red-400 transition-colors duration-150" />
          <span className="text-[13px] font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors duration-150">
            Melli OS
          </span>
        </Link>

        {/* ══ Center — Breadcrumb ══ */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <HeaderBreadcrumb />
        </div>

        {/* ══ Right — Actions ══ */}
        <div className="flex items-center gap-1 shrink-0">

          {isLoading ? (
            <div className="h-6 w-16 animate-pulse rounded-md bg-white/[0.06]" />
          ) : user ? (
            <>
              {/* Notification bell */}
              <button
                onClick={toggleNotificationPanel}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors duration-150"
                aria-label="Notifications"
              >
                <Bell className="h-[15px] w-[15px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-[1.5px] ring-[#0a0a0a]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User avatar */}
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-white/[0.08] text-red-400 text-[10px] font-bold uppercase select-none ml-1"
                title={displayName}
                aria-label={`Signed in as ${displayName}`}
              >
                {initial}
              </div>

              {/* Sign out */}
              <button
                onClick={() => logout?.()}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] text-zinc-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors duration-150 ml-0.5"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            /* Not signed in */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-400 transition-colors duration-150"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
