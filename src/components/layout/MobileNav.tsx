'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Crown,
  ShoppingBag,
  Users,
  GraduationCap,
  MessageSquare,
  Target,
  Phone,
  CreditCard,
  CheckCircle,
  Globe,
  LayoutDashboard,
  Bot,
  Settings,
  Home,
  Package,
  Sparkles,
  Terminal,
  Bell,
  X,
  Lock,
  LogOut,
  ChevronRight,
  Tv2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { useUIStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import { useNotificationStore } from '../../stores/notifications';
import { usePermissions } from '../../hooks/usePermissions';
import { useEntitlements } from '../../hooks/useEntitlements';
import { products, type Product } from '@memelli/ui';

// ── Icon lookup ──────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Crown, ShoppingBag, Users, GraduationCap, MessageSquare, Target, Phone,
  CreditCard, CheckCircle, Globe, LayoutDashboard, Bot, Settings,
  Package, Home, Sparkles, Tv2,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

// ── Full-screen menu drawer ─────────────────────────────────────────────────

function MenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const { hasProduct, isLoading: entitlementsLoading } = useEntitlements();

  const displayName =
    (user as { firstName?: string } | null)?.firstName
      ? `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim()
      : user?.email ?? 'User';

  const initial = displayName[0]?.toUpperCase() ?? 'U';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 safe-area-top safe-area-bottom overflow-hidden bg-[hsl(var(--card))]"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-white/[0.05] px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-[hsl(var(--foreground))] tracking-tight">
                Melli OS
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-white/[0.06] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="border-b border-white/[0.05] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/15 border border-red-500/25 text-red-400 text-sm font-bold uppercase">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{displayName}</p>
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto pb-24">
            {Object.values(products).map((product: Product) => {
              const ProductIcon = getIcon(product.icon);
              const entitled = isAdmin() || hasProduct(product.entitlementKey);
              const locked = !entitled && !entitlementsLoading;

              return (
                <div key={product.slug} className="border-b border-white/[0.04]">
                  {/* Product header */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <ProductIcon
                      className={`h-4 w-4 ${locked ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        locked ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--muted-foreground))]'
                      }`}
                    >
                      {product.name}
                    </span>
                    {locked && <Lock className="h-3 w-3 text-[hsl(var(--muted-foreground))] ml-auto" />}
                  </div>

                  {/* Nav items */}
                  <ul className="px-2 pb-3 space-y-0.5">
                    {product.navItems.map((item) => {
                      const Icon = getIcon(item.icon);
                      const active = isActive(item.href);

                      if (locked) {
                        return (
                          <li key={item.href}>
                            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[hsl(var(--muted-foreground))] cursor-not-allowed">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="text-sm">{item.label}</span>
                              <Lock className="h-3 w-3 ml-auto" />
                            </div>
                          </li>
                        );
                      }

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                              active
                                ? 'bg-red-500/10 text-red-400'
                                : 'text-[hsl(var(--foreground))] hover:bg-white/[0.04] active:bg-white/[0.06]'
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`} />
                            <span>{item.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-auto text-[hsl(var(--muted-foreground))]" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* Settings & Logout */}
            <div className="px-2 py-4 space-y-0.5">
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-white/[0.04] transition-colors"
              >
                <Settings className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { onClose(); logout(); router.push('/'); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-500/[0.08] hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Bottom Tab Bar ──────────────────────────────────────────────────────────

interface TabConfig {
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: string;
}

const tabs: TabConfig[] = [
  { label: 'Home',      icon: Home,            href: '/dashboard' },
  { label: 'Live TV',   icon: Tv2,             href: '/dashboard/iptv' },
  { label: 'Workspace', icon: LayoutDashboard, href: '/dashboard', action: 'workspace' },
  { label: 'AI',        icon: Bot,             href: '/dashboard/ai' },
  { label: 'Settings',  icon: Settings,        href: '/dashboard/settings' },
];

export function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const openNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const openWorkspace = useWorkspaceStore?.((s: any) => s.open) ?? null;

  const handleTabPress = useCallback(
    (tab: TabConfig) => {
      if (tab.action === 'workspace' && openWorkspace) {
        openWorkspace();
      } else if (tab.action === 'notifications') {
        openNotificationPanel();
      }
    },
    [openNotificationPanel, openWorkspace],
  );

  const isTabActive = (tab: TabConfig): boolean => {
    if (tab.action === 'workspace') return false; // workspace is a modal, not a route
    if (!tab.href) return false;
    if (tab.href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(tab.href);
  };

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom
          border-t border-white/[0.05] backdrop-blur-xl"
        style={{ background: 'rgba(10,10,10,0.95)' }}
      >
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = isTabActive(tab);
            const Icon = tab.icon;

            const content = (
              <div className="relative flex flex-col items-center justify-center gap-1 w-full h-full">
                {/* Active indicator dot */}
                {active && (
                  <motion.div
                    layoutId="mobile-tab-dot"
                    className="absolute top-2 h-1 w-1 rounded-full bg-red-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <Icon
                  className={`h-5 w-5 transition-colors duration-150 ${
                    active ? 'text-red-500' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                    active ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            );

            // Pure action tab (no href navigation)
            if (tab.action && !tab.href) {
              return (
                <button
                  key={tab.label}
                  onClick={() => handleTabPress(tab)}
                  className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
                  aria-label={tab.label}
                >
                  {content}
                </button>
              );
            }

            // Workspace tab: navigate + fire action
            if (tab.action === 'workspace' && tab.href) {
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  onClick={() => handleTabPress(tab)}
                  className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
                  aria-label={tab.label}
                >
                  {content}
                </Link>
              );
            }

            // Standard nav link
            return (
              <Link
                key={tab.label}
                href={tab.href!}
                className="flex-1 flex items-center justify-center active:bg-white/[0.04] transition-colors"
                aria-label={tab.label}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Full-screen menu drawer */}
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
