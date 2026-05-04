'use client';

import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GitMerge,
  ClipboardCheck,
  DollarSign,
  BarChart3,
  Megaphone,
  Link2,
  UserCog,
  Palette,
  Bell,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Shield,
  Crown,
  Star,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { useApi } from '../../hooks/useApi';
import { useQuery } from '@tanstack/react-query';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface BrandingConfig {
  logoUrl?: string;
  orgName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  portalTitle?: string;
}

interface ProProfile {
  id: string;
  tier: 'Standard' | 'Premium' | 'Enterprise';
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  branding?: BrandingConfig;
}

/* ------------------------------------------------------------------ */
/*  Branding Context                                                    */
/* ------------------------------------------------------------------ */

const BrandingContext = createContext<BrandingConfig>({});
export function useBranding() {
  return useContext(BrandingContext);
}

/* ------------------------------------------------------------------ */
/*  Navigation items                                                    */
/* ------------------------------------------------------------------ */

const navItems = [
  { label: 'Dashboard', href: '/pro', icon: LayoutDashboard },
  { label: 'Clients', href: '/pro/clients', icon: Users },
  { label: 'Pipeline', href: '/pro/pipeline', icon: GitMerge },
  { label: 'Onboarding', href: '/pro/clients?tab=onboarding', icon: ClipboardCheck },
  { label: 'Pricing', href: '/pro/pricing', icon: DollarSign },
  { label: 'Analytics', href: '/pro/analytics', icon: BarChart3 },
  { label: 'Marketing', href: '/pro/marketing', icon: Megaphone },
  { label: 'Referrals', href: '/pro/referrals', icon: Link2 },
  { label: 'Team', href: '/pro/team', icon: UserCog },
  { label: 'Branding', href: '/pro/branding', icon: Palette },
  { label: 'Notifications', href: '/pro/notifications', icon: Bell },
  { label: 'Help', href: '/pro/help', icon: HelpCircle },
];

/* ------------------------------------------------------------------ */
/*  Tier badge                                                          */
/* ------------------------------------------------------------------ */

function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
    Standard: { bg: 'bg-white/[0.04]', text: 'text-zinc-300', icon: Shield },
    Premium: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Star },
    Enterprise: { bg: 'bg-red-500/10', text: 'text-red-400', icon: Crown },
  };
  const c = config[tier] ?? config.Standard;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <Icon className="h-2.5 w-2.5" />
      {tier}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout                                                              */
/* ------------------------------------------------------------------ */

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const api = useApi();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muaOpen, setMuaOpen] = useState(false);

  // Fetch pro profile + branding
  const { data: profile } = useQuery<ProProfile>({
    queryKey: ['pro-profile'],
    queryFn: async () => {
      const res = await api.get<ProProfile>('/api/pro/me');
      if (res.error || !res.data) throw new Error(res.error ?? 'Failed to load profile');
      return res.data;
    },
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const branding = profile?.branding ?? {};
  const accentColor = branding.accentColor ?? branding.primaryColor ?? '#ef4444';
  const orgName = branding.orgName ?? 'Partner Portal';
  const portalTitle = branding.portalTitle ?? orgName;
  const tier = profile?.tier ?? 'Standard';

  const firstName = (() => {
    if (profile?.firstName) return profile.firstName;
    if (!user) return 'Partner';
    const n = (user as { firstName?: string; email?: string }).firstName;
    if (n) return n;
    return user.email?.split('@')[0] ?? 'Partner';
  })();

  const initials = firstName.slice(0, 2).toUpperCase();
  const roleLabel = profile?.role ?? 'Owner';

  function isActive(href: string) {
    if (href === '/pro') return pathname === '/pro';
    if (href.includes('?')) return pathname === href.split('?')[0];
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-5">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={orgName} className="h-8 w-8 rounded-xl object-cover" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white/90">{portalTitle}</p>
          <TierBadge tier={tier} />
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
                  ? 'text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
              }`}
              style={active ? { backgroundColor: `${accentColor}18`, color: accentColor } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.04] px-4 py-3">
        <p className="text-center text-[10px] text-white/20">
          Powered by Memelli Universe
        </p>
      </div>
    </div>
  );

  return (
    <BrandingContext.Provider value={branding}>
      <div className="flex h-screen bg-[#0a0a0a]">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.04] bg-[#0f0f0f] lg:block">
          {sidebar}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-10 h-full w-64 bg-[#0f0f0f]">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top header */}
          <header className="flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#0f0f0f]/80 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-1.5 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70 lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <span className="hidden text-[13px] font-medium tracking-tight text-white/30 sm:inline">
                Infinity Pro Partner OS
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Link
                href="/pro/notifications"
                className="rounded-xl p-1.5 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
              >
                <Bell className="h-4 w-4" />
              </Link>

              {/* Avatar + role */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/70">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white/80">{firstName}</p>
                  <p className="text-[10px] text-white/30">{roleLabel}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* MUA Floating Button */}
        <button
          onClick={() => setMuaOpen(!muaOpen)}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-red-500/20 transition-all duration-200 hover:scale-105 hover:shadow-red-500/30"
          style={{ backgroundColor: accentColor }}
          title="MUA Assistance"
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </button>

        {/* MUA Panel */}
        {muaOpen && (
          <div className="fixed bottom-20 right-6 z-40 w-80 rounded-2xl border border-white/[0.06] bg-black/60 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                <span className="text-sm font-semibold tracking-tight text-white/90">MUA Pro Assistant</span>
              </div>
              <button onClick={() => setMuaOpen(false)} className="text-white/30 transition-colors hover:text-white/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-white/40">
                Need help? Ask MUA about managing clients, pipeline optimization, or branding.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask MUA..."
                  className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none transition-colors focus:border-red-500/50"
                />
                <button
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110"
                  style={{ backgroundColor: accentColor }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrandingContext.Provider>
  );
}
