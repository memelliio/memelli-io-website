'use client';

import type { IDockviewPanelProps } from 'dockview';
import { useRouter } from 'next/navigation';
import {
  Users, Bot, BarChart3, Tv2, CreditCard, Workflow,
  Flame, Shield, Settings, Gauge, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../contexts/auth';
import { OS_MODULES } from '../os-workspace';

// ── Quick launch tiles ────────────────────────────────────────────────────────

const QUICK_TILES = [
  { id: 'crm',       label: 'CRM',        icon: Users,     moduleId: 'crm',          color: 'from-red-600/20 to-red-900/10',     accent: '#ef4444' },
  { id: 'ai',        label: 'AI Agents',  icon: Bot,       moduleId: 'agents',       color: 'from-violet-600/20 to-violet-900/10', accent: '#10b981' },
  { id: 'analytics', label: 'Analytics',  icon: BarChart3, moduleId: 'analytics',    color: 'from-blue-600/20 to-blue-900/10',    accent: '#3b82f6' },
  { id: 'iptv',      label: 'Live TV',    icon: Tv2,       moduleId: 'iptv',         color: 'from-emerald-600/20 to-emerald-900/10', accent: '#10b981' },
  { id: 'credit',    label: 'Credit',     icon: CreditCard,moduleId: 'credit',       color: 'from-amber-600/20 to-amber-900/10',  accent: '#f59e0b' },
  { id: 'workflows', label: 'Workflows',  icon: Workflow,  moduleId: 'workflows',    color: 'from-orange-600/20 to-orange-900/10', accent: '#f97316' },
  { id: 'revenue',   label: 'Rev Builder',icon: Flame,     moduleId: 'revenue-builder', color: 'from-pink-600/20 to-pink-900/10', accent: '#ec4899' },
  { id: 'vpn',       label: 'VPN',        icon: Shield,    moduleId: 'vpn',          color: 'from-teal-600/20 to-teal-900/10',   accent: '#14b8a6' },
  { id: 'cockpit',   label: 'Cockpit',    icon: Gauge,     moduleId: 'cockpit',      color: 'from-indigo-600/20 to-indigo-900/10', accent: '#f59e0b' },
  { id: 'settings',  label: 'Settings',   icon: Settings,  moduleId: 'settings',     color: 'from-zinc-600/20 to-zinc-900/10',   accent: '#71717a' },
];

// ── Component ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WelcomePanel(_props: IDockviewPanelProps) {
  const router = useRouter();
  const { user } = useAuth();

  const firstName = (user as any)?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const openModule = (moduleId: string) => {
    const fn = (window as any).__memelliOpenModule;
    const known = OS_MODULES.some(m => m.id === moduleId);
    if (fn && known) { fn(moduleId); return; }
    router.push(`/dashboard/${moduleId}`);
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto text-[hsl(var(--foreground))]"
      style={{ background: '#0f0f0f' }}
    >
      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div
        className="relative w-full shrink-0"
        style={{
          minHeight: 200,
          background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--card)) 55%, hsl(var(--muted)) 100%)',
        }}
      >
        {/* Atmospheric red glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 90% at 18% 50%, rgba(180,20,5,0.22) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center h-full px-6 py-8 gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-red-400 mb-2 font-bold">Melli OS</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
              {greeting}, {firstName}
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-5">
              Your workspace is ready. Choose a module to get started.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => openModule('crm')}
                className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-red-900/40"
              >
                Open CRM <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => openModule('iptv')}
                className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--foreground))] transition-all hover:border-emerald-500/30 hover:text-emerald-400"
              >
                <Tv2 className="h-3.5 w-3.5" /> Live TV
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Quick launch grid ─────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-4">
          Quick Launch
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => openModule(tile.moduleId)}
                className={`group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-b ${tile.color} p-4 text-center transition-all duration-200 hover:border-white/[0.12] hover:scale-[1.03] active:scale-[0.98]`}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08]"
                  style={{ background: `${tile.accent}18` }}
                >
                  <Icon className="h-6 w-6" style={{ color: tile.accent }} />
                </div>
                <span className="text-xs font-semibold text-[hsl(var(--foreground))] group-hover:text-white transition-colors">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hint ─────────────────────────────────────────────────── */}
      <div className="mt-auto px-6 pb-6">
        <p className="text-center text-[11px] text-[hsl(var(--muted-foreground))]">
          Press the menu button to browse all modules
        </p>
      </div>
    </div>
  );
}
