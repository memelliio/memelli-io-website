'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home, Tv2, Flame, Map, Bot, Gauge, Workflow, Shield, Download,
  Crown, ShoppingBag, Users, GraduationCap, MessageSquare, Target, Phone,
  CreditCard, CheckCircle, Globe, LayoutDashboard, Settings, Package,
  Sparkles, LogOut, X, Lock, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { useUIStore } from '../../stores/ui';
import { usePermissions } from '../../hooks/usePermissions';
import { useEntitlements } from '../../hooks/useEntitlements';
import { products, type Product } from '@memelli/ui';
import { OS_MODULES } from '../workspace/os-workspace';

// ── Icon lookup ───────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Crown, ShoppingBag, Users, GraduationCap, MessageSquare, Target, Phone,
  CreditCard, CheckCircle, Globe, LayoutDashboard, Bot, Settings, Package,
  Home, Sparkles,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

// ── Primary rail items ────────────────────────────────────────────────────────

const PRIMARY_ITEMS = [
  { icon: Home,     label: 'Home',         href: '/dashboard' },
  { icon: Tv2,      label: 'Live TV',      href: '/dashboard/iptv',    badge: 'LIVE' },
  { icon: Flame,    label: 'Rev Builder',  href: '/dashboard/revenue-builder', badge: 'NEW' },
  { icon: Map,      label: 'Heat Map',     href: '/universe/map',      badge: 'LIVE' },
  { icon: Bot,      label: 'AI Tracker',   href: '/dashboard/ai-tracker', badge: 'LIVE' },
  { icon: Gauge,    label: 'Cockpit',      href: '/dashboard/cockpit' },
  { icon: Workflow, label: 'Workflows',    href: '/dashboard/workflow' },
  { icon: Shield,   label: 'VPN',          href: '/dashboard/vpn' },
  { icon: Download, label: 'Get App',      href: '/desktop-connect' },
];

// ── Menu Item ─────────────────────────────────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  href,
  badge,
  active,
  locked,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  badge?: string;
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  const cls = [
    'relative flex w-full items-center gap-4 px-5 py-4 transition-all duration-150 select-none',
    locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    active
      ? 'bg-[hsl(var(--accent))] border-l-[3px] border-[hsl(var(--primary))] pl-[17px]'
      : 'border-l-[3px] border-transparent hover:bg-[hsl(var(--muted))] hover:border-l-[3px] hover:border-[hsl(var(--primary))]/40',
  ].join(' ');

  const inner = (
    <>
      <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
      <span className={`text-[15px] font-medium ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'}`}>{label}</span>
      {badge && (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[hsl(var(--accent))] text-[hsl(var(--primary))]">
          {badge}
        </span>
      )}
      {locked && <Lock className="ml-auto h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
    </>
  );

  if (locked) return <div className={cls}>{inner}</div>;
  if (onClick) return <button className={cls} onClick={onClick}>{inner}</button>;
  if (href) return <Link href={href} className={cls} onClick={onClick}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

// ── Fire Stick Menu ───────────────────────────────────────────────────────────

export function FireStickMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const open = useUIStore((s) => s.fireStickMenuOpen);
  const close = useUIStore((s) => s.setFireStickMenuOpen);
  const { isAdmin } = usePermissions();
  const { hasProduct, isLoading: entLoading } = useEntitlements();

  const displayName = (user as any)?.firstName
    ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim()
    : user?.email ?? 'User';
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const openModule = useCallback((href: string, label: string) => {
    close(false);
    // External pages — navigate normally
    if (!href.startsWith('/dashboard/') && href !== '/dashboard') {
      router.push(href);
      return;
    }
    if (href === '/dashboard') { router.push('/dashboard'); return; }
    const slug = href.replace('/dashboard/', '').split('/')[0];
    const fn = (window as any).__memelliOpenModule;
    const known = OS_MODULES.some(m => m.id === slug || m.route === href);
    if (fn && known) {
      fn(slug, href, label);
    } else if (known) {
      // Workspace not ready yet — queue the module to open after mount
      const q: string[] = (window as any).__memelliPendingQueue ?? [];
      q.push(slug);
      (window as any).__memelliPendingQueue = q;
      router.push('/dashboard');
    } else {
      router.push(href);
    }
  }, [close, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="firestick-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[hsl(var(--foreground))]/30 backdrop-blur-sm"
            onClick={() => close(false)}
          />

          {/* Menu panel */}
          <motion.aside
            key="firestick-menu"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[hsl(var(--card))]"
            style={{ width: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <span className="text-sm font-bold text-[hsl(var(--foreground))] tracking-tight">Melli OS</span>
              </div>
              <button
                onClick={() => close(false)}
                className="rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>

              {/* Primary items */}
              {PRIMARY_ITEMS.map((item) => (
                <MenuItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  badge={(item as any).badge}
                  active={isActive(item.href)}
                  onClick={() => openModule(item.href, item.label)}
                />
              ))}

              {/* Products */}
              <div className="mt-4 mb-1 px-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Your Apps</p>
              </div>

              {Object.values(products).map((product: Product) => {
                const ProductIcon = getIcon(product.icon);
                const entitled = isAdmin() || hasProduct(product.entitlementKey);
                const locked = !entitled && !entLoading;

                // Show just the product-level entry (first nav item or product overview)
                const mainHref = product.navItems[0]?.href ?? `/dashboard/${product.slug}`;
                const active = product.navItems.some(item => isActive(item.href));

                return (
                  <MenuItem
                    key={product.slug}
                    icon={ProductIcon}
                    label={product.name}
                    href={locked ? undefined : mainHref}
                    active={active}
                    locked={locked}
                    onClick={locked ? undefined : () => openModule(mainHref, product.name)}
                  />
                );
              })}

              {/* Settings */}
              <div className="mt-4 mb-1 px-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Settings</p>
              </div>

              <MenuItem
                icon={Settings}
                label="Settings"
                href="/dashboard/settings"
                active={isActive('/dashboard/settings')}
                onClick={() => close(false)}
              />
            </nav>

            {/* User footer */}
            <div className="border-t border-[hsl(var(--border))] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))] text-sm font-bold uppercase">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{displayName}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { close(false); logout(); router.push('/'); }}
                  className="flex items-center justify-center rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--primary))] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
