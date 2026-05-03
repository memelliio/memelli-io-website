'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspaceTabStore } from '../../stores/workspace-store';
import {
  Crown, ShoppingBag, Users, GraduationCap, MessageSquare, Target, Phone,
  CreditCard, CheckCircle, Globe, LayoutDashboard, Bot, Server, Settings,
  Store, Package, ClipboardList, Tag, BarChart3, GitBranch, Handshake,
  Contact, MessageCircle, Filter, BookOpen, FileText, UserPlus, Award,
  HelpCircle, MessagesSquare, FolderTree, Network, Search, TrendingUp,
  Radio, Send, Video, Upload, PhoneCall, Smartphone, Mail, Voicemail,
  Ticket, ListOrdered, FileBarChart, FolderOpen, Scale, FileEdit,
  CheckSquare, Palette, ChevronLeft, ChevronRight, ChevronDown, LogOut,
  Lock, Clock, Eye, GitCompare, Film, Mic, QrCode, Star, Share2,
  Clapperboard, Music, Camera, ScrollText, Workflow, Inbox, Gavel,
  Landmark, ClipboardCheck, Flame, Map, Gauge, Monitor, Download, Tv2, Shield,
  Home, Sparkles, type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/auth';
import { useUIStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import { usePermissions } from '../../hooks/usePermissions';
import { useEntitlements } from '../../hooks/useEntitlements';
import { products, type Product } from '@memelli/ui';
import { OS_MODULES } from '../workspace/os-workspace';

// ── Icon lookup ──────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Crown, ShoppingBag, Users, GraduationCap, MessageSquare, Target, Phone,
  CreditCard, CheckCircle, Globe, LayoutDashboard, Bot, Server, Settings, Store,
  Package, ClipboardList, Tag, BarChart3, GitBranch, Handshake, Contact,
  MessageCircle, Filter, BookOpen, FileText, UserPlus, Award, HelpCircle,
  MessagesSquare, FolderTree, Network, Search, TrendingUp, Radio, Send,
  Video, Upload, PhoneCall, Smartphone, Mail, Voicemail, Ticket, ListOrdered,
  FileBarChart, FolderOpen, Scale, FileEdit, CheckSquare, Palette,
  Eye, GitCompare, Film, Mic, QrCode, Star, Share2,
  Clapperboard, Music, Camera, ScrollText, Workflow, Inbox, Gavel,
  Landmark, ClipboardCheck, Gauge, Monitor, Download, Flame,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

const ROUTES_WITH_ACTIVITY = new Set([
  '/dashboard/crm',
  '/dashboard/activities',
  '/dashboard/notifications',
  '/dashboard/ai',
]);

// ── Recent Tabs ─────────────────────────────────────────────────────────────

function RecentTabs({ collapsed }: { collapsed: boolean }) {
  const workspaces = useWorkspaceTabStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceTabStore((s) => s.activeWorkspaceId);
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const activeTabId = activeWs?.activeTabId;
  const recentTabs = [...(activeWs?.tabs ?? [])]
    .filter((t) => t.id !== activeTabId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  if (recentTabs.length === 0) return null;
  return (
    <div className="border-t border-[hsl(var(--border))] px-2 py-2">
      {!collapsed && (
        <p className="flex items-center gap-2 px-2 pb-1 text-[9px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          <Clock className="h-3 w-3" /> Recent
        </p>
      )}
      <ul className="space-y-0.5">
        {recentTabs.map((tab) => (
          <li key={tab.id}>
            <button
              onClick={() => useWorkspaceTabStore.getState().switchTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all ${collapsed ? 'justify-center' : ''}`}
              title={tab.title}
            >
              <Clock className="h-3 w-3 shrink-0" />
              {!collapsed && <span className="truncate">{tab.title}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon, label, href, active, collapsed, badge, locked, onClick,
}: {
  icon: LucideIcon; label: string; href?: string; active?: boolean;
  collapsed?: boolean; badge?: string; locked?: boolean; onClick?: () => void;
}) {
  const base = `relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group
    ${collapsed ? 'justify-center px-2' : ''}
    ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    ${active
      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--primary))] pl-[10px]'
      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] border-l-2 border-transparent'
    }`;

  const content = (
    <>
      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'}`} />
      {!collapsed && <span className="truncate text-xs tracking-wide">{label}</span>}
      {!collapsed && badge && (
        <span className="ml-auto text-[8px] font-mono uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{badge}</span>
      )}
      {!collapsed && locked && <Lock className="ml-auto h-3 w-3 text-[hsl(var(--muted-foreground))]" />}
      {!collapsed && ROUTES_WITH_ACTIVITY.has(href ?? '') && !active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
      )}
      {collapsed && ROUTES_WITH_ACTIVITY.has(href ?? '') && !active && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
      )}
    </>
  );

  if (onClick) return <button className={base} onClick={onClick}>{content}</button>;
  if (href) return <Link href={href} className={base}>{content}</Link>;
  return <div className={base}>{content}</div>;
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isAdmin } = usePermissions();
  const { hasProduct, isLoading: entitlementsLoading } = useEntitlements();
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(() => {
    const active = new Set<string>();
    Object.values(products).forEach((p) => {
      if (p.navItems.some((item) => pathname.startsWith(item.href))) active.add(p.slug);
    });
    return active;
  });

  const toggleProduct = (slug: string) =>
    setExpandedProducts((prev) => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const isProductActive = (product: Product) =>
    product.navItems.some((item) => pathname.startsWith(item.href));

  const visibleProducts = isAdmin() ? Object.values(products) : Object.values(products);

  const displayName = (user as any)?.firstName
    ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim()
    : user?.email ?? 'User';
  const initial = displayName[0]?.toUpperCase() ?? 'U';
  const userRole = (user as any)?.role;

  const openModule = (href: string, label: string) => {
    const slug = href.replace('/dashboard/', '').split('/')[0];
    const fn = (window as any).__memelliOpenModule;
    const known = OS_MODULES.some(m => m.id === slug || m.route === href);
    if (fn && known) fn(slug, href, label);
    else router.push(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 z-20 bg-[hsl(var(--foreground))]/30 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={`
        relative z-30 flex h-screen flex-col
        bg-[hsl(var(--card))]
        transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
        max-lg:fixed max-lg:left-0 max-lg:top-0
        ${collapsed ? 'max-lg:-translate-x-full' : 'max-lg:translate-x-0'}
      `}>

        {/* ── Logo / Brand ───────────────────────────────────────── */}
        <div className={`flex h-14 items-center px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--accent))]">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">Melli OS</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--accent))]">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
            </Link>
          )}
          {!collapsed && (
            <button onClick={toggleSidebar} className="rounded-lg p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {collapsed && (
            <button onClick={toggleSidebar} className="absolute -right-3 top-4 z-40 rounded-full bg-[hsl(var(--card))] p-0.5 shadow-lg">
              <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            </button>
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent">

          {/* ── PRIMARY RAIL — always visible ─────────────────────── */}
          <NavItem icon={Home}       label="Home"          href="/dashboard"             active={isActive('/dashboard')} collapsed={collapsed} />
          <NavItem icon={Tv2}        label="Live TV"       href="/dashboard/iptv"        active={isActive('/dashboard/iptv')} collapsed={collapsed} badge="LIVE" />
          <NavItem icon={Flame}      label="Rev Builder"   href="/dashboard/revenue-builder" active={isActive('/dashboard/revenue-builder')} collapsed={collapsed} badge="NEW" />
          <NavItem icon={Map}        label="Heat Map"      href="/universe/map"           active={pathname.startsWith('/universe/map')} collapsed={collapsed} badge="LIVE" />
          <NavItem icon={Bot}        label="AI Tracker" href="/dashboard/ai-tracker" active={isActive('/dashboard/ai-tracker')} collapsed={collapsed} badge="LIVE" />
          <NavItem icon={Gauge}      label="Cockpit"    href="/dashboard/cockpit"    active={pathname === '/dashboard/cockpit'} collapsed={collapsed} />
          <NavItem icon={Workflow}   label="Workflows"  href="/dashboard/workflow"   active={isActive('/dashboard/workflow')} collapsed={collapsed} />
          <NavItem icon={Shield}     label="VPN"        href="/dashboard/vpn"        active={isActive('/dashboard/vpn')} collapsed={collapsed} />
          <NavItem icon={Download}   label="Get App"    href="/desktop-connect"      active={pathname.startsWith('/desktop-connect')} collapsed={collapsed} />

          {/* ── SECTION DIVIDER ───────────────────────────────────── */}
          {!collapsed && (
            <p className="px-3 pt-4 pb-1 text-[9px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Your Apps
            </p>
          )}
          {collapsed && <div className="my-2 mx-3 border-t border-[hsl(var(--border))]" />}

          {/* ── PRODUCT GROUPS ────────────────────────────────────── */}
          {visibleProducts.map((product: Product) => {
            const ProductIcon = getIcon(product.icon);
            const productActive = isProductActive(product);
            const entitled = isAdmin() || hasProduct(product.entitlementKey);
            const locked = !entitled && !entitlementsLoading;
            const expanded = expandedProducts.has(product.slug);

            return (
              <div key={product.slug}>
                {/* Group header */}
                <button
                  onClick={() => !collapsed && toggleProduct(product.slug)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200
                    ${collapsed ? 'justify-center px-2' : ''}
                    ${productActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}
                    ${locked ? 'opacity-40' : ''}
                  `}
                  title={collapsed ? product.name : undefined}
                >
                  <ProductIcon className={`h-4 w-4 shrink-0 ${productActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
                  {!collapsed && (
                    <>
                      <span className="font-medium uppercase tracking-wider text-[10px]">{product.name}</span>
                      {locked && <Lock className="ml-auto h-2.5 w-2.5 text-[hsl(var(--muted-foreground))]" />}
                      {!locked && (
                        <ChevronDown className={`ml-auto h-3 w-3 text-[hsl(var(--muted-foreground))] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      )}
                    </>
                  )}
                </button>

                {/* Nav items */}
                {(collapsed || expanded) && (
                  <ul className="space-y-0.5">
                    {product.navItems.map((item) => {
                      const Icon = getIcon(item.icon);
                      const active = isActive(item.href);
                      if ((item as any).comingSoon) return (
                        <li key={item.href}>
                          <div className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] cursor-default ${collapsed ? 'justify-center px-2' : ''}`}>
                            <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                            {!collapsed && <><span className="truncate">{item.label}</span><span className="ml-auto text-[8px] text-[hsl(var(--muted-foreground))] uppercase">Soon</span></>}
                          </div>
                        </li>
                      );
                      if (locked) return (
                        <li key={item.href}>
                          <div className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] cursor-not-allowed ${collapsed ? 'justify-center px-2' : ''}`}>
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>
                        </li>
                      );
                      const isWriteAction = item.label.toLowerCase().includes('create') || item.label.toLowerCase().includes('new');
                      if (userRole === 'VIEWER' && isWriteAction) return null;
                      const isDragging = draggingItem === item.href;

                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              setDraggingItem(item.href);
                              e.dataTransfer.setData('application/memelli-module', JSON.stringify({ href: item.href, label: item.label, icon: item.icon }));
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onDragEnd={() => setDraggingItem(null)}
                            onClick={() => openModule(item.href, item.label)}
                            className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer active:cursor-grabbing
                              ${collapsed ? 'justify-center px-2' : ''}
                              ${active
                                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--primary))] pl-[10px]'
                                : isDragging
                                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-l-2 border-[hsl(var(--border))] scale-[1.02]'
                                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] border-l-2 border-transparent'
                              }`}
                            title={collapsed ? item.label : `${item.label} — click to open, drag to workspace`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${active || isDragging ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
                            {!collapsed && <span className="truncate text-left">{item.label}</span>}
                            {!collapsed && ROUTES_WITH_ACTIVITY.has(item.href) && !active && !isDragging && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                            )}
                            {collapsed && ROUTES_WITH_ACTIVITY.has(item.href) && !active && (
                              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Recent ─────────────────────────────────────────────── */}
        <RecentTabs collapsed={collapsed} />

        {/* ── User ───────────────────────────────────────────────── */}
        <div className="border-t border-[hsl(var(--border))] p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))] text-xs font-bold uppercase">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[hsl(var(--foreground))]">{displayName}</p>
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors py-0.5"
                >
                  <LogOut className="h-2.5 w-2.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
