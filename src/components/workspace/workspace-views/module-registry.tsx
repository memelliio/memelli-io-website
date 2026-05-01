'use client';

/**
 * Module Registry — Maps module IDs to lazy-loaded WorkspaceView components.
 *
 * WORKSPACE MOUNTING LAW: Every module has TWO render modes:
 *   1. Route Page (with shell) — rendered via Next.js App Router at /dashboard/*
 *   2. WorkspaceView (shell-less) — rendered here inside the workspace tab system
 *
 * Drag/drop and sidebar clicks ALWAYS use WorkspaceView — NEVER full route pages.
 */

import React, { lazy, Suspense, type ComponentType } from 'react';
import { LoadingGlobe } from '../../ui/loading-globe';

// ── Lazy-loaded workspace views ──────────────────────────────────────────────
// Each import points to the actual page component, which renders shell-less content.
// The dashboard layout (AppShell) is NOT included — it's only applied via the route.

const LazyDashboardHome = lazy(() => import('@/app/(dashboard)/dashboard/page'));
const LazyCRM = lazy(() => import('@/app/(dashboard)/dashboard/crm/page'));
const LazyContacts = lazy(() => import('@/app/(dashboard)/dashboard/contacts/page'));
const LazyAnalytics = lazy(() => import('@/app/(dashboard)/dashboard/analytics/page'));
const LazyCommerce = lazy(() => import('@/app/(dashboard)/dashboard/commerce/page'));
const LazyCoaching = lazy(() => import('@/app/(dashboard)/dashboard/coaching/page'));
const LazySEO = lazy(() => import('@/app/(dashboard)/dashboard/seo/page'));
const LazyCredit = lazy(() => import('@/app/(dashboard)/dashboard/credit/page'));
const LazyWorkflows = lazy(() => import('@/app/(dashboard)/dashboard/workflows/page'));
const LazyDocuments = lazy(() => import('@/app/(dashboard)/dashboard/documents/page'));
const LazyAI = lazy(() => import('@/app/(dashboard)/dashboard/ai/page'));
const LazyAdmin = lazy(() => import('@/app/(dashboard)/dashboard/admin/page'));
const LazyNotifications = lazy(() => import('@/app/(dashboard)/dashboard/notifications/page'));
const LazySettings = lazy(() => import('@/app/(dashboard)/dashboard/settings/page'));
const LazyActivities = lazy(() => import('@/app/(dashboard)/dashboard/activities/page'));
const LazyLeads = lazy(() => import('@/app/(dashboard)/dashboard/leads/page'));
const LazyPartners = lazy(() => import('@/app/(dashboard)/dashboard/partners/page'));
const LazyCommunications = lazy(() => import('@/app/(dashboard)/dashboard/communications/page'));
const LazyConversations = lazy(() => import('@/app/(dashboard)/dashboard/conversations/page'));
const LazyContent = lazy(() => import('@/app/(dashboard)/dashboard/content/page'));
const LazyTasks = lazy(() => import('@/app/(dashboard)/dashboard/tasks/page'));
const LazyInsights = lazy(() => import('@/app/(dashboard)/dashboard/insights/page'));
const LazyApproval = lazy(() => import('@/app/(dashboard)/dashboard/approval/page'));
const LazySystemManager = lazy(() => import('@/app/(dashboard)/dashboard/system-manager/page'));
const LazyWebsiteBuilder = lazy(() => import('@/app/(dashboard)/dashboard/website-builder/page'));
const LazyAICompany = lazy(() => import('@/app/(dashboard)/dashboard/ai-company/page'));
const LazyAIAssistant = lazy(() => import('@/app/(dashboard)/dashboard/ai-assistant/page'));
const LazyOrganizations = lazy(() => import('@/app/(dashboard)/dashboard/organizations/page'));
const LazyGrowthHub = lazy(() => import('@/app/(dashboard)/dashboard/analytics/page'));

