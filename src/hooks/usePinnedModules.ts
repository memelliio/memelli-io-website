'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'melli_pinned_modules';

export interface PinnedModule {
  id: string;
  title: string;
  route: string;
  iconName: string;   // lucide icon name
  color: string;      // bg color hex
  accent: string;     // accent color hex
}

const ALL_MODULES: PinnedModule[] = [
  { id: 'crm',           title: 'CRM',            route: '/dashboard/crm',           iconName: 'Users',         color: '#0d1f35', accent: '#3b82f6' },
  { id: 'contacts',      title: 'Contacts',       route: '/dashboard/contacts',      iconName: 'Contact',       color: '#1a1a2e', accent: '#818cf8' },
  { id: 'analytics',     title: 'Analytics',      route: '/dashboard/analytics',     iconName: 'BarChart3',     color: '#1e0f2d', accent: '#ec4899' },
  { id: 'ai',            title: 'AI Agents',      route: '/dashboard/ai',            iconName: 'Bot',           color: '#0a2920', accent: '#10b981' },
  { id: 'tasks',         title: 'Tasks',          route: '/dashboard/tasks',         iconName: 'CheckSquare',   color: '#2d2200', accent: '#fbbf24' },
  { id: 'commerce',      title: 'Commerce',       route: '/dashboard/commerce',      iconName: 'ShoppingBag',   color: '#3b1f00', accent: '#f97316' },
  { id: 'coaching',      title: 'Coaching',       route: '/dashboard/coaching',      iconName: 'GraduationCap', color: '#2d1b4e', accent: '#a78bfa' },
  { id: 'seo',           title: 'SEO',            route: '/dashboard/seo',           iconName: 'Search',        color: '#0f3320', accent: '#4ade80' },
  { id: 'workflows',     title: 'Workflows',      route: '/dashboard/workflows',     iconName: 'Workflow',      color: '#0f1e3b', accent: '#38bdf8' },
  { id: 'leads',         title: 'Leads',          route: '/dashboard/leads',         iconName: 'Zap',           color: '#3b0f0f', accent: '#ef4444' },
  { id: 'communications',title: 'Phone',          route: '/dashboard/communications',iconName: 'Phone',         color: '#0f3320', accent: '#4ade80' },
  { id: 'documents',     title: 'Documents',      route: '/dashboard/documents',     iconName: 'FileText',      color: '#1a1a1a', accent: '#a1a1aa' },
  { id: 'credit',        title: 'Credit',         route: '/dashboard/credit',        iconName: 'CreditCard',    color: '#0a2d1a', accent: '#4ade80' },
  { id: 'iptv',          title: 'Live TV',        route: '/dashboard/iptv',          iconName: 'Tv2',           color: '#1a0a2e', accent: '#818cf8' },
  { id: 'insights',      title: 'Insights',       route: '/dashboard/insights',      iconName: 'BarChart2',     color: '#1e0f2d', accent: '#d8b4fe' },
  { id: 'content',       title: 'Content',        route: '/dashboard/content',       iconName: 'Video',         color: '#2d1b4e', accent: '#f87171' },
  { id: 'activities',    title: 'Activities',     route: '/dashboard/activities',    iconName: 'Activity',      color: '#0f2d1a', accent: '#34d399' },
  { id: 'conversations', title: 'Conversations',  route: '/dashboard/conversations', iconName: 'MessageSquare', color: '#1e1a0f', accent: '#fbbf24' },
  { id: 'approval',      title: 'Approval',       route: '/dashboard/approval',      iconName: 'CheckCircle',   color: '#0f1e3b', accent: '#60a5fa' },
  { id: 'partners',      title: 'Partners',       route: '/dashboard/partners',      iconName: 'Handshake',     color: '#2d1f00', accent: '#f59e0b' },
];

const DEFAULT_PINNED = ['crm', 'ai', 'analytics', 'iptv', 'commerce', 'leads', 'communications', 'credit'];

function readStorage(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as string[];
  } catch {
    // ignore malformed JSON or security errors
  }
  return null;
}

function writeStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore QuotaExceededError or security errors
  }
}

export function usePinnedModules() {
  // Initialise from defaults; the effect below will hydrate from localStorage
  // after mount so the server-rendered HTML matches the first client render.
  const [pinnedIds, setPinnedIds] = useState<string[]>(DEFAULT_PINNED);

  // Hydrate from localStorage once on the client after mount
  useEffect(() => {
    const stored = readStorage();
    if (stored) setPinnedIds(stored);
  }, []);

  const save = useCallback((ids: string[]) => {
    setPinnedIds(ids);
    writeStorage(ids);
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id];
      writeStorage(next);
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinnedIds.includes(id), [pinnedIds]);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedIds(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      writeStorage(next);
      return next;
    });
  }, []);

  const pinned = pinnedIds
    .map(id => ALL_MODULES.find(m => m.id === id))
    .filter((m): m is PinnedModule => m !== undefined);

  return { pinned, allModules: ALL_MODULES, togglePin, isPinned, reorder, save, pinnedIds };
}
