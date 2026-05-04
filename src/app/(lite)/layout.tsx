'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Link2,
  QrCode,
  Megaphone,
  BarChart3,
  Wallet,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth';

/* ------------------------------------------------------------------ */
/*  Navigation items                                                    */
/* ------------------------------------------------------------------ */

const navItems = [
  { label: 'Overview', href: '/lite', icon: LayoutDashboard },
  { label: 'Referrals', href: '/lite/referrals', icon: Users },
  { label: 'Links', href: '/lite/links', icon: Link2 },
  { label: 'QR Codes', href: '/lite/qr', icon: QrCode },
  { label: 'Marketing', href: '/lite/marketing', icon: Megaphone },
  { label: 'Analytics', href: '/lite/analytics', icon: BarChart3 },
  { label: 'Payouts', href: '/lite/payouts', icon: Wallet },
  { label: 'Notifications', href: '/lite/notifications', icon: Bell },
  { label: 'Help', href: '/lite/help', icon: HelpCircle },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                              */
/* ------------------------------------------------------------------ */

export default function LiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = (() => {
    if (!user) return 'Partner';
    const n = (user as { firstName?: string; email?: string }).firstName;
    if (n) return n;
    return user.email?.split('@')[0] ?? 'Partner';
  })();

  const initials = firstName.slice(0, 2).toUpperCase();

  function isActive(href: string) {
    if (href === '/lite') return pathname === '/lite';
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20">
          M
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-100">Memelli Universe</p>
          <p className="text-[10px] font-medium text-zinc-400">Partner Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-white/[0.08] text-white shadow-sm backdrop-blur-sm'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white/70'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="border-t border-white/[0.04] px-3 py-4">
        <Link
          href="/dashboard/settings/billing"
          className="flex items-center gap-2.5 rounded-xl bg-primary border border-primary/20 px-4 py-3 text-[13px] font-medium text-white transition-all duration-200 hover:bg-primary/90"
        >
          <ChevronUp className="h-4 w-4" />
          <span>Upgrade to Pro</span>
          <Sparkles className="ml-auto h-3.5 w-3.5 text-white/60" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.04] bg-zinc-900/60 backdrop-blur-2xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-[260px] bg-zinc-900/95 backdrop-blur-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.04] bg-zinc-900/60 backdrop-blur-2xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white/70 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-[13px] font-medium text-zinc-400 hidden sm:inline">
              Memelli Universe <span className="text-white/10">|</span> Partner Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link
              href="/lite/notifications"
              className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
            </Link>

            {/* Avatar + tier */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/[0.04] text-[11px] font-semibold text-white/60 ring-1 ring-white/[0.06]">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-white/80">{firstName}</p>
                <p className="inline-flex items-center rounded-lg bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  Lite Partner
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
