'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  Activity,
  CheckSquare,
  ShoppingBag,
  GitMerge,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Settings,
  ArrowRight,
  Clock,
  Zap,
  Terminal,
  UserPlus,
  FileText,
  CreditCard,
  BarChart3,
  Hash,
  Command,
  Star,
  Columns,
  PanelRight,
  Maximize,
  XCircle,
  Eye,
  RefreshCw,
  GitCompare,
  Save,
  BookmarkPlus,
  FolderOpen,
  Layers,
  Plus,
  Pin,
  HeartPulse,
  RotateCcw,
  Pause,
  Play,
  Workflow,
  List,
  ChevronRight,
  Navigation,
  Monitor,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { API_URL as API } from '@/lib/config';

import { LoadingGlobe } from '@/components/ui/loading-globe';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CommandCategory =
  | 'navigation'
  | 'surface'
  | 'report'
  | 'saved-view'
  | 'workspace'
  | 'agent'
  | 'automation'
  | 'ai'
  | 'quick-action';

interface CommandDef {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: CommandCategory;
  keywords: string[];
  shortcut?: string;
  /** Preview text shown when command is highlighted */
  preview?: string;
  /** Function that executes the command. Returns a promise for async ops. */
  execute: () => void | Promise<void>;
  /** Context hint: only show when pathname matches */
  contextMatch?: RegExp;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  shortcut?: string;
}

interface AiCommand {
  slash: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EntityResult {
  id: string;
  name: string;
  type: 'contact' | 'deal' | 'product';
  href: string;
  meta?: string;
}

type ResultItem =
  | { kind: 'recent'; cmd: CommandDef }
  | { kind: 'favorite'; cmd: CommandDef }
  | { kind: 'command'; cmd: CommandDef }
  | { kind: 'nav'; item: NavItem }
  | { kind: 'ai-cmd'; cmd: AiCommand }
  | { kind: 'entity'; entity: EntityResult }
  | { kind: 'ai-ask' };

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_META: Record<
  CommandCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  navigation: { label: 'Navigation', icon: Navigation },
  surface: { label: 'Surface Control', icon: Monitor },
  report: { label: 'Reports', icon: FileText },
  'saved-view': { label: 'Saved Views', icon: BookmarkPlus },
  workspace: { label: 'Workspaces', icon: Layers },
  agent: { label: 'Agents', icon: Bot },
  automation: { label: 'Automation', icon: Workflow },
  ai: { label: 'AI Commands', icon: Sparkles },
  'quick-action': { label: 'Quick Actions', icon: Zap }
};

const ALL_CATEGORIES: CommandCategory[] = [
  'navigation',
  'surface',
  'report',
  'saved-view',
  'workspace',
  'agent',
  'automation',
  'ai',
  'quick-action',
];

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'overview'], shortcut: 'G D' },
  { label: 'Contacts', href: '/dashboard/contacts', icon: Users, keywords: ['people', 'clients', 'leads'], shortcut: 'G C' },
  { label: 'Activities', href: '/dashboard/activities', icon: Activity, keywords: ['events', 'log'] },
  { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, keywords: ['todos', 'reminders'], shortcut: 'G T' },
  { label: 'Commerce', href: '/dashboard/commerce', icon: ShoppingBag, keywords: ['store', 'products', 'orders', 'shop'] },
  { label: 'CRM', href: '/dashboard/crm', icon: GitMerge, keywords: ['deals', 'pipeline', 'sales'] },
  { label: 'Coaching', href: '/dashboard/coaching', icon: GraduationCap, keywords: ['programs', 'lessons', 'courses'] },
  { label: 'SEO Traffic', href: '/dashboard/seo', icon: TrendingUp, keywords: ['seo', 'articles', 'blog', 'traffic'] },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles, keywords: ['ai', 'assistant', 'chat'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, keywords: ['profile', 'account', 'preferences'] },
  { label: 'Funding', href: '/dashboard/credit', icon: CreditCard, keywords: ['funding', 'credit', 'finance', 'loans'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, keywords: ['metrics', 'stats', 'report', 'data'] },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Activity, keywords: ['alerts', 'inbox'] },
  { label: 'Workflows', href: '/dashboard/workflows', icon: Workflow, keywords: ['automations', 'flows'] },
];

const AI_COMMANDS: AiCommand[] = [
  { slash: '/create-contact', label: 'Create Contact', description: 'Add a new contact record via AI', icon: UserPlus },
  { slash: '/create-store', label: 'Create Store', description: 'Set up a new commerce store', icon: ShoppingBag },
  { slash: '/pull-credit', label: 'Pull Credit', description: 'Initiate a credit pull for a client', icon: CreditCard },
  { slash: '/generate-article', label: 'Generate Article', description: 'AI-write an SEO article', icon: FileText },
  { slash: '/create-deal', label: 'Create Deal', description: 'Start a new CRM deal', icon: GitMerge },
  { slash: '/run-report', label: 'Run Report', description: 'Generate a business analytics report', icon: BarChart3 },
  { slash: '/create-task', label: 'Create Task', description: 'Add a task with AI details', icon: CheckSquare },
];

/* ------------------------------------------------------------------ */
/*  localStorage keys                                                  */
/* ------------------------------------------------------------------ */

const RECENT_KEY = 'memelli_recent_commands';
const HISTORY_KEY = 'memelli_command_history';
const FAVORITES_KEY = 'memelli_command_favorites';
const MAX_RECENT = 5;
const MAX_HISTORY = 50;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

/** Scored fuzzy match -- higher = better match */
function fuzzyScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  let score = 0;
  let prevMatch = -2;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) {
      score += 1;
      // Consecutive match bonus
      if (i === prevMatch + 1) score += 2;
      // Start of word bonus
      if (i === 0 || lower[i - 1] === ' ' || lower[i - 1] === '-' || lower[i - 1] === '_') score += 3;
      prevMatch = i;
      qi++;
    }
  }
  if (qi < q.length) return -1; // no full match
  // Bonus for shorter texts (closer match)
  score += Math.max(0, 20 - lower.length);
  // Exact prefix bonus
  if (lower.startsWith(q)) score += 10;
  return score;
}

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

function pushRecent(id: string) {
  const list = loadRecent().filter((x) => x !== id);
  list.unshift(id);
  saveRecent(list);
}

