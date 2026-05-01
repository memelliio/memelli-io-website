'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShoppingBag,
  GraduationCap,
  Search,
  CreditCard,
  Rocket,
  Building2,
  Workflow,
  Briefcase,
  FileText,
  Bot,
  Shield,
  Bell,
  Settings,
  Activity,
  Target,
  Handshake,
  MessageSquare,
  MessagesSquare,
  FileEdit,
  CheckSquare,
  TrendingUp,
  CheckCircle,
  Terminal,
  Server,
  Globe,
  LineChart,
  Sprout,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Icon map                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  BarChart3,
  ShoppingBag,
  GraduationCap,
  Search,
  CreditCard,
  Rocket,
  Building2,
  Workflow,
  Briefcase,
  FileText,
  Bot,
  Shield,
  Bell,
  Settings,
  Activity,
  Target,
  Handshake,
  MessageSquare,
  MessagesSquare,
  FileEdit,
  CheckSquare,
  TrendingUp,
  CheckCircle,
  Terminal,
  Server,
  Globe,
  LineChart,
  Sprout,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Module definitions with categories                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

type ModuleCategory = 'Core' | 'Tools' | 'Advanced' | 'Admin';

interface GridModule {
  id: string;
  title: string;
  icon: string;
  category: ModuleCategory;
  status: 'online' | 'offline' | 'warning';
}

