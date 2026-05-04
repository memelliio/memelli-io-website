'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth';
import { useUIStore } from '../../stores/ui';
import UniversalHeader from '../../components/universal-header';
// FloatingSphere removed — Melli is now a single global instance via MelliProvider
import LiveAlerts from '../../components/live-alerts';
import {
  Globe,
  LayoutDashboard,
  Building2,
  Globe2,
  Cpu,
  Bot,
  MessageSquare,
  Network,
  BarChart3,
  ShoppingCart,
  CreditCard,
  Users,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Terminal,
  Shield,
  Sparkles,
  Stethoscope,
  GitCompare,
  Layers,
  Radar,
  Gauge,
  Zap,
  Map,
  Eye,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─────────────────────────── Navigation Config ─────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: { label: string; href: string; icon: LucideIcon }[];
}

const NAV_SECTIONS: NavItem[] = [
  { label: 'Universe Map',      href: '/universe/map',             icon: Map },
  { label: 'Command Center',   href: '/universe/command-center',  icon: Radar },
  { label: 'Speed Mode',        href: '/universe/command-center#speed-mode', icon: Gauge },
  { label: 'Overview',          href: '/universe',                icon: LayoutDashboard },
  { label: 'Tenants',           href: '/universe/tenants',        icon: Building2 },
  { label: 'Sites',             href: '/universe/sites',          icon: Globe2 },
  { label: 'Engines',           href: '/universe/engines',        icon: Cpu },
  // { label: 'AI Models',          href: '/universe/ai-models',      icon: Sparkles }, // NEUTRALIZED 2026-04-29 — Wavespeed model browser dead. UGC Factory at /app/ugc owns the canonical Alibaba DashScope model set. See .agent-sync/TEAM_SPEC_UGC_FACTORY.md.
  {
    label: 'AI Workforce',
    href: '/universe/agents',
    icon: Bot,
    children: [
      { label: 'Agent Chat',  href: '/universe/agents/chat',      icon: MessageSquare },
      { label: 'Org Chart',   href: '/universe/agents/org-chart', icon: Network },
    ],
  },
  { label: 'Communications',    href: '/universe/communications', icon: MessageSquare },
  { label: 'Traffic / SEO',     href: '/universe/traffic',        icon: BarChart3 },
  { label: 'SEO Compatibility', href: '/universe/seo-compatibility', icon: Shield },
  { label: 'Commerce',          href: '/universe/commerce',       icon: ShoppingCart },
  { label: 'Credit / Funding',  href: '/universe/credit',         icon: CreditCard },
  { label: 'Affiliates',        href: '/universe/affiliates',     icon: Users },
  { label: 'System Health',     href: '/universe/system',         icon: Activity },
  {
    label: 'Diagnostics',
    href: '/universe/diagnostics',
    icon: Stethoscope,
    children: [
      { label: 'Diff Engine', href: '/universe/diagnostics/diff-engine', icon: GitCompare },
    ],
  },
  { label: 'Agent Pools',       href: '/universe/agent-pools',    icon: Layers },
  { label: 'Universe Terminal', href: '/universe/terminal',       icon: Terminal },
  { label: 'Melli Follower',   href: '/universe/jessica-follower', icon: Eye },
  { label: 'Activation',        href: '/universe/activation',     icon: Zap },
  { label: 'Deploy',            href: '/universe/deploy',         icon: Rocket },
  { label: 'Dev Terminal',      href: '/universe/dev-terminal',   icon: Terminal },
  { label: 'System Guide',      href: '/universe/guide',          icon: BookOpen },
  { label: 'Settings',          href: '/universe/settings',       icon: Settings },
];

/* ─────────────────────────── Layout Component ─────────────────────────── */

export default function UniverseLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auth gate
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <Globe className="absolute inset-0 m-auto h-4 w-4 text-red-400 animate-pulse" />
          </div>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] animate-pulse">Loading Universe Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/universe') return pathname === '/universe';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ═══════════════════════ Universal Header ═══════════════════════ */}
      <div className="relative">
        <UniversalHeader />
        {/* Mobile hamburger — visible only on small screens */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ═══════════════════════ Mobile Sidebar Drawer ═══════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[hsl(220_20%_15%)]/$1 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(var(--card))] overflow-y-auto z-50 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600/15">
                  <Globe className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-[13px] font-semibold text-[hsl(var(--foreground))]">Universe</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Nav items */}
            <nav className="px-2 py-3 space-y-0.5">
              {NAV_SECTIONS.map((item, idx) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <div key={item.href}>
                    {idx === 2 && <div className="my-2 border-t border-[hsl(var(--border))]" />}
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-red-400' : ''}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                    {item.children && active && (
                      <div className="ml-6 mt-0.5 space-y-0.5 pl-2">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                                childActive
                                  ? 'text-red-400'
                                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))]'
                              }`}
                            >
                              <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${childActive ? 'text-red-400' : ''}`} />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* ═══════════════════════ Sidebar ═══════════════════════ */}
      <aside
        className={`hidden md:flex flex-col shrink-0  bg-[hsl(var(--card))] transition-[width] duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo area */}
        <div className="flex h-14 items-center gap-3 border-b border-[hsl(var(--border))] px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600/15">
            <Globe className="h-4 w-4 text-red-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-semibold text-[hsl(var(--foreground))] truncate">
                Memelli Universe
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Command Center
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_SECTIONS.map((item, idx) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isCommandCenter = item.href === '/universe/command-center';
            return (
              <div key={item.href}>
                {/* Separator after Command Center */}
                {idx === 2 && <div className="my-2 border-t border-[hsl(var(--border))]" />}
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                    isCommandCenter
                      ? active
                        ? 'bg-red-600/10 text-red-300 border border-red-500/20 shadow-lg shadow-red-500/5'
                        : 'bg-red-600/[0.06] text-red-400/80 border border-red-500/10 hover:bg-red-600/10 hover:text-red-300'
                      : active
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isCommandCenter ? 'text-red-400' : active ? 'text-red-400' : ''}`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isCommandCenter && !sidebarCollapsed && (
                    <span className="ml-auto relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                  )}
                </Link>
                {/* Sub-items */}
                {item.children && !sidebarCollapsed && active && (
                  <div className="ml-6 mt-0.5 space-y-0.5 pl-2">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                            childActive
                              ? 'text-red-400'
                              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))]'
                          }`}
                        >
                          <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${childActive ? 'text-red-400' : ''}`} />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-[hsl(var(--border))] p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-xl p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--muted-foreground))] transition-colors duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════ Main Area ═══════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      </div>

      {/* Live alert notifications — top-right corner */}
      <LiveAlerts />

      {/* Melli is now rendered globally via MelliProvider + MelliDockPanel in root providers */}
    </div>
  );
}
