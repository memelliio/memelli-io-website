/**
 * Workspace Views — Shell-less module components for drag/drop and tab mounting.
 *
 * These components render MODULE CONTENT ONLY — no sidebar, no header, no shell chrome.
 * The dashboard shell (AppShell) is rendered ONCE by the layout.
 * Drag/drop and workspace tabs mount these views, never full route pages.
 *
 * @see WORKSPACE_MOUNTING_LAW.md
 */

export { CRMWorkspaceView } from './crm-workspace-view';
export { CommerceWorkspaceView } from './commerce-workspace-view';
export { CoachingWorkspaceView } from './coaching-workspace-view';
export { AnalyticsWorkspaceView } from './analytics-workspace-view';
export { TasksWorkspaceView } from './tasks-workspace-view';
export { CommunicationsWorkspaceView } from './communications-workspace-view';
export { SEOWorkspaceView } from './seo-workspace-view';
export { LeadsWorkspaceView } from './leads-workspace-view';

/* ------------------------------------------------------------------ */
/*  Module Registry                                                    */
/* ------------------------------------------------------------------ */

import type { ComponentType } from 'react';
import { CRMWorkspaceView } from './crm-workspace-view';
import { CommerceWorkspaceView } from './commerce-workspace-view';
import { CoachingWorkspaceView } from './coaching-workspace-view';
import { AnalyticsWorkspaceView } from './analytics-workspace-view';
import { TasksWorkspaceView } from './tasks-workspace-view';
import { CommunicationsWorkspaceView } from './communications-workspace-view';
import { SEOWorkspaceView } from './seo-workspace-view';
import { LeadsWorkspaceView } from './leads-workspace-view';

export interface WorkspaceModuleEntry {
  id: string;
  label: string;
  icon: string;
  component: ComponentType<{ compact?: boolean; context?: Record<string, unknown> }>;
}

/**
 * WORKSPACE_MODULES — The canonical registry of all mountable workspace views.
 *
 * Used by the drag/drop system, tab manager, and UniScreen to load the correct
 * shell-less component for each module. Never mount full route pages in workspace.
 */
export const WORKSPACE_MODULES: Record<string, WorkspaceModuleEntry> = {
  crm: {
    id: 'crm',
    label: 'CRM',
    icon: 'Users',
    component: CRMWorkspaceView,
  },
  commerce: {
    id: 'commerce',
    label: 'Commerce',
    icon: 'ShoppingCart',
    component: CommerceWorkspaceView,
  },
  coaching: {
    id: 'coaching',
    label: 'Coaching',
    icon: 'GraduationCap',
    component: CoachingWorkspaceView,
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart2',
    component: AnalyticsWorkspaceView,
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    component: TasksWorkspaceView,
  },
  communications: {
    id: 'communications',
    label: 'Communications',
    icon: 'MessageSquare',
    component: CommunicationsWorkspaceView,
  },
  seo: {
    id: 'seo',
    label: 'SEO',
    icon: 'Search',
    component: SEOWorkspaceView,
  },
  leads: {
    id: 'leads',
    label: 'Leads',
    icon: 'Flame',
    component: LeadsWorkspaceView,
  },
} as const;

/**
 * Get a workspace module entry by ID.
 * Returns undefined if the module is not registered.
 */
export function getWorkspaceModule(moduleId: string): WorkspaceModuleEntry | undefined {
  return WORKSPACE_MODULES[moduleId];
}

/**
 * Get all registered module IDs.
 */
export function getWorkspaceModuleIds(): string[] {
  return Object.keys(WORKSPACE_MODULES);
}
