'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, LayoutGrid, List, RefreshCw, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { useUIStore } from '../../stores/ui';
import { useNotificationStore } from '../../stores/notifications';
import { useEnvironment } from '../../lib/environment-resolver';

/* ─────────────────────────── Page title map ─────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  crm: 'CRM',
  analytics: 'Analytics',
  activities: 'Activities',
  ai: 'AI',
  settings: 'Settings',
  coaching: 'Coaching',
  seo: 'SEO Traffic',
  prequal: 'PrequalHub',
  tenants: 'Tenants',
  profile: 'Profile',
  universe: 'Command Center', // legacy path key (universe), display = Command Center / cockpit — CLAUDE.md
};

function derivePageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Walk from the deepest segment upward until we find a match
  for (let i = segments.length - 1; i >= 0; i--) {
    const key = segments[i].toLowerCase();
    if (PAGE_TITLES[key]) return PAGE_TITLES[key];
  }
  return 'Dashboard';
}

/* ─────────────────────────── Live Connection Dot ─────────────────────────── */

function LiveDot() {
  const env = useEnvironment();
  const [connected, setConnected] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${env.apiUrl}/api/health`, {
        method: 'GET',
        cache: 'no-store',
      });
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }, [env.apiUrl]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [poll]);

  return (
    <span
      className="relative flex h-1.5 w-1.5"
      title={connected ? 'Connected' : 'Disconnected'}
    >
      {connected && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
      )}
      <span
        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
          connected ? 'bg-emerald-400' : 'bg-[hsl(var(--muted-foreground))]'
        }`}
      />
    </span>
  );
}

/* ─────────────────────────── Top Bar ─────────────────────────── */

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const toggleFireStickMenu = useUIStore((s) => s.toggleFireStickMenu);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageTitle = derivePageTitle(pathname);

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }

  // Keep user/logout in scope for future use (auth checks)
  void user;
  void logout;

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] px-4 lg:px-6">

      {/* ══ Left — Hamburger + page title + live dot ══ */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Fire Stick menu trigger */}
        <button
          onClick={toggleFireStickMenu}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <LiveDot />
        <h1 className="text-[13px] font-medium text-[hsl(var(--foreground))] tracking-tight select-none truncate">
          {pageTitle}
        </h1>
      </div>

      {/* ══ Right — Utility actions ══ */}
      <div className="flex items-center gap-0.5">

        {/* Search / command palette trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Notification bell (compact) */}
        <button
          onClick={toggleNotificationPanel}
          className="relative flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[7px] font-bold text-white ring-[1.5px] ring-[hsl(var(--card))]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <span className="mx-1 h-4 w-px bg-[hsl(var(--border))]" aria-hidden />

        {/* View mode toggle */}
        <button
          onClick={() => setViewMode('grid')}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${
            viewMode === 'grid'
              ? 'text-[hsl(var(--primary))] bg-[hsl(var(--accent))]'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${
            viewMode === 'list'
              ? 'text-[hsl(var(--primary))] bg-[hsl(var(--accent))]'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
        >
          <List className="h-3.5 w-3.5" />
        </button>

        {/* Divider */}
        <span className="mx-1 h-4 w-px bg-[hsl(var(--border))]" aria-hidden />

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors duration-150"
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 transition-transform duration-700 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}