function loadHistory(): Array<{ id: string; label: string; ts: number }> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushHistory(id: string, label: string) {
  if (typeof window === 'undefined') return;
  const list = loadHistory().filter((x) => x.id !== id);
  list.unshift({ id, label, ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function toggleFavorite(id: string): boolean {
  const favs = loadFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    saveFavorites(favs);
    return false;
  } else {
    favs.unshift(id);
    saveFavorites(favs);
    return true;
  }
}

/** Helper to get auth token */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

/** Make an authenticated API call */
async function apiCall(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const token = getToken();
  try {
    const res = await fetch(`${API}${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {})
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Request failed');
      return { ok: false, error: text };
    }
    const json = await res.json().catch(() => ({}));
    return { ok: true, data: json.data ?? json };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommandPalette() {
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [setCommandPaletteOpen]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [entityResults, setEntityResults] = useState<EntityResult[]>([]);
  const [isSearchingEntities, setIsSearchingEntities] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommandCategory | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const entityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Workspace store
  const wsStore = useWorkspaceStore();

  // Load favorites on mount
  useEffect(() => {
    setFavorites(loadFavorites());
  }, [commandPaletteOpen]);

  // ---------- Build all commands ----------------------------------

  const allCommands: CommandDef[] = useMemo(() => {
    const cmds: CommandDef[] = [];

    // -- Navigation commands --
    cmds.push(
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Navigate to the main dashboard',
        icon: LayoutDashboard,
        category: 'navigation',
        keywords: ['home', 'overview', 'go', 'open', 'show'],
        shortcut: 'G D',
        preview: 'Navigate to /dashboard',
        execute: () => { router.push('/dashboard'); closeCommandPalette(); }
      },
      {
        id: 'nav-crm',
        label: 'Open CRM',
        description: 'Go to the CRM pipeline',
        icon: GitMerge,
        category: 'navigation',
        keywords: ['crm', 'deals', 'pipeline', 'sales', 'go', 'open'],
        preview: 'Navigate to /dashboard/crm',
        execute: () => { router.push('/dashboard/crm'); closeCommandPalette(); }
      },
      {
        id: 'nav-contacts',
        label: 'Go to Contacts',
        description: 'View all contacts',
        icon: Users,
        category: 'navigation',
        keywords: ['contacts', 'people', 'clients', 'leads', 'go'],
        shortcut: 'G C',
        preview: 'Navigate to /dashboard/contacts',
        execute: () => { router.push('/dashboard/contacts'); closeCommandPalette(); }
      },
      {
        id: 'nav-funding',
        label: 'Go to Funding',
        description: 'View credit and funding reports',
        icon: CreditCard,
        category: 'navigation',
        keywords: ['funding', 'credit', 'finance', 'loans', 'go'],
        preview: 'Navigate to /dashboard/credit',
        execute: () => { router.push('/dashboard/credit'); closeCommandPalette(); }
      },
      {
        id: 'nav-commerce',
        label: 'Go to Commerce',
        description: 'Manage stores, products, and orders',
        icon: ShoppingBag,
        category: 'navigation',
        keywords: ['commerce', 'store', 'products', 'orders', 'shop', 'go'],
        preview: 'Navigate to /dashboard/commerce',
        execute: () => { router.push('/dashboard/commerce'); closeCommandPalette(); }
      },
      {
        id: 'nav-coaching',
        label: 'Go to Coaching',
        description: 'Programs, lessons, and enrollments',
        icon: GraduationCap,
        category: 'navigation',
        keywords: ['coaching', 'programs', 'lessons', 'courses', 'go'],
        preview: 'Navigate to /dashboard/coaching',
        execute: () => { router.push('/dashboard/coaching'); closeCommandPalette(); }
      },
      {
        id: 'nav-seo',
        label: 'Go to SEO Traffic',
        description: 'SEO articles and keyword clusters',
        icon: TrendingUp,
        category: 'navigation',
        keywords: ['seo', 'traffic', 'articles', 'blog', 'go'],
        preview: 'Navigate to /dashboard/seo',
        execute: () => { router.push('/dashboard/seo'); closeCommandPalette(); }
      },
      {
        id: 'nav-analytics',
        label: 'Show Analytics',
        description: 'Business performance overview',
        icon: BarChart3,
        category: 'navigation',
        keywords: ['analytics', 'metrics', 'stats', 'report', 'data', 'show'],
        preview: 'Navigate to /dashboard/analytics',
        execute: () => { router.push('/dashboard/analytics'); closeCommandPalette(); }
      },
      {
        id: 'nav-tasks',
        label: 'Go to Tasks',
        description: 'View and manage tasks',
        icon: CheckSquare,
        category: 'navigation',
        keywords: ['tasks', 'todos', 'reminders', 'go'],
        shortcut: 'G T',
        preview: 'Navigate to /dashboard/tasks',
        execute: () => { router.push('/dashboard/tasks'); closeCommandPalette(); }
      },
      {
        id: 'nav-ai',
        label: 'Open AI Assistant',
        description: 'Chat with Memelli AI',
        icon: Sparkles,
        category: 'navigation',
        keywords: ['ai', 'assistant', 'chat', 'meli', 'go', 'open'],
        preview: 'Navigate to /dashboard/ai',
        execute: () => { router.push('/dashboard/ai'); closeCommandPalette(); }
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        description: 'Account and preferences',
        icon: Settings,
        category: 'navigation',
        keywords: ['settings', 'profile', 'account', 'preferences', 'go'],
        preview: 'Navigate to /dashboard/settings',
        execute: () => { router.push('/dashboard/settings'); closeCommandPalette(); }
      },
      {
        id: 'nav-workflows',
        label: 'Go to Workflows',
        description: 'Automation workflows',
        icon: Workflow,
        category: 'navigation',
        keywords: ['workflows', 'automations', 'flows', 'go'],
        preview: 'Navigate to /dashboard/workflows',
        execute: () => { router.push('/dashboard/workflows'); closeCommandPalette(); }
      },
      {
        id: 'nav-notifications',
        label: 'Go to Notifications',
        description: 'View alerts and notifications',
        icon: Activity,
        category: 'navigation',
        keywords: ['notifications', 'alerts', 'inbox', 'go'],
        preview: 'Navigate to /dashboard/notifications',
        execute: () => { router.push('/dashboard/notifications'); closeCommandPalette(); }
      },
      {
        id: 'nav-activities',
        label: 'Go to Activities',
        description: 'Activity log and events',
        icon: Activity,
        category: 'navigation',
        keywords: ['activities', 'events', 'log', 'go'],
        preview: 'Navigate to /dashboard/activities',
        execute: () => { router.push('/dashboard/activities'); closeCommandPalette(); }
      },
    );

    // -- Surface control commands --
    cmds.push(
      {
        id: 'surface-split',
        label: 'Split Screen',
        description: 'Split the workspace into two panels',
        icon: Columns,
        category: 'surface',
        keywords: ['split', 'screen', 'dual', 'panels', 'side by side'],
        preview: 'Set layout mode to split with horizontal panels',
        execute: () => {
          wsStore.setLayoutMode('split');
          wsStore.setSplitConfig({ direction: 'horizontal', sizes: [50, 50] });
          toast.success('Split screen enabled');
          closeCommandPalette();
        }
      },
      {
        id: 'surface-split-vertical',
        label: 'Split Screen Vertical',
        description: 'Split the workspace vertically',
        icon: Columns,
        category: 'surface',
        keywords: ['split', 'vertical', 'stack', 'top bottom'],
        preview: 'Set layout mode to split with vertical panels',
        execute: () => {
          wsStore.setLayoutMode('split');
          wsStore.setSplitConfig({ direction: 'vertical', sizes: [50, 50] });
          toast.success('Vertical split enabled');
          closeCommandPalette();
        }
      },
      {
        id: 'surface-floating',
        label: 'Open Floating Panel',
        description: 'Open current view as a floating panel',
        icon: PanelRight,
        category: 'surface',
        keywords: ['float', 'floating', 'panel', 'popup', 'detach'],
        preview: 'Open the active content in a floating panel overlay',
        execute: () => {
          const activeTab = wsStore.getActiveTab();
          if (activeTab) {
            wsStore.updateTabState(activeTab.id, { surfaceType: 'floating' });
            toast.success('Floating panel opened');
          } else {
            toast.error('No active tab to float');
          }
          closeCommandPalette();
        }
      },
      {
        id: 'surface-focus',
        label: 'Focus Mode',
        description: 'Full-screen focus on the active tab',
        icon: Maximize,
        category: 'surface',
        keywords: ['focus', 'fullscreen', 'maximize', 'zen', 'distraction free'],
        preview: 'Switch to focus mode -- hide sidebars and other panels',
        execute: () => {
          wsStore.setLayoutMode('focus');
          toast.success('Focus mode enabled');
          closeCommandPalette();
        }
      },
      {
        id: 'surface-single',
        label: 'Single Panel Mode',
        description: 'Return to single panel layout',
        icon: Monitor,
        category: 'surface',
        keywords: ['single', 'normal', 'default', 'one panel', 'exit split'],
        preview: 'Switch back to single-panel layout',
        execute: () => {
          wsStore.setLayoutMode('single');
          toast.success('Single panel mode');
          closeCommandPalette();
        }
      },
      {
        id: 'surface-grid',
        label: 'Grid Layout',
        description: 'Arrange tabs in a grid',
        icon: LayoutDashboard,
        category: 'surface',
        keywords: ['grid', 'tiles', 'mosaic', 'multi'],
        preview: 'Switch to grid layout for multiple tabs',
        execute: () => {
          wsStore.setLayoutMode('grid');
          toast.success('Grid layout enabled');
          closeCommandPalette();
        }
      },
      {
        id: 'surface-close-all',
        label: 'Close All Surfaces',
        description: 'Close all open tabs (unpinned)',
        icon: XCircle,
        category: 'surface',
        keywords: ['close', 'all', 'surfaces', 'tabs', 'clear'],
        preview: 'Close all unpinned tabs in the active workspace',
        execute: () => {
          const ws = wsStore.getActiveWorkspace();
          const unpinned = ws.tabs.filter((t) => !t.pinned);
          unpinned.forEach((t) => wsStore.closeTab(t.id));
          toast.success(`Closed ${unpinned.length} tab(s)`);
          closeCommandPalette();
        }
      },
      {
        id: 'surface-close-current',
        label: 'Close Current Tab',
        description: 'Close the active tab',
        icon: X,
        category: 'surface',
        keywords: ['close', 'tab', 'current', 'active'],
        shortcut: 'Ctrl+W',
        preview: 'Close the currently active tab',
        execute: () => {
          const activeTab = wsStore.getActiveTab();
          if (activeTab) {
            wsStore.closeTab(activeTab.id);
            toast.success(`Closed "${activeTab.title}"`);
          }
          closeCommandPalette();
        }
      },
    );

    // -- Report commands --
    cmds.push(
      {
        id: 'report-funding',
        label: 'Generate Funding Report',
        description: 'Create a comprehensive funding report',
        icon: FileText,
        category: 'report',
        keywords: ['generate', 'funding', 'report', 'credit', 'finance'],
        preview: 'Generate a full funding eligibility report via the action engine',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Generating funding report...', { id: 'report-funding' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'generate funding report' }
          });
          if (res.ok) {
            toast.success('Funding report generation started', { id: 'report-funding' });
          } else {
            toast.error(res.error || 'Failed to generate report', { id: 'report-funding' });
          }
        }
      },
      {
        id: 'report-credit-refresh',
        label: 'Refresh Credit Report',
        description: 'Pull the latest credit report data',
        icon: RefreshCw,
        category: 'report',
        keywords: ['refresh', 'credit', 'report', 'pull', 'update'],
        preview: 'Dispatch a credit report refresh task to the agent pool',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Refreshing credit report...', { id: 'report-credit' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'refresh credit report' }
          });
          if (res.ok) {
            toast.success('Credit report refresh started', { id: 'report-credit' });
          } else {
            toast.error(res.error || 'Failed to refresh', { id: 'report-credit' });
          }
        }
      },
      {
        id: 'report-compare',
        label: 'Compare Reports',
        description: 'Side-by-side comparison of two reports',
        icon: GitCompare,
        category: 'report',
        keywords: ['compare', 'reports', 'diff', 'side by side', 'versus'],
        preview: 'Open report comparison view in split mode',
        execute: () => {
          wsStore.setLayoutMode('split');
          wsStore.setSplitConfig({ direction: 'horizontal', sizes: [50, 50] });
          router.push('/dashboard/credit');
          toast.success('Report comparison mode enabled');
          closeCommandPalette();
        }
      },
      {
        id: 'report-sales',
        label: 'Generate Sales Report',
        description: 'Create a sales performance summary',
        icon: BarChart3,
        category: 'report',
        keywords: ['generate', 'sales', 'report', 'revenue', 'performance'],
        preview: 'Generate a sales summary report via the action engine',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Generating sales report...', { id: 'report-sales' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'generate sales report' }
          });
          if (res.ok) {
            toast.success('Sales report generation started', { id: 'report-sales' });
          } else {
            toast.error(res.error || 'Failed to generate report', { id: 'report-sales' });
          }
        }
      },
      {
        id: 'report-analytics',
        label: 'Run Analytics Report',
        description: 'Full business analytics summary',
        icon: BarChart3,
        category: 'report',
        keywords: ['run', 'analytics', 'report', 'business', 'overview'],
        preview: 'Generate a comprehensive analytics report',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Running analytics...', { id: 'report-analytics' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'generate analytics report' }
          });
          if (res.ok) {
            toast.success('Analytics report started', { id: 'report-analytics' });
          } else {
            toast.error(res.error || 'Failed', { id: 'report-analytics' });
          }
        }
      },
    );

    // -- Saved view commands --
    cmds.push(
      {
        id: 'view-save-current',
        label: 'Save Current View',
        description: 'Save the current layout as a named view',
        icon: Save,
        category: 'saved-view',
        keywords: ['save', 'view', 'current', 'layout', 'bookmark'],
        shortcut: 'Ctrl+S',
        preview: 'Save the current workspace layout and tab arrangement',
        execute: async () => {
          closeCommandPalette();
          const ws = wsStore.getActiveWorkspace();
          toast.loading('Saving view...', { id: 'save-view' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: `save workspace view "${ws.name}"` }
          });
          if (res.ok) {
            toast.success(`View "${ws.name}" saved`, { id: 'save-view' });
          } else {
            toast.error('Could not save view', { id: 'save-view' });
          }
        }
      },
      {
        id: 'view-load',
        label: 'Load My Views',
        description: 'Browse and load saved workspace views',
        icon: FolderOpen,
        category: 'saved-view',
        keywords: ['load', 'views', 'saved', 'browse', 'my views'],
        preview: 'Open the saved views browser',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Loading saved views...', { id: 'load-views' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'load saved views' }
          });
          if (res.ok) {
            toast.success('Views loaded', { id: 'load-views' });
          } else {
            toast.error('Could not load views', { id: 'load-views' });
          }
        }
      },
      {
        id: 'view-funding-overview',
        label: 'Apply Funding Overview View',
        description: 'Load the funding overview layout preset',
        icon: Eye,
        category: 'saved-view',
        keywords: ['apply', 'funding', 'overview', 'view', 'preset'],
        contextMatch: /credit|funding/,
        preview: 'Apply the funding overview preset with credit and analytics panels',
        execute: () => {
          wsStore.setLayoutMode('split');
          wsStore.setSplitConfig({ direction: 'horizontal', sizes: [60, 40] });
          router.push('/dashboard/credit');
          toast.success('Funding overview view applied');
          closeCommandPalette();
        }
      },
      {
        id: 'view-crm-pipeline',
        label: 'Apply CRM Pipeline View',
        description: 'Load the CRM pipeline layout preset',
        icon: GitMerge,
        category: 'saved-view',
        keywords: ['apply', 'crm', 'pipeline', 'view', 'preset', 'deals'],
        contextMatch: /crm|deals/,
        preview: 'Apply the CRM pipeline view layout',
        execute: () => {
          router.push('/dashboard/crm');
          wsStore.setLayoutMode('single');
          toast.success('CRM pipeline view applied');
          closeCommandPalette();
        }
      },
    );

    // -- Workspace commands --
    cmds.push(
      {
        id: 'ws-create',
        label: 'Create Workspace',
        description: 'Create a new workspace',
        icon: Plus,
        category: 'workspace',
        keywords: ['create', 'new', 'workspace', 'add'],
        preview: 'Create a new empty workspace and switch to it',
        execute: () => {
          const id = wsStore.createWorkspace('New Workspace');
          toast.success('Workspace created');
          closeCommandPalette();
        }
      },
      {
        id: 'ws-switch-funding',
        label: 'Switch to Funding Workspace',
        description: 'Open the funding workspace',
        icon: Layers,
        category: 'workspace',
        keywords: ['switch', 'funding', 'workspace', 'change'],
        preview: 'Switch to the funding workspace (or create it)',
        execute: () => {
          const ws = wsStore.workspaces.find((w) =>
            w.name.toLowerCase().includes('funding'),
          );
          if (ws) {
            wsStore.switchWorkspace(ws.id);
            toast.success(`Switched to "${ws.name}"`);
          } else {
            wsStore.createWorkspace('Funding');
            router.push('/dashboard/credit');
            toast.success('Created and switched to Funding workspace');
          }
          closeCommandPalette();
        }
      },
      {
        id: 'ws-switch-operations',
        label: 'Switch to Operations Workspace',
        description: 'Open the default operations workspace',
        icon: Layers,
        category: 'workspace',
        keywords: ['switch', 'operations', 'workspace', 'default', 'main'],
        preview: 'Switch to the default Operations workspace',
        execute: () => {
          wsStore.switchWorkspace('default');
          toast.success('Switched to Operations');
          closeCommandPalette();
        }
      },
      {
        id: 'ws-pin-report',
        label: 'Pin This Report',
        description: 'Pin the active tab/report to the workspace',
        icon: Pin,
        category: 'workspace',
        keywords: ['pin', 'report', 'tab', 'keep', 'lock'],
        preview: 'Pin the active tab so it stays open',
        execute: () => {
          const tab = wsStore.getActiveTab();
          if (tab) {
            wsStore.pinTab(tab.id);
            toast.success(`Pinned "${tab.title}"`);
          } else {
            toast.error('No active tab to pin');
          }
          closeCommandPalette();
        }
      },
      {
        id: 'ws-unpin',
        label: 'Unpin Current Tab',
        description: 'Unpin the active tab',
        icon: Pin,
        category: 'workspace',
        keywords: ['unpin', 'tab', 'unlock', 'release'],
        preview: 'Remove the pin from the active tab',
        execute: () => {
          const tab = wsStore.getActiveTab();
          if (tab) {
            wsStore.unpinTab(tab.id);
            toast.success(`Unpinned "${tab.title}"`);
          }
          closeCommandPalette();
        }
      },
      {
        id: 'ws-dock-tab',
        label: 'Add to Dock',
        description: 'Add the active tab to the dock bar',
        icon: BookmarkPlus,
        category: 'workspace',
        keywords: ['dock', 'add', 'bookmark', 'quick access'],
        preview: 'Add the active tab to the dock for quick access',
        execute: () => {
          const tab = wsStore.getActiveTab();
          if (tab) {
            wsStore.addToDock(tab.id);
            toast.success(`Added "${tab.title}" to dock`);
          } else {
            toast.error('No active tab');
          }
          closeCommandPalette();
        }
      },
    );

    // -- Agent commands --
    cmds.push(
      {
        id: 'agent-health',
        label: 'Show Agent Health',
        description: 'View agent pool health and status',
        icon: HeartPulse,
        category: 'agent',
        keywords: ['show', 'agent', 'health', 'status', 'pools', 'monitor'],
        preview: 'Fetch and display agent pool health metrics',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Checking agent health...', { id: 'agent-health' });
          const res = await apiCall('/api/admin/command-center/health');
          if (res.ok) {
            toast.success('Agent pools healthy', { id: 'agent-health' });
            router.push('/dashboard/ai');
          } else {
            toast.error('Agent health check failed', { id: 'agent-health' });
          }
        }
      },
      {
        id: 'agent-restart-funding',
        label: 'Restart Funding Agents',
        description: 'Restart all agents in the funding pool',
        icon: RotateCcw,
        category: 'agent',
        keywords: ['restart', 'funding', 'agents', 'pool', 'reset'],
        preview: 'Restart the funding agent pool via command center',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Restarting funding agents...', { id: 'agent-restart' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'restart funding agents', priority: 'high' }
          });
          if (res.ok) {
            toast.success('Funding agents restarting', { id: 'agent-restart' });
          } else {
            toast.error('Failed to restart agents', { id: 'agent-restart' });
          }
        }
      },
      {
        id: 'agent-pause-scraping',
        label: 'Pause Scraping',
        description: 'Pause all scraping/crawl agents',
        icon: Pause,
        category: 'agent',
        keywords: ['pause', 'scraping', 'crawl', 'stop', 'halt'],
        preview: 'Pause all scraping and crawl agents',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Pausing scraping agents...', { id: 'agent-pause' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'pause scraping agents' }
          });
          if (res.ok) {
            toast.success('Scraping paused', { id: 'agent-pause' });
          } else {
            toast.error('Failed to pause', { id: 'agent-pause' });
          }
        }
      },
      {
        id: 'agent-resume-scraping',
        label: 'Resume Scraping',
        description: 'Resume paused scraping agents',
        icon: Play,
        category: 'agent',
        keywords: ['resume', 'scraping', 'crawl', 'start', 'unpause'],
        preview: 'Resume all paused scraping agents',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Resuming scraping agents...', { id: 'agent-resume' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'resume scraping agents' }
          });
          if (res.ok) {
            toast.success('Scraping resumed', { id: 'agent-resume' });
          } else {
            toast.error('Failed to resume', { id: 'agent-resume' });
          }
        }
      },
      {
        id: 'agent-show-work-orders',
        label: 'Show Active Work Orders',
        description: 'List all active work orders',
        icon: List,
        category: 'agent',
        keywords: ['show', 'work', 'orders', 'active', 'tasks', 'queue'],
        preview: 'Display active work orders from the command center',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Fetching work orders...', { id: 'work-orders' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'show active work orders' }
          });
          if (res.ok) {
            toast.success('Work orders loaded', { id: 'work-orders' });
            router.push('/dashboard/workflows');
          } else {
            toast.error('Failed to load work orders', { id: 'work-orders' });
          }
        }
      },
    );

    // -- Automation commands --
    cmds.push(
      {
        id: 'auto-lead-enrichment',
        label: 'Start Lead Enrichment Workflow',
        description: 'Run the lead enrichment automation',
        icon: Workflow,
        category: 'automation',
        keywords: ['start', 'lead', 'enrichment', 'workflow', 'automation', 'enrich'],
        preview: 'Start the lead enrichment workflow via the automation queue',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Starting lead enrichment...', { id: 'auto-enrich' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'start lead enrichment workflow' }
          });
          if (res.ok) {
            toast.success('Lead enrichment started', { id: 'auto-enrich' });
          } else {
            toast.error('Failed to start workflow', { id: 'auto-enrich' });
          }
        }
      },
      {
        id: 'auto-show-workflows',
        label: 'Show Active Workflows',
        description: 'View all running automation workflows',
        icon: List,
        category: 'automation',
        keywords: ['show', 'active', 'workflows', 'running', 'automations'],
        preview: 'Navigate to workflows and show active automations',
        execute: () => {
          router.push('/dashboard/workflows');
          toast.success('Showing active workflows');
          closeCommandPalette();
        }
      },
      {
        id: 'auto-content-generation',
        label: 'Start Content Generation',
        description: 'Run AI content generation workflow',
        icon: FileText,
        category: 'automation',
        keywords: ['start', 'content', 'generation', 'ai', 'write', 'article'],
        preview: 'Start automated content generation via AI agents',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Starting content generation...', { id: 'auto-content' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'start content generation workflow' }
          });
          if (res.ok) {
            toast.success('Content generation started', { id: 'auto-content' });
          } else {
            toast.error('Failed to start', { id: 'auto-content' });
          }
        }
      },
      {
        id: 'auto-indexing',
        label: 'Run SEO Indexing',
        description: 'Submit pages for search engine indexing',
        icon: TrendingUp,
        category: 'automation',
        keywords: ['run', 'seo', 'indexing', 'indexnow', 'submit', 'search'],
        preview: 'Trigger SEO indexing for published content',
        execute: async () => {
          closeCommandPalette();
          toast.loading('Running SEO indexing...', { id: 'auto-index' });
          const res = await apiCall('/api/admin/command-center/dispatch', {
            method: 'POST',
            body: { task: 'run seo indexing' }
          });
          if (res.ok) {
            toast.success('SEO indexing started', { id: 'auto-index' });
          } else {
            toast.error('Failed to start indexing', { id: 'auto-index' });
          }
        }
      },
    );

    // -- Quick action commands --
    cmds.push(
      {
        id: 'qa-create-contact',
        label: 'Create Contact',
        description: 'Add a new contact record',
        icon: UserPlus,
        category: 'quick-action',
        keywords: ['create', 'contact', 'add', 'new', 'person'],
        shortcut: 'N C',
        preview: 'Open the create contact form',
        execute: () => { router.push('/dashboard/contacts?action=create'); closeCommandPalette(); }
      },
      {
        id: 'qa-create-deal',
        label: 'Create Deal',
        description: 'Start a new CRM deal',
        icon: GitMerge,
        category: 'quick-action',
        keywords: ['create', 'deal', 'pipeline', 'sales', 'new'],
        shortcut: 'N D',
        preview: 'Open the create deal form',
        execute: () => { router.push('/dashboard/crm?action=create'); closeCommandPalette(); }
      },
      {
        id: 'qa-create-task',
        label: 'Create Task',
        description: 'Add a new task',
        icon: CheckSquare,
        category: 'quick-action',
        keywords: ['create', 'task', 'todo', 'reminder', 'new'],
        shortcut: 'N T',
        preview: 'Open the create task form',
        execute: () => { router.push('/dashboard/tasks?action=create'); closeCommandPalette(); }
      },
    );

    return cmds;
  }, [router, closeCommandPalette, wsStore, pathname]);

  // Command map for quick lookups
  const commandMap = useMemo(() => {
    const m = new Map<string, CommandDef>();
    allCommands.forEach((c) => m.set(c.id, c));
    return m;
  }, [allCommands]);

  // ---- Keyboard shortcut (Cmd+K) --------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, closeCommandPalette, openCommandPalette]);

  // ---- Focus input on open ---------------------------------------
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setEntityResults([]);
      setActiveCategory(null);
    }
  }, [commandPaletteOpen]);

  // ---- Entity search (debounced) ---------------------------------
  useEffect(() => {
    if (entityDebounce.current) clearTimeout(entityDebounce.current);
    if (!query || query.startsWith('/') || query.length < 2) {
      setEntityResults([]);
      return;
    }
    entityDebounce.current = setTimeout(async () => {
      setIsSearchingEntities(true);
      try {
        const token = getToken();
        const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}&limit=5`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          const searchData = json.data ?? json;
          const flat: EntityResult[] = [];
          for (const c of searchData.contacts ?? []) {
            flat.push({
              id: c.id,
              name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email || 'Contact',
              type: 'contact',
              href: `/dashboard/contacts/${c.id}`,
              meta: c.email ?? c.companyName
            });
          }
          for (const d of searchData.deals ?? []) {
            flat.push({
              id: d.id,
              name: d.title,
              type: 'deal',
              href: `/dashboard/crm/deals/${d.id}`,
              meta: d.value != null ? `$${d.value.toLocaleString()}` : undefined
            });
          }
          for (const a of searchData.articles ?? []) {
            flat.push({
              id: a.id,
              name: a.title,
              type: 'product' as EntityResult['type'],
              href: `/dashboard/seo/articles/${a.id}`,
              meta: a.keyword
            });
          }
          setEntityResults(flat.slice(0, 5));
        }
      } catch {
        // ignore search errors
      } finally {
        setIsSearchingEntities(false);
      }
    }, 300);
  }, [query]);

  // ---- Build results list ----------------------------------------

  const isSlashQuery = query.startsWith('/');
  const lowerQuery = query.toLowerCase();

  // Filter & score commands
  const scoredCommands = useMemo(() => {
    if (isSlashQuery) return [];

    let pool = allCommands;
    // Filter by active category
    if (activeCategory) {
      pool = pool.filter((c) => c.category === activeCategory);
    }

    if (!query) {
      // No query: show context-aware suggestions + top commands
      const contextCmds = pool.filter(
        (c) => c.contextMatch && c.contextMatch.test(pathname),
      );
      const topCmds = pool
        .filter((c) => !c.contextMatch || !c.contextMatch.test(pathname))
        .slice(0, 8);
      return [...contextCmds, ...topCmds].slice(0, 10);
    }

    const scored = pool
      .map((c) => {
        // Match against label, description, and keywords
        const labelScore = fuzzyScore(c.label, query);
        const descScore = fuzzyScore(c.description, query);
        const keywordScores = c.keywords.map((k) => fuzzyScore(k, query));
        const best = Math.max(labelScore, descScore, ...keywordScores);
        return { cmd: c, score: best };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return scored.map((x) => x.cmd);
  }, [allCommands, query, isSlashQuery, activeCategory, pathname]);

  // AI slash commands
  const filteredAiCommands = isSlashQuery
    ? AI_COMMANDS.filter(
        (cmd) =>
          cmd.slash.includes(lowerQuery) ||
          fuzzyMatch(cmd.label, query.slice(1)),
      )
    : query
      ? AI_COMMANDS.filter((cmd) => fuzzyMatch(cmd.label, query))
      : [];

  // Entity results stay as-is from the search effect

  // Favorites
  const favoriteCmds = useMemo(() => {
    if (query || activeCategory) return [];
    return favorites
      .map((id) => commandMap.get(id))
      .filter(Boolean) as CommandDef[];
  }, [favorites, commandMap, query, activeCategory]);

  // Recent
  const recentIds = loadRecent();
  const recentCmds = useMemo(() => {
    if (query || activeCategory) return [];
    return recentIds
      .map((id) => commandMap.get(id))
      .filter(Boolean) as CommandDef[];
  }, [recentIds, commandMap, query, activeCategory]);

  // ---- Assemble flat result list --------------------------------

  const results: ResultItem[] = useMemo(() => {
    const r: ResultItem[] = [];
    // Favorites first
    favoriteCmds.forEach((cmd) => r.push({ kind: 'favorite', cmd }));
    // Recent next (skip those already in favorites)
    const favSet = new Set(favorites);
    recentCmds
      .filter((c) => !favSet.has(c.id))
      .forEach((cmd) => r.push({ kind: 'recent', cmd }));
    // Commands
    const shownIds = new Set([...favorites, ...recentIds]);
    scoredCommands
      .filter((c) => query || !shownIds.has(c.id)) // when no query, skip already-shown
      .forEach((cmd) => r.push({ kind: 'command', cmd }));
    // AI slash commands
    filteredAiCommands.forEach((cmd) => r.push({ kind: 'ai-cmd', cmd }));
    // Entity search
    entityResults.forEach((entity) => r.push({ kind: 'entity', entity }));
    // AI ask CTA
    if (query.trim() && !isQuerying) r.push({ kind: 'ai-ask' });
    return r;
  }, [
    favoriteCmds,
    recentCmds,
    scoredCommands,
    filteredAiCommands,
    entityResults,
    query,
    isQuerying,
    favorites,
    recentIds,
  ]);

  // ---- Reset selection when results change -----------------------
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, entityResults.length, activeCategory]);

  // ---- Scroll selected into view ---------------------------------
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // ---- Execute ---------------------------------------------------

  const executeResult = useCallback(
    async (result: ResultItem) => {
      switch (result.kind) {
        case 'command':
        case 'recent':
        case 'favorite': {
          const cmd = result.cmd;
          pushRecent(cmd.id);
          pushHistory(cmd.id, cmd.label);
          setIsExecuting(true);
          try {
            await cmd.execute();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Command failed');
          } finally {
            setIsExecuting(false);
          }
          break;
        }
        case 'nav':
          router.push(result.item.href);
          closeCommandPalette();
          break;
        case 'ai-cmd':
          router.push('/dashboard/ai');
          closeCommandPalette();
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ai_pending_prompt', result.cmd.slash);
          }
          break;
        case 'entity':
          router.push(result.entity.href);
          closeCommandPalette();
          break;
        case 'ai-ask':
          handleAiQuery();
          break;
      }
    },
    [router, closeCommandPalette, query],
  );

  const handleAiQuery = async () => {
    if (!query.trim() || isQuerying) return;
    setIsQuerying(true);
    try {
      router.push('/dashboard/ai');
      closeCommandPalette();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ai_pending_prompt', query);
      }
    } finally {
      setIsQuerying(false);
    }
  };

  // ---- Favorite toggle ------------------------------------------

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      const nowFav = toggleFavorite(id);
      setFavorites(loadFavorites());
      toast.success(nowFav ? 'Added to favorites' : 'Removed from favorites');
    },
    [],
  );

  // ---- Key navigation --------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        executeResult(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle through category filters
      const currentIdx = activeCategory
        ? ALL_CATEGORIES.indexOf(activeCategory)
        : -1;
      const nextIdx = (currentIdx + 1) % (ALL_CATEGORIES.length + 1);
      setActiveCategory(
        nextIdx === ALL_CATEGORIES.length ? null : ALL_CATEGORIES[nextIdx],
      );
    }
  };

  // ---- Get preview for selected item ----------------------------
  const selectedPreview = useMemo(() => {
    const sel = results[selectedIndex];
    if (!sel) return null;
    switch (sel.kind) {
      case 'command':
      case 'recent':
      case 'favorite':
        return sel.cmd.preview || sel.cmd.description;
      case 'nav':
        return `Navigate to ${sel.item.href}`;
      case 'ai-cmd':
        return sel.cmd.description;
      case 'entity':
        return `Open ${sel.entity.type}: ${sel.entity.name}`;
      case 'ai-ask':
        return `Send "${query}" to AI assistant`;
    }
  }, [results, selectedIndex, query]);

  // ---- Render helpers --------------------------------------------
  const entityIcons: Record<string, typeof Users> = {
    contact: Users,
    deal: GitMerge,
    product: ShoppingBag
  };

  const isFav = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  function renderItem(result: ResultItem, idx: number) {
    const isSelected = selectedIndex === idx;
    const base =
      'w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl mx-1 transition-colors duration-150 cursor-pointer group';
    const cls = isSelected
      ? `${base} bg-red-500/[0.1] text-red-300`
      : `${base} text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200`;

    switch (result.kind) {
      case 'favorite':
      case 'recent':
      case 'command': {
        const c = result.cmd;
        const Icon = c.icon;
        const catMeta = CATEGORY_META[c.category];
        return (
          <button
            key={`${result.kind}-${c.id}`}
            data-idx={idx}
            onClick={() => executeResult(result)}
            className={cls}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
            <span className="flex-1 text-left min-w-0">
              <span className="block text-zinc-200 truncate">{c.label}</span>
              <span className="block text-xs text-zinc-500 truncate">{c.description}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] text-zinc-600 bg-white/[0.04] rounded-md px-1.5 py-0.5 shrink-0">
              {catMeta.label}
            </span>
            {c.shortcut && (
              <kbd className="text-[10px] text-zinc-500 border border-white/[0.08] rounded-md px-1.5 py-0.5 font-mono shrink-0 bg-white/[0.02]">
                {c.shortcut}
              </kbd>
            )}
            <button
              onClick={(e) => handleToggleFavorite(e, c.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
              title={isFav(c.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFav(c.id) ? (
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              ) : (
                <Star className="h-3.5 w-3.5 text-zinc-600 hover:text-amber-400" />
              )}
            </button>
            <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" />
          </button>
        );
      }

      case 'nav': {
        const item = result.item;
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            data-idx={idx}
            onClick={() => executeResult(result)}
            className={cls}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <kbd className="text-[10px] text-zinc-500 border border-white/[0.08] rounded-md px-1.5 py-0.5 font-mono bg-white/[0.02]">
                {item.shortcut}
              </kbd>
            )}
            <ArrowRight className="h-3.5 w-3.5 opacity-30" />
          </button>
        );
      }

      case 'ai-cmd': {
        const cmd = result.cmd;
        return (
          <button
            key={cmd.slash}
            data-idx={idx}
            onClick={() => executeResult(result)}
            className={cls}
          >
            <Terminal className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
            <span className="flex-1 text-left">
              <span className="block text-zinc-200">
                <code className="text-red-400 text-xs mr-1.5">{cmd.slash}</code>
                {cmd.label}
              </span>
              <span className="block text-xs text-zinc-500">{cmd.description}</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 opacity-30" />
          </button>
        );
      }

      case 'entity': {
        const e = result.entity;
        const Icon = entityIcons[e.type] ?? Hash;
        return (
          <button
            key={e.id}
            data-idx={idx}
            onClick={() => executeResult(result)}
            className={cls}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
            <span className="flex-1 text-left">
              <span className="block text-zinc-200">{e.name}</span>
              <span className="block text-xs text-zinc-500 capitalize">
                {e.type}{e.meta ? ` \u00B7 ${e.meta}` : ''}
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 opacity-30" />
          </button>
        );
      }

      case 'ai-ask':
        return (
          <button
            key="ai-ask"
            data-idx={idx}
            onClick={() => executeResult(result)}
            className={[
              'w-full flex items-center gap-3 px-4 py-3 mx-1 text-sm rounded-xl transition-colors duration-150',
              isSelected
                ? 'bg-red-500/[0.12]'
                : 'hover:bg-white/[0.04]',
              'border-t border-white/[0.04]',
            ].join(' ')}
          >
            <Sparkles className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-400' : 'text-red-500/70'}`} />
            <span className="flex-1 text-left text-red-300/90">
              Ask AI: &ldquo;{query}&rdquo;
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-red-400/50" />
          </button>
        );
    }
  }

  // ---- Section headers -------------------------------------------
  function sectionLabel(label: string, icon?: React.ComponentType<{ className?: string }>) {
    const Icon = icon;
    return (
      <p className="px-5 pt-3.5 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-zinc-600" />}
        {label}
      </p>
    );
  }

  // ---- Collect sections with indices -----------------------------
  let idx = 0;
  const sections: React.ReactNode[] = [];

  // Favorites
  const favResults = results.filter((r) => r.kind === 'favorite');
  if (favResults.length > 0) {
    sections.push(
      <div key="sec-favorites">
        {sectionLabel('Favorites', Star)}
        {results.slice(idx, idx + favResults.length).map((r, i) => renderItem(r, idx + i))}
      </div>,
    );
    idx += favResults.length;
  }

  // Recent
  const recentResults = results.filter((r) => r.kind === 'recent');
  if (recentResults.length > 0) {
    sections.push(
      <div key="sec-recent">
        {sectionLabel('Recent', Clock)}
        {results.slice(idx, idx + recentResults.length).map((r, i) => renderItem(r, idx + i))}
      </div>,
    );
    idx += recentResults.length;
  }

  // Commands (group by category when filtering by category, otherwise single section)
  const commandResults = results.filter((r) => r.kind === 'command');
  if (commandResults.length > 0) {
    if (activeCategory) {
      const meta = CATEGORY_META[activeCategory];
      sections.push(
        <div key={`sec-cat-${activeCategory}`}>
          {sectionLabel(meta.label, meta.icon)}
          {results.slice(idx, idx + commandResults.length).map((r, i) => renderItem(r, idx + i))}
        </div>,
      );
    } else {
      // Group commands by category
      const grouped = new Map<CommandCategory, { start: number; count: number }>();
      let offset = idx;
      for (const r of commandResults) {
        if (r.kind !== 'command') continue;
        const cat = r.cmd.category;
        const existing = grouped.get(cat);
        if (existing) {
          existing.count++;
        } else {
          grouped.set(cat, { start: offset, count: 1 });
        }
        offset++;
      }

      // Render each group
      let groupIdx = idx;
      for (const [cat, info] of grouped) {
        const meta = CATEGORY_META[cat];
        sections.push(
          <div key={`sec-cat-${cat}`}>
            {sectionLabel(meta.label, meta.icon)}
            {results.slice(groupIdx, groupIdx + info.count).map((r, i) => renderItem(r, groupIdx + i))}
          </div>,
        );
        groupIdx += info.count;
      }
    }
    idx += commandResults.length;
  }

  // AI Commands
  const aiCmdResults = results.filter((r) => r.kind === 'ai-cmd');
  if (aiCmdResults.length > 0) {
    sections.push(
      <div key="sec-ai-cmds">
        {sectionLabel('AI Commands', Terminal)}
        {results.slice(idx, idx + aiCmdResults.length).map((r, i) => renderItem(r, idx + i))}
      </div>,
    );
    idx += aiCmdResults.length;
  }

  // Entity search results
  const entityResultItems = results.filter((r) => r.kind === 'entity');
  if (entityResultItems.length > 0) {
    sections.push(
      <div key="sec-entities">
        {sectionLabel('Search Results', Search)}
        {results.slice(idx, idx + entityResultItems.length).map((r, i) => renderItem(r, idx + i))}
      </div>,
    );
    idx += entityResultItems.length;
  }

  // AI Ask CTA
  const aiAskItem = results.find((r) => r.kind === 'ai-ask');
  if (aiAskItem) {
    sections.push(
      <div key="sec-ai-ask">{renderItem(aiAskItem, idx)}</div>,
    );
    idx += 1;
  }

  // ---- Main render -----------------------------------------------
  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          key="command-palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[12vh]"
          onClick={closeCommandPalette}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-2xl mx-4 bg-zinc-950/90 backdrop-blur-3xl border border-white/[0.06] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
              <Search className="h-[18px] w-[18px] text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, navigate, or type / for AI..."
                className="flex-1 bg-transparent text-lg text-zinc-100 placeholder-zinc-600 focus:outline-none font-light tracking-[-0.01em]"
              />
              {(isQuerying || isSearchingEntities || isExecuting) ? (
                <LoadingGlobe size="sm" />
              ) : query ? (
                <button
                  onClick={() => {
                    setQuery('');
                    setEntityResults([]);
                  }}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0 border border-white/[0.08] rounded-md px-1.5 py-0.5 bg-white/[0.02]">
                  <Command className="h-3 w-3" />K
                </span>
              )}
            </div>

            {/* Category filter tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.04] overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={[
                  'px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors duration-150 whitespace-nowrap',
                  !activeCategory
                    ? 'bg-red-500/[0.12] text-red-300'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const CatIcon = meta.icon;
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setActiveCategory(activeCategory === cat ? null : cat)
                    }
                    className={[
                      'px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors duration-150 flex items-center gap-1 whitespace-nowrap',
                      activeCategory === cat
                        ? 'bg-red-500/[0.12] text-red-300'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    <CatIcon className="h-3 w-3" />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
              {sections.length > 0 ? (
                sections
              ) : query ? (
                <div className="px-4 py-10 text-center">
                  <Sparkles className="h-5 w-5 text-zinc-700 mx-auto mb-2.5" />
                  <p className="text-sm text-zinc-500 font-light">
                    {isSearchingEntities
                      ? 'Searching...'
                      : 'No results. Press Enter to ask AI.'}
                  </p>
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-zinc-500 font-light">
                    Type to search or use <code className="text-red-400/80 bg-red-500/[0.08] rounded px-1 py-0.5 text-xs">/</code> for AI commands
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    Press <kbd className="border border-white/[0.08] rounded-md px-1.5 py-0.5 text-[10px] bg-white/[0.02]">Tab</kbd> to cycle categories
                  </p>
                </div>
              )}
            </div>

            {/* Preview bar */}
            {selectedPreview && (
              <div className="px-5 py-2 border-t border-white/[0.04] bg-white/[0.01]">
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 truncate font-light">
                  <Eye className="h-3 w-3 shrink-0 text-zinc-600" />
                  {selectedPreview}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
              <span className="text-[10px] text-zinc-600">
                <kbd className="border border-white/[0.08] rounded-md px-1 py-0.5 mr-1 bg-white/[0.02]">&uarr;&darr;</kbd>navigate
              </span>
              <span className="text-[10px] text-zinc-600">
                <kbd className="border border-white/[0.08] rounded-md px-1 py-0.5 mr-1 bg-white/[0.02]">&crarr;</kbd>select
              </span>
              <span className="text-[10px] text-zinc-600">
                <kbd className="border border-white/[0.08] rounded-md px-1 py-0.5 mr-1 bg-white/[0.02]">tab</kbd>filter
              </span>
              <span className="text-[10px] text-zinc-600">
                <kbd className="border border-white/[0.08] rounded-md px-1 py-0.5 mr-1 bg-white/[0.02]">esc</kbd>close
              </span>
              <span className="ml-auto text-[10px] text-zinc-600">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {activeCategory && (
                  <span className="ml-1.5 text-red-400/60">
                    in {CATEGORY_META[activeCategory].label}
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