// ── Registry ─────────────────────────────────────────────────────────────────

export interface ModuleRegistryEntry {
  id: string;
  title: string;
  icon: string;
  component: ComponentType<any>;
  route: string;
}

/**
 * Maps route slugs and module IDs to their shell-less WorkspaceView component.
 * The key is the slug used in /dashboard/{slug}.
 */
const REGISTRY: Record<string, ModuleRegistryEntry> = {
  // Core modules (matching OS_MODULES from os-workspace.tsx)
  'dashboard': { id: 'dashboard', title: 'Dashboard', icon: 'LayoutDashboard', component: LazyDashboardHome, route: '/dashboard' },
  'crm': { id: 'crm', title: 'CRM', icon: 'Users', component: LazyCRM, route: '/dashboard/crm' },
  'contacts': { id: 'contacts', title: 'Contacts', icon: 'Users', component: LazyContacts, route: '/dashboard/contacts' },
  'analytics': { id: 'analytics', title: 'Analytics', icon: 'BarChart3', component: LazyAnalytics, route: '/dashboard/analytics' },
  'commerce': { id: 'commerce', title: 'Commerce', icon: 'ShoppingBag', component: LazyCommerce, route: '/dashboard/commerce' },
  'coaching': { id: 'coaching', title: 'Coaching', icon: 'GraduationCap', component: LazyCoaching, route: '/dashboard/coaching' },
  'seo': { id: 'seo', title: 'SEO', icon: 'Search', component: LazySEO, route: '/dashboard/seo' },
  'credit': { id: 'credit', title: 'Credit', icon: 'CreditCard', component: LazyCredit, route: '/dashboard/credit' },
  'funding': { id: 'funding', title: 'Funding', icon: 'Rocket', component: LazyCredit, route: '/dashboard/credit' },
  'business-credit': { id: 'business-credit', title: 'Business Credit', icon: 'Building2', component: LazyCredit, route: '/dashboard/credit' },
  'workflows': { id: 'workflows', title: 'Workflows', icon: 'Workflow', component: LazyWorkflows, route: '/dashboard/workflows' },
  'formation': { id: 'formation', title: 'Formation', icon: 'Briefcase', component: LazyWorkflows, route: '/dashboard/workflows' },
  'documents': { id: 'documents', title: 'Documents', icon: 'FileText', component: LazyDocuments, route: '/dashboard/documents' },
  'ai': { id: 'ai', title: 'AI Agents', icon: 'Bot', component: LazyAI, route: '/dashboard/ai' },
  'agents': { id: 'agents', title: 'Agents', icon: 'Bot', component: LazyAI, route: '/dashboard/ai' },
  'admin': { id: 'admin', title: 'Admin', icon: 'Shield', component: LazyAdmin, route: '/dashboard/admin' },
  'notifications': { id: 'notifications', title: 'Notifications', icon: 'Bell', component: LazyNotifications, route: '/dashboard/notifications' },
  'settings': { id: 'settings', title: 'Settings', icon: 'Settings', component: LazySettings, route: '/dashboard/settings' },
  'activities': { id: 'activities', title: 'Activities', icon: 'Activity', component: LazyActivities, route: '/dashboard/activities' },
  'activity': { id: 'activity', title: 'Activity', icon: 'Activity', component: LazyActivities, route: '/dashboard/activities' },
  'leads': { id: 'leads', title: 'Leads', icon: 'Target', component: LazyLeads, route: '/dashboard/leads' },
  'partners': { id: 'partners', title: 'Partners', icon: 'Handshake', component: LazyPartners, route: '/dashboard/partners' },
  'communications': { id: 'communications', title: 'Communications', icon: 'MessageSquare', component: LazyCommunications, route: '/dashboard/communications' },
  'conversations': { id: 'conversations', title: 'Conversations', icon: 'MessagesSquare', component: LazyConversations, route: '/dashboard/conversations' },
  'content': { id: 'content', title: 'Content', icon: 'FileEdit', component: LazyContent, route: '/dashboard/content' },
  'tasks': { id: 'tasks', title: 'Tasks', icon: 'CheckSquare', component: LazyTasks, route: '/dashboard/tasks' },
  'insights': { id: 'insights', title: 'Insights', icon: 'TrendingUp', component: LazyInsights, route: '/dashboard/insights' },
  'approval': { id: 'approval', title: 'Approval', icon: 'CheckCircle', component: LazyApproval, route: '/dashboard/approval' },
  'system-manager': { id: 'system-manager', title: 'System Manager', icon: 'Server', component: LazySystemManager, route: '/dashboard/system-manager' },
  'website-builder': { id: 'website-builder', title: 'Website Builder', icon: 'Globe', component: LazyWebsiteBuilder, route: '/dashboard/website-builder' },
  'ai-company': { id: 'ai-company', title: 'AI Company', icon: 'Building2', component: LazyAICompany, route: '/dashboard/ai-company' },
  'ai-assistant': { id: 'ai-assistant', title: 'AI Assistant', icon: 'Bot', component: LazyAIAssistant, route: '/dashboard/ai-assistant' },
  'organizations': { id: 'organizations', title: 'Organizations', icon: 'Building2', component: LazyOrganizations, route: '/dashboard/organizations' },
  'opportunities': { id: 'opportunities', title: 'Opportunities', icon: 'LineChart', component: LazyAnalytics, route: '/dashboard/analytics' },
  'growth-hub': { id: 'growth-hub', title: 'Growth Hub', icon: 'Sprout', component: LazyGrowthHub, route: '/dashboard/growth-hub' },
};

