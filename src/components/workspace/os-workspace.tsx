'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type IDockviewPanelHeaderProps,
  type DockviewApi,
} from 'dockview';
import 'dockview/dist/styles/dockview.css';
import './workspace-theme.css';
import { AnimatePresence, motion } from 'framer-motion';

import { MUADockPanel } from './panels/mua-panel';
import { ModulePanel } from './panels/module-panel';
import { WelcomePanel } from './panels/welcome-panel';
import { VisualReportPanel } from './panels/visual-report-panel';
import { IptvPanel } from './panels/iptv-panel';
import { VpnPanel } from './panels/vpn-panel';
import { AdminClaudePanel } from './panels/admin-claude-panel';
import { OSCommandMenu } from './os-command-menu';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Detachable Tab Header                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DetachableTab({ api, containerApi }: IDockviewPanelHeaderProps) {
  const title = api.title ?? api.id;
  const isActive = api.isActive;

  const handleDetach = (e: React.MouseEvent) => {
    e.stopPropagation();
    const panel = containerApi.getPanel(api.id);
    if (panel) {
      containerApi.addFloatingGroup(panel, {
        x: 120,
        y: 80,
        width: 900,
        height: 600,
      });
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 px-3 h-full group cursor-pointer select-none"
      onClick={() => api.setActive()}
    >
      <span className={`text-[11px] font-semibold tracking-widest uppercase transition-colors ${isActive ? 'text-white' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'}`}>
        {title}
      </span>
      <button
        onClick={handleDetach}
        title="Detach to floating window"
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center justify-center rounded"
        style={{ width: 14, height: 14 }}
      >
        <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 2h3M2 2v3M10 10H7M10 10V7M2 10l8-8" />
        </svg>
      </button>
    </div>
  );
}

const tabComponents = { default: DetachableTab };

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Layout persistence                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const LAYOUT_KEY = 'memelli_os_workspace_layout_v2'; // v2: empty default layout

function saveLayout(api: DockviewApi) {
  try {
    const layout = api.toJSON();
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch { /* ignore */ }
}

function loadLayout(): any | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Module registry                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface OSModule {
  id: string;
  title: string;
  icon: string;
  route: string;
  category: 'core' | 'tools' | 'admin';
}

export const OS_MODULES: OSModule[] = [
  { id: 'funding',          title: 'Funding',          icon: 'Rocket',      route: '/dashboard/credit',          category: 'core' },
  { id: 'credit',           title: 'Credit',           icon: 'CreditCard',  route: '/dashboard/credit',          category: 'core' },
  { id: 'business-credit',  title: 'Business Credit',  icon: 'Building2',   route: '/dashboard/credit',          category: 'core' },
  { id: 'opportunities',    title: 'Opportunities',    icon: 'LineChart',   route: '/dashboard/analytics',       category: 'core' },
  { id: 'crm',              title: 'CRM',              icon: 'Users',       route: '/dashboard/crm',             category: 'core' },
  { id: 'formation',        title: 'Formation',        icon: 'Briefcase',   route: '/dashboard/workflows',       category: 'core' },
  { id: 'documents',        title: 'Documents',        icon: 'FileText',    route: '/dashboard/documents',       category: 'tools' },
  { id: 'workflows',        title: 'Workflows',        icon: 'Workflow',    route: '/dashboard/workflows',       category: 'tools' },
  { id: 'analytics',        title: 'Analytics',        icon: 'BarChart3',   route: '/dashboard/analytics',       category: 'tools' },
  { id: 'seo',              title: 'SEO',              icon: 'Search',      route: '/dashboard/seo',             category: 'tools' },
  { id: 'agents',           title: 'Agents',           icon: 'Bot',         route: '/dashboard/ai',              category: 'admin' },
  { id: 'admin',            title: 'Admin',            icon: 'Shield',      route: '/dashboard/admin',           category: 'admin' },
  { id: 'contacts',         title: 'Contacts',         icon: 'Users',       route: '/dashboard/contacts',        category: 'tools' },
  { id: 'commerce',         title: 'Commerce',         icon: 'ShoppingBag', route: '/dashboard/commerce',        category: 'tools' },
  { id: 'coaching',         title: 'Coaching',         icon: 'GraduationCap', route: '/dashboard/coaching',      category: 'tools' },
  { id: 'notifications',    title: 'Notifications',    icon: 'Bell',        route: '/dashboard/notifications',   category: 'tools' },
  { id: 'settings',         title: 'Settings',         icon: 'Settings',      route: '/dashboard/settings',        category: 'admin' },
  { id: 'communications',  title: 'Communications',   icon: 'Phone',         route: '/dashboard/communications',  category: 'tools' },
  { id: 'leads',           title: 'Leads',            icon: 'Zap',           route: '/dashboard/leads',           category: 'tools' },
  { id: 'partners',        title: 'Partners',         icon: 'Handshake',     route: '/dashboard/partners',        category: 'tools' },
  { id: 'website-builder', title: 'Website Builder',  icon: 'Globe',         route: '/dashboard/website-builder', category: 'tools' },
  { id: 'content',         title: 'Content',          icon: 'Video',         route: '/dashboard/content',         category: 'tools' },
  { id: 'approval',        title: 'Approval',         icon: 'CheckCircle',   route: '/dashboard/approval',        category: 'tools' },
  { id: 'insights',        title: 'Insights',         icon: 'BarChart2',     route: '/dashboard/insights',        category: 'tools' },
  { id: 'tasks',           title: 'Tasks',            icon: 'CheckSquare',   route: '/dashboard/tasks',           category: 'tools' },
  { id: 'activities',      title: 'Activities',       icon: 'Activity',      route: '/dashboard/activities',      category: 'tools' },
  { id: 'conversations',   title: 'Conversations',    icon: 'MessageSquare', route: '/dashboard/conversations',   category: 'tools' },
  { id: 'organizations',   title: 'Organizations',    icon: 'Building',      route: '/dashboard/organizations',   category: 'tools' },
  { id: 'ai-company',      title: 'AI Company',       icon: 'Cpu',           route: '/dashboard/ai-company',      category: 'admin' },
  { id: 'mobile-command',  title: 'Mobile Command',   icon: 'Smartphone',    route: '/dashboard/mobile-command',  category: 'admin' },
  { id: 'speed-lanes',     title: 'Speed Lanes',      icon: 'Gauge',         route: '/dashboard/speed-lanes',     category: 'admin' },
  { id: 'dev-terminal',    title: 'Dev Terminal',     icon: 'Terminal',      route: '/dashboard/dev-terminal',    category: 'admin' },
  { id: 'admin-claude',   title: 'Claude Terminal',  icon: 'Bot',           route: '/dashboard/admin/claude',    category: 'admin' },
  { id: 'iptv',            title: 'IPTV',             icon: 'Tv2',           route: '/dashboard/iptv',            category: 'tools' },
  { id: 'vpn',             title: 'VPN',              icon: 'Shield',        route: '/dashboard/vpn',             category: 'tools' },
  { id: 'revenue-builder', title: 'Rev Builder',      icon: 'Flame',         route: '/dashboard/revenue-builder', category: 'tools' },
  { id: 'cockpit',         title: 'Cockpit',          icon: 'Gauge',         route: '/dashboard/cockpit',         category: 'tools' },
  { id: 'ai-tracker',      title: 'AI Tracker',       icon: 'Bot',           route: '/dashboard/ai-tracker',      category: 'tools' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Panel components registry                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const panelComponents: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  mua: MUADockPanel,
  module: ModulePanel,
  welcome: WelcomePanel,
  'visual-report': VisualReportPanel,
  'iptv': IptvPanel,
  'vpn': VpnPanel,
  'admin-claude': AdminClaudePanel,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Workspace                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function OSWorkspace() {
  const apiRef = useRef<DockviewApi | null>(null);
  const [ready, setReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueueRef = useRef<string[]>([]);

  // Debounced layout save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (apiRef.current) saveLayout(apiRef.current);
    }, 1000);
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    apiRef.current = api;

    // Try to restore saved layout
    const saved = loadLayout();
    if (saved) {
      try {
        api.fromJSON(saved);
        setReady(true);

        // Subscribe to layout changes for persistence
        api.onDidLayoutChange(() => scheduleSave());
        return;
      } catch {
        // If restore fails, fall through to default layout
      }
    }

    // Default layout: start empty — user opens modules from the remote sidebar
    // Subscribe to layout changes
    api.onDidLayoutChange(() => scheduleSave());
    setReady(true);
  }, [scheduleSave]);

  // Open a module panel
  const openModule = useCallback((moduleIdOrSlug: string, href?: string) => {
    const api = apiRef.current;

    // Resolve the module by id, then by href route match, then by dashboard slug
    const mod =
      OS_MODULES.find(m => m.id === moduleIdOrSlug) ||
      (href ? OS_MODULES.find(m => m.route === href) : undefined) ||
      OS_MODULES.find(m => m.route === `/dashboard/${moduleIdOrSlug}`);

    if (!mod) return;

    // Queue the open if the DockviewAPI isn't ready yet
    if (!api) {
      pendingQueueRef.current.push(mod.id);
      return;
    }

    // Check if panel already exists
    const existing = api.getPanel(mod.id);
    if (existing) {
      existing.api.setActive();
      return;
    }

    // Find the main content group (not the MUA group)
    const muaPanel = api.getPanel('mua');
    const welcomePanel = api.getPanel('welcome');
    const referencePanel = welcomePanel || muaPanel;

    // Use a dedicated component if registered for this module id, otherwise use 'module'
    const componentKey = panelComponents[mod.id] ? mod.id : 'module';

    if (referencePanel && referencePanel.id !== 'mua') {
      api.addPanel({
        id: mod.id,
        component: componentKey,
        title: mod.title,
        params: { moduleId: mod.id, route: mod.route, title: mod.title },
        position: { referencePanel: referencePanel.id, direction: 'within' },
      });
    } else {
      api.addPanel({
        id: mod.id,
        component: componentKey,
        title: mod.title,
        params: { moduleId: mod.id, route: mod.route, title: mod.title },
      });
    }
  }, []);

  // Expose openModule globally. Also drain any modules queued before workspace mounted.
  useEffect(() => {
    (window as any).__memelliOpenModule = openModule;
    // Drain pre-mount queue (called by FireStickMenu before workspace ready)
    const queue: string[] = (window as any).__memelliPendingQueue ?? [];
    delete (window as any).__memelliPendingQueue;
    queue.forEach(id => openModule(id));
    return () => { delete (window as any).__memelliOpenModule; };
  }, [openModule]);

  // Drain pending module queue once DockviewAPI is ready
  useEffect(() => {
    if (!ready) return;
    const pending = [...pendingQueueRef.current];
    pendingQueueRef.current = [];
    pending.forEach(id => openModule(id));
  }, [ready, openModule]);

  // Auto-open panels based on the current URL path.
  // Supports direct links like /dashboard/crm, /dashboard/vpn, etc.
  // Works whether the workspace is at /dashboard or / (single-page mode).
  const pathname = usePathname();
  useEffect(() => {
    if (!ready) return;
    // Match any /dashboard/<slug> route
    const match = pathname.match(/^\/dashboard\/([^/]+)/);
    if (match) {
      const slug = match[1];
      openModule(slug);
    }
  }, [pathname, ready, openModule]);

  return (
    <div className="flex flex-col h-full w-full bg-[hsl(var(--background))]">
      {/* Command menu overlay */}
      <OSCommandMenu onOpenModule={openModule} />

      {/* Dockview workspace */}
      <AnimatePresence>
        <motion.div
          className="flex-1 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DockviewReact
            className="dockview-theme-dark memelli-workspace"
            components={panelComponents}
            tabComponents={tabComponents}
            onReady={onReady}
            hideBorders={false}
            disableFloatingGroups={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