const GRID_MODULES: GridModule[] = [
  // Core (9 modules)
  { id: 'dashboard',        title: 'Dashboard',        icon: 'LayoutDashboard', category: 'Core',     status: 'online' },
  { id: 'crm',              title: 'CRM',              icon: 'Users',           category: 'Core',     status: 'online' },
  { id: 'leads',            title: 'Leads',            icon: 'Target',          category: 'Core',     status: 'online' },
  { id: 'contacts',         title: 'Contacts',         icon: 'Users',           category: 'Core',     status: 'online' },
  { id: 'opportunities',    title: 'Opportunities',    icon: 'LineChart',       category: 'Core',     status: 'online' },
  { id: 'commerce',         title: 'Commerce',         icon: 'ShoppingBag',     category: 'Core',     status: 'online' },
  { id: 'credit',           title: 'Credit',           icon: 'CreditCard',      category: 'Core',     status: 'online' },
  { id: 'funding',          title: 'Funding',          icon: 'Rocket',          category: 'Core',     status: 'online' },
  { id: 'business-credit',  title: 'Business Credit',  icon: 'Building2',       category: 'Core',     status: 'online' },

  // Tools (12 modules)
  { id: 'analytics',        title: 'Analytics',        icon: 'BarChart3',       category: 'Tools',    status: 'online' },
  { id: 'insights',         title: 'Insights',         icon: 'TrendingUp',      category: 'Tools',    status: 'online' },
  { id: 'workflows',        title: 'Workflows',        icon: 'Workflow',        category: 'Tools',    status: 'online' },
  { id: 'documents',        title: 'Documents',        icon: 'FileText',        category: 'Tools',    status: 'online' },
  { id: 'tasks',            title: 'Tasks',            icon: 'CheckSquare',     category: 'Tools',    status: 'online' },
  { id: 'content',          title: 'Content',          icon: 'FileEdit',        category: 'Tools',    status: 'online' },
  { id: 'communications',   title: 'Communications',   icon: 'MessageSquare',   category: 'Tools',    status: 'online' },
  { id: 'conversations',    title: 'Conversations',    icon: 'MessagesSquare',  category: 'Tools',    status: 'online' },
  { id: 'seo',              title: 'SEO',              icon: 'Search',          category: 'Tools',    status: 'online' },
  { id: 'coaching',         title: 'Coaching',         icon: 'GraduationCap',   category: 'Tools',    status: 'online' },
  { id: 'notifications',    title: 'Notifications',    icon: 'Bell',            category: 'Tools',    status: 'online' },
  { id: 'approval',         title: 'Approval',         icon: 'CheckCircle',     category: 'Tools',    status: 'online' },

  // Advanced (8 modules)
  { id: 'ai',               title: 'AI Agents',        icon: 'Bot',             category: 'Advanced', status: 'online' },
  { id: 'agents',           title: 'Agents',           icon: 'Bot',             category: 'Advanced', status: 'online' },
  { id: 'ai-company',       title: 'AI Company',       icon: 'Building2',       category: 'Advanced', status: 'online' },
  { id: 'ai-assistant',     title: 'AI Assistant',     icon: 'Bot',             category: 'Advanced', status: 'online' },
  { id: 'website-builder',  title: 'Website Builder',  icon: 'Globe',           category: 'Advanced', status: 'online' },
  { id: 'dev-terminal',     title: 'Dev Terminal',     icon: 'Terminal',        category: 'Advanced', status: 'online' },
  { id: 'formation',        title: 'Formation',        icon: 'Briefcase',       category: 'Advanced', status: 'online' },
  { id: 'growth-hub',       title: 'Growth Hub',       icon: 'Sprout',          category: 'Advanced', status: 'online' },

  // Admin (7 modules)
  { id: 'admin',            title: 'Admin',            icon: 'Shield',          category: 'Admin',    status: 'online' },
  { id: 'settings',         title: 'Settings',         icon: 'Settings',        category: 'Admin',    status: 'online' },
  { id: 'system-manager',   title: 'System Manager',   icon: 'Server',          category: 'Admin',    status: 'online' },
  { id: 'organizations',    title: 'Organizations',    icon: 'Building2',       category: 'Admin',    status: 'online' },
  { id: 'partners',         title: 'Partners',         icon: 'Handshake',       category: 'Admin',    status: 'online' },
  { id: 'activities',       title: 'Activities',       icon: 'Activity',        category: 'Admin',    status: 'online' },
  { id: 'activity',         title: 'Activity',         icon: 'Activity',        category: 'Admin',    status: 'online' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Category grouping                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_ORDER: ModuleCategory[] = ['Core', 'Tools', 'Advanced', 'Admin'];

const CATEGORY_COLORS: Record<ModuleCategory, string> = {
  Core: 'text-emerald-400',
  Tools: 'text-blue-400',
  Advanced: 'text-primary',
  Admin: 'text-amber-400',
};

function groupByCategory(modules: GridModule[]): { category: ModuleCategory; modules: GridModule[] }[] {
  const groups: Record<ModuleCategory, GridModule[]> = {
    Core: [],
    Tools: [],
    Advanced: [],
    Admin: [],
  };
  for (const m of modules) {
    groups[m.category].push(m);
  }
  return CATEGORY_ORDER.map((cat) => ({ category: cat, modules: groups[cat] }));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tile component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TileProps {
  module: GridModule;
  index: number;
  onClick: (moduleId: string) => void;
}

function ModuleTile({ module, index, onClick }: TileProps) {
  const [visible, setVisible] = useState(false);
  const Icon = ICON_MAP[module.icon] ?? LayoutDashboard;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 30 * index);
    return () => clearTimeout(timer);
  }, [index]);

  const statusColor =
    module.status === 'online'
      ? 'bg-emerald-500'
      : module.status === 'warning'
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <button
      type="button"
      onClick={() => onClick(module.id)}
      className={`
        group relative flex flex-col items-center justify-center gap-2
        rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]
        p-3 transition-all duration-300 ease-out
        hover:border-[hsl(var(--border))]/80 hover:bg-[hsl(var(--muted))]
        hover:shadow-[0_0_24px_rgba(52,211,153,0.08)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
      `}
      style={{ transitionDelay: `${30 * index}ms` }}
    >
      {/* Status indicator */}
      <span
        className={`absolute top-2 right-2 h-2 w-2 rounded-full ${statusColor} shadow-[0_0_6px] shadow-current`}
      />

      {/* Icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--card))] transition-colors group-hover:bg-[hsl(var(--card))]">
        <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))] transition-colors group-hover:text-emerald-400" />
      </div>

      {/* Title */}
      <span className="text-[11px] font-medium leading-tight text-[hsl(var(--muted-foreground))] text-center transition-colors group-hover:text-[hsl(var(--foreground))] line-clamp-2">
        {module.title}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Grid component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ModuleGridProps {
  onOpenModule?: (moduleId: string) => void;
}

function ModuleGrid({ onOpenModule }: ModuleGridProps) {
  const groups = groupByCategory(GRID_MODULES);

  const handleClick = (moduleId: string) => {
    // Try the passed callback first, then the global workspace opener
    if (onOpenModule) {
      onOpenModule(moduleId);
      return;
    }
    const globalOpen = (window as any).__memelliOpenModule;
    if (typeof globalOpen === 'function') {
      globalOpen(moduleId);
    }
  };

  let tileIndex = 0;

  return (
    <div className="h-screen w-screen overflow-y-auto bg-[hsl(var(--background))] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Memelli OS</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {GRID_MODULES.length} modules &middot; All systems operational
        </p>
      </div>

      {/* Category groups */}
      <div className="mx-auto max-w-7xl space-y-6">
        {groups.map((group) => {
          if (group.modules.length === 0) return null;
          return (
            <section key={group.category}>
              {/* Category header */}
              <div className="mb-3 flex items-center gap-2">
                <h2 className={`text-xs font-semibold uppercase tracking-widest ${CATEGORY_COLORS[group.category]}`}>
                  {group.category}
                </h2>
                <div className="h-px flex-1 bg-[hsl(var(--muted))]" />
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{group.modules.length} modules</span>
              </div>

              {/* 6-column grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {group.modules.map((mod) => {
                  const idx = tileIndex++;
                  return (
                    <ModuleTile
                      key={mod.id}
                      module={mod}
                      index={idx}
                      onClick={handleClick}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default ModuleGrid;