/**
 * Resolve a module by ID, slug, or route path.
 */
export function resolveModule(idOrRoute: string): ModuleRegistryEntry | null {
  // Direct match
  if (REGISTRY[idOrRoute]) return REGISTRY[idOrRoute];

  // Try extracting slug from route path
  const slug = idOrRoute.replace('/dashboard/', '').split('/')[0];
  if (REGISTRY[slug]) return REGISTRY[slug];

  // Try matching by route
  for (const entry of Object.values(REGISTRY)) {
    if (entry.route === idOrRoute) return entry;
  }

  return null;
}

/**
 * Get all registered modules (unique by route to avoid duplicates).
 */
export function getAllModules(): ModuleRegistryEntry[] {
  const seen = new Set<string>();
  const result: ModuleRegistryEntry[] = [];
  for (const entry of Object.values(REGISTRY)) {
    if (!seen.has(entry.route)) {
      seen.add(entry.route);
      result.push(entry);
    }
  }
  return result;
}

// ── Loading fallback ─────────────────────────────────────────────────────────

function ModuleLoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--card))]">
      <LoadingGlobe size="md" />
    </div>
  );
}

// ── WorkspaceView wrapper ────────────────────────────────────────────────────

interface WorkspaceViewProps {
  moduleId: string;
  route?: string;
  context?: Record<string, unknown>;
}

/**
 * Renders a module's content inside the workspace — shell-less, no iframe.
 * This is the ONLY way modules should be rendered inside workspace tabs.
 */
export function WorkspaceView({ moduleId, route, context }: WorkspaceViewProps) {
  const entry = resolveModule(moduleId) || (route ? resolveModule(route) : null);

  if (!entry) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[hsl(var(--card))] gap-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-6 py-4 text-center max-w-sm">
          <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-1">Module not found</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            No workspace view registered for &quot;{moduleId}&quot;
          </p>
        </div>
      </div>
    );
  }

  const Component = entry.component;

  return (
    <div className="h-full w-full overflow-y-auto bg-[hsl(var(--card))] workspace-view-content">
      <Suspense fallback={<ModuleLoadingFallback />}>
        <Component />
      </Suspense>
    </div>
  );
}
